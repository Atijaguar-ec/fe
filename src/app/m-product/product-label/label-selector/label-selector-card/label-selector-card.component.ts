import { Component, OnInit, EventEmitter, Output, Input } from '@angular/core';
import { ThemeService } from 'src/app/shared-services/theme.service';
import { BehaviorSubject } from 'rxjs';
import { faTimes, faPen } from '@fortawesome/free-solid-svg-icons';
import { environment } from 'src/environments/environment';
import { ProductControllerService } from 'src/api/api/productController.service';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-label-selector-card',
  templateUrl: './label-selector-card.component.html',
  styleUrls: ['./label-selector-card.component.scss']
})
export class LabelSelectorCardComponent implements OnInit {

  appName: string = environment.appName;
  qrCodeLink = '';

  @Input()
  label = null;

  @Input()
  isSelected = false;

  @Input()
  qrCodeSize = 110;

  @Input()
  currentLabelForm;

  @Input()
  changed: boolean;

  @Input()
  editable = false;

  @Output() onSelect = new EventEmitter<any>();
  @Output() onDelete = new EventEmitter<any>();
  @Output() onMouseOver = new EventEmitter<any>();
  @Output() onTitleChange = new EventEmitter<any>();

  faTimes = faTimes;
  faPen = faPen;

  showDeleteButton$ = new BehaviorSubject<boolean>(false);

  constructor(
    public theme: ThemeService,
    private productController: ProductControllerService
  ) { }

  ngOnInit(): void {
    this.setQRCode();
  }

  async setQRCode() {
    if (this.label && (this.label as any).uuid) {
      try {
        // Try to get language from API
        const res = await this.productController.getProductLabelContent((this.label as any).id).pipe(take(1)).toPromise();
        let language = 'es'; // Default to Spanish
        
        if (res && res.status === 'OK' && res.data && res.data.settings?.language) {
          const apiLang = res.data.settings.language.toLowerCase();
          // Only allow ES or EN
          language = (apiLang === 'en' || apiLang === 'es') ? apiLang : 'es';
        }
        
        const baseUrl = environment.appBaseUrl || window.location.origin;
        this.qrCodeLink = `${baseUrl}/${language}/${environment.qrCodeBasePath}/${(this.label as any).uuid}`;
      } catch (e) {
        // Fallback to Spanish if API fails
        const baseUrl = environment.appBaseUrl || window.location.origin;
        this.qrCodeLink = `${baseUrl}/es/${environment.qrCodeBasePath}/${(this.label as any).uuid}`;
      }
    } else {
      this.qrCodeLink = '';
    }
  }

  enter(e) {
    this.showDeleteButton$.next(true);
  }

  leave(e) {
    this.showDeleteButton$.next(false);
  }

  delete(event) {
    event.stopPropagation();
    this.onDelete.next(this.label);
  }

  toogleEditTitle(event){
    if (!this.editable) {
      return;
    }
    if (this.isSelected) {
      event.stopPropagation();
      this.onTitleChange.emit(this.label);
    }
  }

  select(label) {
    if (!this.changed) { this.onSelect.next({ label, preventEmit: false }); }
    else { this.onSelect.next({ label: null, preventEmit: true}); }
  }

}
