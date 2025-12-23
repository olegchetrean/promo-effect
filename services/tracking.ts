import api from './api';

// ============================================
// TRACKING SERVICE - Frontend API
// ============================================

export interface TrackingEvent {
  id: string;
  containerId: string;
  eventType: string;
  eventDate: string;
  location: string;
  portName?: string;
  vessel?: string;
  latitude?: number;
  longitude?: number;
  notes?: string;
  createdAt: string;
}

export interface Container {
  id: string;
  bookingId: string;
  containerNumber: string;
  type?: string;
  sealNumber?: string;
  currentStatus: string;
  currentLocation?: string;
  currentLat?: number;
  currentLng?: number;
  eta?: string;
  actualArrival?: string;
  apiSource?: string;
  lastSyncAt?: string;
  createdAt: string;
  updatedAt: string;
  booking?: {
    id: string;
    bookingNumber: string;
    origin: string;
    destination: string;
    client?: {
      id: string;
      name: string;
    };
  };
  trackingEvents?: TrackingEvent[];
}

export interface ContainerListResponse {
  containers: Container[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface TrackingStats {
  totalContainers: number;
  inTransit: number;
  delivered: number;
  delayed: number;
  pending: number;
  avgTransitDays?: number;
}

export interface MapDataItem {
  id: string;
  containerNumber: string;
  currentStatus: string;
  currentLocation: string;
  latitude: number;
  longitude: number;
  bookingNumber?: string;
  clientName?: string;
}

export interface EventType {
  value: string;
  label: string;
}

export interface TrackingEventInput {
  eventType: string;
  eventDate: string;
  location: string;
  portName?: string;
  vessel?: string;
  latitude?: number;
  longitude?: number;
  notes?: string;
}

export interface RoutePoint {
  lat: number;
  lng: number;
  location: string;
  eventType: string;
  eventDate: string;
}

// ============================================
// API FUNCTIONS
// ============================================

/**
 * Get tracking statistics
 */
export async function getTrackingStats(): Promise<TrackingStats> {
  const response = await api.get('/tracking/stats');
  return response.data;
}

/**
 * Get list of event types
 */
export async function getEventTypes(): Promise<EventType[]> {
  const response = await api.get('/tracking/event-types');
  return response.data;
}

/**
 * Get map data for visualization
 */
export async function getMapData(): Promise<MapDataItem[]> {
  const response = await api.get('/tracking/map-data');
  return response.data;
}

/**
 * Get containers list with filters
 */
export async function getContainers(params?: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  clientId?: string;
  bookingId?: string;
}): Promise<ContainerListResponse> {
  const response = await api.get('/tracking/containers', { params });
  return response.data;
}

/**
 * Get container by ID with tracking history
 */
export async function getContainerById(id: string): Promise<Container> {
  const response = await api.get(`/tracking/containers/${id}`);
  return response.data;
}

/**
 * Search container by container number
 */
export async function searchContainer(containerNumber: string): Promise<Container> {
  const response = await api.get(`/tracking/search/${encodeURIComponent(containerNumber)}`);
  return response.data;
}

/**
 * Get container route for map path
 */
export async function getContainerRoute(containerId: string): Promise<RoutePoint[]> {
  const response = await api.get(`/tracking/containers/${containerId}/route`);
  return response.data;
}

/**
 * Add tracking event to container
 */
export async function addTrackingEvent(
  containerId: string,
  eventData: TrackingEventInput
): Promise<TrackingEvent> {
  const response = await api.post(`/tracking/containers/${containerId}/events`, eventData);
  return response.data;
}

/**
 * Update tracking event
 */
export async function updateTrackingEvent(
  eventId: string,
  eventData: Partial<TrackingEventInput>
): Promise<TrackingEvent> {
  const response = await api.put(`/tracking/events/${eventId}`, eventData);
  return response.data;
}

/**
 * Delete tracking event
 */
export async function deleteTrackingEvent(eventId: string): Promise<{ message: string }> {
  const response = await api.delete(`/tracking/events/${eventId}`);
  return response.data;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get status color for UI
 */
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    PENDING: 'gray',
    PICKED_UP: 'blue',
    IN_TRANSIT: 'yellow',
    AT_PORT: 'purple',
    CUSTOMS: 'orange',
    DELIVERED: 'green',
    DELAYED: 'red',
    ON_HOLD: 'red',
    CANCELLED: 'gray',
  };
  return colors[status] || 'gray';
}

/**
 * Get status label for display
 */
export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDING: 'În așteptare',
    PICKED_UP: 'Ridicat',
    IN_TRANSIT: 'În tranzit',
    AT_PORT: 'La port',
    CUSTOMS: 'La vamă',
    DELIVERED: 'Livrat',
    DELAYED: 'Întârziat',
    ON_HOLD: 'Suspendat',
    CANCELLED: 'Anulat',
  };
  return labels[status] || status;
}

/**
 * Format event type for display
 */
export function getEventTypeLabel(eventType: string): string {
  const labels: Record<string, string> = {
    BOOKING_CREATED: 'Rezervare creată',
    PICKED_UP: 'Container ridicat',
    GATE_IN_ORIGIN: 'Gate In - Origine',
    LOADED_ON_VESSEL: 'Încărcat pe navă',
    DEPARTED_ORIGIN: 'Plecare din origine',
    TRANSHIPMENT_ARRIVAL: 'Sosire transbordare',
    TRANSHIPMENT_DEPARTURE: 'Plecare transbordare',
    ARRIVED_DESTINATION: 'Sosire la destinație',
    DISCHARGED: 'Descărcat',
    CUSTOMS_CLEARANCE: 'Vămuire',
    GATE_OUT: 'Gate Out',
    DELIVERED: 'Livrat',
    EXCEPTION: 'Excepție',
    HOLD: 'Suspendat',
    RELEASED: 'Eliberat',
  };
  return labels[eventType] || eventType;
}

export default {
  getTrackingStats,
  getEventTypes,
  getMapData,
  getContainers,
  getContainerById,
  searchContainer,
  getContainerRoute,
  addTrackingEvent,
  updateTrackingEvent,
  deleteTrackingEvent,
  getStatusColor,
  getStatusLabel,
  getEventTypeLabel,
};
