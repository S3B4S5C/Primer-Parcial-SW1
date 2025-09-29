import { TestBed } from '@angular/core/testing';

import { Workspaces } from './workspaces';

describe('Workspaces', () => {
  let service: Workspaces;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Workspaces);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
