import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { useRouter } from '../lib/router';
import { Camera, AlertCircle } from 'lucide-react';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { signUp } = useAuth();
  const { navigate } = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const { error } = await signUp(email, password);
    if (error) {
      setError(error);
      setSubmitting(false);
    } else {
      navigate({ page: 'home' });
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 dark:bg-black transition-colors duration-300">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-stone-900 dark:bg-cyan-400 rounded-xl flex items-center justify-center mx-auto mb-4 transition-colors">
            <Camera className="w-6 h-6 text-white dark:text-black" />
          </div>
          <h1 className="text-2xl font-bold text-stone-900 dark:text-gray-200 transition-colors">
            Tạo tài khoản
          </h1>
          <p className="text-stone-500 dark:text-gray-400 mt-1 transition-colors">
            Bắt đầu hành trình của bạn cùng chúng tôi
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-lg text-sm text-red-700 dark:text-red-400 transition-colors">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-gray-300 mb-1.5 transition-colors">
              Địa chỉ Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 border border-stone-300 dark:border-zinc-800 rounded-lg text-sm text-stone-900 dark:text-gray-200 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-500/40 dark:focus:ring-cyan-400/40 focus:border-amber-500 dark:focus:border-cyan-400 transition-colors"
              placeholder="nautilus@gmail.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-gray-300 mb-1.5 transition-colors">
              Mật khẩu
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-3.5 py-2.5 border border-stone-300 dark:border-zinc-800 rounded-lg text-sm text-stone-900 dark:text-gray-200 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-500/40 dark:focus:ring-cyan-400/40 focus:border-amber-500 dark:focus:border-cyan-400 transition-colors"
              placeholder="Tối thiểu 6 ký tự"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 px-4 bg-stone-900 dark:bg-cyan-400 text-white dark:text-black text-sm font-medium rounded-lg hover:bg-stone-800 dark:hover:bg-cyan-300 disabled:opacity-50 transition-colors"
          >
            {submitting ? 'Đang tạo tài khoản...' : 'Đăng ký'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-stone-500 dark:text-gray-400 transition-colors">
          Bạn đã có tài khoản?{' '}
          <button 
            onClick={() => navigate({ page: 'login' })} 
            className="text-amber-700 dark:text-cyan-400 hover:underline font-medium transition-colors"
          >
            Đăng nhập
          </button>
        </p>
      </div>
    </div>
  );
}