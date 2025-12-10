import { useEffect, useState } from "react";
import React from "react";
import { X } from "lucide-react";
import {
  doc,
  collection,
  addDoc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy
} from "firebase/firestore";
import { db,auth } from "../firebaseConfig";

export default function CommentPopup({ confession, onClose,onCommentAdded }) {

  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState([]);

  useEffect(() => {
    const q = query(
      collection(db, "confessions", confession.id, "comments"),
      orderBy("createdAt", "asc")
    );

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));
      setComments(data);
    });

    return () => unsub();
  }, [confession.id]);
  

  // ADD COMMENT / REPLY
  const postComment = async (parentId = null) => {
    const user = auth.currentUser;
    if (!user) return alert("Login required");

    if (!newComment.trim()) return;

    await addDoc(
      collection(db, "confessions", confession.id, "comments"),
      {
        text: newComment,
        userId: user.uid,
        userName: user.displayName || user.email,
        parentId,
        createdAt: serverTimestamp()
      }
    );
    await updateDoc(doc(db, "confessions", confession.id), {
    commentCount: increment(1)
  });

    setNewComment("");
  };
   const handlePostComment = async () => {
  if (!commentText.trim()) return;

  try {
    await addDoc(
      collection(db, 'confessions', confession.id, 'comments'),
      {
        text: commentText,
        userId: currentUser.uid,
        createdAt: serverTimestamp(),
      }
    );

    // ✅ IMPORTANT LINE (COUNT INCREASE CALLBACK)
    if (onCommentAdded) {
      onCommentAdded();
    }

    setCommentText('');
    onClose();   // popup close after comment

  } catch (error) {
    console.error("Error adding comment:", error);
  }
};

  // BUILD TREE
  const buildTree = () => {
    const map = {};
    const roots = [];

    comments.forEach(c => map[c.id] = { ...c, replies: [] });

    comments.forEach(c => {
      if (c.parentId) {
        map[c.parentId]?.replies.push(map[c.id]);
      } else {
        roots.push(map[c.id]);
      }
    });

    return roots;
  };


  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex justify-center items-center">

      <div className="bg-white  text-black w-full max-w-md h-[80%] rounded-lg shadow-lg p-4 overflow-y-auto">

        <div className="flex justify-between items-center mb-3">
          <h2 className="font-bold">Comments</h2>
          <X className="cursor-pointer" onClick={onClose} />
        </div>

        {/* ADD MAIN COMMENT */}
        <textarea
          value={newComment}
          onChange={e => setNewComment(e.target.value)}
          placeholder="Write a comment..."
          className="w-full border p-2 rounded"
        />
        <button
          onClick={() => postComment(null, newComment)}
          className="bg-blue-600 text-white px-3 py-1 rounded mt-2"
        >
          Send
        </button>

        {/* COMMENTS */}
        <div className="mt-4">
          {buildTree().map(c => (
            <CommentItem key={c.id} data={c} onReply={postComment} />
          ))}
        </div>

      </div>
    </div>
  );
}

function CommentItem({ data, onReply }) {

  const [replyText, setReplyText] = useState("");
  const [open, setOpen] = useState(false);

  return (
    <div className="ml-3 mt-3">

      <div className="bg-gray-100 p-2 rounded">
        <b>{data.userName}</b>
        <p>{data.text}</p>

        <button
          className="text-xs text-blue-600 mt-1"
          onClick={() => setOpen(!open)}
        >
          Reply
        </button>
      </div>

      {open && (
        <div className="ml-3 mt-2">
          <textarea
            className="w-full border p-1 rounded"
            value={replyText}
            onChange={e => setReplyText(e.target.value)}
            placeholder="Write reply..."
          />
          <button
            onClick={() => {
              onReply(data.id,replyText);
              setReplyText("");
              setOpen(false);
            }}
            className="bg-green-600 text-white px-2 py-1 text-xs mt-1 rounded"
          >
            Send
          </button>
        </div>
      )}

      {data.replies.map(r => (
        <CommentItem key={r.id} data={r} onReply={onReply} />
      ))}

    </div>
  );
}
