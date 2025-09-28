// projects/web/src/app/features/auth/login.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
  <div class="login-wrap">
    <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
      <h1>Iniciar sesión</h1>

      <label>
        Email
        <input type="email" formControlName="email" placeholder="owner@example.com" />
      </label>
      <div class="err" *ngIf="submitted && form.controls.email.invalid">
        Ingresa un email válido.
      </div>

      <label>
        Contraseña
        <input type="password" formControlName="password" placeholder="••••••••" />
      </label>
      <div class="err" *ngIf="submitted && form.controls.password.invalid">
        La contraseña es requerida (mínimo 6).
      </div>

      <label class="remember">
        <input type="checkbox" formControlName="remember" /> Recordarme
      </label>

      <button type="submit" [disabled]="form.pending || loading">
        {{ loading ? 'Entrando…' : 'Entrar' }}
      </button>

      <p class="err" *ngIf="error">{{ error }}</p>
    </form>
  </div>
  `,
  styles: [`
    .login-wrap { max-width: 380px; margin: 6rem auto; padding: 2rem; border: 1px solid #e5e7eb; border-radius: 12px }
    h1 { margin-bottom: 1rem; font-size: 1.25rem }
    label { display:block; margin: .5rem 0 }
    input[type="email"], input[type="password"] { width:100%; padding:.5rem .75rem; border:1px solid #d1d5db; border-radius:8px }
    .remember { display:flex; align-items:center; gap:.5rem; margin: .5rem 0 1rem }
    button { width:100%; padding:.6rem .75rem; border:none; border-radius:8px; background:#111827; color:white; cursor:pointer }
    button[disabled]{ opacity:.6; cursor:not-allowed }
    .err { color:#b91c1c; margin-top:.25rem; font-size:.875rem }
  `]
})
export class LoginComponent {
  loading = false;
  error = '';
  submitted = false;
  private fb = inject(FormBuilder);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    remember: [false],
  });

  constructor(private auth: AuthService, private router: Router) { }

  onSubmit() {
    this.submitted = true;
    this.error = '';
    if (this.form.invalid || this.loading) return;

    const { email, password, remember } = this.form.value;
    this.loading = true;

    this.auth.login(email!, password!).subscribe({
      next: () => {
        this.loading = false;
        if (remember) localStorage.setItem('rememberEmail', email!);
        this.router.navigateByUrl('/app'); // cambia a tu ruta protegida
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message ?? 'Credenciales inválidas';
      }
    });
  }
}
