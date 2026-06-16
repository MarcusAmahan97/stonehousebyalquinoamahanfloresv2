"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/app/lib/supabase.js';

export default function Home() {
  const [orders, setOrders] = useState([]);

  async function fetchActiveOrders() {
    // Modified: Query using the actual database uppercase string states
    const { data, error } = await supabase
      .from('meal_orders')
      .select('order_number, status')
      .in('status', ['PREPARING', 'NOW SERVING']); 
    if (!error && data) setOrders(data);
  }

  useEffect(() => {
    fetchActiveOrders();

    const channel = supabase
      .channel('public:meal_orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'meal_orders' }, () => {
          fetchActiveOrders();
      })
      .subscribe();

    const backgroundSync = setInterval(() => {
      fetchActiveOrders();
    }, 3000); 

    const memoryRecoveryRefresh = setInterval(() => {
      window.location.reload();
    }, 1000 * 60 * 120); 

    return () => {
      supabase.removeChannel(channel);
      clearInterval(backgroundSync);
      clearInterval(memoryRecoveryRefresh);
    };
  }, []);

  // Modified: Split array data based on database backend keys ('PREPARING' & 'NOW SERVING')
  const preparing = orders.filter(o => o.status === 'PREPARING');
  const serving = orders.filter(o => o.status === 'NOW SERVING');

  return (
    <div className="p-6 min-h-screen bg-gray-900 text-white flex flex-col justify-between">
      <div>
        <header className="text-center mb-10 mt-4">
          <h1 className="text-4xl lg:text-5xl font-black tracking-wider text-yellow-400 uppercase">Order Pick-Up Status</h1>
          <p className="text-gray-400 text-sm mt-2">Please look out for your ticket number below</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Column 1: Display Label says ORDERS while reading 'PREPARING' from backend mapping */}
          <div className="bg-gray-800 rounded-2xl border-4 border-orange-500/30 shadow-2xl p-6">
            <h2 className="text-2xl lg:text-3xl font-extrabold text-orange-400 flex items-center gap-2 border-b border-gray-700 pb-4 mb-6">
              <span className="animate-pulse block h-3 w-3 rounded-full bg-orange-500"></span> ORDERS
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 font-mono text-3xl font-bold tracking-widest text-center text-gray-300">
              {preparing.length ? preparing.map(o => (
                <div key={o.order_number} className="bg-gray-700/50 p-3 rounded-lg border border-gray-700">{o.order_number}</div>
              )) : <div className="col-span-full text-lg font-normal py-6 text-gray-500 italic">None</div>}
            </div>
          </div>

          {/* Column 2: Now Serving */}
          <div className="bg-gray-800 rounded-2xl border-4 border-green-500/30 shadow-2xl p-6">
            <h2 className="text-2xl lg:text-3xl font-extrabold text-green-400 flex items-center gap-2 border-b border-gray-700 pb-4 mb-6">
              <span className="animate-ping block h-3 w-3 rounded-full bg-green-400"></span> NOW SERVING
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 font-mono text-4xl font-black tracking-widest text-center text-green-400">
              {serving.length ? serving.map(o => (
                <div key={o.order_number} className="bg-green-950/40 text-green-400 p-3 rounded-lg border border-green-500/40 shadow-lg">{o.order_number}</div>
              )) : <div className="col-span-full text-lg font-normal py-6 text-gray-500 italic">None</div>}
            </div>
          </div>
        </div>
      </div>
      
      <footer className="text-center pt-8 text-xs text-gray-500 tracking-wide">
        Live Cloud Synchronization Powered via Supabase Realtime Channels
      </footer>
    </div>
  );
}