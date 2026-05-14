import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { useRouter } from '../lib/router';
import { Images, Plus, Pencil, Trash2, Globe, Lock, Loader2, Search } from 'lucide-react';
import Swal from 'sweetalert2'; // Thư viện thông báo chuyên nghiệp

export default function UploadDashboard() {
  const { user } = useAuth();
  const { navigate } = useRouter();
  const [albums, setAlbums] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user) fetchMyAlbums();
  }, [user]);

  async function fetchMyAlbums() {
    const { data } = await supabase
      .from('albums')
      .select('*, photos(count)')
      .eq('created_by', user?.id)
      .order('created_at', { ascending: false });

    if (data) setAlbums(data);
    setLoading(false);
  }

  // HÀM XÓA ALBUM CHUYÊN NGHIỆP
  async function handleDeleteAlbum(albumId: string, title: string) {
    const result = await Swal.fire({
      title: 'Xác nhận xóa?',
      text: `Bạn có chắc chắn muốn xóa album "${title}"? Tất cả ảnh bên trong cũng sẽ bị mất!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444', // Red 500
      cancelButtonColor: '#78716c', // Stone 500
      confirmButtonText: 'Đồng ý xóa',
      cancelButtonText: 'Hủy',
      background: document.documentElement.classList.contains('dark') ? '#1c1917' : '#fff',
      color: document.documentElement.classList.contains('dark') ? '#fff' : '#1c1917',
    });

    if (result.isConfirmed) {
      try {
        const { error } = await supabase
          .from('albums')
          .delete()
          .eq('id', albumId)
          .eq('created_by', user?.id);

        if (error) throw error;

        // Cập nhật state để biến mất khỏi màn hình
        setAlbums(prev => prev.filter(a => a.id !== albumId));

        // Thông báo thành công dạng Toast
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Đã xóa album thành công',
          showConfirmButton: false,
          timer: 2000,
          background: document.documentElement.classList.contains('dark') ? '#1c1917' : '#fff',
          color: document.documentElement.classList.contains('dark') ? '#fff' : '#1c1917',
        });
      } catch (err: any) {
        Swal.fire('Lỗi!', err.message, 'error');
      }
    }
  }

  const filtered = albums.filter(a => a.title.toLowerCase().includes(searchTerm.toLowerCase()));

  if (loading) return (
    <div className="flex justify-center items-center min-h-[60vh] dark:bg-stone-950">
      <Loader2 className="animate-spin text-amber-500 w-12 h-12" />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 pb-32">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
        <div>
          <h1 className="text-4xl font-black text-stone-900 dark:text-white tracking-tight">Studio của tôi</h1>
          <p className="text-stone-500 dark:text-stone-400 mt-2">Quản lý không gian sáng tạo cá nhân</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="relative flex-1 sm:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input 
              type="text"
              placeholder="Tìm album..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl outline-none focus:ring-2 focus:ring-amber-500/20 dark:text-white transition-all shadow-sm"
            />
          </div>

          <button 
            onClick={() => navigate({ page: 'admin-album-new' })} 
            className="flex items-center justify-center gap-2 px-8 py-3 bg-stone-900 dark:bg-amber-500 text-white rounded-2xl font-bold hover:scale-105 active:scale-95 transition-all shadow-xl"
          >
            <Plus className="w-5 h-5" /> Tạo Album
          </button>
        </div>
      </div>

      {/* Grid Danh sách Album */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filtered.map((album) => (
          <div key={album.id} className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-[2.5rem] overflow-hidden hover:shadow-2xl transition-all group">
            <div className="aspect-video bg-stone-100 dark:bg-stone-800 relative overflow-hidden">
              {album.cover_url ? (
                <img src={album.cover_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-stone-300 dark:text-stone-700"><Images className="w-12 h-12" /></div>
              )}
              <div className="absolute top-4 left-4 flex gap-2">
                {album.is_published ? (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/90 backdrop-blur text-white text-[10px] font-black uppercase rounded-full shadow-lg"><Globe className="w-3 h-3"/> Công khai</span>
                ) : (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-500/90 backdrop-blur text-white text-[10px] font-black uppercase rounded-full shadow-lg"><Lock className="w-3 h-3"/> Riêng tư</span>
                )}
              </div>
            </div>

            <div className="p-6">
              <h3 className="font-bold text-stone-900 dark:text-white text-xl truncate">{album.title}</h3>
              <p className="text-[10px] text-stone-400 mt-2 uppercase font-black tracking-widest leading-none">
                {album.photos?.[0]?.count || 0} Tác phẩm • {new Date(album.created_at).toLocaleDateString('vi-VN')}
              </p>
              
              <div className="flex gap-3 mt-8">
                <button 
                  onClick={() => navigate({ page: 'admin-photos', albumId: album.id })}
                  className="flex-1 py-3 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-black uppercase rounded-xl hover:bg-stone-900 hover:text-white dark:hover:bg-amber-500 transition-all"
                >
                  Quản lý ảnh
                </button>
                
                <button 
                  onClick={() => navigate({ page: 'admin-album-edit', id: album.id })} 
                  className="p-3 bg-stone-50 dark:bg-stone-800 text-stone-400 hover:text-stone-900 dark:hover:text-white rounded-xl transition-all"
                  title="Sửa album"
                >
                  <Pencil className="w-4 h-4"/>
                </button>

                {/* NÚT XÓA ĐÃ GẮN SỰ KIỆN */}
                <button 
                  onClick={() => handleDeleteAlbum(album.id, album.title)}
                  className="p-3 bg-stone-50 dark:bg-stone-800 text-stone-400 hover:text-red-600 dark:hover:text-red-500 rounded-xl transition-all active:scale-90"
                  title="Xóa Album"
                >
                  <Trash2 className="w-5 h-5"/>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20 border-2 border-dashed border-stone-200 dark:border-stone-800 rounded-[2.5rem]">
          <p className="text-stone-400 font-medium">Không tìm thấy album nào phù hợp.</p>
        </div>
      )}
    </div>
  );
}