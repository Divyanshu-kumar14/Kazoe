import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense, useEffect, useState } from 'react';
import { TestInterface } from '../components/practice/TestInterface';
import { ResultScreen } from '../components/practice/ResultScreen';
import { useAppStore } from '../store/useAppStore';
import { useMultiplayerStore } from '../store/useMultiplayerStore';
import { Layout } from '../components/layout/Layout';

const Home = lazy(() => import('../pages/Home'));
const PracticeMode = lazy(() => import('../pages/PracticeMode'));
const SheetGenerator = lazy(() => import('../pages/SheetGenerator'));
const LevelGuide = lazy(() => import('../pages/LevelGuide'));
const MultiplayerHome = lazy(() => import('../pages/MultiplayerHome'));
const MultiplayerGame = lazy(() => import('../pages/MultiplayerGame'));
const MultiplayerResults = lazy(() => import('../pages/MultiplayerResults'));

function LoadingFallback() {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="flex flex-col items-center gap-3 text-on-surface-variant">
        <span className="material-symbols-outlined animate-pulse text-[32px]" role="img" aria-hidden="true">hourglass_empty</span>
        <span className="text-sm font-medium">Loading…</span>
      </div>
    </div>
  );
}

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
            <Route path="/" element={<Suspense fallback={<LoadingFallback />}><Home /></Suspense>} />
            <Route path="/practice" element={<Suspense fallback={<LoadingFallback />}><PracticeMode /></Suspense>} />
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
            <Route path="/sheets" element={<Suspense fallback={<LoadingFallback />}><SheetGenerator /></Suspense>} />
            <Route path="/levels" element={<Suspense fallback={<LoadingFallback />}><LevelGuide /></Suspense>} />

            <Route path="/multiplayer" element={<Suspense fallback={<LoadingFallback />}><MultiplayerHome /></Suspense>} />
            <Route
              path="/multiplayer/game/:matchId"
              element={
                <MultiplayerGameGuard>
                  <Suspense fallback={<LoadingFallback />}><MultiplayerGame /></Suspense>
                </MultiplayerGameGuard>
              }
            />
            <Route
              path="/multiplayer/results"
              element={
                <MultiplayerResultsGuard>
                  <Suspense fallback={<LoadingFallback />}><MultiplayerResults /></Suspense>
                </MultiplayerResultsGuard>
              }
            />
          </Route>
        </Routes>
      </AuthInitializer>
    </BrowserRouter>
  );
}
