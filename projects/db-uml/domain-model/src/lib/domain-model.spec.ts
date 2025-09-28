import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DomainModel } from './domain-model';

describe('DomainModel', () => {
  let component: DomainModel;
  let fixture: ComponentFixture<DomainModel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DomainModel]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DomainModel);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
