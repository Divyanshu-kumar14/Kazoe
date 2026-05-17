import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { TestInterface } from '../components/practice/TestInterface';
import { ResultScreen } from '../components/practice/ResultScreen';
import { useAppStore } from '../store/useAppStore';
import { Layout } from '../components/layout/Layout';

const Home = lazy(() => import('../pages/Home'));
const PracticeMode = lazy(() => import('../pages/PracticeMode'));
const SheetGenerator = lazy(() => import('../pages/SheetGenerator'));
const LevelGuide = lazy(() => import('../pages/LevelGuide'));

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

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Suspense fallback={null}><Home /></Suspense>} />
          <Route path="/practice" element={<Suspense fallback={null}><PracticeMode /></Suspense>} />
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
          <Route path="/sheets" element={<Suspense fallback={null}><SheetGenerator /></Suspense>} />
          <Route path="/levels" element={<Suspense fallback={null}><LevelGuide /></Suspense>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
