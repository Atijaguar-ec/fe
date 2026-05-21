import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ShrimpMsService, CommercialPresentation } from '../../../services/shrimp-ms.service';
import { ShrimpDataService } from '../../../services/shrimp-data.service';

@Component({
  selector: 'app-presentation-selector-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './presentation-selector-modal.component.html',
  styleUrls: ['./presentation-selector-modal.component.css']
})
export class PresentationSelectorModalComponent implements OnInit {
  @Input() destino: string = '';
  @Input() isVisible: boolean = false;
  
  @Output() onSelect = new EventEmitter<CommercialPresentation>();
  @Output() onClose = new EventEmitter<void>();

  COMPANY_ID: number | null = null;
  allPresentations: CommercialPresentation[] = [];
  filteredPresentations: CommercialPresentation[] = [];
  
  // Filters
  searchTerm: string = '';
  selectedBrand: string = '';
  selectedStyle: string = '';

  availableBrands: string[] = [];
  availableStyles: string[] = [];

  constructor(
    private shrimpMs: ShrimpMsService,
    private dataService: ShrimpDataService
  ) {}

  ngOnInit(): void {
    this.dataService.getActiveCompany().subscribe(company => {
      const companyIds = company?.data?.companyIds || company?.companyIds || [];
      this.COMPANY_ID = companyIds.length > 0 ? companyIds[0] : null;
      if (this.COMPANY_ID && this.isVisible) {
        this.loadPresentations();
      }
    });
  }

  ngOnChanges(): void {
    if (this.isVisible && this.COMPANY_ID) {
      this.loadPresentations();
    }
  }

  loadPresentations(): void {
    if (!this.COMPANY_ID) return;
    this.shrimpMs.listPresentations(this.COMPANY_ID, this.destino).subscribe(list => {
      this.allPresentations = list;
      this.extractFilters();
      this.applyFilters();
    });
  }

  extractFilters(): void {
    const brands = new Set<string>();
    const styles = new Set<string>();
    
    this.allPresentations.forEach(p => {
      if (p.brandName) brands.add(p.brandName);
      if (p.style) styles.add(p.style);
    });
    
    this.availableBrands = Array.from(brands).sort();
    this.availableStyles = Array.from(styles).sort();
  }

  applyFilters(): void {
    this.filteredPresentations = this.allPresentations.filter(p => {
      const matchesSearch = this.searchTerm ? 
        (p.name.toLowerCase().includes(this.searchTerm.toLowerCase()) || 
         (p.presentationFormat && p.presentationFormat.toLowerCase().includes(this.searchTerm.toLowerCase()))) : true;
      const matchesBrand = this.selectedBrand ? p.brandName === this.selectedBrand : true;
      const matchesStyle = this.selectedStyle ? p.style === this.selectedStyle : true;
      
      return matchesSearch && matchesBrand && matchesStyle;
    });
  }

  selectPresentation(p: CommercialPresentation): void {
    this.onSelect.emit(p);
  }

  close(): void {
    this.onClose.emit();
  }
}
