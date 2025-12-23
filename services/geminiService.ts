/**
 * Gemini AI Service (Frontend)
 * 
 * This service now calls the backend API for AI parsing
 * to keep the Gemini API key secure (not exposed in browser)
 */

import api from './api';

// Response type from AI parsing
export interface ParsedEmailData {
  containerNumber?: string;
  billOfLading?: string;
  vesselName?: string;
  departureDate?: string;
  eta?: string;
  portOfLoading?: string;
  portOfDischarge?: string;
  shippingLine?: string;
  cargoDescription?: string;
  weight?: string;
  confidence?: number;
  error?: string;
}

/**
 * Check if AI parsing is available
 */
export async function checkAIStatus(): Promise<{ available: boolean; reason: string }> {
  try {
    const response = await api.get('/emails/ai-status');
    return response.data;
  } catch (error) {
    return {
      available: false,
      reason: 'Failed to check AI status'
    };
  }
}

/**
 * Parse email content using Gemini AI via backend
 * 
 * @param emailContent - The raw email text to parse
 * @returns Parsed email data as JSON string (for backward compatibility)
 */
export const parseEmailWithGemini = async (emailContent: string): Promise<string> => {
  try {
    const response = await api.post('/emails/parse-with-ai', { emailContent });
    
    if (response.data.success) {
      return JSON.stringify(response.data.data, null, 2);
    } else {
      return JSON.stringify({ 
        error: response.data.error || 'AI parsing failed',
        confidence: response.data.confidence || 0
      }, null, 2);
    }
  } catch (error: any) {
    console.error('AI parsing error:', error);
    
    // Handle specific error cases
    if (error.response?.status === 503) {
      return JSON.stringify({
        error: 'Serviciul AI nu este configurat. Contactați administratorul.',
        details: error.response?.data?.message
      }, null, 2);
    }
    
    if (error.response?.status === 401) {
      return JSON.stringify({
        error: 'Sesiunea a expirat. Vă rugăm să vă autentificați din nou.'
      }, null, 2);
    }
    
    if (error.response?.status === 422) {
      return JSON.stringify({
        error: error.response?.data?.error || 'Nu s-au putut extrage date din email.',
        confidence: error.response?.data?.confidence || 0
      }, null, 2);
    }

    return JSON.stringify({
      error: 'Eroare la analiza emailului cu AI.',
      details: error.message || 'Vă rugăm să încercați din nou.'
    }, null, 2);
  }
};

/**
 * Parse email and return typed data (new API)
 */
export async function parseEmail(emailContent: string): Promise<ParsedEmailData> {
  try {
    const response = await api.post('/emails/parse-with-ai', { emailContent });
    
    if (response.data.success) {
      return response.data.data;
    } else {
      return {
        error: response.data.error || 'AI parsing failed',
        confidence: response.data.confidence || 0
      };
    }
  } catch (error: any) {
    return {
      error: error.response?.data?.error || error.message || 'AI parsing failed',
      confidence: 0
    };
  }
}

export default {
  parseEmailWithGemini,
  parseEmail,
  checkAIStatus
};
