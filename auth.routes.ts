import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticateJWT } from '../middleware/auth.middleware';
import { validateLogin, validateRegister } from '../middleware/validation.middleware';

const router = Router();

/**
 * @route   POST /api/auth/login
 * @desc    Log in user and retrieve persistent security session parameters
 * @access  Public
 */
router.post('/login', validateLogin, AuthController.login);

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user (student, parent, teacher, or admin)
 * @access  Public
 */
router.post('/register', validateRegister, AuthController.register);

/**
 * @route   GET /api/auth/me
 * @desc    Verify current session parameters and return authenticated user properties
 * @access  Private
 */
router.get('/me', authenticateJWT as any, AuthController.me as any);

export default router;
