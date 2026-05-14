import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

type Route =
  | { page: 'home' }
  | { page: 'explore' }
  | { page: 'profile' }
  | { page: 'favorites' }
  | { page: 'album'; id: string }
  | { page: 'login' }
  | { page: 'register' }
  | { page: 'upload-dashboard' }
  | { page: 'super-admin' }
  | { page: 'admin-album-edit'; id: string }
  | { page: 'admin-album-new' }
  | { page: 'admin-photos'; albumId: string };

interface RouterContextType {
  route: Route;
  navigate: (route: Route) => void;
}

const RouterContext = createContext<RouterContextType | undefined>(undefined);

export function RouterProvider({ children }: { children: ReactNode }) {
  const [route, setRoute] = useState<Route>({ page: 'home' });

  const navigate = useCallback((newRoute: Route) => {
    setRoute(newRoute);
    window.scrollTo(0, 0);
  }, []);

  return (
    <RouterContext.Provider value={{ route, navigate }}>
      {children}
    </RouterContext.Provider>
  );
}

export function useRouter() {
  const context = useContext(RouterContext);
  if (!context) throw new Error('useRouter must be used within RouterProvider');
  return context;
}