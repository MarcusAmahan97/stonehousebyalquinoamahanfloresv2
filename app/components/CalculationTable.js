"use client";

// CRITICAL: Ensure "export default function" is present right here
export default function CalculationTable({ cart, menuItems, removeFromCart, subtotal, setShowOrderModal }) {
  return (
    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-stone-100 h-fit sticky top-6">
      <h2 className="text-xl font-bold text-[#1a2e1a] mb-4">Calculation Panel</h2>
      <div className="overflow-x-auto mb-6">
        <table className="min-w-full text-sm">
          <thead className="border-b border-stone-100 text-stone-400 font-bold uppercase text-[11px]">
            <tr>
              <th className="text-left pb-2">Item</th>
              <th className="text-center pb-2">Qty</th>
              <th className="text-right pb-2">Total</th>
              <th className="text-right pb-2 w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-50">
            {Object.keys(cart).map(id => {
              const item = menuItems.find(m => String(m.id) === String(id));
              if (!item) return null;
              return (
                <tr key={id} className="text-stone-700 font-medium">
                  <td className="py-3 text-stone-800 font-bold">{item.name}</td>
                  <td className="py-3 text-center text-stone-500 font-mono">x{cart[id]}</td>
                  <td className="py-3 text-right font-mono font-bold text-stone-900">
                    ₱{(parseFloat(item.price) * cart[id]).toFixed(2)}
                  </td>
                  <td className="py-3 text-right">
                    <button onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-600 font-semibold px-1 text-xs rounded hover:bg-red-50">
                      Remove
                    </button>
                  </td>
                </tr>
              );
            })}
            {Object.keys(cart).length === 0 && (
              <tr>
                <td colSpan="4" className="text-center py-6 text-stone-400 italic">No items chosen yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="border-t border-stone-100 pt-4 space-y-2 text-sm">
        <div className="flex justify-between text-stone-500 font-medium">
          <span>Subtotal:</span>
          <span className="font-mono font-bold">₱{subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-lg font-black text-[#1a2e1a] border-b border-stone-100 pb-4">
          <span>Total Bill:</span>
          <span className="font-mono">₱{subtotal.toFixed(2)}</span>
        </div>
        <button 
          onClick={() => setShowOrderModal(true)} disabled={subtotal === 0} 
          className="w-full mt-4 bg-[#1a2e1a] hover:bg-orange-600 disabled:bg-stone-200 disabled:text-stone-400 text-white font-bold py-4 rounded-2xl shadow-xl transition-all"
        >
          Proceed with Order
        </button>
      </div>
    </div>
  );
}