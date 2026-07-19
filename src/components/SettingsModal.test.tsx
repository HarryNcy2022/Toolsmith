import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from 'vitest';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';
import { SettingsModal } from './SettingsModal';

/**
 * Bridge type mirroring what preload exposes.
 * Avoids `as any` (forbidden by repo rules).
 */
interface TsBridge {
  getConfig: (key: string) => Promise<string | undefined>;
  setConfig: (key: string, value: string) => Promise<{ success: boolean; error?: string }>;
}

function mockToolsmith(): TsBridge {
  const bridge: TsBridge = {
    getConfig: vi.fn().mockResolvedValue(undefined),
    setConfig: vi.fn().mockResolvedValue({ success: true }),
  };
  (window as unknown as { toolsmith: TsBridge }).toolsmith = bridge;
  return bridge;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockToolsmith();
  try {
    Object.defineProperty(navigator, 'platform', { value: 'Win32', configurable: true });
  } catch {
    vi.stubGlobal('navigator', { ...navigator, platform: 'Win32' });
  }
});

afterEach(() => {
  cleanup();
});

describe('SettingsModal', () => {
  /** QA-01: layout compactness — one Keyboard shortcuts section with
   *  two textboxes, one shared Save, two per-field Reset buttons.
   */
  it('QA-01 renders compact layout with shared save and per-field reset', () => {
    render(<SettingsModal open={true} onClose={vi.fn()} />);

    // Exactly one "Keyboard shortcuts" heading
    expect(
      screen.getByRole('heading', { name: 'Keyboard shortcuts' }),
    ).toBeTruthy();

    // Exactly two capture boxes
    expect(screen.getAllByRole('textbox')).toHaveLength(2);

    // Exactly one shared Save changes button
    expect(
      screen.getByRole('button', { name: /save changes/i }),
    ).toBeTruthy();

    // Exactly two per-field Reset buttons
    expect(screen.getAllByText('Reset')).toHaveLength(2);

    // R1: each capture box fills remaining row width (flex-1 + min-w-0)
    const boxes = screen.getAllByRole('textbox');
    for (const box of boxes) {
      expect(box.className).toContain('flex-1');
      expect(box.className).toContain('min-w-0');
    }
    // R1: box+reset wrapper grows to fill the row and allows shrink
    const wrappers = boxes.map((b) => b.parentElement as HTMLElement);
    for (const w of wrappers) {
      expect(w.className).toContain('flex-1');
      expect(w.className).toContain('min-w-0');
    }
  });

  /** QA-02: mount hydrate — stored values populate the capture boxes. */
  it('QA-02 hydrates from stored config on mount', async () => {
    const ts = (window as unknown as { toolsmith: TsBridge }).toolsmith;
    ts.getConfig = vi.fn((key: string) => {
      if (key === 'hotkey') return Promise.resolve('CommandOrControl+Shift+K');
      if (key === 'historyHotkey')
        return Promise.resolve('CommandOrControl+Shift+L');
      return Promise.resolve(undefined);
    }) as Mock;

    render(<SettingsModal open={true} onClose={vi.fn()} />);

    // Wait for both async hydrations to settle
    await screen.findByText('Ctrl+Shift+K');
    await screen.findByText('Ctrl+Shift+L');

    const boxes = screen.getAllByRole('textbox');
    expect(boxes[0].textContent).toBe('Ctrl+Shift+K');
    expect(boxes[1].textContent).toBe('Ctrl+Shift+L');
  });

  /** QA-03: escape bubbles — capture handler returns early so the
   *  document-level Esc listener calls onClose.
   */
  it('QA-03 escape key on capture box calls onClose via document listener', () => {
    const onClose = vi.fn();
    render(<SettingsModal open={true} onClose={onClose} />);

    const box = screen.getAllByRole('textbox')[0];
    // Focus the box so keyDown fires on it
    box.focus();
    fireEvent.keyDown(box, { key: 'Escape' });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  /** QA-04: pure modifier keydown is ignored — Shift alone does not
   *  change the displayed accelerator.
   */
  it('QA-04 pure modifier keydown does not change value', async () => {
    const ts = (window as unknown as { toolsmith: TsBridge }).toolsmith;
    ts.getConfig = vi.fn().mockResolvedValue(undefined);

    render(<SettingsModal open={true} onClose={vi.fn()} />);

    // Wait for mount hydration to settle (defaults stay)
    await screen.findByText('Ctrl+Shift+D');

    const box = screen.getAllByRole('textbox')[0];
    fireEvent.keyDown(box, { key: 'Shift', shiftKey: true });

    // Value unchanged
    expect(box.textContent).toBe('Ctrl+Shift+D');
  });

  /** QA-05: capture a real modifier+letter combo. */
  it('QA-05 captures Ctrl+Shift+X combo', async () => {
    const ts = (window as unknown as { toolsmith: TsBridge }).toolsmith;
    ts.getConfig = vi.fn().mockResolvedValue(undefined);

    render(<SettingsModal open={true} onClose={vi.fn()} />);

    // Wait for hydration
    await screen.findByText('Ctrl+Shift+D');

    const box = screen.getAllByRole('textbox')[0];
    fireEvent.keyDown(box, { key: 'X', ctrlKey: true, shiftKey: true });

    expect(box.textContent).toBe('Ctrl+Shift+X');
  });

  /** QA-06: shared Save button disabled when one hotkey is invalid.
   *
   *  NOTE: getConfig('hotkey') resolves to 'Control' (a bare modifier)
   *  which passes the component's trim-length guard but is rejected by
   *  validateAccelerator, so canSaveAll returns false.
   */
  it('QA-06 save button disabled when hotkey is invalid', async () => {
    const ts = (window as unknown as { toolsmith: TsBridge }).toolsmith;
    ts.getConfig = vi.fn((key: string) => {
      if (key === 'hotkey')
        return Promise.resolve('Control'); // stored but invalid
      if (key === 'historyHotkey')
        return Promise.resolve('CommandOrControl+Shift+H'); // valid
      return Promise.resolve(undefined);
    }) as Mock;

    render(<SettingsModal open={true} onClose={vi.fn()} />);

    // Wait for validation error to render
    await screen.findByText(/Invalid accelerator/u);

    const saveBtn = screen.getByRole('button', {
      name: /save changes/i,
    }) as HTMLButtonElement;
    expect(saveBtn.disabled).toBe(true);
  });

  /** QA-07: shared save persists both hotkeys when valid. */
  it('QA-07 save persists both hotkeys via setConfig when valid', async () => {
    const ts = (window as unknown as { toolsmith: TsBridge }).toolsmith;
    ts.getConfig = vi.fn().mockResolvedValue(undefined);
    ts.setConfig = vi.fn().mockResolvedValue({ success: true });

    render(<SettingsModal open={true} onClose={vi.fn()} />);

    // Wait for defaults to settle
    await screen.findByText('Ctrl+Shift+D');

    const saveBtn = screen.getByRole('button', { name: /save changes/i });

    await act(async () => {
      saveBtn.click();
    });

    expect(ts.setConfig).toHaveBeenCalledWith(
      'hotkey',
      'CommandOrControl+Shift+D',
    );
    expect(ts.setConfig).toHaveBeenCalledWith(
      'historyHotkey',
      'CommandOrControl+Shift+H',
    );
    expect(ts.setConfig).toHaveBeenCalledTimes(2);

    // R3: save row is right-aligned and msg sits immediately left of button.
    const saveRow = saveBtn.parentElement as HTMLElement;
    expect(saveRow.className).toContain('justify-end');

    // When a msg is present, it must be DOM-before the Save button.
    const msg = screen.queryByText('Saved');
    if (msg) {
      expect(msg.compareDocumentPosition(saveBtn) &
        Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    }
  });

  /** QA-08: per-field Reset reverts only the global field locally, without
   *  calling setConfig.
   */
  it('QA-08 per-field reset reverts global hotkey locally without saving', async () => {
    const ts = (window as unknown as { toolsmith: TsBridge }).toolsmith;
    ts.getConfig = vi.fn((key: string) => {
      if (key === 'hotkey')
        return Promise.resolve('CommandOrControl+Shift+K');
      if (key === 'historyHotkey')
        return Promise.resolve('CommandOrControl+Shift+H');
      return Promise.resolve(undefined);
    }) as Mock;

    render(<SettingsModal open={true} onClose={vi.fn()} />);

    // Wait for stored global value to hydrate
    await screen.findByText('Ctrl+Shift+K');

    const boxes = screen.getAllByRole('textbox');

    // Change global box to a different combo
    fireEvent.keyDown(boxes[0], { key: 'X', ctrlKey: true, shiftKey: true });
    expect(boxes[0].textContent).toBe('Ctrl+Shift+X');

    // Click the first Reset button (global row)
    const resetButtons = screen.getAllByText('Reset');
    fireEvent.click(resetButtons[0]);

    // Global hotkey reverted to default
    expect(boxes[0].textContent).toBe('Ctrl+Shift+D');

    // No persistence occurred
    expect(ts.setConfig).not.toHaveBeenCalled();
  });

  /** QA-09: the adjacent Input history section still renders. */
  it('QA-09 renders input history section with clear button', () => {
    render(<SettingsModal open={true} onClose={vi.fn()} />);

    expect(screen.getByText('Clear all input history')).toBeTruthy();
  });
});
