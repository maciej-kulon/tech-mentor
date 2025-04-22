import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ElectricalCadCanvasComponent } from './electrical-cad-canvas.component';

describe('ElectricalCadCanvasComponent', () => {
  let component: ElectricalCadCanvasComponent;
  let fixture: ComponentFixture<ElectricalCadCanvasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ElectricalCadCanvasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ElectricalCadCanvasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
