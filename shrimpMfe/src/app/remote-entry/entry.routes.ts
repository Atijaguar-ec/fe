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
      {
        path: 'destinos',
        loadComponent: () =>
          import('../destinos/destinos.component').then(
            (m) => m.DestinosComponent
          ),
      },
      {
        path: 'liquidacion',
        loadComponent: () =>
          import('../liquidacion/liquidacion.component').then(
            (m) => m.LiquidacionComponent
          ),
      },
      {
        path: 'rechazo',
        loadComponent: () =>
          import('../rechazo/rechazo.component').then(
            (m) => m.RechazoComponent
          ),
      },
      {
        path: 'masterizado',
        loadComponent: () =>
          import('../masterizado/masterizado.component').then(
            (m) => m.MasterizadoComponent
          ),
      }
    ]
  },
];
