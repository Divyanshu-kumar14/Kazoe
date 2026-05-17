import { SpeedInsights } from '@vercel/speed-insights/react';
import { AppRouter } from './router';

function App() {
  return (
    <>
      <AppRouter />
      <SpeedInsights />
    </>
  );
}

export default App;
