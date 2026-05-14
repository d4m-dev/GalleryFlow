import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from './supabase';
import type { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Hàm kiểm tra profile để xác định quyền Admin và trạng thái bị Ban
  const checkUserProfile = async (currentUser: User) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role, is_banned')
        .eq('id', currentUser.id)
        .maybeSingle();

      if (error) throw error;

      // Nếu người dùng bị Ban, thực hiện đăng xuất ngay lập tức
      if (profile?.is_banned) {
        alert("Tài khoản của bạn đã bị khóa bởi quản trị viên.");
        await signOut();
        return;
      }

      // Cập nhật quyền Admin dựa trên bảng profiles (ưu tiên hơn app_metadata)
      setIsAdmin(profile?.role === 'admin' || currentUser.app_metadata?.role === 'admin');
    } catch (err) {
      console.error("Lỗi khi kiểm tra profile:", err);
      // Fallback về app_metadata nếu không truy vấn được profiles
      setIsAdmin(currentUser.app_metadata?.role === 'admin');
    }
  };

  useEffect(() => {
    // 1. Kiểm tra session khi khởi tạo ứng dụng
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      
      if (currentUser) {
        checkUserProfile(currentUser);
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });

    // 2. Lắng nghe thay đổi trạng thái đăng nhập
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        await checkUserProfile(currentUser);
      } else {
        setIsAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ 
      email, 
      password,
      // Tự động tạo profile qua trigger trong SQL hoặc bạn có thể insert thủ công ở đây
    });
    if (error) return { error: error.message };
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsAdmin(false);
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth phải được sử dụng trong AuthProvider');
  return context;
}