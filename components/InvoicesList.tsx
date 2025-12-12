
import React from 'react';
import { Card } from './ui/Card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from './ui/Table';
import { Button } from './ui/Button';
import { PlusIcon, DownloadIcon } from './icons';
import { Badge } from './ui/Badge';
import { useToast } from './ui/Toast';

type InvoiceStatus = 'PAID' | 'OVERDUE' | 'ISSUED' | 'DRAFT';

const mockInvoices = [
    { id: 1, invoice_number: 'INV-2025-08-001', client_name: 'Client Company LLC', amount_usd: 2100, due_date: '2025-11-30', status: 'PAID' as InvoiceStatus },
    { id: 2, invoice_number: 'INV-2025-08-002', client_name: 'Moldova Imports', amount_usd: 1800, due_date: '2025-10-20', status: 'OVERDUE' as InvoiceStatus },
    { id: 3, invoice_number: 'INV-2025-09-003', client_name: 'EuroTrade SRL', amount_usd: 2200, due_date: '2025-12-15', status: 'ISSUED' as InvoiceStatus },
    { id: 4, invoice_number: 'INV-2025-09-004', client_name: 'Global Exports', amount_usd: 2300, due_date: '2025-12-20', status: 'DRAFT' as InvoiceStatus },
];

const statusVariantMap: { [key in InvoiceStatus]: 'green' | 'red' | 'blue' | 'default' } = {
    'PAID': 'green',
    'OVERDUE': 'red',
    'ISSUED': 'blue',
    'DRAFT': 'default',
};

const statusTextMap: { [key in InvoiceStatus]: string } = {
    'PAID': 'Plătită',
    'OVERDUE': 'Scadentă',
    'ISSUED': 'Emisă',
    'DRAFT': 'Ciornă',
};


const InvoicesList = () => {
  const { addToast } = useToast();
  
  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <h3 className="text-2xl font-semibold text-neutral-800 dark:text-neutral-100">Facturi</h3>
          <Button onClick={() => addToast('Funcționalitate neimplementată: Adaugă Factură Nouă')}>
              <PlusIcon className="mr-2 h-4 w-4" />
              Factură Nouă
          </Button>
      </div>

      <Card>
        <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Nr. Factură</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Sumă (USD)</TableHead>
                        <TableHead>Data Scadentă</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Acțiuni</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {mockInvoices.map(invoice => (
                        <TableRow key={invoice.id}>
                            <TableCell className="font-mono font-medium">{invoice.invoice_number}</TableCell>
                            <TableCell>{invoice.client_name}</TableCell>
                            <TableCell>${invoice.amount_usd.toFixed(2)}</TableCell>
                            <TableCell>{invoice.due_date}</TableCell>
                            <TableCell><Badge variant={statusVariantMap[invoice.status]}>{statusTextMap[invoice.status]}</Badge></TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <Button variant="secondary" size="sm" onClick={(e) => { e.stopPropagation(); addToast(`Funcționalitate neimplementată: Vezi detalii pentru factura ${invoice.invoice_number}`); }}>Vezi</Button>
                                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); addToast(`Funcționalitate neimplementată: Descarcă factura ${invoice.invoice_number}`); }}><DownloadIcon className="h-4 w-4" /></Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
      </Card>
    </div>
  );
};

export default InvoicesList;