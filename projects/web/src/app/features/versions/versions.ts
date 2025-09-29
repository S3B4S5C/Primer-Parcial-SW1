import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { VersionsApiService } from '../../core/services/versions-api';

@Component({
  standalone: true,
  selector: 'app-versions',
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  template: `
  <div class="wrap">
    <div class="header">
      <a [routerLink]="['/app']">← Proyectos</a>
      <h1>Versiones</h1>
      <a [routerLink]="['/app/projects', projectId(), 'editor']">Ir al editor</a>
    </div>

    <div class="grid">
      <!-- Ramas -->
      <div class="col">
        <h3>Ramas</h3>
        <ul class="list">
          <li *ngFor="let b of branches()" [class.sel]="b.id===branchId()" (click)="selectBranch(b.id)">
            {{ b.name }} <span *ngIf="b.isDefault" class="badge">default</span>
            <div class="muted" *ngIf="b.latestVersion">v:{{ b.latestVersion.id | slice:0:6 }} · {{ b.latestVersion.createdAt | date:'short' }}</div>
          </li>
        </ul>

        <form [formGroup]="branchForm" (ngSubmit)="createBranch()">
          <h4>Nueva rama</h4>
          <input placeholder="nombre" formControlName="name" />
          <select formControlName="fromVersionId">
            <option value="">(desde última de la rama seleccionada)</option>
            <option *ngFor="let v of versions()" [value]="v.id">v {{ v.id | slice:0:7 }} - {{ v.message||'—' }}</option>
          </select>
          <button [disabled]="branchForm.invalid">Crear rama</button>
        </form>
      </div>

      <!-- Timeline -->
      <div class="col">
        <h3>Timeline</h3>
        <ul class="list">
          <li *ngFor="let v of versions()" (click)="selectVersion(v.id)" [class.sel]="v.id===selectedVersionId()">
            <b>v{{ v.id | slice:0:7 }}</b> · {{ v.createdAt | date:'short' }} · {{ v.author?.name || v.author?.email || '—' }}
            <div class="muted">{{ v.message || '—' }}</div>
          </li>
        </ul>
      </div>

      <!-- Operaciones -->
      <div class="col">
        <h3>Operaciones</h3>

        <section>
          <h4>Diff</h4>
          <label>Desde
            <select [value]="diffFromId()" #fromSel (change)="diffFromId.set(fromSel.value)">
              <option *ngFor="let v of versions()" [value]="v.id">
                v {{ v.id | slice:0:7 }} - {{ v.message || '—' }}
              </option>
            </select>
          </label>
          <label>Hasta
            <select [value]="diffToId()" #toSel (change)="diffToId.set(toSel.value)">
              <option *ngFor="let v of versions()" [value]="v.id">
                v {{ v.id | slice:0:7 }} - {{ v.message || '—' }}
              </option>
            </select>
          </label>
          <button (click)="runDiff()" [disabled]="!diffFromId() || !diffToId()">Comparar</button>
          <div *ngIf="diffRes()">
            <pre class="pre">{{ diffRes().summary | json }}</pre>
          </div>
        </section>

        <section>
          <h4>Restore</h4>
          <button (click)="restore()" [disabled]="!selectedVersionId()">Restaurar a versión seleccionada</button>
        </section>

        <section>
          <h4>Merge</h4>
          <label>Origen (branch)
            <select [value]="mergeSourceBranchId()" #srcBranch (change)="onPickSourceBranch(srcBranch.value)">
              <option *ngFor="let b of branches()" [value]="b.id">{{ b.name }}</option>
            </select>
          </label>
          <label>Versión origen
            <select [value]="mergeSourceVersionId()" #srcVer (change)="mergeSourceVersionId.set(srcVer.value)">
              <option *ngFor="let v of mergeSourceVersions()" [value]="v.id">
                {{ v.id | slice:0:7 }} - {{ v.message || '—' }}
              </option>
            </select>
          </label>
          <label>Destino (branch)
            <select [value]="branchId()" disabled>
              <option [value]="branchId()">{{ branchName(branchId()) }}</option>
            </select>
          </label>
          <label>Versión destino
            <select [value]="selectedVersionId()" #dstVer (change)="selectVersion(dstVer.value)">
              <option *ngFor="let v of versions()" [value]="v.id">
                {{ v.id | slice:0:7 }} - {{ v.message || '—' }}
              </option>
            </select>
          </label>
          <button (click)="runMerge()" [disabled]="!mergeSourceVersionId() || !selectedVersionId()">Merge → destino</button>

          <div *ngIf="mergeRes()">
            <p>Estado: <b>{{ mergeRes().status }}</b></p>
            <div *ngIf="mergeRes().conflicts?.length">
              <details>
                <summary>Conflictos ({{ mergeRes().conflicts.length }})</summary>
                <pre class="pre">{{ mergeRes().conflicts | json }}</pre>
              </details>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
  `,
  styles: [`
    .wrap{max-width:1100px;margin:2rem auto}
    .header{display:flex;gap:1rem;align-items:center;justify-content:space-between}
    .grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-top:12px}
    .col{border:1px solid #e5e7eb;border-radius:12px;padding:12px;min-height:420px}
    .list{list-style:none;padding:0;margin:0}
    .list li{padding:.5rem;border-bottom:1px solid #eee;cursor:pointer}
    .list li.sel{background:#f3f4f6}
    .badge{background:#eef2ff;color:#3730a3;border-radius:8px;padding:2px 6px;font-size:.75rem;margin-left:.4rem}
    .muted{color:#6b7280}
    input,select,button{padding:.4rem .5rem;border:1px solid #d1d5db;border-radius:8px;width:100%;margin:.25rem 0}
    button{cursor:pointer}
    .pre{background:#0b1021;color:#d1e4ff;padding:.5rem;border-radius:8px;max-height:220px;overflow:auto}
  `]
})
export class VersionsComponent implements OnInit {
  private api = inject(VersionsApiService);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);

  projectId = signal<string>('');
  branches = signal<any[]>([]);
  branchId = signal<string>('');
  versions = signal<any[]>([]);
  selectedVersionId = signal<string>('');

  // New branch
  branchForm = this.fb.group({ name: ['', Validators.required], fromVersionId: [''] });

  // Diff
  diffFromId = signal<string>('');
  diffToId = signal<string>('');
  diffRes = signal<any | null>(null);

  // Merge
  mergeSourceBranchId = signal<string>('');
  mergeSourceVersions = signal<any[]>([]);
  mergeSourceVersionId = signal<string>('');
  mergeRes = signal<any | null>(null);

  ngOnInit() {
    this.projectId.set(this.route.snapshot.paramMap.get('projectId')!);
    this.loadBranches();
  }

  branchName(id: string): string {
    const b = this.branches().find(x => x.id === id);
    return b?.name ?? '';
  }

  loadBranches() {
    this.api.listBranches(this.projectId()).subscribe(bs => {
      this.branches.set(bs as any[]);
      const pick = bs.find((b: any) => b.isDefault) ?? bs[0];
      if (pick) { this.selectBranch(pick.id); }
      // init merge source
      if (bs?.length) { this.mergeSourceBranchId.set(bs[0].id); this.loadSourceVersions(bs[0].id); }
    });
  }

  selectBranch(bid: string) {
    this.branchId.set(bid);
    this.api.listVersions(this.projectId(), bid).subscribe(vs => {
      this.versions.set(vs as any[]);
      const first = vs[0];
      if (first) { this.selectedVersionId.set(first.id); this.diffFromId.set(first.id); this.diffToId.set(first.id); }
    });
  }

  selectVersion(id: string) { this.selectedVersionId.set(id); }

  createBranch() {
    const { name, fromVersionId } = this.branchForm.value;
    this.api.createBranch(this.projectId(), { name: name!, fromVersionId: fromVersionId || undefined })
      .subscribe(() => { this.branchForm.reset({ name: '', fromVersionId: '' }); this.loadBranches(); });
  }

  runDiff() {
    if (!this.diffFromId() || !this.diffToId()) return;
    this.api.diff(this.projectId(), this.diffFromId(), this.diffToId())
      .subscribe(r => this.diffRes.set(r));
  }

  restore() {
    if (!this.selectedVersionId()) return;
    if (!confirm('Crear snapshot restaurando a la versión seleccionada?')) return;
    this.api.restore(this.projectId(), this.selectedVersionId())
      .subscribe(() => this.selectBranch(this.branchId()));
  }

  onPickSourceBranch(bid: string) {
    this.mergeSourceBranchId.set(bid);
    this.loadSourceVersions(bid);
  }
  loadSourceVersions(bid: string) {
    this.api.listVersions(this.projectId(), bid).subscribe(vs => {
      this.mergeSourceVersions.set(vs as any[]);
      if (vs[0]) this.mergeSourceVersionId.set(vs[0].id);
    });
  }

  runMerge() {
    const body = {
      sourceBranchId: this.mergeSourceBranchId(),
      targetBranchId: this.branchId(),
      sourceVersionId: this.mergeSourceVersionId(),
      targetVersionId: this.selectedVersionId(),
    };
    this.api.merge(this.projectId(), body).subscribe(r => {
      this.mergeRes.set(r);
      // recargar timeline destino para ver la versión resultante
      this.selectBranch(this.branchId());
    });
  }
}
