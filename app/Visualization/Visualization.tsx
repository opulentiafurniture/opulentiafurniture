"use client";

import React, { Suspense, useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Html, useGLTF, ContactShadows } from '@react-three/drei';
import { Box3, Vector3, Shape } from 'three';
import Navbar from "../component/navbar";
import Footer from "../component/footer";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { toast } from "react-toastify";
import { ALL_PRODUCTS } from "@/lib/product";
import { CameraSide, SceneCamera, CameraSideTracker, RoomWalls, getCameraSide, WallSegment, createWoodTexture, Furniture } from "./Scene3D";

export type VisualizationSceneItem = {
  uniqueId: string;
  url: string;
  position: [number, number, number];
  name: string;
  price?: string;
  // Optional styling applied to the model
  color?: string;
};

export type VisualizationRoomConfig = {
  shape?: string;
  width?: number;
  length?: number;
  wallHeight?: number;
  wallColor?: string;
  floorColor?: string;
};

export type VisualizationSnapshot = {
  sceneItems: VisualizationSceneItem[];
  roomShape: string;
  roomWidth: number;
  roomLength: number;
  wallHeight: number;
  wallColor: string;
  floorColor: string;
  selectedItem: string | null;
};

export type VisualizationProps = {
  initialSceneItems?: VisualizationSceneItem[];
  initialRoomConfig?: VisualizationRoomConfig;
  initialCategory?: string;
  initialTab?: 'build' | 'furnish' | 'saved';
  catalogItems?: Record<string, any[]>;
  showPageChrome?: boolean;
  isEmbedded?: boolean;
  onBack?: () => void;
};

function ModelThumbnail({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  const ref = useRef<any>(null);

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

// The 3D scene rendering is handled by shared components in Scene3D.tsx
export default function Visualization({
  initialSceneItems = [],
  initialRoomConfig = {},
  initialCategory = 'living',
  initialTab = 'furnish',
  catalogItems,
  showPageChrome = true,
  isEmbedded = false,
  onBack,
}: VisualizationProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(isEmbedded);
  const [isCanvasLoading, setIsCanvasLoading] = useState(true);
  const [cameraSide, setCameraSide] = useState<CameraSide>('south');
  const [userId, setUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'build' | 'furnish' | 'saved'>(initialTab);
  const [savedDesigns, setSavedDesigns] = useState<any[]>([]);
  const [loadingDesigns, setLoadingDesigns] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [savingLayout, setSavingLayout] = useState(false);

  const [transformMode, setTransformMode] = useState<'translate' | 'rotate'>('translate');
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [orbitEnabled, setOrbitEnabled] = useState(true);
  const [viewMode, setViewMode] = useState<'3d' | '2d'>('3d');
  const [sceneItems, setSceneItems] = useState<VisualizationSceneItem[]>(initialSceneItems);
  const selectedSceneItem = React.useMemo(() => sceneItems.find((i) => i.uniqueId === selectedItem) ?? null, [sceneItems, selectedItem]);
  const [history, setHistory] = useState<VisualizationSnapshot[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const categoryScrollRef = useRef<HTMLDivElement | null>(null);
  const orbitRef = useRef<any>(null);


  const [roomShape, setRoomShape] = useState(initialRoomConfig.shape ?? 'rectangle');
  const [roomWidth, setRoomWidth] = useState(initialRoomConfig.width ?? 10);
  const [roomLength, setRoomLength] = useState(initialRoomConfig.length ?? 10);
  const [wallHeight, setWallHeight] = useState(initialRoomConfig.wallHeight ?? 4.5); 
  const [wallColor, setWallColor] = useState(initialRoomConfig.wallColor ?? '#f8fafc'); 
  const [floorColor, setFloorColor] = useState(initialRoomConfig.floorColor ?? '#d4b895'); 

  const getSnapshot = React.useCallback(
    (overrides: Partial<VisualizationSnapshot> = {}) => ({
      sceneItems,
      roomShape,
      roomWidth,
      roomLength,
      wallHeight,
      wallColor,
      floorColor,
      selectedItem,
      ...overrides,
    }),
    [sceneItems, roomShape, roomWidth, roomLength, wallHeight, wallColor, floorColor, selectedItem]
  );

  const pushHistory = React.useCallback(
    (snapshot: VisualizationSnapshot) => {
      setHistory((prev) => {
        const next = prev.slice(0, historyIndex + 1);
        return [...next, snapshot];
      });
      setHistoryIndex((prev) => prev + 1);
    },
    [historyIndex]
  );

  const applySnapshot = React.useCallback((snapshot: VisualizationSnapshot) => {
    setSceneItems(snapshot.sceneItems);
    setRoomShape(snapshot.roomShape);
    setRoomWidth(snapshot.roomWidth);
    setRoomLength(snapshot.roomLength);
    setWallHeight(snapshot.wallHeight);
    setWallColor(snapshot.wallColor);
    setFloorColor(snapshot.floorColor);
    setSelectedItem(snapshot.selectedItem);
  }, []);

  const woodTexture = React.useMemo(() => createWoodTexture(), []);
  const wallThickness = 0.12;

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

  
  const roomLayouts = [
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

  const getDefaultModelUrl = (name: string) => {
    const map: Record<string, string> = {
      "Royal King Bed": "/models/KingSizedBed.glb",
      "Oak Dining Chair": "/models/WoodChairFTable.glb",
      "Royal Velvet Sofa": "/models/Sofa.glb",
      "Grand Dining Table": "/models/FTable.glb",
      "Marble Coffee Table": "/models/CoolTable.glb",
      "Modern Bookshelf": "/models/WoodChair.glb",
    };
    return map[name] ?? "/models/WoodChair.glb";
  };

  const defaultCatalog: Record<string, any[]> = {
    living: ALL_PRODUCTS.filter(p => ['Sofas', 'Shelf', 'Tables', 'Chairs'].includes(p.category)).map(p => ({
      ...p,
      url: p.modelUrl ?? getDefaultModelUrl(p.name),
    })),
    dining: ALL_PRODUCTS.filter(p => ['Tables', 'Chairs', 'Storage'].includes(p.category)).map(p => ({
      ...p,
      url: p.modelUrl ?? getDefaultModelUrl(p.name),
    })),
    bedroom: ALL_PRODUCTS.filter(p => ['Beds', 'Wardrobes', 'Dressers'].includes(p.category)).map(p => ({
      ...p,
      url: p.modelUrl ?? getDefaultModelUrl(p.name),
    })),
    decoration: ALL_PRODUCTS.filter(p => ['Shelf'].includes(p.category)).map(p => ({
      ...p,
      url: p.modelUrl ?? getDefaultModelUrl(p.name),
    })),
  };

  const furnitureCatalog = catalogItems ?? defaultCatalog;

  const LOCAL_STORAGE_KEY = (uid: string) => `opulentia-designs-${uid}`;

  const saveLocalDesign = (uid: string, design: any) => {
    try {
      const key = LOCAL_STORAGE_KEY(uid);
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      const next = [{ id: `local-${Date.now()}`, createdAt: Date.now(), ...design }, ...existing];
      localStorage.setItem(key, JSON.stringify(next));
      return next;
    } catch {
      return null;
    }
  };

  const loadLocalDesigns = (uid: string) => {
    try {
      const key = LOCAL_STORAGE_KEY(uid);
      const saved = JSON.parse(localStorage.getItem(key) || '[]');
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
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
      toast.success('Loaded saved designs.');
    } catch (e: any) {
      console.error("Failed to load designs:", e);
      if (e?.message?.toLowerCase().includes('missing or insufficient permissions')) {
        const local = loadLocalDesigns(userId);
        setSavedDesigns(local);
        setActiveTab('saved');
        toast.info('Unable to load designs from the server; loaded local designs instead.');
      } else {
        toast.error(`Could not load designs: ${e?.message || e}`);
      }
    } finally {
      setLoadingDesigns(false);
    }
  };

  const applyDesign = (design: any) => {
    const r = design.room || {};
    const nextScene = design.sceneItems || [];
    const nextRoomShape = r.shape || 'rectangle';
    const nextRoomWidth = r.width || 10;
    const nextRoomLength = r.length || 10;
    const nextWallHeight = r.wallHeight || 4.5;
    const nextWallColor = r.wallColor || '#f8fafc';
    const nextFloorColor = r.floorColor || '#d4b895';

    setRoomShape(nextRoomShape);
    setRoomWidth(nextRoomWidth);
    setRoomLength(nextRoomLength);
    setWallHeight(nextWallHeight);
    setWallColor(nextWallColor);
    setFloorColor(nextFloorColor);
    setSceneItems(nextScene);
    setSelectedItem(null);

    pushHistory(
      getSnapshot({
        sceneItems: nextScene,
        roomShape: nextRoomShape,
        roomWidth: nextRoomWidth,
        roomLength: nextRoomLength,
        wallHeight: nextWallHeight,
        wallColor: nextWallColor,
        floorColor: nextFloorColor,
        selectedItem: null,
      })
    );
  };

  useEffect(() => {
    setMounted(true);
    // Smoothly slide header/footer away and expand the viewer to fullscreen.
    const timeout = window.setTimeout(() => setIsFullscreen(true), 50);
    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    // Initialize undo/redo history
    setHistory([getSnapshot()]);
    setHistoryIndex(0);

    // Load a design that was selected from Profile > Saved Designs
    try {
      const raw = localStorage.getItem('opulentia_selected_design');
      if (raw) {
        const design = JSON.parse(raw);
        const r = design.room || {};
        const nextScene = design.sceneItems || [];

        setRoomShape(r.shape || 'rectangle');
        setRoomWidth(r.width || 10);
        setRoomLength(r.length || 10);
        setWallHeight(r.wallHeight || 4.5);
        setWallColor(r.wallColor || '#f8fafc');
        setFloorColor(r.floorColor || '#d4b895');
        setSceneItems(nextScene);
        setSelectedItem(null);

        pushHistory(
          getSnapshot({
            sceneItems: nextScene,
            roomShape: r.shape || 'rectangle',
            roomWidth: r.width || 10,
            roomLength: r.length || 10,
            wallHeight: r.wallHeight || 4.5,
            wallColor: r.wallColor || '#f8fafc',
            floorColor: r.floorColor || '#d4b895',
            selectedItem: null,
          })
        );

        // Clear it so future visits don't automatically re-load
        localStorage.removeItem('opulentia_selected_design');
      }
    } catch (e) {
      console.warn('Failed to load selected design from storage', e);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleScreenshot = () => {
    if (canvasRef.current) {
      const link = document.createElement('a');
      link.setAttribute('download', `Opulentia-${Date.now()}.png`);
      link.setAttribute('href', canvasRef.current.toDataURL('image/png'));
      link.click();
    }
  };

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const handleUndo = React.useCallback(() => {
    if (!canUndo) return;
    const nextIndex = historyIndex - 1;
    applySnapshot(history[nextIndex]);
    setHistoryIndex(nextIndex);
  }, [canUndo, history, historyIndex, applySnapshot]);

  const handleRedo = React.useCallback(() => {
    if (!canRedo) return;
    const nextIndex = historyIndex + 1;
    applySnapshot(history[nextIndex]);
    setHistoryIndex(nextIndex);
  }, [canRedo, history, historyIndex, applySnapshot]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore key events coming from input fields
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;

      const isMod = e.ctrlKey || e.metaKey;
      if (!isMod) return;

      if (e.key === 'z' || e.key === 'Z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      }

      if (e.key === 'y' || e.key === 'Y') {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  const updateSelectedItem = (overrides: Partial<VisualizationSceneItem>) => {
    if (!selectedItem) return;
    const nextScene = sceneItems.map((i) => (i.uniqueId === selectedItem ? { ...i, ...overrides } : i));
    setSceneItems(nextScene);
    pushHistory(getSnapshot({ sceneItems: nextScene }));
  };

  const handleAddItemToScene = (item: any) => {
    const padding = 1;
    const halfW = Math.max(0, roomWidth / 2 - padding);
    const halfL = Math.max(0, roomLength / 2 - padding);
    const spawnX = Math.max(-halfW, Math.min(0, halfW));
    const spawnZ = Math.max(-halfL, Math.min(0, halfL));

    const newItem: VisualizationSceneItem = {
      ...item,
      uniqueId: `${item.id}-${Date.now()}`,
      position: [spawnX, 0, spawnZ],
      color: '#ffffff',
    };

    const nextScene = [...sceneItems, newItem];
    setSceneItems(nextScene);
    setSelectedItem(newItem.uniqueId);

    pushHistory(getSnapshot({ sceneItems: nextScene, selectedItem: newItem.uniqueId }));
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

    try {
      await addDoc(collection(db, "designs"), payload);
      toast.success('Design saved successfully.');
    } catch (e: any) {
      console.error("Failed to save design", e);
      if (e?.message?.toLowerCase().includes('missing or insufficient permissions')) {
        const local = saveLocalDesign(userId, payload);
        if (local) {
          setSavedDesigns(local);
          setActiveTab('saved');
          toast.info('Could not save to server; design was saved locally instead.');
        } else {
          toast.error('Could not save design. Local storage is unavailable.');
        }
      } else {
        toast.error("Failed to save design. Please try again.");
      }
    } finally {
      setSavingLayout(false);
    }
  };

  if (!mounted) return null;

  const showChrome = showPageChrome && !isEmbedded;

  return (
    <div className={`flex flex-col ${isEmbedded ? 'h-full' : 'min-h-screen'} w-full bg-[#f8fafc] text-gray-800 font-sans overflow-hidden`}>

      {showChrome && (
        <div className={`overflow-hidden transition-all duration-700 ${isFullscreen ? 'h-0' : 'h-16'}`}>
          <Navbar />
        </div>
      )}

      {/* Top controls (Snapshot/Save) */}
      {showChrome && !isFullscreen && (
        <div className="w-full h-16 bg-white border-b border-gray-200 shadow-sm flex items-center justify-between px-8 z-20 shrink-0">
          <div className="flex gap-3">
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
                onClick={handleUndo}
                disabled={!canUndo}
                title="Undo"
                className="w-10 h-10 flex items-center justify-center bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 rounded-lg transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ⟲
              </button>
              <button
                onClick={handleRedo}
                disabled={!canRedo}
                title="Redo"
                className="w-10 h-10 flex items-center justify-center bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 rounded-lg transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ⟳
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

      
      {showChrome && (
        <div className="w-full h-16 bg-white border-b border-gray-200 shadow-sm flex items-center justify-between px-8 z-20 shrink-0">
          <div className="flex gap-3">
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
                onClick={handleUndo}
                disabled={!canUndo}
                title="Undo"
                className="w-10 h-10 flex items-center justify-center bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 rounded-lg transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ⟲
              </button>
              <button
                onClick={handleRedo}
                disabled={!canRedo}
                title="Redo"
                className="w-10 h-10 flex items-center justify-center bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 rounded-lg transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ⟳
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

      <div className="relative w-full overflow-hidden flex flex-1 min-h-0 transition-all duration-700">
        
        {/* SIDEBAR */}
        {showChrome && (
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
                          <button key={l.id} onClick={() => {setRoomShape(l.id); setRoomWidth(l.w); setRoomLength(l.l);}} className={`p-3 border rounded-xl transition-all ${roomShape === l.id ? 'border-black bg-gray-50 ring-1 ring-black shadow-inner' : 'border-gray-100 hover:border-gray-300'}`}>
                              <svg viewBox="0 0 24 24" className="w-6 h-6 mx-auto"><path d={l.icon} fill={roomShape === l.id ? 'black' : '#d1d5db'} /></svg>
                          </button>
                          ))}
                      </div>
                    </div>

                    <div className="space-y-5">
                      <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Dimensions (Meters)</h3>
                      <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 shadow-sm">
                          <div className="flex justify-between items-center mb-1"><span className="text-[10px] font-bold text-gray-600 uppercase">Width</span><input type="number" value={roomWidth} onChange={(e) => setRoomWidth(Math.min(50, Math.max(1, Number(e.target.value))))} className="w-20 p-1 border rounded text-right font-black text-xs outline-none focus:ring-1 ring-black" /></div>
                          <input type="range" min="1" max="50" value={roomWidth} onChange={(e) => setRoomWidth(Math.min(50, Math.max(1, Number(e.target.value))))} className="w-full accent-black h-1" />
                      </div>
                      <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 shadow-sm">
                          <div className="flex justify-between items-center mb-1"><span className="text-[10px] font-bold text-gray-600 uppercase">Length</span><input type="number" value={roomLength} onChange={(e) => setRoomLength(Math.min(50, Math.max(1, Number(e.target.value))))} className="w-20 p-1 border rounded text-right font-black text-xs outline-none focus:ring-1 ring-black" /></div>
                          <input type="range" min="1" max="50" value={roomLength} onChange={(e) => setRoomLength(Math.min(50, Math.max(1, Number(e.target.value))))} className="w-full accent-black h-1" />
                      </div>
                      {/* FIXED: Dynamic Wall Height Input */}
                      <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 shadow-sm">
                          <div className="flex justify-between items-center mb-1"><span className="text-[10px] font-bold text-gray-600 uppercase">Wall Height</span><input type="number" value={wallHeight} onChange={(e) => setWallHeight(Math.min(50, Math.max(1, Number(e.target.value))))} className="w-20 p-1 border rounded text-right font-black text-xs outline-none focus:ring-1 ring-black" /></div>
                          <input type="range" min="1" max="50" value={wallHeight} onChange={(e) => setWallHeight(Math.min(50, Math.max(1, Number(e.target.value))))} className="w-full accent-black h-1" />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Wall Colour</h3>
                      <div className="bg-white p-4 border border-gray-100 rounded-xl shadow-sm flex items-center justify-between">
                          <span className="text-[10px] font-mono text-gray-400">{wallColor.toUpperCase()}</span>
                          <input type="color" value={wallColor} onChange={(e) => setWallColor(e.target.value)} className="w-8 h-8 p-0 border-0 rounded cursor-pointer" />
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                          {floorMaterials.map(m => (
                          <button key={m.name} onClick={() => setFloorColor(m.hex)} className={`aspect-square rounded-lg border-2 transition-all ${floorColor === m.hex ? 'border-black scale-110 shadow-lg' : 'border-transparent'}`} style={{background: m.hex}} />
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
                      <div className="text-xs font-bold text-gray-700">{new Date(d.createdAt?.seconds ? d.createdAt.seconds*1000 : Date.now()).toLocaleString()}</div>
                      <button onClick={() => applyDesign(d)} className="text-[10px] font-black px-3 py-1 rounded-lg border hover:bg-gray-50">Load</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* RIGHT PANEL: Scene items */}
        {showChrome && (
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
                        const nextScene = sceneItems.filter(i => i.uniqueId !== item.uniqueId);
                        setSceneItems(nextScene);
                        if (selectedItem === item.uniqueId) setSelectedItem(null);
                        pushHistory(getSnapshot({ sceneItems: nextScene, selectedItem: selectedItem === item.uniqueId ? null : selectedItem }));
                        toast.info('Item removed from scene.');
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
                setSceneItems([]);
                setSelectedItem(null);
                pushHistory(getSnapshot({ sceneItems: [], selectedItem: null }));
                toast.info('Workspace cleared.');
              }}
              className="mt-4 py-3 bg-white text-gray-400 text-[10px] font-bold rounded-xl border border-gray-200 hover:border-red-200 transition-all uppercase tracking-tighter"
            >
              Clear Workspace
            </button>
          </div>
        )}

        {/* FLOATING TOOLS */}
        {selectedItem && (
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20 bg-black p-4 rounded-md shadow-2xl flex flex-col items-center gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={handleUndo}
                disabled={!canUndo}
                className={`px-3 py-2 text-[10px] font-black transition-all border ${canUndo ? 'border-white text-white hover:bg-white/15' : 'border-gray-700 text-gray-500 cursor-not-allowed'} rounded-sm`}
              >
                UNDO
              </button>
              <button
                onClick={handleRedo}
                disabled={!canRedo}
                className={`px-3 py-2 text-[10px] font-black transition-all border ${canRedo ? 'border-white text-white hover:bg-white/15' : 'border-gray-700 text-gray-500 cursor-not-allowed'} rounded-sm`}
              >
                REDO
              </button>
              <button
                onClick={() => setViewMode('3d')}
                className={`px-3 py-2 text-[10px] font-black transition-all border ${viewMode === '3d' ? 'border-white text-white hover:bg-white/15' : 'border-gray-700 text-gray-500 cursor-pointer'} rounded-sm`}
              >
                3D
              </button>
              <button
                onClick={() => setViewMode('2d')}
                className={`px-3 py-2 text-[10px] font-black transition-all border ${viewMode === '2d' ? 'border-white text-white hover:bg-white/15' : 'border-gray-700 text-gray-500 cursor-pointer'} rounded-sm`}
              >
                2D
              </button>
            </div>

            <div className="flex items-center gap-1">
              <button onClick={() => setTransformMode('translate')} className={`px-5 py-2 text-[10px] font-black rounded-sm transition-all ${transformMode === 'translate' ? 'bg-white text-black' : 'border border-gray-600 text-gray-300 hover:bg-white/10'}`}>MOVE</button>
              <button onClick={() => setTransformMode('rotate')} className={`px-5 py-2 text-[10px] font-black rounded-sm transition-all ${transformMode === 'rotate' ? 'bg-white text-black' : 'border border-gray-600 text-gray-300 hover:bg-white/10'}`}>ROTATE</button>

              <div className="flex items-center gap-2">
                <label className="text-[10px] text-white">Color</label>
                <input
                  type="color"
                  value={selectedSceneItem.color ?? '#ffffff'}
                  onChange={(e) => updateSelectedItem({ color: e.target.value })}
                  className="w-8 h-8 p-0 border border-white rounded-sm"
                />
              </div>
              </div>
            </div>
          )}

        {/* 3D CANVAS */}
        <div className={`absolute inset-0 z-0 bg-[#f1f5f9] ${showChrome ? 'pl-80 pr-72' : ''}`}>
          {!isEmbedded && (
            <div className="fixed top-4 left-4 z-[90]">
              <button
                onClick={() => (onBack ? onBack() : router.back())}
                className="px-4 py-2 bg-black text-white text-xs font-bold rounded-lg shadow-2xl border border-white/20 hover:bg-black/90"
              >
                ←
              </button>
            </div>
          )}
          <Canvas 
            key={viewMode}
            ref={canvasRef}
            gl={{ preserveDrawingBuffer: true, antialias: true }} 
            shadows 
            orthographic={viewMode === '2d'}
            camera={
              viewMode === '3d'
                ? { position: [10, 10, 10], fov: 45, far: 2000 }
                : { position: [0, 22, 0], zoom: 40, near: 0.1, far: 2000, up: [0, 0, -1] }
            }
            onPointerMissed={() => setSelectedItem(null)}
            onCreated={() => setIsCanvasLoading(false)}
          >
            {isCanvasLoading && (
              <Html style={{ position: 'absolute', bottom: 16, right: 16, pointerEvents: 'none' }}>
                <LoadingLogo />
              </Html>
            )}
            <Suspense fallback={null}>
              <SceneCamera roomWidth={roomWidth} roomLength={roomLength} wallHeight={wallHeight} orbitRef={orbitRef} viewMode={viewMode} />
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
                  color={item.color}
                  onUpdatePosition={(newPos) => {
                    const nextScene = sceneItems.map(i => i.uniqueId === item.uniqueId ? { ...i, position: newPos } : i);
                    setSceneItems(nextScene);
                    pushHistory(getSnapshot({ sceneItems: nextScene }));
                  }}
                />
              ))}

            </Suspense>

            <ContactShadows position={[0,0,0]} opacity={0.4} scale={500} blur={2.5} far={20} />
            <OrbitControls
              ref={orbitRef}
              makeDefault
              enabled={orbitEnabled}
              minDistance={2}
              maxDistance={Infinity}
              maxPolarAngle={viewMode === '2d' ? Math.PI / 2 : Math.PI / 2.1}
              minPolarAngle={viewMode === '2d' ? Math.PI / 2 : 0}
              enableRotate={viewMode === '3d'}
              enablePan={true}
              enableZoom={true}
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
}
