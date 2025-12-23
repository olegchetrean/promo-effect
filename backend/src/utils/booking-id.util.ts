import prisma from '../lib/prisma';

/**
 * Generează ID unic pentru booking în formatul: PE2512001
 * PE + An(2) + Lună(2) + Număr secvențial(3)
 */
export async function generateBookingId(): Promise<string> {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2); // 25
  const month = (now.getMonth() + 1).toString().padStart(2, '0'); // 12

  const prefix = `PE${year}${month}`; // PE2512

  // Găsește ultimul booking din această lună
  const lastBooking = await prisma.booking.findFirst({
    where: {
      id: {
        startsWith: prefix,
      },
    },
    orderBy: {
      id: 'desc',
    },
  });

  let sequenceNumber = 1;

  if (lastBooking) {
    // Extrage numărul secvențial din ultimul ID
    const lastSequence = parseInt(lastBooking.id.slice(-3));
    sequenceNumber = lastSequence + 1;
  }

  // Formatare cu 3 cifre (001, 002, etc.)
  const sequenceStr = sequenceNumber.toString().padStart(3, '0');

  return `${prefix}${sequenceStr}`; // Ex: PE2512001
}
