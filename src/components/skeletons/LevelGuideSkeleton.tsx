
import { SkeletonCard, SkeletonTitle, SkeletonText, SkeletonBox } from '../common/SkeletonPrimitives';

export const LevelGuideSkeleton = () => {
  return (
    <div className="flex-1 animate-fade-in-up">
      <div className="max-w-[1000px] mx-auto px-6 py-10 flex flex-col gap-8">
        
        {/* Header */}
        <div className="text-center flex flex-col gap-3 items-center">
          <SkeletonTitle width="300px" height="40px" />
          <SkeletonText width="60%" />
          <SkeletonText width="40%" />
        </div>

        {/* Table */}
        <SkeletonCard style={{ padding: 0, overflow: 'hidden' }}>
           <div className="overflow-x-auto p-4">
              <SkeletonBox width="100%" height="48px" className="mb-4" />
              {[...Array(10)].map((_, i) => (
                <div key={i} className="flex gap-4 py-4" style={{ borderBottom: i < 9 ? '1px solid var(--color-outline-variant)' : 'none' }}>
                  <SkeletonText width="10%" />
                  <SkeletonBox width="100px" height="24px" borderRadius="12px" />
                  <SkeletonText width="30%" />
                  <SkeletonText width="15%" />
                  <SkeletonText width="15%" />
                </div>
              ))}
           </div>
        </SkeletonCard>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <SkeletonCard style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
             <SkeletonBox width="40px" height="40px" borderRadius="0.5rem" className="flex-shrink-0" />
             <div className="flex flex-col gap-2 flex-1">
               <SkeletonTitle width="50%" height="24px" />
               <SkeletonText width="100%" />
               <SkeletonText width="80%" />
             </div>
           </SkeletonCard>
           <SkeletonCard style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
             <SkeletonBox width="40px" height="40px" borderRadius="0.5rem" className="flex-shrink-0" />
             <div className="flex flex-col gap-2 flex-1">
               <SkeletonTitle width="50%" height="24px" />
               <SkeletonText width="100%" />
               <SkeletonText width="80%" />
             </div>
           </SkeletonCard>
        </div>

      </div>
    </div>
  );
};
