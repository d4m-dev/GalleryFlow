import { ReactNode, useEffect } from 'react';
import { Navbar } from './Navbar';
import { useAuth } from '../lib/auth';
import { useRouter } from '../lib/router';
import { Camera, LogIn, LogOut } from 'lucide-react';

export default function Layout({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  const { navigate } = useRouter();

  useEffect(() => {
    const isDark = localStorage.getItem('theme') === 'dark';
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 transition-colors duration-300 flex flex-col">
      {/* Header cũ giữ nguyên */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-stone-900/80 backdrop-blur-xl border-b border-stone-200/60 dark:border-stone-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => navigate({ page: 'home' })}
              className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
            >
              <div className="w-9 h-9 bg-stone-900 dark:bg-white rounded-lg flex items-center justify-center shadow-lg">
                <Camera className="w-5 h-5 text-white dark:text-stone-900" />
              </div>
              <span className="text-lg font-bold text-stone-900 dark:text-white uppercase tracking-tighter">
                PhotoGallery
              </span>
            </button>

            <nav className="flex items-center">
              {user ? (
                <button
                  onClick={signOut}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-stone-600 dark:text-stone-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Đăng xuất</span>
                </button>
              ) : (
                <button
                  onClick={() => navigate({ page: 'login' })}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl transition-all"
                >
                  <LogIn className="w-4 h-4" />
                  <span className="hidden sm:inline">Đăng nhập</span>
                </button>
              )}
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1 animate-fadeIn">
        {children}
      </main>

      {/* Floating Navbar */}
      <div className="fixed bottom-8 left-0 right-0 z-[60] flex justify-center px-4 pointer-events-none">
        <div className="pointer-events-auto">
          <Navbar />
        </div>
      </div>
    </div>
  );
}