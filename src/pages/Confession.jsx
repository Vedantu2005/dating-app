import React, { useState, useEffect } from "react";
import { Trash2, Edit2, User } from "lucide-react"; 
import { db, auth } from "../firebaseConfig";
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
  arrayRemove
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

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
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

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

  const formatDate = (timestamp) => {
    if (!timestamp) return "Just now";
    return timestamp.toDate().toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const postConfession = async () => {
    if (!newConfession.trim()) return;
    if (!currentUser) return alert("You must be logged in to post.");

    try {
      await addDoc(collection(db, "confessions"), {
        content: newConfession,
        userId: currentUser.uid,
        userName: currentUser.displayName || "Anonymous",
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

  const toggleLike = async (id, currentLiked, currentDisliked) => {
    if (!currentUser) return alert("Please log in to vote.");
    const docRef = doc(db, "confessions", id);

    try {
      if (currentLiked) {
        await updateDoc(docRef, { likedBy: arrayRemove(currentUser.uid) });
      } else {
        await updateDoc(docRef, {
          likedBy: arrayUnion(currentUser.uid),
          dislikedBy: arrayRemove(currentUser.uid),
        });
      }
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  const toggleDislike = async (id, currentDisliked, currentLiked) => {
    if (!currentUser) return alert("Please log in to vote.");
    const docRef = doc(db, "confessions", id);

    try {
      if (currentDisliked) {
        await updateDoc(docRef, { dislikedBy: arrayRemove(currentUser.uid) });
      } else {
        await updateDoc(docRef, {
          dislikedBy: arrayUnion(currentUser.uid),
          likedBy: arrayRemove(currentUser.uid),
        });
      }
    } catch (error) {
      console.error("Error toggling dislike:", error);
    }
  };

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

  const deleteConfession = async (id) => {
    if (window.confirm("Are you sure you want to delete this confession?")) {
      try {
        await deleteDoc(doc(db, "confessions", id));
      } catch (error) {
        console.error("Error deleting confession:", error);
      }
    }
  };

  return (
    <>
      <style>{customStyles}</style>

      <div className="min-h-screen w-full bg-gradient-to-br from-[#E6E6FA] via-purple-200 to-purple-300 p-8">
        <div className="text-center mb-8 animate-[slideIn_0.6s_ease-out]">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent mb-2">
            Confessions
          </h1>
          <p className="text-gray-600 text-base">
            Share your heart, find your people
          </p>
        </div>

        <div className="w-full mb-8 animate-[slideIn_0.5s_ease-out]">
          <div className="max-w-4xl mx-auto bg-white/98 backdrop-blur-sm rounded-3xl p-5 shadow-xl">
            <textarea
              value={newConfession}
              onChange={(e) => setNewConfession(e.target.value)}
              placeholder="What's on your mind?"
              disabled={!currentUser}
              // FIX: 'text-base' for mobile (prevents zoom), 'md:text-sm' for laptop
              className="w-full p-4 border-2 border-purple-300 rounded-2xl focus:border-purple-600 outline-none resize-none text-gray-700 text-base md:text-sm placeholder-gray-400"
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

        <div className="w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {confessions.map((confession, index) => (
              <div
                key={confession.id}
                className="bg-white/98 backdrop-blur-sm rounded-3xl p-6 shadow-lg hover:shadow-2xl transition-all animate-[slideIn_0.5s_ease-out] flex flex-col group relative"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
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

                {editingId === confession.id ? (
                  <div className="mb-4">
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="w-full p-3 border-2 border-purple-300 rounded-lg focus:border-purple-500 outline-none resize-none text-base md:text-sm"
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

                <div className="flex gap-3 pt-4 border-t border-gray-200 justify-start">
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
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default ConfessionPage;