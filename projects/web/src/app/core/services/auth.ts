// projects/web/src/app/core/auth.service.ts
import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';

type LoginResponse = { access_token: string; user?: { id: string; email: string } };

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _token = signal<string | null>(localStorage.getItem('token'));
  token = this._token.asReadonly();

  constructor(private http: HttpClient) {}

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>('/api/auth/login', { email, password }).pipe(
      tap(({ access_token }) => {
        this._token.set(access_token);
        localStorage.setItem('token', access_token);
      })
    );
  }

  logout() {
    this._token.set(null);
    localStorage.removeItem('token');
  }

  isLoggedIn() {
    return !!this._token();
  }
}
