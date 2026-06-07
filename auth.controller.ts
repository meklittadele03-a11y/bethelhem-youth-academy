import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/user.model';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-bya-2026-key';

export class AuthController {
  /**
   * Secure user login endpoint
   */
  static async login(req: Request, res: Response) {
    const { email, password } = req.body;

    try {
      // Find user by email
      const user = await UserModel.findByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'Incorrect email or password.' });
      }

      // Check active security state
      if (user.status === 'suspended') {
        return res.status(403).json({ error: 'Access denied. This user account is currently suspended.' });
      }

      // Validate secret password hash
      const isValid = await UserModel.verifyPassword(user, password);
      if (!isValid) {
        return res.status(401).json({ error: 'Incorrect email or password.' });
      }

      // Sign JWT session (expires in 2 hours)
      const token = jwt.sign(
        { 
          id: user.id, 
          email: user.email, 
          role: user.role, 
          fullName: user.fullName 
        },
        JWT_SECRET,
        { expiresIn: '2h' }
      );

      // Return session parameters
      return res.status(200).json({
        message: 'Login successful. Session initiated.',
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          fullName: user.fullName,
          phone: user.phone || '',
          registrationNo: user.registrationNo,
          status: user.status,
          createdAt: user.createdAt
        }
      });
    } catch (err: any) {
      console.error('Login error:', err);
      return res.status(500).json({ error: 'Internal system error authenticating session.' });
    }
  }

  /**
   * New User registration endpoint
   */
  static async register(req: Request, res: Response) {
    const { fullName, email, password, role, phone } = req.body;

    try {
      // Check duplicate email collision
      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) {
        return res.status(409).json({ error: 'An account with this email address already exists.' });
      }

      // Setup unique school registry standards (e.g. BYA-TCH-2026-003)
      const rolePrefix = role === 'admin' ? 'ADM' : role === 'teacher' ? 'TCH' : role === 'student' ? 'STU' : 'PRN';
      const year = new Date().getFullYear();
      const randomCode = Math.floor(1000 + Math.random() * 9000);
      const registrationNo = `BYA-${rolePrefix}-${year}-${randomCode}`;

      // Insert secure user
      const user = await UserModel.create({
        fullName,
        email,
        passwordPlain: password,
        role,
        phone: phone || '',
        registrationNo
      });

      return res.status(201).json({
        message: 'User registered successfully inside school registry.',
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          fullName: user.fullName,
          phone: user.phone,
          registrationNo: user.registrationNo,
          status: user.status,
          createdAt: user.createdAt
        }
      });
    } catch (err: any) {
      console.error('Registration error:', err);
      return res.status(500).json({ error: 'Internal server error processing registry signup.' });
    }
  }

  /**
   * Query active session profile (self fetcher)
   */
  static async me(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      return res.status(401).json({ error: 'Session parameters missing.' });
    }

    try {
      const user = await UserModel.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ error: 'Your account profile could not be verified.' });
      }

      return res.status(200).json({ user });
    } catch (err) {
      console.error('Self verification query error:', err);
      return res.status(500).json({ error: 'Failed to verify session profile.' });
    }
  }
}
