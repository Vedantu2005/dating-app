import { use, useEffect } from "react";
import { ref, onValue, set, onDisconnect } from "firebase/database";
import { realtimeDB } from "./firebaseConfig";
import { getAuth } from "firebase/auth";

export const usePresence = () => {
  const auth = getAuth();
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    const uid = user.uid;
    const userStatusRef = ref(realtimeDB, `status/${uid}`);
    const connectedRef = ref(realtimeDB, ".info/connected");
    onValue(connectedRef, (snap) => {
      if (snap.val() === true) {
        // when user disconnect
        onDisconnect(userStatusRef).set({
          state: "offline",
          lastSeen: Date.now(),
        });
        set(userStatusRef, {
          state: "online",
          lastSeen: Date.now(),
        });
      }
    });
  },[]);
};
