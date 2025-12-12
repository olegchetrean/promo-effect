/**
 * Calculator Service
 * Handles all price calculator-related API calls
 */

import api from './api';

// Calculator interfaces for API
export interface CalculatePriceData {
  portOrigin: string;
  portDestination?: string;
  containerType: string;
  cargoCategory: string;
  cargoWeight: string;
  cargoReadyDate: string;
}

export interface PriceOffer {
  rank: number;
  shippingLine: string;
  agentPriceId: string;

  // Price breakdown
  freightPrice: number;
  portTaxes: number;
  customsTaxes: number;
  terrestrialTransport: number;
  commission: number;

  totalPriceUSD: number;
  totalPriceMDL: number;

  estimatedTransitDays: number;
  departureDate: string;
  availability: 'AVAILABLE' | 'LIMITED' | 'UNAVAILABLE';
}

export interface CalculatorResult {
  offers: PriceOffer[];
  exchangeRate: number;
  calculatedAt: string;
  input: {
    portOrigin: string;
    portDestination: string;
    containerType: string;
    cargoCategory: string;
    cargoWeight: string;
    cargoReadyDate: string;
  };
}

/**
 * Calculate prices for ALL 6 shipping lines and return top 5 sorted by price
 */
export const calculatePrices = async (
  data: CalculatePriceData
): Promise<CalculatorResult> => {
  try {
    const response = await api.post<CalculatorResult>('/calculator/calculate', data);
    return response.data;
  } catch (error: any) {
    const errorMessage = error.response?.data?.error || error.message || 'Nu s-au putut calcula prețurile';
    throw new Error(errorMessage);
  }
};

/**
 * Get list of available ports (for dropdown)
 */
export const getAvailablePorts = async (): Promise<string[]> => {
  try {
    const response = await api.get<{ ports: string[] }>('/calculator/ports');
    return response.data.ports;
  } catch (error: any) {
    throw new Error(error.message || 'Nu s-au putut încărca porturile');
  }
};

/**
 * Get list of available container types (for dropdown)
 */
export const getAvailableContainerTypes = async (): Promise<string[]> => {
  try {
    const response = await api.get<{ containerTypes: string[] }>('/calculator/container-types');
    return response.data.containerTypes;
  } catch (error: any) {
    throw new Error(error.message || 'Nu s-au putut încărca tipurile de containere');
  }
};

/**
 * Get list of available weight ranges (for dropdown)
 */
export const getAvailableWeightRanges = async (): Promise<string[]> => {
  try {
    const response = await api.get<{ weightRanges: string[] }>('/calculator/weight-ranges');
    return response.data.weightRanges;
  } catch (error: any) {
    throw new Error(error.message || 'Nu s-au putut încărca intervalele de greutate');
  }
};

// Export calculator service
const calculatorService = {
  calculatePrices,
  getAvailablePorts,
  getAvailableContainerTypes,
  getAvailableWeightRanges,
};

export default calculatorService;
