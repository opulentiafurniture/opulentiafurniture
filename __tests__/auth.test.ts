import { registerUser } from '../lib/auth';

const mockUser = { uid: '123', displayName: 'Test', email: 'test@example.com' } as any;

jest.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: jest.fn(async () => ({ user: mockUser })),
  updateProfile: jest.fn(async () => undefined),
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn((db: any, collection: string, id: string) => ({ db, collection, id })),
  setDoc: jest.fn(async () => undefined),
  serverTimestamp: jest.fn(() => ({ toString: () => 'timestamp' })),
}));

describe('registerUser', () => {
  it('creates a user and writes profile to firestore', async () => {
    const fakeAuth = {} as any;
    const fakeDb = {} as any;

    const user = await registerUser({ auth: fakeAuth, db: fakeDb, email: 'test@example.com', password: 'password', name: 'Tester' });

    expect(user).toBe(mockUser);
    const { createUserWithEmailAndPassword, updateProfile } = require('firebase/auth');
    const { doc, setDoc } = require('firebase/firestore');

    expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(fakeAuth, 'test@example.com', 'password');
    expect(updateProfile).toHaveBeenCalledWith(mockUser, { displayName: 'Tester' });
    expect(doc).toHaveBeenCalledWith(fakeDb, 'users', mockUser.uid);
    expect(setDoc).toHaveBeenCalled();
  });
});
