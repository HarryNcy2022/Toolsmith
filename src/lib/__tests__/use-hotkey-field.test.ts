import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, type RenderHookResult } from '@testing-library/react';
import { useHotkeyField } from '../use-hotkey-field';

interface TsBridgeMock {
  getConfig: ReturnType<typeof vi.fn>;
}

function mockToolsmith(
  getConfigResult?: unknown
): TsBridgeMock {
  const bridge = {
    getConfig: vi.fn().mockResolvedValue(getConfigResult),
  };
  (window as unknown as { toolsmith: TsBridgeMock }).toolsmith = bridge;
  return bridge;
}

function mockEvent(overrides: Partial<{
  key: string;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  metaKey: boolean;
}>): React.KeyboardEvent<HTMLDivElement> {
  return {
    key: overrides.key ?? '',
    ctrlKey: overrides.ctrlKey ?? false,
    shiftKey: overrides.shiftKey ?? false,
    altKey: overrides.altKey ?? false,
    metaKey: overrides.metaKey ?? false,
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
  } as unknown as React.KeyboardEvent<HTMLDivElement>;
}

describe('useHotkeyField', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns defaultValue on mount before config resolves', () => {
    mockToolsmith(undefined);
    const { result } = renderHook(() =>
      useHotkeyField('hotkey', 'CommandOrControl+Shift+D')
    );
    expect(result.current.value).toBe('CommandOrControl+Shift+D');
    expect(result.current.isDefault).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('loads stored config value when it resolves', async () => {
    mockToolsmith('CommandOrControl+Shift+K');
    let result: RenderHookResult<ReturnType<typeof useHotkeyField>, unknown>['result'];
    act(() => {
      const r = renderHook(() =>
        useHotkeyField('hotkey', 'CommandOrControl+Shift+D')
      );
      result = r.result;
    });
    // Wait for async effect
    await vi.waitFor(() => {
      expect((result as unknown as { current: { value: string } }).current.value).toBe(
        'CommandOrControl+Shift+K'
      );
    });
  });

  it('handler captures Ctrl+Shift+X combo', () => {
    mockToolsmith(undefined);
    const { result } = renderHook(() =>
      useHotkeyField('hotkey', 'CommandOrControl+Shift+D')
    );

    act(() => {
      result.current.handler(mockEvent({ key: 'X', ctrlKey: true, shiftKey: true }));
    });

    expect(result.current.value).toBe('Control+Shift+X');
    expect(result.current.error).toBeNull();
    expect(result.current.isDefault).toBe(false);
  });

  it('handler ignores plain modifier key', () => {
    mockToolsmith(undefined);
    const { result } = renderHook(() =>
      useHotkeyField('hotkey', 'CommandOrControl+Shift+D')
    );

    act(() => {
      result.current.handler(mockEvent({ key: 'Shift', shiftKey: true }));
    });

    expect(result.current.value).toBe('CommandOrControl+Shift+D');
  });

  it('handler returns early on Escape', () => {
    mockToolsmith(undefined);
    const { result } = renderHook(() =>
      useHotkeyField('hotkey', 'CommandOrControl+Shift+D')
    );

    const ev = mockEvent({ key: 'Escape' });
    act(() => {
      result.current.handler(ev);
    });

    expect(ev.preventDefault).not.toHaveBeenCalled();
    expect(result.current.value).toBe('CommandOrControl+Shift+D');
  });

  it('reset reverts to defaultValue', () => {
    mockToolsmith(undefined);
    const { result } = renderHook(() =>
      useHotkeyField('hotkey', 'CommandOrControl+Shift+D')
    );

    act(() => {
      result.current.handler(mockEvent({ key: 'X', ctrlKey: true, shiftKey: true }));
    });
    expect(result.current.value).toBe('Control+Shift+X');

    act(() => {
      result.current.reset();
    });

    expect(result.current.value).toBe('CommandOrControl+Shift+D');
    expect(result.current.error).toBeNull();
    expect(result.current.isDefault).toBe(true);
  });

  it('uses fallback on getConfig rejection', async () => {
    const bridge = {
      getConfig: vi.fn().mockRejectedValue(new Error('oops')),
    };
    (window as unknown as { toolsmith: TsBridgeMock }).toolsmith = bridge;

    let result: RenderHookResult<ReturnType<typeof useHotkeyField>, unknown>['result'];
    act(() => {
      const r = renderHook(() =>
        useHotkeyField('hotkey', 'CommandOrControl+Shift+D')
      );
      result = r.result;
    });

    await vi.waitFor(() => {
      expect(
        (result as unknown as { current: { value: string } }).current.value
      ).toBe('CommandOrControl+Shift+D');
    });
  });
});
