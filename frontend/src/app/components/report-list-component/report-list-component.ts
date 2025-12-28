import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';

// Material Imports
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';

import { ReportService } from '../../services/report-service/report-service';
import { Report } from '../../models/report.model';
import { Category } from '../../models/category.model'; // Importe o modelo de categoria

@Component({
  selector: 'app-report-list-component',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatDividerModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
  ],
  templateUrl: './report-list-component.html',
  styleUrl: './report-list-component.css',
})
export class ReportListComponent implements OnInit {
  private reportService = inject(ReportService);
  private cdr = inject(ChangeDetectorRef);

  reports: Report[] = [];
  categories: Category[] = [];
  isLoading: boolean = false;

  selectedSeverity: string = 'all';
  selectedCategory: string = 'all';

  ngOnInit(): void {
    this.loadCategories();
    this.loadReports();
  }

  loadCategories(): void {
    this.reportService.getCategories().subscribe({
      next: (data) => {
        this.categories = data;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Erro ao buscar categorias', err),
    });
  }

  loadReports(): void {
    this.reports = [];
    this.isLoading = true;
    this.cdr.detectChanges();

    // Enviando ambos os filtros para o serviço
    this.reportService
      .getReports(this.selectedSeverity, this.selectedCategory)
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (data) => {
          this.reports = data;
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Erro ao buscar reportes', err);
        },
      });
  }

  applyFilter(): void {
    this.loadReports();
  }

  getSeverityClass(severity: string): string {
    if (!severity) return 'severity-default';
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
