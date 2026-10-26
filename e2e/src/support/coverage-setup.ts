import { coverageReport } from './coverage';

export default function globalSetup(): void {
  coverageReport().cleanCache();
}
