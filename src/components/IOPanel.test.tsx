import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, act, cleanup, fireEvent } from '@testing-library/react';
import { useState } from 'react';
import { IOPanel } from './IOPanel';
import { useHistoryStore } from '../lib/history';
import { usePendingInput } from '../lib/pending-input';

beforeEach(() => {
  localStorage.clear();
  useHistoryStore.setState({ entries: {} });
  usePendingInput.setState({ pending: {} });
  vi.useFakeTimers();
});

afterEach(() => {
  vi.runOnlyPendingTimers();
  vi.useRealTimers();
  cleanup();
});

/**
 * Controlled wrapper. A plain <input> (not CodeMirror) drives `value`/`onChange`
 * so we can exercise IOPanel's debounce effect (which watches the `value` prop)
 * without mounting CodeMirror's layout measurement (unsupported in jsdom).
 */
function Harness({ toolId, readOnly }: { toolId: string; readOnly?: boolean }) {
  const [value, setValue] = useState('');
  return (
    <div>
      <input data-testid="driver" value={value} onChange={(e) => setValue(e.target.value)} />
      <IOPanel title="Input" value={value} onChange={setValue} toolId={toolId} readOnly={readOnly} extensions={[]} />
    </div>
  );
}

describe('IOPanel history recording (debounced 4000ms)', () => {
  it('records exactly one entry after idle, not on every keystroke', () => {
    const pushSpy = vi.spyOn(useHistoryStore.getState(), 'push');
    const { getByTestId } = render(<Harness toolId="t-rec" />);
    const driver = getByTestId('driver');

    for (const ch of ['a', 'b', 'c']) {
      fireEvent.change(driver, { target: { value: ch } });
      act(() => { vi.advanceTimersByTime(1000); });
    }
    act(() => { vi.advanceTimersByTime(4000); });

    expect(pushSpy).toHaveBeenCalledTimes(1);
  });

  it('flushes each settled value after its own idle window', () => {
    const pushSpy = vi.spyOn(useHistoryStore.getState(), 'push');
    const { getByTestId } = render(<Harness toolId="t-rec2" />);
    const driver = getByTestId('driver');

    fireEvent.change(driver, { target: { value: 'first' } });
    act(() => { vi.advanceTimersByTime(4000); });

    fireEvent.change(driver, { target: { value: 'second' } });
    act(() => { vi.advanceTimersByTime(4000); });

    expect(pushSpy).toHaveBeenCalledTimes(2);
    expect(pushSpy).toHaveBeenNthCalledWith(1, 't-rec2', 'first');
    expect(pushSpy).toHaveBeenNthCalledWith(2, 't-rec2', 'second');
  });
});

describe('IOPanel pending-input restore', () => {
  it('applies a pending value via onChange for the tool', () => {
    const onChange = vi.fn();
    usePendingInput.getState().setPendingInput('t-restore', 'from-history');
    render(<IOPanel title="Input" value="" onChange={onChange} toolId="t-restore" />);
    act(() => { vi.advanceTimersByTime(0); });
    expect(onChange).toHaveBeenCalledWith('from-history');
  });

  it('does not restore for readOnly panels', () => {
    const onChange = vi.fn();
    usePendingInput.getState().setPendingInput('t-ro', 'x');
    render(<IOPanel title="Output" value="y" onChange={onChange} readOnly toolId="t-ro" />);
    act(() => { vi.advanceTimersByTime(0); });
    expect(onChange).not.toHaveBeenCalled();
  });
});
