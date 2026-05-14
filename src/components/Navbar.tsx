import { useRouter } from '../lib/router';
import { useAuth } from '../lib/auth';
import { Home, Compass, Heart, User, LayoutDashboard, UploadCloud } from 'lucide-react';

export function Navbar() {
  const { navigate, route } = useRouter();
  const { isAdmin, user } = useAuth();

  const isActive = (p: string) => route.page === p;

  return (
    <nav className="flex items-center gap-1 bg-white/90 dark:bg-black/70 backdrop-blur-xl border border-stone-200 dark:border-zinc-800 rounded-2xl p-1.5 shadow-2xl transition-colors duration-300">
      <button 
        onClick={() => navigate({ page: 'home' })} 
        className={`p-2.5 rounded-xl transition-all ${
          isActive('home') 
            ? 'bg-stone-900 dark:bg-cyan-400 text-white dark:text-black shadow-md' 
            : 'text-stone-400 dark:text-gray-500 hover:bg-stone-100 dark:hover:bg-zinc-900 dark:hover:text-cyan-400'
        }`}
      >
        <Home className="w-5 h-5" />
      </button>

      <button 
        onClick={() => navigate({ page: 'explore' })} 
        className={`p-2.5 rounded-xl transition-all ${
          isActive('explore') 
            ? 'bg-stone-900 dark:bg-cyan-400 text-white dark:text-black shadow-md' 
            : 'text-stone-400 dark:text-gray-500 hover:bg-stone-100 dark:hover:bg-zinc-900 dark:hover:text-cyan-400'
        }`}
      >
        <Compass className="w-5 h-5" />
      </button>

      {user && (
        <button 
          onClick={() => navigate({ page: 'upload-dashboard' })} 
          className={`p-2.5 rounded-xl transition-all ${
            isActive('upload-dashboard') 
              ? 'bg-amber-500 dark:bg-cyan-400 text-white dark:text-black shadow-md' 
              : 'text-stone-400 dark:text-gray-500 hover:bg-amber-50 dark:hover:bg-cyan-400/10 dark:hover:text-cyan-400'
          }`}
        >
          <UploadCloud className="w-5 h-5" />
        </button>
      )}

      <button 
        onClick={() => navigate({ page: 'favorites' })} 
        className={`p-2.5 rounded-xl transition-all ${
          isActive('favorites') 
            ? 'bg-stone-900 dark:bg-cyan-400 text-white dark:text-black shadow-md' 
            : 'text-stone-400 dark:text-gray-500 hover:bg-stone-100 dark:hover:bg-zinc-900 dark:hover:text-cyan-400'
        }`}
      >
        <Heart className="w-5 h-5" />
      </button>

      <button 
        onClick={() => navigate({ page: 'profile' })} 
        className={`p-2.5 rounded-xl transition-all ${
          isActive('profile') 
            ? 'bg-stone-900 dark:bg-cyan-400 text-white dark:text-black shadow-md' 
            : 'text-stone-400 dark:text-gray-500 hover:bg-stone-100 dark:hover:bg-zinc-900 dark:hover:text-cyan-400'
        }`}
      >
        <User className="w-5 h-5" />
      </button>

      {isAdmin && (
        <>
          <div className="w-px h-6 bg-stone-200 dark:bg-zinc-800 mx-1 transition-colors" />
          <button 
            onClick={() => navigate({ page: 'super-admin' })} 
            className={`p-2.5 rounded-xl transition-all ${
              isActive('super-admin') 
                ? 'bg-red-500 dark:bg-red-500 text-white dark:text-white shadow-md' 
                : 'text-stone-400 dark:text-gray-500 hover:bg-red-50 dark:hover:bg-red-950/40 dark:hover:text-red-400'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
          </button>
        </>
      )}
    </nav>
  );
}