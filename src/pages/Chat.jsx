import React, { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  Send,
  MessageSquare,
  Search,
  Heart,
  Image,
  Loader2,
  MoreVertical,
  Sparkles // Imported for the Modal
} from "lucide-react";
import { db, storage, realtimeDB } from "../firebaseConfig";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from 'react-router-dom'; // Imported for redirection
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  where,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment 
} from "firebase/firestore";
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import { ref as rtdbRef, onValue } from "firebase/database";

// --- LIMIT CONFIG ---
const FREE_MSG_LIMIT = 20;

const customStyles = `
  .custom-scrollbar::-webkit-scrollbar { width: 5px; }
  .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
  .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 10px; }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #94a3b8; }
`;

// --- MODAL COMPONENT (Added for consistent UI) ---
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

const getChatId = (userAId, userBId) => {
  return userAId < userBId ? `${userAId}_${userBId}` : `${userBId}_${userAId}`;
};

const ChatList = ({ setSelectedChat, selectedChatId, currentUserId }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statuses, setStatuses] = useState({});

  useEffect(() => {
    const statusRef = rtdbRef(realtimeDB, "status");
    const unsub = onValue(statusRef, (snap) => setStatuses(snap.val() || {}));
    return () => unsub();
  }, []);

  const toggleFavorite = async (e, match) => {
    e.stopPropagation(); 
    if (!currentUserId || !match.chatId) return;

    const matchRef = doc(db, "matches", match.chatId);
    try {
      await updateDoc(matchRef, {
        [`favorites.${currentUserId}`]: !match.isFavorite
      });
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  useEffect(() => {
    if (!currentUserId) { setIsLoading(false); return; }

    const matchesQuery = query(
      collection(db, "matches"),
      where(`usersIncluded.${currentUserId}`, "==", true)
    );

    const unsubscribe = onSnapshot(matchesQuery, async (snapshot) => {
        const promises = snapshot.docs.map(async (docSnap) => {
            const data = docSnap.data();
            const otherUserId = data.users.find(uid => uid !== currentUserId);
            if (!otherUserId) return null;

            try {
                const userSnap = await getDoc(doc(db, "users", otherUserId));
                if (!userSnap.exists()) return null;
                const userData = userSnap.data();

                if (searchTerm && userData.displayName && !userData.displayName.toLowerCase().includes(searchTerm.toLowerCase())) {
                    return null;
                }

                return {
                    id: otherUserId,
                    chatId: docSnap.id,
                    name: userData.displayName || "User",
                    avatarUrl: (userData.photos && userData.photos[0]) || userData.avatarUrl || "https://placehold.co/100",
                    lastMessage: data.lastMessage || "Start chatting...",
                    isFavorite: data.favorites?.[currentUserId] === true,
                    timestamp: data.timestamp
                };
            } catch (e) { return null; }
        });

        const results = await Promise.all(promises);
        
        const validUsers = results.filter(Boolean).sort((a, b) => {
            if (a.isFavorite !== b.isFavorite) {
                return a.isFavorite ? -1 : 1;
            }
            const timeA = a.timestamp?.seconds || 0;
            const timeB = b.timestamp?.seconds || 0;
            return timeB - timeA; 
        });
        
        setUsers(validUsers);
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, [currentUserId, searchTerm]);

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      <style>{customStyles}</style>
      
      <div className="px-6 py-6 bg-[#9333ea] text-white shadow-md z-10 flex-shrink-0">
        <h1 className="text-2xl font-bold mb-4">Messages</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/70" />
          <input
            type="text"
            placeholder="Search matches..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/20 rounded-xl text-base md:text-sm text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 border-none"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
        {isLoading ? (
             <div className="py-10 text-center"><Loader2 className="w-6 h-6 mx-auto animate-spin text-purple-500" /></div>
        ) : users.length > 0 ? (
            users.map((match) => {
              const isOnline = statuses[match.id]?.state === "online";
              return (
                <button
                  key={match.id}
                  onClick={() => setSelectedChat(match)}
                  className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all mb-1 group ${
                    selectedChatId === match.id 
                      ? "bg-purple-100 border-l-4 border-purple-600" 
                      : "hover:bg-gray-50 border-l-4 border-transparent"
                  }`}
                >
                  <div className="relative">
                    <img src={match.avatarUrl} className="w-12 h-12 rounded-full object-cover border border-gray-200" alt="" />
                    {isOnline && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>}
                  </div>
                  <div className="flex-1 text-left overflow-hidden">
                    <div className="flex justify-between items-center mb-0.5">
                        <h3 className="font-bold text-gray-900 truncate text-sm">{match.name}</h3>
                        <div 
                          onClick={(e) => toggleFavorite(e, match)}
                          className="p-1.5 rounded-full hover:bg-white/50 cursor-pointer transition-all"
                        >
                           <Heart 
                             className={`w-6 h-6 transition-colors ${
                               match.isFavorite 
                                 ? "fill-red-500 text-red-500" 
                                 : "text-gray-300 group-hover:text-red-300"
                             }`} 
                           />
                        </div>
                    </div>
                    <p className={`text-xs truncate ${selectedChatId === match.id ? "text-purple-700 font-medium" : "text-gray-500"}`}>
                        {match.lastMessage}
                    </p>
                  </div>
                </button>
              );
            })
        ) : (
            <div className="text-center py-10 px-4">
               <p className="text-sm text-gray-500">No matches found.</p>
            </div>
        )}
      </div>
    </div>
  );
};

const IndividualChat = ({ chat, onBack, currentUserId }) => {
  const [messageText, setMessageText] = useState("");
  const [messages, setMessages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [userStatus, setUserStatus] = useState(null);
  const [modalData, setModalData] = useState({ isOpen: false, title: "", message: "" }); // Modal State
  const scrollRef = useRef(null);
  const chatId = getChatId(currentUserId, chat.id);

  useEffect(() => {
    const statusRef = rtdbRef(realtimeDB, `status/${chat.id}`);
    const unsub = onValue(statusRef, (snap) => setUserStatus(snap.val()));
    return () => unsub();
  }, [chat.id]);

  useEffect(() => {
    if (!chatId) return;
    const q = query(collection(db, "chats", chatId, "messages"), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, (snap) => {
        setMessages(snap.docs.map(d => ({ id: d.id, ...d.data(), isMe: d.data().senderId === currentUserId })));
    });
    return () => unsub();
  }, [chatId, currentUserId]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  // --- CHECK MSG LIMIT (UPDATED WITH MODAL) ---
  const checkMessageLimit = async () => {
    try {
        const userRef = doc(db, "users", currentUserId);
        const userSnap = await getDoc(userRef);
        const userData = userSnap.data();
        const tier = userData?.subscriptionTier || 'Free';

        // GOLD & PLATINUM have UNLIMITED CHATS
        if (tier === 'gold' || tier === 'platinum') return true;

        const today = new Date().toISOString().split('T')[0];
        const usageRef = doc(db, "users", currentUserId, "usage", "daily");
        const usageSnap = await getDoc(usageRef);
        
        let currentCount = 0;
        if (usageSnap.exists() && usageSnap.data().date === today) {
            currentCount = usageSnap.data().msg || 0;
        } else {
            await setDoc(usageRef, { date: today, msg: 0 }, { merge: true });
        }

        if (currentCount >= FREE_MSG_LIMIT) {
            // TRIGGER THE MODAL INSTEAD OF ALERT
            setModalData({
                isOpen: true,
                title: "Daily Limit Reached",
                message: `Upgrade to Gold for Unlimited Chatting!`
            });
            return false;
        }

        await updateDoc(usageRef, { msg: increment(1), date: today });
        return true;

    } catch (e) {
        console.error("Limit check error", e);
        return true; 
    }
  };

  const handleSend = async () => {
    if (!messageText.trim()) return;
    
    // Check limit before sending
    const allowed = await checkMessageLimit();
    if (!allowed) return;

    try {
      const text = messageText;
      setMessageText(""); 
      await addDoc(collection(db, "chats", chatId, "messages"), {
        senderId: currentUserId, recipientId: chat.id, text, type: "text", createdAt: serverTimestamp(),
      });
      await setDoc(doc(db, "matches", chatId), { lastMessage: text, timestamp: serverTimestamp() }, { merge: true });
    } catch (e) { console.error(e); }
  };

  const handleFileUpload = (file) => {
    if (!file) return;
    setUploading(true);
    const fileRef = storageRef(storage, `chat_files/${chatId}/${Date.now()}_${file.name}`);
    uploadBytes(fileRef, file).then(snap => getDownloadURL(snap.ref)).then(async url => {
       
       const allowed = await checkMessageLimit();
       if(!allowed) { setUploading(false); return; }

       await addDoc(collection(db, "chats", chatId, "messages"), {
         senderId: currentUserId, recipientId: chat.id, content: url, type: "image", createdAt: serverTimestamp(),
       });
       await setDoc(doc(db, "matches", chatId), { lastMessage: "Sent an image", timestamp: serverTimestamp() }, { merge: true });
       setUploading(false);
    });
  };

  const isOnline = userStatus?.state === "online";

  return (
    <div className="flex flex-col h-full bg-[#f3f4f6] relative">
      
      {/* RENDER THE MODAL IF OPEN */}
      <UpgradeModal 
        isOpen={modalData.isOpen}
        onClose={() => setModalData({ ...modalData, isOpen: false })}
        title={modalData.title}
        message={modalData.message}
      />

      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 shadow-sm z-10 h-[72px]">
        <div className="flex items-center gap-3">
            <button onClick={onBack} className="md:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full">
                <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="relative">
                <img src={chat.avatarUrl} className="w-10 h-10 rounded-full object-cover border border-gray-100" alt="" />
                {isOnline && <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>}
            </div>
            <div>
                <h2 className="font-bold text-gray-900 text-sm leading-tight">{chat.name}</h2>
                <p className="text-xs text-gray-500">{isOnline ? "Active now" : "Offline"}</p>
            </div>
        </div>
        <button className="p-2 text-gray-400 hover:bg-gray-100 rounded-full">
            <MoreVertical className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar" ref={scrollRef}>
        {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.isMe ? "justify-end" : "justify-start"}`}>
              <div 
                className={`max-w-[75%] px-4 py-2.5 text-[15px] shadow-sm ${
                  msg.isMe 
                    ? "bg-[#9333ea] text-white rounded-2xl rounded-tr-none" 
                    : "bg-white text-gray-800 border border-gray-100 rounded-2xl rounded-tl-none"
                }`}
              >
                {msg.type === "image" ? (
                    <img src={msg.content} className="rounded-lg max-h-60 object-cover" alt="sent" />
                ) : (
                    <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                )}
                <div className={`text-[10px] mt-1 text-right ${msg.isMe ? "text-purple-200" : "text-gray-400"}`}>
                   {msg.createdAt ? msg.createdAt.toDate().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : "..."}
                </div>
              </div>
            </div>
        ))}
      </div>

      {/* Input */}
      <div className="flex-shrink-0 p-3 bg-white border-t border-gray-200">
        <div className="flex items-center gap-2 bg-gray-100 p-1.5 rounded-full pl-4 border border-transparent focus-within:border-purple-300 focus-within:bg-white focus-within:shadow-sm transition-all">
          <label className="p-2 text-gray-400 hover:text-purple-600 cursor-pointer transition-colors">
            <Image size={20} />
            <input type="file" hidden accept="image/*" onChange={(e) => handleFileUpload(e.target.files[0])} disabled={uploading} />
          </label>
          
          <input
            type="text"
            placeholder="Message..."
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            disabled={uploading}
            className="flex-1 bg-transparent border-none focus:ring-0 outline-none text-base md:text-sm text-gray-800 placeholder-gray-500"
          />
          
          <button
            onClick={handleSend}
            disabled={!messageText.trim() || uploading}
            className={`p-2 rounded-full transition-all ${
                messageText.trim() 
                ? "bg-purple-600 text-white shadow-md hover:scale-105" 
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            {uploading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} className={messageText.trim() ? "ml-0.5" : ""} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function ChatPage() {
  const [selectedChat, setSelectedChat] = useState(null);
  const { currentUser, loading } = useAuth();
  
  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-purple-600" /></div>;
  if (!currentUser?.uid) return <div className="h-screen flex items-center justify-center">Please log in.</div>;

  return (
    <div className="h-[calc(100dvh-9rem)] md:h-[calc(100vh-5rem)] w-full flex overflow-hidden bg-white">
        
        <div className={`
            h-full flex-shrink-0 bg-white
            ${selectedChat ? "hidden md:block w-[380px] lg:w-[450px]" : "w-full md:w-[380px] lg:w-[450px]"}
        `}>
          <ChatList 
            setSelectedChat={setSelectedChat} 
            selectedChatId={selectedChat?.id} 
            currentUserId={currentUser.uid} 
          />
        </div>

        <div className={`
            h-full bg-gray-50
            ${selectedChat ? "w-full flex md:flex-1" : "hidden md:flex md:flex-1"}
        `}>
          {selectedChat ? (
            <div className="w-full h-full">
                <IndividualChat 
                    chat={selectedChat} 
                    onBack={() => setSelectedChat(null)} 
                    currentUserId={currentUser.uid} 
                />
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50">
                <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center shadow-sm mb-4 animate-pulse">
                    <Heart className="w-10 h-10 text-purple-500 fill-purple-500" />
                </div>
                <h2 className="text-xl font-bold text-gray-700">Your Matches</h2>
                <p className="text-sm text-gray-500 mt-2">Select a match to start chatting!</p>
            </div>
          )}
        </div>
    </div>
  );
}