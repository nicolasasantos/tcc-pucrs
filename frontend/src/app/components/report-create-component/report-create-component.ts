import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';

// Service e Model
import { ReportService } from '../../services/report-service/report-service';
import { Category } from '../../models/category.model';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

// EXIF (piexifjs)
import * as piexif from 'piexifjs';

@Component({
  selector: 'app-report-create',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  providers: [DecimalPipe],
  templateUrl: './report-create-component.html',
  styleUrls: ['./report-create-component.css'],
})
export class ReportCreateComponent implements OnInit {
  reportForm: FormGroup;
  categories: Category[] = [];
  imageBase64: string | null = null;

  loadingCoords = false;
  searchingAddress = false;
  showAddressFields = false;

  private cdr = inject(ChangeDetectorRef);

  constructor(
    private fb: FormBuilder,
    private reportService: ReportService,
    private router: Router,
    private http: HttpClient
  ) {
    this.reportForm = this.fb.group({
      category: ['', Validators.required],
      title: ['', Validators.required],
      description: ['', Validators.required],
      severity: ['low', Validators.required],
      name: ['', Validators.required],
      email: ['', [Validators.email]],
      latitude: [null, Validators.required],
      longitude: [null, Validators.required],
      addr_street: [''],
      addr_number: [''],
      addr_city: [''],
      addr_state: [''],
    });
  }

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.reportService.getCategories().subscribe({
      next: (data) => (this.categories = data),
      error: (err) => console.error('Erro categorias:', err),
    });
  }

  // =========================
  // Upload da imagem
  // =========================
  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (!file) return;

    this.loadingCoords = true;
    this.showAddressFields = false;
    this.reportForm.patchValue({ latitude: null, longitude: null });

    const reader = new FileReader();
    reader.onload = () => {
      this.imageBase64 = reader.result as string;
      this.extractExifFromBase64(this.imageBase64);
      this.cdr.detectChanges();
    };

    reader.readAsDataURL(file);
  }

  // =========================
  // Extração EXIF via piexifjs
  // =========================
  extractExifFromBase64(base64: string): void {
    try {
      const exifData = piexif.load(base64);
      const gps = exifData['GPS'];

      if (gps) {
        const lat = gps[piexif.GPSIFD.GPSLatitude];
        const lon = gps[piexif.GPSIFD.GPSLongitude];
        const latRef = gps[piexif.GPSIFD.GPSLatitudeRef];
        const lonRef = gps[piexif.GPSIFD.GPSLongitudeRef];

        console.log('EXIF GPS:', { lat, lon, latRef, lonRef });

        if (lat && lon && latRef && lonRef) {
          const latitude = this.convertDMSToDD(lat, latRef);
          const longitude = this.convertDMSToDD(lon, lonRef);

          this.reportForm.patchValue({ latitude, longitude });
          this.showAddressFields = false;
        } else {
          this.showAddressFields = true;
          alert('Não encontramos GPS na foto. Preencha o endereço manualmente.');
        }
      } else {
        console.warn('EXIF sem GPS encontrado.');
        this.showAddressFields = true;
        alert('Imagem não contém dados de GPS.');
      }
    } catch (e) {
      console.error('Erro ao carregar EXIF:', e);
      this.showAddressFields = true;
      alert('Erro ao ler EXIF da imagem.');
    }

    this.loadingCoords = false;
    this.cdr.detectChanges();
  }

  // =========================
  // Conversão DMS → Decimal
  // =========================
  convertDMSToDD(dms: any[], ref: string): number {
    const d = dms[0][0] / dms[0][1];
    const m = dms[1][0] / dms[1][1];
    const s = dms[2][0] / dms[2][1];

    let dd = d + m / 60 + s / 3600;
    if (ref === 'S' || ref === 'W') dd *= -1;
    return dd;
  }

  // =========================
  // Busca por endereço (fallback)
  // =========================
  searchCoordinatesByAddress(): void {
    const f = this.reportForm.value;

    if (!f.addr_street || !f.addr_city) {
      alert('Preencha pelo menos Rua e Cidade.');
      return;
    }

    this.searchingAddress = true;

    const query = `${f.addr_street}, ${f.addr_number}, ${f.addr_city}, ${f.addr_state}`;
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      query
    )}`;

    this.http.get<any[]>(url).subscribe({
      next: (results) => {
        if (results?.length) {
          this.reportForm.patchValue({
            latitude: parseFloat(results[0].lat),
            longitude: parseFloat(results[0].lon),
          });
        } else {
          alert('Endereço não encontrado.');
        }
        this.searchingAddress = false;
        this.cdr.detectChanges();
      },
      error: () => {
        alert('Erro ao buscar endereço.');
        this.searchingAddress = false;
        this.cdr.detectChanges();
      },
    });
  }

  // =========================
  // Nova categoria
  // =========================
  addNewCategory(): void {
    const name = prompt('Nome da nova categoria:');
    if (!name) return;

    this.reportService.createCategory(name).subscribe({
      next: (cat) => {
        this.categories.push(cat);
        this.reportForm.patchValue({ category: cat._id });
        this.cdr.detectChanges();
      },
    });
  }

  // =========================
  // Submit
  // =========================
  onSubmit(): void {
    if (this.reportForm.invalid) {
      alert('Faltam dados obrigatórios.');
      return;
    }

    const payload = {
      ...this.reportForm.value,
      image: this.imageBase64,
      location: {
        latitude: this.reportForm.value.latitude,
        longitude: this.reportForm.value.longitude,
      },
    };

    this.reportService.createReport(payload).subscribe({
      next: () => {
        alert('Enviado com sucesso!');
        this.router.navigate(['/report/list']);
      },
      error: () => alert('Erro ao salvar reporte.'),
    });
  }
}
