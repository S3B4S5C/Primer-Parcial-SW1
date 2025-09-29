import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class ProjectsService {
  constructor(private http: HttpClient) {}
  list(workspaceId?: string) {
    const url = workspaceId ? `/api/projects?workspaceId=${workspaceId}` : '/api/projects';
    return this.http.get<any[]>(url);
  }
  create(workspaceId: string, body: { name: string; description?: string; tags?: string[] }) {
    return this.http.post(`/api/projects/workspace/${workspaceId}`, body);
  }
  update(projectId: string, body: { name?: string; description?: string; tags?: string[] }) {
    return this.http.patch(`/api/projects/${projectId}`, body);
  }
  archive(projectId: string) { return this.http.post(`/api/projects/${projectId}/archive`, {}); }
  restore(projectId: string) { return this.http.post(`/api/projects/${projectId}/restore`, {}); }
  remove(projectId: string)  { return this.http.delete(`/api/projects/${projectId}`); }
}
