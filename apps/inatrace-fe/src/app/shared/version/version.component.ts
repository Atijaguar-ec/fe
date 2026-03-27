import { Component, OnInit } from '@angular/core';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-version',
  templateUrl: './version.component.html',
  styleUrls: ['./version.component.scss'],
  standalone: false,
})
export class VersionComponent implements OnInit {
  constructor() {}

  get version() {
    return environment.version;
  }

  get environment() {
    return environment.environmentName;
  }

  ngOnInit() {}
}
