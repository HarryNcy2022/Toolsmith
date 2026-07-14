import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { CommandPalette } from './CommandPalette';
import { useToolPreferencesStore } from '../lib/tool-preferences';

const { mockTools, mockRecommendations } = vi.hoisted(() => ({
  mockTools: [
    { id: 'alpha', name: 'Alpha', category: 'Format', keywords: [], component: () => null },
    { id: 'bravo', name: 'Bravo', category: 'Format', keywords: [], component: () => null },
    { id: 'charlie', name: 'Charlie', category: 'Format', keywords: [], component: () => null },
    { id: 'delta', name: 'Delta', category: 'Format', keywords: [], component: () => null }
  ],
  mockRecommendations: [
    { id: 'json-formatter', name: 'JSON Formatter', category: 'Format', keywords: [], component: () => null },
    { id: 'yaml-json', name: 'YAML JSON', category: 'Convert', keywords: [], component: () => null },
    { id: 'json-to-code', name: 'JSON to Code', category: 'Convert', keywords: [], component: () => null }
  ]
}));

vi.mock('../lib/registry', () => ({
  getTools: () => mockTools,
  findTool: (id: string) =>
    mockRecommendations.find((tool) => tool.id === id) ?? mockTools.find((tool) => tool.id === id)
}));

const STORAGE_KEY = 'toolsmith:tool-preferences';

beforeEach(() => {
  localStorage.clear();
  useToolPreferencesStore.setState({ pinnedIds: [], recentToolIds: [] });
  Object.defineProperty(window, 'toolsmith', {
    configurable: true,
    value: {
      readClipboard: vi.fn().mockResolvedValue(''),
      clipboardHasImage: vi.fn().mockResolvedValue(false)
    }
  });
});

afterEach(() => {
  cleanup();
});

describe('CommandPalette ordinary tool ordering', () => {
  it('renders pinned tools before recent and fallback tools for an empty query', () => {
    useToolPreferencesStore.setState({ pinnedIds: ['bravo'], recentToolIds: ['charlie'] });

    render(
      <CommandPalette
        open
        onClose={vi.fn()}
        onSelect={vi.fn()}
        onFocusInput={vi.fn()}
      />
    );

    expect(screen.getAllByText(/^(Alpha|Bravo|Charlie|Delta)$/).map((node) => node.textContent)).toEqual([
      'Bravo',
      'Charlie',
      'Alpha',
      'Delta'
    ]);
  });

  it('applies the same preference order after text filtering', () => {
    useToolPreferencesStore.setState({ pinnedIds: ['bravo'], recentToolIds: ['charlie'] });

    render(
      <CommandPalette
        open
        onClose={vi.fn()}
        onSelect={vi.fn()}
        onFocusInput={vi.fn()}
      />
    );
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'a' } });

    expect(screen.getAllByText(/^(Alpha|Bravo|Charlie|Delta)$/).map((node) => node.textContent)).toEqual([
      'Bravo',
      'Charlie',
      'Alpha',
      'Delta'
    ]);
  });
});

describe('CommandPalette pin controls', () => {
  it('toggles and persists a pin without selecting or closing the palette', () => {
    const onClose = vi.fn();
    const onSelect = vi.fn();

    render(
      <CommandPalette
        open
        onClose={onClose}
        onSelect={onSelect}
        onFocusInput={vi.fn()}
      />
    );

    const pin = screen.getByRole('button', { name: 'Pin Alpha' });
    expect(pin.getAttribute('aria-pressed')).toBe('false');

    fireEvent.click(pin);
    expect(pin.getAttribute('aria-pressed')).toBe('true');
    expect(useToolPreferencesStore.getState().pinnedIds).toEqual(['alpha']);
    expect(localStorage.getItem(STORAGE_KEY)).toBe(
      JSON.stringify({ pinnedIds: ['alpha'], recentToolIds: [] })
    );
    expect(onSelect).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('uses Enter and Space on the pin control without selecting the row', () => {
    const onClose = vi.fn();
    const onSelect = vi.fn();

    render(
      <CommandPalette
        open
        onClose={onClose}
        onSelect={onSelect}
        onFocusInput={vi.fn()}
      />
    );

    const pin = screen.getByRole('button', { name: 'Pin Alpha' });
    fireEvent.keyDown(pin, { key: 'Enter' });
    expect(pin.getAttribute('aria-pressed')).toBe('true');
    fireEvent.keyDown(pin, { key: ' ' });
    expect(pin.getAttribute('aria-pressed')).toBe('false');
    expect(onSelect).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });
});

describe('CommandPalette existing sections', () => {
  it('keeps clipboard recommendations before the ordered ordinary rows', async () => {
    Object.defineProperty(window, 'toolsmith', {
      configurable: true,
      value: {
        readClipboard: vi.fn().mockResolvedValue('{"a":1}'),
        clipboardHasImage: vi.fn().mockResolvedValue(false)
      }
    });
    useToolPreferencesStore.setState({ pinnedIds: ['bravo'], recentToolIds: ['charlie'] });

    render(
      <CommandPalette
        open
        onClose={vi.fn()}
        onSelect={vi.fn()}
        onFocusInput={vi.fn()}
      />
    );

    await waitFor(() => expect(screen.getByText('Clipboard detection: JSON')).toBeTruthy());
    expect(
      screen
        .getAllByText(/^(JSON Formatter|YAML JSON|JSON to Code|Alpha|Bravo|Charlie|Delta)$/)
        .map((node) => node.textContent)
    ).toEqual([
      'JSON Formatter',
      'YAML JSON',
      'JSON to Code',
      'Bravo',
      'Charlie',
      'Alpha',
      'Delta'
    ]);
  });

  it('keeps filtered empty and command mode states free of tool rows', () => {
    const onClose = vi.fn();
    const onFocusInput = vi.fn();
    render(
      <CommandPalette
        open
        onClose={onClose}
        onSelect={vi.fn()}
        onFocusInput={onFocusInput}
      />
    );
    const input = screen.getByRole('textbox');

    fireEvent.change(input, { target: { value: 'zzzz' } });
    expect(screen.getByText('No tools found')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Pin Alpha' })).toBeNull();

    fireEvent.change(input, { target: { value: '/focus' } });
    expect(screen.getByText('Focus current input')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Pin Alpha' })).toBeNull();
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onFocusInput).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledOnce();
  });
});
