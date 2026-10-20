import './polyfills.ts';

import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { environment } from './environments/environment';

import { loadTranslations } from '@angular/localize';
import { LanguageCodeHelper } from './app/language-code-helper';

if (environment.production) {
  enableProdMode();
}

const languageCode = LanguageCodeHelper.getCurrentLocale();

const bootstrapApp = () => {
  // Fix for Angular HMR: Remove any leftover NgbModal backdrops or windows 
  // that survive hot-reloads and block mouse interactions.
  document.querySelectorAll('ngb-modal-backdrop, ngb-modal-window, .modal-backdrop').forEach(el => el.remove());

  import('./app/app.module')
    .then((module) => {
      platformBrowserDynamic()
        .bootstrapModule(module.AppModule)
        .catch((err) => console.error(err));
    })
    .catch((err) => console.error('first', err));
};

if (languageCode && languageCode !== 'en') {
  fetch(`/assets/locale/${languageCode}.json`)
    .then((res) => {
      if (!res.ok) throw new Error(`Failed to load translations for ${languageCode}`);
      return res.json();
    })
    .then((data) => {
      if (data && data.translations) {
        loadTranslations(data.translations);
      }
      bootstrapApp();
    })
    .catch((err) => {
      console.error('Translation load error:', err);
      bootstrapApp(); // fallback to default language
    });
} else {
  bootstrapApp();
}
