import React from 'react';
import { Heart } from 'lucide-react';

const customStyles = `
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
    
    @keyframes pulse {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.2); opacity: 0.5; }
    }
    
    @keyframes bounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-10px); }
    }
    
    @keyframes float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-20px); }
    }
    
    @keyframes slideIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
    }
    
    .heart-rotate {
        animation: spin 3s linear infinite;
    }
    
    .heart-pulse {
        animation: pulse 1.5s ease-in-out infinite;
    }
    
    .dot-bounce {
        animation: bounce 1s ease-in-out infinite;
    }
`;

export default function Loading() {
    return (
        <>
            <style>{customStyles}</style>
            
            <div className="min-h-screen w-full bg-gradient-to-br from-[#E6E6FA] via-purple-200 to-purple-300 flex items-center justify-center overflow-hidden">
                
                {/* Main Container */}
                <div className="flex flex-col items-center justify-center gap-8">
                    
                    {/* Animated Hearts Circle */}
                    <div className="relative w-32 h-32">
                        {/* Center Heart */}
                        <div className="absolute inset-0 flex items-center justify-center heart-pulse">
                            <Heart className="w-12 h-12 text-purple-600 fill-purple-600" />
                        </div>
                        
                        {/* Rotating Hearts */}
                        <div className="absolute inset-0 heart-rotate">
                            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2">
                                <Heart className="w-6 h-6 text-purple-500 fill-purple-500" />
                            </div>
                            <div className="absolute right-0 top-1/2 transform translate-x-2 -translate-y-1/2">
                                <Heart className="w-6 h-6 text-purple-500 fill-purple-500" />
                            </div>
                            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-2">
                                <Heart className="w-6 h-6 text-purple-500 fill-purple-500" />
                            </div>
                            <div className="absolute left-0 top-1/2 transform -translate-x-2 -translate-y-1/2">
                                <Heart className="w-6 h-6 text-purple-500 fill-purple-500" />
                            </div>
                        </div>
                        
                        {/* Outer Ring */}
                        <div className="absolute inset-0 border-3 border-purple-300 rounded-full opacity-30" style={{ animation: 'spin 4s linear infinite' }}></div>
                        <div className="absolute inset-4 border-2 border-purple-400 rounded-full opacity-20" style={{ animation: 'spin 6s linear infinite reverse' }}></div>
                    </div>
                    
                    {/* Text with Animation */}
                    <div className="text-center" style={{ animation: 'slideIn 0.8s ease-out' }}>
                        <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent mb-2">
                            Finding Your Match
                        </h2>
                        <p className="text-gray-600 text-lg">Loading amazing people...</p>
                    </div>
                    
                    {/* Bouncing Dots */}
                    <div className="flex gap-2">
                        <div className="w-3 h-3 bg-purple-600 rounded-full dot-bounce" style={{ animationDelay: '0s' }}></div>
                        <div className="w-3 h-3 bg-purple-500 rounded-full dot-bounce" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-3 h-3 bg-purple-400 rounded-full dot-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                    
                    {/* Floating Background Elements */}
                    <div className="absolute top-20 left-10 w-20 h-20 bg-purple-300/20 rounded-full blur-2xl animate-pulse"></div>
                    <div className="absolute bottom-20 right-10 w-32 h-32 bg-purple-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                    <div className="absolute top-1/2 right-1/4 w-24 h-24 bg-purple-300/20 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                </div>
                
                {/* Bottom Text */}
                <div className="absolute bottom-10 text-center text-gray-600">
                    <p className="text-sm">💜 Connecting Hearts Together</p>
                </div>
            </div>
        </>
    );
}