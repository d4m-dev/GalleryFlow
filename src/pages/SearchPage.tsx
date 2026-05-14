import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Search, Images as ImageIcon } from 'lucide-react';

export default function SearchPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGlobalPhotos();
  }, []);

  async function fetchGlobalPhotos() {
    // Lấy tất cả ảnh từ những album đã xuất bản
    const { data } = await supabase
      .from('photos')
      .select(`
        *,
        albums!inner(is_published)
      `)
      .eq('albums.is_published', true);
    
    if (data) setPhotos(data);
    setLoading(false);
  }

  const filteredPhotos = photos.filter(p => 
    p.caption?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 transition-colors duration-300">
      {/* Search Bar */}
      <div className="relative max-w-xl mx-auto mb-12">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400 dark:text-gray-500 transition-colors" />
        <input
          type="text"
          placeholder="Tìm kiếm khoảnh khắc theo chú thích..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-4 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 dark:focus:ring-cyan-400/40 focus:border-amber-500 dark:focus:border-cyan-400 transition-all text-lg text-stone-900 dark:text-gray-200 placeholder:text-stone-400 dark:placeholder:text-zinc-500"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4,5,6,7,8].map(i => (
            <div key={i} className="aspect-square bg-stone-200 dark:bg-zinc-800 animate-pulse rounded-2xl transition-colors" />
          ))}
        </div>
      ) : (
        <div className="columns-2 md:columns-4 gap-4 space-y-4">
          {filteredPhotos.map((photo) => (
            <div key={photo.id} className="break-inside-avoid group relative rounded-2xl overflow-hidden bg-stone-100 dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 transition-colors">
              <img src={photo.url} alt={photo.caption} className="w-full h-auto block" />
              {photo.caption && (
                <div className="absolute inset-0 bg-black/50 dark:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                  <p className="text-white dark:text-gray-200 text-sm line-clamp-2">{photo.caption}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!loading && filteredPhotos.length === 0 && (
        <div className="text-center py-20">
          <ImageIcon className="w-12 h-12 text-stone-300 dark:text-zinc-600 mx-auto mb-4 transition-colors" />
          <p className="text-stone-500 dark:text-gray-400 transition-colors">Không tìm thấy ảnh nào khớp với từ khóa.</p>
        </div>
      )}
    </div>
  );
}