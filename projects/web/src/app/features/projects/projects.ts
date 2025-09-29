import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ProjectsService } from '../../core/services/projects';
import { WorkspacesService, WorkspaceDTO } from '../../core/services/workspaces';
import { RouterLink } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-projects',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
  <div class="wrap">
    <h1>Proyectos</h1>

    <div class="toolbar">
      <label>Workspace:</label>
      <select [value]="selectedWsId()" (change)="onWsChanged($event)">
        <option *ngFor="let ws of workspaces()" [value]="ws.id">
          {{ ws.name }} ({{ ws.role }}) · {{ ws.projectCount }} proyectos
        </option>
      </select>
      <button (click)="reload()">Recargar</button>
      <span class="err" *ngIf="error()">{{ error() }}</span>
    </div>

    <form [formGroup]="form" (ngSubmit)="create()">
      <input placeholder="Nombre" formControlName="name" />
      <input placeholder="Descripción (opcional)" formControlName="description" />
      <input placeholder="Tags (coma)" formControlName="tags" />
      <button [disabled]="form.invalid || loading()">Crear</button>
    </form>

    <ul>
      <li *ngFor="let p of projects()">
        <b>{{ p.name }}</b>
        <small> · {{ p.status }}</small>
        <small>
          · tags:
          <ng-container *ngIf="p.tags?.length; else noTags">
            <ng-container *ngFor="let pt of p.tags; let last = last">
              {{ pt.tag?.name }}<span *ngIf="!last">, </span>
            </ng-container>
          </ng-container>
          <ng-template #noTags>—</ng-template>
        </small>
        <a [routerLink]="['/app/projects', p.id, 'editor']">Editar modelo</a>
        <button (click)="archive(p.id)" *ngIf="p.status==='ACTIVE'">Archivar</button>
        <button (click)="restore(p.id)" *ngIf="p.status==='ARCHIVED'">Restaurar</button>
        <button (click)="remove(p.id)">Eliminar</button>
      </li>
    </ul>
  </div>
  `,
  styles: [`
    .wrap{max-width:880px;margin:2rem auto}
    .toolbar{display:flex;gap:.5rem;align-items:center;margin-bottom:1rem}
    select,input{padding:.4rem .5rem;border:1px solid #d1d5db;border-radius:8px}
    .err{color:#b91c1c;margin-left:.5rem}
    form input{margin-right:.5rem}
  `]
})
export class ProjectsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private api = inject(ProjectsService);
  private wsApi = inject(WorkspacesService);

  workspaces = signal<WorkspaceDTO[]>([]);
  selectedWsId = signal<string>('');
  projects = signal<any[]>([]);
  loading = signal(false);
  error = signal('');

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    description: [''],
    tags: [''],
  });

  ngOnInit() {
    this.loadWorkspaces();
  }

  loadWorkspaces() {
    this.loading.set(true);
    this.wsApi.list().subscribe({
      next: (rows) => {
        this.workspaces.set(rows);
        // seleccionar por defecto: lastWorkspaceId o primero
        const remembered = localStorage.getItem('lastWorkspaceId');
        const defaultId = remembered && rows.some(w => w.id === remembered) ? remembered : rows[0]?.id;
        if (defaultId) {
          this.selectedWsId.set(defaultId);
          localStorage.setItem('lastWorkspaceId', defaultId);
          this.reload();
        }
        this.loading.set(false);
      },
      error: (e) => {
        this.error.set(e?.error?.message ?? 'Error al cargar workspaces');
        this.loading.set(false);
      }
    });
  }

  onWsChanged(ev: Event) {
    const id = (ev.target as HTMLSelectElement).value;
    this.selectedWsId.set(id);
    localStorage.setItem('lastWorkspaceId', id);
    this.reload();
  }

  reload() {
    const wsId = this.selectedWsId();
    if (!wsId) return;
    this.loading.set(true);
    this.api.list(wsId).subscribe({
      next: (rows:any[]) => { this.projects.set(rows); this.loading.set(false); },
      error: (e) => { this.error.set(e?.error?.message ?? 'Error al listar'); this.loading.set(false); },
    });
  }

  create() {
    if (this.form.invalid || this.loading()) return;
    const wsId = this.selectedWsId();
    const { name, description, tags } = this.form.value;
    const tagArr = (tags||'').split(',').map(s=>s.trim()).filter(Boolean);
    this.loading.set(true);
    this.api.create(wsId, { name: name!, description: description||undefined, tags: tagArr }).subscribe({
      next: () => {
        this.form.patchValue({ name:'', description:'', tags:'' });
        this.reload();
        this.loading.set(false);
      },
      error: (e) => { this.error.set(e?.error?.message ?? 'No se pudo crear'); this.loading.set(false); },
    });
  }

  archive(id: string) {
    this.api.archive(id).subscribe({
      next: ()=> this.reload(),
      error: (e)=> this.error.set(e?.error?.message ?? 'No se pudo archivar')
    });
  }
  restore(id: string) {
    this.api.restore(id).subscribe({
      next: ()=> this.reload(),
      error: (e)=> this.error.set(e?.error?.message ?? 'No se pudo restaurar')
    });
  }
  remove(id: string) {
    this.api.remove(id).subscribe({
      next: ()=> this.reload(),
      error: (e)=> this.error.set(e?.error?.message ?? 'No se pudo eliminar')
    });
  }
}
