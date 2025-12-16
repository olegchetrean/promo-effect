import api from './api';

// ============================================
// TYPES
// ============================================

export type InvoiceStatus = 'DRAFT' | 'UNPAID' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';

export interface Client {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
}

export interface Booking {
  id: string;
  portOrigin: string;
  portDestination: string;
  containerType: string;
  status: string;
}

export interface Payment {
  id: string;
  amount: number;
  paidAt: string;
  method: string;
  reference?: string;
  notes?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  bookingId: string;
  clientId: string;
  amount: number;
  currency: string;
  issueDate: string;
  dueDate: string;
  paidDate?: string;
  status: InvoiceStatus;
  pdfUrl?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  client: Client;
  booking: Booking;
  payments: Payment[];
  amountPaid?: number;
  balance?: number;
  subtotal?: number;
  taxRate?: number;
  taxAmount?: number;
}

export interface InvoicesQueryParams {
  page?: number;
  limit?: number;
  status?: string;
  clientId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface InvoicesResponse {
  invoices: Invoice[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  summary: {
    totalAmount: number;
    totalPaid: number;
    totalOutstanding: number;
  };
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

export interface CreateInvoiceData {
  bookingId: string;
  clientId: string;
  dueDate: string;
  notes?: string;
  discount?: number;
}

export interface UpdateInvoiceData {
  dueDate?: string;
  notes?: string;
  discount?: number;
}

export interface PaymentInput {
  amount: number;
  paymentDate: string;
  paymentMethod: 'BANK_TRANSFER' | 'CASH' | 'CARD' | 'OTHER';
  reference?: string;
  notes?: string;
}

// ============================================
// SERVICE
// ============================================

const invoicesService = {
  /**
   * Get all invoices with pagination and filters
   */
  getInvoices: async (params?: InvoicesQueryParams): Promise<InvoicesResponse> => {
    const queryParams = new URLSearchParams();
    
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status && params.status !== 'all') queryParams.append('status', params.status);
    if (params?.clientId) queryParams.append('clientId', params.clientId);
    if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom);
    if (params?.dateTo) queryParams.append('dateTo', params.dateTo);
    if (params?.search) queryParams.append('search', params.search);

    const queryString = queryParams.toString();
    const url = `/invoices${queryString ? `?${queryString}` : ''}`;

    const response = await api.get(url);
    return response.data;
  },

  /**
   * Get single invoice by ID
   */
  getInvoiceById: async (id: string): Promise<Invoice> => {
    const response = await api.get(`/invoices/${id}`);
    return response.data;
  },

  /**
   * Get invoice statistics
   */
  getStats: async (): Promise<InvoiceStats> => {
    const response = await api.get('/invoices/stats');
    return response.data;
  },

  /**
   * Create new invoice
   */
  createInvoice: async (data: CreateInvoiceData): Promise<Invoice> => {
    const response = await api.post('/invoices', data);
    return response.data;
  },

  /**
   * Update invoice (only DRAFT status)
   */
  updateInvoice: async (id: string, data: UpdateInvoiceData): Promise<Invoice> => {
    const response = await api.put(`/invoices/${id}`, data);
    return response.data;
  },

  /**
   * Send invoice to client (changes status to UNPAID)
   */
  sendInvoice: async (id: string): Promise<{ invoice: Invoice; message: string }> => {
    const response = await api.post(`/invoices/${id}/send`);
    return response.data;
  },

  /**
   * Mark invoice as paid
   */
  markAsPaid: async (id: string, payment: PaymentInput): Promise<{
    invoice: Invoice;
    payment: Payment;
    amountPaid: number;
    balance: number;
  }> => {
    const response = await api.post(`/invoices/${id}/mark-paid`, payment);
    return response.data;
  },

  /**
   * Cancel invoice
   */
  cancelInvoice: async (id: string, reason?: string): Promise<{ message: string; invoice: Invoice }> => {
    const response = await api.delete(`/invoices/${id}`, { data: { reason } });
    return response.data;
  },

  /**
   * Download invoice PDF
   */
  downloadPDF: async (id: string): Promise<Blob> => {
    const response = await api.get(`/invoices/${id}/pdf`, {
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Update overdue invoices (admin only)
   */
  updateOverdue: async (): Promise<{ message: string }> => {
    const response = await api.post('/invoices/update-overdue');
    return response.data;
  },
};

export default invoicesService;
