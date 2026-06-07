import { Request, Response, NextFunction } from 'express';

export function validateLogin(req: Request, res: Response, next: NextFunction) {
  const { email, password } = req.body;

  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Valid registered email address is required.' });
  }

  if (!password || typeof password !== 'string') {
    return res.status(400).json({ error: 'Security account password is required.' });
  }

  // Basic email pattern regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Please supply a correctly formatted email address.' });
  }

  next();
}

export function validateRegister(req: Request, res: Response, next: NextFunction) {
  const { email, password, fullName, role } = req.body;

  if (!email || !emailRegex.test(email)) {
    return res.status(400).json({ error: 'A valid email address is required.' });
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ error: 'Account password must contain at least 6 characters.' });
  }

  if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 3) {
    return res.status(400).json({ error: 'Please write a complete name (at least 3 characters).' });
  }

  const validRoles = ['admin', 'teacher', 'student', 'parent'];
  if (!role || !validRoles.includes(role)) {
    return res.status(400).json({ error: `Please choose a valid role structure: [${validRoles.join(', ')}]` });
  }

  next();
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
