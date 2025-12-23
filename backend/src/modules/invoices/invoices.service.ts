import { Invoice, Payment } from '@prisma/client';
import prisma from '../../lib/prisma';
import { generateInvoiceNumber } from '../../utils/invoiceNumber';
import { generateInvoicePDF } from '../../services/pdf.service';

// VAT rate for Moldova
const VAT_RATE = 0.19;

// Types
export interface CreateInvoiceData {
  bookingId: string;
  clientId: string;
  dueDate: Date;
  notes?: string;
  discount?: number;
}

export interface UpdateInvoiceData {
  dueDate?: Date;
  notes?: string;
  discount?: number;
}

export interface PaymentData {
  amount: number;
  paymentDate: Date;
  paymentMethod: string;
  reference?: string;
  notes?: string;
}

export interface InvoiceFilters {
  page?: number;
  limit?: number;
  status?: string;
  clientId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}

export interface InvoiceStats {
  total: number;
  totalAmount: number;
  totalPaid: number;
  totalOutstanding: number;
  byStatus: {
    draft: number;
    unpaid: number;
    paid: number;
    overdue: number;
    cancelled: number;
  };
  monthlyRevenue: Array<{
    month: string;
    amount: number;
    paid: number;
  }>;
}

class InvoicesService {
  /**
   * Get all invoices with filtering and pagination
   */
  async findAll(filters: InvoiceFilters, userRole?: string, userClientId?: string) {
    const {
      page = 1,
      limit = 10,
      status,
      clientId,
      dateFrom,
      dateTo,
      search,
    } = filters;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    // Role-based filtering: CLIENT can only see their own invoices
    if (userRole === 'CLIENT' && userClientId) {
      where.clientId = userClientId;
    } else if (clientId) {
      where.clientId = clientId;
    }

    // Status filter
    if (status && status !== 'all') {
      where.status = status.toUpperCase();
    }

    // Date range filter
    if (dateFrom || dateTo) {
      where.issueDate = {};
      if (dateFrom) where.issueDate.gte = new Date(dateFrom);
      if (dateTo) where.issueDate.lte = new Date(dateTo);
    }

    // Search filter (invoice number or client name)
    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { client: { companyName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // Execute queries
    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
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
          booking: {
            select: {
              id: true,
              portOrigin: true,
              portDestination: true,
              containerType: true,
              status: true,
            },
          },
          payments: {
            select: {
              id: true,
              amount: true,
              paidAt: true,
              method: true,
            },
          },
          _count: {
            select: { payments: true },
          },
        },
      }),
      prisma.invoice.count({ where }),
    ]);

    // Calculate totals for current filter
    const totals = await prisma.invoice.aggregate({
      where,
      _sum: { amount: true },
    });

    const paidTotals = await prisma.payment.aggregate({
      where: {
        invoice: where,
      },
      _sum: { amount: true },
    });

    return {
      invoices: invoices.map((inv) => ({
        ...inv,
        amountPaid: inv.payments.reduce((sum, p) => sum + p.amount, 0),
        balance: inv.amount - inv.payments.reduce((sum, p) => sum + p.amount, 0),
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      summary: {
        totalAmount: totals._sum.amount || 0,
        totalPaid: paidTotals._sum.amount || 0,
        totalOutstanding: (totals._sum.amount || 0) - (paidTotals._sum.amount || 0),
      },
    };
  }

  /**
   * Get single invoice by ID with all details
   */
  async findOne(id: string, userRole?: string, userClientId?: string) {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        client: true,
        booking: true,
        payments: {
          orderBy: { paidAt: 'desc' },
        },
      },
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    // Permission check: CLIENT can only see their own invoices
    if (userRole === 'CLIENT' && userClientId && invoice.clientId !== userClientId) {
      throw new Error('Access denied');
    }

    const amountPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0);

    return {
      ...invoice,
      subtotal: invoice.amount / (1 + VAT_RATE),
      taxRate: VAT_RATE * 100,
      taxAmount: invoice.amount - invoice.amount / (1 + VAT_RATE),
      amountPaid,
      balance: invoice.amount - amountPaid,
    };
  }

  /**
   * Create new invoice
   */
  async create(data: CreateInvoiceData, createdBy: string) {
    // Validate booking exists
    const booking = await prisma.booking.findUnique({
      where: { id: data.bookingId },
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    // Validate client exists
    const client = await prisma.client.findUnique({
      where: { id: data.clientId },
    });

    if (!client) {
      throw new Error('Client not found');
    }

    // Check for existing invoice for this booking
    const existingInvoice = await prisma.invoice.findFirst({
      where: {
        bookingId: data.bookingId,
        status: { notIn: ['CANCELLED'] },
      },
    });

    if (existingInvoice) {
      throw new Error(`Invoice already exists for this booking: ${existingInvoice.invoiceNumber}`);
    }

    // Generate invoice number
    const invoiceNumber = await generateInvoiceNumber();

    // Calculate amount from booking
    let amount = booking.totalPrice;

    // Apply discount if provided
    if (data.discount && data.discount > 0) {
      amount = amount * (1 - data.discount / 100);
    }

    // Create invoice
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        bookingId: data.bookingId,
        clientId: data.clientId,
        amount,
        currency: 'USD',
        issueDate: new Date(),
        dueDate: new Date(data.dueDate),
        status: 'DRAFT',
        notes: data.notes,
      },
      include: {
        client: true,
        booking: true,
        payments: true,
      },
    });

    // Log audit
    await this.logAudit('INVOICE_CREATED', invoice.id, createdBy, { invoiceNumber, amount });

    return invoice;
  }

  /**
   * Update invoice (only DRAFT status)
   */
  async update(id: string, data: UpdateInvoiceData, updatedBy: string) {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    if (invoice.status !== 'DRAFT') {
      throw new Error('Only draft invoices can be updated');
    }

    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: {
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        notes: data.notes,
        updatedAt: new Date(),
      },
      include: {
        client: true,
        booking: true,
        payments: true,
      },
    });

    // Log audit
    await this.logAudit('INVOICE_UPDATED', id, updatedBy, data);

    return updatedInvoice;
  }

  /**
   * Send invoice to client (change status to SENT/UNPAID)
   */
  async send(id: string, sentBy: string) {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        client: true,
        booking: true,
        payments: true,
      },
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    if (invoice.status !== 'DRAFT') {
      throw new Error('Only draft invoices can be sent');
    }

    // Generate PDF
    const pdfBuffer = await generateInvoicePDF(invoice as any);

    // TODO: Save PDF to storage and get URL
    // const pdfUrl = await uploadPdfToStorage(pdfBuffer, `invoices/${invoice.invoiceNumber}.pdf`);

    // Update invoice status
    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: {
        status: 'UNPAID',
        // pdfUrl,
        updatedAt: new Date(),
      },
      include: {
        client: true,
        booking: true,
        payments: true,
      },
    });

    // TODO: Send email with PDF attachment
    // await sendInvoiceEmail(updatedInvoice, pdfBuffer);

    // Log audit
    await this.logAudit('INVOICE_SENT', id, sentBy, { clientEmail: invoice.client.email });

    return {
      ...updatedInvoice,
      message: `Invoice sent to ${invoice.client.email}`,
    };
  }

  /**
   * Mark invoice as paid
   */
  async markPaid(id: string, paymentData: PaymentData, markedBy: string) {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { payments: true },
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    if (invoice.status === 'CANCELLED') {
      throw new Error('Cannot add payment to cancelled invoice');
    }

    if (invoice.status === 'PAID') {
      throw new Error('Invoice is already fully paid');
    }

    // Validate payment amount
    const currentPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
    const remaining = invoice.amount - currentPaid;

    if (paymentData.amount > remaining + 0.01) {
      throw new Error(`Payment amount exceeds remaining balance of $${remaining.toFixed(2)}`);
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        invoiceId: id,
        amount: paymentData.amount,
        currency: invoice.currency,
        method: paymentData.paymentMethod,
        reference: paymentData.reference,
        notes: paymentData.notes,
        paidAt: new Date(paymentData.paymentDate),
      },
    });

    // Check if fully paid
    const totalPaid = currentPaid + paymentData.amount;
    const isFullyPaid = totalPaid >= invoice.amount - 0.01;

    // Update invoice status
    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: {
        status: isFullyPaid ? 'PAID' : invoice.status,
        paidDate: isFullyPaid ? new Date(paymentData.paymentDate) : null,
        updatedAt: new Date(),
      },
      include: {
        client: true,
        booking: true,
        payments: true,
      },
    });

    // Update client total revenue
    await prisma.client.update({
      where: { id: invoice.clientId },
      data: {
        totalRevenue: { increment: paymentData.amount },
      },
    });

    // Log audit
    await this.logAudit('PAYMENT_RECORDED', id, markedBy, {
      paymentId: payment.id,
      amount: paymentData.amount,
      method: paymentData.paymentMethod,
      isFullyPaid,
    });

    return {
      invoice: updatedInvoice,
      payment,
      amountPaid: totalPaid,
      balance: invoice.amount - totalPaid,
    };
  }

  /**
   * Cancel invoice
   */
  async cancel(id: string, cancelledBy: string, reason?: string) {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { payments: true },
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    if (invoice.status === 'PAID') {
      throw new Error('Cannot cancel a paid invoice');
    }

    if (invoice.payments.length > 0) {
      throw new Error('Cannot cancel invoice with existing payments');
    }

    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        notes: reason ? `${invoice.notes || ''}\n\nAnulată: ${reason}`.trim() : invoice.notes,
        updatedAt: new Date(),
      },
      include: {
        client: true,
        booking: true,
        payments: true,
      },
    });

    // Log audit
    await this.logAudit('INVOICE_CANCELLED', id, cancelledBy, { reason });

    return updatedInvoice;
  }

  /**
   * Generate PDF for invoice
   */
  async generatePDF(id: string, userRole?: string, userClientId?: string) {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        client: true,
        booking: true,
        payments: true,
      },
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    // Permission check
    if (userRole === 'CLIENT' && userClientId && invoice.clientId !== userClientId) {
      throw new Error('Access denied');
    }

    const pdfBuffer = await generateInvoicePDF(invoice as any);

    return {
      buffer: pdfBuffer,
      filename: `${invoice.invoiceNumber}.pdf`,
      contentType: 'application/pdf',
    };
  }

  /**
   * Get invoice statistics
   */
  async getStats(clientId?: string): Promise<InvoiceStats> {
    const where = clientId ? { clientId } : {};

    // Get totals
    const [
      total,
      totalAmountResult,
      paidAmountResult,
      statusCounts,
      monthlyData,
    ] = await Promise.all([
      prisma.invoice.count({ where }),
      prisma.invoice.aggregate({
        where,
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: clientId ? { invoice: { clientId } } : {},
        _sum: { amount: true },
      }),
      prisma.invoice.groupBy({
        by: ['status'],
        where,
        _count: true,
      }),
      this.getMonthlyRevenue(clientId),
    ]);

    // Process status counts
    const byStatus = {
      draft: 0,
      unpaid: 0,
      paid: 0,
      overdue: 0,
      cancelled: 0,
    };

    statusCounts.forEach((sc) => {
      const key = sc.status.toLowerCase() as keyof typeof byStatus;
      if (key in byStatus) {
        byStatus[key] = sc._count;
      }
    });

    // Check for overdue invoices
    const overdueCount = await prisma.invoice.count({
      where: {
        ...where,
        status: { in: ['UNPAID', 'SENT'] },
        dueDate: { lt: new Date() },
      },
    });
    byStatus.overdue = overdueCount;

    return {
      total,
      totalAmount: totalAmountResult._sum.amount || 0,
      totalPaid: paidAmountResult._sum.amount || 0,
      totalOutstanding: (totalAmountResult._sum.amount || 0) - (paidAmountResult._sum.amount || 0),
      byStatus,
      monthlyRevenue: monthlyData,
    };
  }

  /**
   * Get monthly revenue data for charts
   */
  private async getMonthlyRevenue(clientId?: string) {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const where = {
      issueDate: { gte: sixMonthsAgo },
      ...(clientId ? { clientId } : {}),
    };

    const invoices = await prisma.invoice.findMany({
      where,
      select: {
        amount: true,
        issueDate: true,
        payments: {
          select: { amount: true },
        },
      },
    });

    // Group by month
    const monthlyMap = new Map<string, { amount: number; paid: number }>();

    invoices.forEach((inv) => {
      const month = inv.issueDate.toISOString().slice(0, 7); // YYYY-MM
      const current = monthlyMap.get(month) || { amount: 0, paid: 0 };
      current.amount += inv.amount;
      current.paid += inv.payments.reduce((sum, p) => sum + p.amount, 0);
      monthlyMap.set(month, current);
    });

    // Convert to array and sort
    return Array.from(monthlyMap.entries())
      .map(([month, data]) => ({
        month,
        amount: Math.round(data.amount * 100) / 100,
        paid: Math.round(data.paid * 100) / 100,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  /**
   * Update overdue invoices status
   */
  async updateOverdueStatus() {
    const now = new Date();

    const result = await prisma.invoice.updateMany({
      where: {
        status: { in: ['UNPAID', 'SENT'] },
        dueDate: { lt: now },
      },
      data: {
        status: 'OVERDUE',
      },
    });

    return result.count;
  }

  /**
   * Log audit trail
   */
  private async logAudit(action: string, invoiceId: string, userId: string, details: any) {
    try {
      await prisma.auditLog.create({
        data: {
          userId,
          action,
          entityType: 'INVOICE',
          entityId: invoiceId,
          changes: JSON.stringify(details),
          ipAddress: '',
        },
      });
    } catch (error) {
      console.error('Failed to log audit:', error);
    }
  }
}

export const invoicesService = new InvoicesService();
export default invoicesService;
