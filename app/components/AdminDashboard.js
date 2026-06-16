"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/app/lib/supabase.js'; 
import MenuManagement from './MenuManagement';
import CalculationTable from './CalculationTable'; 
import OrdersQueueTable from './OrdersQueueTable'; 

export default function AdminDashboard() {
  const [menuItems, setMenuItems] = useState([]);
  const [activeOrders, setActiveOrders] = useState([]);
  const [cart, setCart] = useState({});
  
  // Ticket Number Configurations
  const [manualTicketNum, setManualTicketNum] = useState('');
  const [ticketError, setTicketError] = useState('');

  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  async function fetchFoodItems() {
    const { data, error } = await supabase.from('food_items').select('*').order('name', { ascending: true });
    if (!error && data) setMenuItems(data);
  }

  async function fetchActiveOrders() {
    const { data, error } = await supabase
      .from('meal_orders')
      .select('*')
      .in('status', ['PREPARING', 'NOW SERVING'])
      .order('created_at', { ascending: true });
    if (!error && data) setActiveOrders(data);
  }

  useEffect(() => {
    fetchFoodItems();
    fetchActiveOrders();
    const channel = supabase.channel('admin:meal_orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'meal_orders' }, () => { fetchActiveOrders(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const updateOrderStatus = async (orderId, nextStatus) => {
    // FIX: Standardize incoming state codes to ensure they aren't lost from real-time queues
    const standardizedStatus = String(nextStatus).toUpperCase().trim();
    
    const { error } = await supabase
      .from('meal_orders')
      .update({ status: standardizedStatus })
      .eq('id', orderId);
      
    if (!error) fetchActiveOrders();
  };

  const handleConfirmAddItem = async () => {
    const { error } = await supabase.from('food_items').insert([{ name, price: parseFloat(price), image_url: imageUrl || null }]);
    if (!error) {
      setName(''); setPrice(''); setImageUrl(''); setShowAddModal(false);
      fetchFoodItems();
    }
  };

  const toggleAvailability = async (id, currentStatus) => {
    const { error } = await supabase.from('food_items').update({ is_available: !currentStatus }).eq('id', id);
    if (!error) fetchFoodItems();
  };

  const addToCart = (id) => setCart(p => ({ ...p, [id]: (p[id] || 0) + 1 }));
  const removeFromCart = (id) => setCart(p => { const u = { ...p }; if (u[id] <= 1) delete u[id]; else u[id] -= 1; return u; });
  
  const subtotal = Object.keys(cart).reduce((sum, id) => {
    const item = menuItems.find(m => String(m.id) === String(id));
    return sum + (item ? parseFloat(item.price) * cart[id] : 0);
  }, 0);

  const compileCartSummary = () => {
    return Object.keys(cart).map(id => {
      const item = menuItems.find(m => String(m.id) === String(id));
      return item ? `${cart[id]}x ${item.name}` : '';
    }).filter(Boolean).join(', ');
  };

  const handleOrderSubmissionClick = () => {
    setTicketError('');
    setManualTicketNum('');
    setShowOrderModal(true);
  };

  const submitOrder = async () => {
    const cleanedTicketNum = manualTicketNum.trim();
    
    if (!cleanedTicketNum) {
      setTicketError('Please provide a specific ticket index number.');
      return;
    }

    const isTicketInUse = activeOrders.some(
      order => String(order.order_number) === String(cleanedTicketNum)
    );

    if (isTicketInUse) {
      setTicketError(`Ticket Number #${cleanedTicketNum} is currently active in the kitchen workspace.`);
      return;
    }

    const summaryStr = compileCartSummary();

    const { error } = await supabase.from('meal_orders').insert([{ 
      order_number: cleanedTicketNum, 
      subtotal: subtotal, 
      total: subtotal, 
      status: 'PREPARING',
      items_summary: summaryStr 
    }]);

    if (!error) { 
      setShowOrderModal(false); 
      setCart({}); 
      setManualTicketNum('');
      fetchActiveOrders(); 
    } else {
      console.error("Supabase Payload Error:", error);
      setTicketError(`Backend Code ${error.code}: ${error.message} (${error.details || 'No details'})`);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto font-sans bg-stone-50 min-h-screen text-gray-800">
      <div className="flex justify-between items-center mb-8 border-b pb-4 border-stone-200">
        <h1 className="text-3xl font-black text-[#1a2e1a] tracking-tight">Kuya Weng's Staff Portal</h1>
        <span className="bg-[#1a2e1a] text-yellow-400 text-xs font-bold px-3 py-1 rounded-full uppercase">Secure POS Session</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <MenuManagement 
          menuItems={menuItems} name={name} setName={setName} price={price} setPrice={setPrice} imageUrl={imageUrl} setImageUrl={setImageUrl}
          handleAddPrompt={(e) => { e.preventDefault(); setShowAddModal(true); }} toggleAvailability={toggleAvailability} addToCart={addToCart}
        />
        <CalculationTable cart={cart} menuItems={menuItems} removeFromCart={removeFromCart} subtotal={subtotal} setShowOrderModal={handleOrderSubmissionClick} />
      </div>

      <OrdersQueueTable activeOrders={activeOrders} updateOrderStatus={updateOrderStatus} />

      {/* Confirmation Window for Item Creation */}
      {showAddModal && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[2rem] shadow-2xl max-w-md w-full p-8 border border-stone-100">
            <h3 className="text-xl font-bold text-[#1a2e1a] mb-2">Confirm New Menu Item</h3>
            <div className="flex space-x-3">
              <button onClick={() => setShowAddModal(false)} className="flex-1 py-3 border border-stone-200 rounded-xl text-stone-500 text-sm font-bold">Go Back</button>
              <button onClick={handleConfirmAddItem} className="flex-1 py-3 bg-[#1a2e1a] text-white rounded-xl text-sm font-bold">Confirm Add</button>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Modal handling manual assigned inputs */}
      {showOrderModal && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[2rem] shadow-2xl max-w-md w-full p-8 border border-stone-100">
            <h3 className="text-xl font-bold text-[#1a2e1a] mb-1">Assign Ticket Number</h3>
            <p className="text-stone-500 text-xs mb-4 leading-relaxed">
              Manually assign a workspace number identifier (e.g., table number, pager ID, or custom card index).
            </p>

            <div className="mb-4">
              <label className="block text-[10px] uppercase tracking-wider font-bold text-stone-400 mb-1">Ticket / Card Number</label>
              <input 
                type="text" 
                maxLength={6}
                placeholder="Ex: 57" 
                value={manualTicketNum}
                onChange={(e) => setManualTicketNum(e.target.value.replace(/\D/g, ''))} 
                className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-lg font-black font-mono tracking-wide focus:outline-none focus:ring-2 focus:ring-[#1a2e1a]/20"
              />
              {ticketError && (
                <p className="text-red-500 text-xs font-bold mt-2 bg-red-50 p-2 rounded-lg border border-red-100">
                  ⚠️ {ticketError}
                </p>
              )}
            </div>

            <div className="bg-stone-50 p-3 rounded-xl mb-6 text-xs text-stone-600 border border-stone-100">
              <span className="font-bold block uppercase text-[10px] text-stone-400 mb-0.5">Order Preview:</span>
              <span className="italic line-clamp-2">{compileCartSummary() || "Empty Order Cart"}</span>
            </div>

            <div className="flex space-x-3">
              <button 
                onClick={() => setShowOrderModal(false)} 
                className="flex-1 py-3 border border-stone-200 rounded-xl text-stone-500 hover:bg-stone-50 text-sm font-bold transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={submitOrder} 
                className="flex-1 py-3 bg-[#1a2e1a] hover:bg-orange-600 text-white rounded-xl text-sm font-bold transition-all shadow-md"
              >
                Dispatch Ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}