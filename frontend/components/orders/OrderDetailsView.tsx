import { useState, useEffect } from 'react';
import { Loader2, ChevronLeft, Truck, Receipt, Star, CheckCircle2 } from 'lucide-react';
import { Order, Delivery } from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

interface OrderDetailsProps {
  orderId: string;
  onBack: () => void;
  token: string;
}

export default function OrderDetailsView({ orderId, onBack, token }: OrderDetailsProps) {
  const [order, setOrder] = useState<Order | null>(null);
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [loading, setLoading] = useState(true);

  // --- RATING STATE ---
  const [ratings, setRatings] = useState({ order: 0, restaurant: 0 });
  const [reviews, setReviews] = useState({ order: "", restaurant: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [ratingError, setRatingError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/orders/${orderId}`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) setOrder(await res.json());
        
        // Fetch Delivery
        try {
           const dRes = await fetch(`${API_BASE}/api/deliveries/${orderId}`, { headers: { Authorization: `Bearer ${token}` } });
           if (dRes.ok) setDelivery(await dRes.json());
        } catch(e) {}

        // Check if already rated
        try {
           const rateRes = await fetch(`${API_BASE}/api/ratings/order/${orderId}`, { headers: { Authorization: `Bearer ${token}` } });
           if (rateRes.status === 200) { 
             setIsSubmitted(true); 
           }
        } catch(e) {
          console.error('Error checking rating status:', e);
        }

      } catch (err) { console.error(err); } 
      finally { setLoading(false); }
    };
    fetchData();
  }, [orderId, token]);

  const handleSubmitRating = async () => {
    if (ratings.order === 0 || ratings.restaurant === 0) {
      setRatingError("Please select both ratings");
      return;
    }
    
    setIsSubmitting(true);
    setRatingError("");
    try {
      const payload = {
        orderId,
        restaurantId: order?.restaurantId,
        orderRating: ratings.order,
        orderReview: reviews.order,
        restaurantRating: ratings.restaurant,
        restaurantReview: reviews.restaurant
      };

      const res = await fetch(`${API_BASE}/api/ratings`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to submit rating");
      }
      
      setIsSubmitted(true);
    } catch (err: any) {
      setRatingError(err.message || "Failed to submit rating. Please try again.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const ProgressBar = ({ status }: { status: string }) => {
    const steps = ['Placed', 'Preparing', 'On Way', 'Delivered'];
    let step = 0;
    if (status === 'completed') step = 4;
    else if (delivery?.status === 'on_the_way') step = 2;
    else if (delivery?.status === 'assigned') step = 1;

    return (
      <div className="w-full py-6">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-100 -z-10"></div>
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-green-500 -z-10 transition-all duration-1000" style={{ width: `${(step / 3) * 100}%` }}></div>
          {steps.map((label, idx) => (
             <div key={idx} className="flex flex-col items-center gap-2 bg-white px-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-4 text-xs font-bold ${idx <= step ? 'bg-green-500 border-green-500 text-white' : 'bg-slate-100 text-slate-300'}`}>
                   {idx + 1}
                </div>
                <span className="text-[10px] uppercase font-bold text-slate-400">{label}</span>
             </div>
          ))}
        </div>
      </div>
    );
  };

  // Helper Component for Star Inputs
  const StarInput = ({ value, onChange, label }: { value: number, onChange: (v: number) => void, label: string }) => (
    <div className="mb-4">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{label}</p>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => onChange(star)}
            className="transition-transform hover:scale-110 focus:outline-none"
          >
            <Star 
              size={28} 
              className={`${star <= value ? 'fill-yellow-400 text-yellow-400' : 'text-slate-200'} transition-colors`} 
            />
          </button>
        ))}
      </div>
    </div>
  );

  if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-orange-600"/></div>;
  if (!order) return <div className="p-10 text-center text-red-500">Order not found</div>;

  return (
    <div className="animate-in slide-in-from-right-4 duration-300">
       <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-orange-600 font-bold mb-6">
          <ChevronLeft size={20} /> Back to List
       </button>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* --- LEFT COLUMN: DETAILS & RATING --- */}
          <div className="lg:col-span-2 space-y-6">
             {/* Status Card */}
             <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <div className="flex justify-between mb-6">
                   <h2 className="text-xl font-bold text-slate-900">Order #{order._id.slice(-6).toUpperCase()}</h2>
                   <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold capitalize">{order.deliveryStatus}</span>
                </div>
                <ProgressBar status={order.deliveryStatus} />
             </div>

             {/* Items List */}
             <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <h3 className="font-bold text-lg mb-4">Items</h3>
                <div className="divide-y divide-slate-50">
                   {order.items.map((item, idx) => (
                      <div key={idx} className="py-3 flex justify-between">
                         <div className="flex gap-3">
                            <div className="w-6 h-6 bg-orange-100 text-orange-700 rounded flex items-center justify-center text-xs font-bold">{item.quantity}x</div>
                            <span className="font-medium text-slate-700">{item.name}</span>
                         </div>
                         <span className="font-bold text-slate-900">₹{(item.price * item.quantity).toFixed(0)}</span>
                      </div>
                   ))}
                </div>
             </div>

             {/* --- RATING SECTION --- */}
             {order.deliveryStatus === 'completed' && (
               <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
                 {isSubmitted ? (
                   <div className="text-center py-6">
                     <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                       <CheckCircle2 className="text-green-600 w-8 h-8" />
                     </div>
                     <h3 className="text-xl font-bold text-slate-900">Thank you for your feedback!</h3>
                     <p className="text-slate-500">Your review helps us improve.</p>
                   </div>
                 ) : (
                   <>
                     <h3 className="font-bold text-lg text-slate-900 mb-6">Rate your Experience</h3>
                     
                     {ratingError && (
                       <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 font-medium">
                         {ratingError}
                       </div>
                     )}
                     
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                       {/* Delivery Rating */}
                       <div>
                         <StarInput 
                            label="Delivery Experience" 
                            value={ratings.order} 
                            onChange={(v) => setRatings({...ratings, order: v})} 
                         />
                         <textarea 
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-200 resize-none"
                            placeholder="How was the delivery?"
                            rows={3}
                            value={reviews.order}
                            onChange={(e) => setReviews({...reviews, order: e.target.value})}
                         />
                       </div>

                       {/* Restaurant Rating */}
                       <div>
                         <StarInput 
                            label="Food & Restaurant" 
                            value={ratings.restaurant} 
                            onChange={(v) => setRatings({...ratings, restaurant: v})} 
                         />
                         <textarea 
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-200 resize-none"
                            placeholder="How was the food?"
                            rows={3}
                            value={reviews.restaurant}
                            onChange={(e) => setReviews({...reviews, restaurant: e.target.value})}
                         />
                       </div>
                     </div>

                     <button 
                        onClick={handleSubmitRating}
                        disabled={isSubmitting || ratings.order === 0 || ratings.restaurant === 0}
                        className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-black transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                     >
                        {isSubmitting && <Loader2 className="animate-spin w-4 h-4" />}
                        {isSubmitting ? "Submitting..." : "Submit Review"}
                     </button>
                   </>
                 )}
               </div>
             )}
          </div>

          {/* --- RIGHT COLUMN: INFO --- */}
          <div className="space-y-6">
             {delivery && (
                <div className="bg-slate-900 text-white p-6 rounded-2xl relative overflow-hidden">
                   <div className="relative z-10">
                      <p className="text-xs font-bold text-slate-400 uppercase mb-2">Driver</p>
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center"><Truck size={20}/></div>
                         <div><p className="font-bold">{delivery.driverName}</p><p className="text-green-400 text-xs">Assigned</p></div>
                      </div>
                   </div>
                </div>
             )}
             
             <div className="bg-white p-6 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-2 mb-4"><Receipt size={18} className="text-orange-600"/><h3 className="font-bold">Bill Details</h3></div>
                <div className="space-y-2 text-sm text-slate-600 mb-4">
                   <div className="flex justify-between"><span>Subtotal</span><span>₹{order.totalAmount}</span></div>
                   <div className="flex justify-between"><span>Tax (5%)</span><span>₹{(order.totalAmount * 0.05).toFixed(0)}</span></div>
                   <div className="flex justify-between"><span>Delivery</span><span>₹50</span></div>
                </div>
                <div className="border-t pt-3 flex justify-between font-black text-slate-900">
                   <span>Total</span><span>₹{(order.totalAmount * 1.05 + 50).toFixed(0)}</span>
                </div>
             </div>
          </div>
       </div>
    </div>
  );
}

