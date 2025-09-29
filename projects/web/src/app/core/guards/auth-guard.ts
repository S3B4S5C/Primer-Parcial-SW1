// src/app/core/auth.guard.ts
import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const auth = (() => {
    try { return inject(AuthService); } catch { return null as any; }
  })();

  // 1) Obtén el token (del servicio o de localStorage)
  const token = auth?.token?.() ?? localStorage.getItem('token');

  // 2) Si no hay token -> redirige a /login con redirectTo
  if (!token) {
    return router.createUrlTree(['/login'], {
      queryParams: { redirectTo: state.url }
    });
  }

  // 3) (Opcional) revisa expiración del JWT
  try {
    const [, payloadB64] = token.split('.');
    const json = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')));
    const exp = Number(json?.exp);
    if (exp && Math.floor(Date.now() / 1000) >= exp) {
      // token vencido
      auth?.logout?.(); // limpia storage si tienes método
      return router.createUrlTree(['/login'], {
        queryParams: { redirectTo: state.url, reason: 'expired' }
      });
    }
  } catch {
    // si el token no es parseable, trátalo como inválido
    auth?.logout?.();
    return router.createUrlTree(['/login'], {
      queryParams: { redirectTo: state.url, reason: 'invalid' }
    });
  }

  return true;
};
