"use client";

export default function MenuManagement({ 
  menuItems, name, setName, price, setPrice, imageUrl, setImageUrl, 
  handleAddPrompt, toggleAvailability, addToCart 
}) {
  return (
    <div className="lg:col-span-2 bg-white p-6 rounded-[2rem] shadow-sm border border-stone-100">
      <h2 className="text-xl font-bold text-[#1a2e1a] mb-4">Add Menu & POS Selection</h2>
      
      <form onSubmit={handleAddPrompt} className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6 bg-stone-50 p-4 rounded-2xl">
        <input 
          type="text" placeholder="Food Name" value={name} 
          onChange={e => setName(e.target.value)} required 
          className="p-3 rounded-xl bg-white text-sm outline-none ring-1 ring-stone-200 focus:ring-2 focus:ring-orange-500/20 text-gray-900" 
        />
        <input 
          type="number" step="0.01" placeholder="Price (₱)" value={price} 
          onChange={e => setPrice(e.target.value)} required 
          className="p-3 rounded-xl bg-white text-sm outline-none ring-1 ring-stone-200 focus:ring-2 focus:ring-orange-500/20 text-gray-900" 
        />
        <input 
          type="url" placeholder="Image URL (Optional)" value={imageUrl} 
          onChange={e => setImageUrl(e.target.value)} 
          className="p-3 rounded-xl bg-white text-sm outline-none ring-1 ring-stone-200 focus:ring-2 focus:ring-orange-500/20 text-gray-900" 
        />
        <button type="submit" className="bg-[#1a2e1a] hover:bg-orange-600 text-white font-bold p-3 rounded-xl text-sm transition-all shadow-md">
          Add Item
        </button>
      </form>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-stone-100">
          <thead className="bg-stone-50 text-stone-500 font-bold">
            <tr>
              <th className="px-4 py-3 text-left text-xs uppercase">Item</th>
              <th className="px-4 py-3 text-left text-xs uppercase">Price</th>
              <th className="px-4 py-3 text-left text-xs uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs uppercase">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 text-sm">
            {menuItems.map(item => (
              <tr key={item.id} className={!item.is_available ? 'bg-stone-50 opacity-60' : ''}>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center space-x-3">
                    <img src={item.image_url || 'https://via.placeholder.com/50'} className="w-12 h-12 object-cover rounded-xl border border-stone-200" alt="" />
                    <span className="font-bold text-stone-800">{item.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap font-mono font-bold text-stone-600">
                  ₱{parseFloat(item.price).toFixed(2)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <button 
                    onClick={() => toggleAvailability(item.id, item.is_available)} 
                    className={`px-3 py-1 text-xs font-bold rounded-full border transition-colors ${
                      item.is_available ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
                    }`}
                  >
                    {item.is_available ? 'Available' : 'Unavailable'}
                  </button>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <button 
                    onClick={() => addToCart(item.id)} disabled={!item.is_available} 
                    className="bg-orange-50 hover:bg-orange-100 text-orange-600 disabled:opacity-0 font-bold px-4 py-1.5 rounded-xl border border-orange-200 text-xs transition-colors"
                  >
                    + Add to Order
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}