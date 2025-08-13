import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { PublicControllerService } from 'src/api/api/publicController.service';

import { QrCodeRedirectComponent } from './qr-code-redirect.component';

describe('QrCodeRedirectComponent', () => {
  let component: QrCodeRedirectComponent;
  let fixture: ComponentFixture<QrCodeRedirectComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [ RouterTestingModule ],
      declarations: [ QrCodeRedirectComponent ],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ uuid: 'x', qrTag: 'y' })
            }
          }
        },
        {
          provide: PublicControllerService,
          useValue: {
            logPublicRequest: () => of({})
          }
        }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(QrCodeRedirectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
