/**
 * 🎨 Chain Theme Service - Dynamic Theme Management
 * 
 * Manages dynamic theming across the application based on the active value chain.
 * Provides reactive theme updates via BehaviorSubject and applies themes using CSS custom properties.
 * 
 * Key Features:
 * - Reactive theme updates (BehaviorSubject)
 * - CSS custom properties for instant visual updates
 * - Integration with PRIMARY_PRODUCT_TYPE
 * - Type-safe theme configuration
 * - Backward compatible with legacy ThemeService
 * 
 * Usage:
 * ```typescript
 * constructor(private chainTheme: ChainThemeService) {
 *   // Subscribe to theme changes
 *   this.chainTheme.currentTheme$.subscribe(theme => {
 *     console.log('New theme:', theme);
 *   });
 * 
 *   // Access current colors (reactive)
 *   const primaryColor = this.chainTheme.currentTheme$.value.primary;
 * 
 *   // Switch theme manually (if needed)
 *   this.chainTheme.setTheme('shrimp');
 * }
 * ```
 * 
 * @author INATrace DevOps Team
 * @version 1.0.0
 */

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { 
  ThemePalette, 
  getChainTheme, 
  getThemeCSSVariables,
  validateTheme,
  ChainThemes
} from './chain-theme.config';

export type ChainType = keyof ChainThemes;

@Injectable({
  providedIn: 'root'
})
export class ChainThemeService {

  /**
   * Reactive theme state
   * Components can subscribe to this to react to theme changes
   */
  private _currentTheme$ = new BehaviorSubject<ThemePalette>(getChainTheme('cocoa'));
  
  /**
   * Public observable for theme subscription
   */
  public readonly currentTheme$: Observable<ThemePalette> = this._currentTheme$.asObservable();

  /**
   * Current active chain type
   */
  private _activeChain: ChainType = 'cocoa';

  /**
   * Flag to track if theme has been initialized
   */
  private _initialized = false;

  constructor() {
    // Theme will be loaded by APP_INITIALIZER
    console.log('🎨 ChainThemeService instantiated');
  }

  /**
   * Initialize theme based on environment configuration
   * Called by APP_INITIALIZER to ensure theme is loaded before app starts
   */
  initializeTheme(productType?: string): void {
    if (this._initialized) {
      console.warn('🎨 Theme already initialized');
      return;
    }

    const chain = this.normalizeChainType(productType);
    console.log(`🎨 Initializing theme for chain: ${chain}`);
    
    this.setTheme(chain);
    this._initialized = true;
  }

  /**
   * Set theme for a specific chain
   * Validates theme and applies CSS custom properties
   */
  setTheme(chain: ChainType): void {
    console.log(`🎨 Setting theme for chain: ${chain}`);

    const theme = getChainTheme(chain);

    // Validate theme completeness
    if (!validateTheme(theme)) {
      console.error(`🎨 Invalid theme for chain: ${chain}. Using default.`);
      return;
    }

    // Update reactive state
    this._currentTheme$.next(theme);
    this._activeChain = chain;

    // Apply CSS custom properties
    this.applyCSSVariables(theme);

    console.log(`🎨 Theme applied successfully for chain: ${chain}`);
  }

  /**
   * Apply theme as CSS custom properties to :root
   * This allows instant visual updates without page reload
   */
  private applyCSSVariables(theme: ThemePalette): void {
    const cssVars = getThemeCSSVariables(theme);
    const root = document.documentElement;

    Object.entries(cssVars).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });

    console.log('🎨 CSS custom properties applied:', Object.keys(cssVars).length);
  }

  /**
   * Get current theme palette (synchronous)
   */
  getCurrentTheme(): ThemePalette {
    return this._currentTheme$.value;
  }

  /**
   * Get current active chain
   */
  getActiveChain(): ChainType {
    return this._activeChain;
  }

  /**
   * Check if a specific chain is active
   */
  isChainActive(chain: ChainType): boolean {
    return this._activeChain === chain;
  }

  /**
   * Get a specific color from current theme
   */
  getColor(colorKey: keyof ThemePalette): string {
    return this._currentTheme$.value[colorKey] as string;
  }

  /**
   * Normalize product type string to ChainType
   */
  private normalizeChainType(productType?: string): ChainType {
    if (!productType) {
      return 'cocoa';
    }

    const normalized = productType.toLowerCase();
    
    if (normalized === 'shrimp' || normalized === 'camaron') {
      return 'shrimp';
    }
    
    if (normalized === 'coffee' || normalized === 'cafe') {
      return 'coffee';
    }
    
    if (normalized === 'cocoa' || normalized === 'cacao') {
      return 'cocoa';
    }

    console.warn(`🎨 Unknown product type: ${productType}. Defaulting to cocoa.`);
    return 'cocoa';
  }

  /**
   * Preview a theme without persisting (useful for theme editor)
   */
  previewTheme(chain: ChainType): void {
    const theme = getChainTheme(chain);
    this.applyCSSVariables(theme);
  }

  /**
   * Reset theme to defaults
   */
  resetTheme(): void {
    this.setTheme('cocoa');
  }

  // ============================================================================
  // Backward Compatibility Layer
  // These properties maintain compatibility with legacy ThemeService usage
  // Components using old `theme.primary` will continue to work
  // ============================================================================

  get primary(): string { return this.getColor('primary'); }
  get primaryLight(): string { return this.getColor('primaryLight'); }
  get primaryLighter(): string { return this.getColor('primaryLighter'); }
  get primaryLightest(): string { return this.getColor('primaryLightest'); }
  get secondary(): string { return this.getColor('secondary'); }
  get tertiary(): string { return this.getColor('tertiary'); }
  
  get success(): string { return this.getColor('success'); }
  get info(): string { return this.getColor('info'); }
  get warning(): string { return this.getColor('warning'); }
  get danger(): string { return this.getColor('danger'); }
  get light(): string { return this.getColor('light'); }
  get dark(): string { return this.getColor('dark'); }
  
  get grayDark(): string { return this.getColor('grayDark'); }
  get gray(): string { return this.getColor('gray'); }
  get graySemi(): string { return this.getColor('graySemi'); }
  get grayLight(): string { return this.getColor('grayLight'); }
  get black(): string { return this.getColor('black'); }
  
  get blue(): string { return this.getColor('blue'); }
  get blueLight(): string { return this.getColor('blueLight'); }
  get red(): string { return this.getColor('red'); }
  get redLight(): string { return this.getColor('redLight'); }
  get yellow(): string { return this.getColor('yellow'); }
  get yellowLight(): string { return this.getColor('yellowLight'); }
  get green(): string { return this.getColor('green'); }
}
