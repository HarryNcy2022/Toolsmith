import { validateAccelerator } from './accelerator';

export function canSaveAll(...values: string[]): boolean {
  return values.length > 0 && values.every((v) => validateAccelerator(v).valid);
}
