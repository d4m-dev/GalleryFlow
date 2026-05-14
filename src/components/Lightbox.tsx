import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import FavoriteButton from './FavoriteButton';

interface Photo {
  id: string;
  url: string;
  caption?: string;
}

interface LightboxProps {
  photos: Photo[];
  initialIndex: number;
  onClose: () => void;
}

export default function Lightbox({ photos, initialIndex, onClose }: LightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') showPrev();
      if (e.key === 'ArrowRight') showNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [currentIndex]);

  const showNext = () => setCurrentIndex((prev) => (prev + 1) % photos.length);
  const showPrev = () => setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 sm:p-8 animate-fadeIn">
      
      {/* Nút điều hướng trái */}
      <button 
        onClick={showPrev} 
        className="absolute left-2 sm:left-6 p-2 text-white/30 hover:text-white transition-all z-30 active:scale-90"
      >
        <ChevronLeft className="w-10 h-10 sm:w-12 sm:h-12" />
      </button>

      {/* CONTAINER CHÍNH BỌC ẢNH (Để nút nằm bên trong ảnh) */}
      <div className="relative inline-block max-w-full max-h-full">
        
        {/* NÚT X (Đóng) - Nằm trên cùng bên phải tấm ảnh */}
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 z-20 p-2 bg-black/20 hover:bg-black/50 text-white/80 rounded-full backdrop-blur-md transition-all active:scale-90 shadow-lg"
        >
          <X className="w-6 h-6" />
        </button>

        {/* NÚT TIM (Yêu thích) - Nằm dưới cùng bên phải tấm ảnh */}
        <div className="absolute bottom-4 right-4 z-20 shadow-2xl">
          <FavoriteButton photoId={photos[currentIndex].id} />
        </div>

        {/* HIỂN THỊ ẢNH */}
        <img
          src={photos[currentIndex].url}
          alt={photos[currentIndex].caption}
          className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl border border-white/5"
        />

        {/* CAPTION (Nếu có) */}
        {photos[currentIndex].caption && (
          <div className="absolute bottom-0 left-0 right-0 p-6 pt-12 bg-gradient-to-t from-black/80 to-transparent rounded-b-xl pointer-events-none">
            <p className="text-white text-sm sm:text-base font-medium text-left max-w-[80%] line-clamp-2">
              {photos[currentIndex].caption}
            </p>
          </div>
        )}
      </div>

      {/* Nút điều hướng phải */}
      <button 
        onClick={showNext} 
        className="absolute right-2 sm:right-6 p-2 text-white/30 hover:text-white transition-all z-30 active:scale-90"
      >
        <ChevronRight className="w-10 h-10 sm:w-12 sm:h-12" />
      </button>

      {/* Chỉ số ảnh (Ví dụ: 1/10) */}
      <div className="absolute bottom-6 text-white/40 text-[10px] font-black uppercase tracking-widest">
        {currentIndex + 1} / {photos.length}
      </div>
    </div>
  );
}