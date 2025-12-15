// FIX: Added forwardRef and useImperativeHandle to imports
import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Ruler, Dumbbell, Cigarette, Wine, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { 
    collection, 
    onSnapshot, 
    query, 
    doc, 
    orderBy, 
    setDoc, 
    serverTimestamp,
    limit,
    getDoc,
    updateDoc,
    increment
} from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';

// --- CUSTOM SVG ICONS ---
const X = ({ size = 24, strokeWidth = 2, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 6 6 18M6 6l12 12" /></svg>
);
const Heart = ({ size = 24, fill = 'none', className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
);
const Star = ({ size = 24, fill = 'none', className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
);
const Undo2 = ({ size = 24, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M9 14 4 9l5-5" /><path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5v0a5.5 5.5 0 0 1-5.5 5.5H11" /></svg>
);
const MessageCircle = ({ size = 24, fill = 'none', className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" /></svg>
);
const MapPin = ({ size = 24, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
);
const Briefcase = ({ size = 24, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="20" height="14" x="2" y="7" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>
);
const GraduationCap = ({ size = 24, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></svg>
);
const Check = ({ size = 24, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M20 6 9 17l-5-5" /></svg>
);
const ChevronDown = ({ size = 24, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m6 9 6 6 6-6" /></svg>
);
const Info = ({ size = 24, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
);
const ChevronLeft = ({ size = 24, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m15 18-6-6 6-6" /></svg>
);
const ChevronRight = ({ size = 24, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m9 18 6-6-6-6" /></svg>
);

const THEME_COLOR = 'oklch(49.6% 0.265 301.924)';
const THEME_COLOR1 = 'oklch(19.2% 0.016 264.4)';

// --- CONFIGURATION ---
const FREE_SWIPES_LIMIT = 5;
const FREE_SUPERLIKE_LIMIT = 2;

// --- MODAL COMPONENT ---
const UpgradeModal = ({ isOpen, onClose, title, message }) => {
    const navigate = useNavigate();
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
            <div className="bg-white rounded-2xl p-6 w-[90%] max-w-sm shadow-2xl transform transition-all scale-100">
                <div className="text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-purple-100 mb-4">
                        <Sparkles className="h-6 w-6 text-purple-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">{title}</h3>
                    <p className="text-sm text-gray-500 mt-2">{message}</p>
                </div>
                <div className="mt-6 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => navigate('/profile')}
                        className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold hover:shadow-lg transition-all"
                    >
                        Upgrade
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Image Gallery ---
const ImageGallery = ({ images, className = '', objectFit = 'object-cover' }) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const safeImages = (images && images.length > 0) 
        ? images.filter(url => typeof url === 'string' && url.startsWith('http')) 
        : [];
    const displayImages = safeImages.length > 0 ? safeImages : ['https://placehold.co/400x600?text=No+Photo'];

    const goToPrevious = (e) => {
        e.stopPropagation();
        setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : displayImages.length - 1));
    };
    const goToNext = (e) => {
        e.stopPropagation();
        setCurrentImageIndex((prev) => (prev < displayImages.length - 1 ? prev + 1 : 0));
    };
    const handleImageClick = (e) => {
        e.stopPropagation();
        if (window.innerWidth >= 640) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const width = rect.width;
        if (x < width / 2) goToPrevious(e);
        else goToNext(e);
    };

    return (
        <div className={`relative w-full cursor-pointer bg-gray-900 group ${className}`} onClick={handleImageClick}>
            <img src={displayImages[currentImageIndex]} alt="Profile" className={`w-full h-full ${objectFit}`} onError={(e) => e.target.src = 'https://placehold.co/400x600?text=Image+Error'} />
            <div className="absolute top-3 left-0 right-0 flex gap-1.5 px-3">
                {displayImages.map((_, index) => (
                    <div key={index} className="h-1 flex-1 rounded-full" style={{ backgroundColor: index === currentImageIndex ? '#fff' : 'rgba(255,255,255,0.35)' }} />
                ))}
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/10 pointer-events-none" />
            <button onClick={goToPrevious} className="absolute cursor-pointer top-1/2 left-2 -translate-y-1/2 bg-black/30 text-white rounded-full p-1.5 backdrop-blur-sm transition-opacity opacity-0 group-hover:opacity-100 hidden sm:block hover:bg-black/50"><ChevronLeft size={28} /></button>
            <button onClick={goToNext} className="absolute cursor-pointer top-1/2 right-2 -translate-y-1/2 bg-black/30 text-white rounded-full p-1.5 backdrop-blur-sm transition-opacity opacity-0 group-hover:opacity-100 hidden sm:block hover:bg-black/50"><ChevronRight size={28} /></button>
        </div>
    );
};

// --- Full Profile View ---
const FullProfileView = ({ profile, onCollapse }) => {
    const basicsData = [
        { key: 'height', icon: Ruler, label: 'Height' },
        { key: 'exercise', icon: Dumbbell, label: 'Exercise' },
        { key: 'education', icon: GraduationCap, label: 'Education' },
        { key: 'smoking', icon: Cigarette, label: 'Smoking' },
        { key: 'drinking', icon: Wine, label: 'Drinking' },
        { key: 'zodiac', icon: Sparkles, label: 'Zodiac' }
    ];

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-gray-50">
            <button onClick={onCollapse} className="absolute cursor-pointer top-4 sm:top-6 left-1/2 -translate-x-1/2 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-md transition-all hover:bg-black/50"><ChevronDown size={28} /></button>
            <div className="flex-1 overflow-y-auto overflow-x-hidden">
                <ImageGallery images={profile.images} className="h-[60vh] sm:h-[70vh]" objectFit="object-contain" />
                <div className="p-4 sm:p-6 bg-white mb-2 sm:mb-3">
                    <div className="flex items-baseline gap-2.5 mb-1.5"><h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{profile.name}</h1><span className="text-2xl sm:text-3xl font-normal">{profile.age}</span></div>
                    <div className="flex flex-col gap-2.5 text-base text-gray-800">
                        <div className="flex items-center gap-2"><Briefcase size={20} className="text-gray-600" /><span>{profile.job} at {profile.company}</span></div>
                        <div className="flex items-center gap-2"><GraduationCap size={20} className="text-gray-600" /><span>{profile.school}</span></div>
                        <div className="flex items-center gap-2"><MapPin size={20} className="text-gray-600" /><span>{profile.location}</span></div>
                    </div>
                </div>
                <div className="bg-white px-4 sm:px-6 py-5 mb-2 sm:mb-3"><p className="text-gray-900 text-base leading-relaxed">{profile.bio}</p></div>
                {profile.prompts.map((prompt, index) => (<div key={index} className="bg-white px-4 sm:px-6 py-5 mb-2 sm:mb-3"><div className="text-sm font-bold uppercase tracking-wide mb-2.5" style={{ color: THEME_COLOR }}>{prompt.question}</div><p className="text-gray-900 text-base leading-relaxed">{prompt.answer}</p></div>))}
                
                <div className="bg-white px-4 sm:px-6 py-5 mb-2 sm:mb-3">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">My basics</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {basicsData.map((item) => {
                            if (!profile[item.key]) return null;
                            const IconComponent = item.icon;
                            return (
                                <div key={item.key} className="flex items-center gap-3">
                                    <IconComponent size={24} className="text-gray-500" />
                                    <div className="text-base text-gray-900">{profile[item.key]}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="bg-white px-4 sm:px-6 py-5 mb-2 sm:mb-3"><h3 className="text-xl font-bold text-gray-900 mb-4">My interests</h3><div className="flex flex-wrap gap-2.5">{profile.interests.map((interest) => (<span key={interest} className="inline-flex items-center rounded-full px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm font-semibold" style={{ backgroundColor: '#FFF5E6', color: '#CC8800', border: '1.5px solid #FFE0B2' }}>{interest}</span>))}</div></div>
            </div>
        </div>
    );
};

// --- Swipe Card ---
const SwipeCard = forwardRef(({ profile, onExpand, onSwipe, isTop }, ref) => {
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });

    const animateSwipe = (direction) => {
        const rotation = (dragOffset.x / 20);
        let finalX = 0;
        let finalY = dragOffset.y;
        if (direction === 'right') finalX = window.innerWidth / 2 + 300;
        else if (direction === 'left') finalX = -(window.innerWidth / 2 + 300);
        else if (direction === 'up') finalY = -window.innerHeight / 2 - 300;
        setDragOffset({ x: finalX, y: finalY + (rotation / 2) });
        onSwipe(direction);
    };

    useImperativeHandle(ref, () => ({ swipe(direction) { if (dragOffset.x !== 0 || dragOffset.y !== 0) return; animateSwipe(direction); } }));

    const handleStart = (clientX, clientY) => { if (!isTop) return; setIsDragging(true); setStartPos({ x: clientX, y: clientY }); };
    const handleMove = (clientX, clientY) => { if (!isDragging || !isTop) return; const x = clientX - startPos.x; const y = clientY - startPos.y; setDragOffset({ x, y }); };
    const handleEnd = () => { if (!isDragging || !isTop) return; setIsDragging(false); const threshold = 100; if (Math.abs(dragOffset.x) > threshold) animateSwipe(dragOffset.x > 0 ? 'right' : 'left'); else if (dragOffset.y < -threshold) animateSwipe('up'); else setDragOffset({ x: 0, y: 0 }); };

    const rotation = isDragging ? (dragOffset.x / 20) : (dragOffset.x === 0 ? 0 : (dragOffset.x > 100 ? 15 : -15));
    const opacity = Math.min(Math.abs(dragOffset.x) / 100, 1);
    const opacityY = Math.min(Math.abs(dragOffset.y) / 100, 1);

    return (
        <div className="absolute inset-0 touch-none group" style={{ transform: `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${rotation}deg)`, transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)', zIndex: isTop ? 10 : 1 }} onMouseDown={(e) => handleStart(e.clientX, e.clientY)} onMouseMove={(e) => handleMove(e.clientX, e.clientY)} onMouseUp={handleEnd} onMouseLeave={handleEnd} onTouchStart={(e) => handleStart(e.touches[0].clientX, e.touches[0].clientY)} onTouchMove={(e) => handleMove(e.touches[0].clientX, e.touches[0].clientY)} onTouchEnd={handleEnd}>
            <div className="h-full w-full rounded-2xl overflow-hidden relative">
                <div className="absolute top-16 left-8 z-10 -rotate-12 px-6 py-2" style={{ opacity: dragOffset.x > 0 ? opacity : 0 }}><button className="flex cursor-pointer h-16 w-16 items-center justify-center rounded-full text-white shadow-lg hover:shadow-xl transition-all transform hover:scale-110 active:scale-95" style={{ backgroundColor: THEME_COLOR }}><Heart size={32} fill="white" /></button></div>
                <div className="absolute top-16 right-8 z-10 rotate-12 rounded-lg px-6 py-2 text-red-500" style={{ opacity: dragOffset.x < 0 ? opacity : 0 }}><button className="flex cursor-pointer h-16 w-16 items-center justify-center rounded-full bg-red-500 shadow-lg text-white border-2 border-red-500 hover:shadow-xl transition-all transform hover:scale-110 active:scale-95"><X size={32} strokeWidth={2.5} /></button></div>
                <div className="absolute top-1/3 left-1/2 z-10 -translate-x-1/2 -rotate-6 rounded-lg px-6 py-2 text-blue-400" style={{ opacity: dragOffset.y < 0 ? opacityY : 0 }}><button className="flex cursor-pointer h-14 w-14 items-center justify-center rounded-full bg-blue-400 text-white shadow-lg hover:shadow-xl transition-all transform hover:scale-110 active:scale-95"><Star size={32} fill="white" /></button></div>
                <ImageGallery images={profile.images} className="h-full" />
                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 pt-10 bg-gradient-to-t from-black/90 via-black/50 to-transparent text-white">
                    <div className="flex items-baseline gap-2.5 mb-1.5"><h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{profile.name}</h1><span className="text-2xl sm:text-3xl font-normal">{profile.age}</span></div>
                    <div className="flex items-center gap-1.5 mb-2.5">{profile.badges.map((badge) => (<span key={badge} className="inline-flex items-center gap-1 rounded-full bg-white/20 backdrop-blur-md px-3 py-1 text-xs font-semibold">{badge === 'Vaccinated' && <Check size={14} />}{badge}</span>))}</div>
                    <div className="flex items-start gap-3 mb-2 text-white/90"><Briefcase size={20} className="flex-shrink-0 mt-0.5" /><div className="flex-1"><div className="text-base font-semibold">{profile.job}</div><div className="text-sm">{profile.company}</div></div></div>
                </div>
                <button onClick={onExpand} className="absolute cursor-pointer bottom-5 sm:bottom-5 right-4 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/30 backdrop-blur-md text-white transition-all hover:bg-white/50"><Info size={24} /></button>
            </div>
        </div>
    );
});

// --- ActionButtons ---
const ActionButtons = ({ onRewind, onNope, onSuperLike, onLike, onChat }) => {
    return (
        <div className="w-full pt-6 pb-4 sm:pb-8 px-4">
            <div className="flex items-center justify-center gap-4 md:gap-6">
                <button onClick={onRewind} className="flex-shrink-0 aspect-square flex h-14 w-14 items-center justify-center rounded-full bg-yellow-500 shadow-lg text-white border-2 border-yellow-500 hover:shadow-xl transition-all transform hover:scale-110 active:scale-95"><Undo2 size={24} /></button>
                <button onClick={onNope} className="flex-shrink-0 aspect-square flex h-16 w-16 items-center justify-center rounded-full bg-red-500 shadow-lg text-white border-2 border-red-500 hover:shadow-xl transition-all transform hover:scale-110 active:scale-95"><X size={32} strokeWidth={2.5} /></button>
                <button onClick={onSuperLike} className="flex-shrink-0 aspect-square flex h-14 w-14 items-center justify-center rounded-full bg-blue-400 text-white shadow-lg hover:shadow-xl transition-all transform hover:scale-110 active:scale-95"><Star size={24} fill="white" /></button>
                <button onClick={onLike} className="flex-shrink-0 aspect-square flex h-16 w-16 items-center justify-center rounded-full text-white shadow-lg hover:shadow-xl transition-all transform hover:scale-110 active:scale-95" style={{ backgroundColor: THEME_COLOR }}><Heart size={32} fill="white" /></button>
                <button onClick={onChat} className="flex-shrink-0 aspect-square flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg hover:shadow-xl transition-all transform hover:scale-110 active:scale-95" style={{ backgroundColor: THEME_COLOR1 }}><MessageCircle size={24} fill="white" /></button>
            </div>
        </div>
    );
};

const Discover = () => {
    const navigate = useNavigate(); 
    const [profiles, setProfiles] = useState([]);
    const [history, setHistory] = useState([]); 
    const [isExpanded, setIsExpanded] = useState(false);
    const [expandedProfile, setExpandedProfile] = useState(null);
    const [currentUserData, setCurrentUserData] = useState(null);
    const [usageStats, setUsageStats] = useState({ swipes: 0, superlikes: 0 }); // Local state for immediate checks
    const [modalData, setModalData] = useState({ isOpen: false, title: "", message: "" });
    const topCardRef = useRef();
    const currentUserId = auth.currentUser?.uid;

    useEffect(() => {
        if (!currentUserId) return;
        const userRef = doc(db, "users", currentUserId);
        const unsub = onSnapshot(userRef, (snapshot) => {
            setCurrentUserData(snapshot.data());
        });
        return () => unsub();
    }, [currentUserId]);

    // --- INSTANT USAGE SYNC (The Fix for Lag) ---
    useEffect(() => {
        if (!currentUserId) return;
        const today = new Date().toISOString().split('T')[0];
        const usageRef = doc(db, "users", currentUserId, "usage", "daily");

        const unsubUsage = onSnapshot(usageRef, (docSnap) => {
            if (docSnap.exists() && docSnap.data().date === today) {
                // Update local state instantly from DB
                setUsageStats({
                    swipes: docSnap.data().swipes || 0,
                    superlikes: docSnap.data().superlikes || 0
                });
            } else {
                // Reset locally if new day (DB update handled in background)
                setUsageStats({ swipes: 0, superlikes: 0 });
            }
        });
        return () => unsubUsage();
    }, [currentUserId]);

    // --- FETCH PROFILES LOGIC ---
    useEffect(() => {
        if (!currentUserId) return;
        const q = query(collection(db, 'users'), orderBy("displayName", "asc"), limit(500));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedProfiles = snapshot.docs
                .filter(doc => doc.id !== currentUserId) 
                .map(doc => {
                    const data = doc.data();
                    if (!data.displayName || data.displayName.trim() === '') return null;
                    let validImages = [];
                    if (Array.isArray(data.photos) && data.photos.length > 0) {
                        validImages = data.photos.filter(url => typeof url === 'string' && url.startsWith('http'));
                    } else if (typeof data.avatarUrl === 'string' && data.avatarUrl.startsWith('http')) {
                        validImages = [data.avatarUrl];
                    }
                    if (validImages.length === 0) return null;
                    const displayAge = data.age ? data.age : "";
                    return {
                        id: doc.id,
                        name: data.displayName,
                        age: displayAge,
                        images: validImages,
                        job: data.jobTitle || 'Undisclosed',
                        company: data.company || '',
                        school: data.school || '',
                        location: data.city || 'Nearby',
                        height: data.height || '',
                        exercise: 'Active',
                        education: data.education || '',
                        smoking: data.smoking || '',
                        drinking: data.drinking || '',
                        zodiac: data.zodiac || '',
                        bio: data.aboutMe || "No bio yet.",
                        prompts: data.prompts || [],
                        interests: data.interests || [],
                        badges: ['Verified'],
                    };
                })
                .filter(profile => profile !== null);
            setProfiles(fetchedProfiles);
        });
        return () => unsubscribe();
    }, [currentUserId]); 

    // --- SYNCHRONOUS CHECK (0ms Delay) ---
    const checkUsageInstant = (actionType) => {
        const subscriptionTier = currentUserData?.subscriptionTier || 'Free';

        // 1. PLATINUM (Unlimited Everything)
        if (subscriptionTier === 'platinum') return true;

        // 2. GOLD
        if (subscriptionTier === 'gold') {
            if (actionType === 'rewind') {
                setModalData({ isOpen: true, title: "Upgrade to Platinum", message: "Rewind is exclusive to Platinum members!" });
                return false;
            }
            if (actionType === 'superlike') {
                 if (usageStats.superlikes >= FREE_SUPERLIKE_LIMIT) {
                    setModalData({ isOpen: true, title: "Out of Super Likes", message: "Get Platinum for unlimited Super Likes!" });
                    return false;
                }
            }
            return true; 
        }

        // 3. FREE TIER
        if (subscriptionTier === 'Free') {
            if (actionType === 'rewind') {
                setModalData({ isOpen: true, title: "Rewind is Premium", message: "Upgrade to undo your last swipe." });
                return false;
            }
            if (actionType === 'message') {
                setModalData({ isOpen: true, title: "Chat Locked", message: "Upgrade to Gold to message instantly." });
                return false;
            }
            if (actionType === 'like' || actionType === 'nope') {
                if (usageStats.swipes >= FREE_SWIPES_LIMIT) {
                    setModalData({ isOpen: true, title: "Daily Limit Reached", message: `You've used your ${FREE_SWIPES_LIMIT} daily swipes. Upgrade to Subscription for Unlimited!` });
                    return false;
                }
            }
            if (actionType === 'superlike') {
                if (usageStats.superlikes >= FREE_SUPERLIKE_LIMIT) {
                    setModalData({ isOpen: true, title: "Daily Super Likes Reached", message: `You've used your ${FREE_SUPERLIKE_LIMIT} Super Likes. Upgrade for more!` });
                    return false;
                }
            }
        }
        return true;
    };

    // --- BACKGROUND UPDATE (No Await) ---
    const updateUsageBackground = async (actionType) => {
        const today = new Date().toISOString().split('T')[0];
        const usageRef = doc(db, "users", currentUserId, "usage", "daily");
        try {
            await setDoc(usageRef, { date: today }, { merge: true });
            const updates = { date: today };
            if (actionType === 'like' || actionType === 'nope') updates.swipes = increment(1);
            if (actionType === 'superlike') updates.superlikes = increment(1);
            await updateDoc(usageRef, updates);
        } catch (error) { console.error(error); }
    };

    const handleSwipe = (direction) => {
        if (!currentUserId || profiles.length === 0) return;

        let actionType = 'like';
        if (direction === 'left') actionType = 'nope';
        if (direction === 'up') actionType = 'superlike';

        // 1. INSTANT CHECK
        if (!checkUsageInstant(actionType)) return;

        // 2. OPTIMISTIC UPDATE (Update local state instantly so spam clicking is blocked)
        if (actionType === 'like' || actionType === 'nope') {
            setUsageStats(prev => ({ ...prev, swipes: prev.swipes + 1 }));
        } else if (actionType === 'superlike') {
            setUsageStats(prev => ({ ...prev, superlikes: prev.superlikes + 1 }));
        }

        // 3. UI UPDATE (Animation)
        const swipedUser = profiles[profiles.length - 1];
        const swipedUserId = swipedUser.id;
        setTimeout(() => {
            setHistory((prev) => [...prev, swipedUser]); 
            setProfiles((prev) => prev.slice(0, -1));    
        }, 200);

        // 4. BACKGROUND DB WRITES (Don't wait for these)
        updateUsageBackground(actionType);

        if (direction === 'right' || direction === 'up') {
            setDoc(doc(db, "users", currentUserId, "swipes", swipedUserId), {
                liked: true, super: direction === 'up', timestamp: serverTimestamp()
            });
            const chatId = [currentUserId, swipedUserId].sort().join("_");
            setDoc(doc(db, "matches", chatId), {
                users: [currentUserId, swipedUserId], usersIncluded: { [currentUserId]: true, [swipedUserId]: true }, timestamp: serverTimestamp(), lastMessage: "You matched! Say hi 👋"
            });
        }
    };

    const handleRewind = () => {
        if (!checkUsageInstant('rewind')) return;
        if (history.length === 0) return;
        const lastSwipedUser = history[history.length - 1];
        setHistory((prev) => prev.slice(0, -1));
        setProfiles((prev) => [...prev, lastSwipedUser]);
    };

    const handleChat = () => {
        if (!checkUsageInstant('message')) return;
        navigate('/chat');
    };

    const triggerSwipe = (direction) => {
        let actionType = 'like';
        if (direction === 'left') actionType = 'nope';
        if (direction === 'up') actionType = 'superlike';
        
        if (checkUsageInstant(actionType)) {
            if (topCardRef.current) topCardRef.current.swipe(direction);
        }
    };

    const handleExpand = (profile) => {
        setExpandedProfile(profile);
        setIsExpanded(true);
    };

    return (
        <div className="mx-auto max-w-sm w-full h-[calc(100dvh-9rem)] flex flex-col mt-0 lg:mt-8 relative">
            <UpgradeModal 
                isOpen={modalData.isOpen} 
                onClose={() => setModalData({ ...modalData, isOpen: false })} 
                title={modalData.title} 
                message={modalData.message} 
            />

            <div className="flex-1 relative min-h-0">
                <div className="absolute inset-0 p-4 sm:p-6">
                    {profiles.length > 0 ? (
                        profiles.map((profile, index) => (
                            <SwipeCard
                                key={profile.id}
                                ref={index === profiles.length - 1 ? topCardRef : null}
                                profile={profile}
                                onExpand={() => handleExpand(profile)}
                                onSwipe={handleSwipe}
                                isTop={index === profiles.length - 1}
                            />
                        ))
                    ) : (
                        <div className="flex h-full items-center justify-center rounded-2xl bg-gray-100 text-center p-6">
                            <div>
                                <h2 className="text-2xl font-semibold text-gray-700 mb-2">No more profiles</h2>
                                <p className="text-gray-500">Check back later for new matches!</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            
            <div className="flex-shrink-0">
                <ActionButtons 
                    onLike={() => triggerSwipe('right')} 
                    onNope={() => triggerSwipe('left')} 
                    onSuperLike={() => triggerSwipe('up')} 
                    onRewind={handleRewind} 
                    onChat={handleChat}
                />
            </div>
            
            {isExpanded && <FullProfileView profile={expandedProfile} onCollapse={() => setIsExpanded(false)} />}
        </div>
    );
};

export default Discover;