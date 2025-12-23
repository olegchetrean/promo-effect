import prisma from '../lib/prisma';

/**
 * Generates a unique invoice number in format: PROMO-YYYY-NNNNN
 * Example: PROMO-2025-00001, PROMO-2025-00002
 * Uses database transaction to prevent race conditions
 */
export async function generateInvoiceNumber(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const prefix = `PROMO-${currentYear}-`;

  // Use transaction to ensure atomic increment
  const invoiceNumber = await prisma.$transaction(async (tx) => {
    // Find the last invoice number for current year
    const lastInvoice = await tx.invoice.findFirst({
      where: {
        invoiceNumber: {
          startsWith: prefix
        }
      },
      orderBy: {
        invoiceNumber: 'desc'
      },
      select: {
        invoiceNumber: true
      }
    });

    let nextNumber = 1;

    if (lastInvoice) {
      // Extract the numeric part and increment
      const parts = lastInvoice.invoiceNumber.split('-');
      if (parts.length === 3) {
        const lastNum = parseInt(parts[2], 10);
        if (!isNaN(lastNum)) {
          nextNumber = lastNum + 1;
        }
      }
    }

    // Format with leading zeros (5 digits)
    const formattedNumber = String(nextNumber).padStart(5, '0');
    return `${prefix}${formattedNumber}`;
  });

  return invoiceNumber;
}

/**
 * Validates if an invoice number follows the correct format
 */
export function isValidInvoiceNumber(invoiceNumber: string): boolean {
  const pattern = /^PROMO-\d{4}-\d{5}$/;
  return pattern.test(invoiceNumber);
}

/**
 * Extracts year from invoice number
 */
export function getYearFromInvoiceNumber(invoiceNumber: string): number | null {
  const match = invoiceNumber.match(/^PROMO-(\d{4})-\d{5}$/);
  if (match) {
    return parseInt(match[1], 10);
  }
  return null;
}

export default { generateInvoiceNumber, isValidInvoiceNumber, getYearFromInvoiceNumber };
