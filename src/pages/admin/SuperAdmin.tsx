import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import { 
  Users, 
  ShieldCheck, 
  UserX, 
  UserCheck, 
  Image as ImageIcon, 
  Trash2, 
  ExternalLink,
  ShieldAlert
} from 'lucide-react';

export default function SuperAdmin() {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'content'>('users');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAdmin) fetchData();
  }, [activeTab, isAdmin]);

  async function fetchData() {
    setLoading(true);
    if (activeTab === 'users') {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      setData(profiles || []);
    } else {
      const { data: albums } = await supabase
        .from('albums')
        .select('*, profiles(email)')
        .order('created_at', { ascending: false });
      setData(albums || []);
    }
    setLoading(false);
  }

  // --- LOGIC BAN USER ---
  async function handleBanToggle(userId: string, currentStatus: boolean) {
    const actionName = currentStatus ? 'Mở khóa' : 'Khóa (Ban)';
    if (!confirm(`Bạn có chắc muốn ${actionName} người dùng này?`)) return;

    const { error } = await supabase
      .from('profiles')
      .update({ is_banned: !currentStatus })
      .eq('id', userId);

    if (error) {
      alert("Lỗi: " + error.message);
    } else {
      // Cập nhật state tại chỗ để UI phản hồi ngay lập tức
      setData(prev => prev.map(u => u.id === userId ? { ...u, is_banned: !currentStatus } : u));
    }
  }

  // --- LOGIC THAY ĐỔI QUYỀN ADMIN ---
  async function handleRoleToggle(userId: string, currentRole: string) {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId);

    if (!error) {
      setData(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    }
  }

  if (!isAdmin) return <div className="p-20 text-center">Truy cập bị từ chối.</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 pb-32">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-bold text-stone-900">Quản trị tối cao</h1>
          <p className="text-stone-500 mt-1">Kiểm soát toàn bộ người dùng và nội dung hệ thống</p>
        </div>

        <div className="flex bg-stone-100 p-1 rounded-2xl">
          <button 
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold transition-all ${activeTab === 'users' ? 'bg-white shadow-sm text-stone-900' : 'text-stone-400'}`}
          >
            <Users className="w-4 h-4"/> Người dùng
          </button>
          <button 
            onClick={() => setActiveTab('content')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold transition-all ${activeTab === 'content' ? 'bg-white shadow-sm text-stone-900' : 'text-stone-400'}`}
          >
            <ImageIcon className="w-4 h-4"/> Nội dung
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><ShieldAlert className="w-10 h-10 animate-pulse text-stone-200"/></div>
      ) : activeTab === 'users' ? (
        /* TABLE NGƯỜI DÙNG */
        <div className="bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-100">
                <th className="px-6 py-4 text-xs font-bold text-stone-400 uppercase tracking-wider">Thông tin</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-400 uppercase tracking-wider">Vai trò</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-400 uppercase tracking-wider">Trạng thái</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-400 uppercase tracking-wider text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {data.map((u) => (
                <tr key={u.id} className={u.is_banned ? 'bg-red-50/30' : ''}>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-stone-900">{u.email}</p>
                    <p className="text-[10px] text-stone-400 font-mono mt-0.5">{u.id}</p>
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => handleRoleToggle(u.id, u.role)}
                      className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold uppercase border transition-all ${
                        u.role === 'admin' ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-white border-stone-200 text-stone-500'
                      }`}
                    >
                      <ShieldCheck className="w-3 h-3"/> {u.role}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    {u.is_banned ? (
                      <span className="inline-flex items-center gap-1 text-red-600 text-xs font-bold italic">
                        <UserX className="w-3 h-3"/> Đã khóa
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-bold">
                        <UserCheck className="w-3 h-3"/> Hoạt động
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleBanToggle(u.id, u.is_banned)}
                      className={`p-2 rounded-lg transition-colors ${u.is_banned ? 'text-emerald-600 hover:bg-emerald-50' : 'text-red-400 hover:bg-red-50'}`}
                      title={u.is_banned ? "Mở khóa" : "Ban người dùng"}
                    >
                      {u.is_banned ? <UserCheck className="w-5 h-5"/> : <UserX className="w-5 h-5"/>}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* GRID KIỂM DUYỆT NỘI DUNG */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.map(album => (
            <div key={album.id} className="bg-white border border-stone-200 p-4 rounded-2xl flex items-center gap-4 hover:shadow-md transition-all">
              <img src={album.cover_url || 'https://via.placeholder.com/150'} className="w-20 h-20 rounded-xl object-cover" />
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-stone-900 truncate">{album.title}</h3>
                <p className="text-xs text-stone-400 mt-0.5">Bởi: {album.profiles?.email}</p>
                {!album.is_published && <span className="text-[10px] bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded font-bold uppercase mt-1 inline-block">Riêng tư</span>}
              </div>
              <div className="flex gap-1">
                <button className="p-2 text-stone-400 hover:text-sky-600"><ExternalLink className="w-5 h-5"/></button>
                <button className="p-2 text-stone-400 hover:text-red-600"><Trash2 className="w-5 h-5"/></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}