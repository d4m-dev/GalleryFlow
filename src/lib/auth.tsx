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

  // Hàm kiểm tra profile được viết lại để trả về kết quả an toàn (boolean)
  const checkUserProfile = async (currentUser: User): Promise<boolean> => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role, is_banned')
        .eq('id', currentUser.id)
        .maybeSingle();

      if (error) throw error;

      // Nếu người dùng bị Ban, trả về false để CHẶN việc cấp quyền truy cập
      if (profile?.is_banned) {
        alert("Tài khoản của bạn đã bị khóa bởi quản trị viên.");
        await supabase.auth.signOut();
        return false; 
      }

      // Cập nhật quyền Admin an toàn
      setIsAdmin(profile?.role === 'admin' || currentUser.app_metadata?.role === 'admin');
      return true; // Hợp lệ, cho phép đăng nhập
    } catch (err) {
      console.error("Lỗi khi kiểm tra profile:", err);
      // Fallback về app_metadata nếu không truy vấn được profiles
      setIsAdmin(currentUser.app_metadata?.role === 'admin');
      return true; 
    }
  };

  useEffect(() => {
    let mounted = true; // Biến chống rò rỉ bộ nhớ khi component unmount

    const initAuth = async () => {
      try {
        setLoading(true);
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;

        const currentUser = session?.user ?? null;
        
        // BƯỚC QUAN TRỌNG: CHỈ SET USER SAU KHI ĐÃ CHECK PROFILE XONG!
        if (currentUser) {
          const isSafeToLogin = await checkUserProfile(currentUser);
          if (isSafeToLogin && mounted) {
            setUser(currentUser);
          } else if (mounted) {
            setUser(null);
            setIsAdmin(false);
          }
        } else if (mounted) {
          setUser(null);
          setIsAdmin(false);
        }
      } catch (err) {
        console.error("Lỗi khởi tạo Auth:", err);
        if (mounted) {
          setUser(null);
          setIsAdmin(false);
        }
      } finally {
        // Đảm bảo LUÔN TẮT LOADING để mở khóa giao diện, dù thành công hay lỗi
        if (mounted) setLoading(false);
      }
    };

    initAuth();

    // Lắng nghe thay đổi trạng thái đăng nhập
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;

      if (currentUser) {
        const isSafeToLogin = await checkUserProfile(currentUser);
        if (isSafeToLogin && mounted) {
          setUser(currentUser);
        } else if (mounted) {
          setUser(null);
          setIsAdmin(false);
        }
      } else if (mounted) {
        setUser(null);
        setIsAdmin(false);
      }
      
      if (mounted) setLoading(false); // Tắt loading sau khi chuyển trạng thái xong
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error: error.message };
      return { error: null };
    } catch (err: any) {
      return { error: err.message || "Lỗi mạng hoặc máy chủ không phản hồi." };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) return { error: error.message };
      return { error: null };
    } catch (err: any) {
      return { error: err.message || "Lỗi mạng hoặc máy chủ không phản hồi." };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Lỗi đăng xuất:", err);
    } finally {
      setUser(null);
      setIsAdmin(false);
    }
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