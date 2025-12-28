import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import * as L from 'leaflet';

// Angular Material
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { ReportService } from '../../services/report-service/report-service';
import { Report } from '../../models/report.model';

@Component({
  selector: 'app-report-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatDividerModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './report-dashboard-component.html',
  styleUrls: ['./report-dashboard-component.css'],
})
export class ReportDashboardComponent implements OnInit {
  private reportService = inject(ReportService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  private map: L.Map | undefined;
  reports: Report[] = [];
  isLoading = true;

  // Marking São Paulo as default location
  private defaultLocation: L.LatLngExpression = [-23.5505, -46.6333];

  ngOnInit(): void {
    this.fixLeafletIcons();
    this.loadReportsAndInitMap();
  }

  private fixLeafletIcons(): void {
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

  loadReportsAndInitMap(): void {
    this.isLoading = true;
    this.reportService.getReports().subscribe({
      next: (data) => {
        this.reports = data;
        this.isLoading = false;
        this.cdr.detectChanges();
        this.initMap();
      },
      error: (err) => {
        console.error('Erro ao carregar reportes:', err);
        this.isLoading = false;
        this.initMap();
      },
    });
  }

  private initMap(): void {
    if (this.map) {
      this.map.remove();
    }

    this.map = L.map('main-map').setView(this.defaultLocation, 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(this.map);

    this.getUserLocation();

    this.addReportMarkers();
  }

  private getUserLocation(): void {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userPos: L.LatLngExpression = [position.coords.latitude, position.coords.longitude];

          this.map?.setView(userPos, 14);

          L.circle(userPos, {
            radius: 200,
            color: '#1976d2',
            fillColor: '#2196f3',
            fillOpacity: 0.3,
          })
            .addTo(this.map!)
            .bindPopup('Você está aqui');
        },
        (error) => {
          console.warn('Geolocalização negada ou falhou. Usando posição padrão.');

          this.focusOnReports();
        }
      );
    }
  }

  private addReportMarkers(): void {
    const markers: L.Marker[] = [];

    this.reports.forEach((report) => {
      if (report.location?.latitude && report.location?.longitude) {
        const marker = L.marker([report.location.latitude, report.location.longitude]).addTo(
          this.map!
        ).bindPopup(`
            <div class="custom-popup">
              <strong style="color: #3f51b5">${report.title}</strong><br>
              <small>Gravidade: ${report.severity.toUpperCase()}</small><br>
              <button class="view-btn" id="btn-dash-${report._id}">Ver Detalhes</button>
            </div>
          `);

        marker.on('popupopen', () => {
          const btn = document.getElementById(`btn-dash-${report._id}`);
          btn?.addEventListener('click', () => {
            this.router.navigate(['/report/details', report._id]);
          });
        });

        markers.push(marker);
      }
    });
  }

  private focusOnReports(): void {
    if (this.reports.length > 0 && this.map) {
      const coords = this.reports
        .filter((r) => r.location?.latitude && r.location?.longitude)
        .map((r) => L.marker([r.location.latitude, r.location.longitude]));

      if (coords.length > 0) {
        const group = L.featureGroup(coords);
        this.map.fitBounds(group.getBounds().pad(0.2));
      }
    }
  }
}
