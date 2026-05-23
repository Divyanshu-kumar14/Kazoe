
import { SkeletonCard, SkeletonTitle, SkeletonText, SkeletonCircle, SkeletonBox } from '../common/SkeletonPrimitives';

export const HomePageSkeleton = () => {
  return (
    <div className="flex-1 animate-fade-in-up">
      <div className="max-w-[1200px] mx-auto px-6 py-10 flex flex-col gap-8">
        
        {/* WelcomeHeader */}
        <SkeletonCard style={{ padding: '2rem', display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="flex flex-col gap-4 w-full md:w-1/2">
            <SkeletonTitle width="50%" height="32px" />
            <SkeletonText width="80%" />
            <SkeletonBox width="140px" height="40px" borderRadius="0.5rem" className="mt-4" />
          </div>
          <div className="hidden md:block">
            <SkeletonCircle size="120px" />
          </div>
        </SkeletonCard>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* StatsOverview */}
          <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
            <SkeletonCard><SkeletonCircle size="24px" /><SkeletonTitle width="80%" /><SkeletonText width="50%" /></SkeletonCard>
            <SkeletonCard><SkeletonCircle size="24px" /><SkeletonTitle width="80%" /><SkeletonText width="50%" /></SkeletonCard>
            <SkeletonCard><SkeletonCircle size="24px" /><SkeletonTitle width="80%" /><SkeletonText width="50%" /></SkeletonCard>
            <SkeletonCard><SkeletonCircle size="24px" /><SkeletonTitle width="80%" /><SkeletonText width="50%" /></SkeletonCard>
          </div>
          {/* LevelBadge */}
          <SkeletonCard className="flex flex-col items-center justify-center">
             <SkeletonCircle size="64px" />
             <SkeletonTitle width="40%" className="mt-4" />
             <SkeletonText width="60%" className="mt-2" />
          </SkeletonCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* MultiplayerDashboard */}
            <SkeletonCard>
              <SkeletonTitle width="30%" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <SkeletonBox height="64px" />
                <SkeletonBox height="64px" />
                <SkeletonBox height="64px" />
                <SkeletonBox height="64px" />
              </div>
            </SkeletonCard>

            {/* AccuracySparkline + BadgeGrid */}
            <SkeletonCard>
               <SkeletonBox height="120px" />
               <div className="border-t my-4" style={{ borderColor: 'var(--color-outline-variant)' }} />
               <div className="flex flex-wrap gap-4">
                 {[...Array(8)].map((_, i) => (
                   <SkeletonCircle key={i} size="48px" />
                 ))}
               </div>
            </SkeletonCard>

            {/* RecentSessions */}
            <SkeletonCard>
              <SkeletonTitle width="40%" />
              <div className="flex flex-col gap-4 mt-4">
                 {[...Array(5)].map((_, i) => (
                   <SkeletonBox key={i} height="40px" />
                 ))}
              </div>
            </SkeletonCard>
          </div>

          <div className="lg:col-span-1 flex flex-col gap-6">
            {/* Leaderboard */}
            <SkeletonCard style={{ flex: 1 }}>
              <SkeletonTitle width="60%" />
              <div className="flex flex-col gap-3 mt-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <SkeletonCircle size="32px" />
                    <div className="flex-1">
                      <SkeletonText width="70%" />
                    </div>
                    <SkeletonText width="30%" />
                  </div>
                ))}
              </div>
            </SkeletonCard>
          </div>
        </div>

        {/* QuickLinks */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <SkeletonCard style={{ flexDirection: 'row', alignItems: 'center' }}>
             <SkeletonCircle size="48px" />
             <div className="flex flex-col gap-2 flex-1">
               <SkeletonTitle width="60%" height="20px" />
               <SkeletonText width="90%" />
             </div>
           </SkeletonCard>
           <SkeletonCard style={{ flexDirection: 'row', alignItems: 'center' }}>
             <SkeletonCircle size="48px" />
             <div className="flex flex-col gap-2 flex-1">
               <SkeletonTitle width="60%" height="20px" />
               <SkeletonText width="90%" />
             </div>
           </SkeletonCard>
        </div>

      </div>
    </div>
  );
};
