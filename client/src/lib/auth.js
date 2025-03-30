import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import app from "./firebase";
const auth = getAuth(app);

export const signInAnonymouslyUser = async () => {
  try {
    const userCredential = await signInAnonymously(auth);
    return userCredential.user;
  } catch (error) {
    console.error("Error signing in anonymously:", error);
  }
};

export const listenForAuthChanges = (callback) => {
  onAuthStateChanged(auth, (user) => {
    callback(user);
  });
};
