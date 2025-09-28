import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UiDiagram } from './ui-diagram';

describe('UiDiagram', () => {
  let component: UiDiagram;
  let fixture: ComponentFixture<UiDiagram>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UiDiagram]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UiDiagram);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
