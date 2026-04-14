import './polyfills.ts';

import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
}

import('./app/app.module')
  .then((module) => {
    platformBrowserDynamic()
      .bootstrapModule(module.AppModule)
      .catch((err) => console.error(err));
  })
  .catch((err) => console.error('first', err));
