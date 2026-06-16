"use client";

export default function OrdersQueueTable({ activeOrders, updateOrderStatus, title = "Live Active Orders Dashboard Queue" }) {
  return (
    <div className="mt-8 bg-white p-6 rounded-[2rem] shadow-sm border border-stone-100">
      <h2 className="text-xl font-bold text-[#1a2e1a] mb-4">{title}</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-stone-100 text-sm">
          <thead className="bg-stone-50 text-stone-500 font-bold">
            <tr>
              <th className="px-6 py-3 text-left text-xs uppercase">Ticket ID</th>
              <th className="px-6 py-3 text-left text-xs uppercase">Total Bill</th>
              <th className="px-6 py-3 text-left text-xs uppercase">Current Status</th>
              <th className="px-6 py-3 text-right text-xs uppercase">Queue Controls</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {activeOrders.map(order => (
              <tr key={order.id} className="hover:bg-stone-50 transition-colors">
                <td className="px-6 py-4 font-mono font-black text-[#1a2e1a] text-lg">
                  #{order.order_number}
                </td>
                <td className="px-6 py-4 font-mono font-bold text-stone-600">
                  ₱{parseFloat(order.total).toFixed(2)}
                </td>
                <td className="px-6 py-4">
                  {/* Updated badge coloring logic to look for 'PREPARING' */}
                  <span className={`px-3 py-1 text-xs font-black rounded-full uppercase tracking-wider border ${
                    order.status === 'PREPARING' ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-green-50 text-green-700 border-green-200'
                  }`}>
                    {order.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  {/* FIX: Changed condition from 'ORDERS' to 'PREPARING' to match new DB structure */}
                  {order.status === 'PREPARING' ? (
                    <button onClick={() => updateOrderStatus(order.id, 'NOW SERVING')} className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all">
                      Serve Now &rarr;
                    </button>
                  ) : (
                    <button onClick={() => updateOrderStatus(order.id, 'COMPLETED')} className="bg-green-600 hover:bg-green-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all">
                      ✓ Mark Completed
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {activeOrders.length === 0 && (
              <tr>
                <td colSpan="4" className="text-center py-8 text-stone-400 italic">No active orders found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}