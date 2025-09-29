import { TestBed } from '@angular/core/testing';

import { VersionsApi } from './versions-api';

describe('VersionsApi', () => {
  let service: VersionsApi;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VersionsApi);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
