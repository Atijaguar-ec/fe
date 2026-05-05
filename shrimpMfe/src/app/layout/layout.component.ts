import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="shell">
      <aside class="sidebar">
        <!-- Brand Header -->
        <div class="sidebar-header">
          <div class="brand-block">
            <div class="brand-icon">
              <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 4C9.4 4 4 9.4 4 16s5.4 12 12 12 12-5.4 12-12S22.6 4 16 4z" fill="rgba(255,255,255,0.15)"/>
                <path d="M22 13c-1.2-2.4-3.8-4-6.8-3.8-3 .2-5.4 2.6-5.6 5.6-.1 1.8.6 3.4 1.8 4.6" stroke="white" stroke-width="1.8" stroke-linecap="round"/>
                <path d="M14 20c1.5 1.5 3.5 2 5.5 1.2s3.2-2.8 3.2-4.8" stroke="white" stroke-width="1.8" stroke-linecap="round"/>
                <circle cx="16" cy="16" r="2" fill="white" opacity="0.9"/>
              </svg>
            </div>
            <div class="brand-text">
              <span class="brand-name">Shrimp Trace</span>
              <span class="brand-sub">Trazabilidad Camarón</span>
            </div>
          </div>
        </div>

        <!-- Navigation -->
        <nav class="nav">
          <div class="nav-section">
            <div class="nav-section-label">Operaciones</div>
            <a routerLink="recepcion" routerLinkActive="active" class="nav-item">
              <span class="nav-icon">
                <svg viewBox="0 0 20 20" fill="currentColor"><path d="M3 3h14a1 1 0 011 1v2a1 1 0 01-1 1H3a1 1 0 01-1-1V4a1 1 0 011-1zm0 6h14a1 1 0 011 1v7a1 1 0 01-1 1H3a1 1 0 01-1-1v-7a1 1 0 011-1zm2 3v2h4v-2H5z"/></svg>
              </span>
              <span class="nav-text">Recepción</span>
            </a>
            <a routerLink="clasificacion" routerLinkActive="active" class="nav-item">
              <span class="nav-icon">
                <svg viewBox="0 0 20 20" fill="currentColor"><path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zm6 0a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zm5 2a1 1 0 112 0v7.268a2 2 0 010 3.464V18a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V6z"/></svg>
              </span>
              <span class="nav-text">Clasificación</span>
            </a>
            <a routerLink="destinos" routerLinkActive="active" class="nav-item">
              <span class="nav-icon">
                <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/></svg>
              </span>
              <span class="nav-text">Destinos</span>
            </a>
            <a routerLink="rechazo" routerLinkActive="active" class="nav-item">
              <span class="nav-icon">
                <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/></svg>
              </span>
              <span class="nav-text">Rechazo</span>
            </a>
          </div>

          <div class="nav-section">
            <div class="nav-section-label">Gestión</div>
            <a routerLink="liquidacion" routerLinkActive="active" class="nav-item">
              <span class="nav-icon">
                <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 1a1 1 0 100 2 1 1 0 000-2z" clip-rule="evenodd"/></svg>
              </span>
              <span class="nav-text">Liquidación</span>
            </a>
            <a routerLink="masterizado" routerLinkActive="active" class="nav-item">
              <span class="nav-icon">
                <svg viewBox="0 0 20 20" fill="currentColor"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/><path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clip-rule="evenodd"/></svg>
              </span>
              <span class="nav-text">Masterizado</span>
            </a>
            <a routerLink="inventario" routerLinkActive="active" class="nav-item">
              <span class="nav-icon">
                <svg viewBox="0 0 20 20" fill="currentColor"><path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"/></svg>
              </span>
              <span class="nav-text">Inventario</span>
            </a>
          </div>
        </nav>

        <!-- Footer -->
        <div class="sidebar-footer">
          <div class="footer-divider"></div>
          <div class="version-info">
            <span class="live-dot"></span>
            <span>v0.1</span>
            <span class="version-sep">·</span>
            <span>Demo Shrimp</span>
          </div>
        </div>
      </aside>

      <main class="main-content">
        <!-- Top Navigation Bar Header Simulation -->
        <header class="top-nav">
          <div class="top-nav-links">
            <a class="top-nav-item active">Recepciones / Entregas</a>
            <a class="top-nav-item">Procesos</a>
            <a class="top-nav-item">Pagos</a>
            <a class="top-nav-item">Todas las existencias</a>
          </div>
          <div class="user-profile" style="display: flex; align-items: center; gap: 1rem;">
            <a href="/es/home" style="text-decoration: none; font-size: 0.8rem; font-weight: 600; padding: 0.4rem 0.8rem; border-radius: 4px; border: 1px solid var(--ina-secondary); color: var(--ina-secondary); display: inline-flex; align-items: center; gap: 0.4rem;">
              <span>←</span> Volver al Core INATrace
            </a>
            SysAdmin ≡
          </div>
        </header>

        <div class="page-container">
          <router-outlet></router-outlet>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .shell {
      --ina-primary: #369bc1;
      --ina-primary-light: #e0f4fc;
      --ina-secondary: #c87711;
      --ina-secondary-light: #fef4e8;

      /* Sidebar palette — deep ocean */
      --sb-bg: #0f1a2e;
      --sb-bg-hover: rgba(255,255,255,0.06);
      --sb-bg-active: rgba(54,155,193,0.15);
      --sb-text: rgba(255,255,255,0.55);
      --sb-text-hover: rgba(255,255,255,0.85);
      --sb-text-active: #5ec4e8;
      --sb-accent: #5ec4e8;
      --sb-divider: rgba(255,255,255,0.08);

      display: flex;
      height: 100vh;
      overflow: hidden;
      background-color: #f5f6f8;
      font-family: 'Open Sans', -apple-system, BlinkMacSystemFont, sans-serif;
    }

    /* ─── SIDEBAR ────────────────────────────── */
    .sidebar {
      width: 240px;
      min-width: 240px;
      background: var(--sb-bg);
      display: flex;
      flex-direction: column;
      position: relative;
      z-index: 10;
      box-shadow: 2px 0 20px rgba(0,0,0,0.15);
    }

    /* Subtle gradient overlay for depth */
    .sidebar::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 40%, rgba(0,0,0,0.1) 100%);
      pointer-events: none;
      z-index: 0;
    }

    /* ─── HEADER ─────────────────────────────── */
    .sidebar-header {
      padding: 1.25rem 1.15rem;
      position: relative;
      z-index: 1;
    }

    .brand-block {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .brand-icon {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: linear-gradient(135deg, #369bc1 0%, #1d6fa5 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow: 0 2px 8px rgba(54,155,193,0.35);
    }
    .brand-icon svg {
      width: 22px;
      height: 22px;
    }

    .brand-text {
      display: flex;
      flex-direction: column;
      gap: 1px;
    }
    .brand-name {
      font-size: 0.95rem;
      font-weight: 700;
      color: #fff;
      letter-spacing: 0.01em;
    }
    .brand-sub {
      font-size: 0.65rem;
      color: var(--sb-text);
      font-weight: 400;
      letter-spacing: 0.02em;
    }

    /* ─── NAVIGATION ─────────────────────────── */
    .nav {
      flex: 1;
      padding: 0.5rem 0;
      overflow-y: auto;
      z-index: 1;
    }

    .nav-section {
      margin-bottom: 0.5rem;
    }

    .nav-section-label {
      padding: 1rem 1.15rem 0.45rem;
      font-size: 0.6rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: rgba(255,255,255,0.25);
      user-select: none;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.7rem;
      padding: 0.55rem 1.15rem;
      margin: 1px 0.5rem;
      color: var(--sb-text);
      text-decoration: none;
      font-size: 0.82rem;
      font-weight: 500;
      cursor: pointer;
      border-radius: 8px;
      position: relative;
      transition: all 0.15s ease;
    }

    .nav-item:hover:not(.nav-disabled) {
      background: var(--sb-bg-hover);
      color: var(--sb-text-hover);
    }
    .nav-item:hover .nav-icon {
      color: var(--sb-text-hover);
    }

    .nav-item.active {
      background: var(--sb-bg-active);
      color: var(--sb-text-active);
      font-weight: 600;
    }
    .nav-item.active .nav-icon {
      color: var(--sb-accent);
    }
    .nav-item.active::before {
      content: '';
      position: absolute;
      left: -0.5rem;
      top: 6px;
      bottom: 6px;
      width: 3px;
      border-radius: 0 3px 3px 0;
      background: var(--sb-accent);
    }

    .nav-icon {
      width: 18px;
      height: 18px;
      flex-shrink: 0;
      color: var(--sb-text);
      transition: color 0.15s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .nav-icon svg {
      width: 16px;
      height: 16px;
    }

    .nav-disabled {
      opacity: 0.35;
      cursor: default;
      pointer-events: none;
    }

    /* ─── FOOTER ──────────────────────────────── */
    .sidebar-footer {
      padding: 0.75rem 1.15rem 1rem;
      z-index: 1;
    }
    .footer-divider {
      height: 1px;
      background: var(--sb-divider);
      margin-bottom: 0.75rem;
    }
    .version-info {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 0.68rem;
      color: rgba(255,255,255,0.3);
    }
    .version-sep { opacity: 0.5; }
    .live-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #34d399;
      box-shadow: 0 0 6px rgba(52,211,153,0.5);
      animation: pulse-dot 2s ease-in-out infinite;
    }
    @keyframes pulse-dot {
      0%, 100% { opacity: 1; box-shadow: 0 0 6px rgba(52,211,153,0.5); }
      50% { opacity: 0.6; box-shadow: 0 0 2px rgba(52,211,153,0.2); }
    }

    /* ─── MAIN CONTENT ────────────────────────── */
    .main-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .top-nav {
      height: 56px;
      background: #ffffff;
      border-bottom: 1px solid #e5e7eb;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 1.5rem;
    }

    .top-nav-links {
      display: flex;
      gap: 2rem;
      height: 100%;
    }
    .top-nav-item {
      display: flex;
      align-items: center;
      font-size: 0.82rem;
      color: #6b7280;
      cursor: pointer;
      position: relative;
      height: 100%;
      font-weight: 500;
      transition: color 0.15s;
    }
    .top-nav-item:hover { color: #1f2937; }
    .top-nav-item.active {
      color: var(--ina-primary);
      font-weight: 600;
    }
    .top-nav-item.active::after {
      content: '';
      position: absolute;
      bottom: -1px;
      left: 0;
      right: 0;
      height: 2px;
      background: var(--ina-primary);
      border-radius: 2px 2px 0 0;
    }

    .user-profile {
      font-size: 0.82rem;
      color: #6b7280;
    }

    .page-container {
      flex: 1;
      padding: 2rem;
      overflow-y: auto;
    }
  `]
})
export class LayoutComponent {}
