import { useEffect, useState, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Sprint } from './mockData';

type Props = {
  sprintsInRange: Sprint[];
  /** Ref pointing to the overflow-x-auto div that wraps the sprint table */
  scrollRef: React.RefObject<HTMLDivElement | null>;
  /** Minimum sprint column width in px — used to estimate how many are visible */
  colMinPx?: number;
};

export function SprintScrollNav({ sprintsInRange, scrollRef, colMinPx = 90 }: Props) {
  const [viewStart, setViewStart] = useState(0);
  const [viewCount, setViewCount] = useState(sprintsInRange.length);
  const isSyncing = useRef(false);

  // Observe the container scroll + size and derive which sprint columns are visible
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const update = () => {
      const total = sprintsInRange.length;
      if (total === 0 || el.scrollWidth === 0) return;
      const colW = el.scrollWidth / total;
      const visible = Math.max(1, Math.floor(el.clientWidth / colW));
      const first = Math.min(Math.floor(el.scrollLeft / colW), Math.max(0, total - visible));
      setViewStart(first);
      setViewCount(visible);
    };

    const ro = new ResizeObserver(update);
    ro.observe(el);
    el.addEventListener('scroll', update, { passive: true });
    update();

    return () => {
      ro.disconnect();
      el.removeEventListener('scroll', update);
    };
  }, [scrollRef, sprintsInRange.length]);

  // Smooth-scroll the container so that sprint at `idx` is the first visible column
  const scrollToIdx = useCallback((idx: number) => {
    const el = scrollRef.current;
    if (!el || isSyncing.current) return;
    isSyncing.current = true;
    const total = sprintsInRange.length;
    const colW = el.scrollWidth / total;
    const clamped = Math.max(0, Math.min(idx, total - 1));
    el.scrollTo({ left: clamped * colW, behavior: 'smooth' });
    setTimeout(() => { isSyncing.current = false; }, 400);
  }, [scrollRef, sprintsInRange.length]);

  // Only render when there are more than 10 sprints
  if (sprintsInRange.length <= 10) return null;

  const canPrev = viewStart > 0;
  const viewEnd = Math.min(viewStart + viewCount - 1, sprintsInRange.length - 1);
  const canNext = viewEnd < sprintsInRange.length - 1;

  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl mb-3 select-none">
      {/* Left arrow */}
      <button
        onClick={() => scrollToIdx(viewStart - 1)}
        disabled={!canPrev}
        className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded hover:bg-slate-200 text-slate-500 disabled:opacity-30 transition-colors"
        title="Scroll left one sprint"
      >
        <ChevronLeft size={14} />
      </button>

      {/* Sprint pill strip — fills available space, clips excess */}
      <div className="flex items-center gap-0.5 flex-1 overflow-hidden">
        {sprintsInRange.map((s, i) => {
          const inView = i >= viewStart && i <= viewEnd;
          return (
            <button
              key={s.id}
              onClick={() => scrollToIdx(i)}
              title={`${s.name}${s.isCurrent ? ' (Current)' : ''}`}
              className={`flex-shrink-0 px-1.5 py-0.5 rounded text-xs leading-none transition-all ${
                inView
                  ? s.isCurrent
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-700 text-white'
                  : 'bg-slate-200 text-slate-400 hover:bg-slate-300 hover:text-slate-700'
              }`}
            >
              {s.name.replace('Sprint ', '')}
            </button>
          );
        })}
      </div>

      {/* Right arrow */}
      <button
        onClick={() => scrollToIdx(viewStart + 1)}
        disabled={!canNext}
        className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded hover:bg-slate-200 text-slate-500 disabled:opacity-30 transition-colors"
        title="Scroll right one sprint"
      >
        <ChevronRight size={14} />
      </button>

      {/* Current viewport label */}
      <span className="flex-shrink-0 text-xs text-slate-400 whitespace-nowrap pl-1 border-l border-slate-200">
        {sprintsInRange[viewStart]?.name.replace('Sprint ', 'S')}
        {viewEnd > viewStart && ` – ${sprintsInRange[viewEnd]?.name.replace('Sprint ', 'S')}`}
        <span className="ml-1 text-slate-300">({viewEnd - viewStart + 1}/{sprintsInRange.length})</span>
      </span>
    </div>
  );
}
