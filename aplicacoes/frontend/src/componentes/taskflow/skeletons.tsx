import { cn } from '@/lib/utils';

function SkeletonBloco({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn('animate-pulse rounded-md bg-zinc-800/70', className)}
    />
  );
}

export function AppPrincipalSkeleton() {
  return (
    <div className="flex min-h-screen text-zinc-100">
      <aside className="hidden w-64 shrink-0 border-r border-zinc-900 bg-black/60 p-4 md:block">
        <SkeletonBloco className="h-3 w-20 bg-red-950/60" />
        <SkeletonBloco className="mt-4 h-4 w-36" />
        <SkeletonBloco className="mt-2 h-3 w-44" />
        <SkeletonBloco className="mt-5 h-9 w-full" />
        <div className="mt-8 space-y-2">
          <SkeletonBloco className="h-8 w-full" />
          <SkeletonBloco className="h-8 w-11/12" />
          <SkeletonBloco className="h-8 w-10/12" />
        </div>
      </aside>
      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-zinc-900 px-6 py-4">
          <div>
            <SkeletonBloco className="h-5 w-48" />
            <SkeletonBloco className="mt-2 h-3 w-24" />
          </div>
          <SkeletonBloco className="h-10 w-32" />
        </header>
        <div className="flex-1 overflow-hidden p-4">
          <QuadroSkeleton />
        </div>
      </main>
    </div>
  );
}

export function QuadroSkeleton() {
  return (
    <div className="flex h-full items-start gap-3 pb-4">
      {Array.from({ length: 3 }).map((_, colunaIndex) => (
        <div
          key={colunaIndex}
          className="flex w-[272px] shrink-0 flex-col rounded-xl border border-zinc-800 bg-zinc-950/50 p-2"
        >
          <div className="mb-3 flex items-center justify-between px-1">
            <SkeletonBloco className="h-4 w-28" />
            <SkeletonBloco className="h-5 w-8 rounded-full" />
          </div>
          <div className="space-y-2">
            {Array.from({ length: colunaIndex === 1 ? 3 : 2 }).map((__, cardIndex) => (
              <div
                key={cardIndex}
                className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-2"
              >
                <SkeletonBloco className="h-4 w-10/12" />
                <SkeletonBloco className="mt-2 h-3 w-14" />
              </div>
            ))}
          </div>
          <SkeletonBloco className="mt-2 h-9 w-full border border-zinc-800 bg-zinc-900/50" />
        </div>
      ))}
    </div>
  );
}

export function ListaComentariosSkeleton() {
  return (
    <>
      {Array.from({ length: 3 }).map((_, index) => (
        <li key={index} className="rounded border border-zinc-900 bg-black/40 px-2 py-2">
          <SkeletonBloco className="h-3 w-24 bg-red-950/40" />
          <SkeletonBloco className="mt-2 h-3 w-full" />
          <SkeletonBloco className="mt-1 h-3 w-8/12" />
        </li>
      ))}
    </>
  );
}

export function HistoricoSkeleton() {
  return (
    <ul className="mt-2 space-y-2 text-xs">
      {Array.from({ length: 4 }).map((_, index) => (
        <li key={index} className="rounded border border-zinc-900 bg-black/50 px-2 py-1.5">
          <div className="flex items-start gap-2">
            <SkeletonBloco className="h-6 w-6 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1">
              <SkeletonBloco className="h-3 w-32 bg-red-950/40" />
              <SkeletonBloco className="mt-2 h-2.5 w-44" />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function ChatAprendizadoSkeleton() {
  return (
    <div
      aria-hidden
      className="fixed right-5 bottom-5 z-50 h-14 w-14 animate-pulse rounded-full border border-red-900/40 bg-red-950/70 shadow-lg"
    />
  );
}
