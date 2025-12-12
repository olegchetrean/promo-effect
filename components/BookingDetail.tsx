import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { User, Booking, BookingStatus, UserRole } from '../types';
import { SHIPPING_LINES, ORIGIN_PORTS, DESTINATION_PORTS, CONTAINER_TYPES } from '../constants';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { useToast } from './ui/Toast';

interface BookingDetailProps {
    user: User;
}

// Mock function to fetch booking data
const getBookingById = (id: number): Booking | undefined => {
    // In a real app, this would be an API call.
    const allBookings: Booking[] = [
        { id: 1, booking_number: 'PE-2025-001234', client_id: 4, client_name: 'Client User', status: BookingStatus.IN_TRANSIT, origin_port: 'Shanghai', destination_port: 'Chișinău', shipping_line: 'MSC', container_type: '40ft_HC', quoted_price_usd: 2100, container_number: 'MSCU1234567', estimated_arrival_date: '2025-11-15', created_at: '2025-10-10' },
        { id: 2, booking_number: 'PE-2025-001235', client_id: 5, client_name: 'Moldova Imports', status: BookingStatus.CONFIRMED, origin_port: 'Qingdao', destination_port: 'Chișinău', shipping_line: 'Maersk', container_type: '20ft', quoted_price_usd: 1800, created_at: '2025-10-12' },
    ];
    return allBookings.find(b => b.id === id);
}

const BookingDetail: React.FC<BookingDetailProps> = ({ user }) => {
    const { bookingId } = useParams<{ bookingId: string }>();
    const navigate = useNavigate();
    const location = useLocation();

    const isNew = bookingId === 'new';
    const isClient = user.role === UserRole.CLIENT;
    const { addToast } = useToast();

    const initialBookingState = useMemo(() => {
        const initialData = location.state?.initialData;
        if (isNew) {
            return {
                origin_port: ORIGIN_PORTS[0],
                destination_port: DESTINATION_PORTS[0],
                container_type: CONTAINER_TYPES[0],
                shipping_line: SHIPPING_LINES[0],
                client_name: isClient ? user.name : '',
                status: BookingStatus.DRAFT,
                ...initialData,
            };
        }
        return getBookingById(parseInt(bookingId || '')) || {};
    }, [bookingId, isNew, isClient, user.name, location.state]);

    const [bookingData, setBookingData] = useState<Partial<Booking>>(initialBookingState);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const isReadOnly = !isNew && isClient;
    const isAdmin = [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER].includes(user.role);

    const onBack = () => navigate('/dashboard/bookings');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setTimeout(() => {
            console.log('Submitted data:', bookingData);
            setIsSubmitting(false);
            addToast(`Rezervare ${isNew ? 'trimisă' : 'actualizată'} cu succes!`, 'success');
            onBack();
        }, 1500);
    };
    
    const Select = ({...props}) => <select {...props} className="w-full mt-1 p-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-neutral-100 dark:disabled:bg-neutral-700" />;

    return (
        <div className="space-y-5">
            <div className="flex items-center">
                <button onClick={onBack} className="p-2 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700 mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                </button>
                <h3 className="text-2xl font-semibold text-neutral-800 dark:text-neutral-100">{isNew ? 'Cerere de Rezervare Nouă' : `Rezervare ${bookingData.booking_number}`}</h3>
            </div>

            <form onSubmit={handleSubmit}>
                <Card className="space-y-6">
                    <div>
                        <h4 className="text-base font-semibold text-neutral-700 dark:text-neutral-200 border-b border-neutral-200 dark:border-neutral-700 pb-2 mb-4">Detalii Rută</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div>
                                <label className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Port Origine</label>
                                <Select disabled={isReadOnly} value={bookingData.origin_port} onChange={e => setBookingData({...bookingData, origin_port: e.target.value})}>
                                    {ORIGIN_PORTS.map(p => <option key={p} value={p}>{p}</option>)}
                                </Select>
                            </div>
                             <div>
                                <label className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Port Destinație</label>
                                <Select disabled value={bookingData.destination_port}>
                                    {DESTINATION_PORTS.map(p => <option key={p} value={p}>{p}</option>)}
                                </Select>
                            </div>
                        </div>
                    </div>

                     <div>
                        <h4 className="text-base font-semibold text-neutral-700 dark:text-neutral-200 border-b border-neutral-200 dark:border-neutral-700 pb-2 mb-4">Detalii Container</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div>
                                <label className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Tip Container</label>
                                <Select disabled={isReadOnly} value={bookingData.container_type} onChange={e => setBookingData({...bookingData, container_type: e.target.value})}>
                                    {CONTAINER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                </Select>
                            </div>
                             <div>
                                <label className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Linie Maritimă Preferată</label>
                                <Select disabled={isReadOnly} value={bookingData.shipping_line} onChange={e => setBookingData({...bookingData, shipping_line: e.target.value})}>
                                    {SHIPPING_LINES.map(l => <option key={l} value={l}>{l}</option>)}
                                </Select>
                            </div>
                             <div>
                                <label className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Număr Container (Opțional)</label>
                                <Input type="text" value={bookingData.container_number || ''} onChange={e => setBookingData({...bookingData, container_number: e.target.value})} className="font-mono" disabled={isReadOnly} />
                            </div>
                        </div>
                    </div>

                    {isAdmin && !isNew && (
                         <div>
                            <h4 className="text-base font-semibold text-neutral-700 dark:text-neutral-200 border-b border-neutral-200 dark:border-neutral-700 pb-2 mb-4">Informații Administrative</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Stare Rezervare</label>
                                    <Select value={bookingData.status} onChange={e => setBookingData({...bookingData, status: e.target.value as BookingStatus})}>
                                        {Object.values(BookingStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                    </Select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Număr Container</label>
                                    <Input type="text" value={bookingData.container_number || ''} onChange={e => setBookingData({...bookingData, container_number: e.target.value})} className="font-mono" />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Preț Ofertat (USD)</label>
                                    <Input type="number" value={bookingData.quoted_price_usd || ''} onChange={e => setBookingData({...bookingData, quoted_price_usd: parseFloat(e.target.value)})} />
                                </div>
                            </div>
                        </div>
                    )}

                    {!isReadOnly && (
                        <div className="flex justify-end pt-4">
                            <Button type="button" variant="secondary" onClick={onBack} className="mr-4">Anulează</Button>
                            <Button type="submit" disabled={isSubmitting} loading={isSubmitting}>
                                {isNew ? 'Trimite Cererea' : 'Salvează Modificările'}
                            </Button>
                        </div>
                    )}
                </Card>
            </form>
        </div>
    );
};

export default BookingDetail;