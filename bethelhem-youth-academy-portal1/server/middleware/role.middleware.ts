import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.middleware';

/**
 * Midlleware to restrict endpoints to specific system roles
 * @param roles Array of authorized roles matching User types ('admin', 'teacher', 'student', 'parent')
 */
export function authorizeRoles(...roles: ('admin' | 'teacher' | 'student' | 'parent')[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthenticated. User data missing in request.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Unauthorized. This endpoint requires one of these roles: [${roles.join(', ')}]. Current role: [${req.user.role}]`
      });
    }

    next();
  };
}
