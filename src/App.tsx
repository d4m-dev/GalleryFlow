import { AuthProvider } from './lib/auth';
import { RouterProvider, useRouter } from './lib/router';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import ExplorePage from './pages/ExplorePage';
import ProfilePage from './pages/ProfilePage';
import AlbumPage from './pages/AlbumPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import SuperAdmin from './pages/admin/SuperAdmin';
import UploadDashboard from './pages/UploadDashboard';
import AlbumForm from './pages/admin/AlbumForm';
import PhotoManager from './pages/admin/PhotoManager';
import FavoritesPage from './pages/FavoritesPage';

function Router() {
  const { route } = useRouter();

  switch (route.page) {
    case 'home': return <HomePage />;
    case 'explore': return <ExplorePage />;
    case 'profile': return <ProfilePage />;
    case 'favorites': return <FavoritesPage />;
    case 'album': return <AlbumPage albumId={route.id} />;
    case 'login': return <LoginPage />;
    case 'register': return <RegisterPage />;
    case 'super-admin': return <SuperAdmin />;
    case 'upload-dashboard': return <UploadDashboard />;
    case 'admin-album-new': return <AlbumForm />;
    case 'admin-album-edit': return <AlbumForm albumId={route.id} />;
    case 'admin-photos': return <PhotoManager albumId={route.albumId} />;
    default: return <HomePage />; 
  }
}
export default function App() {
  return (
    <AuthProvider>
      <RouterProvider>
        <Layout>
          <Router />
        </Layout>
      </RouterProvider>
    </AuthProvider>
  );
}