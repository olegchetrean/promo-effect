import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Container, TrackingStatus, TrackingEvent } from '../types';
import { Card } from './ui/Card';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { SearchIcon } from './icons';
import { TrackingTimeline } from './TrackingTimeline';

const mockContainerData: { [key: string]: Container } = {
    "MSCU1234567": {
        id: 1,
        booking_id: 101,
        container_number: 'MSCU1234567',
        shipping_line: 'MSC',
        current_status: TrackingStatus.IN_TRANSIT,
        current_location: 'Suez Canal',
        vessel_name: 'MSC Oscar',
        estimated_arrival_date: '2025-11-15',
        is_refrigerated: false,
        is_urgent: false,
        priority_level: 5,
        tracking_history: ([
            { id: 7, title: "Rezervare Confirmată", description: "Rezervare creată în sistem", location: "System", timestamp: "2025-10-05T09:00:00Z", status: 'completed' },
            { id: 6, title: "Intrare în Terminal", description: "Container recepționat la terminal", location: "Terminal Shanghai", timestamp: "2025-10-08T14:00:00Z", status: 'completed' },
            { id: 5, title: "Încărcat pe Navă", description: "Container încărcat pe nava MSC Oscar", location: "Portul Shanghai", timestamp: "2025-10-09T10:00:00Z", status: 'completed' },
            { id: 4, title: "Navă Plecată", description: "Nava a părăsit portul", location: "Portul Shanghai", timestamp: "2025-10-10T18:30:00Z", status: 'completed' },
            { id: 3, title: "În Tranzit", description: "Nava este în drum", location: "Marea Mediterană", timestamp: "2025-11-05T12:00:00Z", status: 'current' },
            { id: 2, title: "Sosire Navă", description: "Nava este așteptată să sosească", location: "Portul Constanța", timestamp: "2025-11-14T22:00:00Z", status: 'pending' },
            { id: 1, title: "Container Descărcat", description: "Containerul va fi descărcat de pe navă", location: "Portul Constanța", timestamp: "2025-11-15T08:00:00Z", status: 'pending' },
        ] as TrackingEvent[]).reverse()
    },
    "TEMU1234567": {
        id: 2,
        booking_id: 102,
        container_number: 'TEMU1234567',
        shipping_line: 'MSC',
        current_status: TrackingStatus.IN_TRANSIT,
        current_location: 'Atlantic Ocean',
        vessel_name: 'MSC Zoe',
        estimated_arrival_date: '2025-12-01',
        is_refrigerated: true,
        is_urgent: true,
        priority_level: 1,
        tracking_history: []
    }
};

const statusVariantMap: { [key in TrackingStatus]: 'blue' | 'yellow' | 'green' | 'red' | 'purple' | 'teal' | 'default' } = {
    [TrackingStatus.BOOKED]: 'default',
    [TrackingStatus.GATE_IN]: 'purple',
    [TrackingStatus.LOADED]: 'purple',
    [TrackingStatus.DEPARTED]: 'blue',
    [TrackingStatus.IN_TRANSIT]: 'yellow',
    [TrackingStatus.ARRIVED]: 'teal',
    [TrackingStatus.DISCHARGED]: 'teal',
    [TrackingStatus.GATE_OUT]: 'green',
    [TrackingStatus.DELIVERED]: 'green',
};

const TrackingView = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [containerNumber, setContainerNumber] = useState(searchParams.get('container') || '');
    const [trackingData, setTrackingData] = useState<Container | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const performTracking = (number: string) => {
        setIsLoading(true);
        setError('');
        setTrackingData(null);

        setTimeout(() => {
            const data = mockContainerData[number.toUpperCase()];
            if (data) {
                setTrackingData(data);
            } else {
                setError(`Containerul "${number}" nu a fost găsit.`);
            }
            setIsLoading(false);
        }, 800);
    };

    useEffect(() => {
        const queryContainer = searchParams.get('container');
        if (queryContainer) {
            setContainerNumber(queryContainer);
            performTracking(queryContainer);
        }
    }, [searchParams]);

    const handleTrack = (e: React.FormEvent) => {
        e.preventDefault();
        if (!containerNumber) {
            setError('Vă rugăm să introduceți un număr de container.');
            return;
        }
        setSearchParams({ container: containerNumber });
        // useEffect will trigger tracking
    };

    return (
        <div className="space-y-5">
            <div>
                <h3 className="text-2xl font-semibold text-neutral-800 dark:text-neutral-100">Urmărire Container</h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Introduceți numărul containerului pentru a vedea călătoria detaliată.</p>
            </div>
            
            <Card>
                <form onSubmit={handleTrack} className="flex flex-col sm:flex-row gap-4">
                    <Input
                        type="text"
                        value={containerNumber}
                        onChange={(e) => setContainerNumber(e.target.value)}
                        placeholder="ex., MSCU1234567"
                        className="flex-grow w-full font-mono uppercase"
                    />
                    <Button type="submit" disabled={isLoading} loading={isLoading} className="sm:w-32">
                        <SearchIcon className="mr-2 h-4 w-4" />
                        Urmărește
                    </Button>
                </form>
            </Card>

            {error && <div className="bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-3 rounded-lg text-sm">{error}</div>}

            {trackingData && (
                 <Card>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-b border-neutral-200 dark:border-neutral-700 pb-4 mb-4">
                        <div>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">Nr. Container</p>
                            <p className="font-semibold text-neutral-800 dark:text-neutral-100 font-mono">{trackingData.container_number}</p>
                        </div>
                         <div>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">Linie Maritimă</p>
                            <p className="font-semibold text-neutral-800 dark:text-neutral-100">{trackingData.shipping_line}</p>
                        </div>
                        <div>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">Stare Curentă</p>
                            <Badge variant={statusVariantMap[trackingData.current_status]}>{trackingData.current_status}</Badge>
                        </div>
                         <div>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">ETA</p>
                            <p className="font-semibold text-neutral-800 dark:text-neutral-100">{trackingData.estimated_arrival_date}</p>
                        </div>
                    </div>

                    <div>
                        <h4 className="text-lg font-semibold text-neutral-700 dark:text-neutral-200 mb-5">Istoric Urmărire</h4>
                        <TrackingTimeline events={trackingData.tracking_history} />
                    </div>
                </Card>
            )}
        </div>
    );
};

export default TrackingView;