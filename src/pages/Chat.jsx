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
  setDoc
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
  /* Hide scrollbar for Chrome, Safari and Opera */
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  /* Hide scrollbar for IE, Edge and Firefox */
  .scrollbar-hide {
    -ms-overflow-style: none;  /* IE and Edge */
    scrollbar-width: none;  /* Firefox */
  }
`;

// --- HELPER FUNCTIONS ---
const getChatId = (userAId, userBId) => {
  return userAId < userBId ? `${userAId}_${userBId}` : `${userBId}_${userAId}`;
};

// --- CHAT LIST COMPONENT ---
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

  // --- FETCH MATCHES ---
  useEffect(() => {
    if (!currentUserId) {
      setIsLoading(false);
      return;
    }

    // Query matches where the current user is included
    const matchesQuery = query(
      collection(db, "matches"),
      where(`usersIncluded.${currentUserId}`, "==", true)
    );

    const unsubscribe = onSnapshot(matchesQuery, async (snapshot) => {
        const matchesData = [];

        // Iterate through all match documents
        for (const docSnap of snapshot.docs) {
            const data = docSnap.data();
            // Find the ID of the other person in the match
            const otherUserId = data.users.find(uid => uid !== currentUserId);
            
            if (otherUserId) {
                // Fetch details for that user
                try {
                    const userSnap = await getDoc(doc(db, "users", otherUserId));
                    if (userSnap.exists()) {
                        const userData = userSnap.data();
                        
                        // Filter by search term locally
                        if (
                            !searchTerm || 
                            (userData.displayName && userData.displayName.toLowerCase().includes(searchTerm.toLowerCase()))
                        ) {
                            matchesData.push({
                                id: otherUserId,
                                chatId: docSnap.id, // The ID of the match document
                                name: userData.displayName || "User",
                                avatarUrl: (userData.photos && userData.photos[0]) || userData.avatarUrl || "https://placehold.co/100",
                                bio: userData.aboutMe || "",
                                location: userData.city || "Unknown",
                                lastMessage: data.lastMessage || "Start chatting..."
                            });
                        }
                    }
                } catch (err) {
                    console.error("Error fetching match profile", err);
                }
            }
        }

        setUsers(matchesData);
        setIsLoading(false);
    }, (error) => {
        console.error("Error fetching matches:", error);
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, [currentUserId, searchTerm]);

  if (isLoading) {
    return (
      <div className="p-6 text-center text-purple-600">
        <Loader2 className="w-6 h-6 mx-auto animate-spin" />
      </div>
    );
  }

  return (
    <>
      <style>{customStyles}</style>
      
      {/* 1. FIXED HEADER */}
      <div className="p-6 border-b border-purple-200 bg-gradient-to-r from-purple-600 to-purple-700 text-white shrink-0">
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

      {/* 2. SCROLLABLE AREA */}
      {/* FIXED: added 'overscroll-contain' and increased 'pb' significantly */}
      <div className="flex-1 overflow-y-auto scrollbar-hide min-h-0 overscroll-contain">
        {/* FIXED: Increased padding to pb-40 to ensure last item is visible above any nav bars */}
        <div className="p-6 pb-40">
          <h2 className="text-lg font-bold text-purple-700 mb-4">Your Matches</h2>
          <div className="space-y-2">
            {users.length > 0 ? (
              users.map((match, idx) => {
                const userStatus = statuses[match.id];
                const isOnline = userStatus?.state === "online";
                return (
                  <button
                    key={match.id}
                    onClick={() => setSelectedChat(match)}
                    className={`w-full p-4 rounded-2xl text-left transition-all animate-[slideIn_0.5s_ease-out] ${
                      selectedChatId === match.id
                        ? "bg-gradient-to-r from-purple-400 to-purple-500 text-white shadow-lg"
                        : "bg-white hover:bg-purple-50 text-gray-800"
                    }`}
                    style={{ animationDelay: `${idx * 0.05}s` }}
                  >
                    <div className="flex items-center gap-4">
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
                      <div className="flex-1 text-left overflow-hidden">
                        <h3 className="font-bold truncate">{match.name}</h3>
                        <p
                          className={`text-sm truncate ${
                            selectedChatId === match.id
                              ? "text-white/80"
                              : "text-gray-600"
                          }`}
                        >
                          {match.lastMessage || "Tap to chat..."}
                        </p>
                      </div>
                      <Heart
                        className={`w-5 h-5 flex-shrink-0 ${
                          selectedChatId === match.id
                            ? "text-white"
                            : "text-purple-400"
                        }`}
                      />
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
    </>
  );
};

// --- INDIVIDUAL CHAT COMPONENT ---
const IndividualChat = ({ chat, onBack, currentUserId }) => {
  const [messageText, setMessageText] = useState("");
  const [messages, setMessages] = useState([]);
  const [showProfile, setShowProfile] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errorModal, setErrorModal] = useState(null);
  const [userStatus, setUserStatus] = useState(null);
  const messagesEndRef = useRef(null);

  const chatId = getChatId(currentUserId, chat.id);
  const profile = {
    bio: chat.bio || "Getting to know each other...",
    age: chat.age || "N/A",
    location: chat.location || "Unknown",
  };

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

    const unsubscribe = onSnapshot(
      messagesQuery,
      (snapshot) => {
        const fetchedMessages = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          isMe: doc.data().senderId === currentUserId,
        }));
        setMessages(fetchedMessages);
      },
      (error) => console.error("Msg error:", error)
    );

    return () => unsubscribe();
  }, [chatId, currentUserId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    const text = messageText.trim();
    if (!text) return;
    try {
      // 1. Add message
      const messagesRef = collection(db, "chats", chatId, "messages");
      await addDoc(messagesRef, {
        senderId: currentUserId,
        recipientId: chat.id,
        text: text,
        type: "text",
        createdAt: serverTimestamp(),
      });

      // 2. Update Match "Last Message"
      // We assume the match doc ID is the same as the chat ID (based on logic in Discover)
      const matchRef = doc(db, "matches", chatId); 
      // Safe update - if match doc exists (it should), update it
      setDoc(matchRef, { lastMessage: text, timestamp: serverTimestamp() }, { merge: true });

      setMessageText("");
    } catch (error) {
      console.error("Send error:", error);
    }
  };

  const handleFileUpload = (file, type) => {
    if (!file) return;
    setUploading(true);
    setErrorModal(null);

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
      })
      .catch((error) => {
        console.error("Upload error:", error);
        setErrorModal("Upload failed. Check permissions.");
        setUploading(false);
      });
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-[#E6E6FA] to-purple-100 overflow-hidden md:bg-gradient-to-br md:from-[#E6E6FA] md:to-purple-100 relative">
      {errorModal && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-full shadow-lg z-50 animate-bounce">
          {errorModal}
          <button
            onClick={() => setErrorModal(null)}
            className="ml-2 font-bold"
          >
            X
          </button>
        </div>
      )}

      <div className="flex items-center gap-4 p-6 border-b border-purple-200 bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg flex-shrink-0 fixed md:relative top-16 md:top-auto left-0 right-0 z-40 md:z-auto">
        <button
          onClick={onBack}
          className="text-white/80 hover:text-white md:hidden"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <button
          onClick={() => setShowProfile(true)}
          className="relative w-12 h-12 hover:scale-110 transition-transform"
        >
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-300 to-purple-500 flex items-center justify-center text-2xl text-white overflow-hidden">
            {chat.avatarUrl.length > 2 ? (
              <img
                src={chat.avatarUrl}
                alt="Av"
                className="w-full h-full object-cover"
              />
            ) : (
              chat.avatarUrl
            )}
          </div>
          <div
            className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
              isOnline ? "bg-green-400" : "bg-gray-400"
            }`}
          ></div>
        </button>
        <div>
          <h2 className="text-xl font-bold">{chat.name}</h2>
          <p className="text-xs text-white/70">
            {isOnline ? "Active now" : "Offline"}
          </p>
        </div>
      </div>

      <div className="flex-1 mt-8 lg:mt-0 space-y-3 md:space-y-4 overflow-y-auto scrollbar-hide px-4 md:px-6 pt-24 pb-28 md:py-6">
        {messages.length === 0 ? (
          <div className="text-center text-gray-600 mt-8 md:mt-20 animate-[fadeIn_0.5s_ease-out]">
            <div className="text-4xl md:text-5xl mb-2 md:mb-4">💜</div>
            <p className="text-base md:text-lg font-semibold">
              You matched with {chat.name}!
            </p>
            <p className="text-xs md:text-sm">
              Be the first to send a message.
            </p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.isMe ? "justify-end" : "justify-start"
              } animate-[slideIn_0.3s_ease-out]`}
            >
              <div
                className={`max-w-xs md:max-w-sm p-4 rounded-2xl shadow-md ${
                  msg.isMe
                    ? "bg-gradient-to-r from-purple-600 to-purple-700 text-white"
                    : "bg-white text-gray-800 border border-purple-200"
                }`}
              >
                {msg.type === "text" && <p className="text-sm">{msg.text}</p>}

                {msg.type === "image" && (
                  <div className="mb-1">
                    <img
                      src={msg.content}
                      alt="Sent"
                      className="max-w-full rounded-lg"
                    />
                  </div>
                )}

                {msg.type === "file" && (
                  <a
                    href={msg.content}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 font-medium bg-black/10 p-2 rounded-lg text-inherit"
                  >
                    <FileText className="w-5 h-5 flex-shrink-0" />
                    <span className="truncate text-sm underline">
                      {msg.fileName}
                    </span>
                  </a>
                )}

                <span
                  className={`block mt-1 text-[10px] text-right ${
                    msg.isMe ? "text-white/70" : "text-gray-400"
                  }`}
                >
                  {msg.createdAt?.toDate().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  }) || "..."}
                </span>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-purple-200 bg-white/80 backdrop-blur-sm flex-shrink-0 fixed md:static bottom-20 md:bottom-auto left-0 right-0 md:w-full z-50">
        <div className="flex items-center gap-3">
          <label className="p-2 bg-purple-100 text-purple-600 rounded-full hover:bg-purple-200 transition-all cursor-pointer">
            <Image className="w-5 h-5" />
            <input
              type="file"
              hidden
              accept="image/*"
              onChange={(e) => handleFileUpload(e.target.files[0], "image")}
              disabled={uploading}
            />
          </label>
          <label className="p-2 bg-purple-100 text-purple-600 rounded-full hover:bg-purple-200 transition-all cursor-pointer">
            <Upload className="w-5 h-5" />
            <input
              type="file"
              hidden
              onChange={(e) => handleFileUpload(e.target.files[0], "file")}
              disabled={uploading}
            />
          </label>

          <input
            type="text"
            placeholder={uploading ? "Uploading..." : "Say something nice..."}
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            disabled={uploading}
            className="flex-1 px-5 py-3 rounded-full border-2 border-purple-300 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
          />
          <button
            onClick={handleSend}
            disabled={!messageText.trim() && !uploading}
            className="p-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-110 disabled:opacity-50 disabled:scale-100"
          >
            {uploading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {showProfile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-[fadeIn_0.3s_ease-out]">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-[slideIn_0.3s_ease-out]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Profile</h2>
              <button
                onClick={() => setShowProfile(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="text-center mb-6">
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-purple-300 to-purple-500 flex items-center justify-center text-5xl mb-4 text-white overflow-hidden">
                {chat.avatarUrl.length > 2 ? (
                  <img
                    src={chat.avatarUrl}
                    alt="Av"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  chat.avatarUrl
                )}
              </div>
              <h3 className="text-2xl font-bold text-gray-800">{chat.name}</h3>
              <p className="text-sm text-gray-500 mt-1">
                {profile.age} years old
              </p>
              <p className="text-sm text-gray-500"> {profile.location}</p>
            </div>
            <div className="bg-purple-50 rounded-2xl p-4 mb-6">
              <p className="text-gray-700 text-center">{profile.bio}</p>
            </div>
            <button
              onClick={() => setShowProfile(false)}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 rounded-2xl font-bold hover:shadow-lg transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// --- CHAT PLACEHOLDER ---
const ChatPlaceholder = () => (
  <div className="hidden md:flex h-full flex-col items-center justify-center bg-gradient-to-br from-[#E6E6FA] to-purple-100">
    <MessageSquare className="w-24 h-24 text-purple-400 animate-[fadeIn_0.5s_ease-out]" />
    <h2 className="mt-6 text-3xl font-bold text-purple-700">Select a Chat</h2>
    <p className="mt-3 text-gray-600 text-lg">
      Start a conversation with one of your matches
    </p>
  </div>
);

// --- MAIN PAGE ---
export default function ChatPage() {
  const [selectedChat, setSelectedChat] = useState(null);
  const { currentUser, loading } = useAuth();
  const currentUserId = currentUser?.uid;

  useEffect(() => {
    if (!currentUserId) return;

    const userStatusRef = rtdbRef(realtimeDB, `status/${currentUserId}`);
    const connectedRef = rtdbRef(realtimeDB, ".info/connected");

    const unsubscribe = onValue(connectedRef, (snap) => {
      if (snap.val() === false) return;

      onDisconnect(userStatusRef).set({
        state: "offline",
        lastSeen: Date.now(),
      });

      set(userStatusRef, {
        state: "online",
        lastSeen: Date.now(),
      });
    });

    return () => {
      set(userStatusRef, {
        state: "offline",
        lastSeen: Date.now(),
      });
      unsubscribe();
    };
  }, [currentUserId]);

  if (loading)
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
      </div>
    );
  if (!currentUserId)
    return (
      <div className="h-full flex items-center justify-center text-red-500">
        Please log in to chat.
      </div>
    );

  return (
    // FIXED: Changed h-screen to h-[100dvh] to fix mobile browser scrollbar issue
    // We subtract 70px to account for the top navigation bar on mobile
<div className="h-[calc(100dvh-70px)] md:h-[calc(100vh-64px)] flex flex-col bg-white overflow-hidden">
      <div className="flex-1 flex bg-white overflow-hidden min-h-0">
        {/* Left Column */}
        {/* Changed overflow-y-auto to overflow-hidden so the parent container doesn't scroll */}
        <div
          className={`
                    w-full md:w-2/5 md:block 
                    md:h-full bg-white flex flex-col overflow-hidden
                    ${selectedChat ? "hidden" : "block"}
                `}
        >
          <ChatList
            setSelectedChat={setSelectedChat}
            selectedChatId={selectedChat?.id}
            currentUserId={currentUserId}
          />
        </div>

        {/* Right Column */}
        <div
          className={`
                    w-full md:w-3/5 md:block 
                    md:h-full
                    ${selectedChat ? "block" : "hidden"}
                `}
        >
          {selectedChat ? (
            <IndividualChat
              chat={selectedChat}
              onBack={() => setSelectedChat(null)}
              currentUserId={currentUserId}
            />
          ) : (
            <ChatPlaceholder />
          )}
        </div>
      </div>
    </div>
  );
}