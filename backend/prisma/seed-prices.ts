/**
 * Seed script pentru AgentPrice
 * Populează database-ul cu prețuri test pentru cele 6 linii maritime
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // 1. Ensure admin settings exist
  const settings = await prisma.adminSettings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      portTaxes: 221.67,
      customsTaxes: 150.0,
      terrestrialTransport: 600.0,
      commission: 200.0,
    },
  });

  console.log('✅ Admin settings:', settings);

  // 2. Create test agent prices
  const shippingLines = ['Maersk', 'MSC', 'Hapag-Lloyd', 'ZIM', 'Cosco', 'Yangming'];
  const ports = ['Shanghai', 'Qingdao', 'Ningbo', 'Shenzhen'];
  const containerTypes = ['20ft', '40ft', '40ft HC'];
  const weightRanges = ['1-10t', '10-20t', '20-24t'];

  let count = 0;

  for (const line of shippingLines) {
    for (const port of ports) {
      for (const type of containerTypes) {
        for (const weight of weightRanges) {
          // Generate realistic prices based on shipping line "reputation"
          const basePrice = getBasePrice(line, port, type, weight);

          // Check if price already exists
          const existing = await prisma.agentPrice.findFirst({
            where: {
              shippingLine: line,
              portOrigin: port,
              containerType: type,
              weightRange: weight,
            },
          });

          if (existing) {
            console.log(
              `⏭️  Skipping ${line} | ${port} | ${type} | ${weight} (already exists)`
            );
            continue;
          }

          await prisma.agentPrice.create({
            data: {
              shippingLine: line,
              portOrigin: port,
              containerType: type,
              weightRange: weight,
              freightPrice: basePrice,
              validFrom: new Date('2025-01-01'),
              validUntil: new Date('2025-12-31'),
              departureDate: new Date('2025-12-20'), // Test date
            },
          });

          count++;
          console.log(
            `✅ Created: ${line} | ${port} | ${type} | ${weight} = $${basePrice}`
          );
        }
      }
    }
  }

  console.log(`\n✅ Seed completed! Created ${count} price records.`);
}

/**
 * Generate realistic base freight prices
 * Based on:
 * - Shipping line (premium vs budget)
 * - Port (distance)
 * - Container type
 * - Weight
 */
function getBasePrice(
  line: string,
  port: string,
  type: string,
  weight: string
): number {
  // Base prices by shipping line (premium → budget)
  const linePricing: { [key: string]: number } = {
    Maersk: 1.2, // Premium +20%
    'Hapag-Lloyd': 1.15, // Premium +15%
    MSC: 1.0, // Standard
    ZIM: 0.95, // Budget -5%
    Cosco: 0.9, // Budget -10%
    Yangming: 0.85, // Budget -15%
  };

  // Base prices by port (distance from Constanta)
  const portPricing: { [key: string]: number } = {
    Shanghai: 1900,
    Qingdao: 1850,
    Ningbo: 1950,
    Shenzhen: 2000,
  };

  // Container type multiplier
  const typePricing: { [key: string]: number } = {
    '20ft': 0.6, // 60% of base
    '40ft': 1.0, // 100% of base
    '40ft HC': 1.1, // 110% of base
  };

  // Weight multiplier
  const weightPricing: { [key: string]: number } = {
    '1-10t': 0.9, // Light cargo -10%
    '10-20t': 1.0, // Standard
    '20-24t': 1.15, // Heavy +15%
  };

  const base =
    portPricing[port] *
    typePricing[type] *
    weightPricing[weight] *
    linePricing[line];

  // Add some randomness (±50 USD)
  const randomness = (Math.random() - 0.5) * 100;

  return Math.round(base + randomness);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
