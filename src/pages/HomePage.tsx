import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from '../lib/router';
import { Calendar, Images } from 'lucide-react';

interface Album {
  id: string;
  title: string;
  description: string;
  cover_url: string;
  created_at: string;
  photo_count: number;
}

export default function HomePage() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const { navigate } = useRouter();

  useEffect(() => {
    fetchAlbums();
  }, []);

  async function fetchAlbums() {
    try {
      const { data, error } = await supabase
        .from('albums')
        .select('id, title, description, cover_url, created_at')
        .eq('is_published', true)
        .order('sort_order', { ascending: true });

      // Nếu lỗi hoặc không có data, thoát an toàn
      if (error || !data) {
        setAlbums([]);
        return;
      }

      // FIX LỖI KẸT LOADING: Chặn trường hợp mảng data rỗng []
      // Nếu không chặn ở đây, Supabase hàm .in('album_id', []) sẽ quăng lỗi làm sập luồng
      if (data.length === 0) {
        setAlbums([]);
        return;
      }

      const albumIds = data.map((a) => a.id);
      
      const { data: photoCounts, error: countsError } = await supabase
        .from('photos')
        .select('album_id')
        .in('album_id', albumIds);

      if (countsError) throw countsError;

      const countMap: Record<string, number> = {};
      (photoCounts || []).forEach((p) => {
        countMap[p.album_id] = (countMap[p.album_id] || 0) + 1;
      });

      const enriched = data.map((album) => ({
        ...album,
        photo_count: countMap[album.id] || 0,
      }));

      setAlbums(enriched);
    } catch (err) {
      console.error("Lỗi tải danh sách album:", err);
    } finally {
      // ĐẢM BẢO LUÔN TẮT LOADING ĐỂ MỞ KHÓA MÀN HÌNH
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 dark:bg-black transition-colors duration-300">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="aspect-[4/3] bg-stone-200 dark:bg-zinc-900 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="dark:bg-black min-h-screen transition-colors duration-300">
      {/* Hero Section */}
      <section className="relative bg-stone-900 dark:bg-black text-white overflow-hidden">
        {/* Đổi dark:via-gray-900 thành dark:via-black để đảm bảo đen tuyệt đối AMOLED */}
        <div className="absolute inset-0 bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 dark:from-black dark:via-black dark:to-black" />
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(255,255,255,0.15) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(255,255,255,0.1) 0%, transparent 50%)',
        }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <div className="max-w-2xl">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-[1.1] dark:text-gray-200">
              Khoảnh khắc đẹp,<br />
              <span className="text-amber-400 dark:text-cyan-400">Trình bày tinh tế</span>
            </h1>
            <p className="mt-5 text-lg text-stone-300 dark:text-gray-400 leading-relaxed">
              Khám phá bộ sưu tập ảnh tuyệt đẹp được tuyển chọn kỹ lưỡng của chúng tôi. Mỗi album kể một câu chuyện độc đáo thông qua những khoảnh khắc được ghi lại cẩn thận.
            </p>
          </div>
        </div>
      </section>

      {/* Albums Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-2xl font-bold text-stone-900 dark:text-gray-200">Bộ sưu tập</h2>
            <p className="text-stone-500 dark:text-gray-400 mt-1">{albums.length} album ảnh</p>
          </div>
        </div>

        {albums.length === 0 ? (
          <div className="text-center py-20">
            <Images className="w-12 h-12 text-stone-300 dark:text-gray-700 mx-auto mb-4" />
            <p className="text-stone-400 dark:text-gray-500 text-lg">Chưa có album nào được xuất bản.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {albums.map((album) => (
              <button
                key={album.id}
                onClick={() => navigate({ page: 'album', id: album.id })}
                className="group text-left"
              >
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-stone-200 dark:bg-black dark:border dark:border-zinc-800 shadow-sm dark:shadow-none">
                  {album.cover_url ? (
                    <img
                      src={album.cover_url}
                      alt={album.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-stone-200 to-stone-300 dark:from-zinc-900 dark:to-black">
                      <Images className="w-10 h-10 text-stone-400 dark:text-gray-700" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-2 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                    <span className="text-white/80 dark:text-gray-200 text-xs font-medium">Xem Album</span>
                  </div>
                </div>
                <div className="mt-3.5 px-1">
                  <h3 className="font-semibold text-stone-900 dark:text-gray-200 group-hover:text-amber-700 dark:group-hover:text-cyan-400 transition-colors">{album.title}</h3>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-stone-400 dark:text-gray-500">
                    <span className="flex items-center gap-1">
                      <Images className="w-3 h-3" />
                      {album.photo_count} ảnh
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(album.created_at).toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                  {album.description && (
                    <p className="mt-1.5 text-sm text-stone-500 dark:text-gray-400 line-clamp-2">{album.description}</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}