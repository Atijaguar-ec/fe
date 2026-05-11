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
      // Destinos and Rechazo deprecated — unified into Clasificación
      {
        path: 'liquidacion',
        loadComponent: () =>
          import('../liquidacion/liquidacion.component').then(
            (m) => m.LiquidacionComponent
          ),
      },
      {
        path: 'masterizado',
        loadComponent: () =>
          import('../masterizado/masterizado.component').then(
            (m) => m.MasterizadoComponent
          ),
      },
      {
        path: 'inventario',
        loadComponent: () =>
          import('../inventario/inventario.component').then(
            (m) => m.InventarioComponent
          ),
      },
      {
        path: 'presentaciones',
        loadComponent: () =>
          import('../presentations-config/presentations-config.component').then(
            (m) => m.PresentationsConfigComponent
          ),
      }
    ]
  },
];
