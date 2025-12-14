import React, { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  Send,
  MessageSquare,
  Search,
  Heart,
  X,
  Phone,
  Video,
  Upload,
  Image,
  FileText,
  Loader2,
  LogOut,
} from "lucide-react";
import { db, storage, auth, realtimeDB } from "../firebaseConfig";
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
import { signOut } from "firebase/auth";
import { ref as rtdbRef, onValue, onDisconnect, set } from "firebase/database";

// --- STYLES ---
const customStyles = `
  @keyframes slideIn {
    from { opacity: 0; transform: translateX(-20px); }
    to { opacity: 1; transform: translateX(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  /* Custom Scrollbar Styling */
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background-color: rgba(139, 92, 246, 0.3); /* Light Purple */
    border-radius: 10px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background-color: rgba(139, 92, 246, 0.6); /* Darker Purple on hover */
  }
`;

// --- HELPER FUNCTIONS ---
const getChatId = (userAId, userBId) => {
  return userAId < userBId ? `${userAId}_${userBId}` : `${userBId}_${userAId}`;
};

// --- CHAT LIST COMPONENT (LEFT SIDE) ---
const ChatList = ({ setSelectedChat, selectedChatId, currentUserId }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statuses, setStatuses] = useState({});

  useEffect(() => {
    // Realtime Presence
    const statusRef = rtdbRef(realtimeDB, "status");
    const unsubStatus = onValue(statusRef, (snap) => {
      setStatuses(snap.val() || {});
    });
    return () => unsubStatus();
  }, []);

  // --- TOGGLE FAVORITE FUNCTION ---
  const toggleFavorite = async (e, match) => {
    e.stopPropagation(); 
    if (!currentUserId || !match.chatId) return;

    const matchRef = doc(db, "matches", match.chatId);
    const newStatus = !match.isFavorite;

    try {
      await updateDoc(matchRef, {
        [`favorites.${currentUserId}`]: newStatus
      });
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  // --- FETCH MATCHES & SORT ---
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
        const matchesData = [];

        for (const docSnap of snapshot.docs) {
            const data = docSnap.data();
            const otherUserId = data.users.find(uid => uid !== currentUserId);
            const isFavorite = data.favorites && data.favorites[currentUserId] === true;
            
            if (otherUserId) {
                try {
                    const userSnap = await getDoc(doc(db, "users", otherUserId));
                    if (userSnap.exists()) {
                        const userData = userSnap.data();
                        
                        if (
                            !searchTerm || 
                            (userData.displayName && userData.displayName.toLowerCase().includes(searchTerm.toLowerCase()))
                        ) {
                            matchesData.push({
                                id: otherUserId,
                                chatId: docSnap.id,
                                name: userData.displayName || "User",
                                avatarUrl: (userData.photos && userData.photos[0]) || userData.avatarUrl || "https://placehold.co/100",
                                bio: userData.aboutMe || "",
                                location: userData.city || "Unknown",
                                lastMessage: data.lastMessage || "Start chatting...",
                                isFavorite: isFavorite
                            });
                        }
                    }
                } catch (err) {
                    console.error("Error fetching match profile", err);
                }
            }
        }

        matchesData.sort((a, b) => {
            if (a.isFavorite === b.isFavorite) return 0;
            return a.isFavorite ? -1 : 1;
        });

        setUsers(matchesData);
        setIsLoading(false);
    }, (error) => {
        console.error("Error fetching matches:", error);
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, [currentUserId, searchTerm]);

  return (
    <div className="flex flex-col h-full border-r border-gray-100">
      <style>{customStyles}</style>
      
      {/* 1. FIXED HEADER */}
      <div className="p-6 border-b border-purple-200 bg-gradient-to-r from-purple-600 to-purple-700 text-white flex-shrink-0 z-10">
        <div className="flex items-center mb-4">
          <h1 className="text-3xl font-bold">Messages</h1>
        </div>
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

      {/* 2. INDEPENDENTLY SCROLLABLE LIST */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
        <div className="p-4 space-y-2 pb-20">
          {isLoading ? (
             <div className="p-6 text-center text-purple-600">
                <Loader2 className="w-6 h-6 mx-auto animate-spin" />
             </div>
          ) : users.length > 0 ? (
            users.map((match, idx) => {
              const userStatus = statuses[match.id];
              const isOnline = userStatus?.state === "online";
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
                    {/* Avatar */}
                    <div className="relative w-12 h-12 flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-300 to-purple-500 flex items-center justify-center text-2xl text-white overflow-hidden">
                        {match.avatarUrl.length > 2 ? (
                          <img
                            src={match.avatarUrl}
                            alt={match.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          match.avatarUrl
                        )}
                      </div>
                      <div
                        className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                          isOnline ? "bg-green-400" : "bg-gray-400"
                        }`}
                      ></div>
                    </div>
                    
                    {/* Name & Message */}
                    <div className="flex-1 text-left overflow-hidden min-w-0">
                      <h3 className="font-bold text-gray-800 truncate">{match.name}</h3>
                      <p className={`text-sm truncate ${selectedChatId === match.id ? "text-purple-600 font-medium" : "text-gray-500"}`}>
                        {match.lastMessage || "Tap to chat..."}
                      </p>
                    </div>

                    {/* HEART BUTTON */}
                    <div 
                      onClick={(e) => toggleFavorite(e, match)}
                      className="p-2 cursor-pointer rounded-full hover:bg-white/50 transition-all"
                    >
                       <Heart
                        className={`w-5 h-5 flex-shrink-0 transition-colors duration-300 ${
                          match.isFavorite 
                              ? "fill-red-500 text-red-500"
                              : "text-gray-300 hover:text-red-400"
                        }`}
                      />
                    </div>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="text-center py-10 opacity-70">
               <Heart className="w-12 h-12 mx-auto text-purple-300 mb-2" />
               <p className="text-gray-500">No matches yet.</p>
               <p className="text-sm text-purple-500 mt-2">Go swipe right on Discover!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- INDIVIDUAL CHAT COMPONENT (RIGHT SIDE) ---
const IndividualChat = ({ chat, onBack, currentUserId }) => {
  const [messageText, setMessageText] = useState("");
  const [messages, setMessages] = useState([]);
  const [showProfile, setShowProfile] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errorModal, setErrorModal] = useState(null);
  const [userStatus, setUserStatus] = useState(null);
  const messagesEndRef = useRef(null);

  const chatId = getChatId(currentUserId, chat.id);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const statusRef = rtdbRef(realtimeDB, `status/${chat.id}`);
    const unsub = onValue(statusRef, (snap) => {
      setUserStatus(snap.val());
    });
    return () => unsub();
  }, [chat.id]);

  const isOnline = userStatus?.state === "online";

  useEffect(() => {
    if (!chatId) return;
    const messagesRef = collection(db, "chats", chatId, "messages");
    const messagesQuery = query(messagesRef, orderBy("createdAt", "asc"));

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
        const fetchedMessages = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          isMe: doc.data().senderId === currentUserId,
        }));
        setMessages(fetchedMessages);
      });

    return () => unsubscribe();
  }, [chatId, currentUserId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    const text = messageText.trim();
    if (!text) return;
    try {
      const messagesRef = collection(db, "chats", chatId, "messages");
      await addDoc(messagesRef, {
        senderId: currentUserId,
        recipientId: chat.id,
        text: text,
        type: "text",
        createdAt: serverTimestamp(),
      });

      const matchRef = doc(db, "matches", chatId); 
      setDoc(matchRef, { lastMessage: text, timestamp: serverTimestamp() }, { merge: true });

      setMessageText("");
    } catch (error) {
      console.error("Send error:", error);
    }
  };

  const handleFileUpload = (file, type) => {
    if (!file) return;
    setUploading(true);
    
    const fileName = `${Date.now()}_${file.name}`;
    const fileRef = storageRef(storage, `chat_files/${chatId}/${fileName}`);

    uploadBytes(fileRef, file)
      .then((snapshot) => getDownloadURL(snapshot.ref))
      .then(async (downloadURL) => {
        const messagesRef = collection(db, "chats", chatId, "messages");
        await addDoc(messagesRef, {
          senderId: currentUserId,
          recipientId: chat.id,
          content: downloadURL,
          fileName: file.name,
          fileType: type,
          type: type === "image" ? "image" : "file",
          createdAt: serverTimestamp(),
        });
        setUploading(false);
      });
  };

  return (
    <div className="flex flex-col h-full bg-[#E6E6FA]/30 relative overflow-hidden">
      {/* 1. FIXED HEADER */}
      <div className="flex items-center gap-4 p-4 border-b border-gray-200 bg-white shadow-sm flex-shrink-0 z-20">
        <button onClick={onBack} className="md:hidden p-2 hover:bg-gray-100 rounded-full">
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>
        <button onClick={() => setShowProfile(true)} className="relative w-10 h-10 hover:scale-105 transition-transform">
          <img src={chat.avatarUrl} alt="Av" className="w-full h-full rounded-full object-cover border border-purple-100" />
          {isOnline && <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white bg-green-500"></div>}
        </button>
        <div className="flex-1">
          <h2 className="font-bold text-gray-900">{chat.name}</h2>
          <p className="text-xs text-green-600 font-medium">{isOnline ? "Online" : "Offline"}</p>
        </div>
      </div>

      {/* 2. SCROLLABLE MESSAGES AREA */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-gray-400 mt-20">
             <p>No messages yet.</p>
             <p className="text-sm">Say hello to {chat.name}!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.isMe ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] sm:max-w-[70%] p-3 rounded-2xl shadow-sm text-sm ${
                  msg.isMe 
                    ? "bg-purple-600 text-white rounded-br-none" 
                    : "bg-white text-gray-800 border border-gray-100 rounded-bl-none"
                }`}>
                {msg.type === "text" && <p>{msg.text}</p>}
                {msg.type === "image" && <img src={msg.content} alt="Sent" className="rounded-lg max-h-60 object-cover" />}
                <p className={`text-[10px] mt-1 text-right ${msg.isMe ? "text-purple-200" : "text-gray-400"}`}>
                   {msg.createdAt?.toDate().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 3. FIXED INPUT AREA */}
      <div className="p-4 bg-white border-t border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-full">
          {/* RESTORED IMAGE UPLOAD ICON */}
          <label className="p-2 text-gray-400 hover:text-purple-600 cursor-pointer transition-colors">
            <Image size={20} />
            <input type="file" hidden accept="image/*" onChange={(e) => handleFileUpload(e.target.files[0], "image")} disabled={uploading} />
          </label>
          
          <input
            type="text"
            placeholder="Type a message..."
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            disabled={uploading}
            className="flex-1 bg-transparent border-none focus:ring-0 outline-none text-sm text-gray-800 placeholder-gray-400 px-2"
          />
          <button
            onClick={handleSend}
            disabled={!messageText.trim()}
            className="p-2 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-all disabled:opacity-50"
          >
            {uploading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>
      </div>
      
      {/* Profile Modal code... (kept same as before if needed) */}
      {showProfile && (
        <div className="absolute inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
             {/* Profile modal content same as before... */}
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

// --- CHAT PLACEHOLDER ---
const ChatPlaceholder = () => (
  <div className="hidden md:flex h-full flex-col items-center justify-center bg-gray-50/50">
    <div className="bg-white p-8 rounded-full shadow-sm mb-4">
        <MessageSquare className="w-12 h-12 text-purple-400" />
    </div>
    <h2 className="text-2xl font-bold text-gray-800">Your Messages</h2>
    <p className="text-gray-500 mt-2">Select a chat to start messaging</p>
  </div>
);

// --- MAIN PAGE ---
export default function ChatPage() {
  const [selectedChat, setSelectedChat] = useState(null);
  const { currentUser, loading } = useAuth();
  const currentUserId = currentUser?.uid;

  useEffect(() => {
    if (!currentUserId) return;
    // (Presence logic kept same)
    const userStatusRef = rtdbRef(realtimeDB, `status/${currentUserId}`);
    const connectedRef = rtdbRef(realtimeDB, ".info/connected");
    const unsubscribe = onValue(connectedRef, (snap) => {
      if (snap.val() === false) return;
      onDisconnect(userStatusRef).set({ state: "offline", lastSeen: Date.now() });
      set(userStatusRef, { state: "online", lastSeen: Date.now() });
    });
    return () => unsubscribe();
  }, [currentUserId]);

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-purple-600" /></div>;
  if (!currentUserId) return <div className="h-screen flex items-center justify-center">Please log in.</div>;

  return (
    // MAIN CONTAINER: Fixed height to Viewport minus Navbar (approx 80px)
    // This prevents the whole page from scrolling
    <div className="h-[calc(100vh-80px)] w-full bg-white flex overflow-hidden mt-0 md:mt-0">
        
        {/* LEFT COLUMN: Chat List */}
        {/* On mobile: Hidden if chat selected. On desktop: Always visible, width 35% */}
        <div className={`
            w-full md:w-[35%] lg:w-[30%] bg-white h-full flex flex-col 
            ${selectedChat ? "hidden md:flex" : "flex"}
        `}>
          <ChatList
            setSelectedChat={setSelectedChat}
            selectedChatId={selectedChat?.id}
            currentUserId={currentUserId}
          />
        </div>

        {/* RIGHT COLUMN: Chat Window */}
        {/* On mobile: Visible if chat selected. On desktop: Always visible, takes remaining space */}
        <div className={`
            flex-1 h-full bg-gray-50
            ${selectedChat ? "flex" : "hidden md:flex"}
        `}>
          {selectedChat ? (
            <div className="w-full h-full">
                <IndividualChat
                chat={selectedChat}
                onBack={() => setSelectedChat(null)}
                currentUserId={currentUserId}
                />
            </div>
          ) : (
            <div className="w-full h-full">
                <ChatPlaceholder />
            </div>
          )}
        </div>
    </div>
  );
}