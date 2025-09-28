import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CollabCore } from './collab-core';

describe('CollabCore', () => {
  let component: CollabCore;
  let fixture: ComponentFixture<CollabCore>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CollabCore]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CollabCore);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
