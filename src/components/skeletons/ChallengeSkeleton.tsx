export function ChallengeSkeleton() {
  return (
    <div className="flex-1 animate-fade-in-up">
      <div className="max-w-[600px] mx-auto px-6 py-10 flex flex-col gap-8">
        <div className="skeleton h-10 w-48" />
        <div className="card p-8 flex flex-col gap-6">
          <div className="skeleton h-24 w-full" />
          <div className="skeleton h-6 w-3/4" />
          <div className="skeleton h-6 w-1/2" />
          <div className="skeleton h-14 w-full rounded-lg" />
        </div>
        <div className="card p-6">
          <div className="skeleton h-4 w-full mb-3" />
          <div className="skeleton h-4 w-5/6 mb-3" />
          <div className="skeleton h-4 w-2/3" />
        </div>
      </div>
    </div>
  );
}
