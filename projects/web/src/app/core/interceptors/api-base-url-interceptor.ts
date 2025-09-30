// projects/web/src/app/core/api-base-url.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment.prod';

export const apiBaseUrlInterceptor: HttpInterceptorFn = (req, next) => {
  // Si ya es absoluta (http/https), no tocamos
  if (/^https?:\/\//i.test(req.url)) {
    return next(req);
  }

  // Solo reescribimos si comienza con /api (tu patrón actual)
  if (req.url.startsWith('/')) {
    const base = environment.apiBaseUrl;

    // Evitar "doble /api": si base ya termina en /api y la ruta empieza con /api, quitamos el prefijo
    const baseEndsWithApi = /\/api\/?$/.test(base);
    let path = req.url; // p.ej. "/api/auth/login"

    if (baseEndsWithApi && path.startsWith('/api')) {
      path = path.replace(/^\/api/, ''); // -> "/auth/login"
    }

    const url =
      base.replace(/\/+$/, '') + '/' + path.replace(/^\/+/, '');

    const cloned = req.clone({ url });
    return next(cloned);
  }

  // En cualquier otro caso, seguir normal
  return next(req);
};
