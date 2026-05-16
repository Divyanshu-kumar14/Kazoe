import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from '../pages/Home';
import PracticeMode from '../pages/PracticeMode';
import SheetGenerator from '../pages/SheetGenerator';
import LevelGuide from '../pages/LevelGuide';
import { TestInterface } from '../components/practice/TestInterface';
import { ResultScreen } from '../components/practice/ResultScreen';
import { useAppStore } from '../store/useAppStore';
import { Layout } from '../components/layout/Layout';

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
          <Route path="/" element={<Home />} />
          <Route path="/practice" element={<PracticeMode />} />
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
          <Route path="/sheets" element={<SheetGenerator />} />
          <Route path="/levels" element={<LevelGuide />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
