import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import { 
  Users, 
  ShieldCheck, 
  UserX, 
  UserCheck, 
  Image as ImageIcon, 
  Trash2, 
  ExternalLink,
  ShieldAlert,
  X,
  Loader2,
  BarChart3,
  Heart
} from 'lucide-react';

function AlbumPhotosModal({ albumId, onClose }: { albumId: string, onClose: () => void }) {
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPhotos() {
      const { data } = await supabase.from('photos').select('*').eq('album_id', albumId).order('sort_order', { ascending: true });
      setPhotos(data || []);
      setLoading(false);
    }
    loadPhotos();
  }, [albumId]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="p-4 border-b flex justify-between items-center bg-stone-50">
          <h2 className="font-bold text-lg text-stone-800">Kiểm duyệt ảnh trong Album</h2>
          <button onClick={onClose} className="p-2 bg-stone-200 rounded-full hover:bg-stone-300 transition-colors text-stone-600">
            <X className="w-5 h-5"/>
          </button>
        </div>
        <div className="p-4 overflow-y-auto flex-1 bg-stone-100/50">
          {loading ? (
             <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-stone-400"/></div>
          ) : photos.length === 0 ? (
             <div className="text-center py-20 text-stone-500 bg-white rounded-2xl border border-dashed border-stone-200">
                <ImageIcon className="w-10 h-10 mx-auto text-stone-300 mb-2" />
                <p>Album này trống.</p>
             </div>
          ) : (
             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
               {photos.map(p => (
                 <div key={p.id} className="aspect-square bg-stone-200 rounded-xl overflow-hidden relative shadow-sm border border-stone-200">
                   <img src={p.url} className="w-full h-full object-cover" />
                 </div>
               ))}
             </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SuperAdmin() {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'content'>('users');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingAlbumId, setViewingAlbumId] = useState<string | null>(null);
  
  const [stats, setStats] = useState({ 
    totalUsers: 0,
    totalAlbums: 0, 
    totalPhotos: 0, 
    totalFavs: 0 
  });

  useEffect(() => {
    if (isAdmin) {
        fetchData();
        fetchStats();
    }
  }, [activeTab, isAdmin]);

  // Hàm lấy thống kê chuẩn bằng cách đếm rows
  async function fetchStats() {
    const { count: uCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    const { count: aCount } = await supabase.from('albums').select('*', { count: 'exact', head: true });
    const { count: pCount } = await supabase.from('photos').select('*', { count: 'exact', head: true });
    // Lấy tổng số dòng trong bảng favorites
    const { count: fCount } = await supabase.from('favorites').select('*', { count: 'exact', head: true });
    
    setStats({
        totalUsers: uCount || 0,
        totalAlbums: aCount || 0,
        totalPhotos: pCount || 0,
        totalFavs: fCount || 0
    });
  }

  async function fetchData() {
    setLoading(true);
    if (activeTab === 'users') {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      setData(profiles || []);
    } else {
      // Lấy album
      const { data: albums } = await supabase.from('albums').select('*').order('created_at', { ascending: false });
      // Lấy profile để map email
      const { data: profiles } = await supabase.from('profiles').select('id, email');
        
      if (albums && profiles) {
        const albumsWithProfiles = albums.map(album => {
          // QUAN TRỌNG: Tìm profile có id trùng với created_by của album
          const profile = profiles.find(p => p.id === album.created_by);
          return {
            ...album,
            displayEmail: profile ? profile.email : 'Không xác định'
          };
        });
        setData(albumsWithProfiles);
      } else {
        setData(albums || []);
      }
    }
    setLoading(false);
  }

  async function handleBanToggle(userId: string, currentStatus: boolean) {
    if (!confirm(`Xác nhận thay đổi trạng thái?`)) return;
    const { error } = await supabase.from('profiles').update({ is_banned: !currentStatus }).eq('id', userId);
    if (!error) setData(prev => prev.map(u => u.id === userId ? { ...u, is_banned: !currentStatus } : u));
  }

  async function handleRoleToggle(userId: string, currentRole: string) {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
    if (!error) setData(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
  }

  async function handleDeleteAlbum(albumId: string) {
    if (!confirm("Xóa album này?")) return;
    // Xóa liên kết trước
    const { data: photosInAlbum } = await supabase.from('photos').select('id').eq('album_id', albumId);
    if(photosInAlbum && photosInAlbum.length > 0) {
        const ids = photosInAlbum.map(p => p.id);
        await supabase.from('favorites').delete().in('photo_id', ids);
    }
    await supabase.from('photos').delete().eq('album_id', albumId);
    const { error } = await supabase.from('albums').delete().eq('id', albumId);
    
    if (!error) {
        setData(prev => prev.filter(a => a.id !== albumId));
        fetchStats();
    }
  }

  if (!isAdmin) return <div className="p-20 text-center">Truy cập bị từ chối.</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 pb-32">
      {viewingAlbumId && <AlbumPhotosModal albumId={viewingAlbumId} onClose={() => setViewingAlbumId(null)} />}
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-bold text-stone-900">Quản trị hệ thống</h1>
          <p className="text-stone-500 mt-1">Dành cho người quản lý tối cao</p>
        </div>

        <div className="flex bg-stone-100 p-1 rounded-2xl">
          <button onClick={() => setActiveTab('users')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold transition-all ${activeTab === 'users' ? 'bg-white shadow-sm text-stone-900' : 'text-stone-400'}`}>
            <Users className="w-4 h-4"/> Người dùng
          </button>
          <button onClick={() => setActiveTab('content')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold transition-all ${activeTab === 'content' ? 'bg-white shadow-sm text-stone-900' : 'text-stone-400'}`}>
            <ImageIcon className="w-4 h-4"/> Nội dung
          </button>
        </div>
      </div>

      <div className="mb-8">
        {activeTab === 'users' ? (
          <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm inline-flex items-center gap-4">
            <div className="w-12 h-12 bg-stone-100 rounded-2xl flex items-center justify-center text-stone-600"><Users/></div>
            <div>
              <p className="text-xs font-bold text-stone-400 uppercase">Tổng người dùng</p>
              <p className="text-2xl font-bold text-stone-900">{stats.totalUsers}</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-stone-100 rounded-2xl flex items-center justify-center text-stone-600"><BarChart3/></div>
                <div>
                    <p className="text-xs font-bold text-stone-400 uppercase">Tổng Album</p>
                    <p className="text-2xl font-bold text-stone-900">{stats.totalAlbums}</p>
                </div>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-stone-100 rounded-2xl flex items-center justify-center text-stone-600"><ImageIcon/></div>
                <div>
                    <p className="text-xs font-bold text-stone-400 uppercase">Tổng ảnh</p>
                    <p className="text-2xl font-bold text-stone-900">{stats.totalPhotos}</p>
                </div>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-500"><Heart/></div>
                <div>
                    <p className="text-xs font-bold text-stone-400 uppercase">Tổng lượt yêu thích</p>
                    <p className="text-2xl font-bold text-stone-900">{stats.totalFavs}</p>
                </div>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-stone-200"/></div>
      ) : activeTab === 'users' ? (
        <div className="bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-100">
                <th className="px-6 py-4 text-xs font-bold text-stone-400 uppercase">Thông tin</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-400 uppercase">Trạng thái</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-400 uppercase text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {data.map((u) => (
                <tr key={u.id} className={u.is_banned ? 'bg-red-50/30' : ''}>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-stone-900">{u.email}</p>
                    <p className="text-[10px] text-stone-400 font-mono">{u.id}</p>
                  </td>
                  <td className="px-6 py-4">
                    {u.is_banned ? <span className="text-red-600 text-xs font-bold">Đã khóa</span> : <span className="text-emerald-600 text-xs font-bold">Hoạt động</span>}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleBanToggle(u.id, u.is_banned)} className={`p-2 rounded-lg ${u.is_banned ? 'text-emerald-600' : 'text-red-400'}`}>
                      {u.is_banned ? <UserCheck className="w-5 h-5"/> : <UserX className="w-5 h-5"/>}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.map(album => (
            <div key={album.id} className="bg-white border border-stone-200 p-4 rounded-2xl flex items-center gap-4 hover:shadow-md transition-all">
              <img src={album.cover_url || 'https://via.placeholder.com/150'} className="w-20 h-20 rounded-xl object-cover border border-stone-100" />
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-stone-900 truncate">{album.title}</h3>
                {/* HIỂN THỊ EMAIL TẠI ĐÂY */}
                <p className="text-xs text-stone-500 mt-0.5 font-medium">Bởi: {album.displayEmail}</p>
                {!album.is_published && <span className="text-[10px] bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded font-bold uppercase mt-1 inline-block">Riêng tư</span>}
              </div>
              <div className="flex gap-2">
                {/* NÚT ĐỎ MỞ POPUP */}
                <button onClick={() => setViewingAlbumId(album.id)} className="p-2.5 bg-red-50 text-red-500 hover:bg-red-100 rounded-xl transition-colors" title="Xem ảnh con"><ExternalLink className="w-5 h-5"/></button>
                {/* NÚT THÙNG RÁC */}
                <button onClick={() => handleDeleteAlbum(album.id)} className="p-2.5 bg-stone-50 text-stone-400 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors" title="Xóa"><Trash2 className="w-5 h-5"/></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}