import { Auth, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { Firestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';

export type RegisterUserParams = {
  auth: Auth;
  db: Firestore;
  email: string;
  password: string;
  name: string;
};

export async function registerUser({ auth, db, email, password, name }: RegisterUserParams) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);

  if (!userCredential.user) {
    throw new Error('Failed to create user');
  }

  await updateProfile(userCredential.user, { displayName: name.trim() });

  await setDoc(doc(db, 'users', userCredential.user.uid), {
    name: name.trim(),
    displayName: name.trim(),
    email,
    role: 'user',
    createdAt: serverTimestamp(),
  });

  return userCredential.user;
}
