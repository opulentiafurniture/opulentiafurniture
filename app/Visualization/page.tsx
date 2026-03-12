"use client";

import React, { Suspense, useEffect, useState, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Environment, useGLTF, ContactShadows, TransformControls } from '@react-three/drei';
import { Object3D, Box3, Vector3 } from 'three';
import Navbar from "../component/navbar";
import Footer from "../component/footer";

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
}

/** * COMPONENTS */
function Furniture({ url, position, mode, isSelected, onSelect, onUpdatePosition, setOrbitEnabled, floorY }: FurnitureProps) {
  const { scene } = useGLTF(url); 
  const [mesh, setMesh] = useState<Object3D | null>(null);
  const controlsRef = useRef<any>(null);

  const clonedScene = React.useMemo(() => {
    const clone = scene.clone();
    const box = new Box3().setFromObject(clone);
    clone.children.forEach((child) => {
      child.position.y -= box.min.y;
    });
    return clone;
  }, [scene]);

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    const handleDraggingChanged = (e: any) => setOrbitEnabled(!e.value);
    controls.addEventListener('dragging-changed', handleDraggingChanged);
    return () => controls.removeEventListener('dragging-changed', handleDraggingChanged);
  }, [setOrbitEnabled, controlsRef]);

  return (
    <group>
      {isSelected && mesh ? (
        <TransformControls 
          ref={controlsRef}
          object={mesh} 
          mode={mode} 
          showY={mode !== 'translate'} 
          translationSnap={0.1}
          rotationSnap={Math.PI / 8}
          onMouseUp={() => {
            if (mesh) {
              // Always lock to the CURRENT floorY
              onUpdatePosition([mesh.position.x, floorY, mesh.position.z]);
            }
          }}
        />
      ) : null}
      
      <primitive 
        ref={setMesh} 
        object={clonedScene} 
        position={[position[0], floorY, position[2]]} 
        onClick={(e: any) => { e.stopPropagation(); onSelect(); }} 
        castShadow 
      />
    </group>
  );
}

const VisualizationPage = () => {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('furnish'); 
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [transformMode, setTransformMode] = useState<'translate' | 'rotate'>('translate');
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [orbitEnabled, setOrbitEnabled] = useState(true);
  const [sceneItems, setSceneItems] = useState<any[]>([]); 
  const [activeCategory, setActiveCategory] = useState('living');

  const [roomShape, setRoomShape] = useState('rectangle');
  const [roomWidth, setRoomWidth] = useState(10);
  const [roomLength, setRoomLength] = useState(10);
  const [wallHeight, setWallHeight] = useState(4.5); 
  const [wallColor, setWallColor] = useState('#f8fafc'); 
  const [floorColor, setFloorColor] = useState('#d4b895'); 

  
  const roomLayouts = [
    { id: 'square', name: 'Square', icon: 'M4 4h16v16H4z', w: 10, l: 10 },
    { id: 'rectangle', name: 'Rectangle', icon: 'M2 6h20v12H2z', w: 14, l: 8 },
    { id: 'narrow', name: 'Narrow', icon: 'M6 2h12v20H6z', w: 6, l: 14 },
    { id: 'studio', name: 'Studio', icon: 'M2 2h20v20H2z', w: 16, l: 16 },
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
    { id: 'living', label: 'Living Room' }, { id: 'dining', label: 'Dining Room' },
    { id: 'bedroom', label: 'Bedroom' }, { id: 'decoration', label: 'Decoration' }
  ];

  const furnitureCatalog: Record<string, any[]> = {
    living: [
      { id: 'lv1', name: 'Classic Oak Chair', price: 'LKR 45,000', url: '/models/Chair.glb' },
      { id: 'lv2', name: 'Velvet Sofa', price: 'LKR 245,000', url: '/models/Chair.glb' },
    ],
    dining: [], bedroom: [], decoration: []
  };

  useEffect(() => { setMounted(true); }, []);

  const handleScreenshot = () => {
    if (canvasRef.current) {
      const link = document.createElement('a');
      link.setAttribute('download', `Opulentia-${Date.now()}.png`);
      link.setAttribute('href', canvasRef.current.toDataURL('image/png'));
      link.click();
    }
  };

  const handleAddItemToScene = (item: any) => {
    const newItem = { ...item, uniqueId: `${item.id}-${Date.now()}`, position: [0, 0, 0] };
    setSceneItems([...sceneItems, newItem]);
    setSelectedItem(newItem.uniqueId); 
  };

  if (!mounted) return null;

  return (
    <div className="flex flex-col min-h-screen w-full bg-[#f8fafc] text-gray-800 font-sans overflow-x-hidden">
      <Navbar />
      
      {/* HEADER */}
      <div className="w-full h-16 bg-white border-b border-gray-200 shadow-sm flex items-center justify-between px-8 z-20 shrink-0">
        <div className="flex gap-3">
            <button onClick={handleScreenshot} className="bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 text-[10px] font-black px-5 py-2 rounded-lg transition-all shadow-sm active:scale-95">SNAPSHOT</button>
            <button className="bg-black hover:bg-gray-800 text-white text-[10px] font-black px-6 py-2 rounded-lg shadow-md transition-all active:scale-95">SAVE Layout</button>
        </div>
      </div>

      <div className="relative w-full h-[1000px] overflow-hidden flex">
        
        {/* SIDEBAR */}
        <div className="absolute top-0 left-0 w-80 h-full bg-white/95 backdrop-blur-md border-r border-gray-200 z-10 flex flex-col shadow-2xl">
          <div className="flex p-3 border-b border-gray-100 gap-2">
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
                        <div className="flex justify-between items-center mb-1"><span className="text-[10px] font-bold text-gray-600 uppercase">Width</span><input type="number" value={roomWidth} onChange={(e) => setRoomWidth(Math.max(1, Number(e.target.value)))} className="w-20 p-1 border rounded text-right font-black text-xs outline-none focus:ring-1 ring-black" /></div>
                        <input type="range" min="1" max="1000" value={roomWidth} onChange={(e) => setRoomWidth(Number(e.target.value))} className="w-full accent-black h-1" />
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 shadow-sm">
                        <div className="flex justify-between items-center mb-1"><span className="text-[10px] font-bold text-gray-600 uppercase">Length</span><input type="number" value={roomLength} onChange={(e) => setRoomLength(Math.max(1, Number(e.target.value)))} className="w-20 p-1 border rounded text-right font-black text-xs outline-none focus:ring-1 ring-black" /></div>
                        <input type="range" min="1" max="1000" value={roomLength} onChange={(e) => setRoomLength(Number(e.target.value))} className="w-full accent-black h-1" />
                    </div>
                    {/* FIXED: Dynamic Wall Height Input */}
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 shadow-sm">
                        <div className="flex justify-between items-center mb-1"><span className="text-[10px] font-bold text-gray-600 uppercase">Wall Height</span><input type="number" value={wallHeight} onChange={(e) => setWallHeight(Math.max(1, Number(e.target.value)))} className="w-20 p-1 border rounded text-right font-black text-xs outline-none focus:ring-1 ring-black" /></div>
                        <input type="range" min="1" max="100" value={wallHeight} onChange={(e) => setWallHeight(Number(e.target.value))} className="w-full accent-black h-1" />
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
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {catalogCategories.map(cat => (
                    <button key={cat.id} onClick={() => setActiveCategory(cat.id)} className={`px-4 py-1.5 text-[10px] font-bold rounded-full border transition-all ${activeCategory === cat.id ? 'bg-black text-white border-black shadow-md' : 'bg-white text-gray-400'}`}>{cat.label}</button>
                  ))}
                </div>
                {furnitureCatalog[activeCategory]?.map((item) => (
                  <div key={item.id} onClick={() => handleAddItemToScene(item)} className="group bg-white border border-gray-100 rounded-2xl p-4 hover:border-black cursor-pointer shadow-sm flex justify-between items-center active:scale-95">
                    <span className="text-sm font-bold text-gray-700">{item.name}</span>
                    <span className="text-[10px] font-black text-gray-200 group-hover:text-black transition-colors">+ ADD</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="absolute top-0 right-0 w-72 h-full bg-white/95 border-l border-gray-200 z-10 p-6 flex flex-col shadow-2xl">
          <h2 className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] mb-6">Properties</h2>
          {selectedItem ? (
             <div className="space-y-4">
                <button onClick={() => {setSceneItems(sceneItems.filter(i => i.uniqueId !== selectedItem)); setSelectedItem(null);}} className="w-full py-3 bg-red-50 text-red-500 text-[10px] font-black rounded-xl border border-red-100 hover:bg-red-500 hover:text-white transition-all shadow-sm">DELETE ITEM</button>
             </div>
          ) : <div className="h-32 flex flex-col items-center justify-center border-2 border-dashed border-gray-100 rounded-2xl text-gray-300 text-[10px] font-bold">CLICK ITEM</div>}
          
          <button onClick={() => setSceneItems([])} className="mt-auto py-3 bg-white text-gray-400 text-[10px] font-bold rounded-xl border border-gray-200 hover:border-red-200 transition-all uppercase tracking-tighter">Clear Workspace</button>
        </div>

        {/* FLOATING TOOLS */}
        {selectedItem && (
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20 bg-black p-1.5 rounded-full shadow-2xl flex items-center gap-1">
            <button onClick={() => setTransformMode('translate')} className={`px-6 py-2 text-[10px] font-black rounded-full transition-all ${transformMode === 'translate' ? 'bg-white text-black' : 'text-gray-400'}`}>MOVE</button>
            <button onClick={() => setTransformMode('rotate')} className={`px-6 py-2 text-[10px] font-black rounded-full transition-all ${transformMode === 'rotate' ? 'bg-white text-black' : 'text-gray-400'}`}>ROTATE</button>
          </div>
        )}

        {/* 3D CANVAS */}
        <div className="absolute inset-0 z-0 pl-80 pr-72 bg-[#f1f5f9]">
          <Canvas 
            ref={canvasRef}
            gl={{ preserveDrawingBuffer: true, antialias: true }} 
            shadows 
            camera={{ position: [20, 20, 20], fov: 45, far: 100000 }} 
            onPointerMissed={() => setSelectedItem(null)}
          >
            <Suspense fallback={null}>
              <ambientLight intensity={0.8} />
              <directionalLight position={[20, 30, 20]} intensity={1.8} castShadow shadow-mapSize={[2048, 2048]} />
              <Environment preset="city" />

              <Grid infiniteGrid fadeDistance={400} sectionSize={1} sectionColor="#e2e8f0" cellColor="#ffffff" cellThickness={0.5} />
              
              <group position={[0, wallHeight / 2, 0]}>
                <mesh receiveShadow>
                    <boxGeometry args={[roomWidth, wallHeight, roomLength]} />
                    <meshStandardMaterial color={wallColor} side={1} transparent opacity={0.1} depthWrite={false} />
                </mesh>
                <mesh receiveShadow position={[0, -wallHeight / 2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                    <planeGeometry args={[roomWidth, roomLength]} />
                    <meshStandardMaterial color={floorColor} roughness={0.8} />
                </mesh>
              </group>

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
                  onUpdatePosition={(newPos) => {
                    setSceneItems(prev => prev.map(i => i.uniqueId === item.uniqueId ? { ...i, position: newPos } : i));
                  }}
                />
              ))}

            </Suspense>

            <ContactShadows position={[0,0,0]} opacity={0.4} scale={500} blur={2.5} far={20} />
            <OrbitControls makeDefault enabled={orbitEnabled} minDistance={2} maxDistance={Infinity} maxPolarAngle={Math.PI / 2.1} dampingFactor={0.05} enableDamping />
          </Canvas>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default VisualizationPage;