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
        <!-- Logo Header -->
        <div class="sidebar-header">
          <div class="brand">
            <span class="brand-logomark">INA</span>
          </div>
          <div class="brand-title">Dufer Cia. Ltda.</div>
          <div class="settings-icon">⚙️</div>
        </div>

        <nav class="nav">
          <a routerLink="recepcion" routerLinkActive="active" class="nav-item">
            <span class="nav-text">Recepción</span>
          </a>
          <a routerLink="clasificacion" routerLinkActive="active" class="nav-item">
            <span class="nav-text">Clasificación</span>
          </a>
          <a class="nav-item nav-disabled">
            <span class="nav-text">Destinos</span>
          </a>
          <a class="nav-item nav-disabled">
            <span class="nav-text">Rechazo</span>
          </a>
          <a class="nav-item nav-disabled">
            <span class="nav-text">Liquidación</span>
          </a>
          <a class="nav-item nav-disabled">
            <span class="nav-text">Masterizado</span>
          </a>
        </nav>

        <div class="sidebar-footer">
          <div class="version-info">
            <span class="live-dot"></span>
            v0.1 · Demo Shrimp
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
            SysAdmin (Dufer Cia. Ltda.) ≡
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
      /* ShrimpMfe Scoped Design System Variables */
      --ina-primary: #999933;         /* INATrace olive green */
      --ina-primary-light: #e7e8ba;
      --ina-secondary: #c87711;       /* INATrace orange */
      --ina-secondary-light: #fef4e8;
      
      display: flex;
      height: 100vh;
      overflow: hidden;
      background-color: #f7f7f7; /* INATrace light gray background */
      font-family: 'Open Sans', sans-serif;
    }

    /* Original Sidebar Styles inspired by screenshot */
    .sidebar {
      width: 250px;
      min-width: 250px;
      background: #ffffff;
      border-right: 1px solid #e0e0e0;
      display: flex;
      flex-direction: column;
      position: relative;
    }

    /* The orange accent strip on the left of the sidebar */
    .sidebar::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 50px;
      background-color: var(--ina-secondary); /* #c87711 */
      z-index: 1;
    }

    .sidebar-header {
      padding: 1rem 1rem 1rem 60px;
      height: 70px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid transparent;
      position: relative;
      z-index: 2;
    }

    .brand {
      position: absolute;
      left: 6px;
      top: 15px;
      background: #ffffff;
      width: 38px;
      height: 38px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .brand-logomark {
      color: var(--ina-secondary);
      font-weight: 700;
      font-size: 14px;
      letter-spacing: -0.5px;
    }

    .brand-title {
      font-size: 1.15rem;
      font-weight: 600;
      color: var(--ina-secondary);
      font-family: 'PathwayGothicOne-Regular', 'Open Sans', sans-serif;
    }
    
    .settings-icon {
      font-size: 1.1rem;
      color: var(--ina-secondary);
      cursor: pointer;
    }

    .nav {
      flex: 1;
      padding: 2rem 0;
      overflow-y: auto;
      z-index: 2;
    }

    .nav-item {
      display: block;
      padding: 0.85rem 1rem 0.85rem 60px;
      color: #333333;
      text-decoration: none;
      font-size: 0.95rem;
      font-weight: 400;
      cursor: pointer;
      position: relative;
      border-left: 3px solid transparent;
    }
    
    .nav-item:hover:not(.nav-disabled) {
      background: #fcfcfc;
      color: var(--ina-secondary);
    }
    
    /* White background overriding the orange strip locally */
    .nav-item.active {
      background: #f7f7f7;
      color: var(--ina-secondary);
      font-weight: 600;
      position: relative;
    }
    .nav-item.active::before {
      content: '';
      position: absolute;
      left: 48px;
      top: 0;
      bottom: 0;
      width: 4px;
      background: var(--ina-secondary);
    }

    .nav-disabled {
      opacity: 0.5;
      cursor: default;
    }

    .sidebar-footer {
      padding: 1rem 1.5rem 1rem 60px;
      z-index: 2;
    }
    .version-info {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.75rem;
      color: #999999;
    }
    .live-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #26ae60;
    }

    /* Main Content */
    .main-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .top-nav {
      height: 70px;
      background: #ffffff;
      border-bottom: 1px solid #e0e0e0;
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
      font-size: 0.85rem;
      color: #333333;
      cursor: pointer;
      position: relative;
      height: 100%;
    }
    .top-nav-item.active {
      color: var(--ina-secondary);
    }
    .top-nav-item.active::after {
      content: '';
      position: absolute;
      bottom: -1px;
      left: 0;
      right: 0;
      height: 2px;
      background: var(--ina-secondary);
    }

    .user-profile {
      font-size: 0.85rem;
      color: #333333;
    }

    .page-container {
      flex: 1;
      padding: 2.5rem;
      overflow-y: auto;
    }
  `]
})
export class LayoutComponent {}
