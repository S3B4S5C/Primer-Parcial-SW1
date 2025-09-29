// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';
import { AuthComponent } from './features/auth/login/login';
import { ProjectsComponent } from './features/projects/projects';
import { ModelEditorComponent } from './features/editor/editor';
export const routes: Routes = [
  { path: 'login', component: AuthComponent },
  { path: 'auth', redirectTo: 'login', pathMatch: 'full' },
  { path: 'app', canActivate: [authGuard], component: ProjectsComponent },
  {
    path: 'app/projects/:projectId/editor',
    canActivate: [authGuard],
    component: ModelEditorComponent
  },
  { path: '', pathMatch: 'full', redirectTo: 'app' },
  { path: '**', redirectTo: 'app' },

];
