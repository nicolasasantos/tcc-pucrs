import { Component, inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';

import { ReportService } from '../../services/report-service/report-service';
import { Report } from '../../models/report.model';

@Component({
  selector: 'app-report-list-component',
  imports: [MatButtonModule, RouterModule, CommonModule],
  standalone: true,
  templateUrl: './report-list-component.html',
  styleUrl: './report-list-component.css',
})
export class ReportListComponent implements OnInit {
  // Inject report service
  private reportService = inject(ReportService);

  // Observable to hold the fetched reports (using '$' convention for Observables)
  // This will be used with the 'async' pipe in the template.
  reports$!: Observable<Report[]>;

  ngOnInit(): void {
    this.reports$ = this.reportService.getReports();
  }

  getSeverityClass(severity: string): string {
    if (!severity) return 'severity-default';

    // Normalize input and use a switch for mapping
    const normalizedSeverity = severity.toLowerCase().trim();

    switch (normalizedSeverity) {
      case 'low':
        return 'severity-baixa';
      case 'medium':
        return 'severity-media';
      case 'high':
        return 'severity-alta';
      default:
        return 'severity-default';
    }
  }

  /**
   * Maps the severity ENUM (low, medium, high) to its display name in Portuguese.
   */
  getSeverityDisplay(severity: string): string {
    if (!severity) return 'Desconhecida';

    const normalizedSeverity = severity.toLowerCase().trim();

    switch (normalizedSeverity) {
      case 'low':
        return 'Baixa';
      case 'medium':
        return 'Média';
      case 'high':
        return 'Alta';
      default:
        return 'Desconhecida';
    }
  }
}
