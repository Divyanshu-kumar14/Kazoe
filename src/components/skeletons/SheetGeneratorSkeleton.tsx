
import { SkeletonCard, SkeletonTitle, SkeletonText, SkeletonBox, SkeletonButton } from '../common/SkeletonPrimitives';

export const SheetGeneratorSkeleton = () => {
  return (
    <div className="flex-1 animate-fade-in-up">
      <div className="max-w-[1200px] mx-auto px-6 py-8 flex flex-col gap-8">
        
        {/* Header */}
        <div className="flex flex-col gap-2">
          <SkeletonTitle width="250px" height="32px" />
          <SkeletonText width="400px" />
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Config Sidebar */}
          <div className="w-full lg:w-80 flex flex-col gap-6 shrink-0">
             {/* Question Type Selector */}
             <div className="flex flex-col gap-3">
               <SkeletonTitle width="120px" height="20px" />
               <div className="grid grid-cols-3 gap-2">
                  <SkeletonBox height="48px" borderRadius="0.5rem" />
                  <SkeletonBox height="48px" borderRadius="0.5rem" />
                  <SkeletonBox height="48px" borderRadius="0.5rem" />
               </div>
             </div>
             
             {/* Config Card */}
             <SkeletonCard>
               <div className="flex flex-col gap-4">
                 {[...Array(4)].map((_, i) => (
                   <div key={i} className="flex flex-col gap-2">
                     <SkeletonText width="40%" />
                     <SkeletonBox height="40px" borderRadius="0.5rem" />
                   </div>
                 ))}
               </div>
             </SkeletonCard>

             {/* Action Buttons */}
             <div className="flex flex-col gap-3">
               <SkeletonButton width="100%" height="48px" />
               <div className="grid grid-cols-2 gap-3">
                 <SkeletonButton width="100%" height="48px" />
                 <SkeletonButton width="100%" height="48px" />
               </div>
             </div>
          </div>

          {/* Preview Panel */}
          <div className="flex-1 w-full bg-[var(--color-surface-lowest)] rounded-lg border" style={{ borderColor: 'var(--color-outline-variant)', padding: '2rem', minHeight: '800px' }}>
             <div className="flex justify-between items-center mb-8">
               <SkeletonTitle width="200px" height="28px" />
               <div className="flex flex-col gap-2 items-end">
                 <SkeletonText width="150px" />
                 <SkeletonText width="120px" />
               </div>
             </div>
             
             <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[...Array(12)].map((_, i) => (
                  <SkeletonBox key={i} height="120px" borderRadius="0.5rem" />
                ))}
             </div>
          </div>
        </div>

      </div>
    </div>
  );
};
