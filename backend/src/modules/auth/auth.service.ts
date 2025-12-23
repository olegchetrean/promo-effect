import bcrypt from 'bcrypt';
import crypto from 'crypto';
import prisma from '../../lib/prisma';
import { generateAccessToken, generateRefreshToken } from '../../utils/jwt.util';

// Rate limiting storage (in production, use Redis)
const resetAttempts = new Map<string, { count: number; lastAttempt: Date }>();
const MAX_RESET_ATTEMPTS = 3;
const RESET_WINDOW_HOURS = 1;

export interface RegisterDTO {
  email: string;
  password: string;
  name: string;
  phone?: string;
  company?: string;
  role?: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface ForgotPasswordDTO {
  email: string;
}

export interface ResetPasswordDTO {
  token: string;
  newPassword: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  async register(data: RegisterDTO): Promise<AuthResponse> {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new Error('User already exists with this email');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        name: data.name,
        phone: data.phone,
        company: data.company,
        role: data.role || 'CLIENT',
      },
    });

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Calculate expiry (30 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Save session
    await prisma.session.create({
      data: {
        userId: user.id,
        token: accessToken,
        refreshToken,
        expiresAt,
      },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      accessToken,
      refreshToken,
    };
  }

  async login(data: LoginDTO): Promise<AuthResponse> {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(data.password, user.passwordHash);

    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    // Generate new tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Calculate expiry
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Create new session
    await prisma.session.create({
      data: {
        userId: user.id,
        token: accessToken,
        refreshToken,
        expiresAt,
      },
    });

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    // Find session
    const session = await prisma.session.findUnique({
      where: { refreshToken },
      include: { user: true },
    });

    if (!session) {
      throw new Error('Invalid refresh token');
    }

    // Check if expired
    if (session.expiresAt < new Date()) {
      await prisma.session.delete({ where: { id: session.id } });
      throw new Error('Refresh token expired');
    }

    // Generate new tokens
    const user = session.user;
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    // Calculate new expiry
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Update session
    await prisma.session.update({
      where: { id: session.id },
      data: {
        token: newAccessToken,
        refreshToken: newRefreshToken,
        expiresAt,
      },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(token: string): Promise<void> {
    await prisma.session.deleteMany({
      where: { token },
    });
  }

  async getCurrentUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        company: true,
        role: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  /**
   * Request password reset - sends email with reset token
   * Returns generic message for security (don't reveal if email exists)
   */
  async forgotPassword(data: ForgotPasswordDTO): Promise<{ message: string }> {
    const email = data.email.toLowerCase().trim();

    // Rate limiting check
    const attempts = resetAttempts.get(email);
    if (attempts) {
      const hoursSinceLastAttempt = (Date.now() - attempts.lastAttempt.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceLastAttempt < RESET_WINDOW_HOURS && attempts.count >= MAX_RESET_ATTEMPTS) {
        throw new Error('Too many password reset attempts. Please try again later.');
      }
      
      // Reset counter if window has passed
      if (hoursSinceLastAttempt >= RESET_WINDOW_HOURS) {
        resetAttempts.delete(email);
      }
    }

    // Update rate limiting
    const currentAttempts = resetAttempts.get(email) || { count: 0, lastAttempt: new Date() };
    resetAttempts.set(email, {
      count: currentAttempts.count + 1,
      lastAttempt: new Date(),
    });

    // Find user (but don't reveal if exists)
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Always return success message for security
    const successMessage = 'If an account with that email exists, we have sent a password reset link.';

    if (!user) {
      // Don't reveal that email doesn't exist
      return { message: successMessage };
    }

    // Generate secure random token
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Hash the token for storage (store hash, send plain token)
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Set expiry to 1 hour from now
    const resetTokenExpiry = new Date();
    resetTokenExpiry.setHours(resetTokenExpiry.getHours() + 1);

    // Save token to database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: hashedToken,
        resetTokenExpiry,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'PASSWORD_RESET_REQUESTED',
        entityType: 'User',
        entityId: user.id,
        changes: JSON.stringify({ email: user.email, requestedAt: new Date() }),
      },
    });

    // Build reset URL
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

    // Send email (log for now, implement actual email sending later)
    console.log('='.repeat(60));
    console.log('PASSWORD RESET EMAIL');
    console.log('='.repeat(60));
    console.log(`To: ${user.email}`);
    console.log(`Name: ${user.name}`);
    console.log(`Reset URL: ${resetUrl}`);
    console.log(`Token expires: ${resetTokenExpiry.toISOString()}`);
    console.log('='.repeat(60));

    // TODO: Implement actual email sending
    // await sendPasswordResetEmail(user.email, user.name, resetUrl);

    return { message: successMessage };
  }

  /**
   * Reset password using token
   */
  async resetPassword(data: ResetPasswordDTO): Promise<{ message: string }> {
    const { token, newPassword } = data;

    // Validate password strength
    if (!newPassword || newPassword.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    if (!/[A-Z]/.test(newPassword)) {
      throw new Error('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(newPassword)) {
      throw new Error('Password must contain at least one lowercase letter');
    }

    if (!/[0-9]/.test(newPassword)) {
      throw new Error('Password must contain at least one number');
    }

    // Hash the provided token to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user by token and check expiry
    const user = await prisma.user.findFirst({
      where: {
        resetToken: hashedToken,
        resetTokenExpiry: {
          gt: new Date(), // Token must not be expired
        },
      },
    });

    if (!user) {
      throw new Error('Invalid or expired password reset token');
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    // Invalidate all existing sessions (security measure)
    await prisma.session.deleteMany({
      where: { userId: user.id },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'PASSWORD_RESET_COMPLETED',
        entityType: 'User',
        entityId: user.id,
        changes: JSON.stringify({ completedAt: new Date() }),
      },
    });

    console.log(`Password reset completed for user: ${user.email}`);

    return { message: 'Password has been reset successfully. You can now login with your new password.' };
  }
}
