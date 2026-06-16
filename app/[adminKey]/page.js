"use client";

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';

// Standard relative imports
import RawAdminDashboard from '../components/AdminDashboard';
import RawKitchenDashboard from '../components/KitchenDashboard';

// Robust resolution helpers to handle Turbopack module variations
const getComponent = (mod) => {
  if (!mod) return null;
  // If it's a module object with a .default property, extract it
  if (typeof mod === 'object' && mod.default) return mod.default;
  return mod;
};

const AdminDashboard = getComponent(RawAdminDashboard);
const KitchenDashboard = getComponent(RawKitchenDashboard);

export default function StaffPortalRoute({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const adminKey = params.adminKey;
  const router = useRouter();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isValidKey, setIsValidKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [portalMode, setPortalMode] = useState('');

  const PORTAL_CONFIG = {
    "kuyawengs-management-2026": {
      mode: "ADMIN",
      password: "kuyawengs-admin-access",
      title: "Kuya Weng's Staff Portal",
      subtitle: "Authorized Cashier Access Only"
    },
    "kuyawengs-kitchen-2026": {
      mode: "KITCHEN",
      password: "kuyawengs-kitchen-access",
      title: "Kuya Weng's Kitchen Monitor",
      subtitle: "Back of House Operations Only"
    }
  };

  useEffect(() => {
    if (!adminKey || !PORTAL_CONFIG[adminKey]) {
      console.warn("🚫 Invalid portal access key. Redirecting to public home.");
      router.push('/');
    } else {
      setIsValidKey(true);
      setPortalMode(PORTAL_CONFIG[adminKey].mode);
      setLoading(false);
    }
  }, [adminKey, router]);

  // Log component states to browser console for easy live debugging
  useEffect(() => {
    if (isValidKey && isAuthenticated) {
      console.log("🛠️ Component verification evaluation:");
      console.log("Admin Component Type:", typeof AdminDashboard, AdminDashboard);
      console.log("Kitchen Component Type:", typeof KitchenDashboard, KitchenDashboard);
    }
  }, [isValidKey, isAuthenticated]);

  const handleLogin = (e) => {
    e.preventDefault();
    const config = PORTAL_CONFIG[adminKey];

    if (config && password === config.password) {
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Invalid Access Password Pin');
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-stone-950 text-stone-200">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-t-transparent border-yellow-400" />
      </div>
    );
  }

  if (!isValidKey) return null;

  if (!isAuthenticated) {
    const currentConfig = PORTAL_CONFIG[adminKey];
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-900/95 px-6 font-sans">
        <div className="max-w-md w-full bg-stone-800 rounded-[2.5rem] p-12 shadow-2xl border border-stone-700 text-center">
          <div className="w-16 h-16 bg-stone-950 text-yellow-400 rounded-2xl flex items-center justify-center font-black text-xl mx-auto mb-6 shadow-md">
            KW
          </div>
          <h1 className="text-2xl font-black text-white mb-2 tracking-tight">{currentConfig?.title}</h1>
          <p className="text-stone-400 text-xs mb-8 uppercase tracking-widest font-bold">{currentConfig?.subtitle}</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input 
              type="password" 
              placeholder="Enter Access Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-stone-950 border border-stone-700 rounded-2xl p-4 focus:ring-2 focus:ring-yellow-400/50 outline-none text-center text-white font-medium placeholder-stone-600 transition-all"
            />
            {error && <p className="text-red-400 text-xs font-bold">{error}</p>}
            <button className="w-full bg-yellow-400 text-stone-950 py-4 rounded-2xl font-bold hover:bg-yellow-500 transition-all shadow-xl active:scale-95">
              Unlock Dashboard
            </button>
          </form>
          <button onClick={() => router.push('/')} className="mt-6 text-stone-500 text-[10px] uppercase tracking-widest hover:text-stone-400 transition-colors">
            &larr; Return to Public Site
          </button>
        </div>
      </div>
    );
  }

  // Safety fallback rendering checks to protect against crashing the browser DOM tree
  if (portalMode === 'ADMIN') {
    if (!AdminDashboard || typeof AdminDashboard !== 'function') {
      return <div className="p-8 text-red-400 bg-stone-950 min-h-screen font-mono text-xs">Error: AdminDashboard did not export as a valid component function. Check console logs.</div>;
    }
    return <AdminDashboard adminKey={adminKey} />;
  }

  if (portalMode === 'KITCHEN') {
    if (!KitchenDashboard || typeof KitchenDashboard !== 'function') {
      return <div className="p-8 text-red-400 bg-stone-950 min-h-screen font-mono text-xs">Error: KitchenDashboard did not export as a valid component function. Check console logs.</div>;
    }
    return <KitchenDashboard />;
  }

  return null;
}