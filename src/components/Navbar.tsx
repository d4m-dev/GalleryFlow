import { useRouter } from '../lib/router';
import { useAuth } from '../lib/auth';
import { Home, Compass, Heart, User, LayoutDashboard, UploadCloud } from 'lucide-react';

export function Navbar() {
  const { navigate, route } = useRouter();
  const { isAdmin, user } = useAuth();

  const isActive = (p: string) => route.page === p;

  return (
    <nav className="flex items-center gap-1 bg-white/90 dark:bg-stone-900/90 backdrop-blur-xl border border-stone-200 dark:border-stone-800 rounded-2xl p-1.5 shadow-2xl transition-all">
      <button onClick={() => navigate({ page: 'home' })} className={`p-2.5 rounded-xl transition-all ${isActive('home') ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-900 shadow-md' : 'text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'}`}>
        <Home className="w-5 h-5" />
      </button>

      <button onClick={() => navigate({ page: 'explore' })} className={`p-2.5 rounded-xl transition-all ${isActive('explore') ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-900 shadow-md' : 'text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'}`}>
        <Compass className="w-5 h-5" />
      </button>

      {user && (
        <button onClick={() => navigate({ page: 'upload-dashboard' })} className={`p-2.5 rounded-xl transition-all ${isActive('upload-dashboard') ? 'bg-amber-500 text-white shadow-md' : 'text-stone-400 hover:bg-amber-50 dark:hover:bg-amber-900/20'}`}>
          <UploadCloud className="w-5 h-5" />
        </button>
      )}

      <button onClick={() => navigate({ page: 'favorites' })} className={`p-2.5 rounded-xl transition-all ${isActive('favorites') ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-900 shadow-md' : 'text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'}`}>
        <Heart className="w-5 h-5" />
      </button>

      <button onClick={() => navigate({ page: 'profile' })} className={`p-2.5 rounded-xl transition-all ${isActive('profile') ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-900 shadow-md' : 'text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'}`}>
        <User className="w-5 h-5" />
      </button>

      {isAdmin && (
        <>
          <div className="w-px h-6 bg-stone-200 dark:bg-stone-800 mx-1" />
          <button onClick={() => navigate({ page: 'super-admin' })} className={`p-2.5 rounded-xl transition-all ${isActive('super-admin') ? 'bg-red-500 text-white' : 'text-stone-400 hover:bg-red-50 dark:hover:bg-red-900/20'}`}>
            <LayoutDashboard className="w-5 h-5" />
          </button>
        </>
      )}
    </nav>
  );
}