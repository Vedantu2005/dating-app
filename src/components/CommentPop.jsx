import React, { useEffect, useState, useRef } from "react";
import { X, Send, CornerDownRight, User, MessageCircle } from "lucide-react";
import {
  doc,
  collection,
  addDoc,
  updateDoc,
  increment,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy
} from "firebase/firestore";
import { db, auth } from "../firebaseConfig";

// --- Helper for Time Formatting ---
const formatTime = (timestamp) => {
  if (!timestamp) return "Just now";
  const date = timestamp.toDate();
  const now = new Date();
  const diff = (now - date) / 1000; // seconds

  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return date.toLocaleDateString();
};

export default function CommentPopup({ confession, onClose, onCommentAdded }) {
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  // --- Realtime Listener ---
  useEffect(() => {
    const q = query(
      collection(db, "confessions", confession.id, "comments"),
      orderBy("createdAt", "asc")
    );

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      setComments(data);
    });

    return () => unsub();
  }, [confession.id]);

  // --- Scroll to bottom on new comments ---
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [comments]);

  // --- Post Comment Function ---
  const postComment = async (parentId = null, text = "") => {
    const commentContent = text || newComment;
    if (!commentContent.trim()) return;

    const user = auth.currentUser;
    if (!user) return alert("Login required");

    setLoading(true);
    try {
      // 1. Add Comment to Subcollection
      await addDoc(collection(db, "confessions", confession.id, "comments"), {
        text: commentContent,
        userId: user.uid,
        userName: user.displayName || "Anonymous",
        avatarUrl: user.photoURL || null,
        parentId,
        createdAt: serverTimestamp(),
      });

      // 2. Update Global Comment Count
      await updateDoc(doc(db, "confessions", confession.id), {
        commentCount: increment(1),
      });

      // 3. Callback for parent UI updates (optional)
      if (onCommentAdded) onCommentAdded();

      // Clear input
      if (!parentId) setNewComment("");
      
      // NOTE: We do NOT call onClose() here, so the popup stays open.

    } catch (error) {
      console.error("Error posting comment:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- Tree Builder for Replies ---
  const buildTree = () => {
    const map = {};
    const roots = [];
    comments.forEach((c) => (map[c.id] = { ...c, replies: [] }));
    comments.forEach((c) => {
      if (c.parentId && map[c.parentId]) {
        map[c.parentId].replies.push(map[c.id]);
      } else {
        roots.push(map[c.id]);
      }
    });
    return roots;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
      {/* Modal Container */}
      <div className="w-full sm:max-w-md bg-white sm:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col h-[85vh] sm:h-[600px] overflow-hidden animate-[slideUp_0.3s_ease-out]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-purple-100 bg-white z-10">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-bold text-gray-800">Comments</h2>
            <span className="bg-purple-100 text-purple-600 text-xs font-bold px-2 py-0.5 rounded-full">
              {comments.length}
            </span>
          </div>
          <button 
            onClick={onClose}
            className="p-2 bg-gray-100 hover:bg-red-100 hover:text-red-500 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Comments List Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-gray-50/50 scrollbar-hide">
          {comments.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
              <MessageCircle size={48} className="mb-2" />
              <p>No comments yet. Be the first!</p>
            </div>
          ) : (
            buildTree().map((c) => (
              <CommentItem key={c.id} data={c} onReply={postComment} />
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input Area (Sticky Bottom) */}
        <div className="p-4 bg-white border-t border-purple-100">
          <div className="flex items-center gap-2 bg-gray-100 p-1.5 rounded-full pl-4 border focus-within:border-purple-400 focus-within:bg-white transition-all focus-within:shadow-md">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && postComment()}
              placeholder="Add a comment..."
              className="flex-1 bg-transparent outline-none text-sm text-gray-700 placeholder-gray-400"
              disabled={loading}
            />
            <button
              onClick={() => postComment()}
              disabled={!newComment.trim() || loading}
              className={`p-2.5 rounded-full transition-all flex items-center justify-center ${
                newComment.trim() 
                  ? "bg-purple-600 text-white shadow-lg hover:scale-105 active:scale-95" 
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Recursive Comment Item Component ---
function CommentItem({ data, onReply }) {
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState("");

  const handleSendReply = () => {
    if (replyText.trim()) {
      onReply(data.id, replyText);
      setReplyText("");
      setIsReplying(false);
    }
  };

  return (
    <div className="flex flex-col">
      {/* Comment Card */}
      <div className="flex gap-3 group">
        {/* Avatar */}
        <div className="flex-shrink-0 mt-1">
          {data.avatarUrl ? (
            <img 
              src={data.avatarUrl} 
              alt={data.userName} 
              className="w-8 h-8 rounded-full object-cover border border-purple-200"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-indigo-400 flex items-center justify-center text-white text-xs font-bold shadow-sm">
              {data.userName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-sm text-gray-800">{data.userName}</span>
              <span className="text-[10px] text-gray-400">{formatTime(data.createdAt)}</span>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed break-words">{data.text}</p>
          </div>

          {/* Action Bar */}
          <div className="flex items-center gap-4 mt-1 ml-2">
            <button 
              onClick={() => setIsReplying(!isReplying)}
              className="text-xs font-semibold text-gray-500 hover:text-purple-600 transition-colors flex items-center gap-1"
            >
              Reply
            </button>
          </div>

          {/* Reply Input */}
          {isReplying && (
            <div className="mt-3 flex items-start gap-2 animate-[fadeIn_0.2s_ease-out]">
              <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                <CornerDownRight size={14} className="text-gray-500" />
              </div>
              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  autoFocus
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
                  placeholder={`Reply to ${data.userName}...`}
                  className="flex-1 bg-white border border-purple-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-200 transition-all"
                />
                <button
                  onClick={handleSendReply}
                  className="bg-purple-600 text-white px-3 py-2 rounded-xl text-xs font-bold hover:bg-purple-700 transition-colors"
                >
                  Send
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Nested Replies with Visual Thread Line */}
      {data.replies && data.replies.length > 0 && (
        <div className="pl-4 mt-2">
          <div className="border-l-2 border-purple-100 pl-4 space-y-4">
            {data.replies.map((reply) => (
              <CommentItem key={reply.id} data={reply} onReply={onReply} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}