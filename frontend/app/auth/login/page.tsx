"use client";

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, AlertCircle, Loader2, Star, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, isLoading } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      await login(email, password);
      router.push('/restaurants');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="min-h-screen flex w-full bg-white">
      
      {/* --- LEFT SIDE: FORM --- */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 lg:p-12 animate-[slideInLeft_0.5s_ease-out]">
        <div className="w-full max-w-md space-y-8">
          
          {/* Header */}
          <div className="text-center lg:text-left">
            <h1 className="text-4xl font-black text-gray-900 mb-2 tracking-tighter">
              Service<span className="text-orange-600">Eats.</span>
            </h1>
            <p className="text-gray-500 text-lg">Welcome back! Please login to your account.</p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-lg flex items-center gap-3 animate-pulse">
              <AlertCircle size={20} />
              <span className="text-sm font-medium">{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 ml-1">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all font-medium text-gray-900 placeholder-gray-400"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-sm font-bold text-gray-700">Password</label>
                <a href="#" className="text-sm font-semibold text-orange-600 hover:text-orange-700">Forgot Password?</a>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors" size={20} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all font-medium text-gray-900 placeholder-gray-400"
                  disabled={isLoading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-orange-200 hover:shadow-orange-300 transform hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 group"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>Logging in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform"/>
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="text-center pt-4">
            <p className="text-gray-500">
              Don't have an account?{' '}
              <Link href="/auth/register" className="text-orange-600 font-bold hover:underline transition">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* --- RIGHT SIDE: HERO IMAGE --- */}
      <div className="hidden lg:flex w-1/2 relative bg-gray-900 overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-80"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1513104890138-7c749659a591?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80')" }}
        ></div>
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>

        {/* Content Content */}
        <div className="relative z-10 w-full h-full flex flex-col justify-end p-16">
           {/* Floating Glass Card */}
           <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl max-w-sm animate-[fadeInUp_0.8s_ease-out]">
              <div className="flex gap-1 mb-2">
                {[1,2,3,4,5].map(i => <Star key={i} size={16} className="text-yellow-400 fill-yellow-400" />)}
              </div>
              <p className="text-white text-lg font-medium leading-relaxed mb-4">
                "The fastest delivery I've ever experienced. The food arrived hot and fresh!"
              </p>
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold">JD</div>
                 <div>
                    <p className="text-white font-bold text-sm">John Doe</p>
                    <p className="text-gray-300 text-xs">Food Critic</p>
                 </div>
              </div>
           </div>
        </div>
      </div>

    </div>
  );
}