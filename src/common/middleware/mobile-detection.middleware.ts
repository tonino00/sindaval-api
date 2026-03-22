import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

declare global {
  namespace Express {
    interface Request {
      isMobile?: boolean;
      userAgent?: string;
    }
  }
}

@Injectable()
export class MobileDetectionMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const userAgent = req.headers['user-agent'] || '';
    const isMobile = /Mobile|Android|iPhone|iPad|iPod|BlackBerry|Opera Mini|IEMobile|WPDesktop/i.test(
      userAgent,
    );

    req.isMobile = isMobile;
    req.userAgent = userAgent;

    if (process.env.AUTH_DEBUG === 'true') {
      console.log('[MOBILE_DETECTION]', {
        isMobile,
        userAgent: userAgent.substring(0, 100),
        path: req.path,
      });
    }

    next();
  }
}
