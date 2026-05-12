import { Route } from '@angular/router';
import { LayoutComponent } from '../layout/layout.component';
import { ReceptionComponent } from '../recepcion/recepcion.component';
import { ClassificationComponent } from '../clasificacion/clasificacion.component';

export const remoteRoutes: Route[] = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', redirectTo: 'recepcion', pathMatch: 'full' },
      { path: 'recepcion', component: ReceptionComponent },
      { path: 'clasificacion', component: ClassificationComponent },

      // ─── Transformación: 4 módulos independientes ─────────────────
      {
        path: 'transformacion/bloque',
        loadComponent: () =>
          import('../transformacion/bloque/bloque.component').then(m => m.BloqueComponent),
      },
      {
        path: 'transformacion/iqf',
        loadComponent: () =>
          import('../transformacion/iqf/iqf.component').then(m => m.IqfComponent),
      },
      {
        path: 'transformacion/valor-agregado',
        loadComponent: () =>
          import('../transformacion/valor-agregado/valor-agregado.component').then(
            m => m.ValorAgregadoComponent
          ),
      },
      {
        path: 'transformacion/salmuera',
        loadComponent: () =>
          import('../transformacion/salmuera/salmuera.component').then(m => m.SalmueraComponent),
      },

      // ─── Liquidación (3-tab) ────────────────────────────────────────
      {
        path: 'liquidacion',
        loadComponent: () =>
          import('../liquidacion/liquidacion.component').then(m => m.LiquidacionComponent),
      },

      // ─── Gestión ────────────────────────────────────────────────────
      {
        path: 'inventario',
        loadComponent: () =>
          import('../inventario/inventario.component').then(m => m.InventarioComponent),
      },
      {
        path: 'masterizado',
        loadComponent: () =>
          import('../masterizado/masterizado.component').then(m => m.MasterizadoComponent),
      },
      {
        path: 'presentaciones',
        loadComponent: () =>
          import('../presentations-config/presentations-config.component').then(
            m => m.PresentationsConfigComponent
          ),
      },
    ],
  },
];
