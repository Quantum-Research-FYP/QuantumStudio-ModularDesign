import { Router, Request, Response } from 'express';
import { getSimulationServiceUrl } from '../simulations/sim-fetch.js';

export function createQmlRouter(): Router {
  const router = Router();

  /**
   * Forward all QML requests to the shared simulation and QML service.
   * Handles both GET, POST, PUT, DELETE, and passes query strings and json bodies.
   */
  router.all('/*', async (req: Request, res: Response): Promise<void> => {
    try {
      const simUrl = getSimulationServiceUrl();
      // Target path on simulation service:
      // req.path is relative to the mount point '/api/qml', e.g. '/data/generate'
      const targetUrl = `${simUrl}/api/qml${req.path}`;
      const queryString = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
      const fullUrl = `${targetUrl}${queryString}`;

      const init: RequestInit = {
        method: req.method,
        headers: {
          'Content-Type': req.headers['content-type'] || 'application/json',
          Accept: req.headers['accept'] || 'application/json',
        },
      };

      if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
        init.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
      }

      const response = await fetch(fullUrl, init);
      const data = await response.text();

      res.status(response.status);
      const contentType = response.headers.get('content-type');
      if (contentType) res.setHeader('content-type', contentType);
      res.send(data);
    } catch (err: any) {
      console.error('[qml-router] Forwarding error:', err?.message || err);
      res.status(502).json({
        error: 'Cannot reach the shared simulation and QML service.',
        errorCode: 'QML_SERVICE_UNAVAILABLE',
        detail: err?.message,
      });
    }
  });

  return router;
}
