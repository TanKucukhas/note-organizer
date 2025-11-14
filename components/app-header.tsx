'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function AppHeader() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Dashboard', icon: '🏠' },
    { href: '/organize', label: 'Organization DB', icon: '📊' },
    { href: '/manage', label: 'Manage Items', icon: '⚙️' },
    { href: '/organizer/notes', label: 'Note Organizer', icon: '📝' },
    { href: '/history', label: 'History', icon: '📋' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo/Brand */}
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <span>📔</span>
            <span>Notes Organizer</span>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href ||
                (item.href === '/organizer/notes' && pathname.startsWith('/organizer/notes'));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors
                    ${isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-accent hover:text-accent-foreground'
                    }
                  `}
                >
                  <span>{item.icon}</span>
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
