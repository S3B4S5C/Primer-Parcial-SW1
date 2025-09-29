import { Component, inject, signal } from "@angular/core"
import { CommonModule } from "@angular/common"
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  type AbstractControl,
  type ValidationErrors,
  type FormGroup,
} from "@angular/forms"
import { Router } from "@angular/router"
import { AuthService } from "../../../core/services/auth"
import { CardComponent } from "../../../shared/components/card/card"
import { FormFieldComponent } from "../../../shared/components/form-field/form-field"

function match(other: string) {
  return (control: AbstractControl): ValidationErrors | null => {
    const parent = control.parent as FormGroup | null
    if (!parent) return null
    const val = control.value
    const cmp = parent.get(other)?.value
    return val === cmp ? null : { mismatch: true }
  }
}

@Component({
  selector: "app-auth",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CardComponent, FormFieldComponent],
  templateUrl: "./login.html",
  styleUrl: "./login.scss",
})
export class AuthComponent {
  private fb = inject(FormBuilder)
  private auth = inject(AuthService)
  private router = inject(Router)

  mode = signal<"login" | "register">("login")
  loading = false
  error = ""
  submittedLogin = false
  submittedReg = false

  loginForm = this.fb.group({
    email: ["", [Validators.required, Validators.email]],
    password: ["", [Validators.required]],
  })

  registerForm = this.fb.group({
    name: [""],
    email: ["", [Validators.required, Validators.email]],
    password: ["", [Validators.required, Validators.minLength(6)]],
    confirm: ["", [Validators.required, match("password")]],
  })

  onLogin() {
    this.submittedLogin = true
    this.error = ""
    if (this.loginForm.invalid || this.loading) return
    const { email, password } = this.loginForm.value
    this.loading = true
    this.auth.login(email!, password!).subscribe({
      next: () => {
        this.loading = false
        this.router.navigateByUrl("/app")
      },
      error: (err) => {
        this.loading = false
        this.error = err?.error?.message ?? "Error de autenticación"
      },
    })
  }

  onRegister() {
    this.submittedReg = true
    this.error = ""
    if (this.registerForm.invalid || this.loading) return
    const { name, email, password } = this.registerForm.value
    this.loading = true
    this.auth.register(email!, password!, name ?? undefined).subscribe({
      next: () => {
        this.loading = false
        this.router.navigateByUrl("/app")
      },
      error: (err) => {
        this.loading = false
        const m =
          err?.status === 409 ? "El email ya está registrado" : (err?.error?.message ?? "No se pudo crear la cuenta")
        this.error = m
      },
    })
  }
}
