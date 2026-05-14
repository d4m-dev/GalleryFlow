import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { Heart } from 'lucide-react';

export default function FavoriteButton({ photoId }: { photoId: string }) {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) checkStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, photoId]);

  async function checkStatus() {
    const { data } = await supabase.from('favorites').select('id').eq('user_id', user?.id).eq('photo_id', photoId).maybeSingle();
    setIsLiked(!!data);
  }

  async function toggleLike(e: React.MouseEvent) {
    e.stopPropagation();
    if (!user) return alert("Vui lòng đăng nhập để yêu thích ảnh này!");
    
    setLoading(true);
    try {
      if (isLiked) {
        await supabase.from('favorites').delete().eq('user_id', user.id).eq('photo_id', photoId);
        setIsLiked(false);
      } else {
        await supabase.from('favorites').insert({ user_id: user.id, photo_id: photoId });
        setIsLiked(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button 
      onClick={toggleLike} 
      disabled={loading} 
      className={`p-2.5 rounded-full backdrop-blur-md transition-all shadow-xl group/heart ${isLiked ? 'bg-red-500 text-white scale-110' : 'bg-black/20 text-white hover:bg-white/40'}`}
    >
      <Heart className={`w-4 h-4 transition-transform group-hover/heart:scale-125 ${isLiked ? 'fill-current' : ''}`} />
    </button>
  );
}