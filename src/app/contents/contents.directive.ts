import { Directive, Input, OnChanges, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, Observable, Subject, Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
// import { Settings } from 'src/app/settings';
// import { validEvents } from '@tinymce/tinymce-angular/editor/Events';

export interface SectionError {
    section: string;
    error: boolean;
}

@Directive({
    selector: '[contents]',
    exportAs: 'contents',
})
export class ContentsDirective implements OnInit, OnChanges, OnDestroy {
    @Input() set submitted(value: boolean) {
        this._submitted = value;
        if(this._errorSections$) {
            this._errorSections$.next(this.currentErrorSections);  // ping
        }
    }

    get submitted(): boolean {
        return this._submitted;
    }

    constructor(
        // public settings: Settings
    ) {
    }


    get scrollOffset(): number {
        if(this.initialScrollOffset == null) {
            return 250;
        }
        return this.initialScrollOffset;
    }
    @Input() scrollingView: HTMLElement;
    @Input() initialValue: string | null = null;
    @Input() initialParentValue: string | null = null;

    @Input()
    initialScrollOffset: number | null = null;

    @Input() faqs: any[] = [];

    _submitted: boolean = false;

    _onScroll$: Subject<Event> = new Subject<Event>();
    _activeSection$: BehaviorSubject<string | null>;
    _activeParentSection$: BehaviorSubject<string | null>;
    _errorSections$: BehaviorSubject<Record<string, boolean>>;
    _errorReporter$: BehaviorSubject<SectionError | null> = new BehaviorSubject<SectionError | null>(null);

    subError: Subscription;
    currentErrorSections: Record<string, boolean> = {};

    private scrollFun: EventListenerOrEventListenerObject = (event: Event) => this._onScroll$.next(event);

    public faqsForSection(section: string): any[] {
        return this.faqs.filter(x => x.tag === section).sort((a, b) => (a.date > b.date) ? 1 : -1);
    }

    ngOnInit() {
        this._activeSection$ = new BehaviorSubject<string | null>(this.initialValue);
        this._activeParentSection$ = new BehaviorSubject<string | null>(this.initialParentValue);
        this._errorSections$ = new BehaviorSubject<Record<string, boolean>>({});
        this.subError = this._errorReporter$.subscribe((error: SectionError | null) =>{
            if(error) {
                this.currentErrorSections[error.section] = error.error;
                this._errorSections$.next(this.currentErrorSections);
            }
        });
        this.unsubscribeScrollEventListener();
        this.subscribeScrollEventListener();
    }

    ngOnChanges() {
        this.unsubscribeScrollEventListener();
        this.subscribeScrollEventListener();
    }

    ngOnDestroy() {
        this.unsubscribeScrollEventListener();
        if(this.subError) { this.subError.unsubscribe(); }
    }

    // Subscribe to scrollingView scroll events. Sections will detectChanges() on scroll changes.
    subscribeScrollEventListener() {
        (this.scrollingView || document).addEventListener('scroll', this.scrollFun, false);
    }

    unsubscribeScrollEventListener() {
        (this.scrollingView || document).removeEventListener('scroll', this.scrollFun, false);
    }

    activeSection(): Observable<string> {
        return this._activeSection$.pipe(
            filter((section): section is string => !!section)
        );
    }

    activeParentSection(): Observable<string> {
        return this._activeParentSection$.pipe(
            filter((section): section is string => !!section)
        );
    }

}
