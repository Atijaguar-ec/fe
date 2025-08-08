import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { BehaviorSubject, Observable } from 'rxjs';
import { distinctUntilChanged, map, shareReplay, switchMap } from 'rxjs/operators';
import { ApiDocument } from 'src/api/model/apiDocument';
import { UnsubscribeList } from 'src/shared/rxutils';
import { CommonControllerService } from 'src/api/api/commonController.service';

@Component({
    selector: 'image-viewer',
    templateUrl: './image-viewer.component.html',
    styleUrls: ['./image-viewer.component.scss']
})
export class ImageViewerComponent implements OnInit, OnDestroy {
    @Input() set fileInfo(value: ApiDocument) {
        this._fileInfo = value;
        this.fileInfo$.next(value);
    }

    get fileInfo(): ApiDocument {
        return this._fileInfo;
    }

    constructor(
        private fileService: CommonControllerService,
        private sanitizer: DomSanitizer
    ) { }

    @Input()
    url: string = null;

    @Input()
    width: number = null;

    @Input()
    height: number = null;

    @Input()
    signInImage = false;

    @Input()
    centerVertical = false;

    private _fileInfo = null;


    @Input()
    directLink = true;

    @Input()
    chainApi = false;

    private fileInfo$ = new BehaviorSubject(this.fileInfo);
    public dataUrl$ = this.fileInfo$.pipe(
        distinctUntilChanged((prev, curr) => prev.storageKey == curr.storageKey),
        switchMap(info => this.loadImage(info)),
        shareReplay(1)
    );

    private unsubscribeList = new UnsubscribeList();

    private loadImage(fileInfo: ApiDocument): Observable<any> {
        return this.fileService.getDocument(fileInfo.storageKey).pipe(
            map(x => this.sanitizer.bypassSecurityTrustUrl(URL.createObjectURL(x)))
        );
    }

    ngOnInit() {
    }

    ngOnDestroy() {
        this.unsubscribeList.cleanup();
    }

}
