import React from 'react';
import { Star, Zap, Plus, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom'; // Assuming you use react-router

const PremiumPage = () => {
  // If using react-router, use this. If not, use window.location.href
  // const navigate = useNavigate(); 
  
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      
      {/* Header */}
      <div className="bg-white p-4 shadow-sm sticky top-0 z-10">
        <h1 className="text-xl font-bold text-gray-800 text-center">Get Premium</h1>
      </div>

      <div className="p-4 max-w-md mx-auto space-y-6">
        
        {/* SECTION 1: BOOST YOUR PROFILE (Matches your Image 2) */}
        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-3">Boost Your Profile</h2>
          
          <div className="flex gap-4">
            
            {/* Card 1: Super Likes */}
            <div className="flex-1 bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center relative cursor-pointer hover:border-blue-400 transition-colors">
              <div className="absolute top-2 right-2 text-gray-300">
                <Plus size={16} />
              </div>
              <div className="bg-blue-100 p-3 rounded-full mb-2">
                <Star size={24} className="text-blue-500" fill="currentColor" />
              </div>
              <h3 className="font-bold text-gray-700">Super Likes</h3>
              <p className="text-xs text-blue-500 font-medium">Stand Out</p>
            </div>

            {/* Card 2: Boosts */}
            <div className="flex-1 bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center relative cursor-pointer hover:border-purple-500 transition-colors">
              <div className="absolute top-2 right-2 text-gray-300">
                <Plus size={16} />
              </div>
              <div className="bg-purple-100 p-3 rounded-full mb-2">
                <Zap size={24} className="text-purple-600" fill="currentColor" />
              </div>
              <h3 className="font-bold text-gray-700">Boosts</h3>
              <p className="text-xs text-purple-600 font-medium">Be Top Profile</p>
            </div>

          </div>
        </div>

        {/* SECTION 2: MEMBERSHIP PLANS */}
        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-3">Membership Plans</h2>
          
          {/* Gold Plan */}
          <div className="bg-white rounded-xl shadow-sm border border-yellow-400 overflow-hidden mb-4">
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-3 text-white text-center font-bold">
              GOLD
            </div>
            <div className="p-5">
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-3 text-sm text-gray-600">
                  <Check size={18} className="text-green-500" /> Unlimited Likes
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-600">
                  <Check size={18} className="text-green-500" /> See Who Likes You
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-600">
                  <Check size={18} className="text-green-500" /> 5 Super Likes / week
                </li>
              </ul>
              <button className="w-full py-3 rounded-full bg-yellow-500 text-white font-bold shadow-lg hover:bg-yellow-600 transition">
                Upgrade for $14.99
              </button>
            </div>
          </div>

          {/* Platinum Plan */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-800 overflow-hidden">
             <div className="bg-gray-900 p-3 text-white text-center font-bold">
              PLATINUM
            </div>
            <div className="p-5">
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-3 text-sm text-gray-600">
                  <Check size={18} className="text-green-500" /> Everything in Gold
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-600">
                  <Check size={18} className="text-green-500" /> Prioritized Likes
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-600">
                  <Check size={18} className="text-green-500" /> 1 Boost / month
                </li>
              </ul>
              <button className="w-full py-3 rounded-full bg-gray-900 text-white font-bold shadow-lg hover:bg-black transition">
                Upgrade for $24.99
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default PremiumPage;