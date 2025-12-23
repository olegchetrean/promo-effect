import { Router, Request, Response } from 'express';
import { AuthService } from './auth.service';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();
const authService = new AuthService();

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const result = await authService.register(req.body);
    res.status(201).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Registration failed';
    res.status(400).json({ error: message });
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const result = await authService.login(req.body);
    console.log("jhfjkhdff");
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Login failed';
    res.status(401).json({ error: message });
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    const result = await authService.refreshToken(refreshToken);
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Token refresh failed';
    res.status(401).json({ error: message });
  }
});

// POST /api/auth/logout
router.post('/logout', authMiddleware, async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (token) {
      await authService.logout(token);
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Logout failed';
    res.status(500).json({ error: message });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = await authService.getCurrentUser(req.user!.userId);
    res.json(user);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get user';
    res.status(500).json({ error: message });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    // Validate email
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const result = await authService.forgotPassword({ email });
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to process request';
    
    // Rate limit error
    if (message.includes('Too many')) {
      return res.status(429).json({ error: message });
    }
    
    res.status(500).json({ error: message });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    // Validate inputs
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'Reset token is required' });
    }

    if (!newPassword || typeof newPassword !== 'string') {
      return res.status(400).json({ error: 'New password is required' });
    }

    const result = await authService.resetPassword({ token, newPassword });
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to reset password';
    
    // Invalid/expired token
    if (message.includes('Invalid or expired')) {
      return res.status(400).json({ error: message });
    }
    
    // Password validation errors
    if (message.includes('Password must')) {
      return res.status(400).json({ error: message });
    }
    
    res.status(500).json({ error: message });
  }
});

export default router;
