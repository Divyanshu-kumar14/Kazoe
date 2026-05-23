import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense, useEffect, useState } from 'react';
import { TestInterface } from '../components/practice/TestInterface';
import { ResultScreen } from '../components/practice/ResultScreen';
import { useAppStore } from '../store/useAppStore';
import { useMultiplayerStore } from '../store/useMultiplayerStore';
import { Layout } from '../components/layout/Layout';
import { HomePageSkeleton } from '../components/skeletons/HomePageSkeleton';
import { PracticeModeSkeleton } from '../components/skeletons/PracticeModeSkeleton';
import { SheetGeneratorSkeleton } from '../components/skeletons/SheetGeneratorSkeleton';
import { LevelGuideSkeleton } from '../components/skeletons/LevelGuideSkeleton';
import { MultiplayerHomeSkeleton } from '../components/skeletons/MultiplayerHomeSkeleton';
import { MultiplayerGameSkeleton } from '../components/skeletons/MultiplayerGameSkeleton';
import { MultiplayerResultsSkeleton } from '../components/skeletons/MultiplayerResultsSkeleton';

const Home = lazy(() => import('../pages/Home'));
const PracticeMode = lazy(() => import('../pages/PracticeMode'));
const SheetGenerator = lazy(() => import('../pages/SheetGenerator'));
const LevelGuide = lazy(() => import('../pages/LevelGuide'));
const MultiplayerHome = lazy(() => import('../pages/MultiplayerHome'));
const MultiplayerGame = lazy(() => import('../pages/MultiplayerGame'));
const MultiplayerResults = lazy(() => import('../pages/MultiplayerResults'));

// LoadingFallback removed in favor of page-specific skeletons

function SessionGuard({ children }: { children: React.ReactNode }) {
  const status = useAppStore((s) => s.session.status);
  if (status === 'finished') return <Navigate to="/practice/results" replace />;
  if (status !== 'active') return <Navigate to="/practice" replace />;
  return <>{children}</>;
}

function ResultsGuard({ children }: { children: React.ReactNode }) {
  const status = useAppStore((s) => s.session.status);
  if (status !== 'finished') return <Navigate to="/practice" replace />;
  return <>{children}</>;
}

function MultiplayerGameGuard({ children }: { children: React.ReactNode }) {
  const matchStatus = useMultiplayerStore((s) => s.matchStatus);
  if (matchStatus === 'finished') return <Navigate to="/multiplayer/results" replace />;
  if (matchStatus === 'idle') return <Navigate to="/multiplayer" replace />;
  return <>{children}</>;
}

function MultiplayerResultsGuard({ children }: { children: React.ReactNode }) {
  const matchStatus = useMultiplayerStore((s) => s.matchStatus);
  if (matchStatus !== 'finished') return <Navigate to="/multiplayer" replace />;
  return <>{children}</>;
}

function AuthInitializer({ children }: { children: React.ReactNode }) {
  const { initAuth, userId } = useMultiplayerStore();
  const [ready, setReady] = useState(userId !== null);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      if (!userId) {
        try {
          await initAuth();
        } catch {
          // Ignore auth init errors
        }
      }
      if (mounted) setReady(true);
    };
    init();
    return () => { mounted = false; };
  }, [userId, initAuth]);

  if (!ready) return null;
  return <>{children}</>;
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <AuthInitializer>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Suspense fallback={<HomePageSkeleton />}><Home /></Suspense>} />
            <Route path="/practice" element={<Suspense fallback={<PracticeModeSkeleton />}><PracticeMode /></Suspense>} />
            <Route
              path="/practice/session"
              element={
                <SessionGuard>
                  <TestInterface />
                </SessionGuard>
              }
            />
            <Route
              path="/practice/results"
              element={
                <ResultsGuard>
                  <ResultScreen />
                </ResultsGuard>
              }
            />
            <Route path="/sheets" element={<Suspense fallback={<SheetGeneratorSkeleton />}><SheetGenerator /></Suspense>} />
            <Route path="/levels" element={<Suspense fallback={<LevelGuideSkeleton />}><LevelGuide /></Suspense>} />

            <Route path="/multiplayer" element={<Suspense fallback={<MultiplayerHomeSkeleton />}><MultiplayerHome /></Suspense>} />
            <Route
              path="/multiplayer/game/:matchId"
              element={
                <MultiplayerGameGuard>
                  <Suspense fallback={<MultiplayerGameSkeleton />}><MultiplayerGame /></Suspense>
                </MultiplayerGameGuard>
              }
            />
            <Route
              path="/multiplayer/results"
              element={
                <MultiplayerResultsGuard>
                  <Suspense fallback={<MultiplayerResultsSkeleton />}><MultiplayerResults /></Suspense>
                </MultiplayerResultsGuard>
              }
            />
          </Route>
        </Routes>
      </AuthInitializer>
    </BrowserRouter>
  );
}
