
import { SkeletonCard, SkeletonTitle, SkeletonText, SkeletonBox } from '../common/SkeletonPrimitives';

export const MultiplayerGameSkeleton = () => {
  return (
    <div className="flex-1 flex flex-col max-w-[1000px] w-full mx-auto p-4 md:p-6 gap-6 animate-fade-in-up">
      
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <SkeletonBox width="100px" height="32px" borderRadius="16px" />
        <SkeletonBox width="80px" height="32px" borderRadius="16px" />
        <SkeletonBox width="100px" height="32px" borderRadius="16px" />
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-0">
        
        {/* Main Game Area */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <SkeletonCard style={{ flex: 1, minHeight: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            {/* Number Display area */}
            <SkeletonText width="60%" height="64px" className="mb-4" />
            <SkeletonText width="50%" height="48px" className="mb-12" />
            
            {/* Input area */}
            <div className="w-full max-w-[400px] flex flex-col items-center gap-6">
              <SkeletonBox width="100%" height="64px" borderRadius="0.5rem" />
              <SkeletonBox width="150px" height="48px" borderRadius="0.5rem" />
            </div>
          </SkeletonCard>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <SkeletonCard style={{ padding: '1rem' }}>
            <SkeletonTitle width="60%" height="20px" className="mb-4" />
            <div className="flex flex-col gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <SkeletonText width="40%" />
                    <SkeletonText width="20%" />
                  </div>
                  <SkeletonBox width="100%" height="8px" borderRadius="4px" />
                </div>
              ))}
            </div>
          </SkeletonCard>
        </div>
      </div>

    </div>
  );
};
