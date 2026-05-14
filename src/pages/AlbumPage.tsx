// src/pages/AlbumPage.tsx
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from '../lib/router';
import { ArrowLeft, Images, Loader2 } from 'lucide-react';
import Lightbox from '../components/Lightbox';
import FavoriteButton from '../components/FavoriteButton';

interface Photo {
  id: string;
  url: string;
  caption: string;
}

interface Album {
  id: string;
  title: string;
  description: string;
  cover_url: string;
}

// Fix TS7006: Định nghĩa kiểu dữ liệu cho tham số tag
interface MetaTag {
  property: string;
  content: string;
}

const updateMetaTags = (title: string, description: string, image: string) => {
  document.title = `${title} | PhotoGallery`;
  
  const metaTags: MetaTag[] = [
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:image', content: image },
    { property: 'og:type', content: 'website' }
  ];

  metaTags.forEach((tag: MetaTag) => {
    let element = document.querySelector(`meta[property="${tag.property}"]`);
    if (!element) {
      element = document.createElement('meta');
      element.setAttribute('property', tag.property);
      document.head.appendChild(element);
    }
    element.setAttribute('content', tag.content);
  });
};

export default function AlbumPage({ albumId }: { albumId: string }) {
  const [album, setAlbum] = useState<Album | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const { navigate } = useRouter();

  useEffect(() => {
    fetchAlbum();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [albumId]);

  async function fetchAlbum() {
    const [albumRes, photosRes] = await Promise.all([
      supabase.from('albums').select('id, title, description, cover_url').eq('id', albumId).maybeSingle(),
      supabase.from('photos').select('id, url, caption').eq('album_id', albumId).order('sort_order', { ascending: true }),
    ]);

    if (albumRes.data) {
      const albumData = albumRes.data;
      setAlbum(albumData);
      
      updateMetaTags(
        albumData.title, 
        albumData.description || "Khám phá album ảnh tuyệt đẹp trên PhotoGallery", 
        albumData.cover_url || ""
      );
    }
    
    if (photosRes.data) setPhotos(photosRes.data);
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 flex justify-center dark:bg-black min-h-screen">
        <Loader2 className="w-10 h-10 animate-spin text-amber-500 dark:text-cyan-400" />
      </div>
    );
  }

  if (!album) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center dark:bg-black min-h-screen">
        <p className="text-stone-400 text-lg">Không tìm thấy album.</p>
        <button onClick={() => navigate({ page: 'home' })} className="mt-4 text-amber-500 dark:text-cyan-400 hover:underline">
          Quay lại Thư viện
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pb-32">
      <div className="mb-10">
        <button
          onClick={() => navigate({ page: 'home' })}
          className="flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-900 dark:text-gray-400 dark:hover:text-cyan-400 transition-colors mb-6 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Quay lại Thư viện
        </button>
        <h1 className="text-4xl sm:text-5xl font-black text-stone-900 dark:text-gray-200 tracking-tighter italic uppercase">{album.title}</h1>
        {album.description && (
          <p className="mt-4 text-stone-500 dark:text-gray-300 max-w-2xl text-lg leading-relaxed border-l-4 border-amber-500 dark:border-cyan-400 pl-4">{album.description}</p>
        )}
        <div className="flex items-center gap-2 mt-4 text-xs font-bold text-stone-400 uppercase tracking-widest">
          <Images className="w-4 h-4 text-amber-500 dark:text-cyan-400" />
          {photos.length} tác phẩm
        </div>
      </div>

      {photos.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-stone-100 dark:border-gray-900 rounded-[2.5rem]">
          <p className="text-stone-400">Chưa có ảnh nào trong album này.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {photos.map((photo, i) => (
            <div key={photo.id} className="relative group aspect-square rounded-3xl overflow-hidden bg-stone-100 dark:bg-black dark:border dark:border-gray-900 shadow-sm hover:shadow-2xl dark:shadow-none transition-all duration-500">
              <button
                onClick={() => setLightboxIndex(i)}
                className="w-full h-full"
              >
                <img
                  src={photo.url}
                  alt={photo.caption}
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-500" />
              </button>

              <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                <FavoriteButton photoId={photo.id} />
              </div>

              {photo.caption && (
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <p className="text-white dark:text-gray-200 text-xs font-bold truncate tracking-wide">{photo.caption}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* FIX TS2304: Đổi filtered thành photos */}
      {lightboxIndex !== null && (
        <Lightbox
          photos={photos.map((p: Photo) => ({ 
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