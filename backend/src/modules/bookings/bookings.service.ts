import { PrismaClient } from '@prisma/client';
import { generateBookingId } from '../../utils/booking-id.util';
import { CreateBookingDTO, UpdateBookingDTO, BookingFilters } from '../../types/booking.types';

const prisma = new PrismaClient();

export class BookingsService {
  /**
   * Get or create a Client record for a User
   * This bridges the User and Client tables for booking creation
   */
  private async getOrCreateClientForUser(userId: string): Promise<string> {
    // First, get the user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Check if a Client already exists with this email
    let client = await prisma.client.findUnique({
      where: { email: user.email },
    });

    // If no client exists, create one based on User data
    if (!client) {
      client = await prisma.client.create({
        data: {
          email: user.email,
          companyName: user.company || user.name,
          contactPerson: user.name,
          phone: user.phone || '',
          status: 'ACTIVE',
        },
      });
    }

    return client.id;
  }

  /**
   * Create new booking with automatic price calculation
   */
  async create(data: CreateBookingDTO, userId: string) {
    // 1. Generate unique booking ID (PE2512001)
    const id = await generateBookingId();

    // 2. Get admin settings for fixed costs
    const settings = await prisma.adminSettings.findUnique({ where: { id: 1 } });
    if (!settings) {
      throw new Error('Admin settings not configured');
    }

    // 3. Resolve clientId - use provided clientId, or create/get Client for the current user
    let clientId = data.clientId;
    if (!clientId) {
      clientId = await this.getOrCreateClientForUser(userId);
    }

    // 4. Find best price from AgentPrice table (if agent/price specified)
    let freightPrice = data.freightPrice || 0;
    let shippingLine = data.shippingLine || 'TBD';
    let agentId = data.agentId;
    let priceId = data.priceId;

    if (priceId) {
      const selectedPrice = await prisma.agentPrice.findUnique({
        where: { id: priceId },
        include: { agent: true }
      });

      if (!selectedPrice) {
        throw new Error('Selected price not found');
      }

      freightPrice = selectedPrice.freightPrice;
      shippingLine = selectedPrice.shippingLine;
      agentId = selectedPrice.agentId || undefined;
    }

    // 5. Calculate total price
    const portTaxes = settings.portTaxes;
    const customsTaxes = settings.customsTaxes;
    const terrestrialTransport = settings.terrestrialTransport;
    const commission = settings.commission;
    const totalPrice = freightPrice + portTaxes + customsTaxes + terrestrialTransport + commission;

    // 6. Create booking
    const booking = await prisma.booking.create({
      data: {
        id,
        clientId, // Now properly resolved to a Client ID
        agentId,
        priceId,

        // Route
        portOrigin: data.portOrigin,
        portDestination: data.portDestination || 'Constanta',
        containerType: data.containerType,

        // Cargo details
        cargoCategory: data.cargoCategory,
        cargoWeight: data.cargoWeight,
        cargoReadyDate: new Date(data.cargoReadyDate),

        // Pricing breakdown
        shippingLine,
        freightPrice,
        portTaxes,
        customsTaxes,
        terrestrialTransport,
        commission,
        totalPrice,

        // Supplier info (optional)
        supplierName: data.supplierName,
        supplierPhone: data.supplierPhone,
        supplierEmail: data.supplierEmail,
        supplierAddress: data.supplierAddress,

        // Status
        status: 'CONFIRMED',

        // Notes
        internalNotes: data.internalNotes,
        clientNotes: data.clientNotes,
      },
      include: {
        client: true,
        agent: true,
      },
    });

    // 7. Create audit log
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'BOOKING_CREATED',
        entityType: 'Booking',
        entityId: booking.id,
        changes: JSON.stringify({ bookingId: booking.id, totalPrice }),
      },
    });

    // 8. TODO: Create notification (will be implemented in notification service)
    // await notificationService.send(booking.clientId, 'BOOKING_CONFIRMED', { booking });

    return booking;
  }

  /**
   * Find all bookings with filters and pagination
   */
  async findAll(filters: BookingFilters, userId: string, userRole: string) {
    const where: any = {};

    // Authorization: Clients see only their bookings
    if (userRole === 'CLIENT') {
      // Get the Client ID associated with this User
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user) {
        const client = await prisma.client.findUnique({ where: { email: user.email } });
        if (client) {
          where.clientId = client.id;
        } else {
          // User has no client record, return empty result
          where.clientId = 'no-client-record';
        }
      }
    } else if (filters.clientId) {
      where.clientId = filters.clientId;
    }

    // Status filter
    if (filters.status) {
      where.status = filters.status;
    }

    // Date range filter
    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) {
        where.createdAt.gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        where.createdAt.lte = new Date(filters.dateTo);
      }
    }

    // Search filter (booking ID, container number, client name)
    if (filters.search) {
      where.OR = [
        { id: { contains: filters.search } },
        { client: { companyName: { contains: filters.search } } },
      ];
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            companyName: true,
            contactPerson: true,
            email: true,
            phone: true,
          },
        },
        agent: {
          select: {
            id: true,
            company: true,
            contactName: true,
          },
        },
        containers: {
          select: {
            id: true,
            containerNumber: true,
            currentStatus: true,
            currentLocation: true,
            eta: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: filters.limit || 50,
      skip: filters.offset || 0,
    });

    const total = await prisma.booking.count({ where });

    return {
      bookings,
      total,
      limit: filters.limit || 50,
      offset: filters.offset || 0,
    };
  }

  /**
   * Find single booking by ID
   */
  async findOne(id: string, userId: string, userRole: string) {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        client: true,
        agent: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        selectedPrice: true,
        containers: {
          include: {
            trackingEvents: {
              orderBy: { eventDate: 'desc' },
              take: 10,
            },
          },
        },
        documents: true,
        invoices: {
          include: {
            payments: true,
          },
        },
        notifications: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    // Authorization check for CLIENT role
    if (userRole === 'CLIENT') {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      const client = user ? await prisma.client.findUnique({ where: { email: user.email } }) : null;
      if (!client || booking.clientId !== client.id) {
        throw new Error('Forbidden: You can only view your own bookings');
      }
    }

    return booking;
  }

  /**
   * Update booking
   */
  async update(id: string, data: UpdateBookingDTO, userId: string, userRole: string) {
    // Find existing booking
    const existing = await prisma.booking.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Booking not found');
    }

    // Authorization check for CLIENT role
    if (userRole === 'CLIENT') {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      const client = user ? await prisma.client.findUnique({ where: { email: user.email } }) : null;
      if (!client || existing.clientId !== client.id) {
        throw new Error('Forbidden: You can only update your own bookings');
      }
    }

    // Only admins/managers can update status
    if (data.status && !['ADMIN', 'MANAGER', 'SUPER_ADMIN'].includes(userRole)) {
      throw new Error('Forbidden: Only admins can update booking status');
    }

    // Update booking
    const updated = await prisma.booking.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      include: {
        client: true,
        agent: true,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'BOOKING_UPDATED',
        entityType: 'Booking',
        entityId: id,
        changes: JSON.stringify({ before: existing, after: updated }),
      },
    });

    // TODO: Send notification if status changed
    if (data.status && data.status !== existing.status) {
      // await notificationService.send(updated.clientId, 'BOOKING_STATUS_CHANGED', { booking: updated });
    }

    return updated;
  }

  /**
   * Soft delete (cancel) booking
   */
  async delete(id: string, userId: string, userRole: string) {
    // Find existing booking
    const existing = await prisma.booking.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Booking not found');
    }

    // Only admins can delete
    if (!['ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
      throw new Error('Forbidden: Only admins can cancel bookings');
    }

    // Soft delete: Set status to CANCELLED
    const cancelled = await prisma.booking.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        updatedAt: new Date(),
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'BOOKING_CANCELLED',
        entityType: 'Booking',
        entityId: id,
        changes: JSON.stringify({ reason: 'Admin cancelled' }),
      },
    });

    // TODO: Send notification
    // await notificationService.send(cancelled.clientId, 'BOOKING_CANCELLED', { booking: cancelled });

    return { message: 'Booking cancelled successfully' };
  }

  /**
   * Get booking statistics for dashboard
   */
  async getStats(userId: string, userRole: string) {
    const where: any = {};
    if (userRole === 'CLIENT') {
      // Get the Client ID associated with this User
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user) {
        const client = await prisma.client.findUnique({ where: { email: user.email } });
        if (client) {
          where.clientId = client.id;
        } else {
          // No client record, return zeros
          return {
            total: 0,
            byStatus: { CONFIRMED: 0, IN_TRANSIT: 0, DELIVERED: 0, CANCELLED: 0 },
            totalRevenue: 0,
          };
        }
      }
    }

    const [total, confirmed, inTransit, delivered, cancelled] = await Promise.all([
      prisma.booking.count({ where }),
      prisma.booking.count({ where: { ...where, status: 'CONFIRMED' } }),
      prisma.booking.count({ where: { ...where, status: 'IN_TRANSIT' } }),
      prisma.booking.count({ where: { ...where, status: 'DELIVERED' } }),
      prisma.booking.count({ where: { ...where, status: 'CANCELLED' } }),
    ]);

    const totalRevenue = await prisma.booking.aggregate({
      where: { ...where, status: { not: 'CANCELLED' } },
      _sum: { totalPrice: true },
    });

    return {
      total,
      byStatus: {
        confirmed,
        inTransit,
        delivered,
        cancelled,
      },
      totalRevenue: totalRevenue._sum.totalPrice || 0,
    };
  }
}
