import { Routes } from '@angular/router';
import { ReportListComponent } from './components/report-list-component/report-list-component';
import { ReportEditComponent } from './components/report-edit-component/report-edit-component';
import { ReportDetailsComponent } from './components/report-details-component/report-details-component';
import { ReportCreateComponent } from './components/report-create-component/report-create-component';
import { ReportDashboardComponent } from './components/report-dashboard-component/report-dashboard-component';

export const routes: Routes = [
  {
    path: 'report/list',
    component: ReportListComponent,
  },
  {
    path: 'report/create',
    component: ReportCreateComponent,
  },
  {
    path: 'report/edit/:id',
    component: ReportEditComponent,
  },
  {
    path: 'report/details/:id',
    component: ReportDetailsComponent,
  },
  {
    path: '',
    component: ReportDashboardComponent,
  },
];
