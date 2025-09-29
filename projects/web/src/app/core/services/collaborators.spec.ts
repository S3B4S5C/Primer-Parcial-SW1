import { TestBed } from '@angular/core/testing';

import { Collaborators } from './collaborators';

describe('Collaborators', () => {
  let service: Collaborators;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Collaborators);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
