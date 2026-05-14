import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Loader2, Search } from 'lucide-react';
import FavoriteButton from '../components/FavoriteButton';
import Lightbox from '../components/Lightbox';

export default function ExplorePage() {
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    fetchPhotos();
  }, []);

  async function fetchPhotos() {
    const { data } = await supabase
      .from('photos')
      .select('*, albums!inner(is_published, title)')
      .eq('albums.is_published', true)
      .order('created_at', { ascending: false });
    if (data) setPhotos(data);
    setLoading(false);
  }

  const filtered = photos.filter(p => p.caption?.toLowerCase().includes(searchTerm.toLowerCase()));

  if (loading) return <div className="flex justify-center py-20 min-h-screen dark:bg-black"><Loader2 className="animate-spin text-amber-500 dark:text-cyan-400 w-12 h-12" /></div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-16 pb-32">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
        <div>
          <h1 className="text-6xl font-black text-stone-900 dark:text-gray-200 tracking-tighter italic uppercase">Khám phá</h1>
          <p className="text-stone-500 dark:text-gray-400 mt-4 text-lg">Cảm hứng từ cộng đồng sáng tạo.</p>
        </div>
        <div className="relative group w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400 dark:text-gray-500" />
          <input 
            type="text" 
            placeholder="Tìm kiếm cảm hứng..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="w-full pl-12 pr-6 py-4 bg-white dark:bg-black border border-stone-200 dark:border-gray-900 rounded-2xl outline-none focus:ring-2 focus:ring-amber-500/20 dark:focus:ring-cyan-400/20 dark:text-gray-200 shadow-sm dark:shadow-none" 
          />
        </div>
      </div>

      <div className="columns-2 md:columns-3 lg:columns-4 gap-6 space-y-6">
        {filtered.map((photo, index) => (
          <div key={photo.id} className="relative group break-inside-avoid rounded-[2.5rem] overflow-hidden bg-stone-100 dark:bg-black dark:border dark:border-gray-900 shadow-sm hover:shadow-2xl dark:shadow-none transition-all duration-700">
            {/* Click vào ảnh để mở Lightbox */}
            <button onClick={() => setLightboxIndex(index)} className="w-full h-full block">
              <img src={photo.url} className="w-full h-auto block transition-transform duration-1000 group-hover:scale-110" loading="lazy" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-500" />
            </button>

            <div className="absolute inset-0 pointer-events-none p-8 flex flex-col justify-between">
              <div className="flex justify-end pointer-events-auto opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                <FavoriteButton photoId={photo.id} />
              </div>
              <div className="opacity-0 group-hover:opacity-100 transition-all transform translate-y-4 group-hover:translate-y-0">
                <p className="text-white dark:text-gray-200 font-black text-lg line-clamp-2 leading-tight">{photo.caption || 'Khoảnh khắc'}</p>
                <p className="text-amber-500 dark:text-cyan-400 text-[10px] uppercase font-black tracking-widest mt-2">{photo.albums?.title}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {lightboxIndex !== null && (
        <Lightbox
          photos={filtered.map(p => ({ 
            id: p.id, 
            url: p.url, 
            caption: p.caption 
          }))}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  );
}