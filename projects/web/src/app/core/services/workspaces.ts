import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export type WorkspaceDTO = {
  id: string; name: string; slug: string; description?: string | null;
  role: 'OWNER'|'ADMIN'|'MEMBER'; projectCount: number;
};

@Injectable({ providedIn: 'root' })
export class WorkspacesService {
  constructor(private http: HttpClient) {}
  list() { return this.http.get<WorkspaceDTO[]>('/api/workspaces'); }
}
