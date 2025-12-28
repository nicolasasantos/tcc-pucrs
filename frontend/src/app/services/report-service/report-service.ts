import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment.prod';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Report } from '../../models/report.model';
import { Category } from '../../models/category.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ReportService {
  private reportsUrl = `${environment.apiUrl}/api/reports`;
  private categoriesUrl = `${environment.apiUrl}/api/categories`;

  constructor(private http: HttpClient) {}

  getReports(severityFilter?: string, categoryFilter?: string): Observable<Report[]> {
    let params = new HttpParams();

    if (severityFilter && severityFilter !== 'all') {
      params = params.set('severity', severityFilter);
    }

    if (categoryFilter && categoryFilter !== 'all') {
      params = params.set('category', categoryFilter);
    }

    return this.http.get<Report[]>(this.reportsUrl, { params });
  }

  getReportById(id: string): Observable<Report> {
    return this.http.get<Report>(`${this.reportsUrl}/${id}`);
  }

  createReport(report: any): Observable<Report> {
    return this.http.post<Report>(this.reportsUrl, report);
  }

  updateReport(id: string, report: Report): Observable<Report> {
    return this.http.put<Report>(`${this.reportsUrl}/${id}`, report);
  }

  // Voting using PUT endpoint to update the report
  voteFix(report: Report): Observable<Report> {
    const updatedData = {
      ...report,
      vote_fix: (report.vote_fix || 0) + 1,
    };
    return this.updateReport(report._id, updatedData);
  }

  deleteReport(id: string): Observable<any> {
    return this.http.delete(`${this.reportsUrl}/${id}`);
  }

  // --- Categories ---

  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(this.categoriesUrl);
  }

  createCategory(name: string): Observable<Category> {
    return this.http.post<Category>(this.categoriesUrl, { name });
  }
}
