"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { 
  User, MapPin, Package, Heart, LogOut, Edit2, Plus, 
  Home, Briefcase, Phone, Mail, Trash2, ShieldCheck, 
  Star, X, Save, Loader2, Menu 
} from 'lucide-react';

// --- TYPES ---
interface Address {
  _id: string;
  label: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

interface ProfileData {
  userId: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  addresses: Address[];
}

// --- SUB-COMPONENTS ---

// 1. Reusable Modal Component
const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-5 border-b border-slate-100">
          <h3 className="font-bold text-lg text-slate-900">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition"><X size={20} className="text-slate-500" /></button>
        </div>
        <div className="p-6 max-h-[80vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

// 2. Sidebar Component
const Sidebar = ({ activeTab, setActiveTab, onLogout, mobileOpen, setMobileOpen }: any) => {
  const menuItems = [
    { id: 'profile', icon: User, label: 'My Profile' },
    { id: 'orders', icon: Package, label: 'Orders' },
    { id: 'favorites', icon: Heart, label: 'Favorites' },
  ];

  const sidebarClasses = `
    fixed inset-y-0 left-0 z-40 w-72 bg-white border-r border-slate-100 p-6 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:h-screen lg:sticky lg:top-0
    ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
  `;

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && <div className="fixed inset-0 bg-black/20 z-30 lg:hidden" onClick={() => setMobileOpen(false)}></div>}
      
      <div className={sidebarClasses}>
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-orange-200">SE</div>
          <span className="text-xl font-black tracking-tight text-slate-900">Service<span className="text-orange-600">Eats</span></span>
        </div>
        <nav className="space-y-2 flex-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setMobileOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all font-semibold text-sm ${
                activeTab === item.id ? 'bg-orange-50 text-orange-600 shadow-sm ring-1 ring-orange-100' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <item.icon size={18} /> {item.label}
            </button>
          ))}
        </nav>
        <button onClick={onLogout} className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors font-medium mt-auto text-sm">
          <LogOut size={18} /> Sign Out
        </button>
      </div>
    </>
  );
};

// 3. Address Card Component
const AddressCard = ({ address, onEdit, onDelete }: { address: Address; onEdit: (a: Address) => void; onDelete: (id: string) => void }) => {
  const icons = { Home, Work: Briefcase, Other: MapPin } as const;
  const Icon = icons[address.label] || MapPin;
  
  const getTheme = (label: string) => {
    if (label === 'Home') return { bg: 'bg-blue-50', text: 'text-blue-600', border: 'hover:border-blue-200' };
    if (label === 'Work') return { bg: 'bg-purple-50', text: 'text-purple-600', border: 'hover:border-purple-200' };
    return { bg: 'bg-gray-50', text: 'text-gray-600', border: 'hover:border-gray-200' };
  };
  const theme = getTheme(address.label);

  return (
    <div className={`group bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300 relative overflow-hidden ${theme.border}`}>
      {address.isDefault && (
        <div className="absolute top-0 right-0 bg-orange-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl shadow-sm z-10">DEFAULT</div>
      )}
      <div className="flex justify-between items-start mb-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${theme.bg} ${theme.text} mb-2`}>
          <Icon size={24} />
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
          <button onClick={() => onEdit(address)} className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition"><Edit2 size={16} /></button>
          <button onClick={() => onDelete(address._id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"><Trash2 size={16} /></button>
        </div>
      </div>
      <h3 className="font-bold text-slate-900 text-lg mb-1">{address.label}</h3>
      <p className="text-slate-500 text-sm leading-relaxed mb-1 font-medium">{address.street}</p>
      <p className="text-slate-400 text-sm">{address.city}, {address.state} - {address.pincode}</p>
    </div>
  );
};

// --- MAIN PAGE ---

export default function ProfilePage() {
  const router = useRouter();
  const { user, token, logout, isHydrating } = useAuth();
  
  const [activeTab, setActiveTab] = useState('profile');
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Modal & Form States
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', phone: '' });
  const [addressForm, setAddressForm] = useState({ id: '', label: '', street: '', city: '', state: '', pincode: '', isDefault: false });
  const [isEditingAddress, setIsEditingAddress] = useState(false);

  // Notifications
  const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

  // --- INITIAL DATA FETCH ---
  useEffect(() => {
    if (isHydrating) return;
    if (!token) {
      router.push('/auth/login');
      return;
    }
    fetchProfile();
  }, [token, isHydrating]);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('http://localhost:3000/api/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch profile');
      const data = await res.json();
      setProfile(data);
    } catch (err: any) {
      showStatus('error', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const showStatus = (type: 'success' | 'error', msg: string) => {
    setStatus({ type, msg });
    setTimeout(() => setStatus(null), 3000);
  };

  // --- HANDLERS ---

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:3000/api/profile', {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      if (!res.ok) throw new Error('Update failed');
      const data = await res.json();
      setProfile(prev => prev ? { ...prev, name: data.user.name, phone: data.user.phone } : null);
      setIsEditProfileOpen(false);
      showStatus('success', 'Profile updated successfully!');
    } catch (err: any) {
      showStatus('error', err.message);
    }
  };

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = isEditingAddress 
      ? `http://localhost:3000/api/profile/address/${addressForm.id}`
      : 'http://localhost:3000/api/profile/address';
    
    try {
      const res = await fetch(url, {
        method: isEditingAddress ? 'PUT' : 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(addressForm)
      });
      if (!res.ok) throw new Error('Address operation failed');
      const data = await res.json();
      setProfile(prev => prev ? { ...prev, addresses: data.addresses } : null);
      setIsAddressModalOpen(false);
      showStatus('success', isEditingAddress ? 'Address updated!' : 'Address added!');
    } catch (err: any) {
      showStatus('error', err.message);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      const res = await fetch(`http://localhost:3000/api/profile/address/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Delete failed');
      const data = await res.json();
      setProfile(prev => prev ? { ...prev, addresses: data.addresses } : null);
      showStatus('success', 'Address deleted');
    } catch (err: any) {
      showStatus('error', err.message);
    }
  };

  const openAddAddress = () => {
    setAddressForm({ id: '', label: '', street: '', city: '', state: '', pincode: '', isDefault: false });
    setIsEditingAddress(false);
    setIsAddressModalOpen(true);
  };

  const openEditAddress = (addr: Address) => {
    setAddressForm({ id: addr._id, label: addr.label, street: addr.street, city: addr.city, state: addr.state, pincode: addr.pincode, isDefault: addr.isDefault });
    setIsEditingAddress(true);
    setIsAddressModalOpen(true);
  };

  // --- RENDER ---

  if (isLoading || !profile) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-orange-600" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col lg:flex-row font-sans text-slate-800">
      
      {/* Sidebar Navigation */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onLogout={logout} 
        mobileOpen={mobileMenuOpen} 
        setMobileOpen={setMobileMenuOpen} 
      />

      {/* Main Content Area */}
      <main className="flex-1 p-4 lg:p-10 overflow-y-auto h-screen">
        <div className="max-w-5xl mx-auto pb-20">
          
          {/* Mobile Header */}
          <div className="lg:hidden flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
                 <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center text-white font-bold">SE</div>
                 <h1 className="text-xl font-black text-slate-900">Profile</h1>
            </div>
            <button onClick={() => setMobileMenuOpen(true)} className="p-2 bg-white rounded-lg border border-slate-200 text-slate-600">
                <Menu size={20} />
            </button>
          </div>

          {/* Toast Notification */}
          {status && (
            <div className={`fixed bottom-6 right-6 px-6 py-4 rounded-xl shadow-2xl z-50 animate-bounce text-white font-bold ${status.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
              {status.msg}
            </div>
          )}

          {/* TABS CONTENT */}
          {activeTab === 'profile' ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
              
              {/* 1. HERO CARD */}
              <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-2xl shadow-orange-200/50">
                <div className="absolute top-0 right-0 w-96 h-96 bg-white opacity-5 rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/3 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-black opacity-10 rounded-full blur-3xl transform -translate-x-1/3 translate-y-1/3 pointer-events-none"></div>
                
                <div className="relative z-10 p-8 md:p-10 flex flex-col md:flex-row items-center md:items-start gap-8">
                   <div className="relative group">
                      <div className="w-28 h-28 rounded-full bg-white p-1.5 shadow-xl">
                         <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.name}`} alt="Avatar" className="w-full h-full rounded-full bg-orange-50 object-cover" />
                      </div>
                   </div>
                   <div className="text-center md:text-left flex-1">
                      <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2 justify-center md:justify-start">
                         <h1 className="text-3xl font-black tracking-tight">{profile.name}</h1>
                         <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold border border-white/10 flex items-center gap-1 w-fit mx-auto md:mx-0 shadow-sm">
                            <ShieldCheck size={12} className="text-yellow-300" /> Pro Member
                         </span>
                      </div>
                      <p className="text-orange-100/90 font-medium mb-8">{profile.email} • {profile.phone || 'No Phone'}</p>
                      
                      <div className="flex items-center justify-center md:justify-start gap-8 border-t border-white/10 pt-6">
                         <div className="text-center md:text-left"><p className="text-3xl font-bold">0</p><p className="text-[10px] text-orange-200 uppercase tracking-widest font-bold mt-1">Orders</p></div>
                         <div className="w-px h-10 bg-white/10"></div>
                         <div className="text-center md:text-left"><p className="text-3xl font-bold flex gap-1 justify-center md:justify-start">4.8 <Star size={20} className="fill-yellow-400 text-yellow-400" /></p><p className="text-[10px] text-orange-200 uppercase tracking-widest font-bold mt-1">Rating</p></div>
                      </div>
                   </div>
                   <button 
                     onClick={() => { setEditForm({ name: profile.name, phone: profile.phone || '' }); setIsEditProfileOpen(true); }} 
                     className="hidden md:flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl text-sm font-bold transition border border-white/10"
                   >
                      <Edit2 size={16} /> Edit Profile
                   </button>
                </div>
              </div>

              {/* 2. CONTACT INFO */}
              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">Contact Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center gap-4 hover:border-orange-200 transition-colors shadow-sm group">
                      <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center text-orange-600 group-hover:scale-110 transition-transform"><Mail size={20}/></div>
                      <div><p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Email Address</p><p className="font-semibold text-slate-700">{profile.email}</p></div>
                   </div>
                   <div className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center gap-4 hover:border-orange-200 transition-colors shadow-sm group">
                      <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-green-600 group-hover:scale-110 transition-transform"><Phone size={20}/></div>
                      <div><p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Phone Number</p><p className="font-semibold text-slate-700">{profile.phone || 'Not provided'}</p></div>
                   </div>
                </div>
              </div>

              {/* 3. ADDRESSES GRID */}
              <div>
                <div className="flex justify-between items-end mb-5">
                   <h2 className="text-lg font-bold text-slate-900">Delivery Addresses</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                   <button onClick={openAddAddress} className="h-full min-h-[200px] border-2 border-dashed border-slate-200 hover:border-orange-400 bg-slate-50/50 hover:bg-orange-50/50 rounded-2xl flex flex-col items-center justify-center gap-3 text-slate-400 hover:text-orange-600 transition-all group">
                      <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-all"><Plus size={24}/></div>
                      <span className="font-bold text-sm">Add New Address</span>
                   </button>
                   {profile.addresses.map(addr => (
                      <AddressCard key={addr._id} address={addr} onEdit={openEditAddress} onDelete={handleDeleteAddress} />
                   ))}
                </div>
              </div>

            </div>
          ) : (
            // Placeholder for other tabs
            <div className="h-[60vh] flex flex-col items-center justify-center text-slate-400 bg-white rounded-[2rem] border-2 border-dashed border-slate-100">
                <Package size={48} className="mb-4 text-slate-300 opacity-50" />
                <h3 className="text-xl font-bold text-slate-800 mb-2">Coming Soon</h3>
                <p className="text-sm">This section is currently under construction.</p>
            </div>
          )}
        </div>
      </main>

      {/* --- MODALS --- */}

      {/* Edit Profile Modal */}
      <Modal isOpen={isEditProfileOpen} onClose={() => setIsEditProfileOpen(false)} title="Edit Profile">
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
            <input type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
            <input type="text" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition" />
          </div>
          <button type="submit" className="w-full py-3 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-700 transition flex justify-center gap-2 shadow-lg shadow-orange-200"><Save size={20}/> Save Changes</button>
        </form>
      </Modal>

      {/* Add/Edit Address Modal */}
      <Modal isOpen={isAddressModalOpen} onClose={() => setIsAddressModalOpen(false)} title={isEditingAddress ? "Edit Address" : "New Address"}>
        <form onSubmit={handleAddressSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="block text-sm font-medium text-slate-700 mb-1">Label</label>
               <select value={addressForm.label} onChange={e => setAddressForm({...addressForm, label: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none transition">
                 <option value="">Select...</option>
                 <option value="Home">Home</option>
                 <option value="Work">Work</option>
                 <option value="Other">Other</option>
               </select>
             </div>
             <div>
               <label className="block text-sm font-medium text-slate-700 mb-1">Pincode</label>
               <input type="text" value={addressForm.pincode} onChange={e => setAddressForm({...addressForm, pincode: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none transition" />
             </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Street Address</label>
            <input type="text" value={addressForm.street} onChange={e => setAddressForm({...addressForm, street: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none transition" />
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
               <input type="text" value={addressForm.city} onChange={e => setAddressForm({...addressForm, city: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none transition" />
             </div>
             <div>
               <label className="block text-sm font-medium text-slate-700 mb-1">State</label>
               <input type="text" value={addressForm.state} onChange={e => setAddressForm({...addressForm, state: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none transition" />
             </div>
          </div>
          <div className="flex items-center gap-2 mt-2 p-3 bg-slate-50 rounded-xl cursor-pointer" onClick={() => setAddressForm({...addressForm, isDefault: !addressForm.isDefault})}>
            <div className={`w-5 h-5 rounded border flex items-center justify-center transition ${addressForm.isDefault ? 'bg-orange-600 border-orange-600' : 'bg-white border-slate-300'}`}>
              {addressForm.isDefault && <div className="w-2 h-2 bg-white rounded-full"></div>}
            </div>
            <span className="text-sm text-slate-600 font-medium select-none">Set as default address</span>
          </div>
          <button type="submit" className="w-full py-3 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-700 transition flex justify-center gap-2 shadow-lg shadow-orange-200"><Save size={20}/> Save Address</button>
        </form>
      </Modal>

    </div>
  );
}