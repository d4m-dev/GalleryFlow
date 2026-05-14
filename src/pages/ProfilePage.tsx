import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { useRouter } from '../lib/router';
import { 
  User, ShieldCheck, Image as ImageIcon, 
  Heart, Folder, LogOut, BarChart3, 
  Settings, Zap, Crown, Mail, Calendar, Sun, Moon
} from 'lucide-react';
import Swal from 'sweetalert2';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../lib/cropImage';

export default function ProfilePage() {
  const { user, isAdmin, signOut } = useAuth();
  const { navigate } = useRouter();
  const [stats, setStats] = useState({
    albums: 0,
    photos: 0,
    favorites: 0
  });

  // Modal Settings state
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAvatar, setNewAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') === 'dark');

  // Cropper states
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [showCropper, setShowCropper] = useState(false);

  useEffect(() => {
    if (user) fetchStats();
  }, [user]);

  async function fetchStats() {
    try {
      // Lấy số liệu thống kê cá nhân
      const [albumsRes, photosRes, favsRes] = await Promise.all([
        supabase.from('albums').select('id', { count: 'exact' }).eq('created_by', user?.id),
        supabase.from('photos').select('id', { count: 'exact' }).eq('created_by', user?.id),
        supabase.from('favorites').select('id', { count: 'exact' }).eq('user_id', user?.id),
      ]);

      setStats({
        albums: albumsRes.count || 0,
        photos: photosRes.count || 0,
        favorites: favsRes.count || 0
      });
    } catch (error) {
      console.error("Lỗi lấy dữ liệu Profile:", error);
    }
  }

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: 'Đăng xuất?',
      text: "Bạn có chắc chắn muốn rời khỏi phiên làm việc này?",
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Đăng xuất',
      cancelButtonText: 'Ở lại',
      confirmButtonColor: '#ef4444',
      background: document.documentElement.classList.contains('dark') ? '#000000' : '#fff',
      color: document.documentElement.classList.contains('dark') ? '#e5e7eb' : '#1c1917',
    });

    if (result.isConfirmed) {
      await signOut();
      navigate({ page: 'home' });
    }
  };

  const toggleTheme = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    if (newDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const openSettings = () => {
    setNewName(user?.user_metadata?.full_name || '');
    setNewAvatar(null);
    setAvatarPreview(null);
    setShowSettingsModal(true);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setImageToCrop(URL.createObjectURL(file));
      setShowCropper(true);
    }
  };

  const handleCropComplete = async () => {
    if (imageToCrop && croppedAreaPixels) {
      try {
        const croppedImage = await getCroppedImg(imageToCrop, croppedAreaPixels);
        if (croppedImage) {
          setNewAvatar(croppedImage);
          setAvatarPreview(URL.createObjectURL(croppedImage));
          setShowCropper(false);
        }
      } catch (e) {
        console.error(e);
        Swal.fire('Lỗi', 'Không thể cắt ảnh', 'error');
      }
    }
  };

  const saveSettings = async () => {
    setIsSavingSettings(true);
    try {
      let avatarUrl = user?.user_metadata?.avatar_url;
      if (newAvatar) {
        const fileExt = newAvatar.name.split('.').pop() || 'jpg';
        
        const dateStr = new Date().toLocaleDateString('vi-VN').replace(/\//g, '-');
        
        const safeEmail = user?.email?.replace(/[^a-zA-Z0-9@.-]/g, '_') || 'user';
        const fileName = `avatar/${safeEmail}-avatar-${dateStr}-${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('gallery')
          .upload(fileName, newAvatar, { upsert: true });
        
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from('gallery').getPublicUrl(fileName);
        avatarUrl = data.publicUrl;
      }

      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: newName,
          avatar_url: avatarUrl,
        }
      });
      if (error) throw error;
      
      setShowSettingsModal(false);
      setNewAvatar(null);
      setAvatarPreview(null);
      setIsSavingSettings(false);

      Swal.fire({
        title: 'Thành công',
        text: 'Đã cập nhật thông tin cá nhân',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
        background: document.documentElement.classList.contains('dark') ? '#000000' : '#fff',
        color: document.documentElement.classList.contains('dark') ? '#e5e7eb' : '#1c1917',
      });
    } catch (e: any) {
      console.error(e);
      Swal.fire('Lỗi', e.message || 'Không thể lưu cài đặt', 'error');
      setIsSavingSettings(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 pb-32 transition-colors duration-300">
      {/* HEADER: USER INFO */}
      <div className="relative mb-12 p-8 md:p-12 rounded-[3rem] bg-white dark:bg-black border border-stone-200 dark:border-zinc-800 overflow-hidden shadow-sm transition-colors">
        {isAdmin && (
          <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
            <ShieldCheck className="w-64 h-64 text-amber-500" />
          </div>
        )}

        <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
          <div className="relative">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-[2.5rem] bg-stone-100 dark:bg-zinc-900 flex items-center justify-center border-4 border-white dark:border-zinc-900 shadow-xl overflow-hidden transition-colors">
              {user?.user_metadata?.avatar_url ? (
                <img src={user.user_metadata.avatar_url} className="w-full h-full object-cover" />
              ) : (
                <User className="w-16 h-16 text-stone-300 dark:text-gray-600" />
              )}
            </div>
            {isAdmin && (
              <div className="absolute -bottom-2 -right-2 bg-amber-500 text-white p-2.5 rounded-2xl shadow-lg ring-4 ring-white dark:ring-black transition-colors">
                <Crown className="w-5 h-5" />
              </div>
            )}
          </div>

          <div className="text-center md:text-left flex-1">
            <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
              <h1 className="text-4xl font-black text-stone-900 dark:text-gray-200 tracking-tighter transition-colors">
                {user?.user_metadata?.full_name || 'Người dùng mới'}
              </h1>
              {isAdmin && (
                <span className="inline-flex items-center gap-1.5 px-4 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-500 text-[10px] font-black uppercase tracking-widest rounded-full border border-amber-500/20">
                  <Zap className="w-3 h-3 fill-current" /> Quản trị viên
                </span>
              )}
            </div>
            <p className="flex items-center justify-center md:justify-start gap-2 text-stone-500 dark:text-gray-400 font-medium italic transition-colors">
              <Mail className="w-4 h-4" /> {user?.email}
            </p>
            <p className="flex items-center justify-center md:justify-start gap-2 text-stone-400 dark:text-zinc-500 text-xs mt-1 uppercase font-bold tracking-widest transition-colors">
              <Calendar className="w-3 h-3" /> Thành viên từ: {new Date(user?.created_at || '').toLocaleDateString('vi-VN')}
            </p>
          </div>

          <div className="flex gap-3">
            <button 
              onClick={openSettings} 
              className="p-4 bg-stone-100 dark:bg-zinc-900 text-stone-600 dark:text-gray-300 rounded-2xl hover:bg-stone-900 hover:text-white dark:hover:bg-cyan-400 dark:hover:text-black transition-all"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button 
              onClick={handleLogout}
              className="p-4 bg-red-50 dark:bg-red-950/30 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="p-8 bg-white dark:bg-black border border-stone-200 dark:border-zinc-800 rounded-[2.5rem] shadow-sm transition-colors">
          <Folder className="w-8 h-8 text-amber-500 mb-4" />
          <div className="text-3xl font-black text-stone-900 dark:text-gray-200">{stats.albums}</div>
          <div className="text-stone-500 dark:text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Album đã tạo</div>
        </div>
        <div className="p-8 bg-white dark:bg-black border border-stone-200 dark:border-zinc-800 rounded-[2.5rem] shadow-sm transition-colors">
          <ImageIcon className="w-8 h-8 text-blue-500 mb-4" />
          <div className="text-3xl font-black text-stone-900 dark:text-gray-200">{stats.photos}</div>
          <div className="text-stone-500 dark:text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Ảnh đã tải lên</div>
        </div>
        <div className="p-8 bg-white dark:bg-black border border-stone-200 dark:border-zinc-800 rounded-[2.5rem] shadow-sm transition-colors">
          <Heart className="w-8 h-8 text-red-500 mb-4" />
          <div className="text-3xl font-black text-stone-900 dark:text-gray-200">{stats.favorites}</div>
          <div className="text-stone-500 dark:text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Ảnh yêu thích</div>
        </div>
      </div>

      {/* ADMIN DASHBOARD (Chỉ hiện nếu là admin) */}
      {isAdmin && (
        <div className="mt-12 animate-fadeIn">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-px flex-1 bg-stone-200 dark:bg-zinc-800 transition-colors"></div>
            <h2 className="text-xs font-black text-amber-500 uppercase tracking-[0.3em] flex items-center gap-2">
              <BarChart3 className="w-4 h-4" /> Admin Control Center
            </h2>
            <div className="h-px flex-1 bg-stone-200 dark:bg-zinc-800 transition-colors"></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Quick Actions */}
            <div className="p-10 bg-stone-900 dark:bg-black text-white dark:text-gray-200 rounded-[3rem] shadow-2xl shadow-amber-500/10 border border-amber-500/20 transition-colors">
              <h3 className="text-2xl font-bold mb-6 italic tracking-tight">Hành động nhanh</h3>
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => navigate({ page: 'admin-album-new' })} className="p-6 bg-white/5 dark:bg-zinc-900/50 hover:bg-white/10 dark:hover:bg-cyan-400/10 rounded-3xl border border-white/10 dark:border-zinc-800 transition-all text-left group">
                  <div className="w-6 h-6 mb-3 text-amber-500 dark:text-cyan-400 group-hover:scale-125 transition-transform flex items-center justify-center font-bold text-xl">+</div>
                  <div className="font-bold text-sm">Tạo Album mới</div>
                </button>
                <button onClick={() => navigate({ page: 'super-admin' })} className="p-6 bg-white/5 dark:bg-zinc-900/50 hover:bg-white/10 dark:hover:bg-cyan-400/10 rounded-3xl border border-white/10 dark:border-zinc-800 transition-all text-left group">
                  <ShieldCheck className="w-6 h-6 text-blue-500 dark:text-cyan-400 mb-3 group-hover:scale-125 transition-transform" />
                  <div className="font-bold text-sm">Quản trị hệ thống</div>
                </button>
              </div>
            </div>

            {/* System Status */}
            <div className="p-10 bg-white dark:bg-black border border-stone-200 dark:border-zinc-800 rounded-[3rem] shadow-sm transition-colors">
              <h3 className="text-2xl font-bold mb-6 italic tracking-tight dark:text-gray-200">Tình trạng hệ thống</h3>
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <span className="text-stone-500 dark:text-gray-400 text-sm">Database Connection</span>
                  <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-black rounded-lg border border-emerald-500/20 italic uppercase">Ổn định</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-stone-500 dark:text-gray-400 text-sm">Storage Bucket (Gallery)</span>
                  <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-black rounded-lg border border-emerald-500/20 italic uppercase">Hoạt động</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-stone-500 dark:text-gray-400 text-sm">API Gemini AI</span>
                  <span className="px-3 py-1 bg-blue-500/10 text-blue-500 dark:text-cyan-400 text-[10px] font-black rounded-lg border border-blue-500/20 dark:border-cyan-400/20 italic uppercase">Sẵn sàng</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CÀI ĐẶT */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-md p-6 rounded-[2rem] shadow-2xl animate-fadeIn border border-transparent dark:border-zinc-800 transition-colors">
            <h3 className="text-2xl font-black mb-6 dark:text-gray-200">Cài đặt</h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-stone-600 dark:text-gray-300 mb-3">Ảnh đại diện</label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 shrink-0 rounded-full bg-stone-100 dark:bg-black overflow-hidden border-2 border-stone-200 dark:border-zinc-700 shadow-sm transition-colors">
                    {(avatarPreview || user?.user_metadata?.avatar_url) ? (
                      <img src={avatarPreview || user?.user_metadata?.avatar_url} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-full h-full p-3 text-stone-300 dark:text-gray-600" />
                    )}
                  </div>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={onFileChange}
                    className="flex-1 min-w-0 text-sm text-stone-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-stone-100 file:text-stone-700 hover:file:bg-stone-200 dark:file:bg-zinc-800 dark:file:text-gray-200 dark:hover:file:bg-zinc-700 transition-all cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-stone-600 dark:text-gray-300 mb-1">Tên hiển thị</label>
                <input 
                  type="text" 
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-zinc-700 bg-white dark:bg-black text-stone-900 dark:text-gray-200 focus:ring-2 focus:ring-amber-500 dark:focus:ring-cyan-400 outline-none transition-all"
                  placeholder="Nhập tên của bạn"
                />
              </div>

              <div className="flex items-center justify-between py-2">
                <span className="text-sm font-bold text-stone-600 dark:text-gray-300">Giao diện (Sáng/Tối)</span>
                <button onClick={toggleTheme} className="p-2 rounded-xl bg-stone-100 dark:bg-black text-stone-600 dark:text-cyan-400 hover:bg-stone-200 dark:hover:bg-zinc-800 transition-all">
                  {isDark ? <Moon className="w-5 h-5 text-cyan-400" /> : <Sun className="w-5 h-5 text-stone-600" />}
                </button>
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button 
                onClick={() => setShowSettingsModal(false)}
                className="px-5 py-2 rounded-xl text-stone-500 dark:text-gray-400 font-bold hover:bg-stone-100 dark:hover:bg-zinc-800 dark:hover:text-gray-200 transition-all"
              >
                Đóng
              </button>
              <button 
                onClick={saveSettings}
                disabled={isSavingSettings}
                className="px-5 py-2 rounded-xl bg-stone-900 dark:bg-cyan-400 text-white dark:text-black font-bold hover:opacity-90 dark:hover:bg-cyan-300 disabled:opacity-50 transition-all"
              >
                {isSavingSettings ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CROP ẢNH */}
      {showCropper && imageToCrop && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-stone-900 dark:bg-zinc-900 w-full max-w-lg p-6 rounded-[2rem] shadow-2xl flex flex-col border border-stone-800 dark:border-zinc-800 transition-colors">
            <h3 className="text-xl font-bold mb-4 text-white dark:text-gray-200">Cắt ảnh đại diện (Tỷ lệ 1:1)</h3>
            <div className="relative w-full h-[400px] bg-black rounded-xl overflow-hidden mb-6">
              <Cropper
                image={imageToCrop}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onCropComplete={(_, croppedAreaPixels) => setCroppedAreaPixels(croppedAreaPixels)}
                onZoomChange={setZoom}
              />
            </div>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => {
                  setShowCropper(false);
                  setImageToCrop(null);
                }}
                className="px-5 py-2 rounded-xl text-stone-400 dark:text-gray-400 hover:text-white dark:hover:text-gray-200 transition-all font-bold"
              >
                Hủy
              </button>
              <button 
                onClick={handleCropComplete}
                className="px-5 py-2 rounded-xl bg-amber-500 dark:bg-cyan-400 text-stone-900 dark:text-black font-bold hover:bg-amber-400 dark:hover:bg-cyan-300 transition-all shadow-lg shadow-amber-500/20 dark:shadow-cyan-400/20"
              >
                Cắt ảnh
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}