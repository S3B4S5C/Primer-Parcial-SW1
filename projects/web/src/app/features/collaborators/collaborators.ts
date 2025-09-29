import { Component, type OnInit, inject, signal } from "@angular/core"
import { CommonModule } from "@angular/common"
import { ReactiveFormsModule, FormBuilder, Validators } from "@angular/forms"
import { ActivatedRoute, Router, RouterModule } from "@angular/router"
import { CollaboratorsService } from "../../core/services/collaborators"
import { debounceTime, distinctUntilChanged } from "rxjs/operators"
import { HeaderComponent } from "../../shared/components/header/header"
import { CardComponent } from "../../shared/components/card/card"
import { FormFieldComponent } from "../../shared/components/form-field/form-field"

@Component({
  standalone: true,
  selector: "app-collaborators",
  imports: [CommonModule, ReactiveFormsModule, RouterModule, HeaderComponent, CardComponent, FormFieldComponent],
  templateUrl: "./collaborators.html",
  styleUrl: "./collaborators.scss",
})
export class CollaboratorsComponent implements OnInit {
  private fb = inject(FormBuilder)
  private api = inject(CollaboratorsService)
  private route = inject(ActivatedRoute)
  private router = inject(Router)

  projectId = signal<string>("")
  members = signal<any[]>([])
  audit = signal<any[]>([])
  results = signal<any[]>([])
  adding = signal(false)
  error = signal("")

  addForm = this.fb.group({
    q: ["", [Validators.required]], // puede ser email o búsqueda
    role: ["EDITOR", [Validators.required]],
  })

  ngOnInit() {
    this.projectId.set(this.route.snapshot.paramMap.get("projectId")!)
    this.reload()

    // live search
    this.addForm.controls.q.valueChanges
      .pipe(debounceTime(250), distinctUntilChanged())
      .subscribe((v) => this.search(String(v ?? "")))
  }

  goProjects() {
    this.router.navigateByUrl("/app")
  }

  reload() {
    this.api.list(this.projectId()).subscribe({ next: (r) => this.members.set(r) })
    this.api.audit(this.projectId()).subscribe({ next: (r) => this.audit.set(r) })
    this.results.set([])
  }

  search(q: string) {
    if (!q || q.length < 2) {
      this.results.set([])
      return
    }
    this.api.search(this.projectId(), q).subscribe({
      next: (r) => this.results.set(r),
      error: () => this.results.set([]),
    })
  }

  private selectedUserId: string | undefined
  selectUser(u: any) {
    this.selectedUserId = u.id
    this.addForm.patchValue({ q: `${u.email}` })
    this.results.set([])
  }

  add() {
    if (this.addForm.invalid || this.adding()) return
    this.adding.set(true)
    const { q, role } = this.addForm.value
    const body = this.selectedUserId
      ? { userId: this.selectedUserId, role: role! as any }
      : { email: String(q), role: role! as any }
    this.api.add(this.projectId(), body).subscribe({
      next: () => {
        this.adding.set(false)
        this.addForm.reset({ q: "", role: "EDITOR" })
        this.selectedUserId = undefined
        this.reload()
      },
      error: (e) => {
        this.adding.set(false)
        this.error.set(e?.error?.message ?? "No se pudo agregar")
      },
    })
  }

  changeRole(memberId: string, role: string) {
    this.api.updateRole(this.projectId(), memberId, role as any).subscribe({
      next: () => this.reload(),
      error: (e) => this.error.set(e?.error?.message ?? "No se pudo cambiar el rol (quizá es el último propietario)"),
    })
  }

  remove(memberId: string) {
    if (!confirm("¿Quitar colaborador?")) return
    this.api.remove(this.projectId(), memberId).subscribe({
      next: () => this.reload(),
      error: (e) => this.error.set(e?.error?.message ?? "No se pudo quitar (quizá es el último propietario)"),
    })
  }
}
