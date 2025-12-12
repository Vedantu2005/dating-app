import React from 'react';
import { Flame, MessageCircle, Heart, User, LogOut } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { useAuth } from '../context/AuthContext';

const customStyles = `
    @keyframes slideDown {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
    }
    
    @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.7; }
    }
`;

export default function Navbar() {
    const location = useLocation();
    const { currentUser } = useAuth(); 

    const navItems = [
        { 
            id: 'discover', 
            label: 'Discover', 
            icon: Flame,
            color: 'from-orange-500 to-red-500',
            hoverBg: 'hover:bg-orange-100',
            to: '/discover' 
        },
        { 
            id: 'confessions', 
            label: 'Confessions', 
            icon: MessageCircle,
            color: 'from-blue-500 to-cyan-500',
            hoverBg: 'hover:bg-blue-100',
            to: '/confessions' 
        },
        { 
            id: 'chat', 
            label: 'Chat', 
            icon: Heart,
            color: 'from-pink-500 to-rose-500',
            hoverBg: 'hover:bg-pink-100',
            to: '/chat' 
        },
        { 
            id: 'profile', 
            label: 'Profile', 
            icon: User,
            color: 'from-purple-500 to-indigo-500',
            hoverBg: 'hover:bg-purple-100',
            to: '/profile' 
        },
    ];

    const handleLogout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Error signing out:", error);
        }
    };

    return (
        <>
            <style>{customStyles}</style>

            {/* Desktop Navbar */}
            <nav className="hidden md:block fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-white via-white to-purple-50 border-b border-purple-200 shadow-md" style={{ animation: 'slideDown 0.5s ease-out' }}>
                <div className="max-w-7xl mx-auto px-6" >
                    <div className="flex items-center justify-between h-20">
                        {/* Text Logo Restored */}
                        <Link to="/discover" className="flex items-center gap-3 cursor-pointer group">
                            <div>
                                <h1 className="text-[32px] font-['Satisfy'] font-normal bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
                                    BSSS Dating
                                </h1>
                            </div>
                        </Link>

                        {/* Navigation Items */}
                        <div className="flex gap-2">
                            {navItems.map((item) => {
                                const isActive = location.pathname === item.to;
                                const Icon = item.icon;

                                return (
                                    <Link
                                        key={item.id}
                                        to={item.to}
                                        className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold transition-all transform duration-300 ${
                                            isActive
                                                ? `bg-gradient-to-r ${item.color} text-white shadow-lg hover:shadow-xl scale-105`
                                                : `text-gray-700 ${item.hoverBg} hover:text-purple-700`
                                        }`}
                                    >
                                        <Icon className={`w-5 h-5 ${isActive ? 'animate-pulse' : ''}`} />
                                        <span>{item.label}</span>
                                    </Link>
                                );
                            })}
                        </div>
                        
                        {/* User Info & Logout */}
                        <div className="flex items-center gap-3">
                            {/* FIRST NAME ONLY FIX */}
                            <span className="text-sm text-gray-600">
                                {currentUser?.displayName 
                                    ? currentUser.displayName.split(' ')[0] 
                                    : currentUser?.email}
                            </span>
                            <button 
                                onClick={handleLogout}
                                className="p-2 bg-purple-50 text-purple-600 rounded-full hover:bg-purple-100 transition-all"
                                title="Logout"
                            >
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Mobile Top Bar */}
            <nav className="md:hidden fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-white via-white to-purple-50 border-b border-purple-200 shadow-md">
                <div className="flex items-center justify-center h-16 px-4">
                    <Link to="/discover" className="flex items-center gap-2">
                        <h1 className="text-[32px] font-['Satisfy'] font-normal bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent pb-1 pr-1">
                            BSSS Dating
                        </h1>
                    </Link>
                </div>
            </nav>

            {/* Mobile Bottom Bar */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-purple-50 border-t border-purple-200 z-50">
                <div className="grid grid-cols-4 gap-1 px-2 py-3">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.to;
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.id}
                                to={item.to}
                                className={`flex flex-col items-center justify-center gap-1.5 py-2 rounded-xl transition-all transform duration-300 ${
                                    isActive
                                        ? `bg-gradient-to-r ${item.color} scale-105 shadow-md`
                                        : `text-gray-600 hover:bg-purple-100`
                                }`}
                            >
                                <Icon className={`w-6 h-6 ${isActive ? 'text-white' : 'text-gray-700'}`} />
                                <span className="text-xs font-bold">{item.label}</span>
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </>
    );
}