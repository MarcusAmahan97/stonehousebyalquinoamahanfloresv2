"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/app/lib/supabase.js';

function KitchenDashboard() {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);

  async function fetchKitchenQueue() {
    const { data, error } = await supabase
      .from('meal_orders')
      .select('*')
      .in('status', ['PREPARING', 'NOW SERVING'])
      .order('created_at', { ascending: true });
    if (!error && data) setOrders(data);
  }

  useEffect(() => {
    fetchKitchenQueue();

    // 1. Real-time subscription
    const channel = supabase.channel('kitchen:meal_orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'meal_orders' }, () => {
        fetchKitchenQueue();
      })
      .subscribe();

    // 2. Background Sync (3 seconds)
    const backgroundSync = setInterval(() => {
      fetchKitchenQueue();
    }, 3000);

    // 3. Memory Recovery Refresh (120 minutes)
    const memoryRecoveryRefresh = setInterval(() => {
      window.location.reload();
    }, 1000 * 60 * 120);

    return () => { 
      supabase.removeChannel(channel); 
      clearInterval(backgroundSync);
      clearInterval(memoryRecoveryRefresh);
    };
  }, []);

  const advanceOrderStatus = async (order, e) => {
    if (e) e.stopPropagation();
    
    const isPreparing = order.status === 'PREPARING';
    const nextStatus = isPreparing ? 'NOW SERVING' : 'COMPLETED';
    
    const { error } = await supabase
      .from('meal_orders')
      .update({ status: nextStatus })
      .eq('id', order.id);

    if (!error) {
      if (isPreparing) {
        await supabase.from('notifications').insert([{
          type: 'ORDER_READY',
          message: `Ticket #${order.order_number} is ready! Recommend posting to pickup board.`,
          order_id: order.id,
          is_read: false
        }]);
      }

      fetchKitchenQueue();
      if (selectedOrder?.id === order.id) setSelectedOrder(null);
    }
  };

  const renderBulletItems = (summaryText) => {
    if (!summaryText) return <p className="text-stone-400 italic">No items registered.</p>;
    const itemsArray = summaryText.split(',').map(item => item.trim()).filter(Boolean);
    
    return (
      <ul className="list-disc list-inside space-y-1">
        {itemsArray.map((item, idx) => (
          <li key={idx} className="text-stone-100 font-bold tracking-wide">
            {item}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="p-6 min-h-screen bg-stone-900 text-white font-sans">
      <header className="flex justify-between items-center mb-8 border-b border-gray-800 pb-4">
        <div>
          <h1 className="text-3xl font-black text-yellow-400 tracking-tight">KITCHEN WORKSPACE</h1>
          <p className="text-gray-400 text-xs uppercase tracking-wider">Live Order Preparation Monitor</p>
        </div>
        <div className="flex items-center gap-2 bg-gray-800 px-4 py-2 rounded-full border border-gray-700">
          <span className="h-3 w-3 rounded-full bg-green-500 animate-pulse"></span>
          <span className="text-xs font-mono font-bold text-gray-300">Display Sync Active</span>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {orders.map(order => (
          <div 
            key={order.id}
            onClick={() => setSelectedOrder(order)}
            className={`cursor-pointer group relative bg-gray-800 rounded-2xl border-2 p-5 transition-all hover:scale-[1.02] ${
              order.status === 'NOW SERVING' ? 'border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.1)]' : 'border-orange-500/30'
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Ticket</span>
                <h3 className="text-3xl font-black font-mono text-white">#{order.order_number}</h3>
              </div>
              <span className={`text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-wider ${
                order.status === 'PREPARING' ? 'bg-orange-500/20 text-orange-400' : 'bg-green-500/20 text-green-400'
              }`}>
                {order.status === 'PREPARING' ? 'Preparing' : 'Serving'}
              </span>
            </div>

            <div className="my-4 bg-stone-900/60 p-3 rounded-xl border border-gray-700/50 min-h-[80px]">
              <p className="text-[11px] font-bold text-yellow-400/80 uppercase mb-1.5">Items To Cook:</p>
              <div className="text-xs">{renderBulletItems(order.items_summary)}</div>
            </div>

            <p className="text-gray-400 text-[11px] mb-4 group-hover:text-yellow-400 transition-colors">
              &rarr; Click card to expand breakdown view
            </p>

            <button
              onClick={(e) => advanceOrderStatus(order, e)}
              className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
                order.status === 'PREPARING' ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {order.status === 'PREPARING' ? 'Notify Ready ✓' : 'Archive Order'}
            </button>
          </div>
        ))}

        {orders.length === 0 && (
          <div className="col-span-full text-center py-20 bg-gray-800/30 border border-dashed border-gray-800 rounded-[2rem]">
            <p className="text-gray-500 italic text-lg">No food orders currently pending preparation.</p>
          </div>
        )}
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-[2.5rem] max-w-md w-full p-8 text-white relative">
            <h3 className="text-2xl font-black mb-1 font-mono text-yellow-400">Order Ticket #{selectedOrder.order_number}</h3>
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-4">Status: {selectedOrder.status}</p>
            
            <div className="bg-gray-900 p-5 rounded-2xl border border-gray-700/60 mb-6">
              <h4 className="text-xs text-gray-400 font-bold uppercase mb-2 tracking-wider">Kitchen Ticket Contents</h4>
              <div className="text-sm leading-relaxed">{renderBulletItems(selectedOrder.items_summary)}</div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setSelectedOrder(null)} className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white text-xs font-bold rounded-xl">Close</button>
              <button onClick={(e) => advanceOrderStatus(selectedOrder, e)} className="flex-1 py-3 bg-yellow-500 hover:bg-yellow-600 text-black text-xs font-bold rounded-xl">
                {selectedOrder.status === 'PREPARING' ? 'Mark Ready & Alert' : 'Complete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default KitchenDashboard;