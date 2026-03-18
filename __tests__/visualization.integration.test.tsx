import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';

// Mock next/navigation router
const replaceMock = jest.fn();
const backMock = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: replaceMock, back: backMock }),
}));

// Mock firebase auth and firestore
jest.mock('@/lib/firebase', () => ({ auth: {}, db: {} }));
jest.mock('firebase/auth', () => ({
  onAuthStateChanged: (_auth: any, callback: (user: any) => void) => {
    // Simulate a signed-in user so save layout is allowed.
    callback({ uid: 'user-1', email: 'test@opulentia.com' });
    return () => undefined;
  },
  signOut: jest.fn().mockResolvedValue(undefined),
}));

const addDocMock = jest.fn().mockResolvedValue({});
const collectionMock = jest.fn();
const serverTimestampMock = jest.fn();

jest.mock('firebase/firestore', () => ({
  addDoc: (...args: any[]) => addDocMock(...args),
  collection: (...args: any[]) => collectionMock(...args),
  serverTimestamp: () => serverTimestampMock(),
}));

// Mock toast to avoid console noise
jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock three.js + react-three fiber/drei to avoid WebGL errors in jsdom
jest.mock('@react-three/fiber', () => {
  const React = require('react');
  // Canvas is used with a ref in Visualization; forward it to avoid warnings.
  const Canvas = React.forwardRef((_props: any, ref: any) => (
    <div ref={ref} data-testid="canvas" />
  ));
  Canvas.displayName = 'Canvas';

  return {
    Canvas,
    useThree: () => ({
      camera: {
        position: { x: 0, y: 0, z: 5 },
        up: { set: jest.fn() },
        lookAt: jest.fn(),
        far: 100,
        updateProjectionMatrix: jest.fn(),
      },
    }),
    useFrame: (cb: Function) => {
      React.useEffect(() => {
        cb({ clock: { getDelta: () => 0 } });
      }, [cb]);
      return null;
    },
  };
});

jest.mock('@react-three/drei', () => ({
  OrbitControls: () => null,
  Environment: () => null,
  Html: ({ children }: any) => <>{children}</>,
  ContactShadows: () => null,
  TransformControls: () => null,
  useGLTF: () => ({ scene: {} }),
}));

// Mock Scene3D exports to avoid WebGL/canvas behavior and simplify render
jest.mock('../app/Visualization/Scene3D', () => ({
  CameraSide: 'CameraSide',
  SceneCamera: () => null,
  CameraSideTracker: () => null,
  RoomWalls: () => null,
  getCameraSide: () => 'south',
  WallSegment: () => null,
  createWoodTexture: () => null,
  Furniture: () => null,
}));

// Ensure timers used in Visualization don't cause unexpected async delays.
beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
});

afterEach(() => {
  jest.useRealTimers();
});

const Visualization = require('../app/Visualization/Visualization').default;

describe('Visualization integration', () => {
  it('renders core UI and can save layout', async () => {
    render(<Visualization />);

    // Wait for mount effects (mounted state, fullscreen toggle, tour timeout)
    await act(async () => {
      jest.runOnlyPendingTimers();
    });

    // Ensure snapshot + save controls are present
    expect(screen.getByTitle('Snapshot')).toBeInTheDocument();
    expect(screen.getByTitle('Save Layout')).toBeInTheDocument();

    // Trigger save layout; should call firestore addDoc and show toast
    fireEvent.click(screen.getByTitle('Save Layout'));

    await waitFor(() => expect(addDocMock).toHaveBeenCalled());
    const { toast } = require('react-toastify');
    expect(toast.success).toHaveBeenCalledWith('Design saved successfully.');
  });

  it('renders the tab navigation and defaults to Build', async () => {
    render(<Visualization />);

    await act(async () => {
      jest.runOnlyPendingTimers();
    });

    // The tab buttons should exist
    expect(screen.getByRole('button', { name: /build/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /furniture/i })).toBeInTheDocument();

    // Build tab should be active by default and show structure controls
    expect(screen.getByText(/Structure/i)).toBeInTheDocument();
  });
});
