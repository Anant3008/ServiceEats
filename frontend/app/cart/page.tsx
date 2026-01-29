"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, MapPin, Minus, Plus, Trash2, Receipt, 
  ChevronRight, ShieldCheck, Home, Briefcase, ShoppingBag, 
  CreditCard, Smartphone, Wallet, Loader2, AlertCircle,
  Pizza, Coffee, Utensils
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

// Stripe Imports
import { loadStripe } from "@stripe/stripe-js";
import { Elements, useStripe, useElements, CardElement } from "@stripe/react-stripe-js";
import { createPayment } from "@/utils/paymentApi";

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY || "");

// --- TYPES ---
interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

interface Cart {
  _id: string;
  restaurantId: string;
  restaurantName: string;
  items: CartItem[];
  totalAmount: number;
}

interface Address {
  _id: string;
  label: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

const DELIVERY_FEE = 50;
const PAYMENT_METHODS = [
  { id: "upi", name: "UPI", icon: Smartphone, desc: "GPay, PhonePe" },
  { id: "card", name: "Card", icon: CreditCard, desc: "Visa, MasterCard" },
  { id: "wallet", name: "Wallet", icon: Wallet, desc: "Service Wallet" },
];

// --- SUB-COMPONENTS ---

const CardInput = ({ error }: { error?: string }) => (
  <div className="space-y-2">
    <div className="p-3.5 border border-slate-200 rounded-xl bg-white focus-within:border-orange-500 focus-within:ring-1 focus-within:ring-orange-500 transition-all">
      <CardElement options={{
        style: {
          base: { fontSize: "16px", color: "#1f2937", "::placeholder": { color: "#9ca3af" } },
          invalid: { color: "#dc2626" },
        },
      }} />
    </div>
    {error && <p className="text-xs text-red-600 font-medium flex items-center gap-1"><AlertCircle size={12}/> {error}</p>}
  </div>
);

// --- MAIN CONTENT COMPONENT ---
function CartContent() {
  const router = useRouter();
  const { user, loading: authLoading } = useRequireAuth();
  const stripe = useStripe();
  const elements = useElements();

  // State
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState("card");
  const [processing, setProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [showAddressModal, setShowAddressModal] = useState(false);

  // 1. Data Fetching
  const fetchCart = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:3000/api/cart", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        // Handle case where API returns { cart: null }
        if (data && typeof data === 'object' && 'cart' in data && data.cart === null) {
           setCart(null); 
        } else {
           setCart(data);
        }
      } else {
        setCart(null);
      }
    } catch (err) {
      console.error("Cart fetch error", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAddresses = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:3000/api/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch addresses");
      const data = await res.json();
      const list = Array.isArray(data?.addresses) ? data.addresses : [];
      setAddresses(list);
      const defaultAddress = list.find((addr: Address) => addr.isDefault) || list[0] || null;
      setSelectedAddress(defaultAddress);
    } catch (err) {
      console.error("Failed to load addresses", err);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      fetchCart();
      fetchAddresses();
    }
  }, [authLoading, user]);

  // 2. Handlers
  const handleChangeAddress = () => setShowAddressModal(true);
  
  const handleSelectAddress = (address: Address) => {
    setSelectedAddress(address);
    setShowAddressModal(false);
  };

  const updateQuantity = async (itemId: string, qty: number) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:3000/api/cart/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ menuItemId: itemId, quantity: qty }),
      });
      if (res.ok) fetchCart();
    } catch (e) { console.error(e); }
  };

  const removeItem = async (itemId: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:3000/api/cart/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ menuItemId: itemId }),
      });
      if (res.ok) fetchCart();
    } catch (e) { console.error(e); }
  };

  const handlePayment = async () => {
    if (!cart || !stripe || !elements) return;
    
    if (selectedPayment !== "card") {
      setPaymentError("Please select Card payment for this demo.");
      return;
    }

    setProcessing(true);
    setPaymentError("");

    try {
      const token = localStorage.getItem("token");
      const subtotal = cart.totalAmount;
      const tax = Math.round(subtotal * 0.05);
      const total = subtotal + tax + DELIVERY_FEE;

      const { clientSecret, orderId } = await createPayment({
        orderId: cart._id,
        userId: user?.userId,
        amount: total,
        currency: "inr",
        paymentMethod: selectedPayment,
        token,
      });

      const cardElement = elements.getElement(CardElement);
      if (!cardElement) throw new Error("Card input not found");

      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: cardElement },
      });

      if (result.error) throw new Error(result.error.message || "Payment Failed");

      if (result.paymentIntent?.status === "succeeded") {
        router.push(`/payment-success?orderId=${orderId}`);
      }
    } catch (err: any) {
      setPaymentError(err.message || "Something went wrong processing payment");
      setProcessing(false);
    }
  };

  // --- RENDERS ---

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <Loader2 className="animate-spin text-orange-600" size={32} />
      </div>
    );
  }

  // --- NEW AESTHETIC EMPTY STATE ---
  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* Decorative Background Blobs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-100 rounded-full blur-3xl opacity-20 -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-100 rounded-full blur-3xl opacity-20 translate-y-1/3 -translate-x-1/3 pointer-events-none"></div>

        {/* Floating Icon Composition */}
        <div className="relative mb-12 group cursor-default">
           {/* Center Bag */}
           <div className="w-32 h-32 bg-white rounded-[2rem] shadow-xl flex items-center justify-center relative z-10 animate-[float_4s_ease-in-out_infinite]">
              <ShoppingBag size={48} className="text-orange-500" />
           </div>
           
           {/* Floating Element 1 (Pizza) */}
           <div className="absolute -top-6 -right-6 w-16 h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center animate-[float_5s_ease-in-out_infinite_1s]">
              <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center">
                 <Pizza size={20} className="text-orange-600" />
              </div>
           </div>

           {/* Floating Element 2 (Coffee) */}
           <div className="absolute -bottom-4 -left-8 w-14 h-14 bg-white rounded-2xl shadow-lg flex items-center justify-center animate-[float_6s_ease-in-out_infinite_0.5s]">
              <div className="w-9 h-9 bg-amber-50 rounded-full flex items-center justify-center">
                 <Coffee size={18} className="text-amber-700" />
              </div>
           </div>
        </div>

        {/* Text Content */}
        <div className="text-center max-w-md z-10">
           <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Your cart is empty</h2>
           <p className="text-slate-500 text-lg mb-8 leading-relaxed">
             Looks like you haven't added anything yet. 
             <br/><span className="text-orange-600 font-medium">Good food is waiting for you!</span>
           </p>
           
           <Link 
             href="/restaurants" 
             className="inline-flex items-center gap-2 px-8 py-4 bg-slate-900 text-white font-bold rounded-2xl shadow-xl shadow-slate-200 hover:shadow-2xl hover:scale-105 transition-all duration-300"
           >
             Browse Restaurants <ChevronRight size={20} />
           </Link>
        </div>
      </div>
    );
  }

  const subtotal = cart.totalAmount;
  const tax = Math.round(subtotal * 0.05);
  const total = subtotal + tax + DELIVERY_FEE;

  // --- FILLED CART UI ---
  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 pb-32 lg:pb-10">
      
      {/* 1. Header */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
             <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition"><ArrowLeft size={20} /></button>
             <div>
                <h1 className="text-lg font-bold text-slate-900 leading-none uppercase tracking-wide">Checkout</h1>
                <p className="text-xs text-slate-500 font-medium mt-0.5">{cart.restaurantName}</p>
             </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-[10px] font-bold bg-green-50 text-green-700 px-3 py-1.5 rounded-full uppercase tracking-wider border border-green-100">
             <ShieldCheck size={12} /> 100% Secure
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* --- LEFT COLUMN --- */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Address */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
               <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-lg flex items-center gap-2"><MapPin size={20} className="text-orange-600" /> Delivery to</h2>
                  <button onClick={handleChangeAddress} className="text-orange-600 text-sm font-bold hover:underline">Change</button>
               </div>
               <div className="p-4 rounded-2xl border-2 border-orange-500 bg-orange-50/20 relative">
                  <div className="absolute top-3 right-3 text-orange-600 bg-white rounded-full p-0.5"><ShieldCheck size={18} fill="currentColor" className="text-white" /></div>
                  <div className="flex items-center gap-2 mb-2">
                     <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-orange-100 text-orange-700"><Home size={16}/></div>
                     <span className="font-bold text-sm uppercase tracking-wide text-orange-700">{selectedAddress?.label || "Home"}</span>
                  </div>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    {selectedAddress 
                      ? `${selectedAddress.street}, ${selectedAddress.city}, ${selectedAddress.state} ${selectedAddress.pincode}`
                      : "Please select an address"}
                  </p>
               </div>
            </div>

            {/* Items */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
               <h2 className="font-bold text-lg flex items-center gap-2 mb-6"><ShoppingBag size={20} className="text-orange-600" /> Your Items</h2>
               <div className="space-y-6">
                  {cart.items.map((item) => (
                     <div key={item.menuItemId} className="flex gap-4 items-center">
                        <div className="flex-1">
                           <h3 className="font-bold text-slate-800">{item.name}</h3>
                           <p className="text-slate-500 text-sm font-medium">₹{item.price}</p>
                        </div>
                        <div className="h-9 bg-white border border-slate-200 rounded-lg flex items-center shadow-sm">
                           <button onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)} className="w-8 h-full flex items-center justify-center text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-l-lg transition" disabled={item.quantity <= 1}><Minus size={14} /></button>
                           <span className="w-8 text-center text-sm font-bold text-slate-900">{item.quantity}</span>
                           <button onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)} className="w-8 h-full flex items-center justify-center text-green-600 hover:bg-green-50 rounded-r-lg transition"><Plus size={14} /></button>
                        </div>
                        <button onClick={() => removeItem(item.menuItemId)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"><Trash2 size={18}/></button>
                     </div>
                  ))}
               </div>
            </div>
          </div>

          {/* --- RIGHT COLUMN --- */}
          <div className="space-y-6">
            
            {/* Bill */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
               <div className="p-6 pb-4">
                  <h2 className="font-bold text-slate-900 mb-6 flex items-center gap-2"><Receipt size={20} className="text-orange-600"/> Bill Details</h2>
                  <div className="space-y-3 text-sm text-slate-500 pb-4 border-b border-dashed border-slate-200">
                     <div className="flex justify-between"><span>Item Total</span><span className="font-medium text-slate-900">₹{subtotal.toFixed(2)}</span></div>
                     <div className="flex justify-between"><span>Taxes (5%)</span><span className="font-medium text-slate-900">₹{tax}</span></div>
                     <div className="flex justify-between"><span>Delivery Fee</span><span className="font-medium text-slate-900">₹{DELIVERY_FEE}</span></div>
                  </div>
                  <div className="pt-4 flex justify-between items-center">
                     <span className="text-slate-500 font-bold">To Pay</span>
                     <span className="font-black text-2xl text-slate-900">₹{total.toFixed(2)}</span>
                  </div>
               </div>
            </div>

            {/* Payment */}
            <div className="bg-white rounded-3xl shadow-lg border border-orange-100 p-6 relative">
               <h3 className="font-bold text-lg mb-4">Payment Method</h3>
               <div className="grid grid-cols-3 gap-2 mb-6">
                  {PAYMENT_METHODS.map((method) => {
                     const Icon = method.icon;
                     return (
                        <button 
                           key={method.id} 
                           onClick={() => setSelectedPayment(method.id)}
                           className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${selectedPayment === method.id ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-slate-100 text-slate-400 hover:border-slate-300'}`}
                        >
                           <Icon size={24} className="mb-1" />
                           <span className="text-[10px] font-bold uppercase">{method.name}</span>
                        </button>
                     )
                  })}
               </div>

               {selectedPayment === 'card' && (
                  <div className="mb-6 animate-in slide-in-from-top-2">
                     <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Card Details</p>
                     <CardInput error={paymentError} />
                  </div>
               )}

               <button 
                  onClick={handlePayment}
                  disabled={processing || !stripe || !elements || !selectedAddress}
                  className="w-full py-4 bg-gradient-to-r from-orange-600 to-orange-500 text-white font-bold rounded-2xl shadow-lg shadow-orange-200 hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
               >
                  {processing ? (
                     <><Loader2 size={20} className="animate-spin" /> Processing...</>
                  ) : (
                     <>Pay ₹{total.toFixed(0)} <ChevronRight strokeWidth={3} size={20} /></>
                  )}
               </button>
               
               <p className="text-[10px] text-center text-slate-400 mt-4">
                  {!selectedAddress ? "Please select an address to proceed." : "By paying, you agree to our Terms & Conditions."}
               </p>
            </div>

          </div>
        </div>
      </main>

      {/* Address Selection Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-900">Select Delivery Address</h3>
              <button onClick={() => setShowAddressModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            <div className="p-6 max-h-[70vh] overflow-y-auto space-y-3">
              {addresses.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <MapPin size={40} className="mx-auto mb-3 text-slate-300" />
                  <p>No saved addresses found. Please add one in Profile.</p>
                  <Link href="/profile" className="text-orange-600 font-bold mt-2 inline-block">Go to Profile</Link>
                </div>
              ) : (
                addresses.map((addr) => {
                  const Icon = addr.label === "Home" ? Home : addr.label === "Work" ? Briefcase : MapPin;
                  const isSelected = selectedAddress?._id === addr._id;
                  return (
                    <button
                      key={addr._id}
                      onClick={() => handleSelectAddress(addr)}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                        isSelected
                          ? "border-orange-500 bg-orange-50"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                          isSelected ? "bg-orange-100 text-orange-700" : "bg-slate-100 text-slate-600"
                        }`}>
                          <Icon size={18} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-slate-900">{addr.label}</span>
                            {addr.isDefault && (
                              <span className="text-[9px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold uppercase">Default</span>
                            )}
                          </div>
                          <p className="text-sm text-slate-500 leading-relaxed">
                            {addr.street}, {addr.city}, {addr.state} {addr.pincode}
                          </p>
                        </div>
                        {isSelected && (
                          <div className="shrink-0">
                            <div className="w-5 h-5 bg-orange-600 rounded-full flex items-center justify-center">
                              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            </div>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Custom Hook Helper
function useRequireAuth() {
  const { user, loading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!loading && !user) router.push("/auth/login");
  }, [user, loading, router]);
  return { user, loading };
}

// Default Export
export default function CartPageWrapper() {
  return (
    <Elements stripe={stripePromise}>
      <CartContent />
    </Elements>
  );
}