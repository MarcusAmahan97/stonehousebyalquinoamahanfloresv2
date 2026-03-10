"use client";
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AdminDashboard from '../components/AdminDashboard';

export default function AdminRoute() {
  const { adminKey } = useParams();
  const router = useRouter();
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // 1. The Secret Route Key (Keep this private!)
  const SECRET_ROUTE_KEY = "sh-management-2026"; 
  
  // 2. The Admin Password
  const ADMIN_PASSWORD = "stonehouse-admin-access";

  useEffect(() => {
    // If they typed the wrong URL key, kick them back to home
    if (adminKey !== SECRET_ROUTE_KEY) {
      router.push('/');
    }
  }, [adminKey, router]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Invalid Password Access');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 px-6">
        <div className="max-w-md w-full bg-white rounded-[2.5rem] p-12 shadow-2xl border border-stone-100 text-center">
          <div className="w-16 h-16 bg-[#1a2e1a] rounded-2xl flex items-center justify-center text-white mx-auto mb-6 shadow-lg">SH</div>
          <h1 className="text-2xl font-bold text-[#1a2e1a] mb-2 tracking-tight">Staff Portal</h1>
          <p className="text-stone-400 text-sm mb-8 uppercase tracking-widest font-bold">Authorized Personnel Only</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <input 
              type="password" 
              placeholder="Enter Admin Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-stone-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-orange-500/20 outline-none text-center"
            />
            {error && <p className="text-red-500 text-xs font-bold">{error}</p>}
            <button className="w-full bg-[#1a2e1a] text-white py-4 rounded-2xl font-bold hover:bg-orange-600 transition-all shadow-xl active:scale-95">
              Unlock Dashboard
            </button>
          </form>
          <button onClick={() => router.push('/')} className="mt-6 text-stone-400 text-[10px] uppercase tracking-widest hover:text-stone-600 transition-colors">
            ← Return to Public Site
          </button>
        </div>
      </div>
    );
  }

  // If URL key is correct AND password is correct, show the Dashboard
  return <AdminDashboard />;
}
