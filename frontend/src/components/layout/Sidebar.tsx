import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Activity,
  BookOpen,
  Database,
  FolderGit2,
  Github,
  LayoutDashboard,
  Menu,
  Network,
  PlayCircle,
  RefreshCcw,
  Server,
  ShieldAlert,
  X,
  Zap,
} from 'lucide-react';

type NavItem =
  | {
      section: string;
    }
  | {
      label: string;
      icon: React.ComponentType<{ className?: string }>;
      path: string;
    };

const navItems: NavItem[] = [
  { section: 'MAIN' },

  {
    label: 'Landing',
    icon: Activity,
    path: '/',
  },
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
    path: '/dashboard',
  },
  {
    label: 'Event Explorer',
    icon: Database,
    path: '/events',
  },
  {
    label: 'Failure Demo',
    icon: PlayCircle,
    path: '/demo',
  },

  { section: 'OPERATIONS' },

  {
    label: 'Projects & Tenants',
    icon: FolderGit2,
    path: '/projects',
  },
  {
    label: 'Retry Queue',
    icon: RefreshCcw,
    path: '/retries',
  },
  {
    label: 'Dead Letter Queue',
    icon: ShieldAlert,
    path: '/dlq',
  },

  { section: 'SYSTEM' },

  {
    label: 'Playground',
    icon: Zap,
    path: '/playground',
  },
  {
    label: 'Architecture',
    icon: Network,
    path: '/architecture',
  },
  {
    label: 'System Status',
    icon: Server,
    path: '/status',
  },
];

export default function Sidebar() {
  const [open, setOpen] = useState(false);

  /*
   * Close the drawer whenever the user navigates.
   */
  useEffect(() => {
    const closeOnNavigation = () => {
      setOpen(false);
    };

    window.addEventListener('popstate', closeOnNavigation);

    return () => {
      window.removeEventListener('popstate', closeOnNavigation);
    };
  }, []);

  /*
   * Prevent body scrolling while the drawer is open.
   */
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  /*
   * Escape closes the drawer.
   */
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <>
      {/* =====================================================
          FLOATING MENU BUTTON
          ===================================================== */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open navigation"
          className="
            fixed
            top-5
            left-5
            z-50

            w-11
            h-11

            flex
            items-center
            justify-center

            rounded-xl

            border
            border-border

            bg-surface/90
            backdrop-blur-md

            text-muted

            shadow-lg

            transition-all
            duration-200

            hover:bg-surfaceHover
            hover:text-white
            hover:border-gray-600

            focus:outline-none
            focus:ring-2
            focus:ring-primary/50
          "
        >
          <Menu className="w-5 h-5" />
        </button>
      )}

      {/* =====================================================
          BACKDROP
          ===================================================== */}
      {open && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setOpen(false)}
          className="
            fixed
            inset-0
            z-40

            bg-black/60
            backdrop-blur-[2px]

            cursor-default
          "
        />
      )}

      {/* =====================================================
          NAVIGATION DRAWER
          ===================================================== */}
      <aside
        className={`
          fixed
          inset-y-0
          left-0
          z-50

          w-[280px]
          max-w-[85vw]

          flex
          flex-col

          border-r
          border-border

          bg-surface

          shadow-2xl

          transition-transform
          duration-300
          ease-out

          ${open ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* ===================================================
            HEADER
            =================================================== */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div
              className="
                relative
                w-9
                h-9
                rounded-xl
                bg-primary/10
                border
                border-primary/20
                flex
                items-center
                justify-center
              "
            >
              <div
                className="
                  w-3
                  h-3
                  rounded-full
                  bg-primary
                  shadow-[0_0_12px_#3B82F6]
                "
              />

              <div
                className="
                  absolute
                  inset-0
                  rounded-xl
                  border
                  border-primary/20
                  animate-pulse
                "
              />
            </div>

            <div>
              <div className="text-lg font-bold tracking-tight text-white">
                RelayX
              </div>

              <div className="text-[10px] uppercase tracking-[0.18em] text-muted">
                Event Infrastructure
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close navigation"
            className="
              w-9
              h-9
              rounded-lg

              flex
              items-center
              justify-center

              text-muted

              hover:bg-surfaceHover
              hover:text-white

              transition-colors
            "
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ===================================================
            NAVIGATION
            =================================================== */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <div className="space-y-1">
            {navItems.map((item, index) => {
              /*
               * Section heading
               */
              if ('section' in item) {
                return (
                  <div
                    key={`${item.section}-${index}`}
                    className="
                      px-3
                      pt-5
                      pb-2

                      text-[10px]
                      font-semibold
                      tracking-[0.16em]
                      text-muted
                    "
                  >
                    {item.section}
                  </div>
                );
              }

              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `
                      group
                      relative

                      flex
                      items-center
                      gap-3

                      px-3
                      py-2.5

                      rounded-lg

                      text-sm
                      font-medium

                      transition-all
                      duration-150

                      ${
                        isActive
                          ? `
                            bg-primary/10
                            text-primary
                          `
                          : `
                            text-gray-400
                            hover:bg-surfaceHover
                            hover:text-white
                          `
                      }
                    `
                  }
                >
                  {({ isActive }) => (
                    <>
                      {/* Active indicator */}
                      {isActive && (
                        <span
                          className="
                            absolute
                            left-0
                            top-1/2
                            -translate-y-1/2

                            w-0.5
                            h-5

                            rounded-r-full

                            bg-primary
                            shadow-[0_0_8px_#3B82F6]
                          "
                        />
                      )}

                      <Icon
                        className={`
                          w-[17px]
                          h-[17px]
                          shrink-0

                          transition-colors

                          ${
                            isActive
                              ? 'text-primary'
                              : 'text-gray-500 group-hover:text-gray-300'
                          }
                        `}
                      />

                      <span>{item.label}</span>

                      {isActive && (
                        <span
                          className="
                            ml-auto
                            w-1.5
                            h-1.5
                            rounded-full
                            bg-primary
                            shadow-[0_0_8px_#3B82F6]
                          "
                        />
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        </nav>

        {/* ===================================================
            FOOTER
            =================================================== */}
        <div className="border-t border-border p-3">
          

          <div
            className="
              mt-3
              px-2
              text-center
              text-[10px]
              text-muted
            "
          >
            Reliable event delivery infrastructure
          </div>
        </div>
      </aside>
    </>
  );
}