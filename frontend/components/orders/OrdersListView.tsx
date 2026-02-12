import { useState, useEffect } from 'react';
import { Loader2, Package, Utensils, ChevronRight, ShoppingCart } from 'lucide-react';
import { Order } from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

interface OrdersListProps {
  userId: string;
  onSelectOrder: (id: string) => void;
  token: string;
}

export default function OrdersListView({ userId, onSelectOrder, token }: OrdersListProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetchOrders = async () => {
       try {
          const res = await fetch(`${API_BASE}/api/orders/user/${userId}?page=${page}&limit=10`, {
             headers: { Authorization: `Bearer ${token}` }
          });
          const data = await res.json();
          setOrders(data.items || data.orders || []);
          setTotal(data.total || 0);
       } catch (err) { console.error(err); } 
       finally { setLoading(false); }
    };
    fetchOrders();
  }, [userId, page, token]);

  const getBadge = (status: string) => {
     const styles: any = { 
        completed: "bg-green-50 text-green-700", 
        pending: "bg-blue-50 text-blue-700", 
        cancelled: "bg-red-50 text-red-700" 
     };
     return <span className={`px-2 py-1 rounded-lg text-xs font-bold capitalize ${styles[status] || 'bg-gray-50'}`}>{status}</span>;
  };

  if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-orange-600"/></div>;
  
  if (orders.length === 0) return (
     <div className="text-center p-10 bg-white rounded-2xl border-2 border-dashed border-slate-200">
        <Package size={40} className="mx-auto text-slate-300 mb-4"/>
        <h3 className="font-bold text-slate-900">No orders yet</h3>
        <p className="text-slate-500 mb-4">Hungry? Place your first order now.</p>
     </div>
  );

  return (
    <div className="space-y-4">
       <div className="flex justify-between items-end mb-2">
           <h2 className="text-2xl font-bold text-slate-900">Your Orders</h2>
       </div>
       {orders.map(order => (
          <div key={order._id} className="bg-white p-6 rounded-2xl border border-slate-100 hover:shadow-md transition group">
             <div className="flex flex-col md:flex-row gap-6">
                <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600 group-hover:scale-110 transition-transform">
                   <Utensils size={24} />
                </div>
                <div className="flex-1">
                   <div className="flex justify-between items-start mb-2">
                      <div>
                         <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-bold text-slate-900">Order #{order._id.slice(-6).toUpperCase()}</h3>
                            {getBadge(order.deliveryStatus)}
                         </div>
                         <p className="text-xs text-slate-400 font-bold">{new Date(order.createdAt).toLocaleDateString()}</p>
                      </div>
                      <p className="font-black text-lg text-slate-900">₹{order.totalAmount}</p>
                   </div>
                   <p className="text-sm text-slate-600 mb-4 line-clamp-1">
                      {order.items.map(i => `${i.quantity}x ${i.name}`).join(", ")}
                   </p>
                   <div className="flex gap-3">
                      <button onClick={() => onSelectOrder(order._id)} className="px-4 py-2 bg-slate-50 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-100 transition flex items-center gap-1">
                         Details <ChevronRight size={14}/>
                      </button>
                      <button className="px-4 py-2 bg-orange-600 text-white font-bold rounded-xl text-xs hover:bg-orange-700 transition flex items-center gap-1">
                         <ShoppingCart size={14}/> Reorder
                      </button>
                   </div>
                </div>
             </div>
          </div>
       ))}
    </div>
  );
}