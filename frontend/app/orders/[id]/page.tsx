"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  CheckCircle2, Clock, Truck, MapPin, Loader2, Star, 
  ChevronLeft, Receipt, Phone, MessageSquare, ShoppingBag, 
  Utensils, ChefHat, Bike
} from "lucide-react";
import { useRequireAuth } from "@/hooks/useRequireAuth";

// --- CONFIG ---
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

// --- TYPES ---
interface OrderItem { name: string; quantity: number; price: number; }
interface Order {
  _id: string; restaurantId: string; items: OrderItem[];
  totalAmount: number; paymentStatus: "pending" | "paid" | "failed";
  deliveryStatus: "pending" | "completed" | "cancelled"; createdAt: string;
}
interface Delivery {
  _id: string; driverName: string; status: "assigned" | "picked_up" | "on_the_way" | "delivered";
  location: { latitude: number; longitude: number };
}

export default function OrderTrackingPage() {
  const { user, loading: authLoading } = useRequireAuth();
  const params = useParams();
  const router = useRouter();
  const orderId = typeof params?.id === "string" ? params.id : "";

  // State
  const [order, setOrder] = useState<Order | null>(null);
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Rating State
  const [rating, setRating] = useState({ order: 0, restaurant: 0 });
  const [reviews, setReviews] = useState({ order: "", restaurant: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRated, setIsRated] = useState(false);

  // --- FETCHING ---
  useEffect(() => {
    if (authLoading || !user || !orderId) return;

      let cancelled = false;
      let pollTimeout: ReturnType<typeof setTimeout> | null = null;

      const clearPollTimeout = () => {
         if (pollTimeout) {
            clearTimeout(pollTimeout);
            pollTimeout = null;
         }
      };

      const isTerminal = (nextOrder: Order | null) => {
         if (!nextOrder) return false;
         return (
            nextOrder.deliveryStatus === "completed" ||
            nextOrder.deliveryStatus === "cancelled" ||
            nextOrder.paymentStatus === "failed"
         );
      };

      const getNextDelay = (nextOrder: Order | null, nextDelivery: Delivery | null) => {
         if (typeof document !== "undefined" && document.hidden) {
            return 15000;
         }

         if (isTerminal(nextOrder)) {
            return null;
         }

         if (nextDelivery?.status === "on_the_way" || nextDelivery?.status === "picked_up") {
            return 5000;
         }

         if (nextDelivery?.status === "assigned") {
            return 7000;
         }

         return 10000;
      };

    const fetchData = async () => {
         let nextOrder: Order | null = null;
         let nextDelivery: Delivery | null = null;

      try {
        const token = localStorage.getItem("token");
        const orderRes = await fetch(`${API_BASE}/api/orders/${orderId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!orderRes.ok) throw new Error("Order not found");
            nextOrder = await orderRes.json();
            if (!cancelled) {
               setOrder(nextOrder);
            }

        try {
          const delRes = await fetch(`${API_BASE}/api/deliveries/${orderId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
               if (delRes.ok) {
                  nextDelivery = await delRes.json();
                  if (!cancelled) {
                     setDelivery(nextDelivery);
                  }
               }
        } catch (e) {}

        try {
          const rateRes = await fetch(`${API_BASE}/api/ratings/order/${orderId}`);
          if (rateRes.ok) setIsRated(true);
        } catch (e) {}

            if (!cancelled) {
               setLoading(false);
            }

            return { nextOrder, nextDelivery };
      } catch (err: any) {
            if (!cancelled) {
               setError(err.message);
               setLoading(false);
            }
            return { nextOrder: null, nextDelivery: null };
      }
    };

      const poll = async () => {
         if (cancelled) return;

         const { nextOrder, nextDelivery } = await fetchData();
         if (cancelled) return;

         const nextDelay = getNextDelay(nextOrder, nextDelivery);
         if (nextDelay == null) {
            return;
         }

         pollTimeout = setTimeout(poll, nextDelay);
      };

      const onVisibilityChange = () => {
         if (cancelled) return;
         if (!document.hidden) {
            clearPollTimeout();
            poll();
         }
      };

      poll();
      document.addEventListener("visibilitychange", onVisibilityChange);

      return () => {
         cancelled = true;
         clearPollTimeout();
         document.removeEventListener("visibilitychange", onVisibilityChange);
      };
  }, [authLoading, user, orderId]);

  // --- HANDLERS ---
  const handleSubmitRating = async () => {
    if (!rating.order || !rating.restaurant) return;
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      await fetch(`${API_BASE}/api/ratings`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          orderId, restaurantId: order!.restaurantId,
          orderRating: rating.order, orderReview: reviews.order,
          restaurantRating: rating.restaurant, restaurantReview: reviews.restaurant
        }),
      });
      setIsRated(true);
    } catch (e) { alert("Failed to submit"); } 
    finally { setIsSubmitting(false); }
  };

  // --- HELPER: DETERMINE CURRENT STEP ---
  const getProgressStep = () => {
    if (!order) return 0;
    if (order.deliveryStatus === 'completed') return 4; // Delivered
    if (delivery?.status === 'on_the_way' || delivery?.status === 'picked_up') return 3; // On Way
    if (delivery?.status === 'assigned') return 2; // Driver Assigned
    return 1; // Preparing (Default if pending)
  };

  const currentStep = getProgressStep();

  // --- COMPONENTS ---
  const ProgressBar = () => {
    const steps = [
      { id: 1, label: 'Cooking', icon: ChefHat },
      { id: 2, label: 'Driver', icon: Truck },
      { id: 3, label: 'On Way', icon: Bike },
      { id: 4, label: 'Delivered', icon: CheckCircle2 },
    ];
    
    // Percentage for the progress line (0% to 100%)
    const progressPercent = Math.max(0, Math.min(100, ((currentStep - 1) / 3) * 100));

    return (
      <div className="relative py-6 px-2">
        {/* Gray Background Line */}
        <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-1 bg-slate-100 -z-10 rounded-full"></div>
        
        {/* Active Orange Line */}
        <div 
           className="absolute left-4 top-1/2 -translate-y-1/2 h-1 bg-orange-500 -z-10 rounded-full transition-all duration-1000 ease-out"
           style={{ width: `${progressPercent}%` }}
        ></div>

        <div className="flex justify-between relative">
          {steps.map((step) => {
            const isCompleted = step.id < currentStep;
            const isCurrent = step.id === currentStep;
            
            return (
              <div key={step.id} className="flex flex-col items-center gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center border-4 transition-all duration-500 z-10 bg-white ${
                  isCompleted ? 'border-green-500 text-green-600' :
                  isCurrent ? 'border-orange-500 text-orange-600 shadow-[0_0_0_4px_rgba(249,115,22,0.2)] scale-110' :
                  'border-slate-100 text-slate-300'
                }`}>
                  {isCompleted ? <CheckCircle2 size={20} /> : <step.icon size={20} />}
                </div>
                <span className={`text-xs font-bold uppercase tracking-wider ${
                  isCurrent ? 'text-orange-600' : isCompleted ? 'text-green-600' : 'text-slate-300'
                }`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // --- UI RENDER ---

  if (loading) return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center gap-4">
      <Loader2 className="w-10 h-10 text-orange-600 animate-spin" />
      <p className="text-slate-500 font-medium">Tracking your order...</p>
    </div>
  );

  if (error || !order) return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-red-50 p-6 rounded-3xl mb-4">
         <Receipt className="w-12 h-12 text-red-500" />
      </div>
      <h2 className="text-2xl font-bold text-slate-900">Order Not Found</h2>
      <button onClick={() => router.push('/restaurants')} className="mt-6 text-orange-600 font-bold hover:underline">
        Go Home
      </button>
    </div>
  );

  const subtotal = order.totalAmount;
  const tax = Math.round(subtotal * 0.05);
  const deliveryFee = 50;
  const total = subtotal + tax + deliveryFee;

  // Determine Dynamic Hero Content based on Step
  const getHeroContent = () => {
    switch(currentStep) {
      case 1: return { title: "Preparing your food", subtitle: "The restaurant is working on your order.", color: "bg-orange-500" };
      case 2: return { title: "Driver Assigned", subtitle: `${delivery?.driverName || "A driver"} is heading to the restaurant.`, color: "bg-blue-600" };
      case 3: return { title: "Order on the way", subtitle: "Your food is out for delivery!", color: "bg-purple-600" };
      case 4: return { title: "Order Delivered", subtitle: "Enjoy your meal!", color: "bg-green-600" };
      default: return { title: "Order Placed", subtitle: "Waiting for confirmation...", color: "bg-slate-800" };
    }
  };
  
  const hero = getHeroContent();

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 pb-20">
      
      {/* 1. Header (Minimal) */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <button 
            onClick={() => router.push('/restaurants')} 
            className="flex items-center gap-2 text-slate-500 hover:text-orange-600 transition font-bold"
          >
            <ChevronLeft size={20} /> Back
          </button>
          <div className="text-xs font-bold bg-slate-100 px-3 py-1 rounded-full text-slate-500">
            #{order._id.slice(-6).toUpperCase()}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        
        {/* 2. DYNAMIC STATUS HERO */}
        <div className={`${hero.color} text-white rounded-[2.5rem] p-8 md:p-12 mb-10 shadow-xl transition-colors duration-500 relative overflow-hidden`}>
           <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
           <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                 <h1 className="text-3xl md:text-5xl font-black mb-2 tracking-tight">{hero.title}</h1>
                 <p className="text-white/80 text-lg font-medium">{hero.subtitle}</p>
              </div>
              {/* Optional: Add a large icon here representing the state */}
              <div className="hidden md:block opacity-20 transform scale-150">
                {currentStep === 4 ? <CheckCircle2 size={100}/> : <Clock size={100}/>}
              </div>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* --- LEFT COLUMN --- */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* 3. Improved Stepper */}
            <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm">
               <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-xl text-slate-900">Timeline</h3>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Live Updates</span>
               </div>
               <ProgressBar />
            </div>

            {/* 4. Order Items */}
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
               <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
                  <h3 className="font-bold text-lg text-slate-900">Order Details</h3>
                  <span className="text-xs font-bold bg-white border px-2 py-1 rounded text-slate-500">{order.items.length} Items</span>
               </div>
               <div className="p-6 space-y-4">
                  {order.items.map((item, idx) => (
                     <div key={idx} className="flex justify-between items-center group">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-sm font-bold text-orange-600 border border-orange-100 group-hover:scale-110 transition-transform">
                              {item.quantity}x
                           </div>
                           <div>
                              <p className="font-bold text-slate-800 text-lg">{item.name}</p>
                              <p className="text-xs text-slate-400">Standard Portion</p>
                           </div>
                        </div>
                        <p className="font-bold text-slate-900">₹{(item.price * item.quantity).toFixed(0)}</p>
                     </div>
                  ))}
               </div>
            </div>

            {/* 5. Rating Section */}
            {currentStep === 4 && !isRated && (
               <div className="bg-white rounded-[2rem] p-8 border border-orange-100 shadow-lg animate-in slide-in-from-bottom-4">
                  <div className="text-center mb-8">
                     <h3 className="text-2xl font-black text-slate-900 mb-2">How was your meal?</h3>
                     <p className="text-slate-500">Your feedback helps us improve.</p>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-8">
                     {/* Delivery Rating */}
                     <div className="bg-slate-50 p-6 rounded-2xl">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 text-center">Delivery Partner</p>
                        <div className="flex justify-center gap-2 mb-4">
                           {[1,2,3,4,5].map(s => (
                              <button key={s} onClick={()=>setRating({...rating, order: s})} className="hover:scale-110 transition">
                                 <Star size={32} className={s <= rating.order ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'} />
                              </button>
                           ))}
                        </div>
                        <textarea 
                           className="w-full p-3 bg-white rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-orange-200 outline-none resize-none"
                           placeholder="How was the delivery?"
                           rows={3}
                           value={reviews.order}
                           onChange={(e) => setReviews({...reviews, order: e.target.value})}
                        />
                     </div>
                     
                     {/* Food Rating */}
                     <div className="bg-slate-50 p-6 rounded-2xl">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 text-center">Food Quality</p>
                        <div className="flex justify-center gap-2 mb-4">
                           {[1,2,3,4,5].map(s => (
                              <button key={s} onClick={()=>setRating({...rating, restaurant: s})} className="hover:scale-110 transition">
                                 <Star size={32} className={s <= rating.restaurant ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'} />
                              </button>
                           ))}
                        </div>
                        <textarea 
                           className="w-full p-3 bg-white rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-orange-200 outline-none resize-none"
                           placeholder="How was the food?"
                           rows={3}
                           value={reviews.restaurant}
                           onChange={(e) => setReviews({...reviews, restaurant: e.target.value})}
                        />
                     </div>
                  </div>

                  <button 
                     onClick={handleSubmitRating} 
                     disabled={isSubmitting || !rating.order || !rating.restaurant}
                     className="w-full mt-8 py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-black transition disabled:opacity-50 disabled:cursor-not-allowed shadow-xl"
                  >
                     {isSubmitting ? "Submitting..." : "Submit Feedback"}
                  </button>
               </div>
            )}
          </div>

          {/* --- RIGHT COLUMN (SIDEBAR) --- */}
          <div className="space-y-6">
             
             {/* Driver Card */}
             {delivery && currentStep < 4 && (
                <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-xl relative overflow-hidden">
                   <div className="flex items-center gap-4 mb-6">
                      <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center border-4 border-white shadow-sm overflow-hidden">
                         {/* Placeholder Avatar */}
                         <Truck size={28} className="text-slate-500" />
                      </div>
                      <div>
                         <h3 className="font-bold text-xl text-slate-900">{delivery.driverName}</h3>
                         <div className="flex items-center gap-1.5 text-orange-600 bg-orange-50 px-2 py-0.5 rounded text-xs font-bold w-fit mt-1">
                            <span className="w-1.5 h-1.5 bg-orange-600 rounded-full animate-pulse"></span> {delivery.status.replace('_', ' ')}
                         </div>
                      </div>
                   </div>

                   <div className="flex gap-3">
                      <button className="flex-1 py-3 bg-slate-900 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-black transition shadow-lg shadow-slate-200">
                         <Phone size={18} /> Call
                      </button>
                      <button className="flex-1 py-3 bg-white border-2 border-slate-100 text-slate-700 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-slate-50 transition">
                         <MessageSquare size={18} /> Chat
                      </button>
                   </div>
                </div>
             )}

             {/* Bill Receipt */}
             <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden">
                {/* Visual Top Edge */}
                <div className="h-4 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,#f8fafc_10px,#f8fafc_20px)] border-b border-slate-100"></div>
                
                <div className="p-8">
                   <div className="flex items-center gap-2 mb-6 opacity-50">
                      <Receipt size={24} />
                      <h3 className="font-bold text-lg uppercase tracking-widest">Receipt</h3>
                   </div>

                   <div className="space-y-4 text-sm text-slate-500 mb-8 font-medium">
                      <div className="flex justify-between"><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
                      <div className="flex justify-between"><span>Taxes</span><span>₹{tax.toFixed(2)}</span></div>
                      <div className="flex justify-between"><span>Delivery</span><span>₹{deliveryFee.toFixed(2)}</span></div>
                   </div>

                   <div className="border-t-2 border-dashed border-slate-200 pt-6 flex justify-between items-center">
                      <span className="font-black text-slate-900 text-lg">TOTAL</span>
                      <span className="font-black text-2xl text-orange-600">₹{total.toFixed(2)}</span>
                   </div>
                </div>
                
                {/* Visual Bottom Edge */}
                <div className="h-4 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,#f8fafc_10px,#f8fafc_20px)] border-t border-slate-100"></div>
             </div>

             <div className="text-center">
                <button onClick={() => router.push('/restaurants')} className="text-xs font-bold text-slate-400 hover:text-orange-600 transition uppercase tracking-widest">
                   Report an Issue
                </button>
             </div>

          </div>
        </div>
      </main>
    </div>
  );
}