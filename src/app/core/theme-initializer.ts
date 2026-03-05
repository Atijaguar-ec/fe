/**
 * 🎨 Theme Initializer - APP_INITIALIZER Factory
 * 
 * Ensures the correct theme is loaded before the application starts.
 * Integrates with EnvironmentInfoService to read PRIMARY_PRODUCT_TYPE.
 * 
 * This is similar to how translations are initialized, but for theming.
 * 
 * Usage in app.module.ts:
 * ```typescript
 * import { themeInitializerFactory } from './core/theme-initializer';
 * 
 * providers: [
 *   {
 *     provide: APP_INITIALIZER,
 *     useFactory: themeInitializerFactory,
 *     deps: [ChainThemeService, EnvironmentInfoService],
 *     multi: true
 *   }
 * ]
 * ```
 * 
 * @author INATrace DevOps Team
 * @version 1.0.0
 */

import { ChainThemeService } from '../shared-services/chain-theme.service';
import { EnvironmentInfoService } from './environment-info.service';

/**
 * Factory function for APP_INITIALIZER
 * Returns a function that initializes the theme
 */
export function themeInitializerFactory(
  chainThemeService: ChainThemeService,
  envService: EnvironmentInfoService
): () => Promise<void> {
  return () => {
    return new Promise<void>((resolve) => {
      try {
        const productType = envService.primaryProductType;
        console.log(`🎨 Theme Initializer: Loading theme for ${productType}`);
        
        chainThemeService.initializeTheme(productType);
        
        console.log('🎨 Theme initialization complete');
        resolve();
      } catch (error) {
        console.error('🎨 Theme initialization failed:', error);
        // Initialize with default theme on error
        chainThemeService.initializeTheme('COCOA');
        resolve();
      }
    });
  };
}
