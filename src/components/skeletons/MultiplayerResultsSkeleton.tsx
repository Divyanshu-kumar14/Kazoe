
import { SkeletonCard, SkeletonTitle, SkeletonText, SkeletonBox, SkeletonCircle } from '../common/SkeletonPrimitives';

export const MultiplayerResultsSkeleton = () => {
  return (
    <div className="flex-1 animate-fade-in-up">
      <div className="max-w-[800px] mx-auto px-6 py-10 flex flex-col gap-8 items-center">
        
        {/* Results Header */}
        <SkeletonTitle width="200px" height="40px" />
        
        {/* Winner Announcement Card */}
        <SkeletonCard style={{ width: '100%', alignItems: 'center', textAlign: 'center', padding: '2rem' }}>
          <SkeletonCircle size="80px" className="mb-4" />
          <SkeletonTitle width="40%" height="32px" className="mb-2" />
          <SkeletonText width="60%" />
        </SkeletonCard>

        {/* Player Ranking Table */}
        <SkeletonCard style={{ width: '100%', padding: 0, overflow: 'hidden' }}>
          <div className="p-4">
            <SkeletonBox width="100%" height="40px" className="mb-4" />
            <div className="flex flex-col gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex gap-4 py-3 items-center" style={{ borderBottom: i < 2 ? '1px solid var(--color-outline-variant)' : 'none' }}>
                  <SkeletonBox width="32px" height="32px" borderRadius="16px" />
                  <div className="flex-1"><SkeletonText width="60%" /></div>
                  <SkeletonText width="20%" />
                  <SkeletonText width="20%" />
                </div>
              ))}
            </div>
          </div>
        </SkeletonCard>

        {/* Action Buttons */}
        <div className="flex gap-4 mt-4 w-full justify-center">
          <SkeletonBox width="150px" height="48px" borderRadius="0.5rem" />
          <SkeletonBox width="150px" height="48px" borderRadius="0.5rem" />
        </div>

      </div>
    </div>
  );
};
