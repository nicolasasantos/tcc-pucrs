import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportService } from './report-service';

describe('ReportService', () => {
  let component: ReportService;
  let fixture: ComponentFixture<ReportService>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportService]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReportService);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
