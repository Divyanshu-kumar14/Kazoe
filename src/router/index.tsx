import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense, useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
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

const TestInterface = lazy(() => import('../components/practice/TestInterface').then(m => ({ default: m.TestInterface })));
const ResultScreen = lazy(() => import('../components/practice/ResultScreen').then(m => ({ default: m.ResultScreen })));

const MultiplayerHome = lazy(() => import('../pages/MultiplayerHome'));
const MultiplayerGame = lazy(() => import('../pages/MultiplayerGame'));
const MultiplayerResults = lazy(() => import('../pages/MultiplayerResults'));

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

// Multiplayer guards — dynamic import keeps @supabase/supabase-js out of the main bundle (~80 kB saved)

function AuthInitializer({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    import('../store/useMultiplayerStore').then(({ useMultiplayerStore }) => {
      if (!mounted) return;
      const state = useMultiplayerStore.getState();
      if (state.userId) {
        setReady(true);
        return;
      }
      state.initAuth()
        .then(() => { if (mounted) setReady(true); })
        .catch(() => { if (mounted) setReady(true); });
    });
    return () => { mounted = false; };
  }, []);

  if (!ready) return null;
  return <>{children}</>;
}

function MultiplayerGameGuard({ children }: { children: React.ReactNode }) {
  const [matchStatus, setMatchStatus] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    import('../store/useMultiplayerStore').then(({ useMultiplayerStore }) => {
      if (!mounted) return;
      setMatchStatus(useMultiplayerStore.getState().matchStatus);
    });
    return () => { mounted = false; };
  }, []);

  if (matchStatus === 'finished') return <Navigate to="/multiplayer/results" replace />;
  if (matchStatus === 'idle') return <Navigate to="/multiplayer" replace />;
  return <>{children}</>;
}

function MultiplayerResultsGuard({ children }: { children: React.ReactNode }) {
  const [matchStatus, setMatchStatus] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    import('../store/useMultiplayerStore').then(({ useMultiplayerStore }) => {
      if (!mounted) return;
      setMatchStatus(useMultiplayerStore.getState().matchStatus);
    });
    return () => { mounted = false; };
  }, []);

  if (matchStatus !== 'finished') return <Navigate to="/multiplayer" replace />;
  return <>{children}</>;
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <AuthInitializer>
        <Routes>
          <Route element={<Layout />}>
            <Route
              path="/"
              element={<Suspense fallback={<HomePageSkeleton />}><Home /></Suspense>}
            />

            <Route
              path="/practice"
              element={<Suspense fallback={<PracticeModeSkeleton />}><PracticeMode /></Suspense>}
            />
            <Route
              path="/practice/session"
              element={
                <SessionGuard>
                  <Suspense fallback={<PracticeModeSkeleton />}>
                    <TestInterface />
                  </Suspense>
                </SessionGuard>
              }
            />
            <Route
              path="/practice/results"
              element={
                <ResultsGuard>
                  <Suspense fallback={<PracticeModeSkeleton />}>
                    <ResultScreen />
                  </Suspense>
                </ResultsGuard>
              }
            />

            <Route
              path="/sheets"
              element={<Suspense fallback={<SheetGeneratorSkeleton />}><SheetGenerator /></Suspense>}
            />

            <Route
              path="/levels"
              element={<Suspense fallback={<LevelGuideSkeleton />}><LevelGuide /></Suspense>}
            />

            <Route
              path="/multiplayer"
              element={<Suspense fallback={<MultiplayerHomeSkeleton />}><MultiplayerHome /></Suspense>}
            />
            <Route
              path="/multiplayer/game/:matchId"
              element={
                <Suspense fallback={<MultiplayerGameSkeleton />}>
                  <MultiplayerGameGuard>
                    <MultiplayerGame />
                  </MultiplayerGameGuard>
                </Suspense>
              }
            />
            <Route
              path="/multiplayer/results"
              element={
                <Suspense fallback={<MultiplayerResultsSkeleton />}>
                  <MultiplayerResultsGuard>
                    <MultiplayerResults />
                  </MultiplayerResultsGuard>
                </Suspense>
              }
            />
          </Route>
        </Routes>
      </AuthInitializer>
    </BrowserRouter>
  );
}
