"use client";

import React, { Suspense, useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, Html, useGLTF, ContactShadows, TransformControls } from '@react-three/drei';
import { Object3D, Box3, Vector3, CanvasTexture, RepeatWrapping, SRGBColorSpace, Shape, MathUtils, MeshStandardMaterial } from 'three';
import Navbar from "../component/navbar";
import Footer from "../component/footer";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

/** * TYPES */
interface FurnitureProps {
  url: string;
  position: [number, number, number];
  mode: 'translate' | 'rotate' | 'scale';
  isSelected: boolean;
  onSelect: () => void;
  onUpdatePosition: (newPos: [number, number, number]) => void;
  setOrbitEnabled: (enabled: boolean) => void;
  floorY: number;
  roomWidth: number;
  roomLength: number;
}

type CameraSide = 'north' | 'south' | 'east' | 'west';

type RoomShape = 'square' | 'rectangle' | 'narrow' | 'studio' | 'l-shape' | 't-shape';

type SceneItemType = {
  id: string;
  name: string;
  price?: string;
  url: string;
  uniqueId: string;
  position: [number, number, number];
};

type EditorSnapshot = {
  sceneItems: SceneItemType[];
  room: {
    shape: RoomShape;
    width: number;
    length: number;
    wallHeight: number;
    wallColor: string;
    floorColor: string;
  };
  selectedItem: string | null;
};

function SceneCamera({ roomWidth, roomLength, wallHeight, orbitRef }: { roomWidth: number; roomLength: number; wallHeight: number; orbitRef: React.RefObject<any> }) {
  const { camera } = useThree();

  useEffect(() => {
    const maxDim = Math.max(roomWidth, roomLength, 1);
    const distance = maxDim * 0.9;
    const height = Math.max(wallHeight * 1.5, maxDim * 0.35);

    camera.position.set(distance, height, distance);
    camera.lookAt(0, 0, 0);
    camera.far = Math.max(200, maxDim * 10);
    camera.updateProjectionMatrix();

    if (orbitRef.current) {
      orbitRef.current.target.set(0, 0, 0);
      orbitRef.current.update();
    }
  }, [roomWidth, roomLength, wallHeight, camera, orbitRef]);

  return null;
}

function getCameraSide(x: number, z: number): CameraSide {
  const absX = Math.abs(x);
  const absZ = Math.abs(z);
  return absX > absZ ? (x > 0 ? 'east' : 'west') : z > 0 ? 'north' : 'south';
}

function CameraSideTracker({ onChange }: { onChange: (value: CameraSide) => void }) {
  const { camera } = useThree();
  const last = useRef<CameraSide | null>(null);

  useFrame(() => {
    const side = getCameraSide(camera.position.x, camera.position.z);
    if (side !== last.current) {
      last.current = side;
      onChange(side);
    }
  });

  return null;
}

function WallSegment({
  side,
  activeSide,
  position,
  rotation,
  size,
  color,
}: {
  side: CameraSide;
  activeSide: CameraSide;
  position: [number, number, number];
  rotation?: [number, number, number];
  size: [number, number, number];
  color: string;
}) {
  const matRef = useRef<MeshStandardMaterial | null>(null);

  useFrame(() => {
    if (!matRef.current) return;
    const target = side === activeSide ? 0 : 0.65;
    matRef.current.opacity = MathUtils.lerp(matRef.current.opacity, target, 0.15);
  });

  return (
    <mesh position={position} rotation={rotation}>
      <boxGeometry args={size} />
      <meshStandardMaterial
        ref={matRef}
        color={color}
        side={1}
        transparent
        opacity={0.65}
        depthWrite={false}
      />
    </mesh>
  );
}

function RoomWalls({ roomWidth, roomLength, wallHeight, wallColor, hiddenSide }: { roomWidth: number; roomLength: number; wallHeight: number; wallColor: string; hiddenSide: CameraSide }) {
  return (
    <group position={[0, wallHeight / 2, 0]}>
      <WallSegment
        side="south"
        activeSide={hiddenSide}
        position={[0, 0, -roomLength / 2]}
        rotation={[0, Math.PI, 0]}
        size={[roomWidth, wallHeight, 0.01]}
        color={wallColor}
      />
      <WallSegment
        side="north"
        activeSide={hiddenSide}
        position={[0, 0, roomLength / 2]}
        size={[roomWidth, wallHeight, 0.01]}
        color={wallColor}
      />
      <WallSegment
        side="west"
        activeSide={hiddenSide}
        position={[-roomWidth / 2, 0, 0]}
        rotation={[0, Math.PI / 2, 0]}
        size={[roomLength, wallHeight, 0.01]}
        color={wallColor}
      />
      <WallSegment
        side="east"
        activeSide={hiddenSide}
        position={[roomWidth / 2, 0, 0]}
        rotation={[0, -Math.PI / 2, 0]}
        size={[roomLength, wallHeight, 0.01]}
        color={wallColor}
      />
    </group>
  );
}

function createWoodTexture() {
  if (typeof document === 'undefined') return null;

  const canvas = document.createElement('canvas');
  const size = 512;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.fillStyle = '#7a4f2a';
  ctx.fillRect(0, 0, size, size);

  const plankWidth = 64;
  for (let x = 0; x < size; x += plankWidth) {
    const variance = Math.floor(Math.random() * 20) - 10;
    ctx.fillStyle = `rgba(${120 + variance}, ${78 + variance / 2}, ${45 + variance / 3}, 0.18)`;
    ctx.fillRect(x, 0, plankWidth, size);
  }

  ctx.fillStyle = 'rgba(40, 25, 15, 0.35)';
  for (let x = 0; x <= size; x += plankWidth) {
    ctx.fillRect(x - 1, 0, 2, size);
  }

  for (let i = 0; i < 4000; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const alpha = 0.03 + Math.random() * 0.05;
    ctx.fillStyle = `rgba(0,0,0,${alpha})`;
    ctx.fillRect(x, y, 2, 2);
  }

  let y = 0;
  while (y < size) {
    const step = 2 + Math.random() * 6;
    const thickness = 1 + Math.floor(Math.random() * 2);
    const shade = 95 + Math.floor(Math.random() * 70);
    ctx.fillStyle = `rgb(${shade}, ${shade - 30}, ${shade - 45})`;
    ctx.fillRect(0, y, size, thickness);
    y += step;
  }

  for (let i = 0; i < 14; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = 10 + Math.random() * 30;
    ctx.strokeStyle = 'rgba(90, 60, 40, 0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * 0.6, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  const texture = new CanvasTexture(canvas);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.colorSpace = SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function ModelThumbnail({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  const ref = useRef<Object3D>(null);

  useEffect(() => {
    if (!ref.current) return;
    const box = new Box3().setFromObject(ref.current);
    const size = new Vector3();
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z, 1);
    const scale = 1.2 / maxDim;
    ref.current.scale.setScalar(scale);
    const center = new Vector3();
    box.getCenter(center);
    ref.current.position.sub(center);
  }, [scene]);

  return (
    <div className="w-16 h-16">
      <Canvas className="w-full h-full" gl={{ alpha: true }} camera={{ position: [2, 2, 2], fov: 45 }}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[5, 5, 5]} intensity={0.6} />
        <primitive object={scene} ref={ref} />
      </Canvas>
    </div>
  );
}

function LoadingLogo({ className }: { className?: string }) {
  return (
    <div className={`loading-logo ${className || ''}`}>
      <img src="/logo-no-bg.png" alt="Loading" className="w-12 h-12 object-contain" />
    </div>
  );
}

function buildShape(points: Array<{ x: number; z: number }>) {
  const shape = new Shape();
  shape.moveTo(points[0].x, points[0].z);
  for (let i = 1; i < points.length; i++) {
    shape.lineTo(points[i].x, points[i].z);
  }
  shape.closePath();
  return shape;
}

function buildSegments(points: Array<{ x: number; z: number }>) {
  const segments: Array<{ x1: number; z1: number; x2: number; z2: number }> = [];
  for (let i = 0; i < points.length; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % points.length];
    segments.push({ x1: p1.x, z1: p1.z, x2: p2.x, z2: p2.z });
  }
  return segments;
}

/** * COMPONENTS */
function Furniture({ url, position, mode, isSelected, onSelect, onUpdatePosition, setOrbitEnabled, floorY, roomWidth, roomLength }: FurnitureProps) {
  const { scene } = useGLTF(url);
  const groupRef = useRef<Object3D>(null);
  const [transformObject, setTransformObject] = useState<Object3D | null>(null);
  const controlsRef = useRef<any>(null);
  const globalScale = 2.0;

  const setGroupRef = useCallback((node: Object3D | null) => {
    groupRef.current = node;
    setTransformObject(node);
  }, []);

  const clonedScene = React.useMemo(() => {
    const clone = scene.clone(true);

    const box = new Box3().setFromObject(clone);
    const size = new Vector3();
    const center = new Vector3();
    box.getSize(size);
    box.getCenter(center);

    clone.position.sub(center);
    clone.scale.multiplyScalar(globalScale);

    const box2 = new Box3().setFromObject(clone);
    clone.position.y -= box2.min.y;

    clone.traverse((obj: any) => {
      if (obj.isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });

    return clone;
  }, [scene]);

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    const handleDraggingChanged = (e: any) => setOrbitEnabled(!e.value);
    controls.addEventListener('dragging-changed', handleDraggingChanged);
    return () => controls.removeEventListener('dragging-changed', handleDraggingChanged);
  }, [setOrbitEnabled]);

  return (
    <group>
      {isSelected && transformObject ? (
        <TransformControls
          ref={controlsRef}
          object={transformObject}
          mode={mode}
          showY={mode !== 'translate'}
          translationSnap={0.1}
          rotationSnap={Math.PI / 8}
          onMouseUp={() => {
            if (groupRef.current) {
              const padding = 0.5;
              const maxX = roomWidth / 2 - padding;
              const maxZ = roomLength / 2 - padding;
              const clampedX = Math.min(Math.max(groupRef.current.position.x, -maxX), maxX);
              const clampedZ = Math.min(Math.max(groupRef.current.position.z, -maxZ), maxZ);

              groupRef.current.position.x = clampedX;
              groupRef.current.position.z = clampedZ;

              onUpdatePosition([clampedX, floorY, clampedZ]);
            }
          }}
        />
      ) : null}

      <group
        ref={setGroupRef}
        position={[position[0], floorY, position[2]]}
        onClick={(e: any) => {
          e.stopPropagation();
          onSelect();
        }}
      >
        <primitive object={clonedScene} castShadow />
      </group>
    </group>
  );
}

const VisualizationPage = () => {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isCanvasLoading, setIsCanvasLoading] = useState(true);
  const [cameraSide, setCameraSide] = useState<CameraSide>('south');
  const [userId, setUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'build' | 'furnish' | 'saved'>('furnish');
  const [savedDesigns, setSavedDesigns] = useState<any[]>([]);
  const [loadingDesigns, setLoadingDesigns] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [savingLayout, setSavingLayout] = useState(false);
  const [showSaveToast, setShowSaveToast] = useState(false);

  const [transformMode, setTransformMode] = useState<'translate' | 'rotate'>('translate');
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [orbitEnabled, setOrbitEnabled] = useState(true);
  const [sceneItems, setSceneItems] = useState<SceneItemType[]>([]);
  const [activeCategory, setActiveCategory] = useState('living');
  const orbitRef = useRef<any>(null);

  const [roomShape, setRoomShape] = useState<RoomShape>('rectangle');
  const [roomWidth, setRoomWidth] = useState(10);
  const [roomLength, setRoomLength] = useState(10);
  const [wallHeight, setWallHeight] = useState(4.5);
  const [wallColor, setWallColor] = useState('#f8fafc');
  const [floorColor, setFloorColor] = useState('#d4b895');

  const [undoStack, setUndoStack] = useState<EditorSnapshot[]>([]);
  const [redoStack, setRedoStack] = useState<EditorSnapshot[]>([]);

  const woodTexture = React.useMemo(() => createWoodTexture(), []);
  const wallThickness = 0.12;

  const createSnapshot = useCallback((): EditorSnapshot => {
    return {
      sceneItems: JSON.parse(JSON.stringify(sceneItems)),
      room: {
        shape: roomShape,
        width: roomWidth,
        length: roomLength,
        wallHeight,
        wallColor,
        floorColor,
      },
      selectedItem,
    };
  }, [sceneItems, roomShape, roomWidth, roomLength, wallHeight, wallColor, floorColor, selectedItem]);

  const applySnapshot = useCallback((snapshot: EditorSnapshot) => {
    setSceneItems(snapshot.sceneItems || []);
    setRoomShape(snapshot.room.shape || 'rectangle');
    setRoomWidth(snapshot.room.width || 10);
    setRoomLength(snapshot.room.length || 10);
    setWallHeight(snapshot.room.wallHeight || 4.5);
    setWallColor(snapshot.room.wallColor || '#f8fafc');
    setFloorColor(snapshot.room.floorColor || '#d4b895');
    setSelectedItem(snapshot.selectedItem || null);
  }, []);

  const pushToUndo = useCallback(() => {
    const snapshot = createSnapshot();
    setUndoStack(prev => [snapshot, ...prev].slice(0, 100));
    setRedoStack([]);
  }, [createSnapshot]);

  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;

    const currentSnapshot = createSnapshot();
    const previousSnapshot = undoStack[0];

    setRedoStack(prev => [currentSnapshot, ...prev].slice(0, 100));
    setUndoStack(prev => prev.slice(1));
    applySnapshot(previousSnapshot);
  }, [undoStack, createSnapshot, applySnapshot]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;

    const currentSnapshot = createSnapshot();
    const nextSnapshot = redoStack[0];

    setUndoStack(prev => [currentSnapshot, ...prev].slice(0, 100));
    setRedoStack(prev => prev.slice(1));
    applySnapshot(nextSnapshot);
  }, [redoStack, createSnapshot, applySnapshot]);

  const updateRoomState = useCallback((changes: Partial<EditorSnapshot['room']>) => {
    pushToUndo();

    if (changes.shape !== undefined) setRoomShape(changes.shape);
    if (changes.width !== undefined) setRoomWidth(changes.width);
    if (changes.length !== undefined) setRoomLength(changes.length);
    if (changes.wallHeight !== undefined) setWallHeight(changes.wallHeight);
    if (changes.wallColor !== undefined) setWallColor(changes.wallColor);
    if (changes.floorColor !== undefined) setFloorColor(changes.floorColor);
  }, [pushToUndo]);

  const lShapeData = React.useMemo(() => {
    const armRatio = 0.6;
    const armWidth = roomWidth * armRatio;
    const armLength = roomLength * armRatio;
    const w2 = roomWidth / 2;
    const l2 = roomLength / 2;
    const xCut = -w2 + armWidth;
    const zCut = -l2 + armLength;

    const points = [
      { x: -w2, z: -l2 },
      { x: w2, z: -l2 },
      { x: w2, z: zCut },
      { x: xCut, z: zCut },
      { x: xCut, z: l2 },
      { x: -w2, z: l2 },
    ];

    return {
      armWidth,
      armLength,
      points,
      shape: buildShape(points),
      segments: buildSegments(points),
    };
  }, [roomWidth, roomLength]);

  const tShapeData = React.useMemo(() => {
    const barRatio = 0.35;
    const stemRatio = 0.35;
    const barLength = roomLength * barRatio;
    const stemWidth = roomWidth * stemRatio;
    const stemLength = roomLength - barLength;
    const w2 = roomWidth / 2;
    const l2 = roomLength / 2;
    const stemHalf = stemWidth / 2;
    const zBar = l2 - barLength;

    const points = [
      { x: -w2, z: l2 },
      { x: w2, z: l2 },
      { x: w2, z: zBar },
      { x: stemHalf, z: zBar },
      { x: stemHalf, z: -l2 },
      { x: -stemHalf, z: -l2 },
      { x: -stemHalf, z: zBar },
      { x: -w2, z: zBar },
    ];

    return {
      barLength,
      stemWidth,
      stemLength,
      points,
      shape: buildShape(points),
      segments: buildSegments(points),
    };
  }, [roomWidth, roomLength]);

  useEffect(() => {
    if (!woodTexture) return;
    const repeatX = Math.max(1, roomWidth / 2);
    const repeatY = Math.max(1, roomLength / 2);
    woodTexture.repeat.set(repeatX, repeatY);
    woodTexture.needsUpdate = true;
  }, [roomWidth, roomLength, woodTexture]);

  const roomLayouts: Array<{ id: RoomShape; name: string; icon: string; w: number; l: number }> = [
    { id: 'square', name: 'Square', icon: 'M4 4h16v16H4z', w: 10, l: 10 },
    { id: 'rectangle', name: 'Rectangle', icon: 'M2 6h20v12H2z', w: 10, l: 15 },
    { id: 'narrow', name: 'Narrow', icon: 'M6 2h12v20H6z', w: 15, l: 10 },
    { id: 'studio', name: 'Studio', icon: 'M2 2h20v20H2z', w: 20, l: 20 },
    { id: 'l-shape', name: 'L-Shape', icon: 'M4 4h8v8h8v8H4z', w: 12, l: 12 },
    { id: 't-shape', name: 'T-Shape', icon: 'M2 4h20v6h-6v10H8V10H2z', w: 14, l: 14 },
  ];

  const floorMaterials = [
    { name: 'Light Oak', hex: '#d4b895' }, { name: 'Dark Walnut', hex: '#4a3018' },
    { name: 'Grey Ash', hex: '#9ca3af' }, { name: 'Cherry Wood', hex: '#7c2d12' },
    { name: 'White Marble', hex: '#f8fafc' }, { name: 'Dark Slate', hex: '#334155' },
    { name: 'Terracotta', hex: '#c53030' }, { name: 'Cream Carpet', hex: '#fef3c7' },
  ];

  const catalogCategories = [
    { id: 'living', label: 'Living Room' },
    { id: 'dining', label: 'Dining Room' },
    { id: 'bedroom', label: 'Bedroom' },
    { id: 'decoration', label: 'Decoration' },
  ];

  const furnitureCatalog: Record<string, any[]> = {
    living: [
      { id: 'lv1', name: 'Wood Chair', price: 'LKR 45,000', url: '/models/WoodChair.glb' },
      { id: 'lv2', name: 'Luxury Sofa', price: 'LKR 245,000', url: '/models/Sofa.glb' },
      { id: 'lv3', name: 'Cool Table', price: 'LKR 120,000', url: '/models/CoolTable.glb' },
    ],
    dining: [
      { id: 'd1', name: 'Formal Dining Table', price: 'LKR 120,000', url: '/models/FTable.glb' },
      { id: 'd2', name: 'Dining Chair', price: 'LKR 80,000', url: '/models/WoodChairFTable.glb' },
    ],
    bedroom: [
      { id: 'b1', name: 'King Sized Bed', price: 'LKR 200,000', url: '/models/KingSizedBed.glb' },
    ],
    decoration: [
      { id: 'dec1', name: 'Lamp', price: 'LKR 30,000', url: '/models/Lamp.glb' },
      { id: 'dec2', name: 'Cool Lamp', price: 'LKR 25,000', url: '/models/CoolLamp.glb' },
    ]
  };

  const loadMyDesigns = async () => {
    if (!userId) {
      alert("Please sign in to load your designs.");
      return;
    }
    setLoadingDesigns(true);
    try {
      const { getDocs, query, where, orderBy } = await import("firebase/firestore");
      const q = query(collection(db, "designs"), where("userId", "==", userId), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setSavedDesigns(rows);
      setActiveTab('saved');
    } catch (e: any) {
      console.error("Failed to load designs:", e);
      alert(`Could not load designs: ${e?.message || e}`);
    } finally {
      setLoadingDesigns(false);
    }
  };

  const applyDesign = (design: any) => {
    pushToUndo();

    const r = design.room || {};
    setRoomShape((r.shape || 'rectangle') as RoomShape);
    setRoomWidth(r.width || 10);
    setRoomLength(r.length || 10);
    setWallHeight(r.wallHeight || 4.5);
    setWallColor(r.wallColor || '#f8fafc');
    setFloorColor(r.floorColor || '#d4b895');
    setSceneItems(design.sceneItems || []);
    setSelectedItem(null);
  };

  useEffect(() => {
    setMounted(true);
    const timeout = window.setTimeout(() => setIsFullscreen(true), 50);
    return () => window.clearTimeout(timeout);
  }, []);

  const handleScreenshot = () => {
    if (canvasRef.current) {
      const link = document.createElement('a');
      link.setAttribute('download', `Opulentia-${Date.now()}.png`);
      link.setAttribute('href', canvasRef.current.toDataURL('image/png'));
      link.click();
    }
  };

  const handleAddItemToScene = (item: any) => {
    pushToUndo();

    const padding = 1;
    const halfW = Math.max(0, roomWidth / 2 - padding);
    const halfL = Math.max(0, roomLength / 2 - padding);
    const spawnX = Math.max(-halfW, Math.min(0, halfW));
    const spawnZ = Math.max(-halfL, Math.min(0, halfL));

    const newItem: SceneItemType = {
      ...item,
      uniqueId: `${item.id}-${Date.now()}`,
      position: [spawnX, 0, spawnZ],
    };

    setSceneItems(prev => [...prev, newItem]);
    setSelectedItem(newItem.uniqueId);
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUserId(u ? u.uid : null);
    });
    return () => unsub();
  }, []);

  const handleSaveLayout = async () => {
    if (!userId) {
      alert("Please sign in to save your design.");
      return;
    }
    if (savingLayout) return;

    setSavingLayout(true);
    try {
      const payload = {
        userId,
        sceneItems,
        room: {
          shape: roomShape,
          width: roomWidth,
          length: roomLength,
          wallHeight,
          wallColor,
          floorColor,
        },
        createdAt: serverTimestamp(),
      };
      await addDoc(collection(db, "designs"), payload);
      setShowSaveToast(true);
      window.setTimeout(() => setShowSaveToast(false), 2500);
    } catch (e) {
      console.error("Failed to save design", e);
      alert("Failed to save design. Please try again.");
    } finally {
      setSavingLayout(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="flex flex-col min-h-screen w-full bg-[#f8fafc] text-gray-800 font-sans overflow-hidden">
      <div className={`overflow-hidden transition-all duration-700 ${isFullscreen ? 'h-0' : 'h-16'}`}>
        <Navbar />
      </div>

      {(!isFullscreen) && (
        <div className="w-full h-16 bg-white border-b border-gray-200 shadow-sm flex items-center justify-between px-8 z-20 shrink-0">
          <div className="flex gap-3">
            <button
              onClick={handleUndo}
              disabled={undoStack.length === 0}
              title="Undo"
              className="w-10 h-10 flex items-center justify-center bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-300 disabled:cursor-not-allowed border border-gray-300 text-gray-700 rounded-lg transition-all shadow-sm active:scale-95"
            >
              ↶
            </button>
            <button
              onClick={handleRedo}
              disabled={redoStack.length === 0}
              title="Redo"
              className="w-10 h-10 flex items-center justify-center bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-300 disabled:cursor-not-allowed border border-gray-300 text-gray-700 rounded-lg transition-all shadow-sm active:scale-95"
            >
              ↷
            </button>
            <button
              onClick={handleScreenshot}
              title="Snapshot"
              className="w-10 h-10 flex items-center justify-center bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 rounded-lg transition-all shadow-sm active:scale-95"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 7H6L7 5H17L18 7H20C21.1046 7 22 7.89543 22 9V19C22 20.1046 21.1046 21 20 21H4C2.89543 21 2 20.1046 2 19V9C2 7.89543 2.89543 7 4 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 17C14.2091 17 16 15.2091 16 13C16 10.7909 14.2091 9 12 9C9.79086 9 8 10.7909 8 13C8 15.2091 9.79086 17 12 17Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button
              onClick={handleSaveLayout}
              disabled={savingLayout}
              title="Save Layout"
              className="w-10 h-10 flex items-center justify-center bg-black hover:bg-black/90 disabled:bg-black/60 disabled:cursor-not-allowed text-white rounded-lg shadow-md transition-all active:scale-95"
            >
              {savingLayout ? (
                <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 21H5C3.89543 21 3 20.1046 3 19V5C3 3.89543 3.89543 3 5 3H15L21 9V19C21 20.1046 20.1046 21 19 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M17 21V13H7V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M7 3V9H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
          </div>
        </div>
      )}

      {showSaveToast && (
        <div className="fixed top-4 right-4 z-50">
          <div className="bg-black text-white text-xs font-black px-4 py-3 rounded-lg shadow-2xl border border-black/20">
            Layout Saved !
          </div>
        </div>
      )}

      <div className="w-full h-16 bg-white border-b border-gray-200 shadow-sm flex items-center justify-between px-8 z-20 shrink-0">
        <div className="flex gap-3">
          <button
            onClick={handleUndo}
            disabled={undoStack.length === 0}
            title="Undo"
            className="w-10 h-10 flex items-center justify-center bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-300 disabled:cursor-not-allowed border border-gray-300 text-gray-700 rounded-lg transition-all shadow-sm active:scale-95"
          >
            ↶
          </button>
          <button
            onClick={handleRedo}
            disabled={redoStack.length === 0}
            title="Redo"
            className="w-10 h-10 flex items-center justify-center bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-300 disabled:cursor-not-allowed border border-gray-300 text-gray-700 rounded-lg transition-all shadow-sm active:scale-95"
          >
            ↷
          </button>
          <button
            onClick={handleScreenshot}
            title="Snapshot"
            className="w-10 h-10 flex items-center justify-center bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 rounded-lg transition-all shadow-sm active:scale-95"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 7H6L7 5H17L18 7H20C21.1046 7 22 7.89543 22 9V19C22 20.1046 21.1046 21 20 21H4C2.89543 21 2 20.1046 2 19V9C2 7.89543 2.89543 7 4 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 17C14.2091 17 16 15.2091 16 13C16 10.7909 14.2091 9 12 9C9.79086 9 8 10.7909 8 13C8 15.2091 9.79086 17 12 17Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button
            onClick={handleSaveLayout}
            disabled={savingLayout}
            title="Save Layout"
            className="w-10 h-10 flex items-center justify-center bg-black hover:bg-black/90 disabled:bg-black/60 disabled:cursor-not-allowed text-white rounded-lg shadow-md transition-all active:scale-95"
          >
            {savingLayout ? (
              <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 21H5C3.89543 21 3 20.1046 3 19V5C3 3.89543 3.89543 3 5 3H15L21 9V19C21 20.1046 20.1046 21 19 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M17 21V13H7V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M7 3V9H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      <div className="relative w-full overflow-hidden flex flex-1 min-h-0 transition-all duration-700">
        <div className="absolute top-0 left-0 w-80 h-full bg-white/95 backdrop-blur-md border-r border-gray-200 z-10 flex flex-col shadow-2xl">
          <div className="flex items-center p-3 border-b border-gray-100 gap-2">
            <button onClick={() => router.back()} className="px-2 py-2 bg-black text-white text-[10px] font-black rounded-lg shadow-sm hover:bg-black/90">←</button>
            <button onClick={() => setActiveTab('build')} className={`flex-1 py-2 text-xs font-bold rounded ${activeTab === 'build' ? 'bg-black text-white shadow-md' : 'bg-gray-100 text-gray-400 hover:bg-gray-200 transition-all'}`}>Build</button>
            <button onClick={() => setActiveTab('furnish')} className={`flex-1 py-2 text-xs font-bold rounded ${activeTab === 'furnish' ? 'bg-black text-white shadow-md' : 'bg-gray-100 text-gray-400 hover:bg-gray-200 transition-all'}`}>Furniture</button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
            {activeTab === 'build' && (
              <div className="space-y-8 animate-fadeIn">
                <div>
                  <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Structure</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {roomLayouts.map((l) => (
                      <button
                        key={l.id}
                        onClick={() => updateRoomState({ shape: l.id, width: l.w, length: l.l })}
                        className={`p-3 border rounded-xl transition-all ${roomShape === l.id ? 'border-black bg-gray-50 ring-1 ring-black shadow-inner' : 'border-gray-100 hover:border-gray-300'}`}
                      >
                        <svg viewBox="0 0 24 24" className="w-6 h-6 mx-auto">
                          <path d={l.icon} fill={roomShape === l.id ? 'black' : '#d1d5db'} />
                        </svg>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-5">
                  <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Dimensions (Meters)</h3>

                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-bold text-gray-600 uppercase">Width</span>
                      <input
                        type="number"
                        value={roomWidth}
                        onChange={(e) => updateRoomState({ width: Math.min(50, Math.max(1, Number(e.target.value))) })}
                        className="w-20 p-1 border rounded text-right font-black text-xs outline-none focus:ring-1 ring-black"
                      />
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="50"
                      value={roomWidth}
                      onChange={(e) => updateRoomState({ width: Math.min(50, Math.max(1, Number(e.target.value))) })}
                      className="w-full accent-black h-1"
                    />
                  </div>

                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-bold text-gray-600 uppercase">Length</span>
                      <input
                        type="number"
                        value={roomLength}
                        onChange={(e) => updateRoomState({ length: Math.min(50, Math.max(1, Number(e.target.value))) })}
                        className="w-20 p-1 border rounded text-right font-black text-xs outline-none focus:ring-1 ring-black"
                      />
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="50"
                      value={roomLength}
                      onChange={(e) => updateRoomState({ length: Math.min(50, Math.max(1, Number(e.target.value))) })}
                      className="w-full accent-black h-1"
                    />
                  </div>

                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-bold text-gray-600 uppercase">Wall Height</span>
                      <input
                        type="number"
                        value={wallHeight}
                        onChange={(e) => updateRoomState({ wallHeight: Math.min(50, Math.max(1, Number(e.target.value))) })}
                        className="w-20 p-1 border rounded text-right font-black text-xs outline-none focus:ring-1 ring-black"
                      />
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="50"
                      value={wallHeight}
                      onChange={(e) => updateRoomState({ wallHeight: Math.min(50, Math.max(1, Number(e.target.value))) })}
                      className="w-full accent-black h-1"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Wall Colour</h3>
                  <div className="bg-white p-4 border border-gray-100 rounded-xl shadow-sm flex items-center justify-between">
                    <span className="text-[10px] font-mono text-gray-400">{wallColor.toUpperCase()}</span>
                    <input
                      type="color"
                      value={wallColor}
                      onChange={(e) => updateRoomState({ wallColor: e.target.value })}
                      className="w-8 h-8 p-0 border-0 rounded cursor-pointer"
                    />
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {floorMaterials.map(m => (
                      <button
                        key={m.name}
                        onClick={() => updateRoomState({ floorColor: m.hex })}
                        className={`aspect-square rounded-lg border-2 transition-all ${floorColor === m.hex ? 'border-black scale-110 shadow-lg' : 'border-transparent'}`}
                        style={{ background: m.hex }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'furnish' && (
              <div className="space-y-4">
                <div className="relative">
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {catalogCategories.map(cat => (
                      <button
                        id={`cat-${cat.id}`}
                        key={cat.id}
                        onClick={() => {
                          setActiveCategory(cat.id);
                          const el = document.getElementById(`cat-${cat.id}`);
                          el?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                        }}
                        className={`px-4 py-1.5 text-[10px] font-bold rounded-full border transition-all ${activeCategory === cat.id ? 'bg-black text-white border-black shadow-md' : 'bg-white text-gray-400'}`}
                      >
                        {cat.label}
                      </button>
                    ))}
                    <button onClick={loadMyDesigns} className="px-4 py-1.5 text-[10px] font-bold rounded-full border transition-all bg-white text-gray-400">{loadingDesigns ? 'Loading...' : 'My Designs'}</button>
                  </div>
                  <div className="pointer-events-none absolute left-0 top-0 h-full w-10 bg-gradient-to-r from-white/95 to-transparent" />
                  <div className="pointer-events-none absolute right-0 top-0 h-full w-10 bg-gradient-to-l from-white/95 to-transparent" />
                </div>

                {furnitureCatalog[activeCategory]?.map((item) => (
                  <div key={item.id} onClick={() => handleAddItemToScene(item)} className="group bg-white border border-gray-100 rounded-2xl p-4 hover:border-black cursor-pointer shadow-sm flex justify-between items-center active:scale-95">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-50">
                        <Suspense fallback={<LoadingLogo className="w-full h-full" />}>
                          <ModelThumbnail url={item.url} />
                        </Suspense>
                      </div>
                      <span className="text-sm font-bold text-gray-700">{item.name}</span>
                    </div>
                    <span className="text-[10px] font-black text-gray-200 group-hover:text-black transition-colors">+ ADD</span>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'saved' && (
              <div className="space-y-3">
                {savedDesigns.length === 0 && (
                  <div className="text-xs text-gray-400">No saved designs yet.</div>
                )}
                {savedDesigns.map((d) => (
                  <div key={d.id} className="bg-white border border-gray-100 rounded-xl p-3 flex items-center justify-between">
                    <div className="text-xs font-bold text-gray-700">{new Date(d.createdAt?.seconds ? d.createdAt.seconds * 1000 : Date.now()).toLocaleString()}</div>
                    <button onClick={() => applyDesign(d)} className="text-[10px] font-black px-3 py-1 rounded-lg border hover:bg-gray-50">Load</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="absolute top-0 right-0 w-72 h-full bg-white/95 border-l border-gray-200 z-10 p-6 flex flex-col shadow-2xl">
          <h2 className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] mb-6">Scene Items</h2>
          <div className="flex-1 overflow-y-auto space-y-3">
            {sceneItems.length === 0 ? (
              <div className="h-32 flex flex-col items-center justify-center border-2 border-dashed border-gray-100 rounded-2xl text-gray-300 text-[10px] font-bold">No furniture yet</div>
            ) : (
              sceneItems.map((item) => (
                <div
                  key={item.uniqueId}
                  onClick={() => setSelectedItem(item.uniqueId)}
                  className={`flex items-center justify-between gap-3 p-3 rounded-xl border transition-all cursor-pointer ${selectedItem === item.uniqueId ? 'border-black bg-black/5' : 'border-gray-100 hover:border-gray-300'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-lg overflow-hidden">
                      <Suspense fallback={<div className="w-full h-full flex items-center justify-center text-xs text-gray-300">...</div>}>
                        <ModelThumbnail url={item.url} />
                      </Suspense>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-700">{item.name}</div>
                      <div className="text-[10px] text-gray-400">{item.price || ''}</div>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      pushToUndo();
                      setSceneItems(prev => prev.filter(i => i.uniqueId !== item.uniqueId));
                      if (selectedItem === item.uniqueId) setSelectedItem(null);
                    }}
                    className="text-[10px] font-black px-2 py-1 rounded-lg border border-red-100 text-red-500 hover:bg-red-50"
                  >
                    Remove
                  </button>
                </div>
              ))
            )}
          </div>

          <button
            onClick={() => {
              pushToUndo();
              setSceneItems([]);
              setSelectedItem(null);
            }}
            className="mt-4 py-3 bg-white text-gray-400 text-[10px] font-bold rounded-xl border border-gray-200 hover:border-red-200 transition-all uppercase tracking-tighter"
          >
            Clear Workspace
          </button>
        </div>

        {selectedItem && (
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20 bg-black p-1.5 rounded-full shadow-2xl flex items-center gap-1">
            <button onClick={() => setTransformMode('translate')} className={`px-6 py-2 text-[10px] font-black rounded-full transition-all ${transformMode === 'translate' ? 'bg-white text-black' : 'text-gray-400'}`}>MOVE</button>
            <button onClick={() => setTransformMode('rotate')} className={`px-6 py-2 text-[10px] font-black rounded-full transition-all ${transformMode === 'rotate' ? 'bg-white text-black' : 'text-gray-400'}`}>ROTATE</button>
          </div>
        )}

        <div className="absolute inset-0 z-0 pl-80 pr-72 bg-[#f1f5f9]">
          <div className="fixed top-4 left-4 z-[90]">
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-black text-white text-xs font-bold rounded-lg shadow-2xl border border-white/20 hover:bg-black/90"
            >
              ←
            </button>
          </div>

          <Canvas
            ref={canvasRef}
            gl={{ preserveDrawingBuffer: true, antialias: true }}
            shadows
            camera={{ position: [10, 10, 10], fov: 45, far: 2000 }}
            onPointerMissed={() => setSelectedItem(null)}
            onCreated={() => setIsCanvasLoading(false)}
          >
            {isCanvasLoading && (
              <Html style={{ position: 'absolute', bottom: 16, right: 16, pointerEvents: 'none' }}>
                <LoadingLogo />
              </Html>
            )}

            <Suspense fallback={null}>
              <SceneCamera roomWidth={roomWidth} roomLength={roomLength} wallHeight={wallHeight} orbitRef={orbitRef} />
              <CameraSideTracker onChange={setCameraSide} />
              <ambientLight intensity={0.8} />
              <directionalLight position={[20, 30, 20]} intensity={1.8} castShadow shadow-mapSize={[2048, 2048]} />
              <Environment preset="city" />

              {roomShape === 'l-shape' ? (
                <>
                  <group position={[0, wallHeight / 2, 0]}>
                    {lShapeData.segments.map((seg, idx) => {
                      const isHorizontal = Math.abs(seg.z1 - seg.z2) < 0.0001;
                      const length = isHorizontal ? Math.abs(seg.x2 - seg.x1) : Math.abs(seg.z2 - seg.z1);
                      const centerX = (seg.x1 + seg.x2) / 2;
                      const centerZ = (seg.z1 + seg.z2) / 2;
                      const side = getCameraSide(centerX, centerZ);
                      return (
                        <WallSegment
                          key={idx}
                          side={side}
                          activeSide={cameraSide}
                          position={[centerX, 0, centerZ]}
                          size={isHorizontal ? [length, wallHeight, wallThickness] : [wallThickness, wallHeight, length]}
                          color={wallColor}
                        />
                      );
                    })}
                  </group>
                  {(() => {
                    const armWidth = lShapeData.armWidth;
                    const armLength = lShapeData.armLength;
                    const xCenter = -roomWidth / 2 + armWidth / 2;
                    const zCenter = -roomLength / 2 + armLength / 2;
                    return (
                      <>
                        <mesh receiveShadow position={[0, 0, zCenter]} rotation={[-Math.PI / 2, 0, 0]}>
                          <planeGeometry args={[roomWidth, armLength]} />
                          <meshStandardMaterial
                            color={floorColor}
                            roughness={0.8}
                            map={woodTexture || undefined}
                            polygonOffset
                            polygonOffsetFactor={1}
                            polygonOffsetUnits={1}
                          />
                        </mesh>
                        <mesh receiveShadow position={[xCenter, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                          <planeGeometry args={[armWidth, roomLength]} />
                          <meshStandardMaterial
                            color={floorColor}
                            roughness={0.8}
                            map={woodTexture || undefined}
                            polygonOffset
                            polygonOffsetFactor={1}
                            polygonOffsetUnits={1}
                          />
                        </mesh>
                      </>
                    );
                  })()}
                </>
              ) : roomShape === 't-shape' ? (
                <>
                  <group position={[0, wallHeight / 2, 0]}>
                    {tShapeData.segments.map((seg, idx) => {
                      const isHorizontal = Math.abs(seg.z1 - seg.z2) < 0.0001;
                      const length = isHorizontal ? Math.abs(seg.x2 - seg.x1) : Math.abs(seg.z2 - seg.z1);
                      const centerX = (seg.x1 + seg.x2) / 2;
                      const centerZ = (seg.z1 + seg.z2) / 2;
                      const side = getCameraSide(centerX, centerZ);
                      return (
                        <WallSegment
                          key={idx}
                          side={side}
                          activeSide={cameraSide}
                          position={[centerX, 0, centerZ]}
                          size={isHorizontal ? [length, wallHeight, wallThickness] : [wallThickness, wallHeight, length]}
                          color={wallColor}
                        />
                      );
                    })}
                  </group>
                  {(() => {
                    const barLength = tShapeData.barLength;
                    const stemWidth = tShapeData.stemWidth;
                    const stemLength = tShapeData.stemLength;
                    const barCenterZ = roomLength / 2 - barLength / 2;
                    const stemCenterZ = -roomLength / 2 + stemLength / 2;
                    return (
                      <>
                        <mesh receiveShadow position={[0, 0, barCenterZ]} rotation={[-Math.PI / 2, 0, 0]}>
                          <planeGeometry args={[roomWidth, barLength]} />
                          <meshStandardMaterial
                            color={floorColor}
                            roughness={0.8}
                            map={woodTexture || undefined}
                            polygonOffset
                            polygonOffsetFactor={1}
                            polygonOffsetUnits={1}
                          />
                        </mesh>
                        <mesh receiveShadow position={[0, 0, stemCenterZ]} rotation={[-Math.PI / 2, 0, 0]}>
                          <planeGeometry args={[stemWidth, stemLength]} />
                          <meshStandardMaterial
                            color={floorColor}
                            roughness={0.8}
                            map={woodTexture || undefined}
                            polygonOffset
                            polygonOffsetFactor={1}
                            polygonOffsetUnits={1}
                          />
                        </mesh>
                      </>
                    );
                  })()}
                </>
              ) : (
                <>
                  <RoomWalls roomWidth={roomWidth} roomLength={roomLength} wallHeight={wallHeight} wallColor={wallColor} hiddenSide={cameraSide} />
                  <mesh receiveShadow position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                    <planeGeometry args={[roomWidth, roomLength]} />
                    <meshStandardMaterial
                      color={floorColor}
                      roughness={0.8}
                      map={woodTexture || undefined}
                      polygonOffset
                      polygonOffsetFactor={1}
                      polygonOffsetUnits={1}
                    />
                  </mesh>
                </>
              )}

              {sceneItems.map((item) => (
                <Furniture
                  key={item.uniqueId}
                  url={item.url}
                  position={item.position}
                  mode={transformMode}
                  isSelected={selectedItem === item.uniqueId}
                  onSelect={() => setSelectedItem(item.uniqueId)}
                  setOrbitEnabled={setOrbitEnabled}
                  floorY={0}
                  roomWidth={roomWidth}
                  roomLength={roomLength}
                  onUpdatePosition={(newPos) => {
                    const currentItem = sceneItems.find(i => i.uniqueId === item.uniqueId);
                    const oldPos = currentItem?.position;

                    const changed =
                      !!oldPos &&
                      (oldPos[0] !== newPos[0] || oldPos[1] !== newPos[1] || oldPos[2] !== newPos[2]);

                    if (!changed) return;

                    pushToUndo();
                    setSceneItems(prev =>
                      prev.map(i => i.uniqueId === item.uniqueId ? { ...i, position: newPos } : i)
                    );
                  }}
                />
              ))}
            </Suspense>

            <ContactShadows position={[0, 0, 0]} opacity={0.4} scale={500} blur={2.5} far={20} />
            <OrbitControls
              ref={orbitRef}
              makeDefault
              enabled={orbitEnabled}
              minDistance={2}
              maxDistance={Infinity}
              maxPolarAngle={Math.PI / 2.1}
              dampingFactor={0.05}
              enableDamping
            />
          </Canvas>
        </div>
      </div>

      <div className={`overflow-hidden transition-all duration-700 ${isFullscreen ? 'h-0' : 'h-16'}`}>
        <Footer />
      </div>
    </div>
  );
};

export default VisualizationPage;