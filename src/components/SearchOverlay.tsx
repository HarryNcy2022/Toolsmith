import { useCallback, useEffect, useRef } from 'react';
import { useActiveToolId } from '../lib/active-tool';
import { useToolSearch, type SearchMatch } from '../lib/tool-search';

function MatchHighlight({ match }: { match: SearchMatch }) {
  const { contextBefore, matchText, contextAfter } = match;
  return (
    <span className="text-xs leading-relaxed text-neutral-400 line-clamp-2">
      {contextBefore}
      <mark className="bg-yellow-500/30 text-yellow-200 rounded-sm">
        {matchText}
      </mark>
      {contextAfter}
    </span>
  );
}

interface SearchResultRowProps {
  match: SearchMatch;
  isSelected: boolean;
  onSelect: () => void;
}

function SearchResultRow({ match, isSelected, onSelect }: SearchResultRowProps) {
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isSelected && ref.current) {
      ref.current.scrollIntoView({ block: 'nearest' });
    }
  }, [isSelected]);

  return (
    <button
      ref={ref}
      onClick={onSelect}
      className={`w-full text-left px-4 py-2 transition-colors ${
        isSelected
          ? 'bg-blue-600/20 text-blue-300'
          : 'text-neutral-300 hover:bg-neutral-800'
      }`}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="px-1.5 py-0.5 text-[10px] rounded bg-neutral-800 text-neutral-400 border border-neutral-700">
          {match.label}
        </span>
      </div>
      <MatchHighlight match={match} />
    </button>
  );
}

export function SearchOverlay() {
  const {
    isOpen,
    query,
    matches,
    activeIndex,
    close,
    setQuery,
    search,
    nextMatch,
    prevMatch,
    goToMatch,
  } = useToolSearch();
  const activeToolId = useActiveToolId();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    close();
  }, [activeToolId, close]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setQuery(e.target.value);
      search(activeToolId);
    },
    [setQuery, search, activeToolId],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          nextMatch();
          break;
        case 'ArrowUp':
          e.preventDefault();
          prevMatch();
          break;
        case 'Enter':
          e.preventDefault();
          if (matches.length > 0 && activeIndex >= 0) {
            goToMatch(activeIndex);
            close();
          }
          break;
        case 'Escape':
          e.preventDefault();
          close();
          break;
      }
    },
    [nextMatch, prevMatch, goToMatch, close, matches.length, activeIndex],
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/50" />
      {/* panel */}
      <div className="relative w-full max-w-lg mx-4 bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl overflow-hidden">
        {/* search input row */}
        <div className="flex items-center gap-2 px-4 border-b border-neutral-800">
          <svg
            className="w-4 h-4 text-neutral-500 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Search in tool…"
            className="flex-1 py-3 bg-transparent text-sm text-neutral-200 placeholder-neutral-500 focus:outline-none"
          />
          {query && (
            <span className="shrink-0 text-xs text-neutral-500">
              {matches.length} {matches.length === 1 ? 'match' : 'matches'}
            </span>
          )}
          {query && matches.length > 1 && (
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  prevMatch();
                }}
                className="p-1 rounded text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800 transition-colors"
                aria-label="Previous match"
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 15l7-7 7 7"
                  />
                </svg>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  nextMatch();
                }}
                className="p-1 rounded text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800 transition-colors"
                aria-label="Next match"
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* results list */}
        <div className="max-h-80 overflow-auto py-1">
          {query && matches.length === 0 && (
            <div className="px-4 py-6 text-sm text-neutral-500 text-center">
              No matches found
            </div>
          )}
          {matches.map((match, i) => (
            <SearchResultRow
              key={`${match.sourceId}-${match.startIndex}`}
              match={match}
              isSelected={activeIndex === i}
              onSelect={() => {
                goToMatch(i);
                close();
              }}
            />
          ))}
        </div>

        {/* footer */}
        <div className="px-4 py-2 border-t border-neutral-800 text-[10px] text-neutral-600 flex gap-4">
          <span>↑↓ navigate</span>
          <span>↵ select</span>
          <span>esc close</span>
        </div>
      </div>
    </div>
  );
}
