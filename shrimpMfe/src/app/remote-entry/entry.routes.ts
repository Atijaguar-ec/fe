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
      { path: 'clasificacion', component: ClassificationComponent }
    ]
  },
];
