
import { SkeletonCard, SkeletonTitle, SkeletonText, SkeletonBox, SkeletonButton } from '../common/SkeletonPrimitives';

export const MultiplayerHomeSkeleton = () => {
  return (
    <div className="flex-1 animate-fade-in-up">
      <div className="max-w-[1000px] mx-auto px-6 py-8 flex flex-col gap-8">
        
        {/* Header */}
        <div className="flex flex-col gap-2 items-center text-center">
          <SkeletonBox width="64px" height="64px" borderRadius="50%" className="mx-auto" />
          <SkeletonTitle width="300px" height="32px" className="mx-auto mt-4" />
          <SkeletonText width="400px" className="mx-auto" />
        </div>

        {/* Tab Switcher */}
        <div className="flex justify-center mb-4">
           <SkeletonBox width="300px" height="48px" borderRadius="24px" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 flex flex-col gap-8">
             {/* Config sections */}
             <div className="flex flex-col gap-4">
               <SkeletonTitle width="150px" height="20px" />
               <div className="flex flex-wrap gap-2">
                 {[...Array(10)].map((_, i) => (
                   <SkeletonBox key={i} width="48px" height="48px" borderRadius="0.5rem" />
                 ))}
               </div>
            </div>
            
            <div className="flex flex-col gap-4">
               <SkeletonTitle width="150px" height="20px" />
               <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <SkeletonBox height="64px" borderRadius="0.5rem" />
                  <SkeletonBox height="64px" borderRadius="0.5rem" />
                  <SkeletonBox height="64px" borderRadius="0.5rem" />
               </div>
            </div>
          </div>

          <div className="lg:col-span-2 flex flex-col gap-6">
            <SkeletonCard style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
               <SkeletonTitle width="40%" height="24px" className="mb-8" />
               <SkeletonText width="60%" height="40px" className="mb-2" />
               <SkeletonText width="60%" height="40px" className="mb-2" />
               <SkeletonBox width="80%" height="2px" className="my-4" />
               <SkeletonText width="70%" height="48px" />
            </SkeletonCard>
            <SkeletonButton width="100%" height="56px" />
          </div>
        </div>

      </div>
    </div>
  );
};
