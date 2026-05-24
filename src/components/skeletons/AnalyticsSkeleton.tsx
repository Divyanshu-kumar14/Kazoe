export function AnalyticsSkeleton() {
  return (
    <div className="flex-1 animate-fade-in-up">
      <div className="max-w-[1200px] mx-auto px-6 py-10 flex flex-col gap-8">
        <div className="skeleton h-10 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card p-5">
              <div className="skeleton h-8 w-16 mb-2" />
              <div className="skeleton h-4 w-24" />
            </div>
          ))}
        </div>
        <div className="card p-6">
          <div className="skeleton h-6 w-32 mb-4" />
          <div className="skeleton h-48 w-full" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card p-6">
            <div className="skeleton h-6 w-32 mb-4" />
            <div className="skeleton h-40 w-full" />
          </div>
          <div className="card p-6">
            <div className="skeleton h-6 w-32 mb-4" />
            <div className="skeleton h-40 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
