import React, { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  Send,
  MessageSquare,
  Search,
  Heart,
  Image,
  Loader2,
} from "lucide-react";
import { db, storage, realtimeDB } from "../firebaseConfig";
import { useAuth } from "../context/AuthContext";
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
  updateDoc
} from "firebase/firestore";
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import { ref as rtdbRef, onValue, onDisconnect, set } from "firebase/database";

// --- STYLES ---
const customStyles = `
  @keyframes slideIn {
    from { opacity: 0; transform: translateX(-20px); }
    to { opacity: 1; transform: translateX(0); }
  }
  .custom-scrollbar::-webkit-scrollbar { width: 6px; }
  .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
  .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(139, 92, 246, 0.3); border-radius: 10px; }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: rgba(139, 92, 246, 0.6); }
`;

const getChatId = (userAId, userBId) => {
  return userAId < userBId ? `${userAId}_${userBId}` : `${userBId}_${userAId}`;
};

// --- OPTIMIZED CHAT LIST ---
const ChatList = ({ setSelectedChat, selectedChatId, currentUserId }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statuses, setStatuses] = useState({});

  useEffect(() => {
    const statusRef = rtdbRef(realtimeDB, "status");
    const unsubStatus = onValue(statusRef, (snap) => {
      setStatuses(snap.val() || {});
    });
    return () => unsubStatus();
  }, []);

  const toggleFavorite = async (e, match) => {
    e.stopPropagation(); 
    if (!currentUserId || !match.chatId) return;
    const matchRef = doc(db, "matches", match.chatId);
    try {
      await updateDoc(matchRef, { [`favorites.${currentUserId}`]: !match.isFavorite });
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  useEffect(() => {
    if (!currentUserId) {
      setIsLoading(false);
      return;
    }

    const matchesQuery = query(
      collection(db, "matches"),
      where(`usersIncluded.${currentUserId}`, "==", true)
    );

    const unsubscribe = onSnapshot(matchesQuery, async (snapshot) => {
        // PERFORMANCE FIX: Use Promise.all to fetch all users in parallel
        const matchPromises = snapshot.docs.map(async (docSnap) => {
            const data = docSnap.data();
            const otherUserId = data.users.find(uid => uid !== currentUserId);
            const isFavorite = data.favorites && data.favorites[currentUserId] === true;
            
            if (!otherUserId) return null;

            try {
                // In a real app, you should cache these user fetches to avoid reading DB every time
                const userSnap = await getDoc(doc(db, "users", otherUserId));
                if (userSnap.exists()) {
                    const userData = userSnap.data();
                    
                    // Filter locally
                    if (searchTerm && userData.displayName && !userData.displayName.toLowerCase().includes(searchTerm.toLowerCase())) {
                        return null;
                    }

                    return {
                        id: otherUserId,
                        chatId: docSnap.id,
                        name: userData.displayName || "User",
                        avatarUrl: (userData.photos && userData.photos[0]) || userData.avatarUrl || "https://placehold.co/100",
                        bio: userData.aboutMe || "",
                        location: userData.city || "Unknown",
                        lastMessage: data.lastMessage || "Start chatting...",
                        isFavorite: isFavorite
                    };
                }
            } catch (err) {
                console.error("Error fetching match profile", err);
                return null;
            }
            return null;
        });

        const results = await Promise.all(matchPromises);
        const validMatches = results.filter(Boolean);

        validMatches.sort((a, b) => {
            if (a.isFavorite === b.isFavorite) return 0;
            return a.isFavorite ? -1 : 1;
        });

        setUsers(validMatches);
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, [currentUserId, searchTerm]);

  return (
    <div className="flex flex-col h-full border-r border-gray-100">
      <style>{customStyles}</style>
      <div className="p-6 border-b border-purple-200 bg-gradient-to-r from-purple-600 to-purple-700 text-white flex-shrink-0 z-10">
        <h1 className="text-3xl font-bold mb-4">Messages</h1>
        <div className="relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-300" />
          <input
            type="text"
            placeholder="Search matches..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-full bg-white/20 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
        <div className="p-4 space-y-2 pb-20">
          {isLoading ? (
             <div className="p-6 text-center text-purple-600">
                <Loader2 className="w-6 h-6 mx-auto animate-spin" />
             </div>
          ) : users.length > 0 ? (
            users.map((match, idx) => {
              const isOnline = statuses[match.id]?.state === "online";
              return (
                <button
                  key={match.id}
                  onClick={() => setSelectedChat(match)}
                  className={`w-full p-4 rounded-2xl text-left transition-all animate-[slideIn_0.5s_ease-out] relative group border border-transparent ${
                    selectedChatId === match.id
                      ? "bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200 shadow-sm"
                      : "bg-white hover:bg-gray-50 border-gray-100"
                  }`}
                  style={{ animationDelay: `${idx * 0.05}s` }}
                >
                  <div className="flex items-center gap-4">
                    <div className="relative w-12 h-12 flex-shrink-0">
                      <img
                        src={match.avatarUrl}
                        alt={match.name}
                        className="w-full h-full rounded-full object-cover border border-purple-100"
                      />
                      <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${isOnline ? "bg-green-400" : "bg-gray-400"}`}></div>
                    </div>
                    <div className="flex-1 text-left overflow-hidden min-w-0">
                      <h3 className="font-bold text-gray-800 truncate">{match.name}</h3>
                      <p className={`text-sm truncate ${selectedChatId === match.id ? "text-purple-600 font-medium" : "text-gray-500"}`}>
                        {match.lastMessage}
                      </p>
                    </div>
                    <div onClick={(e) => toggleFavorite(e, match)} className="p-2 cursor-pointer rounded-full hover:bg-white/50">
                       <Heart className={`w-5 h-5 transition-colors ${match.isFavorite ? "fill-red-500 text-red-500" : "text-gray-300 hover:text-red-400"}`} />
                    </div>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="text-center py-10 opacity-70">
               <Heart className="w-12 h-12 mx-auto text-purple-300 mb-2" />
               <p className="text-gray-500">No matches found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- INDIVIDUAL CHAT COMPONENT (Standard) ---
const IndividualChat = ({ chat, onBack, currentUserId }) => {
  const [messageText, setMessageText] = useState("");
  const [messages, setMessages] = useState([]);
  const [showProfile, setShowProfile] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [userStatus, setUserStatus] = useState(null);
  const messagesEndRef = useRef(null);
  const chatId = getChatId(currentUserId, chat.id);

  useEffect(() => {
    const statusRef = rtdbRef(realtimeDB, `status/${chat.id}`);
    const unsub = onValue(statusRef, (snap) => setUserStatus(snap.val()));
    return () => unsub();
  }, [chat.id]);

  useEffect(() => {
    if (!chatId) return;
    const messagesRef = collection(db, "chats", chatId, "messages");
    const q = query(messagesRef, orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, (snap) => {
        setMessages(snap.docs.map(d => ({ id: d.id, ...d.data(), isMe: d.data().senderId === currentUserId })));
    });
    return () => unsub();
  }, [chatId, currentUserId]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleSend = async () => {
    if (!messageText.trim()) return;
    try {
      await addDoc(collection(db, "chats", chatId, "messages"), {
        senderId: currentUserId, recipientId: chat.id, text: messageText, type: "text", createdAt: serverTimestamp(),
      });
      await setDoc(doc(db, "matches", chatId), { lastMessage: messageText, timestamp: serverTimestamp() }, { merge: true });
      setMessageText("");
    } catch (e) { console.error(e); }
  };

  const handleFileUpload = (file) => {
    if (!file) return;
    setUploading(true);
    const fileRef = storageRef(storage, `chat_files/${chatId}/${Date.now()}_${file.name}`);
    uploadBytes(fileRef, file).then(snap => getDownloadURL(snap.ref)).then(async url => {
       await addDoc(collection(db, "chats", chatId, "messages"), {
         senderId: currentUserId, recipientId: chat.id, content: url, type: "image", createdAt: serverTimestamp(),
       });
       setUploading(false);
    });
  };

  return (
    <div className="flex flex-col h-full bg-[#E6E6FA]/30 relative">
      <div className="flex items-center gap-4 p-4 border-b border-gray-200 bg-white shadow-sm z-20">
        <button onClick={onBack} className="md:hidden p-2"><ArrowLeft className="w-6 h-6 text-gray-600" /></button>
        <button onClick={() => setShowProfile(true)} className="relative w-10 h-10">
          <img src={chat.avatarUrl} className="w-full h-full rounded-full object-cover" />
          {userStatus?.state === "online" && <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white bg-green-500"></div>}
        </button>
        <div className="flex-1">
          <h2 className="font-bold text-gray-900">{chat.name}</h2>
          <p className="text-xs text-green-600 font-medium">{userStatus?.state === "online" ? "Online" : "Offline"}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
        {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.isMe ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] p-3 rounded-2xl shadow-sm text-sm ${msg.isMe ? "bg-purple-600 text-white rounded-br-none" : "bg-white text-gray-800 rounded-bl-none"}`}>
                {msg.type === "image" ? <img src={msg.content} className="rounded-lg max-h-60" /> : <p>{msg.text}</p>}
                <p className={`text-[10px] mt-1 text-right ${msg.isMe ? "text-purple-200" : "text-gray-400"}`}>{msg.createdAt?.toDate().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p>
              </div>
            </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-white border-t border-gray-200">
        <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-full">
          <label className="p-2 text-gray-400 hover:text-purple-600 cursor-pointer"><Image size={20} /><input type="file" hidden accept="image/*" onChange={(e) => handleFileUpload(e.target.files[0])} disabled={uploading} /></label>
          <input type="text" placeholder="Type a message..." value={messageText} onChange={(e) => setMessageText(e.target.value)} onKeyPress={(e) => e.key === "Enter" && handleSend()} className="flex-1 bg-transparent border-none outline-none text-sm px-2" />
          <button onClick={handleSend} disabled={!messageText.trim()} className="p-2 bg-purple-600 text-white rounded-full hover:bg-purple-700 disabled:opacity-50">{uploading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}</button>
        </div>
      </div>

       {showProfile && (
        <div className="absolute inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
             <div className="bg-white rounded-2xl p-6 w-full max-w-sm text-center">
                 <img src={chat.avatarUrl} className="w-24 h-24 rounded-full mx-auto mb-4 object-cover" />
                 <h2 className="text-xl font-bold">{chat.name}</h2>
                 <p className="text-gray-500 mb-4">{chat.location}</p>
                 <p className="text-sm text-gray-600 mb-6 bg-gray-50 p-3 rounded-lg">{chat.bio}</p>
                 <button onClick={() => setShowProfile(false)} className="w-full py-2 bg-gray-200 rounded-lg font-semibold hover:bg-gray-300">Close</button>
             </div>
        </div>
      )}
    </div>
  );
};

export default function ChatPage() {
  const [selectedChat, setSelectedChat] = useState(null);
  const { currentUser, loading } = useAuth();
  
  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-purple-600" /></div>;
  if (!currentUser?.uid) return <div className="h-screen flex items-center justify-center">Please log in.</div>;

  return (
    <div className="h-[calc(100vh-80px)] w-full bg-white flex overflow-hidden">
        <div className={`w-full md:w-[35%] lg:w-[30%] bg-white h-full flex flex-col ${selectedChat ? "hidden md:flex" : "flex"}`}>
          <ChatList setSelectedChat={setSelectedChat} selectedChatId={selectedChat?.id} currentUserId={currentUser.uid} />
        </div>
        <div className={`flex-1 h-full bg-gray-50 ${selectedChat ? "flex" : "hidden md:flex"}`}>
          {selectedChat ? <IndividualChat chat={selectedChat} onBack={() => setSelectedChat(null)} currentUserId={currentUser.uid} /> : 
            <div className="hidden md:flex h-full w-full flex-col items-center justify-center bg-gray-50/50">
                <div className="bg-white p-8 rounded-full shadow-sm mb-4"><MessageSquare className="w-12 h-12 text-purple-400" /></div>
                <h2 className="text-2xl font-bold text-gray-800">Your Messages</h2>
            </div>
          }
        </div>
    </div>
  );
}