import React, { useState, useEffect } from "react";
import { MessageCircle, Trash2, Edit2, User } from "lucide-react";
import { db, auth } from "../firebaseConfig"; // Importing your config
import {
  collection,
  addDoc,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import CommentPopup from "../components/CommentPop";
import { increment } from "firebase/firestore";
const customStyles = `
  @keyframes slideIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const ConfessionPage = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [confessions, setConfessions] = useState([]);
  const [newConfession, setNewConfession] = useState("");
  const [showCommentBox, setShowCommentBox] = useState({});
  const [commentText, setCommentText] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [activeCommentId, setActiveCommentId] = useState(null);

  // 1. Listen for Authentication State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // 2. Listen for Real-time Confessions from Firestore
  useEffect(() => {
    const q = query(
      collection(db, "confessions"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedConfessions = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Calculate local state based on arrays in DB
          likes: data.likedBy ? data.likedBy.length : 0,
          dislikes: data.dislikedBy ? data.dislikedBy.length : 0,
          liked:
            currentUser && data.likedBy
              ? data.likedBy.includes(currentUser.uid)
              : false,
          disliked:
            currentUser && data.dislikedBy
              ? data.dislikedBy.includes(currentUser.uid)
              : false,
        };
      });
      setConfessions(fetchedConfessions);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // 3. Helper: Format Date
  const formatDate = (timestamp) => {
    if (!timestamp) return "Just now";
    return timestamp.toDate().toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // 4. Post Confession to Firestore
  const postConfession = async () => {
    if (!newConfession.trim()) return;
    if (!currentUser) return alert("You must be logged in to post.");

    try {
      await addDoc(collection(db, "confessions"), {
        content: newConfession,
        userId: currentUser.uid,
        userName: currentUser.displayName || "Anonymous", // Uses real name
        createdAt: serverTimestamp(),
        likedBy: [],
        dislikedBy: [],
        commentCount: 0,
      });
      setNewConfession("");
    } catch (error) {
      console.error("Error posting confession:", error);
    }
  };

  // 5. Toggle Like in Firestore
  const toggleLike = async (id, currentLiked, currentDisliked) => {
    if (!currentUser) return alert("Please log in to vote.");
    const docRef = doc(db, "confessions", id);

    try {
      if (currentLiked) {
        // Remove like
        await updateDoc(docRef, { likedBy: arrayRemove(currentUser.uid) });
      } else {
        // Add like and ensure dislike is removed
        await updateDoc(docRef, {
          likedBy: arrayUnion(currentUser.uid),
          dislikedBy: arrayRemove(currentUser.uid),
        });
      }
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  // 6. Toggle Dislike in Firestore
  const toggleDislike = async (id, currentDisliked, currentLiked) => {
    if (!currentUser) return alert("Please log in to vote.");
    const docRef = doc(db, "confessions", id);

    try {
      if (currentDisliked) {
        // Remove dislike
        await updateDoc(docRef, { dislikedBy: arrayRemove(currentUser.uid) });
      } else {
        // Add dislike and ensure like is removed
        await updateDoc(docRef, {
          dislikedBy: arrayUnion(currentUser.uid),
          likedBy: arrayRemove(currentUser.uid),
        });
      }
    } catch (error) {
      console.error("Error toggling dislike:", error);
    }
  };

  // 7. Save Edit to Firestore
  const saveEdit = async (id) => {
    try {
      await updateDoc(doc(db, "confessions", id), {
        content: editText,
      });
      setEditingId(null);
      setEditText("");
    } catch (error) {
      console.error("Error updating confession:", error);
    }
  };

  // 8. Delete from Firestore
  const deleteConfession = async (id) => {
    if (window.confirm("Are you sure you want to delete this confession?")) {
      try {
        await deleteDoc(doc(db, "confessions", id));
      } catch (error) {
        console.error("Error deleting confession:", error);
      }
    }
  };

  const handleCommentAdded = async (confessionId) => {
    try {
      await updateDoc(doc(db, "confessions", confessionId), {
        commentCount: increment(1), // safer than manual +1
      });
    } catch (err) {
      console.error("Error updating commentCount:", err);
    }
  };
  // 9. Add Comment (Updates count in DB, keeps Alert UI as requested)
  const addComment = async (id) => {
    if (commentText.trim()) {
      try {
        // Update count in DB
        const currentConfession = confessions.find((c) => c.id === id);
        await updateDoc(doc(db, "confessions", id), {
          commentCount: increment(1),
        });

        // Alert UI
        alert("Comment added: " + commentText);
        setCommentText("");
        setShowCommentBox({ ...showCommentBox, [id]: false });
      } catch (error) {
        console.error("Error commenting:", error);
      }
    }
  };
  const handleClick = (confession) => {
    // setShowCommentBox({ ...showCommentBox, [confession.id]: !showCommentBox[confession.id] })
    setActiveCommentId(
      activeCommentId === confession.id ? null : confession.id
    );
  };

  return (
    <>
      <style>{customStyles}</style>

      <div className="min-h-screen w-full bg-gradient-to-br from-[#E6E6FA] via-purple-200 to-purple-300 p-8">
        {/* Header */}
        <div className="text-center mb-8 animate-[slideIn_0.6s_ease-out]">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent mb-2">
            💜 Confessions
          </h1>
          <p className="text-gray-600 text-base">
            Share your heart, find your people
          </p>
        </div>

        {/* Post Confession Box */}
        <div className="w-full mb-8 animate-[slideIn_0.5s_ease-out]">
          <div className="max-w-4xl mx-auto bg-white/98 backdrop-blur-sm rounded-3xl p-5 shadow-xl">
            <textarea
              value={newConfession}
              onChange={(e) => setNewConfession(e.target.value)}
              placeholder={
                currentUser
                  ? `What's on your mind, ${currentUser.displayName}?`
                  : "Please log in to share your confession..."
              }
              disabled={!currentUser}
              className="w-full p-4 border-2 border-purple-300 rounded-2xl focus:border-purple-600 outline-none resize-none text-gray-700 text-sm placeholder-gray-400"
              rows="3"
            />
            <button
              onClick={postConfession}
              disabled={!currentUser}
              className={`w-full mt-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 rounded-2xl font-bold text-base hover:shadow-xl transition-all transform hover:scale-[1.02] ${
                !currentUser ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              Post Confession
            </button>
          </div>
        </div>

        {/* Confessions Grid */}
        <div className="w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {confessions.map((confession, index) => (
              <div
                key={confession.id}
                className="bg-white/98 backdrop-blur-sm rounded-3xl p-6 shadow-lg hover:shadow-2xl transition-all animate-[slideIn_0.5s_ease-out] flex flex-col group relative"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                {/* Author & Date Header (Added per request) */}
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                    <User size={16} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-gray-800">
                      {confession.userName}
                    </span>
                    <span className="text-[10px] text-gray-500">
                      {formatDate(confession.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Edit/Delete Buttons - Only for personal confessions on hover */}
                {currentUser && confession.userId === currentUser.uid && (
                  <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => {
                        setEditingId(confession.id);
                        setEditText(confession.content);
                      }}
                      className="p-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition-all"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteConfession(confession.id)}
                      className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-all"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Content */}
                {editingId === confession.id ? (
                  <div className="mb-4">
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="w-full p-3 border-2 border-purple-300 rounded-lg focus:border-purple-500 outline-none resize-none text-sm"
                      rows="3"
                    />
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => saveEdit(confession.id)}
                        className="flex-1 bg-purple-600 text-white py-2 rounded-lg font-semibold hover:bg-purple-700 transition-all text-sm"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="flex-1 bg-gray-200 text-gray-600 py-2 rounded-lg font-semibold hover:bg-gray-300 transition-all text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-700 mb-5 leading-relaxed text-base flex-grow pr-8">
                    {confession.content}
                  </p>
                )}

                {/* Interaction Buttons */}
                <div className="flex gap-3 pt-4 border-t border-gray-200 justify-between">
                  <button
                    onClick={() =>
                      toggleLike(
                        confession.id,
                        confession.liked,
                        confession.disliked
                      )
                    }
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all font-semibold text-sm ${
                      confession.liked
                        ? "bg-purple-100 text-purple-700"
                        : "bg-gray-100 hover:bg-purple-100"
                    }`}
                  >
                    <span className="text-lg">👍</span>
                    <span className="font-bold">{confession.likes}</span>
                  </button>

                  <button
                    onClick={() =>
                      toggleDislike(
                        confession.id,
                        confession.disliked,
                        confession.liked
                      )
                    }
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all font-semibold text-sm ${
                      confession.disliked
                        ? "bg-red-100 text-red-700"
                        : "bg-gray-100 hover:bg-red-100"
                    }`}
                  >
                    <span className="text-lg">👎</span>
                    <span className="font-bold">{confession.dislikes}</span>
                  </button>

                  <button
                    // onClick={handleClick}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-purple-100 transition-all font-semibold text-sm"
                    onClick={() =>
                      setActiveCommentId(
                        activeCommentId === confession.id ? null : confession.id
                      )
                    }
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span className="font-bold">
                      {confession.commentCount || 0}
                    </span>
                  </button>
                </div>
                {activeCommentId === confession.id && (
                  <CommentPopup
                    confession={confession}
                    onClose={() => {
                      setActiveCommentId(null);
                    }}
                    onCommentAdded={async () => {
                      // ✅ IMMEDIATE UI UPDATE (LOCAL STATE)
                      setConfessions((prev) =>
                        prev.map((c) =>
                          c.id === confession.id
                            ? { ...c, commentCount: (c.commentCount || 0) + 1 }
                            : c
                        )
                      );

                      // ✅ FIRESTORE UPDATE
                      try {
                        await updateDoc(doc(db, "confessions", confession.id), {
                          commentCount: (confession.commentCount || 0) + 1,
                        });
                      } catch (error) {
                        console.error("Failed to update Firestore:", error);
                      }
                    }}
                  />
                )}

                {/* Comment Box */}
                {/* {showCommentBox[confession.id] && (
                  <div className="mt-4 pt-3 border-t border-gray-200 animate-[fadeIn_0.3s_ease-out]">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Comment..."
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addComment(confession.id)}
                        className="flex-1 px-3 py-2 border-2 border-purple-200 rounded-lg focus:border-purple-500 outline-none text-sm"
                      />
                      <button
                        onClick={() => addComment(confession.id)}
                        className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:shadow-lg transition-all text-sm"
                      >
                        Post
                      </button>
                    </div>
                  </div>
                )} */}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default ConfessionPage;
