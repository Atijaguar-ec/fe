import {Component, OnInit, EventEmitter, Input, Output} from '@angular/core';

@Component({
    selector: 'app-cookie-banner',
    templateUrl: './cookie-banner.component.html',
    styleUrls: ['./cookie-banner.component.scss']
})
export class CookieBannerComponent implements OnInit {

    @Output() onAccept = new EventEmitter<boolean>();

    @Input()
    cookieInfoUrl = '#';

    constructor() {}

    ngOnInit() {
    }

    acceptCookies(event: Event): void {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        this.onAccept.emit(true);
    }

}
