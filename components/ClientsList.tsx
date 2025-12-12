
import React from 'react';
import { Card } from './ui/Card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from './ui/Table';
import { Button } from './ui/Button';
import { PlusIcon } from './icons';
import { useToast } from './ui/Toast';

const mockClients = [
    { id: 4, name: 'Client User', company: 'Client Company LLC', email: 'client@example.com', bookings: 3 },
    { id: 5, name: 'John Doe', company: 'Moldova Imports', email: 'john@moldovaimports.md', bookings: 1 },
    { id: 6, name: 'Jane Smith', company: 'EuroTrade SRL', email: 'jane@eurotrade.md', bookings: 1 },
    { id: 7, name: 'Peter Jones', company: 'Global Exports', email: 'peter@globalexports.com', bookings: 1 },
];

const ClientsList = () => {
  const { addToast } = useToast();

  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <h3 className="text-2xl font-semibold text-neutral-800 dark:text-neutral-100">Clienți</h3>
          <Button onClick={() => addToast('Funcționalitate neimplementată: Adaugă Client Nou')}>
              <PlusIcon className="mr-2 h-4 w-4" />
              Client Nou
          </Button>
      </div>

      <Card>
        <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Nume Companie</TableHead>
                        <TableHead>Persoană de Contact</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Total Rezervări</TableHead>
                        <TableHead>Acțiuni</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {mockClients.map(client => (
                        <TableRow key={client.id}>
                            <TableCell className="font-medium">{client.company}</TableCell>
                            <TableCell>{client.name}</TableCell>
                            <TableCell>{client.email}</TableCell>
                            <TableCell>{client.bookings}</TableCell>
                            <TableCell>
                                <Button variant="secondary" size="sm" onClick={() => addToast(`Funcționalitate neimplementată: Vezi detalii pentru ${client.name}`)}>Vezi</Button>
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

export default ClientsList;