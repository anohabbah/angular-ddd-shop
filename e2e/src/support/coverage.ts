import { workspaceRoot } from '@nx/devkit';
import { CoverageReport, type CoverageReportOptions } from 'monocart-coverage-reports';
import { join } from 'node:path';

/** Coverage is opt-in (`COVERAGE=1`): collecting it slows every test down. */
export const collectCoverage = !!process.env['COVERAGE'];

/**
 * Chromium V8 coverage mapped back to the app's TypeScript through the dev server's source maps,
 * exported as lcov so Sonar can combine it with the unit coverage.
 */
const options: CoverageReportOptions = {
  name: 'e2e',
  outputDir: join(workspaceRoot, 'coverage/e2e'),
  entryFilter: (entry) => entry.url.startsWith('http://localhost:4200/'),
  sourceFilter: { '**/node_modules/**': false, 'src/**': true, 'libs/**': true },
  reports: ['lcovonly', 'console-summary'],
};

export const coverageReport = () => new CoverageReport(options);
