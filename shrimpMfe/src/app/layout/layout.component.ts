import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="layout-container">
      <nav class="sidebar">
        <div class="logo">🦐 INATrace Camarón</div>
        <ul>
          <li><a routerLink="recepcion" routerLinkActive="active">📥 Recepción</a></li>
          <li><a routerLink="clasificacion" routerLinkActive="active">📏 Clasificación</a></li>
          <!-- <li><a routerLink="destinos" routerLinkActive="active">📦 Destinos</a></li> -->
          <!-- <li><a routerLink="liquidacion" routerLinkActive="active">📊 Liquidación</a></li> -->
        </ul>
      </nav>
      <main class="content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .layout-container {
      display: flex;
      height: 100vh;
      background-color: #1a202c;
      color: #e2e8f0;
      font-family: system-ui, -apple-system, sans-serif;
    }
    .sidebar {
      width: 260px;
      background-color: #2d3748;
      padding: 1.5rem 1rem;
      border-right: 1px solid #4a5568;
    }
    .logo {
      font-size: 1.4rem;
      font-weight: bold;
      margin-bottom: 2rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid #4a5568;
      color: #90cdf4;
    }
    .sidebar ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .sidebar li {
      margin-bottom: 0.5rem;
    }
    .sidebar a {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 1rem;
      color: #e2e8f0;
      text-decoration: none;
      border-radius: 0.5rem;
      transition: background-color 0.2s;
      font-size: 1.1rem;
    }
    .sidebar a:hover {
      background-color: #4a5568;
    }
    .sidebar a.active {
      background-color: #3182ce;
      color: white;
      font-weight: bold;
    }
    .content {
      flex: 1;
      padding: 2rem;
      overflow-y: auto;
    }
  `]
})
export class LayoutComponent {}
