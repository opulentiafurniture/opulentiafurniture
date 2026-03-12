"use client";

import React, { Suspense, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Stage, useGLTF, ContactShadows, TransformControls } from '@react-three/drei';
import { Object3D } from 'three';
import Navbar from "../component/navbar";
import Footer from "../component/footer";

/** * TYPES */
interface FurnitureProps {
  url: string;
  position: [number, number, number];
  mode: 'translate' | 'rotate' | 'scale';
  isSelected: boolean;
  onSelect: () => void;
}

/** * COMPONENTS */
function Furniture({ url, position, mode, isSelected, onSelect }: FurnitureProps) {
  const { scene } = useGLTF(url); 
  
  // FIX: Use React State instead of useRef. This forces TransformControls to wait 
  // until the 3D object is fully mounted before trying to attach the movement arrows.
  const [mesh, setMesh] = useState<Object3D | null>(null);

  // Clone the scene so we can spawn multiple of the SAME item independently
  const clonedScene = React.useMemo(() => scene.clone(), [scene]);

  return (
    <group onClick={(e) => { e.stopPropagation(); onSelect(); }}>
      {/* Only render TransformControls if BOTH isSelected is true AND the mesh exists */}
      {isSelected && mesh ? (
        <TransformControls object={mesh} mode={mode} />
      ) : null}
      
      {/* Pass setMesh directly to the ref */}
      <primitive ref={setMesh} object={clonedScene} position={position} castShadow />
    </group>
  );
}

const VisualizationPage = () => {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('build'); 

  // --- Transform Tool & Scene State ---
  const [transformMode, setTransformMode] = useState<'translate' | 'rotate'>('translate');
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [sceneItems, setSceneItems] = useState<any[]>([]); 

  // --- Catalog State ---
  const [activeCategory, setActiveCategory] = useState('living');

  // --- Room Configuration State ---
  const [roomShape, setRoomShape] = useState('rectangle');
  const [roomWidth, setRoomWidth] = useState(10);
  const [roomLength, setRoomLength] = useState(10);
  const [wallHeight, setWallHeight] = useState(4.5); 
  const [wallColor, setWallColor] = useState('#f8fafc'); 
  const [floorColor, setFloorColor] = useState('#d4b895'); 

  const halfWall = wallHeight / 2;
  const floorY = -halfWall + 0.01; 

  // --- Data Dictionaries ---
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
    { id: 'living', label: 'Living Room' },
    { id: 'dining', label: 'Dining Room' },
    { id: 'bedroom', label: 'Bedroom' },
    { id: 'decoration', label: 'Decoration' }
  ];

  const furnitureCatalog: Record<string, any[]> = {
    living: [
      { id: 'lv1', name: 'Classic Oak Chair', price: 'LKR 45,000', url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Duck/glTF-Binary/Duck.glb' },
      { id: 'lv2', name: 'Velvet Sofa', price: 'LKR 245,000', url: '/models/Chair.glb' },
      { id: 'lv3', name: 'Glass Coffee Table', price: 'LKR 85,000', url: '/models/Chair.glb' }
    ],
    dining: [
      { id: 'dn1', name: 'Mahogany Dining Table', price: 'LKR 150,000', url: '/models/Chair.glb' },
      { id: 'dn2', name: 'Upholstered Dining Chair', price: 'LKR 35,000', url: '/models/Chair.glb' }
    ],
    bedroom: [
      { id: 'bd1', name: 'King Size Bed', price: 'LKR 320,000', url: '/models/Chair.glb' },
      { id: 'bd2', name: 'Nightstand', price: 'LKR 25,000', url: '/models/Chair.glb' },
      { id: 'bd3', name: 'Wardrobe', price: 'LKR 180,000', url: '/models/Chair.glb' }
    ],
    decoration: [
      { id: 'dc1', name: 'Floor Lamp', price: 'LKR 15,000', url: '/models/Chair.glb' },
      { id: 'dc2', name: 'Potted Plant', price: 'LKR 8,000', url: '/models/Chair.glb' },
      { id: 'dc3', name: 'Persian Rug', price: 'LKR 120,000', url: '/models/Chair.glb' }
    ]
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLayoutSelect = (layout: any) => {
    setRoomShape(layout.id);
    setRoomWidth(layout.w);
    setRoomLength(layout.l);
  };

  const handleAddItemToScene = (item: any) => {
    const newItem = {
      ...item,
      uniqueId: `${item.id}-${Date.now()}`, 
      position: [0, floorY + 0.1, 0] 
    };
    setSceneItems([...sceneItems, newItem]);
    setSelectedItem(newItem.uniqueId); 
  };

  const handleCanvasClick = () => {
    setSelectedItem(null);
  };

  const handleClearRoom = () => {
    if (confirm("Are you sure you want to remove all furniture from the room?")) {
      setSceneItems([]);
      setSelectedItem(null);
    }
  };

  if (!mounted) return <div className="h-screen w-screen flex items-center justify-center bg-gray-50 text-gray-500">Loading Opulentia Engine...</div>;

  return (
    <div className="flex flex-col min-h-screen w-full bg-gray-100 text-gray-800 font-sans overflow-x-hidden">
      
      {/* 1. HEADER AREA */}
      <Navbar />
      <div className="w-full h-14 bg-white border-b shadow-sm flex items-center justify-between px-6 z-20 shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold tracking-tight text-gray-900">OPULENTIA</h1>
          <span className="text-xs font-semibold bg-gray-100 text-gray-500 px-2 py-1 rounded">PRO</span>
        </div>
        <button className="bg-black hover:bg-gray-800 text-white text-sm font-medium px-5 py-2 rounded-md shadow-md transition-all">
          Save Project
        </button>
      </div>

      {/* 2. MAIN WORKSPACE */}
      <div className="relative w-full h-[1000px] border-b border-gray-200 overflow-hidden">
        
        {/* LEFT SIDEBAR */}
        <div className="absolute top-0 left-0 w-72 h-full bg-white border-r shadow-lg z-10 flex flex-col">
          <div className="flex border-b text-sm font-medium">
            <button onClick={() => setActiveTab('build')} className={`flex-1 py-3 text-center ${activeTab === 'build' ? 'border-b-2 border-black text-black' : 'text-gray-500 hover:bg-gray-50'}`}>Build</button>
            <button onClick={() => setActiveTab('furnish')} className={`flex-1 py-3 text-center ${activeTab === 'furnish' ? 'border-b-2 border-black text-black' : 'text-gray-500 hover:bg-gray-50'}`}>Furnish</button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            
            {/* BUILD TAB */}
            {activeTab === 'build' && (
               <div className="space-y-6 animate-fadeIn pb-10">
                 <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Room Layout</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {roomLayouts.map((layout) => (
                      <button key={layout.id} onClick={() => handleLayoutSelect(layout)} className={`flex flex-col items-center justify-center p-2 border rounded-md transition ${roomShape === layout.id ? 'border-black bg-gray-50 shadow-sm' : 'hover:border-gray-400'}`}>
                        <svg viewBox="0 0 24 24" className={`w-6 h-6 mb-1 ${roomShape === layout.id ? 'fill-black' : 'fill-gray-400'}`}><path d={layout.icon} /></svg>
                        <span className="text-[10px] font-medium">{layout.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Dimensions (Meters)</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center text-sm mb-2">
                        <span className="text-gray-600">Width</span>
                        <div className="flex items-center gap-1">
                          <input type="number" min="2" max="30" step="0.5" value={roomWidth} onChange={(e) => setRoomWidth(Math.min(Math.max(Number(e.target.value), 2), 30))} className="w-16 p-1 text-right border rounded bg-gray-50 font-medium focus:ring-black focus:border-black" />
                          <span className="text-gray-400 text-xs">m</span>
                        </div>
                      </div>
                      <input type="range" min="2" max="30" step="0.5" value={roomWidth} onChange={(e) => setRoomWidth(Number(e.target.value))} className="w-full accent-black" />
                    </div>
                    <div>
                      <div className="flex justify-between items-center text-sm mb-2">
                        <span className="text-gray-600">Length</span>
                        <div className="flex items-center gap-1">
                          <input type="number" min="2" max="30" step="0.5" value={roomLength} onChange={(e) => setRoomLength(Math.min(Math.max(Number(e.target.value), 2), 30))} className="w-16 p-1 text-right border rounded bg-gray-50 font-medium focus:ring-black focus:border-black" />
                          <span className="text-gray-400 text-xs">m</span>
                        </div>
                      </div>
                      <input type="range" min="2" max="30" step="0.5" value={roomLength} onChange={(e) => setRoomLength(Number(e.target.value))} className="w-full accent-black" />
                    </div>
                    <div>
                      <div className="flex justify-between items-center text-sm mb-2">
                        <span className="text-gray-600">Wall Height</span>
                        <div className="flex items-center gap-1">
                          <input type="number" min="2" max="10" step="0.5" value={wallHeight} onChange={(e) => setWallHeight(Math.min(Math.max(Number(e.target.value), 2), 10))} className="w-16 p-1 text-right border rounded bg-gray-50 font-medium focus:ring-black focus:border-black" />
                          <span className="text-gray-400 text-xs">m</span>
                        </div>
                      </div>
                      <input type="range" min="2" max="10" step="0.5" value={wallHeight} onChange={(e) => setWallHeight(Number(e.target.value))} className="w-full accent-black" />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Wall Paint</h3>
                  <div className="flex items-center gap-3 bg-gray-50 p-2 border rounded-md">
                    <input type="color" value={wallColor} onChange={(e) => setWallColor(e.target.value)} className="w-10 h-10 p-0 border-0 rounded cursor-pointer" />
                    <div className="flex flex-col"><span className="text-sm font-medium">Custom Color</span><span className="text-xs text-gray-500 uppercase">{wallColor}</span></div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Floor Material</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {floorMaterials.map((mat) => (
                      <button key={mat.name} onClick={() => setFloorColor(mat.hex)} className={`flex flex-col items-center p-2 border rounded-md transition ${floorColor === mat.hex ? 'border-black bg-gray-50 shadow-sm' : 'hover:border-gray-300'}`}>
                        <div className="w-full h-6 rounded mb-1 border shadow-inner" style={{ backgroundColor: mat.hex }}></div>
                        <span className="text-[10px] text-center font-medium">{mat.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
               </div>
            )}

            {/* FURNISH TAB */}
            {activeTab === 'furnish' && (
              <div className="animate-fadeIn flex flex-col h-full">
                
                <div className="flex gap-2 overflow-x-auto pb-4 hide-scrollbar">
                  {catalogCategories.map(cat => (
                    <button 
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={`whitespace-nowrap px-3 py-1.5 text-xs font-medium rounded-full border transition ${activeCategory === cat.id ? 'bg-black text-white border-black' : 'bg-white text-gray-600 hover:bg-gray-50 border-gray-200'}`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                <div className="space-y-3 pb-10">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                    {catalogCategories.find(c => c.id === activeCategory)?.label} Catalog
                  </h3>
                  
                  {furnitureCatalog[activeCategory].map((item) => (
                    <div 
                      key={item.id} 
                      onClick={() => handleAddItemToScene(item)}
                      className="group border rounded-lg p-2 hover:border-black cursor-pointer bg-white transition flex flex-col items-center shadow-sm hover:shadow"
                    >
                      <div className="w-full h-24 bg-gray-50 rounded mb-2 flex flex-col items-center justify-center text-gray-400 group-hover:bg-gray-100">
                        <span className="text-2xl mb-1">+</span>
                        <span className="text-[10px] uppercase font-bold tracking-wider">Add to Room</span>
                      </div>
                      <p className="text-sm font-medium w-full text-left text-gray-800">{item.name}</p>
                      <p className="text-xs text-gray-500 w-full text-left">{item.price}</p>
                    </div>
                  ))}
                </div>

              </div>
            )}
          </div>
        </div>

        {/* RIGHT SIDEBAR */}
        <div className="absolute top-0 right-0 w-64 h-full bg-white border-l shadow-lg z-10 p-5 flex flex-col">
          <h2 className="text-lg font-bold mb-4 border-b pb-2">Properties</h2>
          {selectedItem ? (
             <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg mb-4">
                <p className="text-sm text-blue-800 font-medium mb-1">Item Selected</p>
                <p className="text-xs text-blue-600 mb-3">Use the canvas tools to move or rotate this object.</p>
                <button 
                  onClick={() => {
                    setSceneItems(sceneItems.filter(i => i.uniqueId !== selectedItem));
                    setSelectedItem(null);
                  }}
                  className="w-full py-1.5 bg-red-100 text-red-700 hover:bg-red-200 text-xs font-bold rounded transition"
                >
                  Delete Item
                </button>
             </div>
          ) : (
             <p className="text-sm text-gray-400 text-center mt-4 mb-4">Click an item in the 3D view to select it.</p>
          )}

          <div className="mt-auto border-t pt-4">
            <button 
              onClick={handleClearRoom}
              className="w-full py-2 bg-gray-100 hover:bg-red-50 hover:text-red-600 hover:border-red-200 border border-gray-200 text-gray-600 text-sm font-bold rounded transition"
            >
              Clear Entire Room
            </button>
          </div>
        </div>

        {/* FLOATING CANVAS TOOLBAR */}
        {selectedItem && (
          <div className="absolute top-4 right-[270px] z-10 bg-white rounded-lg shadow-md border flex overflow-hidden">
            <button onClick={() => setTransformMode('translate')} className={`px-4 py-2 text-sm font-medium transition ${transformMode === 'translate' ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-100'}`}>Move</button>
            <button onClick={() => setTransformMode('rotate')} className={`px-4 py-2 text-sm font-medium border-l transition ${transformMode === 'rotate' ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-100'}`}>Rotate</button>
          </div>
        )}

        {/* 3D VIEWPORT (CANVAS) */}
        <div className="absolute inset-0 z-0 pl-72 pr-64">
          <Canvas shadows={true} camera={{ position: [5, 12, 15], fov: 45 }} onPointerMissed={handleCanvasClick}>
            <Suspense fallback={null}>
              <Stage environment="city" intensity={0.6}>
                <Grid infiniteGrid fadeDistance={40} cellColor="#e5e7eb" sectionColor="#9ca3af" sectionSize={5} cellThickness={1} />
                
                <group position={[0, halfWall, 0]}>
                  {['square', 'rectangle', 'narrow', 'studio'].includes(roomShape) && (
                    <group>
                      <mesh receiveShadow><boxGeometry args={[roomWidth, wallHeight, roomLength]} /><meshStandardMaterial color={wallColor} side={1} transparent opacity={0.25} /></mesh>
                      <mesh receiveShadow position={[0, floorY, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[roomWidth, roomLength]} /><meshStandardMaterial color={floorColor} /></mesh>
                    </group>
                  )}
                  {roomShape === 'l-shape' && (
                    <group>
                      <mesh receiveShadow position={[0, 0, -roomLength/4]}><boxGeometry args={[roomWidth, wallHeight, roomLength/2]} /><meshStandardMaterial color={wallColor} side={1} transparent opacity={0.25} /></mesh>
                      <mesh receiveShadow position={[0, floorY, -roomLength/4]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[roomWidth, roomLength/2]} /><meshStandardMaterial color={floorColor} /></mesh>
                      <mesh receiveShadow position={[-roomWidth/4, 0, roomLength/4]}><boxGeometry args={[roomWidth/2, wallHeight, roomLength/2]} /><meshStandardMaterial color={wallColor} side={1} transparent opacity={0.25} /></mesh>
                      <mesh receiveShadow position={[-roomWidth/4, floorY, roomLength/4]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[roomWidth/2, roomLength/2]} /><meshStandardMaterial color={floorColor} /></mesh>
                    </group>
                  )}
                  {roomShape === 't-shape' && (
                    <group>
                      <mesh receiveShadow position={[0, 0, -roomLength/4]}><boxGeometry args={[roomWidth, wallHeight, roomLength/2]} /><meshStandardMaterial color={wallColor} side={1} transparent opacity={0.25} /></mesh>
                      <mesh receiveShadow position={[0, floorY, -roomLength/4]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[roomWidth, roomLength/2]} /><meshStandardMaterial color={floorColor} /></mesh>
                      <mesh receiveShadow position={[0, 0, roomLength/4]}><boxGeometry args={[roomWidth/3, wallHeight, roomLength/2]} /><meshStandardMaterial color={wallColor} side={1} transparent opacity={0.25} /></mesh>
                      <mesh receiveShadow position={[0, floorY, roomLength/4]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[roomWidth/3, roomLength/2]} /><meshStandardMaterial color={floorColor} /></mesh>
                    </group>
                  )}
                </group>

                {sceneItems.map((item) => (
                  <Furniture 
                    key={item.uniqueId}
                    url={item.url} 
                    position={item.position} 
                    mode={transformMode}
                    isSelected={selectedItem === item.uniqueId}
                    onSelect={() => setSelectedItem(item.uniqueId)}
                  />
                ))}

              </Stage>
            </Suspense>

            <ContactShadows position={[0, -0.01, 0]} opacity={0.5} scale={20} blur={2} far={4} />
            <OrbitControls makeDefault={!selectedItem} minDistance={3} maxDistance={35} minPolarAngle={0} maxPolarAngle={Math.PI / 2} enableDamping />
          </Canvas>
        </div>
      </div>

      <Footer />
      
    </div>
  );
};

export default VisualizationPage;