import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth';

function match(other: string) {
  return (control: AbstractControl): ValidationErrors | null => {
    const parent = control.parent as FormGroup | null;
    if (!parent) return null;
    const val = control.value;
    const cmp = parent.get(other)?.value;
    return val === cmp ? null : { mismatch: true };
  };
}

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
  <div class="auth-wrap">
    <div class="tabs">
      <button [class.active]="mode() === 'login'" (click)="mode.set('login')">Ingresar</button>
      <button [class.active]="mode() === 'register'" (click)="mode.set('register')">Registrarme</button>
    </div>

    <form *ngIf="mode() === 'login'" [formGroup]="loginForm" (ngSubmit)="onLogin()" novalidate>
      <h1>Iniciar sesión</h1>
      <label>Email
        <input type="email" formControlName="email" placeholder="tucorreo@ejemplo.com" />
      </label>
      <div class="err" *ngIf="submittedLogin && loginForm.controls.email.invalid">Email inválido</div>

      <label>Contraseña
        <input type="password" formControlName="password" placeholder="••••••••" />
      </label>
      <div class="err" *ngIf="submittedLogin && loginForm.controls.password.invalid">Contraseña requerida</div>

      <button type="submit" [disabled]="loading">{{ loading ? 'Entrando…' : 'Entrar' }}</button>
      <p class="err" *ngIf="error">{{ error }}</p>
    </form>

    <form *ngIf="mode() === 'register'" [formGroup]="registerForm" (ngSubmit)="onRegister()" novalidate>
      <h1>Crear cuenta</h1>

      <label>Nombre (opcional)
        <input type="text" formControlName="name" placeholder="Tu nombre" />
      </label>

      <label>Email
        <input type="email" formControlName="email" placeholder="tucorreo@ejemplo.com" />
      </label>
      <div class="err" *ngIf="submittedReg && registerForm.controls.email.invalid">Email inválido</div>

      <label>Contraseña
        <input type="password" formControlName="password" placeholder="mín. 6 caracteres" />
      </label>
      <div class="err" *ngIf="submittedReg && registerForm.controls.password.invalid">Min. 6 caracteres</div>

      <label>Repetir contraseña
        <input type="password" formControlName="confirm" placeholder="repite la contraseña" />
      </label>
      <div class="err" *ngIf="submittedReg && registerForm.controls.confirm.errors?.['mismatch']">No coincide</div>

      <button type="submit" [disabled]="loading">{{ loading ? 'Creando…' : 'Crear cuenta' }}</button>
      <p class="err" *ngIf="error">{{ error }}</p>
    </form>
  </div>
  `,
  styles: [`
    .auth-wrap { max-width:420px; margin:6rem auto; padding:2rem; border:1px solid #e5e7eb; border-radius:12px }
    .tabs { display:flex; gap:.5rem; margin-bottom:1rem }
    .tabs button { flex:1; padding:.5rem .75rem; border-radius:8px; border:1px solid #d1d5db; background:#fff; cursor:pointer }
    .tabs button.active { background:#111827; color:#fff; border-color:#111827 }
    label { display:block; margin:.5rem 0 }
    input { width:100%; padding:.5rem .75rem; border:1px solid #d1d5db; border-radius:8px }
    button { width:100%; padding:.6rem .75rem; border:none; border-radius:8px; background:#111827; color:white; cursor:pointer; margin-top:1rem }
    button[disabled]{ opacity:.6; cursor:not-allowed }
    .err { color:#b91c1c; margin-top:.25rem; font-size:.875rem }
  `]
})
export class AuthComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  mode = signal<'login' | 'register'>('login');
  loading = false;
  error = '';
  submittedLogin = false;
  submittedReg = false;

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  registerForm = this.fb.group({
    name: [''],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirm: ['', [Validators.required, match('password')]],
  });

  onLogin() {
    this.submittedLogin = true;
    this.error = '';
    if (this.loginForm.invalid || this.loading) return;
    const { email, password } = this.loginForm.value;
    this.loading = true;
    this.auth.login(email!, password!).subscribe({
      next: () => { this.loading = false; this.router.navigateByUrl('/app'); },
      error: (err) => { this.loading = false; this.error = err?.error?.message ?? 'Error de autenticación'; }
    });
  }

  onRegister() {
    this.submittedReg = true;
    this.error = '';
    if (this.registerForm.invalid || this.loading) return;
    const { name, email, password } = this.registerForm.value;
    this.loading = true;
    this.auth.register(email!, password!, name ?? undefined).subscribe({
      next: () => { this.loading = false; this.router.navigateByUrl('/app'); },
      error: (err) => {
        this.loading = false;
        const m = err?.status === 409 ? 'El email ya está registrado' : (err?.error?.message ?? 'No se pudo crear la cuenta');
        this.error = m;
      }
    });
  }
}
