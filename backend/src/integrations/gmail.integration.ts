/**
 * Gmail Integration
 *
 * Handles Gmail OAuth and email fetching using Gmail API
 *
 * Setup:
 * 1. Go to Google Cloud Console
 * 2. Create OAuth 2.0 credentials
 * 3. Enable Gmail API
 * 4. Add redirect URI
 * 5. Set environment variables:
 *    - GMAIL_CLIENT_ID
 *    - GMAIL_CLIENT_SECRET
 *    - GMAIL_REDIRECT_URI
 */

import prisma from '../lib/prisma';
import { ParsedEmail, EmailAttachment } from '../modules/emails/email.service';

// ===== GMAIL TYPES =====

interface GmailTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

interface GmailMessage {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  payload: {
    headers: Array<{ name: string; value: string }>;
    body: { data?: string; size: number };
    parts?: Array<{
      mimeType: string;
      filename: string;
      body: { data?: string; size: number; attachmentId?: string };
    }>;
  };
  internalDate: string;
}

// ===== GMAIL SERVICE CLASS =====

export class GmailIntegration {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;

  constructor() {
    this.clientId = process.env.GMAIL_CLIENT_ID || '';
    this.clientSecret = process.env.GMAIL_CLIENT_SECRET || '';
    this.redirectUri = process.env.GMAIL_REDIRECT_URI || 'http://localhost:3001/api/admin/gmail/callback';
  }

  /**
   * Check if Gmail is configured
   */
  isConfigured(): boolean {
    return !!(this.clientId && this.clientSecret);
  }

  /**
   * Generate OAuth URL for authorization
   */
  getAuthUrl(): string {
    if (!this.isConfigured()) {
      throw new Error('Gmail OAuth not configured. Set GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET');
    }

    const scopes = [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.modify',
      'https://www.googleapis.com/auth/gmail.labels',
    ];

    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: scopes.join(' '),
      access_type: 'offline',
      prompt: 'consent',
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(code: string): Promise<GmailTokens> {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: this.redirectUri,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Token exchange failed: ${error}`);
    }

    const data = await response.json();

    const tokens: GmailTokens = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: new Date(Date.now() + data.expires_in * 1000),
    };

    // Store tokens in admin_settings
    await this.saveTokens(tokens);

    return tokens;
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken: string): Promise<GmailTokens> {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    const data = await response.json();

    const tokens: GmailTokens = {
      accessToken: data.access_token,
      refreshToken: refreshToken, // Keep existing refresh token
      expiresAt: new Date(Date.now() + data.expires_in * 1000),
    };

    await this.saveTokens(tokens);

    return tokens;
  }

  /**
   * Save tokens to database (admin_settings)
   */
  private async saveTokens(tokens: GmailTokens): Promise<void> {
    // Get user info from Gmail API to store email
    const userInfo = await this.getUserInfo(tokens.accessToken);

    await prisma.adminSettings.upsert({
      where: { id: 1 },
      update: {
        gmailAccessToken: tokens.accessToken,
        gmailRefreshToken: tokens.refreshToken,
        gmailTokenExpiry: tokens.expiresAt,
        gmailEmail: userInfo.emailAddress,
        updatedAt: new Date(),
      },
      create: {
        id: 1,
        gmailAccessToken: tokens.accessToken,
        gmailRefreshToken: tokens.refreshToken,
        gmailTokenExpiry: tokens.expiresAt,
        gmailEmail: userInfo.emailAddress,
      },
    });

    console.log('Gmail tokens saved to database');
  }

  /**
   * Get Gmail user info
   */
  private async getUserInfo(accessToken: string): Promise<{ emailAddress: string }> {
    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get user info');
    }

    return await response.json();
  }

  /**
   * Get saved tokens
   */
  async getTokens(): Promise<GmailTokens | null> {
    const settings = await prisma.adminSettings.findUnique({
      where: { id: 1 },
    });

    if (!settings?.gmailAccessToken || !settings?.gmailRefreshToken) {
      return null;
    }

    return {
      accessToken: settings.gmailAccessToken,
      refreshToken: settings.gmailRefreshToken,
      expiresAt: settings.gmailTokenExpiry || new Date(),
    };
  }

  /**
   * Get Gmail connection status
   */
  async getStatus(): Promise<{
    connected: boolean;
    email?: string;
    tokenExpiry?: Date;
    lastFetch?: Date;
  }> {
    const settings = await prisma.adminSettings.findUnique({
      where: { id: 1 },
    });

    if (!settings?.gmailAccessToken) {
      return { connected: false };
    }

    return {
      connected: true,
      email: settings.gmailEmail || undefined,
      tokenExpiry: settings.gmailTokenExpiry || undefined,
      lastFetch: settings.lastEmailFetchAt || undefined,
    };
  }

  /**
   * Ensure we have a valid access token
   */
  private async getValidAccessToken(): Promise<string> {
    let tokens = await this.getTokens();

    if (!tokens) {
      throw new Error('Gmail not connected. Please authorize first.');
    }

    // Check if token expired
    if (tokens.expiresAt < new Date()) {
      tokens = await this.refreshAccessToken(tokens.refreshToken);
    }

    return tokens.accessToken;
  }

  /**
   * Fetch unread emails from Gmail
   */
  async fetchUnreadEmails(maxResults: number = 10): Promise<ParsedEmail[]> {
    const accessToken = await this.getValidAccessToken();

    // List unread messages from Chinese agents
    // Filter: is:unread from:*@*.cn OR from:*china* OR from:*agent*
    const query = encodeURIComponent('is:unread category:primary');

    const listResponse = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${query}&maxResults=${maxResults}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!listResponse.ok) {
      throw new Error(`Failed to list messages: ${listResponse.status}`);
    }

    const listData = await listResponse.json();
    const messages: GmailMessage[] = [];

    // Fetch full message details
    for (const msg of listData.messages || []) {
      const msgResponse = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (msgResponse.ok) {
        messages.push(await msgResponse.json());
      }
    }

    // Parse messages into our format
    return messages.map((msg) => this.parseGmailMessage(msg));
  }

  /**
   * Parse Gmail API message into our ParsedEmail format
   */
  private parseGmailMessage(msg: GmailMessage): ParsedEmail {
    const headers = msg.payload.headers;

    const getHeader = (name: string): string => {
      const header = headers.find(
        (h) => h.name.toLowerCase() === name.toLowerCase()
      );
      return header?.value || '';
    };

    // Decode body
    let body = '';
    if (msg.payload.body.data) {
      body = Buffer.from(msg.payload.body.data, 'base64').toString('utf-8');
    } else if (msg.payload.parts) {
      // Find text/plain or text/html part
      const textPart = msg.payload.parts.find(
        (p) => p.mimeType === 'text/plain' || p.mimeType === 'text/html'
      );
      if (textPart?.body.data) {
        body = Buffer.from(textPart.body.data, 'base64').toString('utf-8');
      }
    }

    // Parse attachments
    const attachments: EmailAttachment[] = [];
    if (msg.payload.parts) {
      for (const part of msg.payload.parts) {
        if (part.filename && part.body.attachmentId) {
          attachments.push({
            filename: part.filename,
            mimeType: part.mimeType,
            size: part.body.size,
          });
        }
      }
    }

    return {
      id: msg.id,
      from: getHeader('From'),
      subject: getHeader('Subject'),
      date: new Date(parseInt(msg.internalDate)),
      body,
      attachments,
    };
  }

  /**
   * Mark email as read and add label
   */
  async markAsProcessed(messageId: string): Promise<void> {
    const accessToken = await this.getValidAccessToken();

    // Remove UNREAD label
    await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          removeLabelIds: ['UNREAD'],
          addLabelIds: [], // Could add a "Processed" label
        }),
      }
    );

    // Update last fetch time
    await prisma.adminSettings.updateMany({
      where: { id: 1 },
      data: {
        lastEmailFetchAt: new Date(),
      },
    });
  }
}

// Export singleton
export const gmailIntegration = new GmailIntegration();
