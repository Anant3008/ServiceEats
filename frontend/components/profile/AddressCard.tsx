import { Edit2, Trash2, MapPin, Home, Briefcase } from 'lucide-react';
import { Address } from '@/types';

interface AddressCardProps {
  address: Address;
  onEdit: (address: Address) => void;
  onDelete: (id: string) => void;
}

export default function AddressCard({ address, onEdit, onDelete }: AddressCardProps) {
  const icons: any = { Home, Work: Briefcase, Other: MapPin };
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
}