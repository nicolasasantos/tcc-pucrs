import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { finalize } from 'rxjs/operators';
import * as L from 'leaflet';

// Angular Material
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { ReportService } from '../../services/report-service/report-service';
import { Report } from '../../models/report.model';

@Component({
  selector: 'app-report-details-component',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatDividerModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './report-details-component.html',
  styleUrl: './report-details-component.css',
})
export class ReportDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private reportService = inject(ReportService);
  private cdr = inject(ChangeDetectorRef);

  report: Report | null = null;
  isLoading = true;
  isVoting = false;
  private map: L.Map | undefined;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadReport(id);
    }
    this.fixLeafletIcons();
  }

  // Corrige os ícones do Leaflet que costumam quebrar no Angular
  private fixLeafletIcons() {
    const iconDefault = L.icon({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });
    L.Marker.prototype.options.icon = iconDefault;
  }

  loadReport(id: string): void {
    this.isLoading = true;
    this.reportService
      .getReportById(id)
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
          this.initMap();
        })
      )
      .subscribe({
        next: (data) => (this.report = data),
        error: (err) => console.error('Erro ao carregar detalhes:', err),
      });
  }

  private initMap(): void {
    if (!this.report || !this.report.location?.latitude) return;

    const lat = this.report.location.latitude;
    const lng = this.report.location.longitude;

    setTimeout(() => {
      if (this.map) {
        this.map.remove();
      }

      this.map = L.map('map', {
        center: [lat, lng],
        zoom: 16,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
      }).addTo(this.map);

      L.marker([lat, lng]).addTo(this.map).bindPopup(`<b>${this.report?.title}</b>`).openPopup();

      this.map.invalidateSize();
    }, 100);
  }

  onVote(): void {
    if (!this.report) return;

    // --- TRAVA DE VOTO POR NAVEGADOR ---
    const votedItems = JSON.parse(localStorage.getItem('voted_reports') || '[]');

    if (votedItems.includes(this.report._id)) {
      alert('Você já registrou seu voto para esta ocorrência!');
      return;
    }

    if (!this.isVoting) {
      this.isVoting = true;

      const updatedReport = {
        ...this.report,
        vote_fix: (this.report.vote_fix || 0) + 1,
      };

      this.reportService
        .updateReport(this.report._id, updatedReport)
        .pipe(
          finalize(() => {
            this.isVoting = false;
            this.cdr.detectChanges();
          })
        )
        .subscribe({
          next: (data) => {
            this.report = data;

            // Salva no LocalStorage para impedir novo voto
            votedItems.push(this.report._id);
            localStorage.setItem('voted_reports', JSON.stringify(votedItems));

            alert('Voto registrado com sucesso!');
          },
          error: (err) => alert('Erro ao registrar voto.'),
        });
    }
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
