"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { 
  ArrowLeft, Clock, MapPin, Star, ShoppingCart, 
  Plus, Minus, Search, Utensils, Zap, Info, ChevronRight, Share2, Heart
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import StickyCartFooter from "@/components/StickyCartFooter";

// --- TYPES ---
type MenuItem = {
  _id: string;
  name: string;
  price: number;
  description?: string;
  isAvailable?: boolean;
  image?: string; // Assuming menu items might have images later
  isVeg?: boolean;
};

type Restaurant = {
  _id: string;
  name: string;
  cuisine: string;
  rating: number;
  deliveryTime: string;
  image?: string;
  imageUrl?: string;
  location: string;
  costForTwo: string;
  description: string;
  menu: MenuItem[];
};

// --- SUB-COMPONENTS ---

/**
 * 1. Menu Item Card
 * Clean, horizontal card with "Add" button logic
 */
const MenuCard = ({ 
  item, 
  quantity, 
  onAdd, 
  onUpdate, 
  isAdding, 
  isUpdating 
}: { 
  item: MenuItem; 
  quantity: number; 
  onAdd: () => void; 
  onUpdate: (qty: number) => void;
  isAdding: boolean;
  isUpdating: boolean;
}) => (
  <div className={`group bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex justify-between gap-4 ${!item.isAvailable ? 'opacity-60 grayscale' : ''}`}>
    
    {/* Text Content */}
    <div className="flex-1">
      <div className="mb-2">
         {/* Veg/Non-Veg Indicator (Mock) */}
         <div className={`w-4 h-4 border flex items-center justify-center rounded-[4px] ${item.isVeg !== false ? 'border-green-600' : 'border-red-600'}`}>
            <div className={`w-2 h-2 rounded-full ${item.isVeg !== false ? 'bg-green-600' : 'bg-red-600'}`}></div>
         </div>
      </div>
      <h3 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-orange-600 transition-colors">{item.name}</h3>
      <p className="font-bold text-slate-900 mb-2">₹{item.price.toFixed(0)}</p>
      {item.description && <p className="text-slate-500 text-sm leading-relaxed line-clamp-2">{item.description}</p>}
      {!item.isAvailable && <p className="text-xs text-red-500 font-bold mt-2">Currently Unavailable</p>}
    </div>

    {/* Image & Action Area */}
    <div className="flex flex-col items-center gap-2 relative">
       {/* Placeholder Image (If no real image) */}
       <div className="w-28 h-24 bg-slate-100 rounded-xl overflow-hidden relative">
          {item.image ? (
             <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
          ) : (
             <div className="w-full h-full flex items-center justify-center text-slate-300">
                <Utensils size={24} />
             </div>
          )}
          
          {/* Floating Action Button */}
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 shadow-lg rounded-lg overflow-hidden w-24 h-9 bg-white border border-slate-200 flex items-center justify-center">
             {quantity === 0 ? (
                <button 
                  onClick={onAdd}
                  disabled={!item.isAvailable || isAdding}
                  className="w-full h-full text-orange-600 font-extrabold text-sm hover:bg-orange-50 uppercase transition-colors"
                >
                  {isAdding ? "..." : "ADD"}
                </button>
             ) : (
                <div className="flex items-center justify-between w-full px-1">
                   <button onClick={() => onUpdate(quantity - 1)} disabled={isUpdating} className="p-1 text-slate-400 hover:text-orange-600"><Minus size={14}/></button>
                   <span className="font-bold text-orange-600 text-sm">{quantity}</span>
                   <button onClick={() => onUpdate(quantity + 1)} disabled={isUpdating} className="p-1 text-green-600 hover:text-green-700"><Plus size={14}/></button>
                </div>
             )}
          </div>
       </div>
       {item.isAvailable && <p className="text-[10px] text-slate-400 mt-3">Customizable</p>}
    </div>
  </div>
);

// --- MAIN PAGE ---

export default function RestaurantDetailsPage() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : "";
  const { user } = useAuth();

  // State
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cart, setCart] = useState<Map<string, number>>(new Map());
  const [cartCount, setCartCount] = useState(0);
  
  // Loading States for Actions
  const [addingId, setAddingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [searchMenu, setSearchMenu] = useState("");

  // 1. Fetch Restaurant
  useEffect(() => {
    if (!id) return;
    async function fetchData() {
      try {
        const res = await fetch(`http://localhost:3000/api/restaurants/${id}`);
        if (!res.ok) throw new Error("Restaurant not found");
        const data = await res.json();
        setRestaurant(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  // 2. Fetch Cart (Sync)
  useEffect(() => {
    if (!user) return;
    async function fetchCart() {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:3000/api/cart", { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          const map = new Map<string, number>();
          let total = 0;
          data.items.forEach((i: any) => {
             map.set(i.menuItemId, i.quantity);
             total += i.quantity;
          });
          setCart(map);
          setCartCount(total);
        }
      } catch (e) {}
    }
    fetchCart();
  }, [user]);

  // Handlers
  const handleAddToCart = async (item: MenuItem) => {
    if (!user) { alert("Please login first"); return; }
    setAddingId(item._id);
    try {
       const token = localStorage.getItem("token");
       await fetch("http://localhost:3000/api/cart/add", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
             restaurantId: restaurant!._id, restaurantName: restaurant!.name,
             menuItemId: item._id, name: item.name, price: item.price, quantity: 1
          })
       });
       setCart(new Map(cart.set(item._id, (cart.get(item._id) || 0) + 1)));
       setCartCount(c => c + 1);
    } catch (e) { alert("Failed to add"); } 
    finally { setAddingId(null); }
  };

  const handleUpdateQuantity = async (item: MenuItem, newQty: number) => {
    setUpdatingId(item._id);
    try {
       const token = localStorage.getItem("token");
       await fetch("http://localhost:3000/api/cart/update", {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ menuItemId: item._id, quantity: newQty })
       });
       const newCart = new Map(cart);
       const oldQty = newCart.get(item._id) || 0;
       if (newQty === 0) newCart.delete(item._id);
       else newCart.set(item._id, newQty);
       
       setCart(newCart);
       setCartCount(c => c + (newQty - oldQty));
    } catch (e) { alert("Failed to update"); }
    finally { setUpdatingId(null); }
  };

  if (loading) return (
     <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full"></div>
     </div>
  );

  if (error || !restaurant) return (
     <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Restaurant Not Found</h2>
        <Link href="/restaurants" className="text-orange-600 font-bold hover:underline">Back to Restaurants</Link>
     </div>
  );

  // Filter menu
  const filteredMenu = restaurant.menu?.filter(item => 
     item.name.toLowerCase().includes(searchMenu.toLowerCase())
  ) || [];

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 pb-32">
       
       {/* 1. Navbar */}
       <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
             <Link href="/restaurants" className="flex items-center gap-2 text-slate-500 hover:text-orange-600 font-bold transition">
                <ArrowLeft size={20} /> <span className="hidden sm:inline">Restaurants</span>
             </Link>
             <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500"><Search size={16}/></div>
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500"><Share2 size={16}/></div>
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500"><Heart size={16}/></div>
             </div>
          </div>
       </nav>

       <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          
          {/* 2. Hero Section (Immersive) */}
          <div className="relative h-64 sm:h-80 rounded-[2rem] overflow-hidden shadow-2xl mb-10 group">
             {/* Background Image */}
             <div className="absolute inset-0">
                <img src={restaurant.imageUrl || "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1600&q=80"} alt="Cover" className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-[2s]" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent"></div>
             </div>
             
             {/* Content */}
             <div className="absolute bottom-0 left-0 w-full p-6 sm:p-10 text-white">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                   <div>
                      <h1 className="text-4xl sm:text-5xl font-black mb-2 tracking-tight">{restaurant.name}</h1>
                      <p className="text-slate-300 text-lg mb-4 font-medium">{restaurant.cuisine} • {restaurant.location}</p>
                      
                      <div className="flex items-center gap-4 text-sm font-bold">
                         <div className="flex items-center gap-1 bg-green-600 text-white px-2 py-1 rounded-lg">
                            <span className="text-base">{restaurant.rating || 4.5}</span> <Star size={12} fill="currentColor" />
                         </div>
                         <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1 rounded-lg">
                            <Clock size={14} className="text-orange-400" /> {restaurant.deliveryTime || "35 min"}
                         </div>
                         <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1 rounded-lg">
                            <span className="text-slate-200">₹</span> {restaurant.costForTwo || "₹400 for two"}
                         </div>
                      </div>
                   </div>
                   
                   {/* Offer Box (Visual Only) */}
                   <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl max-w-xs">
                      <div className="flex items-center gap-2 mb-1 text-orange-400 font-black uppercase tracking-wider text-xs">
                         <Zap size={14} fill="currentColor" /> Offers
                      </div>
                      <p className="font-bold text-white text-lg">50% OFF up to ₹100</p>
                      <p className="text-slate-400 text-xs">Use code WELCOME50 | Orders above ₹159</p>
                   </div>
                </div>
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
             
             {/* 3. Left Column: Menu */}
             <div className="lg:col-span-2">
                
                {/* Menu Header & Search */}
                <div className="flex items-center justify-between mb-6">
                   <h2 className="text-2xl font-black text-slate-900">Menu</h2>
                   <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <input 
                        type="text" 
                        placeholder="Search dishes..." 
                        value={searchMenu}
                        onChange={(e) => setSearchMenu(e.target.value)}
                        className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-full text-sm font-medium focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all"
                      />
                   </div>
                </div>

                {/* Categories / Items */}
                <div className="space-y-4">
                   {filteredMenu.length > 0 ? filteredMenu.map((item) => (
                      <MenuCard 
                         key={item._id} 
                         item={item} 
                         quantity={cart.get(item._id) || 0}
                         onAdd={() => handleAddToCart(item)}
                         onUpdate={(q) => handleUpdateQuantity(item, q)}
                         isAdding={addingId === item._id}
                         isUpdating={updatingId === item._id}
                      />
                   )) : (
                      <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200">
                         <Utensils className="mx-auto text-slate-300 mb-2" size={32} />
                         <p className="text-slate-500 font-medium">No items found matching "{searchMenu}"</p>
                      </div>
                   )}
                </div>
             </div>

             {/* 4. Right Column: Info & Sticky Cart (Desktop) */}
             <div className="space-y-6">
                
                {/* Restaurant Info Card */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm sticky top-24">
                   <div className="flex items-center gap-2 mb-4">
                      <Info size={18} className="text-orange-600" />
                      <h3 className="font-bold text-slate-900">Restaurant Info</h3>
                   </div>
                   <div className="space-y-4 text-sm">
                      <div className="flex items-start gap-3 pb-3 border-b border-slate-50">
                         <MapPin className="text-slate-400 shrink-0 mt-0.5" size={16} />
                         <p className="text-slate-600">{restaurant.location}</p>
                      </div>
                      <div className="flex items-start gap-3 pb-3 border-b border-slate-50">
                         <Clock className="text-slate-400 shrink-0 mt-0.5" size={16} />
                         <div>
                            <p className="text-slate-900 font-bold">Open now</p>
                            <p className="text-slate-500 text-xs">10:00 AM - 11:00 PM</p>
                         </div>
                      </div>
                      <p className="text-slate-500 leading-relaxed text-xs">
                         {restaurant.description || "Known for hygiene and great taste. Packaging is spill-proof."}
                      </p>
                   </div>
                </div>

                {/* Desktop Mini Cart Prompt */}
                {cartCount > 0 && (
                   <div className="hidden lg:block bg-slate-900 text-white p-6 rounded-2xl shadow-xl animate-in slide-in-from-bottom-4">
                      <h3 className="font-bold text-lg mb-1">Cart</h3>
                      <p className="text-slate-400 text-sm mb-4">{cartCount} Items selected</p>
                      <Link href="/cart" className="w-full py-3 bg-orange-600 hover:bg-orange-500 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors">
                         View Cart <ChevronRight size={16} />
                      </Link>
                   </div>
                )}
             </div>

          </div>
       </main>

    </div>
  );
}