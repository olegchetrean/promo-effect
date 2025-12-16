import React, { useState, useEffect, useCallback } from 'react';
import { Card } from './ui/Card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from './ui/Table';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Badge } from './ui/Badge';
import { PlusIcon, DownloadIcon, SearchIcon, RefreshCwIcon, XIcon, SendIcon, CheckIcon, EyeIcon } from './icons';
import { useToast } from './ui/Toast';
import invoicesService, { 
  Invoice, 
  InvoiceStats, 
  InvoiceStatus,
  CreateInvoiceData,
  PaymentInput 
} from '../services/invoices';
import clientsService, { Client } from '../services/clients';

// ============================================
// STATUS MAPS
// ============================================

const statusVariantMap: Record<InvoiceStatus, 'green' | 'red' | 'blue' | 'yellow' | 'default'> = {
  'PAID': 'green',
  'OVERDUE': 'red',
  'UNPAID': 'yellow',
  'SENT': 'blue',
  'DRAFT': 'default',
  'CANCELLED': 'default',
};

const statusTextMap: Record<InvoiceStatus, string> = {
  'PAID': 'Achitată',
  'OVERDUE': 'Scadentă',
  'UNPAID': 'Neachitată',
  'SENT': 'Trimisă',
  'DRAFT': 'Ciornă',
  'CANCELLED': 'Anulată',
};

// ============================================
// CREATE INVOICE MODAL
// ============================================

interface CreateInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateInvoiceData) => Promise<void>;
  isLoading: boolean;
  clients: Client[];
  bookings: any[];
}

const CreateInvoiceModal: React.FC<CreateInvoiceModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  clients,
  bookings,
}) => {
  const [formData, setFormData] = useState<CreateInvoiceData>({
    bookingId: '',
    clientId: '',
    dueDate: '',
    notes: '',
    discount: 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'discount' ? parseFloat(value) || 0 : value,
    }));
  };

  // Set default due date (30 days from now)
  useEffect(() => {
    if (isOpen && !formData.dueDate) {
      const defaultDue = new Date();
      defaultDue.setDate(defaultDue.getDate() + 30);
      setFormData(prev => ({
        ...prev,
        dueDate: defaultDue.toISOString().split('T')[0],
      }));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-neutral-800 rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b dark:border-neutral-700">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            Factură Nouă
          </h3>
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-700">
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Client *
            </label>
            <select
              name="clientId"
              value={formData.clientId}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
            >
              <option value="">Selectează client</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.companyName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Booking *
            </label>
            <select
              name="bookingId"
              value={formData.bookingId}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
            >
              <option value="">Selectează booking</option>
              {bookings
                .filter(b => !formData.clientId || b.clientId === formData.clientId)
                .map(booking => (
                  <option key={booking.id} value={booking.id}>
                    {booking.id} - {booking.portOrigin} → {booking.portDestination}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Data Scadentă *
            </label>
            <Input
              type="date"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleChange}
              required
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Discount (%)
            </label>
            <Input
              type="number"
              name="discount"
              value={formData.discount || ''}
              onChange={handleChange}
              min="0"
              max="100"
              step="0.1"
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Note
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
              placeholder="Note adiționale pentru factură..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t dark:border-neutral-700">
            <Button type="button" variant="secondary" onClick={onClose}>
              Anulează
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Se creează...' : 'Creează Factură'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================
// PAYMENT MODAL
// ============================================

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PaymentInput) => Promise<void>;
  isLoading: boolean;
  invoice: Invoice | null;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  invoice,
}) => {
  const [formData, setFormData] = useState<PaymentInput>({
    amount: 0,
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'BANK_TRANSFER',
    reference: '',
    notes: '',
  });

  useEffect(() => {
    if (invoice && isOpen) {
      const balance = invoice.balance ?? (invoice.amount - (invoice.amountPaid || 0));
      setFormData(prev => ({
        ...prev,
        amount: balance,
      }));
    }
  }, [invoice, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'amount' ? parseFloat(value) || 0 : value,
    }));
  };

  if (!isOpen || !invoice) return null;

  const balance = invoice.balance ?? (invoice.amount - (invoice.amountPaid || 0));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-neutral-800 rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b dark:border-neutral-700">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            Înregistrare Plată
          </h3>
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-700">
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <span className="font-medium">Factură:</span> {invoice.invoiceNumber}
            </p>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <span className="font-medium">Total:</span> ${invoice.amount.toFixed(2)}
            </p>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <span className="font-medium">De plată:</span> ${balance.toFixed(2)}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Sumă *
            </label>
            <Input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              required
              min="0.01"
              max={balance}
              step="0.01"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Data Plății *
            </label>
            <Input
              type="date"
              name="paymentDate"
              value={formData.paymentDate}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Metodă de Plată *
            </label>
            <select
              name="paymentMethod"
              value={formData.paymentMethod}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
            >
              <option value="BANK_TRANSFER">Transfer Bancar</option>
              <option value="CASH">Numerar</option>
              <option value="CARD">Card</option>
              <option value="OTHER">Altele</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Referință
            </label>
            <Input
              type="text"
              name="reference"
              value={formData.reference}
              onChange={handleChange}
              placeholder="Nr. tranzacție, chitanță, etc."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Note
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={2}
              className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t dark:border-neutral-700">
            <Button type="button" variant="secondary" onClick={onClose}>
              Anulează
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Se procesează...' : 'Înregistrează Plata'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================
// INVOICE DETAIL MODAL
// ============================================

interface InvoiceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  onSend: (id: string) => void;
  onMarkPaid: (invoice: Invoice) => void;
  onDownload: (id: string) => void;
  onCancel: (id: string) => void;
}

const InvoiceDetailModal: React.FC<InvoiceDetailModalProps> = ({
  isOpen,
  onClose,
  invoice,
  onSend,
  onMarkPaid,
  onDownload,
  onCancel,
}) => {
  if (!isOpen || !invoice) return null;

  const balance = invoice.balance ?? (invoice.amount - (invoice.amountPaid || 0));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-neutral-800 rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b dark:border-neutral-700">
          <div>
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              {invoice.invoiceNumber}
            </h3>
            <Badge variant={statusVariantMap[invoice.status]}>
              {statusTextMap[invoice.status]}
            </Badge>
          </div>
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-700">
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 space-y-6">
          {/* Client Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-2">Client</h4>
              <p className="font-medium text-neutral-900 dark:text-neutral-100">{invoice.client.companyName}</p>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">{invoice.client.email}</p>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">{invoice.client.phone}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-2">Booking</h4>
              <p className="font-medium text-neutral-900 dark:text-neutral-100">{invoice.bookingId}</p>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                {invoice.booking?.portOrigin} → {invoice.booking?.portDestination}
              </p>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <h4 className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Data Emiterii</h4>
              <p className="text-neutral-900 dark:text-neutral-100">
                {new Date(invoice.issueDate).toLocaleDateString('ro-RO')}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Data Scadentă</h4>
              <p className="text-neutral-900 dark:text-neutral-100">
                {new Date(invoice.dueDate).toLocaleDateString('ro-RO')}
              </p>
            </div>
            {invoice.paidDate && (
              <div>
                <h4 className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Data Plății</h4>
                <p className="text-green-600 dark:text-green-400">
                  {new Date(invoice.paidDate).toLocaleDateString('ro-RO')}
                </p>
              </div>
            )}
          </div>

          {/* Amounts */}
          <div className="bg-neutral-50 dark:bg-neutral-900 rounded-lg p-4">
            <div className="flex justify-between mb-2">
              <span className="text-neutral-600 dark:text-neutral-400">Subtotal:</span>
              <span className="text-neutral-900 dark:text-neutral-100">
                ${(invoice.subtotal || invoice.amount / 1.19).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-neutral-600 dark:text-neutral-400">TVA (19%):</span>
              <span className="text-neutral-900 dark:text-neutral-100">
                ${(invoice.taxAmount || invoice.amount - invoice.amount / 1.19).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between font-semibold text-lg border-t dark:border-neutral-700 pt-2 mt-2">
              <span className="text-neutral-900 dark:text-neutral-100">Total:</span>
              <span className="text-blue-600 dark:text-blue-400">
                ${invoice.amount.toFixed(2)} {invoice.currency}
              </span>
            </div>
            {invoice.amountPaid && invoice.amountPaid > 0 && (
              <>
                <div className="flex justify-between mt-2">
                  <span className="text-green-600 dark:text-green-400">Achitat:</span>
                  <span className="text-green-600 dark:text-green-400">
                    -${invoice.amountPaid.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span className="text-red-600 dark:text-red-400">De plată:</span>
                  <span className="text-red-600 dark:text-red-400">
                    ${balance.toFixed(2)}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Payments History */}
          {invoice.payments && invoice.payments.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-2">
                Istoric Plăți
              </h4>
              <div className="space-y-2">
                {invoice.payments.map(payment => (
                  <div
                    key={payment.id}
                    className="flex justify-between items-center bg-green-50 dark:bg-green-900/20 rounded-lg p-3"
                  >
                    <div>
                      <p className="font-medium text-green-700 dark:text-green-300">
                        ${payment.amount.toFixed(2)}
                      </p>
                      <p className="text-sm text-green-600 dark:text-green-400">
                        {payment.method} • {new Date(payment.paidAt).toLocaleDateString('ro-RO')}
                      </p>
                      {payment.reference && (
                        <p className="text-xs text-green-500">Ref: {payment.reference}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {invoice.notes && (
            <div>
              <h4 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-2">Note</h4>
              <p className="text-neutral-600 dark:text-neutral-400 whitespace-pre-wrap">{invoice.notes}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-4 border-t dark:border-neutral-700">
            <Button variant="secondary" onClick={() => onDownload(invoice.id)}>
              <DownloadIcon className="h-4 w-4 mr-2" />
              Descarcă PDF
            </Button>

            {invoice.status === 'DRAFT' && (
              <Button onClick={() => onSend(invoice.id)}>
                <SendIcon className="h-4 w-4 mr-2" />
                Trimite
              </Button>
            )}

            {['DRAFT', 'UNPAID', 'SENT', 'OVERDUE'].includes(invoice.status) && balance > 0 && (
              <Button variant="secondary" onClick={() => onMarkPaid(invoice)}>
                <CheckIcon className="h-4 w-4 mr-2" />
                Înregistrează Plată
              </Button>
            )}

            {['DRAFT', 'UNPAID'].includes(invoice.status) && (
              <Button
                variant="ghost"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => onCancel(invoice.id)}
              >
                <XIcon className="h-4 w-4 mr-2" />
                Anulează
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

const InvoicesList: React.FC = () => {
  const { addToast } = useToast();
  
  // Data states
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [stats, setStats] = useState<InvoiceStats | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  
  // UI states
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Fetch invoices
  const fetchInvoices = useCallback(async () => {
    setIsLoading(true);
    try {
      const [invoicesData, statsData] = await Promise.all([
        invoicesService.getInvoices({
          page: currentPage,
          limit: pageSize,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          search: searchTerm || undefined,
        }),
        invoicesService.getStats(),
      ]);
      
      setInvoices(invoicesData.invoices);
      setTotalPages(invoicesData.totalPages);
      setStats(statsData);
    } catch (error: any) {
      console.error('Failed to fetch invoices:', error);
      addToast(error.response?.data?.error || 'Eroare la încărcarea facturilor', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, statusFilter, searchTerm, addToast]);

  // Fetch clients and bookings for create modal
  const fetchClientsAndBookings = async () => {
    try {
      const [clientsData] = await Promise.all([
        clientsService.getClients({ limit: 100 }),
      ]);
      setClients(clientsData.clients);
    } catch (error) {
      console.error('Failed to fetch clients:', error);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  useEffect(() => {
    fetchClientsAndBookings();
  }, []);

  // Search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      fetchInvoices();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Handlers
  const handleCreateInvoice = async (data: CreateInvoiceData) => {
    setIsSubmitting(true);
    try {
      await invoicesService.createInvoice(data);
      addToast('Factură creată cu succes!', 'success');
      setShowCreateModal(false);
      fetchInvoices();
    } catch (error: any) {
      addToast(error.response?.data?.error || 'Eroare la crearea facturii', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendInvoice = async (id: string) => {
    if (!confirm('Trimiteți această factură clientului?')) return;
    
    try {
      const result = await invoicesService.sendInvoice(id);
      addToast(result.message || 'Factură trimisă cu succes!', 'success');
      fetchInvoices();
      setShowDetailModal(false);
    } catch (error: any) {
      addToast(error.response?.data?.error || 'Eroare la trimiterea facturii', 'error');
    }
  };

  const handleMarkPaid = async (payment: PaymentInput) => {
    if (!selectedInvoice) return;
    
    setIsSubmitting(true);
    try {
      await invoicesService.markAsPaid(selectedInvoice.id, payment);
      addToast('Plată înregistrată cu succes!', 'success');
      setShowPaymentModal(false);
      setSelectedInvoice(null);
      fetchInvoices();
    } catch (error: any) {
      addToast(error.response?.data?.error || 'Eroare la înregistrarea plății', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadPDF = async (id: string) => {
    try {
      const blob = await invoicesService.downloadPDF(id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const invoice = invoices.find(i => i.id === id);
      link.download = invoice ? `${invoice.invoiceNumber}.pdf` : `invoice-${id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      addToast('PDF descărcat!', 'success');
    } catch (error: any) {
      addToast(error.response?.data?.error || 'Eroare la descărcarea PDF', 'error');
    }
  };

  const handleCancelInvoice = async (id: string) => {
    const reason = prompt('Motivul anulării (opțional):');
    if (reason === null) return;
    
    try {
      await invoicesService.cancelInvoice(id, reason || undefined);
      addToast('Factură anulată!', 'success');
      setShowDetailModal(false);
      fetchInvoices();
    } catch (error: any) {
      addToast(error.response?.data?.error || 'Eroare la anularea facturii', 'error');
    }
  };

  const openDetailModal = async (invoice: Invoice) => {
    try {
      const fullInvoice = await invoicesService.getInvoiceById(invoice.id);
      setSelectedInvoice(fullInvoice);
      setShowDetailModal(true);
    } catch (error: any) {
      addToast(error.response?.data?.error || 'Eroare la încărcarea facturii', 'error');
    }
  };

  const openPaymentModal = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowPaymentModal(true);
    setShowDetailModal(false);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h3 className="text-2xl font-semibold text-neutral-800 dark:text-neutral-100">Facturi</h3>
        <Button onClick={() => setShowCreateModal(true)}>
          <PlusIcon className="mr-2 h-4 w-4" />
          Factură Nouă
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Total Facturi</p>
            <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{stats.total}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Total Facturat</p>
            <p className="text-2xl font-bold text-blue-600">${stats.totalAmount.toFixed(2)}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Total Încasat</p>
            <p className="text-2xl font-bold text-green-600">${stats.totalPaid.toFixed(2)}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">De Încasat</p>
            <p className="text-2xl font-bold text-red-600">${stats.totalOutstanding.toFixed(2)}</p>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <Input
              placeholder="Caută după număr factură sau client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
          >
            <option value="all">Toate statusurile</option>
            <option value="DRAFT">Ciornă</option>
            <option value="UNPAID">Neachitată</option>
            <option value="PAID">Achitată</option>
            <option value="OVERDUE">Scadentă</option>
            <option value="CANCELLED">Anulată</option>
          </select>

          <Button variant="secondary" onClick={fetchInvoices} disabled={isLoading}>
            <RefreshCwIcon className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </Card>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nr. Factură</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Sumă</TableHead>
                <TableHead>Data Scadentă</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Acțiuni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <RefreshCwIcon className="h-6 w-6 animate-spin mx-auto text-neutral-400" />
                    <p className="mt-2 text-neutral-500">Se încarcă...</p>
                  </TableCell>
                </TableRow>
              ) : invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <p className="text-neutral-500">Nu există facturi</p>
                  </TableCell>
                </TableRow>
              ) : (
                invoices.map(invoice => (
                  <TableRow key={invoice.id} className="cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800">
                    <TableCell className="font-mono font-medium">{invoice.invoiceNumber}</TableCell>
                    <TableCell>{invoice.client?.companyName || '-'}</TableCell>
                    <TableCell>${invoice.amount.toFixed(2)}</TableCell>
                    <TableCell>{new Date(invoice.dueDate).toLocaleDateString('ro-RO')}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariantMap[invoice.status]}>
                        {statusTextMap[invoice.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => openDetailModal(invoice)}
                        >
                          <EyeIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDownloadPDF(invoice.id)}
                        >
                          <DownloadIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t dark:border-neutral-700">
            <p className="text-sm text-neutral-500">
              Pagina {currentPage} din {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Următor
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Modals */}
      <CreateInvoiceModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateInvoice}
        isLoading={isSubmitting}
        clients={clients}
        bookings={bookings}
      />

      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setSelectedInvoice(null);
        }}
        onSubmit={handleMarkPaid}
        isLoading={isSubmitting}
        invoice={selectedInvoice}
      />

      <InvoiceDetailModal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedInvoice(null);
        }}
        invoice={selectedInvoice}
        onSend={handleSendInvoice}
        onMarkPaid={openPaymentModal}
        onDownload={handleDownloadPDF}
        onCancel={handleCancelInvoice}
      />
    </div>
  );
};

export default InvoicesList;