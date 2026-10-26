import { coverageReport } from './coverage';

export default async function globalTeardown(): Promise<void> {
  await coverageReport().generate();
}
