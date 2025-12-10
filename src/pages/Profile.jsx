import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  CheckCircle2,
  Pencil,
  ChevronRight,
  Plus,
  Lock,
  Check,
  Heart,
  Star,
  Zap,
  Flame,
  X,
  LogOut,
  Loader,
  User
} from 'lucide-react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, doc, onSnapshot, updateDoc } from 'firebase/firestore'; // Added updateDoc

// --- IMPORTANT: Import Storage and DB from your shared config ---
import { db as sharedDb, storage as sharedStorage } from '../firebaseConfig';

// --- IMPORT EXTERNAL COMPONENT ---
import EditProfile from '../components/EditProfile.jsx';

// --- CONFIGURATION & UTILITIES ---
const FALLBACK_FIREBASE_CONFIG = {
  apiKey: "AIzaSyBEHnNpIfnVyqpcbA5ysFPa-ku87VdMYV0",
  authDomain: "bsss-dating.firebaseapp.com",
  projectId: "bsss-dating",
  storageBucket: "bsss-dating.firebasestorage.app",
  messagingSenderId: "186492166278",
  appId: "1:186492166278:web:92b9d24a2830fb7d97b107",
  measurementId: "G-Z3CCD9ZPMJ"
};

const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

const getFirebaseConfig = () => {
  try {
    const injectedConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');
    if (Object.keys(injectedConfig).length > 0) {
      return injectedConfig;
    }
  } catch (e) {
    // Fallback
  }
  return FALLBACK_FIREBASE_CONFIG;
};

const getUserDocPath = (userId) => {
  return `artifacts/${appId}/users/${userId}/profile/data`;
};

// --- RAZORPAY SCRIPT LOADER ---
const loadRazorpayScript = (src) => {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

// --- UI COMPONENTS ---

const DoubleDateIcon = () => (
  <div className="relative h-12 w-12">
    <span className="absolute top-0 left-0 text-4xl transform -translate-x-1 translate-y-1">
      💑
    </span>
    <span className="absolute bottom-0 right-0 flex items-center justify-center w-8 h-8 bg-white border-4 border-white rounded-full transform translate-x-1 -translate-y-1">
      <Heart
        size={20}
        fill="currentColor"
        className="text-pink-500"
      />
    </span>
  </div>
);

const BrandLogo = ({ type, textColor = "text-black" }) => (
  <div className="flex items-baseline space-x-2">
    <span className={`text-3xl font-extrabold ${textColor}`}>BSSS</span>
    <span className={`text-[8px] font-bold px-2 py-0.5 rounded-sm uppercase ${type === 'gold' ? 'bg-yellow-500 text-black' :
        type === 'platinum' ? 'bg-gray-200 text-black' :
          'bg-red-500 text-white' // plus
      }`}>
      {type}
    </span>
  </div>
);

const ProfileHeader = ({ userData, onNavigate, onSignOut }) => {
  const user = userData?.auth;
  const profile = userData?.profile || {};

  const fields = [
    user?.displayName || profile.name, 
    user?.photoURL || profile.photos?.[0], 
    profile.age, 
    profile.city, 
    profile.gender,
    profile.aboutMe, 
    profile.jobTitle, 
    profile.photos?.length > 0
  ];
  const completed = fields.filter(Boolean).length;
  const percentage = Math.max(10, Math.round((completed / fields.length) * 100));

  const displayName = user?.displayName || profile.name || "User";
  const age = profile.age || "";
  const displayAge = age ? `, ${age}` : "";
  const photoURL = user?.photoURL || (profile.photos?.[0] || `https://placehold.co/100x100/fecaca/991b1b?text=${displayName?.[0] || 'U'}`);

  return (
    <div className=" flex items-center justify-between px-4 pt-6   sm:justify-start sm:gap-[20px]">
      <div className=" mr-8 relative w-24 h-24">
        <svg className="w-full h-full" viewBox="0 0 100 100">
          <circle
            className="text-gray-200"
            strokeWidth="8"
            stroke="currentColor"
            fill="transparent"
            r="42"
            cx="50"
            cy="50"
          />
          <circle
            className="text-red-500 transition-all duration-1000 ease-out"
            strokeWidth="8"
            strokeDasharray="264"
            strokeDashoffset={264 - (percentage / 100) * 264}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r="42"
            cx="50"
            cy="50"
            transform="rotate(-90 50 50)"
          />
          <text
            x="50"
            y="50"
            dominantBaseline="middle"
            textAnchor="middle"
            className="text-lg font-bold text-red-500 fill-current"
          >
            {percentage}%
          </text>
        </svg>
        <div className="absolute inset-0 p-4">
          <img
            className="w-full h-full rounded-full object-cover"
            src={photoURL}
            alt="Profile"
            onError={(e) => e.target.src = `https://placehold.co/96x96/fecaca/991b1b?text=${displayName?.[0] || 'U'}`}
          />
        </div>
      </div>

      <div className=" flex flex-col items-start -ml-6">
        <div className="flex items-center space-x-1">
          <h1 className="text-2xl font-bold truncate max-w-[150px]">{displayName}{displayAge}</h1>
          <CheckCircle2 size={20} className="text-blue-500 fill-white" />
        </div>
        <button
          onClick={() => onNavigate('edit')}
          className="flex items-center cursor-pointer justify-center px-4 py-2 mt-2 space-x-2 text-sm font-semibold text-white bg-black rounded-full shadow-md hover:bg-gray-800 transition-colors"
        >
          <Pencil size={14} />
          <span>Edit profile</span>
        </button>
      </div>
      
      <div className="w-24 flex justify-end">
         <button onClick={onSignOut} className="text-gray-400 hover:text-red-500 transition-colors p-2" title="Sign Out">
            <LogOut size={20} />
         </button>
      </div>
    </div>
  );
};

const DoubleDateBanner = () => (
  <div className="px-4 mt-6">
    <div className="flex items-center justify-between cursor-pointer p-4 bg-white rounded-lg shadow-sm">
      <div className="flex items-center space-x-4">
        <DoubleDateIcon />
        <div>
          <h2 className="font-bold text-gray-800">Try Double Date</h2>
          <p className="text-sm text-gray-500">
            Invite your friends and find other pairs.
          </p>
        </div>
      </div>
      <ChevronRight size={24} className="text-gray-400" />
    </div>
  </div>
);

const ActionGrid = () => (
  <div className="grid grid-cols-3 gap-3 px-4 mt-6">
    <ActionCard
      icon={<Star size={36} className="text-blue-500" fill="currentColor" />}
      title="Super Likes"
      subtitle="GET MORE"
      subtitleColor="text-blue-500"
    />
    <ActionCard
      icon={<Zap size={36} className="text-purple-600" fill="currentColor" />}
      title="Boosts"
      subtitle="GET MORE"
      subtitleColor="text-purple-600"
    />
    <ActionCard
      icon={<Flame size={36} className="text-red-500" fill="currentColor" />}
      title="Subscriptions"
      subtitle="UPGRADE"
      subtitleColor="text-red-500"
    />
  </div>
);

const ActionCard = ({ icon, title, subtitle, subtitleColor }) => (
  <div className="relative flex flex-col items-center justify-center h-32 p-3 text-center bg-white rounded-lg shadow-sm">
    <button className="absolute top-2 cursor-pointer right-2 flex items-center justify-center w-5 h-5 bg-gray-200 rounded-full">
      <Plus size={14} className="text-gray-600" />
    </button>
    <div className="mt-2">{icon}</div>
    <h3 className="mt-2 text-sm font-semibold text-gray-700">{title}</h3>
    {subtitle && (
      <p className={`mt-1 text-xs font-bold ${subtitleColor}`}>{subtitle}</p>
    )}
  </div>
);

const FeatureRow = ({ title, textColor, currentType, freeFeatures }) => {
  const isFreeFeature = freeFeatures.includes(title);

  return (
    <div className="grid grid-cols-3 items-center mt-3 text-center">
      <span className={`text-sm font-medium text-left ${textColor}`}>{title}</span>

      <span className={`flex justify-center ${textColor} opacity-70`}>
        {isFreeFeature ? <Check size={20} /> : <Lock size={18} />}
      </span>

      <span className={`flex justify-center ${textColor}`}>
        <Check size={20} />
      </span>
    </div>
  );
};

// Updated UpgradeCard to accept onUpgrade
const UpgradeCard = ({ data, freeFeatures, onUpgrade }) => {
  return (
    <div className="min-w-full px-4 box-border snap-center md:min-w-0 md:px-0">
      <div className={`p-5 rounded-lg shadow-lg bg-gradient-to-br ${data.gradient}`}>

        <div className=" flex items-center justify-between">
          <BrandLogo type={data.type} textColor={data.textColor} />

          {data.type !== 'Free' && (
            <button 
              onClick={() => onUpgrade && onUpgrade(data)}
              className={`px-8 py-2 cursor-pointer font-bold rounded-full shadow-md text-md ${data.btnColor} ${data.btnTextColor}`}
            >
              Upgrade
            </button>
          )}
        </div>

        <div className={`mt-5 ${data.textColor}`}>
          <div className="grid grid-cols-3 text-sm font-semibold text-center">
            <span className="text-left">What's Included</span>
            <span className="opacity-70">Free</span>
            <span className="opacity-90 capitalize">{data.type}</span>
          </div>

          {data.features.map((feature, index) => (
            <FeatureRow
              key={index}
              title={feature}
              textColor={data.textColor}
              currentType={data.type}
              freeFeatures={freeFeatures}
            />
          ))}
        </div>

      </div>
    </div>
  );
};

// Updated UpgradeCarousel to pass onUpgrade
const UpgradeCarousel = ({ onUpgrade }) => {
  const [activeIndex, setActiveIndex] = useState(1);
  const scrollRef = useRef(null);

  const tiers = [
    {
      type: 'Free',
      gradient: 'from-purple-500 to-purple-800',
      textColor: 'text-white',
      btnColor: 'bg-white',
      btnTextColor: 'text-purple-700',
      features: ['Profile creation', 'Limited likes', 'Limited chatting']
    },
    {
      type: 'gold',
      gradient: 'from-yellow-300 via-amber-400 to-orange-400',
      textColor: 'text-black',
      btnColor: 'bg-yellow-400',
      btnTextColor: 'text-black',
      features: ['Unlimited likes', 'Unlimited chatting', 'See who likes']
    },
    {
      type: 'platinum',
      gradient: 'from-gray-800 via-gray-900 to-black',
      textColor: 'text-white',
      btnColor: 'bg-white',
      btnTextColor: 'text-black',
      features: ['Rewind swipe', 'Unlimited super likes', 'Profile boost']
    },
  ];

  const freeFeatures = tiers.find(t => t.type === 'Free')?.features || [];

  const handleScroll = () => {
    if (scrollRef.current) {
      const scrollLeft = scrollRef.current.scrollLeft;
      const width = scrollRef.current.offsetWidth;
      const index = Math.round(scrollLeft / width);
      setActiveIndex(index);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      const width = scrollRef.current.offsetWidth;
      scrollRef.current.scrollTo({ left: width * 1, behavior: 'auto' });
    }
  }, []);

  return (
    <div className="mt-6">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4 md:grid md:grid-cols-3 md:gap-4 md:px-4 md:overflow-visible"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {tiers.map((tier, index) => (
          <UpgradeCard 
            key={index} 
            data={tier} 
            freeFeatures={freeFeatures} 
            onUpgrade={onUpgrade} // Passing the handler
          />
        ))}
      </div>

      <div className="flex justify-center w-full space-x-1.5 md:hidden">
        {tiers.map((_, index) => (
          <div
            key={index}
            className={`w-2 h-2 rounded-full transition-colors duration-300 ${activeIndex === index ? 'bg-gray-800' : 'bg-gray-300'
              }`}
          ></div>
        ))}
      </div>
    </div>
  );
};

const AuthorSection = ({ onOpenPopup }) => (
  <div className="px-4 mt-8 mb-4">
    <button
      onClick={onOpenPopup}
      className="w-full p-3 bg-white cursor-pointer rounded-lg shadow-sm hover:shadow-md transition-all flex items-center justify-between group"
    >
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm overflow-hidden">
          <img src="/honey.jpg" alt="Honey" className="w-full h-full object-cover" onError={(e) => e.target.src='https://placehold.co/100x100?text=HR'} />
        </div>
        <div className="text-left">
          <p className="text-xs text-gray-500 font-medium">Created by</p>
          <p className="text-sm font-bold text-gray-800">Honey Raghuwanshi</p>
        </div>
      </div>
      <ChevronRight size={18} className="text-gray-400 group-hover:text-gray-600 transition-colors" />
    </button>
  </div>
);

const AuthorPopup = ({ onClose }) => (
  <div
    className="fixed inset-0 bg-black/10 bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
    onClick={onClose}
  >
    <div
      className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden transform transition-all"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="relative h-40 bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 flex items-center justify-center">
        <button
          onClick={onClose}
          className="absolute top-4 cursor-pointer right-4 w-10 h-10 bg-white bg-opacity-20 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-opacity-30 transition-all"
        >
          <X size={20} className="text-black" />
        </button>
        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-xl overflow-hidden">
          <img src="/honey.jpg" alt="Honey" className="w-full h-full object-cover" onError={(e) => e.target.src='https://placehold.co/100x100?text=HR'} />
        </div>
      </div>

      <div className="p-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Honey Raghuwanshi</h2>
          <p className="text-sm text-gray-500 mt-1">Developer</p>
        </div>

        <div className="space-y-4">
          <div className="flex items-start space-x-3 bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-xl">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md">
              <span className="text-xl">🛠</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">Professional</p>
              <p className="text-xs text-gray-600 mt-1">Currently studying in BSSS College 3rd year in BA Economics</p>
            </div>
          </div>

          <div className="flex items-start space-x-3 bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-xl">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md">
              <span className="text-xl">🎨</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">Design Philosophy</p>
              <p className="text-xs text-gray-600 mt-1">Creating intuitive interfaces that blend aesthetics with functionality.</p>
            </div>
          </div>

          <div className="flex items-start space-x-3 bg-gradient-to-r from-pink-50 to-red-50 p-4 rounded-xl">
            <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md">
              <span className="text-xl">🚀</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">Expertise</p>
              <p className="text-xs text-gray-600 mt-1">React, TypeScript, Tailwind CSS, and modern UI/UX patterns.</p>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 py-3 cursor-pointer bg-gradient-to-r from-blue-500 via-purple-600 to-pink-500 text-white font-semibold rounded-full hover:shadow-lg transition-all"
        >
          Got it!
        </button>
      </div>
    </div>
  </div>
);

const ProfileScreen = ({ onNavigate, userData, onSignOut, db }) => {
  const [showAuthorPopup, setShowAuthorPopup] = useState(false);

  // --- HANDLE PAYMENT UPGRADE ---
  const handleUpgrade = async (plan) => {
    // 1. Define plan prices (in INR)
    const prices = {
      'gold': 199,
      'platinum': 499
    };
    
    const amount = prices[plan.type];
    if (!amount) return; // Should handle Free tier or unknown

    // 2. Load Razorpay SDK
    const res = await loadRazorpayScript("https://checkout.razorpay.com/v1/checkout.js");
    if (!res) {
      alert("Razorpay SDK failed to load. Please check your internet connection.");
      return;
    }

    // 3. Create Order on Server
    // Replace with your actual Cloud Function URL after deployment
    const functionUrl = "https://us-central1-bsss-dating.cloudfunctions.net/createRazorpayOrder"; 
    
    try {
        const response = await fetch(functionUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: amount, currency: "INR" })
        });
        
        if (!response.ok) throw new Error("Network response was not ok");
        
        const orderData = await response.json();

        // 4. Razorpay Options
        const options = {
            key: "YOUR_RAZORPAY_KEY_ID", // Replace with your Test Key ID
            amount: orderData.amount,
            currency: orderData.currency,
            name: "BSSS Dating",
            description: `Upgrade to ${plan.type}`,
            order_id: orderData.id, 
            handler: async function (response) {
                // 5. Payment Success Handler
                console.log("Payment Successful", response);

                // Update User Subscription in Firestore
                if (userData?.auth?.uid && db) {
                  try {
                    // Update main user doc or profile doc depending on your structure
                    // Here updating the user root doc to give them 'gold'/'platinum' status
                    const userRef = doc(db, "users", userData.auth.uid);
                    await updateDoc(userRef, {
                      subscriptionTier: plan.type,
                      subscriptionDate: new Date().toISOString(),
                      razorpayPaymentId: response.razorpay_payment_id
                    });
                    alert(`Success! You are now a ${plan.type} member.`);
                  } catch (err) {
                    console.error("Error updating profile:", err);
                    alert("Payment received, but failed to update profile automatically. Please contact support.");
                  }
                }
            },
            prefill: {
                name: userData?.profile?.name || "",
                email: userData?.auth?.email || "",
                contact: "" 
            },
            theme: {
                color: "#9333ea"
            }
        };

        const paymentObject = new window.Razorpay(options);
        paymentObject.open();

    } catch (error) {
        console.error("Payment initiation failed", error);
        alert("Something went wrong initializing payment. Please try again.");
    }
  };

  return (
    <div className="flex flex-col pb-4">
      <ProfileHeader userData={userData} onNavigate={onNavigate} onSignOut={onSignOut} />

      <DoubleDateBanner />

      <ActionGrid />

      {/* Pass handleUpgrade to the carousel */}
      <UpgradeCarousel onUpgrade={handleUpgrade} />

      <AuthorSection onOpenPopup={() => setShowAuthorPopup(true)} />

      {showAuthorPopup && <AuthorPopup onClose={() => setShowAuthorPopup(false)} />}
    </div>
  );
};

// --- MAIN APP COMPONENT ---

export default function Profile() {
  const [authInstance, setAuthInstance] = useState(null);
  const [dbInstance, setDbInstance] = useState(null);
  const [user, setUser] = useState(null);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [currentView, setCurrentView] = useState('profile');

  useEffect(() => {
    const firebaseConfig = getFirebaseConfig();

    if (Object.keys(firebaseConfig).length === 0 || !firebaseConfig.apiKey) {
      console.error("Firebase config is completely missing or invalid.");
      setLoading(false);
      return;
    }

    let firebaseApp;
    if (!getApps().length) {
      firebaseApp = initializeApp(firebaseConfig);
    } else {
      firebaseApp = getApp();
    }

    const auth = getAuth(firebaseApp);
    const db = getFirestore(firebaseApp);

    setAuthInstance(auth);
    setDbInstance(db);

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setUserId(currentUser.uid);
        setLoading(false);
      } else {
        try {
          if (initialAuthToken) {
            const credential = await signInWithCustomToken(auth, initialAuthToken);
            setUser(credential.user);
            setUserId(credential.user.uid);
          } else {
            const credential = await signInAnonymously(auth);
            setUser(credential.user);
            setUserId(credential.user.uid);
          }
        } catch (error) {
          console.error("Auth error:", error);
        } finally {
          setLoading(false);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (dbInstance && userId && user) {
      // Logic to sync with specific document path (artifacts vs users)
      // Usually you want to listen to "users/{uid}" or the specific profile path
      const docRef = doc(dbInstance, getUserDocPath(userId));

      const unsubscribeSnapshot = onSnapshot(docRef, (docSnap) => {
        const profileData = docSnap.exists() ? docSnap.data() : {};
        setUserData({
          auth: user,
          profile: {
            name: user.displayName,
            age: profileData.age || "",
            ...profileData, 
          }
        });
      }, (error) => {
        console.error("Error subscribing to profile:", error);
      });

      return () => unsubscribeSnapshot();
    }
  }, [dbInstance, userId, user]);

  const navigate = useCallback((view) => setCurrentView(view), []);

  const handleSignOut = async () => {
    if (authInstance) {
      try {
        await signOut(authInstance);
      } catch (error) {
        console.error("Error signing out:", error);
      }
    }
  };

  const renderView = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center h-full pt-20">
          <Loader size={32} className="text-red-500 animate-spin" />
          <div className="mt-3 text-lg font-medium text-gray-700">Loading your profile...</div>
        </div>
      );
    }

    if (!user || !userId) {
      return (
        <div className="flex flex-col items-center justify-center h-full pt-20 p-8">
          <User size={48} className="text-red-500 mb-4" />
          <div className="text-xl font-bold text-gray-800">Authentication Required</div>
          <p className="mt-2 text-gray-600 text-center">Please ensure your authentication token is valid or try refreshing.</p>
        </div>
      );
    }

    switch (currentView) {
      case 'profile':
        // IMPORTANT: Pass dbInstance so ProfileScreen can update subscription
        return <ProfileScreen onNavigate={navigate} userData={userData} onSignOut={handleSignOut} db={dbInstance} />;
      case 'edit':
        return (
          <EditProfile
            onNavigate={navigate}
            userData={userData}
            setUserData={setUserData}
            db={sharedDb}
            userId={userId}
            storage={sharedStorage}
          />
        );
      default:
        return <ProfileScreen onNavigate={navigate} userData={userData} onSignOut={handleSignOut} db={dbInstance} />;
    }
  };

  return (
    <div className=" flex justify-center min-h-screen p-4 bg-gray-300 font-inter">
      <div className=" w-full max-w-sm overflow-hidden bg-gray-100 rounded-2xl shadow-xl overflow-y-auto sm:max-w-[95%]">
        {renderView()}
      </div>
    </div>
  );
}