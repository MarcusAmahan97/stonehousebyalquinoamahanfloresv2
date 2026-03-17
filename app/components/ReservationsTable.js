"use client";
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function ReservationsTable({ searchTerm }) {
  const [masterList, setMasterList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDetails, setSelectedDetails] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [confirmPayment, setConfirmPayment] = useState(null);

  useEffect(() => {
    fetchReservations();
  }, []);

  const statusOrder = {
    'Pending': 1,
    'Pending Payment': 2,
    'Confirmed': 3,
    'Fully Paid': 4,
    'Checked In': 5,
    'Checked Out': 6,
    'Completed': 7
  };

  async function fetchReservations() {
    try {
      setLoading(true);
      const [resResponse, visitsResponse] = await Promise.all([
        supabase.from('reservations').select(`
          *,
          customers(full_name),
          room_bookings(room_type),
          event_bookings(event_name, event_status)
        `),
        supabase.from('visits').select('*, customers(full_name)')
      ]);

      if (resResponse.error) throw resResponse.error;
      if (visitsResponse.error) throw visitsResponse.error;

      const reservations = resResponse.data || [];
      const allVisits = visitsResponse.data || [];

      // 1. Map Reservations (Stay/Event)
      const mappedReservations = reservations.map(res => ({
        ...res,
        id: res.reservation_id, // Normalize ID
        displayName: res.customers?.full_name || res.reserved_for || "Unknown Guest",
        isOrphanVisit: false,
        sourceTable: 'reservations',
        total_price: res.total || 0,
        downpayment: res.downpayment || 0,
        balance: res.balance !== undefined ? res.balance : (res.total || 0),
        eventStatus: res.event_bookings?.[0]?.event_status,
        linkedVisits: allVisits.filter(v => v.reservation_id === res.reservation_id)
      }));

      // 2. Map Day Visits (From 'visits' table)
      const orphanVisits = allVisits.filter(v =>
        !reservations.some(res => res.reservation_id === v.reservation_id)
      ).map(v => ({
        id: v.visit_id, // Map visit_id to id
        reservation_id: v.visit_id,
        displayName: v.customers?.full_name || v.full_name || "Walk-in Guest",
        reservation_status: v.status || 'Confirmed',
        purpose: v.visit_type || "Day Visit",
        total_price: v.total_price || 0,
        balance: v.balance || 0,
        downpayment: 0,
        isOrphanVisit: true,
        sourceTable: 'visits',
        customer_reservation_date: v.visit_date || v.created_at
      }));

      const combined = [...mappedReservations, ...orphanVisits].sort((a, b) => {
        const weightA = statusOrder[a.reservation_status] || 99;
        const weightB = statusOrder[b.reservation_status] || 99;
        if (weightA !== weightB) return weightA - weightB;
        return new Date(b.customer_reservation_date) - new Date(a.customer_reservation_date);
      });

      setMasterList(combined);
    } catch (err) {
      console.error("Fetch Error:", err.message);
    } finally {
      setLoading(false);
    }
  }

  const getBookingType = (res) => {
    if (res.isOrphanVisit || res.linkedVisits?.length > 0) return "Day Visit";
    if (res.room_bookings?.length > 0) return "Stay";
    if (res.event_bookings?.length > 0) return "Event";
    return "Other";
  };

  const handlePayment = async () => {
    if (!confirmPayment || !confirmPayment.id) {
        alert("Error: Payment ID is missing.");
        return;
    }

    const bType = getBookingType(selectedDetails);

    if (bType === 'Event' && (!selectedDetails.eventStatus || selectedDetails.eventStatus === 'Pending')) {
        alert("Payments cannot be processed for unaccepted event inquiries.");
        return;
    }

    const amount = parseFloat(paymentAmount);
    const newBalance = Math.max(0, confirmPayment.currentBalance - amount);
    let newStatus = confirmPayment.status;

    if (newBalance <= 0) {
        if (bType === 'Event') {
            newStatus = selectedDetails.eventStatus === 'Finished' ? 'Completed' : 'Fully Paid';
        } else if (bType === 'Stay') {
            newStatus = ['Checked In', 'Checked Out'].includes(confirmPayment.status) ? 'Completed' : 'Fully Paid';
        } else {
            newStatus = 'Completed';
        }
    }

    try {
        const table = confirmPayment.sourceTable;
        const idField = table === 'visits' ? 'visit_id' : 'reservation_id';
        
        const updatePayload = table === 'visits'
            ? { balance: newBalance, status: newStatus }
            : { balance: newBalance, reservation_status: newStatus };

        const { error } = await supabase.from(table).update(updatePayload).eq(idField, confirmPayment.id);
        if (error) throw error;

        setConfirmPayment(null);
        setPaymentAmount("");
        setIsDetailsOpen(false);
        fetchReservations();
    } catch (err) {
        alert("Payment failed: " + err.message);
    }
  };

  const filteredReservations = masterList.filter(res => {
    const name = res.displayName?.toLowerCase() || "";
    const type = getBookingType(res).toLowerCase();
    const search = searchTerm.toLowerCase();
    return name.includes(search) || type.includes(search);
  });

  const selectedType = selectedDetails ? getBookingType(selectedDetails) : null;
  const isEvent = selectedType === 'Event';
  const isDayVisit = selectedType === 'Day Visit';
  const isApproved = selectedDetails?.eventStatus && selectedDetails.eventStatus !== 'Pending';
  const currentBalance = selectedDetails?.balance || 0;
  const totalPrice = selectedDetails?.total_price || 0;
  const downpaymentThreshold = selectedDetails?.downpayment || 0;
  const amountPaidTotalSoFar = Math.max(0, totalPrice - currentBalance);
  const remainingDownpayment = isDayVisit ? 0 : Math.max(0, downpaymentThreshold - amountPaidTotalSoFar);
  const shouldShowDownpayment = !isDayVisit && downpaymentThreshold > 0 && remainingDownpayment > 0;
  const enteredAmount = parseFloat(paymentAmount) || 0;
  const isInvalidAmount = enteredAmount <= 0 || enteredAmount > currentBalance;
  const canPay = isEvent ? (isApproved && !isInvalidAmount) : !isInvalidAmount;

  if (loading) return (
    <div className="p-20 text-center text-stone-400 animate-pulse font-black uppercase text-[10px] tracking-widest">
      Synchronizing Payments...
    </div>
  );

  return (
    <div className="relative">
      <div className="bg-white rounded-[2.5rem] border border-stone-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-stone-50 border-b border-stone-100">
            <tr>
              <th className="px-8 py-5 text-[10px] uppercase font-black text-stone-400 tracking-widest">Guest Name</th>
              <th className="px-8 py-5 text-[10px] uppercase font-black text-stone-400 tracking-widest text-center">Type</th>
              <th className="px-8 py-5 text-[10px] uppercase font-black text-stone-400 tracking-widest">Balance</th>
              <th className="px-8 py-5 text-[10px] uppercase font-black text-stone-400 tracking-widest text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-50">
            {filteredReservations.map((res) => {
              const bType = getBookingType(res);
              return (
                <tr key={`${res.sourceTable}-${res.id}`} className="hover:bg-stone-50/50 transition-colors">
                  <td className="px-8 py-6">
                    <p className="font-bold text-[#1a2e1a] text-sm uppercase">{res.displayName}</p>
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                      res.reservation_status === 'Completed' || res.reservation_status === 'Fully Paid'
                      ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'
                    }`}>
                      {res.reservation_status}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-tighter ${
                      bType === 'Day Visit' ? 'bg-amber-50 text-amber-600' :
                      bType === 'Event' ? 'bg-purple-50 text-purple-600' :
                      bType === 'Stay' ? 'bg-blue-50 text-blue-600' : 'bg-stone-100 text-stone-500'
                    }`}>
                      {bType}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-xs font-bold text-[#1a2e1a]">₱{(res.balance || 0).toLocaleString()}</td>
                  <td className="px-8 py-6 text-right">
                    <button onClick={() => { setSelectedDetails(res); setIsDetailsOpen(true); }} className="bg-stone-100 text-stone-600 px-4 py-2 rounded-xl text-[10px] font-bold uppercase hover:bg-stone-200 transition-all">Payment Details</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {isDetailsOpen && selectedDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md h-screen bg-white shadow-2xl p-10 flex flex-col overflow-y-auto">
            <div className="flex justify-between items-center mb-10">
              <span className="text-[10px] font-black uppercase text-stone-400 tracking-widest">Financial Summary</span>
              <button onClick={() => { setIsDetailsOpen(false); setPaymentAmount(""); }} className="text-stone-400 hover:text-red-500 font-bold text-[10px] uppercase">✕ Close</button>
            </div>
            
            <h3 className="text-3xl font-black text-[#1a2e1a] uppercase tracking-tighter mb-2">{selectedDetails.displayName}</h3>
            <p className="text-orange-600 text-[10px] font-black uppercase mb-8">
              {isEvent ? `EVENT STATUS: ${selectedDetails.eventStatus || 'PENDING'}` : (selectedDetails.purpose || "RESERVATION")}
            </p>
            
            <div className="space-y-3 mb-8">
                <div className="p-6 rounded-[2rem] border bg-[#1a2e1a] border-stone-800 text-white shadow-xl">
                  <p className="text-[10px] font-black opacity-60 uppercase mb-1">Total Remaining Balance</p>
                  <p className="text-3xl font-black">₱{currentBalance.toLocaleString()}</p>
                </div>
                
                {shouldShowDownpayment && (
                  <div className="p-5 rounded-2xl border border-amber-100 bg-amber-50 flex justify-between items-center">
                    <div>
                      <p className="text-[9px] font-black text-amber-600 uppercase">Requirement</p>
                      <p className="text-lg font-black text-amber-900">₱{downpaymentThreshold.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-black text-amber-600 uppercase">Remaining Downpayment</p>
                      <p className="text-lg font-black text-amber-900 underline decoration-amber-300 decoration-2">₱{remainingDownpayment.toLocaleString()}</p>
                    </div>
                  </div>
                )}

                <div className="p-6 rounded-[2rem] border bg-stone-50 border-stone-100">
                  <div className="flex justify-between items-center mb-2">
                      <p className="text-[10px] font-black text-stone-400 uppercase">Original Price</p>
                      <p className="text-xs font-bold text-stone-500">₱{totalPrice.toLocaleString()}</p>
                  </div>
                  <div className="flex justify-between items-center">
                      <p className="text-[10px] font-black text-stone-400 uppercase">Total Paid So Far</p>
                      <p className="text-xs font-bold text-emerald-600">₱{amountPaidTotalSoFar.toLocaleString()}</p>
                  </div>
                </div>
            </div>

            {currentBalance > 0 ? (
              <div className="space-y-4">
                {isEvent && !isApproved ? (
                  <div className="p-6 bg-red-50 border border-red-100 rounded-[2rem] text-center shadow-sm">
                    <p className="text-[10px] font-black text-red-600 uppercase tracking-widest">Inquiry Only</p>
                    <p className="text-[8px] text-red-400 mt-2 uppercase leading-relaxed">Payments are disabled until accepted.</p>
                  </div>
                ) : (
                  <>
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-2">Submit Payment</label>
                    <input
                      type="number"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className="w-full p-5 bg-stone-50 border-2 border-stone-100 rounded-2xl font-bold outline-none focus:border-[#1a2e1a] transition-all"
                      placeholder="Enter Amount..."
                    />
                    <button
                      disabled={!canPay}
                      onClick={() => setConfirmPayment({
                        id: selectedDetails.id,
                        name: selectedDetails.displayName,
                        currentBalance: selectedDetails.balance,
                        status: selectedDetails.reservation_status,
                        sourceTable: selectedDetails.sourceTable
                      })}
                      className={`w-full py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${
                        canPay ? 'bg-[#1a2e1a] text-white hover:scale-[1.02] shadow-lg shadow-stone-200' : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                      }`}
                    >
                      {isInvalidAmount && enteredAmount > 0 ? "Check Amount" : "Apply Payment"}
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div className="bg-emerald-50 border border-emerald-100 rounded-[2rem] p-8 text-center">
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Account Fully Settled</p>
              </div>
            )}
          </div>
        </div>
      )}

      {confirmPayment && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-10 shadow-2xl text-center">
            <h3 className="text-xl font-black text-[#1a2e1a] uppercase tracking-tight">Confirm Payment</h3>
            <p className="text-stone-500 text-sm mt-3">Applying ₱{enteredAmount.toLocaleString()} for {confirmPayment.name}.</p>
            <div className="grid grid-cols-2 gap-4 mt-10">
              <button onClick={() => setConfirmPayment(null)} className="py-4 bg-stone-100 text-stone-600 rounded-2xl font-bold text-[10px] uppercase">Cancel</button>
              <button onClick={handlePayment} className="py-4 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase">Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}