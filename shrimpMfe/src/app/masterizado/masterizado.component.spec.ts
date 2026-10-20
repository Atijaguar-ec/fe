import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MasterizadoComponent } from './masterizado.component';

describe('MasterizadoComponent', () => {
  let component: MasterizadoComponent;
  let fixture: ComponentFixture<MasterizadoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MasterizadoComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(MasterizadoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
