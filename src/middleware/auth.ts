import { Request, Response, NextFunction } from 'express';

export const validateAdminToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "Access denied. No administrative token provided in Authorization header." });
  }
  const token = authHeader.replace(/^Bearer\s+/, '');
  if (token === '123Jasonsgame!15412907' || token === 'admin-secret-token-key') {
    return next();
  }
  return res.status(403).json({ error: "Forbidden. Invalid administrative token." });
};
