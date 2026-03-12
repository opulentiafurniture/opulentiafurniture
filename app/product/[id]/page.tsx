"use client";

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Star, ShoppingCart, Heart, Shield, Truck, RotateCcw, ChevronRight, Box, Maximize2, Trash2, Layout, Plus, Palette } from 'lucide-react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Environment, useGLTF, ContactShadows, TransformControls } from '@react-three/drei';
import { Object3D, Box3 } from 'three';
import Navbar from "../../component/navbar";
import Footer from "../../component/footer";
import { cn } from "@/lib/utils";

// --- MOCK DATA & CONFIG ---
const ALL_PRODUCTS = [
  { id: 1, name: "Royal Velvet Sofa", price: "Rs 89,990", oldPrice: "Rs 99,990", img: "/sofa.jpg", rating: 5, category: "Sofas", modelUrl: "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/SheenChair/glTF-Binary/SheenChair.glb", desc: "Experience the pinnacle of luxury with our Royal Velvet Sofa." },
  { id: 2, name: "Modern Bookshelf", price: "Rs 42,500", oldPrice: "Rs 49,900", img: "/bookshelf.jpg", rating: 4, category: "Chairs", modelUrl: "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Duck/glTF-Binary/Duck.glb", desc: "Sleek lines and robust construction define this modern masterpiece." },
];

const relatedProducts = ALL_PRODUCTS;

const FLOOR_MATERIALS = [
  { name: 'Light Oak', hex: '#d4b895' }, { name: 'Dark Walnut', hex: '#4a3018' },
  { name: 'Grey Ash', hex: '#9ca3af' }, { name: 'White Marble', hex: '#f8fafc' },
];

// --- 3D FURNITURE COMPONENT ---
function Furniture({ url, position, mode, isSelected, onSelect, onUpdatePosition, setOrbitEnabled, floorY }: any) {
  const gltf = useGLTF(url) as any;
  const scene = gltf.scene;
  const [mesh, setMesh] = useState<Object3D | null>(null);
  const controlsRef = useRef<any>(null);

  const clonedScene = React.useMemo(() => {
    const clone = scene.clone();
    const box = new Box3().setFromObject(clone);
    clone.children.forEach((child: Object3D) => { child.position.y -= box.min.y; });
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
      {isSelected && mesh && (
        <TransformControls 
          ref={controlsRef} object={mesh} mode={mode} showY={false}
          onMouseUp={() => mesh && onUpdatePosition([mesh.position.x, floorY, mesh.position.z])}
        />
      )}
      <primitive 
        ref={setMesh} object={clonedScene} position={[position[0], floorY, position[2]]} 
        onClick={(e: any) => { e.stopPropagation(); onSelect(); }} castShadow 
      />
    </group>
  );
}

export default function ProductDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  
  // Design States
  const [product, setProduct] = useState<any>(null);
  const [sceneItems, setSceneItems] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [transformMode, setTransformMode] = useState<'translate' | 'rotate'>('translate');
  const [orbitEnabled, setOrbitEnabled] = useState(true);
  
  // Room Config
  const [roomWidth, setRoomWidth] = useState(8);
  const [roomLength, setRoomLength] = useState(8);
  const [wallHeight, setWallHeight] = useState(3.5);
  const [wallColor, setWallColor] = useState('#f8fafc');
  const [floorColor, setFloorColor] = useState('#d4b895');
  const floorY = -wallHeight / 2 + 0.01;

  useEffect(() => {
    const found = ALL_PRODUCTS.find(p => p.id === Number(id));
    if (found) {
      setProduct(found);
      setSceneItems([{
        uniqueId: `init-${found.id}`,
        url: found.modelUrl,
        position: [0, floorY, 0],
        name: found.name
      }]);
    }
  }, [id, floorY]);

  const handleAddItem = (item: any) => {
    const newItem = {
      uniqueId: `${item.id}-${Date.now()}`,
      url: item.modelUrl || "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Box/glTF-Binary/Box.glb",
      position: [Math.random() * 2, floorY, Math.random() * 2],
      name: item.name
    };
    setSceneItems([...sceneItems, newItem]);
    setSelectedItem(newItem.uniqueId);
  };

  if (!product) return <div className="h-screen w-full flex items-center justify-center font-bold text-gray-400">Loading Opulentia...</div>;

  return (
    
    <div className="min-h-screen bg-white text-[#0A192F]">
      <Navbar />

      {/* BREADCRUMBS */}
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-2 text-[10px] uppercase tracking-widest text-gray-400">
        <span className="cursor-pointer hover:text-black" onClick={() => router.push('/')}>Home</span>
        <ChevronRight size={10} />
        <span className="text-black font-bold">{product.name}</span>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-2 gap-16 border-b border-gray-100">
        <div className="space-y-4">
          <div className="aspect-square bg-[#F9F9F9] rounded-sm overflow-hidden flex items-center justify-center p-12 border border-gray-100">
            <img src={product.img} alt={product.name} className="max-h-full max-w-full object-contain" />
          </div>
        </div>

        <div className="space-y-8">
          <div>
            <div className="flex gap-1 mb-2">
              {[...Array(5)].map((_, i) => <Star key={i} size={14} className="fill-[#D4AF37] text-[#D4AF37]" />)}
            </div>
            <h1 className="text-4xl font-light tracking-tight uppercase mb-2">{product.name}</h1>
            <div className="flex items-end gap-4 mb-6">
              <span className="text-3xl font-black text-[#D4AF37]">{product.price}</span>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed border-t border-gray-100 pt-6">{product.desc}</p>
          </div>

          <div className="flex gap-4 pt-6 border-t border-gray-100">
            <button className="flex-1 bg-[#0A192F] text-white py-5 rounded-sm text-xs font-bold uppercase hover:bg-[#D4AF37] transition-all">Add to Cart</button>
            <button className="w-16 border border-gray-200 flex items-center justify-center hover:bg-gray-50"><Heart size={20} /></button>
          </div>
        </div>
      </main>
      
      {/* --- OPULENTIA INTEGRATED STUDIO --- */}
      <section className="max-w-7xl mx-auto px-6 py-20 bg-gray-50/50">
        <div className="mb-10 flex justify-between items-end">
          <h2 className="text-2xl font-bold uppercase tracking-tight">Opulentia Studio <span className="text-[10px] bg-black text-white px-2 py-0.5 ml-2 rounded-full">v2.0</span></h2>
          <button onClick={() => router.push('/visualization')} className="text-[10px] font-bold uppercase border-b border-[#D4AF37] hover:text-[#D4AF37]">Enter Pro Designer</button>
        </div>

        <div className="flex flex-col lg:flex-row h-[750px] bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-2xl relative">
          
          {/* Sidebar Left: Room & Wall Settings */}
          <div className="w-full lg:w-72 border-r bg-white flex flex-col p-6 z-10 overflow-y-auto">
            <h3 className="text-[10px] font-black uppercase text-gray-400 mb-6 flex items-center gap-2"><Layout size={12}/> Room Settings</h3>
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between"><label className="text-[9px] font-bold uppercase">Width</label><span className="text-[9px] font-mono">{roomWidth}m</span></div>
                <input type="range" min="3" max="25" step="0.5" value={roomWidth} onChange={(e) => setRoomWidth(Number(e.target.value))} className="w-full accent-black h-1" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between"><label className="text-[9px] font-bold uppercase">Wall Height</label><span className="text-[9px] font-mono">{wallHeight}m</span></div>
                <input type="range" min="2" max="10" step="0.1" value={wallHeight} onChange={(e) => setWallHeight(Number(e.target.value))} className="w-full accent-black h-1" />
              </div>
              <div className="pt-4 border-t">
                <label className="text-[9px] font-bold uppercase mb-3 block">Wall Color</label>
                <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-lg border">
                  <input type="color" value={wallColor} onChange={(e) => setWallColor(e.target.value)} className="w-8 h-8 rounded border-none cursor-pointer" />
                  <span className="text-[10px] font-mono text-gray-500 uppercase">{wallColor}</span>
                </div>
              </div>
              <div className="pt-4 border-t">
                <label className="text-[9px] font-bold uppercase mb-3 block">Floor Material</label>
                <div className="grid grid-cols-4 gap-2">
                  {FLOOR_MATERIALS.map(m => (
                    <button key={m.name} onClick={() => setFloorColor(m.hex)} className={cn("aspect-square rounded-md border-2", floorColor === m.hex ? "border-black" : "border-transparent")} style={{background: m.hex}} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Center: 3D Viewport (upgraded) */}
          <div className="flex-1 relative bg-[#f1f5f9]">
            {/* Floating transform controls */}
            {selectedItem && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 bg-black text-white p-1 rounded-full flex gap-1 shadow-2xl">
                <button
                  onClick={() => setTransformMode('translate')}
                  className={cn(
                    "px-4 py-1.5 text-[9px] font-bold rounded-full transition-all",
                    transformMode === 'translate' ? "bg-white text-black" : "hover:text-[#D4AF37]"
                  )}
                >
                  MOVE
                </button>
                <button
                  onClick={() => setTransformMode('rotate')}
                  className={cn(
                    "px-4 py-1.5 text-[9px] font-bold rounded-full transition-all",
                    transformMode === 'rotate' ? "bg-white text-black" : "hover:text-[#D4AF37]"
                  )}
                >
                  ROTATE
                </button>
              </div>
            )}

            <Canvas
              shadows
              camera={{ position: [10, 10, 10], fov: 40 }}
              gl={{ preserveDrawingBuffer: true }}
              onPointerMissed={() => setSelectedItem(null)}
            >
              <Suspense fallback={null}>
                <ambientLight intensity={0.8} />
                <directionalLight position={[20, 30, 20]} intensity={1.6} castShadow />
                <Environment preset="city" />
                <Grid infiniteGrid fadeDistance={400} sectionSize={1} sectionColor="#e2e8f0" cellColor="#ffffff" cellThickness={0.5} />

                <group position={[0, wallHeight / 2, 0]}>
                  <mesh receiveShadow>
                    <boxGeometry args={[roomWidth, wallHeight, roomLength]} />
                    <meshStandardMaterial color={wallColor} side={1} transparent opacity={0.12} depthWrite={false} />
                  </mesh>
                  <mesh receiveShadow position={[0, floorY, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                    <planeGeometry args={[roomWidth, roomLength]} />
                    <meshStandardMaterial color={floorColor} roughness={0.8} />
                  </mesh>
                </group>

                {sceneItems.map((item) => (
                  <Furniture
                    key={item.uniqueId}
                    url={item.url}
                    // always render furniture slightly above the floor to avoid z-fighting / sinking
                    position={[item.position[0], item.position[1], item.position[2]]}
                    mode={transformMode}
                    isSelected={selectedItem === item.uniqueId}
                    onSelect={() => setSelectedItem(item.uniqueId)}
                    setOrbitEnabled={setOrbitEnabled}
                    // pass a small offset so the object's bottom stays above the floor
                    floorY={floorY + 0.01}
                    onUpdatePosition={(newPos: any) => {
                      // make sure Y is always fixed to the "above floor" value
                      const fixedY = floorY + 0.01;
                      setSceneItems(prev => prev.map(i => i.uniqueId === item.uniqueId ? { ...i, position: [newPos[0], fixedY, newPos[2]] } : i));
                    }}
                  />
                ))}
              </Suspense>

              {/* Keep shadows at true floor level but objects are offset slightly above */}
              <ContactShadows position={[0, floorY, 0]} opacity={0.4} scale={30} blur={2.5} />
              <OrbitControls makeDefault enabled={orbitEnabled} minDistance={2} maxDistance={30} maxPolarAngle={Math.PI / 2.1} />
            </Canvas>
          </div>

          {/* Sidebar Right: Asset Browser & Selection (upgraded) */}
          <div className="w-full lg:w-72 border-l bg-white flex flex-col p-6 z-10 overflow-y-auto">
            <h3 className="text-[10px] font-black uppercase text-gray-400 mb-6 flex items-center gap-2"><Plus size={12}/> Catalog Items</h3>

            <div className="space-y-4 mb-10">
              {ALL_PRODUCTS.map(item => (
                <div key={item.id} onClick={() => handleAddItem(item)} className="p-3 border rounded-xl hover:border-black cursor-pointer flex gap-3 items-center group transition-all">
                  <div className="w-10 h-10 bg-gray-50 rounded flex items-center justify-center">
                    <img src={item.img} className="max-h-full" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-bold truncate">{item.name}</p>
                    <p className="text-[9px] text-[#D4AF37] font-black">{item.price}</p>
                  </div>
                  <Plus size={14} className="text-gray-300 group-hover:text-black"/>
                </div>
              ))}
            </div>

            {selectedItem && (
              <div className="mt-auto pt-6 border-t">
                <h3 className="text-[10px] font-black uppercase text-gray-400 mb-4 flex items-center gap-2"><Palette size={12}/> Selection Properties</h3>
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-[10px] font-bold truncate">{sceneItems.find(i => i.uniqueId === selectedItem)?.name}</p>
                  <button
                    onClick={() => { setSceneItems(sceneItems.filter(i => i.uniqueId !== selectedItem)); setSelectedItem(null); }}
                    className="w-full mt-4 py-2.5 bg-red-50 text-red-500 text-[9px] font-black rounded-lg border border-red-100 flex items-center justify-center gap-2 hover:bg-red-500 hover:text-white transition-all"
                  >
                    <Trash2 size={12}/> REMOVE ITEM
                  </button>
                </div>
              </div>
            )}

            
                  </div>
                </div>
      </section>
        {/* RELATED PRODUCTS */}
      <section className="max-w-7xl mx-auto px-6 py-20 border-t border-gray-100">
        <div className="mb-12 text-center">
          <h2 className="text-2xl font-bold uppercase tracking-tight mb-2">Complete the Look</h2>
          <p className="text-[10px] text-gray-400 uppercase tracking-[0.4em]">Related Pieces You Might Love</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
          {relatedProducts.map((rel: any) => (
            <div key={rel.id} className="group cursor-pointer" onClick={() => router.push(`/product/${rel.id}`)}>
              <div className="aspect-square bg-[#F9F9F9] rounded-sm overflow-hidden mb-4 p-6 flex items-center justify-center border border-transparent group-hover:border-gray-200 transition-all">
                <img src={rel.img} alt={rel.name} className="max-h-full object-contain group-hover:scale-105 transition-transform" />
              </div>
              <h3 className="text-[11px] font-bold uppercase tracking-tight text-[#0A192F] truncate">{rel.name}</h3>
              <p className="text-[11px] font-black text-[#D4AF37] mt-1">{rel.price}</p>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
