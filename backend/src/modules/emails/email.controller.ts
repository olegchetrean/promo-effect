/**
 * Email Controller
 *
 * API endpoints for email processing functionality:
 * - Gmail OAuth flow
 * - Manual email parsing
 * - Email queue management
 * - Processing statistics
 */

import { Router, Request, Response } from 'express';
import { emailService, ParsedEmail } from './email.service';
import { gmailIntegration } from '../../integrations/gmail.integration';
import { authMiddleware, requireRole } from '../../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * GET /api/admin/gmail/auth
 *
 * Start Gmail OAuth flow - returns authorization URL
 * Admin only
 */
router.get('/gmail/auth', requireRole(['SUPER_ADMIN', 'ADMIN']), async (req: Request, res: Response) => {
  try {
    if (!gmailIntegration.isConfigured()) {
      return res.status(503).json({
        error: 'Gmail OAuth not configured',
        message: 'Please set GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET environment variables'
      });
    }

    const authUrl = gmailIntegration.getAuthUrl();

    return res.json({
      authUrl,
      message: 'Redirect user to this URL to authorize Gmail access'
    });
  } catch (error: any) {
    console.error('Gmail auth error:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/admin/gmail/callback
 *
 * Gmail OAuth callback - exchanges code for tokens
 */
router.get('/gmail/callback', requireRole(['SUPER_ADMIN', 'ADMIN']), async (req: Request, res: Response) => {
  try {
    const { code, error } = req.query;

    if (error) {
      return res.status(400).json({
        error: 'Authorization denied',
        details: error
      });
    }

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Authorization code required' });
    }

    const tokens = await gmailIntegration.exchangeCodeForTokens(code);

    // In production, redirect to frontend with success message
    return res.json({
      success: true,
      message: 'Gmail connected successfully!',
      expiresAt: tokens.expiresAt
    });
  } catch (error: any) {
    console.error('Gmail callback error:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/admin/gmail/status
 *
 * Get Gmail connection status
 */
router.get('/gmail/status', requireRole(['SUPER_ADMIN', 'ADMIN']), async (req: Request, res: Response) => {
  try {
    const status = await gmailIntegration.getStatus();

    return res.json(status);
  } catch (error: any) {
    console.error('Gmail status error:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/admin/emails/fetch
 *
 * Manually trigger email fetching from Gmail
 * Admin only
 */
router.post('/emails/fetch', requireRole(['SUPER_ADMIN', 'ADMIN']), async (req: Request, res: Response) => {
  try {
    const { maxResults = 10 } = req.body;

    // Check if Gmail is connected
    const status = await gmailIntegration.getStatus();
    if (!status.connected) {
      return res.status(400).json({
        error: 'Gmail not connected',
        message: 'Please authorize Gmail access first at /api/admin/gmail/auth'
      });
    }

    // Fetch emails
    const emails = await gmailIntegration.fetchUnreadEmails(maxResults);

    // Queue emails for processing
    for (const email of emails) {
      await emailService.queueEmailForProcessing(email);
    }

    return res.json({
      success: true,
      fetched: emails.length,
      message: `${emails.length} emails queued for processing`
    });
  } catch (error: any) {
    console.error('Email fetch error:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/emails/parse
 *
 * Parse a single email (for testing/manual processing)
 * Accepts raw email data and returns extracted booking info
 */
router.post('/parse', requireRole(['SUPER_ADMIN', 'ADMIN', 'MANAGER']), async (req: Request, res: Response) => {
  try {
    const { from, subject, body, date } = req.body;

    if (!subject || !body) {
      return res.status(400).json({
        error: 'Subject and body are required'
      });
    }

    const email: ParsedEmail = {
      id: `manual-${Date.now()}`,
      from: from || 'manual@test.com',
      subject,
      body,
      date: date ? new Date(date) : new Date(),
      attachments: []
    };

    // Process without auto-creating booking
    const result = await emailService.processEmail(email, false);

    return res.json(result);
  } catch (error: any) {
    console.error('Email parse error:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/emails/process
 *
 * Process a single email and optionally auto-create booking
 */
router.post('/process', requireRole(['SUPER_ADMIN', 'ADMIN']), async (req: Request, res: Response) => {
  try {
    const { from, subject, body, date, autoCreate = true, minConfidence = 80 } = req.body;

    if (!subject || !body) {
      return res.status(400).json({
        error: 'Subject and body are required'
      });
    }

    const email: ParsedEmail = {
      id: `manual-${Date.now()}`,
      from: from || 'manual@test.com',
      subject,
      body,
      date: date ? new Date(date) : new Date(),
      attachments: []
    };

    const result = await emailService.processEmail(email, autoCreate, minConfidence);

    return res.json(result);
  } catch (error: any) {
    console.error('Email process error:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/admin/emails/queue
 *
 * Get emails in processing queue
 */
router.get('/queue', requireRole(['SUPER_ADMIN', 'ADMIN']), async (req: Request, res: Response) => {
  try {
    const pending = await emailService.getPendingEmails();

    return res.json({
      pending: pending.length,
      emails: pending
    });
  } catch (error: any) {
    console.error('Email queue error:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/admin/emails/process-queue
 *
 * Process all pending emails in queue
 */
router.post('/process-queue', requireRole(['SUPER_ADMIN', 'ADMIN']), async (req: Request, res: Response) => {
  try {
    const { autoCreate = true, minConfidence = 80 } = req.body;

    const pending = await emailService.getPendingEmails();
    const results = [];

    for (const email of pending) {
      const result = await emailService.processEmail(email, autoCreate, minConfidence);
      results.push(result);

      // Mark as processed
      await emailService.markEmailProcessed(
        email.id,
        result.status === 'FAILED' ? 'FAILED' : 'PROCESSED',
        result.error
      );
    }

    const summary = {
      total: results.length,
      success: results.filter(r => r.status === 'SUCCESS').length,
      needsReview: results.filter(r => r.status === 'NEEDS_REVIEW').length,
      failed: results.filter(r => r.status === 'FAILED').length,
      bookingsCreated: results.filter(r => r.bookingId).length
    };

    return res.json({
      summary,
      results
    });
  } catch (error: any) {
    console.error('Process queue error:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/admin/emails/stats
 *
 * Get email processing statistics
 */
router.get('/stats', requireRole(['SUPER_ADMIN', 'ADMIN', 'MANAGER']), async (req: Request, res: Response) => {
  try {
    const stats = await emailService.getProcessingStats();

    return res.json(stats);
  } catch (error: any) {
    console.error('Email stats error:', error);
    return res.status(500).json({ error: error.message });
  }
});

export default router;
