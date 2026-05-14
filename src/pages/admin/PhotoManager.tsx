import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from '../../lib/router';
import { useAuth } from '../../lib/auth';
import { ArrowLeft, Plus, Trash2, Upload, Link as LinkIcon, Loader2 } from 'lucide-react';
import Swal from 'sweetalert2'; // Import thư viện thông báo

const slugify = (text: string) => {
  return text.toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
};

const getFormattedDate = () => {
  const now = new Date();
  return `${now.getDate()}-${now.getMonth() + 1}-${now.getFullYear()}`;
};

export default function PhotoManager({ albumId }: { albumId: string }) {
  const { user } = useAuth();
  const { navigate } = useRouter();
  const [photos, setPhotos] = useState<any[]>([]);
  const [albumTitle, setAlbumTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploadMode, setUploadMode] = useState<'url' | 'file'>('file');
  const [newUrl, setNewUrl] = useState('');
  const [newCaption, setNewCaption] = useState('');
  const [adding, setAdding] = useState(false);

  // Cấu hình màu sắc SweetAlert2 theo theme AMOLED
  const getSwalConfig = () => ({
    background: document.documentElement.classList.contains('dark') ? '#000000' : '#fff',
    color: document.documentElement.classList.contains('dark') ? '#e5e7eb' : '#1c1917',
  });

  useEffect(() => {
    if (user) fetchData();
  }, [user, albumId]);

  async function fetchData() {
    const [albumRes, photosRes] = await Promise.all([
      supabase.from('albums').select('title').eq('id', albumId).maybeSingle(),
      supabase.from('photos').select('*').eq('album_id', albumId).order('created_at', { ascending: true }),
    ]);
    if (albumRes.data) setAlbumTitle(albumRes.data.title);
    if (photosRes.data) setPhotos(photosRes.data);
    setLoading(false);
  }

  async function uploadFile(file: File) {
    const fileExt = file.name.split('.').pop() || 'jpg';
    const dateStr = new Date().toLocaleDateString('vi-VN').replace(/\//g, '-');
    const safeEmail = user?.email?.replace(/[^a-zA-Z0-9@.-]/g, '_') || 'user';
    const fileName = `images/${safeEmail}-photo-${dateStr}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('gallery')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('gallery').getPublicUrl(fileName);
    return data.publicUrl;
  }

  async function addPhoto(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setAdding(true);

    try {
      let finalUrl = newUrl;
      if (uploadMode === 'file') {
        const fileInput = document.getElementById('file-upload') as HTMLInputElement;
        if (fileInput.files?.[0]) {
          finalUrl = await uploadFile(fileInput.files[0]);
        } else {
          throw new Error("Vui lòng chọn một file ảnh từ máy của bạn.");
        }
      }

      if (!finalUrl) throw new Error("Link ảnh không hợp lệ.");

      const { data, error: insError } = await supabase.from('photos').insert({
        album_id: albumId,
        url: finalUrl,
        caption: newCaption,
        created_by: user.id
      }).select().single();

      if (insError) throw insError;

      setPhotos(prev => [...prev, data]);
      setNewUrl('');
      setNewCaption('');
      if (uploadMode === 'file') (document.getElementById('file-upload') as HTMLInputElement).value = '';

      // THÔNG BÁO THÀNH CÔNG (TOAST)
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Đã thêm ảnh vào album',
        showConfirmButton: false,
        timer: 1500,
        ...getSwalConfig()
      });

    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Thất bại',
        text: err.message,
        ...getSwalConfig()
      });
    } finally {
      setAdding(false);
    }
  }

  async function deletePhoto(photoId: string) {
    const result = await Swal.fire({
      title: 'Xóa ảnh này?',
      text: "Dữ liệu ảnh sẽ bị xóa khỏi album và không thể khôi phục.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Xóa ngay',
      cancelButtonText: 'Hủy',
      confirmButtonColor: '#ef4444',
      ...getSwalConfig()
    });

    if (result.isConfirmed) {
      const { error } = await supabase.from('photos').delete().eq('id', photoId).eq('created_by', user?.id);
      
      if (!error) {
        setPhotos(prev => prev.filter(p => p.id !== photoId));
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Đã xóa ảnh',
          showConfirmButton: false,
          timer: 1500,
          ...getSwalConfig()
        });
      } else {
        Swal.fire({
          title: 'Lỗi!', 
          text: 'Không thể xóa ảnh lúc này.', 
          icon: 'error',
          ...getSwalConfig()
        });
      }
    }
  }

  if (loading) return (
    <div className="flex justify-center items-center min-h-[60vh] dark:bg-black transition-colors duration-300">
      <Loader2 className="animate-spin text-amber-500 dark:text-cyan-400 w-10 h-10"/>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 pb-32 transition-colors duration-300">
      <button 
        onClick={() => navigate({ page: 'upload-dashboard' })} 
        className="flex items-center gap-1.5 text-stone-500 mb-6 hover:text-stone-900 dark:text-gray-400 dark:hover:text-cyan-400 transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Quay lại Studio
      </button>

      <div className="mb-10">
        <h1 className="text-4xl font-black text-stone-900 dark:text-gray-200 tracking-tighter uppercase italic transition-colors">
          Quản lý hình ảnh
        </h1>
        <p className="text-stone-500 dark:text-gray-400 font-medium mt-1 transition-colors">
          Album: <span className="text-amber-500 dark:text-cyan-400">{albumTitle}</span> — Hiện có {photos.length} ảnh
        </p>
      </div>

      {/* Form thêm ảnh */}
      <div className="bg-white dark:bg-black border border-stone-200 dark:border-zinc-800 rounded-[2.5rem] p-8 mb-12 shadow-sm transition-colors">
        <div className="flex gap-2 mb-8 bg-stone-100 dark:bg-zinc-900 p-1.5 rounded-2xl w-fit transition-colors">
          <button 
            type="button" 
            onClick={() => setUploadMode('file')} 
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
              uploadMode === 'file' 
                ? 'bg-white dark:bg-cyan-400 shadow-sm text-stone-900 dark:text-black' 
                : 'text-stone-400 dark:text-gray-400 hover:text-stone-600 dark:hover:text-gray-300'
            }`}
          >
            Tải file
          </button>
          <button 
            type="button" 
            onClick={() => setUploadMode('url')} 
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
              uploadMode === 'url' 
                ? 'bg-white dark:bg-cyan-400 shadow-sm text-stone-900 dark:text-black' 
                : 'text-stone-400 dark:text-gray-400 hover:text-stone-600 dark:hover:text-gray-300'
            }`}
          >
            Link URL
          </button>
        </div>

        <form onSubmit={addPhoto} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {uploadMode === 'file' ? (
              <div className="relative group">
                <input 
                  id="file-upload" 
                  type="file" 
                  accept="image/*" 
                  className="w-full p-4 border border-stone-200 dark:border-zinc-800 rounded-2xl bg-stone-50 dark:bg-zinc-900 text-stone-900 dark:text-gray-200 text-sm outline-none focus:ring-2 focus:ring-amber-500/20 dark:focus:ring-cyan-400/40 transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-stone-200 file:text-stone-700 hover:file:bg-stone-300 dark:file:bg-black dark:file:text-gray-200 dark:hover:file:bg-zinc-800" 
                />
              </div>
            ) : (
              <input 
                type="url" 
                value={newUrl} 
                onChange={e => setNewUrl(e.target.value)} 
                placeholder="Nhập link ảnh (https://...)" 
                className="w-full p-4 border border-stone-200 dark:border-zinc-800 rounded-2xl bg-stone-50 dark:bg-zinc-900 text-stone-900 dark:text-gray-200 placeholder:text-stone-400 dark:placeholder:text-zinc-500 text-sm outline-none focus:ring-2 focus:ring-amber-500/20 dark:focus:ring-cyan-400/40 transition-colors" 
              />
            )}
            <input 
              type="text" 
              value={newCaption} 
              onChange={e => setNewCaption(e.target.value)} 
              placeholder="Ghi chú ảnh..." 
              className="w-full p-4 border border-stone-200 dark:border-zinc-800 rounded-2xl bg-stone-50 dark:bg-zinc-900 text-stone-900 dark:text-gray-200 placeholder:text-stone-400 dark:placeholder:text-zinc-500 text-sm outline-none focus:ring-2 focus:ring-amber-500/20 dark:focus:ring-cyan-400/40 transition-colors" 
            />
          </div>
          <button 
            disabled={adding} 
            type="submit" 
            className="w-full md:w-fit flex items-center justify-center gap-2 px-10 py-4 bg-stone-900 dark:bg-cyan-400 text-white dark:text-black rounded-2xl font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-stone-200 dark:shadow-cyan-400/20 disabled:opacity-50"
          >
            {adding ? <Loader2 className="w-5 h-5 animate-spin"/> : <Plus className="w-5 h-5"/>} 
            {adding ? 'Đang thực hiện...' : 'Thêm vào Album'}
          </button>
        </form>
      </div>

      {/* Grid ảnh */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {photos.map(photo => (
          <div key={photo.id} className="group relative aspect-square rounded-[2rem] overflow-hidden bg-stone-100 dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 shadow-sm transition-all duration-500 hover:shadow-2xl">
            <img src={photo.url} alt={photo.caption} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
            <div className="absolute inset-0 bg-black/40 dark:bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center backdrop-blur-[2px]">
              <button 
                onClick={() => deletePhoto(photo.id)} 
                className="p-4 bg-red-500 text-white rounded-[1.2rem] hover:bg-red-600 transition-all active:scale-90 shadow-2xl"
              >
                <Trash2 className="w-5 h-5"/>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}