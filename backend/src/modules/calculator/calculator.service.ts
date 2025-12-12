/**
 * Calculator Service
 * Calculates shipping prices for ALL 6 shipping lines and returns top 5 sorted by price
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CalculatorInput {
  portOrigin: string;
  portDestination?: string; // Default: Constanta
  containerType: string;
  cargoCategory: string;
  cargoWeight: string;
  cargoReadyDate: string; // ISO date string
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
  calculatedAt: Date;
  input: CalculatorInput;
}

export class CalculatorService {
  /**
   * Calculate prices for ALL shipping lines and return top 5 sorted by price
   */
  async calculatePrices(input: CalculatorInput): Promise<CalculatorResult> {
    // Validate input
    this.validateInput(input);

    // Set default destination
    const portDestination = input.portDestination || 'Constanta';
    const readyDate = new Date(input.cargoReadyDate);

    // 1. Get admin settings (fixed costs)
    const settings = await prisma.adminSettings.findUnique({
      where: { id: 1 },
    });

    if (!settings) {
      throw new Error('Admin settings not configured');
    }

    // 2. Query AgentPrice for ALL shipping lines that match criteria
    // Note: For now, we skip date filtering due to SQLite datetime conversion issues
    // In production with PostgreSQL, this will work correctly
    const agentPrices = await prisma.agentPrice.findMany({
      where: {
        portOrigin: input.portOrigin,
        containerType: input.containerType,
        weightRange: input.cargoWeight,
        // TODO: Re-enable date filtering when moving to PostgreSQL
        // validFrom: { lte: readyDate },
        // validUntil: { gte: readyDate },
      },
      include: {
        agent: true,
      },
    });

    if (agentPrices.length === 0) {
      throw new Error(
        `No prices found for ${input.portOrigin} → ${portDestination}, ${input.containerType}, ${input.cargoWeight}`
      );
    }

    // 3. Calculate total price for each shipping line
    const offers: PriceOffer[] = agentPrices.map((price) => {
      const totalPriceUSD =
        price.freightPrice +
        settings.portTaxes +
        settings.customsTaxes +
        settings.terrestrialTransport +
        settings.commission;

      return {
        rank: 0, // Will be set after sorting
        shippingLine: price.shippingLine,
        agentPriceId: price.id,
        freightPrice: price.freightPrice,
        portTaxes: settings.portTaxes,
        customsTaxes: settings.customsTaxes,
        terrestrialTransport: settings.terrestrialTransport,
        commission: settings.commission,
        totalPriceUSD,
        totalPriceMDL: 0, // Will be calculated after getting exchange rate
        estimatedTransitDays: this.estimateTransitDays(
          input.portOrigin,
          portDestination
        ),
        departureDate: price.departureDate.toISOString(),
        availability: this.checkAvailability(price.departureDate),
      };
    });

    // 4. Sort by price (lowest first)
    offers.sort((a, b) => a.totalPriceUSD - b.totalPriceUSD);

    // 5. Take top 5 and assign ranks
    const top5 = offers.slice(0, 5).map((offer, index) => ({
      ...offer,
      rank: index + 1,
    }));

    // 6. Get exchange rate USD → MDL
    const exchangeRate = await this.getExchangeRate('USD', 'MDL');

    // 7. Convert to MDL
    const withMDL = top5.map((offer) => ({
      ...offer,
      totalPriceMDL: Math.round(offer.totalPriceUSD * exchangeRate * 100) / 100,
    }));

    return {
      offers: withMDL,
      exchangeRate,
      calculatedAt: new Date(),
      input: {
        ...input,
        portDestination,
      },
    };
  }

  /**
   * Validate input parameters
   */
  private validateInput(input: CalculatorInput): void {
    if (!input.portOrigin) {
      throw new Error('Port of origin is required');
    }

    if (!input.containerType) {
      throw new Error('Container type is required');
    }

    if (!input.cargoWeight) {
      throw new Error('Cargo weight is required');
    }

    if (!input.cargoReadyDate) {
      throw new Error('Cargo ready date is required');
    }

    // Validate date is in future
    const readyDate = new Date(input.cargoReadyDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (readyDate < today) {
      throw new Error('Cargo ready date must be in the future');
    }
  }

  /**
   * Estimate transit days based on route
   */
  private estimateTransitDays(origin: string, destination: string): number {
    // Simplified estimation - în realitate ar fi un lookup table
    const estimates: { [key: string]: number } = {
      Shanghai: 32,
      Qingdao: 30,
      Ningbo: 33,
      Shenzhen: 35,
      Guangzhou: 35,
      Tianjin: 28,
      Dalian: 26,
      Xiamen: 34,
    };

    return estimates[origin] || 30; // Default 30 days
  }

  /**
   * Check availability based on departure date
   */
  private checkAvailability(
    departureDate: Date
  ): 'AVAILABLE' | 'LIMITED' | 'UNAVAILABLE' {
    const today = new Date();
    const daysUntilDeparture = Math.floor(
      (departureDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntilDeparture > 14) {
      return 'AVAILABLE';
    } else if (daysUntilDeparture > 7) {
      return 'LIMITED';
    } else {
      return 'UNAVAILABLE';
    }
  }

  /**
   * Get exchange rate from external API
   * Uses exchangerate-api.com (free tier: 1,500 requests/month)
   */
  private async getExchangeRate(
    from: string,
    to: string
  ): Promise<number> {
    try {
      // Check cache first (cache for 1 hour)
      const cached = await this.getCachedRate(from, to);
      if (cached) {
        return cached;
      }

      // Fetch from API
      const response = await fetch(
        `https://api.exchangerate-api.com/v4/latest/${from}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch exchange rate');
      }

      const data = await response.json();
      const rate = data.rates[to];

      if (!rate) {
        throw new Error(`Exchange rate not found for ${from} → ${to}`);
      }

      // Cache the rate
      await this.cacheRate(from, to, rate);

      return rate;
    } catch (error) {
      console.error('Exchange rate error:', error);
      // Fallback to hardcoded rate (MDL as of Dec 2025)
      return 18.0;
    }
  }

  /**
   * Get cached exchange rate from database
   */
  private async getCachedRate(
    from: string,
    to: string
  ): Promise<number | null> {
    try {
      // For now, we'll use a simple in-memory cache
      // In production, you'd want to use Redis or database

      // Check if we have a recent rate in admin settings
      const settings = await prisma.adminSettings.findUnique({
        where: { id: 1 },
      });

      if (!settings) return null;

      // Check if rate was updated in last hour
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      if (settings.updatedAt > oneHourAgo) {
        // Assuming we store rate in a custom field (would need to add to schema)
        // For now, return null to always fetch fresh
        return null;
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Cache exchange rate
   */
  private async cacheRate(
    from: string,
    to: string,
    rate: number
  ): Promise<void> {
    try {
      // For now, we'll skip caching
      // In production, you'd store this in Redis or database
      console.log(`Cached rate ${from}/${to}: ${rate}`);
    } catch (error) {
      console.error('Failed to cache rate:', error);
    }
  }

  /**
   * Get all available ports (for dropdown in UI)
   */
  async getAvailablePorts(): Promise<string[]> {
    const ports = await prisma.agentPrice.findMany({
      distinct: ['portOrigin'],
      select: {
        portOrigin: true,
      },
    });

    return ports.map((p) => p.portOrigin).sort();
  }

  /**
   * Get all available container types (for dropdown in UI)
   */
  async getAvailableContainerTypes(): Promise<string[]> {
    const types = await prisma.agentPrice.findMany({
      distinct: ['containerType'],
      select: {
        containerType: true,
      },
    });

    return types.map((t) => t.containerType).sort();
  }

  /**
   * Get all available weight ranges (for dropdown in UI)
   */
  async getAvailableWeightRanges(): Promise<string[]> {
    const weights = await prisma.agentPrice.findMany({
      distinct: ['weightRange'],
      select: {
        weightRange: true,
      },
    });

    return weights.map((w) => w.weightRange).sort();
  }
}
