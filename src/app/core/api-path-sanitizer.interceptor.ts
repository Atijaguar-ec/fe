import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';

/**
 * Ensures any duplicated "/api/api" segments in request URLs are reduced to a single "/api".
 * This protects against mixed configurations between basePath and hardcoded endpoint paths
 * and also fixes generated client paths that accidentally contain "/api/api".
 */
@Injectable()
export class ApiPathSanitizerInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Replace occurrences of /api/api that are followed by /, ?, #, or end-of-string
    // to avoid touching paths like /api/apix
    const sanitizedUrl = req.url.replace(/\/api\/api(?=\/|\?|#|$)/g, '/api');

    if (sanitizedUrl !== req.url) {
      const cleanReq = req.clone({ url: sanitizedUrl });
      return next.handle(cleanReq);
    }

    return next.handle(req);
  }
}
