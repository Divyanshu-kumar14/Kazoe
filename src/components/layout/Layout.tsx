import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/practice', label: 'Practice Mode' },
  { to: '/multiplayer', label: 'Multiplayer' },
  { to: '/sheets', label: 'Sheet Generator' },
  { to: '/levels', label: 'Level Guide' },
];

export function Layout() {
  const theme = useAppStore((s) => s.theme);
  const toggleTheme = useAppStore((s) => s.toggleTheme);
  const location = useLocation();

  // Hide navbar during active test session
  const isTestSession = location.pathname === '/practice/session';

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-on-surface)' }}>
      
      {/* ─── Top Navigation Bar ─── */}
      {!isTestSession && (
        <header
          className="sticky top-0 z-50 backdrop-blur-md"
          style={{
            borderBottom: '1px solid var(--color-outline-variant)',
            backgroundColor: theme === 'dark' ? 'rgba(18,18,18,0.92)' : 'rgba(252,249,244,0.92)',
          }}
        >
          <div className="max-w-[1200px] mx-auto flex items-center justify-between px-6 h-16">
            
            {/* Logo */}
            <Link to="/" className="flex items-center gap-1 no-underline group">
              <span
                className="material-symbols-outlined"
                style={{ fontSize: '28px', color: 'var(--color-primary)', fontVariationSettings: "'FILL' 1" }}
              >
                grid_view
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  color: 'var(--color-primary)',
                  letterSpacing: '-0.02em',
                }}
              >
                Kazoe
              </span>
            </Link>

            {/* Nav Links */}
            <nav className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === '/'}
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-md text-sm font-medium transition-colors no-underline ${
                      isActive
                        ? 'font-bold'
                        : 'hover:bg-[var(--color-surface-container)]'
                    }`
                  }
                  style={({ isActive }) => ({
                    color: isActive ? 'var(--color-on-surface)' : 'var(--color-on-surface-variant)',
                    borderBottom: isActive ? '2px solid var(--color-primary)' : '2px solid transparent',
                    borderRadius: isActive ? '0.375rem 0.375rem 0 0' : '0.375rem',
                  })}
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>

            {/* Right section */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleTheme}
                className="w-9 h-9 flex items-center justify-center rounded-full transition-colors icon-btn"
                style={{
                  color: 'var(--color-on-surface-variant)',
                  backgroundColor: 'transparent',
                  border: 'none',
                }}
                aria-label="Toggle theme"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                  {theme === 'dark' ? 'light_mode' : 'dark_mode'}
                </span>
              </button>

              <button
                className="w-9 h-9 flex items-center justify-center rounded-full transition-colors icon-btn"
                style={{
                  color: 'var(--color-on-surface-variant)',
                  backgroundColor: 'transparent',
                  border: 'none',
                }}
                aria-label="Settings"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                  settings
                </span>
              </button>
            </div>
          </div>

          {/* Mobile nav */}
          <nav className="flex md:hidden items-center gap-1 px-4 pb-2 overflow-x-auto">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors no-underline ${
                    isActive ? 'font-bold' : ''
                  }`
                }
                style={({ isActive }) => ({
                  color: isActive ? 'var(--color-on-surface)' : 'var(--color-on-surface-variant)',
                  backgroundColor: isActive ? 'var(--color-surface-container)' : 'transparent',
                })}
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        </header>
      )}

      {/* ─── Main Content ─── */}
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>

      {/* ─── Footer ─── */}
      {!isTestSession && (
        <footer
          className="mt-auto"
          style={{
            backgroundColor: 'var(--color-surface-container-highest)',
            borderTop: '1px solid var(--color-outline-variant)',
          }}
        >
          <div className="max-w-[1200px] mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.125rem',
                fontWeight: 700,
                color: 'var(--color-primary)',
              }}
            >
              Kazoe
            </span>
            <span className="text-sm" style={{ color: 'var(--color-on-surface-variant)' }}>
              © 2024 Kazoe. Precision in every bead.
            </span>
            <div className="flex items-center gap-4 text-sm" style={{ color: 'var(--color-on-surface-variant)' }}>
              <span>Print Settings</span>
              <span style={{ color: 'var(--color-outline-variant)' }}>|</span>
              <span>Terms of Mastery</span>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
