'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import { User, MapPin, Phone, Mail, Edit2, Trash2, Plus, Save, X } from 'lucide-react';

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

export default function ProfilePage() {
  const router = useRouter();
  const { user, token, refreshUser, isHydrating } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Edit profile state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');

  // Add/Edit address state
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressForm, setAddressForm] = useState({
    label: '',
    street: '',
    city: '',
    state: '',
    pincode: '',
    isDefault: false
  });

  // Reusable address validator to keep add/update consistent
  const validateAddressFields = (form: typeof addressForm) => {
    if (!form.label.trim() || form.label.trim().length < 2) {
      return 'Address label is required (min 2 chars)';
    }
    if (!form.street.trim() || form.street.trim().length < 5) {
      return 'Street must be at least 5 characters';
    }
    if (!form.city.trim() || form.city.trim().length < 2) {
      return 'City is required (min 2 chars)';
    }
    if (!form.state.trim() || form.state.trim().length < 2) {
      return 'State is required (min 2 chars)';
    }
    if (!form.pincode.trim()) {
      return 'Pincode is required';
    }
    // Allow 4-10 characters, digits required; optional letters/spaces/dashes
    if (!/^(?=.*\d)[A-Za-z0-9 -]{4,10}$/.test(form.pincode.trim())) {
      return 'Pincode should be 4-10 chars, include digits, and may contain letters/spaces/dashes';
    }
    return '';
  };

  useEffect(() => {
    // Wait for hydration to complete
    if (isHydrating) {
      return;
    }

    // Then check auth
    if (!token) {
      router.push('/auth/login');
      return;
    }
    
    fetchProfile();
  }, [token, isHydrating]);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:3000/api/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }

      const data = await response.json();
      setProfile(data);
      setEditName(data.name);
      setEditPhone(data.phone || '');
    } catch (err: any) {
      setError(err.message || 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    // Basic client-side validation
    if (!editName.trim()) {
      setError('Name is required');
      return;
    }

    if (editPhone && editPhone.trim() && !/^[- +()0-9]{7,15}$/.test(editPhone.trim())) {
      setError('Phone must be 7-15 digits (you can include +, -, or spaces)');
      return;
    }

    try {
      setError('');
      const response = await fetch('http://localhost:3000/api/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: editName,
          phone: editPhone
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const data = await response.json();
      setProfile(prev => prev ? { ...prev, name: data.user.name, phone: data.user.phone } : null);
      setSuccessMessage('Profile updated successfully!');
      setIsEditingProfile(false);
      await refreshUser();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    }
  };

  const handleAddAddress = async () => {
    const addressError = validateAddressFields(addressForm);
    if (addressError) {
      setError(addressError);
      return;
    }

    try {
      setError('');
      const response = await fetch('http://localhost:3000/api/profile/address', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(addressForm)
      });

      if (!response.ok) {
        throw new Error('Failed to add address');
      }

      const data = await response.json();
      setProfile(prev => prev ? { ...prev, addresses: data.addresses } : null);
      setSuccessMessage('Address added successfully!');
      setIsAddingAddress(false);
      resetAddressForm();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to add address');
    }
  };

  const handleUpdateAddress = async () => {
    if (!editingAddressId) return;

    const addressError = validateAddressFields(addressForm);
    if (addressError) {
      setError(addressError);
      return;
    }

    try {
      setError('');
      const response = await fetch(`http://localhost:3000/api/profile/address/${editingAddressId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(addressForm)
      });

      if (!response.ok) {
        throw new Error('Failed to update address');
      }

      const data = await response.json();
      setProfile(prev => prev ? { ...prev, addresses: data.addresses } : null);
      setSuccessMessage('Address updated successfully!');
      setEditingAddressId(null);
      resetAddressForm();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update address');
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return;

    try {
      setError('');
      const response = await fetch(`http://localhost:3000/api/profile/address/${addressId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete address');
      }

      const data = await response.json();
      setProfile(prev => prev ? { ...prev, addresses: data.addresses } : null);
      setSuccessMessage('Address deleted successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to delete address');
    }
  };

  const startEditingAddress = (address: Address) => {
    setEditingAddressId(address._id);
    setAddressForm({
      label: address.label,
      street: address.street,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      isDefault: address.isDefault
    });
  };

  const resetAddressForm = () => {
    setAddressForm({
      label: '',
      street: '',
      city: '',
      state: '',
      pincode: '',
      isDefault: false
    });
  };

  const cancelAddressEdit = () => {
    setEditingAddressId(null);
    setIsAddingAddress(false);
    resetAddressForm();
  };

  if (isLoading || isHydrating) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-xl text-gray-600">Loading profile...</div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-xl text-red-600">Failed to load profile</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">My Profile</h1>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-800 rounded-lg">
            {successMessage}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg">
            {error}
          </div>
        )}

        {/* Profile Information Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <User className="w-5 h-5" />
              Profile Information
            </h2>
            {!isEditingProfile && (
              <button
                onClick={() => setIsEditingProfile(true)}
                className="flex items-center gap-2 text-orange-600 hover:text-orange-700"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </button>
            )}
          </div>

          {!isEditingProfile ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="text-gray-800 font-medium">{profile.name}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="text-gray-800 font-medium">{profile.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="text-gray-800 font-medium">{profile.phone || 'Not provided'}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 placeholder-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="Enter phone number"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 placeholder-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={profile.email}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700"
                />
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleUpdateProfile}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                >
                  <Save className="w-4 h-4" />
                  Save Changes
                </button>
                <button
                  onClick={() => {
                    setIsEditingProfile(false);
                    setEditName(profile.name);
                    setEditPhone(profile.phone || '');
                  }}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Addresses Card */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Delivery Addresses
            </h2>
            {!isAddingAddress && !editingAddressId && (
              <button
                onClick={() => setIsAddingAddress(true)}
                className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
              >
                <Plus className="w-4 h-4" />
                Add Address
              </button>
            )}
          </div>

          {/* Add/Edit Address Form */}
          {(isAddingAddress || editingAddressId) && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="font-semibold text-gray-800 mb-4">
                {isAddingAddress ? 'Add New Address' : 'Edit Address'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Label</label>
                  <input
                    type="text"
                    value={addressForm.label}
                    onChange={(e) => setAddressForm({ ...addressForm, label: e.target.value })}
                    placeholder="Home, Office, etc."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 placeholder-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                  <input
                    type="text"
                    value={addressForm.pincode}
                    onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
                    placeholder="411001"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 placeholder-gray-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                  <input
                    type="text"
                    value={addressForm.street}
                    onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                    placeholder="House no, Building, Street"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 placeholder-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                    placeholder="Pune"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 placeholder-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <input
                    type="text"
                    value={addressForm.state}
                    onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                    placeholder="Maharashtra"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 placeholder-gray-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={addressForm.isDefault}
                      onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                      className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                    />
                    <span className="text-sm text-gray-700">Set as default address</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  onClick={isAddingAddress ? handleAddAddress : handleUpdateAddress}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                >
                  <Save className="w-4 h-4" />
                  {isAddingAddress ? 'Add Address' : 'Update Address'}
                </button>
                <button
                  onClick={cancelAddressEdit}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Address List */}
          {profile.addresses.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No addresses added yet. Add your first delivery address!</p>
          ) : (
            <div className="space-y-4">
              {profile.addresses.map((address) => (
                <div
                  key={address._id}
                  className={`p-4 border rounded-lg ${
                    address.isDefault ? 'border-orange-500 bg-orange-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-800">{address.label}</h3>
                        {address.isDefault && (
                          <span className="px-2 py-1 text-xs bg-orange-500 text-white rounded">Default</span>
                        )}
                      </div>
                      <p className="text-gray-600">{address.street}</p>
                      <p className="text-gray-600">
                        {address.city}, {address.state} - {address.pincode}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEditingAddress(address)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteAddress(address._id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
