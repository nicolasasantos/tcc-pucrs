import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-report-create-component',
  imports: [MatButtonModule, RouterModule],
  templateUrl: './report-create-component.html',
  styleUrl: './report-create-component.css',
})
export class ReportCreateComponent {}
