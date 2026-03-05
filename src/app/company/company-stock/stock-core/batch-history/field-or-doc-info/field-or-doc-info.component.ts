import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { FileSaverService } from 'ngx-filesaver';
import { take } from 'rxjs/operators';
import { ApiStockOrderEvidenceFieldValue } from '../../../../../../api/model/apiStockOrderEvidenceFieldValue';
import { ApiStockOrderEvidenceTypeValue } from '../../../../../../api/model/apiStockOrderEvidenceTypeValue';
import { ApiProcessingAction } from '../../../../../../api/model/apiProcessingAction';
import { CommonControllerService } from '../../../../../../api/api/commonController.service';
import { ApiDocument } from '../../../../../../api/model/apiDocument';
import { faFile } from '@fortawesome/free-regular-svg-icons';

@Component({
  selector: 'app-field-or-doc-info',
  templateUrl: './field-or-doc-info.component.html',
  styleUrls: ['./field-or-doc-info.component.scss']
})
export class FieldOrDocInfoComponent implements OnInit, OnChanges {

  readonly faFile = faFile;

  evidenceFieldLabel?: string;

  @Input()
  evidenceField?: ApiStockOrderEvidenceFieldValue | null;

  @Input()
  evidenceDocument?: ApiStockOrderEvidenceTypeValue | null;

  @Input()
  processingAction?: ApiProcessingAction | null;

  constructor(
    private fileService: CommonControllerService,
    private fileSaverService: FileSaverService
  ) { }

  ngOnInit(): void {
    this.updateEvidenceFieldLabel();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.evidenceField || changes.processingAction) {
      this.updateEvidenceFieldLabel();
    }
  }

  private updateEvidenceFieldLabel(): void {
    if (!this.evidenceField) {
      this.evidenceFieldLabel = undefined;
      return;
    }

    const procEvidenceFieldDefinition =
      this.processingAction?.requiredEvidenceFields?.find(value => value.id === this.evidenceField.evidenceFieldId);

    this.evidenceFieldLabel =
      procEvidenceFieldDefinition?.label ||
      this.evidenceField.evidenceFieldName ||
      '/';
  }

  async onDownload(document: ApiDocument) {
    if (document && document.storageKey) {
      const res = await this.fileService.getDocument(document.storageKey).pipe(take(1)).toPromise();
      if (res) {
        this.fileSaverService.save(res, document.name);
      }
    }
  }

}
