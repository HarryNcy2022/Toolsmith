import { describe, it, expect } from 'vitest';
import { canSaveAll } from '../settings';

describe('canSaveAll', () => {
  it('STT-01: both valid -> true', () => {
    expect(canSaveAll('CommandOrControl+Shift+D', 'CommandOrControl+Shift+H')).toBe(true);
  });

  it('STT-02: first empty string -> false', () => {
    expect(canSaveAll('', 'CommandOrControl+Shift+H')).toBe(false);
  });

  it('STT-03: second has trailing modifier token -> false', () => {
    expect(canSaveAll('CommandOrControl+Shift+D', 'Ctrl+')).toBe(false);
  });

  it('STT-04: both invalid -> false', () => {
    expect(canSaveAll('', 'Alt+')).toBe(false);
  });

  it('STT-05: first is a single modifier-only token -> false', () => {
    expect(canSaveAll('CommandOrControl', 'CommandOrControl+Shift+H')).toBe(false);
  });
});
