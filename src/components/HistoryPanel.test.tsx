import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
import { HistoryPanel } from './HistoryPanel';
import { useHistoryStore } from '../lib/history';

beforeEach(() => {
  localStorage.clear();
  useHistoryStore.setState({ entries: {} });
});

describe('HistoryPanel row styling', () => {
  it('renders rows as a unified clickable surface with a borderless rounded red x', () => {
    useHistoryStore.setState({
      entries: { t1: [{ input: 'hello world', ts: 1 }] }
    });
    const onLoad = vi.fn();
    const onClose = vi.fn();
    render(<HistoryPanel toolId="t1" open onClose={onClose} onLoad={onLoad} />);

    const row = screen.getByText('hello world').closest('li') as HTMLElement;
    // whole-row hover highlight (unified surface)
    expect(row.className).toContain('hover:bg-neutral-800');
    expect(row.className).toContain('group');
    expect(row.className).toContain('cursor-pointer');

    const x = screen.getByLabelText('Remove entry') as HTMLElement;
    expect(x.className).not.toContain('border');
    expect(x.className).toContain('rounded');
    expect(x.className).toContain('right-3');
    // default grey, red on hover
    expect(x.className).toContain('bg-neutral-700/50');
    expect(x.className).toContain('hover:bg-red-500/20');
    expect(x.className).toContain('hover:text-red-400');
    // redesigned: SVG close icon, not a text glyph
    expect(x.querySelector('svg')).not.toBeNull();
    expect(x.className).toContain('shrink-0');
  });

  it('clicking anywhere on the row loads the entry and closes', () => {
    useHistoryStore.setState({
      entries: { t1: [{ input: 'hello world', ts: 1 }] }
    });
    const onLoad = vi.fn();
    const onClose = vi.fn();
    render(<HistoryPanel toolId="t1" open onClose={onClose} onLoad={onLoad} />);

    fireEvent.click(screen.getByText('hello world').closest('li')!);
    expect(onLoad).toHaveBeenCalledWith('hello world');
    expect(onClose).toHaveBeenCalled();
  });

  it('clicking the x deletes without loading or closing', () => {
    const removeSpy = vi.spyOn(useHistoryStore.getState(), 'removeOne');
    useHistoryStore.setState({
      entries: { t1: [{ input: 'hello world', ts: 1 }] }
    });
    const onLoad = vi.fn();
    const onClose = vi.fn();
    render(<HistoryPanel toolId="t1" open onClose={onClose} onLoad={onLoad} />);

    fireEvent.click(screen.getByLabelText('Remove entry'));
    expect(removeSpy).toHaveBeenCalledWith('t1', 0);
    expect(onLoad).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });
});
