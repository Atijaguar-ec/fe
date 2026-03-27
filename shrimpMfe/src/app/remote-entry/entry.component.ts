import { Component } from '@angular/core';

@Component({
  selector: 'app-shrimp-entry',
  standalone: false,
  template: `
    <div class="shrimp-mfe-container">
      <div class="shrimp-header">
        <h2>🦐 Shrimp Module</h2>
        <p class="module-status">Remote MFE loaded successfully</p>
      </div>

      <div class="shrimp-content">
        <div class="info-card">
          <h3>Module Info</h3>
          <table>
            <tr><td>Module Name</td><td><strong>shrimpMfe</strong></td></tr>
            <tr><td>Status</td><td><span class="badge badge-active">Active</span></td></tr>
            <tr><td>Port</td><td>4201</td></tr>
            <tr><td>Type</td><td>Remote (Producer)</td></tr>
          </table>
        </div>

        <div class="info-card">
          <h3>Ready for Development</h3>
          <ul>
            <li>Replace this component with your Shrimp business logic</li>
            <li>Add child routes in <code>entry.routes.ts</code></li>
            <li>Create services and components under <code>shrimpMfe/src/app/</code></li>
          </ul>
        </div>
      </div>

      <router-outlet></router-outlet>
    </div>
  `,
  styles: [`
    .shrimp-mfe-container {
      padding: 2rem;
      font-family: 'Open Sans', sans-serif;
    }
    .shrimp-header {
      border-bottom: 2px solid #2d6a4f;
      padding-bottom: 1rem;
      margin-bottom: 2rem;
    }
    .shrimp-header h2 {
      color: #2d6a4f;
      font-size: 1.75rem;
      margin: 0;
    }
    .module-status {
      color: #6c757d;
      font-size: 0.875rem;
      margin: 0.25rem 0 0;
    }
    .shrimp-content {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.5rem;
    }
    .info-card {
      background: #f8f9fa;
      border: 1px solid #dee2e6;
      border-radius: 8px;
      padding: 1.5rem;
    }
    .info-card h3 {
      color: #2d6a4f;
      font-size: 1.1rem;
      margin: 0 0 1rem;
    }
    table { width: 100%; border-collapse: collapse; }
    td { padding: 0.5rem 0; border-bottom: 1px solid #eee; }
    td:first-child { color: #6c757d; width: 40%; }
    .badge { padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; }
    .badge-active { background: #d4edda; color: #155724; }
    ul { padding-left: 1.25rem; margin: 0; }
    li { margin-bottom: 0.5rem; color: #495057; }
    code { background: #e9ecef; padding: 2px 6px; border-radius: 3px; font-size: 0.85rem; }
  `]
})
export class RemoteEntryComponent {}
