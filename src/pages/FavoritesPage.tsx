import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { Heart, Images, Loader2, LogIn } from 'lucide-react';
import FavoriteButton from '../components/FavoriteButton';
import { useRouter } from '../lib/router';

export default function FavoritesPage() {
  const { user } = useAuth();
  const { navigate } = useRouter();
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Nếu user đã load xong (có thể là null hoặc object)
    if (user !== undefined) {
      if (user) {
        fetchFavorites();
      } else {
        setLoading(false); // Ngừng load nếu user không đăng nhập
      }
    }
  }, [user]);

  async function fetchFavorites() {
    try {
      setLoading(true);
      
      // Sử dụng !inner để đảm bảo chỉ lấy những bản ghi có ảnh tồn tại
      const { data, error } = await supabase
        .from('favorites')
        .select(`
          photo_id,
          photos!inner (
            id,
            url,
            caption,
            album_id,
            albums!inner (
              title
            )
          )
        `)
        .eq('user_id', user?.id);

      if (error) {
        console.error("Chi tiết lỗi Supabase:", error);
        throw error;
      }

      console.log("Dữ liệu thô từ Supabase:", data); // Kiểm tra log này ở F12

      if (data) {
        const favoritePhotos = data.map((item: any) => ({
          ...item.photos,
          // Đảm bảo lấy được title album từ object lồng nhau
          album_title: item.photos.albums?.title || 'Không rõ album'
        }));
        
        setPhotos(favoritePhotos);
      }
    } catch (error: any) {
      console.error("Lỗi lấy danh sách yêu thích:", error.message);
    } finally {
      setLoading(false);
    }
  }

  // Trường hợp đang chờ check thông tin user
  if (loading) return (
    <div className="flex justify-center items-center min-h-[60vh] dark:bg-stone-950">
      <Loader2 className="animate-spin text-red-500 w-12 h-12" />
    </div>
  );

  // Trường hợp chưa đăng nhập
  if (!user) return (
    <div className="max-w-7xl mx-auto px-4 py-20 text-center dark:bg-stone-950 min-h-screen">
      <div className="bg-white dark:bg-stone-900 rounded-[3rem] p-12 border border-stone-200 dark:border-stone-800 shadow-xl inline-block">
        <LogIn className="w-16 h-16 text-stone-300 mx-auto mb-6" />
        <h2 className="text-2xl font-black text-stone-900 dark:text-white mb-2">Yêu cầu đăng nhập</h2>
        <p className="text-stone-500 dark:text-stone-400 mb-8">Vui lòng đăng nhập để xem những khoảnh khắc bạn đã yêu thích.</p>
        <button 
          onClick={() => navigate({ page: 'login' })}
          className="px-8 py-3 bg-stone-900 dark:bg-red-500 text-white rounded-2xl font-bold hover:scale-105 transition-all"
        >
          Đăng nhập ngay
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 pb-32">
      <div className="mb-12">
        <h1 className="text-5xl font-black text-stone-900 dark:text-white tracking-tighter flex items-center gap-4 italic uppercase">
          Yêu thích <Heart className="fill-red-500 text-red-500 w-10 h-10 animate-pulse" />
        </h1>
        <p className="text-stone-500 dark:text-stone-400 mt-4 text-lg font-medium">Bộ sưu tập những khoảnh khắc quý giá của bạn.</p>
      </div>

      {photos.length === 0 ? (
        <div className="text-center py-24 bg-white dark:bg-stone-900 rounded-[3rem] border border-stone-200 dark:border-stone-800 shadow-sm">
          <Images className="w-20 h-20 text-stone-200 dark:text-stone-800 mx-auto mb-6" />
          <p className="text-stone-400 text-xl font-bold tracking-tight">Danh sách yêu thích đang trống</p>
          <button 
            onClick={() => navigate({ page: 'explore' })}
            className="mt-6 text-red-500 font-black uppercase text-sm tracking-widest hover:underline"
          >
            Đi khám phá ngay
          </button>
        </div>
      ) : (
        <div className="columns-2 md:columns-3 lg:columns-4 gap-6 space-y-6">
          {photos.map((photo) => (
            <div key={photo.id} className="relative group break-inside-avoid rounded-[2.5rem] overflow-hidden bg-stone-100 dark:bg-stone-800 shadow-sm hover:shadow-2xl transition-all duration-500">
              <img src={photo.url} alt={photo.caption} className="w-full h-auto block transition-transform duration-700 group-hover:scale-110" />
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all p-8 flex flex-col justify-between">
                <div className="flex justify-end transform translate-y-4 group-hover:translate-y-0 transition-transform">
                  <FavoriteButton photoId={photo.id} />
                </div>
                <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform delay-75">
                  <p className="text-white font-black text-lg line-clamp-2 leading-tight">{photo.caption || 'Khoảnh khắc'}</p>
                  <p className="text-red-400 text-[10px] uppercase font-black tracking-[0.2em] mt-3 flex items-center gap-2">
                    <span className="w-4 h-px bg-red-500"></span> {photo.albums?.title}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}