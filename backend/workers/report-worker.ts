/**
 * Report Generation Worker
 *
 * Example job worker for generating reports asynchronously.
 * This demonstrates handling long-running jobs with progress tracking.
 */

import { queue } from '../lib/queue.ts';

// ============================================================================
// Types
// ============================================================================

export interface ReportJobData {
  reportType: 'user-activity' | 'sales' | 'analytics' | 'custom';
  userId: string;
  startDate: string;
  endDate: string;
  format: 'pdf' | 'csv' | 'xlsx';
  filters?: Record<string, unknown>;
  emailTo?: string;
}

export interface ReportResult {
  reportId: string;
  downloadUrl: string;
  size: number;
  rowCount: number;
  generatedAt: string;
}

// ============================================================================
// Report Generation Logic
// ============================================================================

/**
 * Generate a user activity report
 */
async function generateUserActivityReport(
  _data: ReportJobData,
): Promise<ReportResult> {
  console.log('📊 Generating user activity report...');

  // Simulate data fetching and processing
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // In production, you would:
  // 1. Query your database for the data
  // 2. Process and aggregate the data
  // 3. Generate the report file (PDF, CSV, etc.)
  // 4. Upload to storage
  // 5. Return the download URL

  const reportId = crypto.randomUUID();
  const downloadUrl = `/api/reports/${reportId}/download`;

  return {
    reportId,
    downloadUrl,
    size: 1024 * 512, // 512 KB
    rowCount: 1000,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Generate a sales report
 */
async function generateSalesReport(
  _data: ReportJobData,
): Promise<ReportResult> {
  console.log('📊 Generating sales report...');

  // Simulate long-running report generation
  await new Promise((resolve) => setTimeout(resolve, 5000));

  const reportId = crypto.randomUUID();
  const downloadUrl = `/api/reports/${reportId}/download`;

  return {
    reportId,
    downloadUrl,
    size: 1024 * 1024 * 2, // 2 MB
    rowCount: 5000,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Generate an analytics report
 */
async function generateAnalyticsReport(
  _data: ReportJobData,
): Promise<ReportResult> {
  console.log('📊 Generating analytics report...');

  await new Promise((resolve) => setTimeout(resolve, 3000));

  const reportId = crypto.randomUUID();
  const downloadUrl = `/api/reports/${reportId}/download`;

  return {
    reportId,
    downloadUrl,
    size: 1024 * 256, // 256 KB
    rowCount: 500,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Main report generation function
 */
async function generateReport(data: ReportJobData): Promise<void> {
  console.log(`📊 Generating ${data.reportType} report for user ${data.userId}`);
  console.log(`  Date range: ${data.startDate} to ${data.endDate}`);
  console.log(`  Format: ${data.format}`);

  let result: ReportResult;

  switch (data.reportType) {
    case 'user-activity':
      result = await generateUserActivityReport(data);
      break;
    case 'sales':
      result = await generateSalesReport(data);
      break;
    case 'analytics':
      result = await generateAnalyticsReport(data);
      break;
    default:
      throw new Error(`Unknown report type: ${data.reportType}`);
  }

  console.log('✅ Report generated successfully:');
  console.log(`  Report ID: ${result.reportId}`);
  console.log(`  Size: ${(result.size / 1024).toFixed(2)} KB`);
  console.log(`  Rows: ${result.rowCount}`);

  // If email was requested, send notification
  if (data.emailTo) {
    console.log(`📧 Sending report to ${data.emailTo}`);
    // In production, you would queue an email job here
    // await queue.add('send-email', {
    //   to: data.emailTo,
    //   subject: 'Your report is ready',
    //   body: `Your ${data.reportType} report is ready for download: ${result.downloadUrl}`,
    // });
  }
}

// ============================================================================
// Worker Registration
// ============================================================================

/**
 * Register the report worker
 * Call this function during server startup
 */
export function registerReportWorker(): void {
  queue.process<ReportJobData>('generate-report', async (job) => {
    await generateReport(job.data);
  });

  console.log('📊 Report worker registered');
}

// ============================================================================
// Helper Functions for Enqueueing Jobs
// ============================================================================

/**
 * Request a user activity report
 */
export async function requestUserActivityReport(
  userId: string,
  startDate: Date,
  endDate: Date,
  options: {
    format?: 'pdf' | 'csv' | 'xlsx';
    emailTo?: string;
  } = {},
): Promise<string> {
  return await queue.add('generate-report', {
    reportType: 'user-activity',
    userId,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    format: options.format || 'pdf',
    emailTo: options.emailTo,
  }, {
    priority: 5,
    maxRetries: 2,
  });
}

/**
 * Request a sales report
 */
export async function requestSalesReport(
  userId: string,
  startDate: Date,
  endDate: Date,
  options: {
    format?: 'pdf' | 'csv' | 'xlsx';
    filters?: Record<string, unknown>;
    emailTo?: string;
  } = {},
): Promise<string> {
  return await queue.add('generate-report', {
    reportType: 'sales',
    userId,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    format: options.format || 'csv',
    filters: options.filters,
    emailTo: options.emailTo,
  }, {
    priority: 7, // Higher priority for sales reports
    maxRetries: 2,
  });
}

/**
 * Request an analytics report
 */
export async function requestAnalyticsReport(
  userId: string,
  startDate: Date,
  endDate: Date,
  options: {
    format?: 'pdf' | 'csv' | 'xlsx';
    emailTo?: string;
  } = {},
): Promise<string> {
  return await queue.add('generate-report', {
    reportType: 'analytics',
    userId,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    format: options.format || 'pdf',
    emailTo: options.emailTo,
  }, {
    priority: 4,
    maxRetries: 2,
  });
}
