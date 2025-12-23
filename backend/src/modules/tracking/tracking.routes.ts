import { Router, Request, Response } from 'express';
import { authMiddleware, requireRole } from '../../middleware/auth.middleware';
import trackingService, { TrackingEventInput, TrackingEventTypes, EventTypeLabels } from './tracking.service';

const router = Router();

// ============================================
// TRACKING ROUTES
// ============================================

/**
 * GET /api/tracking/stats
 * Get tracking statistics
 * @access All authenticated users
 */
router.get('/stats', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const stats = await trackingService.getTrackingStats(user.role, user.clientId);
    res.json(stats);
  } catch (error: any) {
    console.error('Get tracking stats error:', error);
    res.status(500).json({ error: error.message || 'Failed to get statistics' });
  }
});

/**
 * GET /api/tracking/event-types
 * Get list of available event types
 * @access All authenticated users
 */
router.get('/event-types', authMiddleware, async (req: Request, res: Response) => {
  try {
    const eventTypes = Object.entries(TrackingEventTypes).map(([key, value]) => ({
      value: key,
      label: EventTypeLabels[key] || key,
    }));
    res.json(eventTypes);
  } catch (error: any) {
    console.error('Get event types error:', error);
    res.status(500).json({ error: error.message || 'Failed to get event types' });
  }
});

/**
 * GET /api/tracking/map-data
 * Get data for map visualization
 * @access All authenticated users
 */
router.get('/map-data', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const mapData = await trackingService.getMapData(user.role, user.clientId);
    res.json(mapData);
  } catch (error: any) {
    console.error('Get map data error:', error);
    res.status(500).json({ error: error.message || 'Failed to get map data' });
  }
});

/**
 * GET /api/tracking/containers
 * List all containers for tracking view
 * @access All authenticated users (filtered by role)
 */
router.get('/containers', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    const filters = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
      status: req.query.status as string,
      search: req.query.search as string,
      clientId: req.query.clientId as string,
      bookingId: req.query.bookingId as string,
    };

    const result = await trackingService.getContainers(filters, user.role, user.clientId);
    res.json(result);
  } catch (error: any) {
    console.error('List containers error:', error);
    res.status(500).json({ error: error.message || 'Failed to list containers' });
  }
});

/**
 * GET /api/tracking/containers/:id
 * Get container with full tracking history
 * @access All authenticated users (permission checked)
 */
router.get('/containers/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    const container = await trackingService.getContainerById(id, user.role, user.clientId);
    res.json(container);
  } catch (error: any) {
    console.error('Get container error:', error);

    if (error.message === 'Container not found') {
      return res.status(404).json({ error: 'Container not found' });
    }
    if (error.message === 'Access denied') {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.status(500).json({ error: error.message || 'Failed to get container' });
  }
});

/**
 * GET /api/tracking/search/:containerNumber
 * Search container by number
 * @access All authenticated users (permission checked)
 */
router.get('/search/:containerNumber', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { containerNumber } = req.params;
    const user = (req as any).user;

    const container = await trackingService.getContainerByNumber(
      containerNumber,
      user.role,
      user.clientId
    );
    res.json(container);
  } catch (error: any) {
    console.error('Search container error:', error);

    if (error.message === 'Container not found') {
      return res.status(404).json({ error: 'Container not found' });
    }
    if (error.message === 'Access denied') {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.status(500).json({ error: error.message || 'Failed to search container' });
  }
});

/**
 * GET /api/tracking/containers/:id/route
 * Get container route for map path
 * @access All authenticated users
 */
router.get('/containers/:id/route', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const route = await trackingService.getContainerRoute(id);
    res.json(route);
  } catch (error: any) {
    console.error('Get route error:', error);
    res.status(500).json({ error: error.message || 'Failed to get route' });
  }
});

/**
 * POST /api/tracking/containers/:id/events
 * Add manual tracking event
 * @access ADMIN, SUPER_ADMIN, OPERATOR
 */
router.post(
  '/containers/:id/events',
  authMiddleware,
  requireRole(['ADMIN', 'SUPER_ADMIN', 'OPERATOR', 'AGENT']),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const user = (req as any).user;
      const { eventType, eventDate, location, portName, vessel, latitude, longitude, notes } = req.body;

      // Validation
      if (!eventType) {
        return res.status(400).json({ error: 'Event type is required' });
      }
      if (!eventDate) {
        return res.status(400).json({ error: 'Event date is required' });
      }
      if (!location) {
        return res.status(400).json({ error: 'Location is required' });
      }

      const eventData: TrackingEventInput = {
        eventType,
        eventDate: new Date(eventDate),
        location,
        portName,
        vessel,
        latitude: latitude ? parseFloat(latitude) : undefined,
        longitude: longitude ? parseFloat(longitude) : undefined,
        notes,
      };

      const event = await trackingService.addTrackingEvent(id, eventData, user.userId);
      res.status(201).json(event);
    } catch (error: any) {
      console.error('Add tracking event error:', error);

      if (error.message === 'Container not found') {
        return res.status(404).json({ error: 'Container not found' });
      }
      if (error.message.includes('Invalid event type')) {
        return res.status(400).json({ error: error.message });
      }
      if (error.message.includes('Invalid event order')) {
        return res.status(400).json({ error: error.message });
      }

      res.status(500).json({ error: error.message || 'Failed to add tracking event' });
    }
  }
);

/**
 * PUT /api/tracking/events/:eventId
 * Update tracking event
 * @access ADMIN, SUPER_ADMIN, OPERATOR
 */
router.put(
  '/events/:eventId',
  authMiddleware,
  requireRole(['ADMIN', 'SUPER_ADMIN', 'OPERATOR']),
  async (req: Request, res: Response) => {
    try {
      const { eventId } = req.params;
      const user = (req as any).user;
      const { eventType, eventDate, location, portName, vessel, latitude, longitude, notes } = req.body;

      const eventData: Partial<TrackingEventInput> = {
        eventType,
        eventDate: eventDate ? new Date(eventDate) : undefined,
        location,
        portName,
        vessel,
        latitude: latitude ? parseFloat(latitude) : undefined,
        longitude: longitude ? parseFloat(longitude) : undefined,
        notes,
      };

      const event = await trackingService.updateTrackingEvent(eventId, eventData, user.userId);
      res.json(event);
    } catch (error: any) {
      console.error('Update tracking event error:', error);

      if (error.message === 'Tracking event not found') {
        return res.status(404).json({ error: 'Tracking event not found' });
      }

      res.status(500).json({ error: error.message || 'Failed to update tracking event' });
    }
  }
);

/**
 * DELETE /api/tracking/events/:eventId
 * Delete tracking event
 * @access ADMIN, SUPER_ADMIN
 */
router.delete(
  '/events/:eventId',
  authMiddleware,
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  async (req: Request, res: Response) => {
    try {
      const { eventId } = req.params;
      const user = (req as any).user;

      const result = await trackingService.deleteTrackingEvent(eventId, user.userId);
      res.json({ message: 'Tracking event deleted successfully', ...result });
    } catch (error: any) {
      console.error('Delete tracking event error:', error);

      if (error.message === 'Tracking event not found') {
        return res.status(404).json({ error: 'Tracking event not found' });
      }

      res.status(500).json({ error: error.message || 'Failed to delete tracking event' });
    }
  }
);

export default router;
