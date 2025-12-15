import { Component, inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import { ReportService } from '../../services/report-service/report-service';
import { Report } from '../../models/report.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-report-list-component',
  imports: [MatButtonModule, RouterModule, CommonModule],
  templateUrl: './report-list-component.html',
  styleUrl: './report-list-component.css',
})
export class ReportListComponent implements OnInit {
  //inject report service to fetch and display reports
  private customerService = inject(ReportService);

  //customers array to hold fetched reports
  reports!: Report[];

  ngOnInit(): void {
    //fetch reports on component init
    this.customerService.getReports().subscribe(
      (data) => {
        console.log('reports fetched successfully', data);
        this.reports = data;
      },
      (error) => {
        console.error('Error fetching reports', error);
      }
    );
  }
}
