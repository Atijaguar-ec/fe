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
            <!-- Destinos and Rechazo hidden: integrated into Clasificación screen -->
          </div>

          <!-- ─── Transformación (4 módulos independientes) ──────── -->
          <div class="nav-section">
            <div class="nav-section-label">Transformación</div>
            <a routerLink="transformacion/bloque" routerLinkActive="active" class="nav-item">
              <span class="nav-icon">🧊</span>
              <span class="nav-text">Bloque</span>
            </a>
            <a routerLink="transformacion/iqf" routerLinkActive="active" class="nav-item">
              <span class="nav-icon">❄️</span>
              <span class="nav-text">IQF</span>
            </a>
            <a routerLink="transformacion/valor-agregado" routerLinkActive="active" class="nav-item">
              <span class="nav-icon">⭐</span>
              <span class="nav-text">Valor Agregado</span>
            </a>
            <a routerLink="transformacion/salmuera" routerLinkActive="active" class="nav-item">
              <span class="nav-icon">🧂</span>
              <span class="nav-text">Salmuera</span>
            </a>
          </div>

          <!-- ─── Gestión ──────────────────────────────────────────── -->
          <div class="nav-section">
            <div class="nav-section-label">Gestión</div>
            <a routerLink="liquidacion" routerLinkActive="active" class="nav-item">
              <span class="nav-icon">
                <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 1a1 1 0 100 2 1 1 0 000-2z" clip-rule="evenodd"/></svg>
              </span>
              <span class="nav-text">Liquidación</span>
            </a>
            <a routerLink="inventario" routerLinkActive="active" class="nav-item">
              <span class="nav-icon">
                <svg viewBox="0 0 20 20" fill="currentColor"><path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/></svg>
              </span>
              <span class="nav-text">Inventario</span>
            </a>
            <a routerLink="masterizado" routerLinkActive="active" class="nav-item">
              <span class="nav-icon">📦</span>
              <span class="nav-text">Empaque Final</span>
            </a>
            <a routerLink="presentaciones" routerLinkActive="active" class="nav-item">
              <span class="nav-icon">⚙️</span>
              <span class="nav-text">Marcas</span>
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
      --ina-primary: #999933;         /* Olive Green */
      --ina-primary-light: #f4f4e1;
      --ina-secondary: #c87711;       /* Orange */
      --ina-secondary-light: #fdf3e7;

      /* Sidebar palette — premium light */
      --sb-bg: #ffffff;
      --sb-bg-hover: #f9fafb;
      --sb-bg-active: #f4f4e1;
      --sb-text: #6b7280;
      --sb-text-hover: #1f2937;
      --sb-text-active: #999933;
      --sb-accent: #c87711;
      --sb-divider: #f3f4f6;

      display: flex;
      height: 100vh;
      overflow: hidden;
      background-color: #f3f4f6;
      font-family: 'Open Sans', -apple-system, BlinkMacSystemFont, sans-serif;
    }

    /* ─── SIDEBAR ────────────────────────────── */
    .sidebar {
      width: 250px;
      min-width: 250px;
      background: var(--sb-bg);
      display: flex;
      flex-direction: column;
      position: relative;
      z-index: 10;
      border-right: 1px solid #e5e7eb;
      box-shadow: 4px 0 24px rgba(0,0,0,0.02);
    }

    /* ─── HEADER ─────────────────────────────── */
    .sidebar-header {
      padding: 1.5rem 1.25rem;
      position: relative;
      z-index: 1;
      border-bottom: 1px solid var(--sb-divider);
    }

    .brand-block {
      display: flex;
      align-items: center;
      gap: 0.85rem;
    }

    .brand-icon {
      width: 40px;
      height: 40px;
      border-radius: 12px;
      background: linear-gradient(135deg, var(--ina-secondary) 0%, #e68a15 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow: 0 4px 12px rgba(200, 119, 17, 0.2);
    }
    .brand-icon svg {
      width: 24px;
      height: 24px;
    }

    .brand-text {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .brand-name {
      font-size: 1.1rem;
      font-weight: 800;
      color: #1f2937;
      letter-spacing: -0.01em;
    }
    .brand-sub {
      font-size: 0.7rem;
      color: #9ca3af;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    /* ─── NAVIGATION ─────────────────────────── */
    .nav {
      flex: 1;
      padding: 1.25rem 0.75rem;
      overflow-y: auto;
      z-index: 1;
    }

    .nav-section {
      margin-bottom: 1.5rem;
    }

    .nav-section-label {
      padding: 0 0.75rem 0.5rem;
      font-size: 0.65rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: #9ca3af;
      user-select: none;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.85rem;
      padding: 0.75rem 1rem;
      margin-bottom: 0.25rem;
      color: var(--sb-text);
      text-decoration: none;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      border-radius: 10px;
      position: relative;
      transition: all 0.2s ease;
    }

    .nav-item:hover:not(.nav-disabled) {
      background: var(--sb-bg-hover);
      color: var(--sb-text-hover);
      transform: translateX(4px);
    }
    .nav-item:hover .nav-icon {
      color: var(--ina-secondary);
      transform: scale(1.1);
    }

    .nav-item.active {
      background: var(--sb-bg-active);
      color: var(--sb-text-active);
      box-shadow: inset 0 0 0 1px rgba(153, 153, 51, 0.1);
    }
    .nav-item.active .nav-icon {
      color: var(--sb-accent);
    }
    .nav-item.active::before {
      content: '';
      position: absolute;
      left: -0.75rem;
      top: 50%;
      transform: translateY(-50%);
      height: 60%;
      width: 4px;
      border-radius: 0 4px 4px 0;
      background: var(--sb-accent);
    }

    .nav-icon {
      width: 20px;
      height: 20px;
      flex-shrink: 0;
      color: #9ca3af;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .nav-icon svg {
      width: 18px;
      height: 18px;
    }

    .nav-disabled {
      opacity: 0.4;
      cursor: default;
      pointer-events: none;
    }

    /* ─── FOOTER ──────────────────────────────── */
    .sidebar-footer {
      padding: 1rem 1.5rem;
      background: #f9fafb;
      border-top: 1px solid var(--sb-divider);
      z-index: 1;
    }
    .version-info {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.75rem;
      font-weight: 600;
      color: #6b7280;
    }
    .version-sep { color: #d1d5db; }
    .live-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
      animation: pulse-dot 2s infinite;
    }
    @keyframes pulse-dot {
      0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
      70% { box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
      100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
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
