import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from '../../lib/router';
import { useAuth } from '../../lib/auth';
import { ArrowLeft, Save, Loader2, Image as ImageIcon, AlertCircle, Upload, Link as LinkIcon } from 'lucide-react';

// Hàm dọn dẹp tên file để không bị lỗi tiếng Việt và khoảng trắng
const slugify = (text: string) => {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '');
};

const getFormattedDate = () => {
  const now = new Date();
  return `${now.getDate()}-${now.getMonth() + 1}-${now.getFullYear()}`;
};

export default function AlbumForm({ albumId }: { albumId?: string }) {
  const { user } = useAuth();
  const { navigate } = useRouter();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  
  const [uploadMode, setUploadMode] = useState<'url' | 'file'>('file');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (albumId) fetchAlbum();
  }, [albumId]);

  async function fetchAlbum() {
    setLoading(true);
    const { data, error } = await supabase.from('albums').select('*').eq('id', albumId).single();
    if (data) {
      setTitle(data.title);
      setDescription(data.description || '');
      setCoverUrl(data.cover_url || '');
      setPreviewUrl(data.cover_url || '');
      setIsPublished(data.is_published);
      if (data.cover_url) setUploadMode('url');
    }
    setLoading(false);
  }

  // Logic Đặt tên file Album Cover
  async function uploadCoverImage(file: File) {
    const fileExt = file.name.split('.').pop() || 'jpg';
    const dateStr = new Date().toLocaleDateString('vi-VN').replace(/\//g, '-');
    const safeEmail = user?.email?.replace(/[^a-zA-Z0-9@.-]/g, '_') || 'user';
    const fileName = `covers/${safeEmail}-cover-${dateStr}-${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('gallery')
      .upload(fileName, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('gallery').getPublicUrl(fileName);
    return data.publicUrl;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setError(null);

    try {
      let finalCoverUrl = coverUrl;
      if (uploadMode === 'file' && selectedFile) {
        finalCoverUrl = await uploadCoverImage(selectedFile);
      }

      const payload = {
        title: title.trim(),
        description: description.trim(),
        cover_url: finalCoverUrl,
        is_published: isPublished,
        created_by: user.id,
        updated_at: new Date().toISOString(),
      };

      const { error: dbError } = albumId 
        ? await supabase.from('albums').update(payload).eq('id', albumId)
        : await supabase.from('albums').insert([payload]);

      if (dbError) throw dbError;
      navigate({ page: 'upload-dashboard' });
    } catch (err: any) {
      setError(err.message || "Lỗi hệ thống");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 pb-32 transition-colors duration-300">
      <button 
        onClick={() => navigate({ page: 'upload-dashboard' })} 
        className="flex items-center gap-2 text-stone-500 dark:text-gray-400 mb-8 hover:text-stone-900 dark:hover:text-cyan-400 transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Quay lại Studio
      </button>

      <div className="bg-white dark:bg-black border border-stone-200 dark:border-zinc-800 rounded-[2.5rem] p-8 md:p-10 shadow-sm transition-colors">
        <h1 className="text-3xl font-black text-stone-900 dark:text-gray-200 mb-10 tracking-tight transition-colors">
          Cài đặt Album
        </h1>
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded-2xl flex items-center gap-2 text-sm transition-colors">
            <AlertCircle className="w-4 h-4"/> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-stone-700 dark:text-gray-300 ml-1 transition-colors">
              Tên Album *
            </label>
            <input 
              required 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              className="w-full px-5 py-4 bg-stone-50 dark:bg-zinc-900 border border-transparent dark:border-zinc-800 rounded-2xl outline-none text-stone-900 dark:text-gray-200 focus:ring-2 focus:ring-amber-500/20 dark:focus:ring-cyan-400/40 transition-colors" 
            />
          </div>

          <div className="space-y-4">
            <label className="text-sm font-bold text-stone-700 dark:text-gray-300 ml-1 transition-colors">
              Ảnh bìa
            </label>
            <div className="flex gap-2 p-1 bg-stone-100 dark:bg-zinc-900 rounded-xl w-fit transition-colors">
              <button 
                type="button" 
                onClick={() => setUploadMode('file')} 
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  uploadMode === 'file' 
                    ? 'bg-white dark:bg-cyan-400 shadow-sm text-stone-900 dark:text-black' 
                    : 'text-stone-400 dark:text-gray-400 hover:text-stone-600 dark:hover:text-gray-300'
                }`}
              >
                Tải ảnh lên
              </button>
              <button 
                type="button" 
                onClick={() => setUploadMode('url')} 
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  uploadMode === 'url' 
                    ? 'bg-white dark:bg-cyan-400 shadow-sm text-stone-900 dark:text-black' 
                    : 'text-stone-400 dark:text-gray-400 hover:text-stone-600 dark:hover:text-gray-300'
                }`}
              >
                Dán URL
              </button>
            </div>

            {uploadMode === 'file' ? (
              <div className="flex items-center gap-4">
                <label className="flex-1 border-2 border-dashed border-stone-200 dark:border-zinc-700 rounded-2xl p-8 flex flex-col items-center hover:bg-stone-50 dark:hover:bg-zinc-800/50 cursor-pointer transition-all">
                  <Upload className="w-8 h-8 text-stone-300 dark:text-zinc-600 mb-2 transition-colors" />
                  <span className="text-xs text-stone-400 dark:text-zinc-500 font-medium transition-colors">Chọn ảnh (jpg, png, webp)</span>
                  <input type="file" accept="image/*" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) { setSelectedFile(file); setPreviewUrl(URL.createObjectURL(file)); }
                  }} className="hidden" />
                </label>
                {previewUrl && <img src={previewUrl} className="w-24 h-24 object-cover rounded-2xl shadow-xl border-4 border-white dark:border-zinc-800 transition-colors" />}
              </div>
            ) : (
              <input 
                type="url" 
                value={coverUrl} 
                onChange={e => {setCoverUrl(e.target.value); setPreviewUrl(e.target.value);}} 
                className="w-full px-5 py-4 bg-stone-50 dark:bg-zinc-900 border border-transparent dark:border-zinc-800 rounded-2xl outline-none text-stone-900 dark:text-gray-200 placeholder:text-stone-400 dark:placeholder:text-zinc-500 focus:ring-2 focus:ring-amber-500/20 dark:focus:ring-cyan-400/40 transition-colors" 
                placeholder="https://..." 
              />
            )}
          </div>

          <label className="flex items-center gap-3 p-5 bg-stone-50 dark:bg-zinc-900 border border-transparent dark:border-zinc-800 rounded-2xl cursor-pointer transition-colors hover:dark:border-zinc-700">
            <input 
              type="checkbox" 
              checked={isPublished} 
              onChange={e => setIsPublished(e.target.checked)} 
              className="w-5 h-5 rounded border-stone-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-amber-500 dark:text-cyan-400 focus:ring-amber-500/20 dark:focus:ring-cyan-400/20 transition-colors cursor-pointer" 
            />
            <span className="text-sm font-bold text-stone-700 dark:text-gray-300 transition-colors">Công khai Album</span>
          </label>

          <button 
            disabled={saving} 
            type="submit" 
            className="w-full flex items-center justify-center gap-3 py-5 bg-stone-900 dark:bg-cyan-400 text-white dark:text-black rounded-2xl font-black uppercase tracking-widest hover:opacity-90 disabled:opacity-50 transition-all shadow-xl dark:shadow-cyan-400/20"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {saving ? 'Đang xử lý...' : 'Lưu Album'}
          </button>
        </form>
      </div>
    </div>
  );
}