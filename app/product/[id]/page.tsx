"use client";

import React, { useState, useEffect, useRef, Suspense, useCallback } from 'react';
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
  { id: 1, name: "Royal King Bed", price: "Rs 129,990", oldPrice: "Rs 145,000", img: "/bedroom-bed.jpeg", rating: 5, category: "Beds", modelUrl: "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Box/glTF-Binary/Box.glb", desc: "A luxurious king bed with ornate headboard and rich upholstery." },
  { id: 2, name: "Luxury Wardrobe Unit", price: "Rs 159,900", oldPrice: "Rs 175,000", img: "/bedroom-wardrobe.jpeg", rating: 5, category: "Wardrobes", modelUrl: "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Box/glTF-Binary/Box.glb", desc: "Spacious wardrobe unit with elegant finishes and internal shelving." },
  { id: 3, name: "Elegant Dressing Table", price: "Rs 74,990", oldPrice: "Rs 84,000", img: "/bedroom-dresser.jpeg", rating: 4, category: "Dressers", modelUrl: "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Box/glTF-Binary/Box.glb", desc: "A compact dressing table with a sleek mirror and storage drawers." },
  { id: 4, name: "Grand Dining Table", price: "Rs 119,990", oldPrice: "Rs 134,990", img: "/dining-table.jpg", rating: 5, category: "Tables", modelUrl: "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Box/glTF-Binary/Box.glb", desc: "Large dining table crafted from solid wood for timeless gatherings." },
  { id: 5, name: "Oak Dining Chair", price: "Rs 68,500", oldPrice: "Rs 77,000", img: "/dining-chair.jpeg", rating: 4, category: "Chairs", modelUrl: "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Box/glTF-Binary/Box.glb", desc: "Comfortable oak dining chair with a classic silhouette." },
  { id: 6, name: "Luxury Pantry Cupboard", price: "Rs 84,900", oldPrice: "Rs 95,000", img: "/dining-cupboard.jpeg", rating: 5, category: "Storage", modelUrl: "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Box/glTF-Binary/Box.glb", desc: "Handsome pantry cupboard with ample storage and soft-close doors." },
  { id: 7, name: "Royal Velvet Sofa", price: "Rs 89,990", oldPrice: "Rs 99,990", img: "/sofa.jpg", rating: 5, category: "Sofas", modelUrl: "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Box/glTF-Binary/Box.glb", desc: "Sumptuous velvet sofa with deep seating for luxurious comfort." },
  { id: 8, name: "Modern Bookshelf", price: "Rs 42,500", oldPrice: "Rs 49,900", img: "/bookshelf.jpg", rating: 4, category: "Shelf", modelUrl: "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Box/glTF-Binary/Box.glb", desc: "Minimalist bookshelf perfect for styling your living space." },
  { id: 9, name: "Marble Coffee Table", price: "Rs 34,900", oldPrice: "Rs 41,000", img: "/coffee_table.jpeg", rating: 5, category: "Tables", modelUrl: "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Box/glTF-Binary/Box.glb", desc: "Elegant marble-top coffee table with sturdy metal base." }
];

const relatedProducts = ALL_PRODUCTS;

const floorMaterials = [
  { name: 'Light Oak', hex: '#d4b895' }, { name: 'Dark Walnut', hex: '#4a3018' },
  { name: 'Grey Ash', hex: '#9ca3af' }, { name: 'Cherry Wood', hex: '#7c2d12' },
  { name: 'White Marble', hex: '#f8fafc' }, { name: 'Dark Slate', hex: '#334155' },
  { name: 'Terracotta', hex: '#c53030' }, { name: 'Cream Carpet', hex: '#fef3c7' },
];

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
  const roomLayouts = [
    { id: 'square', name: 'Square', icon: 'M4 4h16v16H4z', w: 500, l: 500 },
    { id: 'rectangle', name: 'Rectangle', icon: 'M2 6h20v12H2z', w: 1000, l: 800 },
    { id: 'narrow', name: 'Narrow', icon: 'M6 2h12v20H6z', w: 600, l: 1400 },
    { id: 'studio', name: 'Studio', icon: 'M2 2h20v20H2z', w: 1600, l: 1600 },
    { id: 'l-shape', name: 'L-Shape', icon: 'M4 4h8v8h8v8H4z', w: 1200, l: 1200 },
    { id: 't-shape', name: 'T-Shape', icon: 'M2 4h20v6h-6v10H8V10H2z', w: 1400, l: 1400 },
  ];

  // floorMaterials moved to module scope above so it can be shared across components

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

  // End the VisualizationPage component (it was left open) so the following
  // component declarations remain at the module top level.
  return null;
};

// --- 3D FURNITURE COMPONENT ---
function Furniture({ url, position, mode, isSelected, onSelect, onUpdatePosition, setOrbitEnabled, floorY }: any) {
  const gltf = useGLTF(url) as any;
  const scene = gltf.scene;
  const groupRef = useRef<Object3D>(null);
  const [transformObject, setTransformObject] = useState<Object3D | null>(null);
  const controlsRef = useRef<any>(null);
  const setGroupRef = useCallback((node: Object3D | null) => {
    groupRef.current = node;
    setTransformObject(node);
  }, []);

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
      {isSelected && transformObject && (
        <TransformControls
          ref={controlsRef} object={transformObject} mode={mode} showY={false}
          onMouseUp={() => groupRef.current && onUpdatePosition([groupRef.current.position.x, floorY, groupRef.current.position.z])}
        />
      )}
      <group
        ref={setGroupRef}
        position={[position[0], floorY, position[2]]}
        onClick={(e: any) => { e.stopPropagation(); onSelect(); }}
      >
        <primitive object={clonedScene} castShadow />
      </group>
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
            <button
              className="flex items-center gap-3 px-4 py-2 bg-[#D4AF371] text-[#071226] rounded-lg shadow-lg hover:shadow-2xl transform hover:-translate-y-0.5 transition-all duration-150"
              title="Add to cart"
              onClick={(e) => {
                e.stopPropagation();
                const key = "opulentia_cart";
                try {
                  const raw = localStorage.getItem(key) || "[]";
                  const cart: any[] = JSON.parse(raw);
                  const existing = cart.find((item) => item.id === product.id);

                  if (existing) {
                    existing.qty = (existing.qty || 1) + 1;
                  } else {
                    cart.push({
                      id: product.id,
                      qty: 1,
                      name: product.name,
                      price: product.price,
                      img: product.img,
                    });
                  }

                  localStorage.setItem(key, JSON.stringify(cart));
                // small visual feedback: dispatch a global event other parts of app can use
                  window.dispatchEvent(new Event("cartUpdated"));
                  window.dispatchEvent(
                    new CustomEvent("cartAdded", {
                      detail: { name: product.name },
                    })
                  );
                } catch (err) {
                  console.error("Cart error:", err);
                }
              }}
              aria-label={`Add ${product?.name} to cart`}
            >
              <div className="flex items-center justify-center w-9 h-9 rounded-md bg-white/30 backdrop-blur-sm">
                <ShoppingCart size={18} className="text-[#071226]" />
              </div>
              <div className="flex flex-col text-left leading-tight">
                <span className="text-sm font-black uppercase tracking-wide">Add to Cart</span>
                <span className="text-xs text-[#071226]/80 font-mono">{product.price}</span>
              </div>
            </button>

            <button
              className="w-16 border border-gray-200 flex items-center justify-center hover:bg-gray-50"
              title="Add to wishlist"
              onClick={(e) => {
                e.stopPropagation();
                const key = "opulentia_wishlist";
                try {
                  const raw = localStorage.getItem(key) || "[]";
                  const wishlist: any[] = JSON.parse(raw);
                  const exists = wishlist.find((item) => item.id === product.id);

                  if (!exists) {
                    const newItem = {
                      id: product.id,
                      name: product.name,
                      price: product.price,
                      img: product.img,
                      addedAt: Date.now(),
                    };
                    wishlist.push(newItem);
                    localStorage.setItem(key, JSON.stringify(wishlist));
                    // notify profile page (or any listener) to re-render its wishlist
                    window.dispatchEvent(new CustomEvent("wishlistUpdated", { detail: newItem }));
                  } else {
                  // already in wishlist — optional: you can toggle remove here if desired
                    console.info("Item already in wishlist:", product.id);
                  }
                } catch (err) {
                  console.error("Wishlist error:", err);
                }
              }}
              aria-label={`Add ${product?.name} to wishlist`}
            >
              <Heart size={20} />
            </button>
          </div>
        </div>
      </main>

      {/* --- OPULENTIA INTEGRATED STUDIO --- */}
      <section className="max-w-7xl mx-auto px-6 py-20 bg-gray-50/50">
        <div className="mb-10 flex justify-between items-end">
          <h2 className="text-2xl font-bold uppercase tracking-tight">Opulentia Visualization <span className="text-[10px] bg-black text-white px-2 py-0.5 ml-2 rounded-full">v2.0</span></h2>
          <button onClick={() => router.push('/Visualization')} className="text-[10px] font-bold uppercase border-b border-[#D4AF37] hover:text-[#D4AF37]">Enter Full Scale Designer</button>
        </div>

        <div className="flex flex-col lg:flex-row h-[750px] bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-2xl relative">
          {/* Sidebar Left: Room & Wall Settings */}
          <div className="w-full lg:w-72 border-r bg-white flex flex-col p-6 z-10 overflow-y-auto">
            <h3 className="text-[10px] font-black uppercase text-gray-400 mb-6 flex items-center gap-2"><Layout size={12} /> Room Settings</h3>
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
                  {floorMaterials.map((m: { name: string; hex: string }) => (
                    <button key={m.name} onClick={() => setFloorColor(m.hex)} className={cn("aspect-square rounded-md border-2", floorColor === m.hex ? "border-black" : "border-transparent")} style={{ background: m.hex }} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Center: Mini 3D Viewport */}
          <div className="flex-1 relative bg-[#f1f5f9]">
          {/* small floating transform controls */}

            {selectedItem && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 bg-black text-white p-1 rounded-full flex gap-1 shadow-2xl">
                <button
                  onClick={() => setTransformMode('translate')}
                  className={cn(
                    "px-3 py-1 text-[9px] font-bold rounded-full transition-all",
                    transformMode === 'translate' ? "bg-white text-black" : "hover:text-[#D4AF37]"
                  )}
                >
                  MOVE
                </button>
                <button
                  onClick={() => setTransformMode('rotate')}
                  className={cn(
                    "px-3 py-1 text-[9px] font-bold rounded-full transition-all",
                    transformMode === 'rotate' ? "bg-white text-black" : "hover:text-[#D4AF37]"
                  )}
                >
                  ROTATE
                </button>
              </div>
            )}

            <Canvas
              gl={{ preserveDrawingBuffer: true, antialias: true }}
              shadows
              camera={{ position: [25, 20, 25], fov: 45, far: 1000 }}
              onPointerMissed={() => setSelectedItem(null)}
            >
              <Suspense fallback={null}>
                <ambientLight intensity={0.8} />
                <directionalLight
                  position={[20, 30, 20]}
                  intensity={1.6}
                  castShadow
                  shadow-mapSize-width={1024}
                  shadow-mapSize-height={1024}
                />
                <Environment preset="city" />
                <Grid infiniteGrid fadeDistance={400} sectionSize={1} sectionColor="#e2e8f0" cellColor="#ffffff" cellThickness={0.5} />

                <group position={[0, wallHeight / 2, 0]}>
                  <mesh receiveShadow>
                    <boxGeometry args={[roomWidth, wallHeight, roomLength]} />
                    <meshStandardMaterial color={wallColor} side={1} transparent opacity={0.5} depthWrite={false} />
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
                    position={item.position}
                    mode={transformMode}
                    isSelected={selectedItem === item.uniqueId}
                    onSelect={() => setSelectedItem(item.uniqueId)}
                    setOrbitEnabled={setOrbitEnabled}
                    floorY={floorY + 2} // raise object 1m above the floor
                    onUpdatePosition={(newPos: any) => {
                      setSceneItems(prev => prev.map(i => i.uniqueId === item.uniqueId ? { ...i, position: newPos } : i));
                    }}
                  />
                ))}
              </Suspense>

              <ContactShadows position={[0, floorY, 0]} opacity={0.4} scale={30} blur={2.5} />
              <OrbitControls makeDefault enabled={orbitEnabled} minDistance={2} maxDistance={Infinity} maxPolarAngle={Math.PI / 2.1} dampingFactor={0.05} enableDamping />
            </Canvas>
          </div>

          {/* Sidebar Right: Asset Browser & Selection (upgraded) */}
          <div className="w-full lg:w-72 border-l bg-white flex flex-col p-6 z-10 overflow-y-auto">
            <h3 className="text-[10px] font-black uppercase text-gray-400 mb-6 flex items-center gap-2"><Plus size={12} /> Catalog Items</h3>

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
                  <Plus size={14} className="text-gray-300 group-hover:text-black" />
                </div>
              ))}
            </div>

            {selectedItem && (
              <div className="mt-auto pt-6 border-t">
                <h3 className="text-[10px] font-black uppercase text-gray-400 mb-4 flex items-center gap-2"><Palette size={12} /> Selection Properties</h3>
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-[10px] font-bold truncate">{sceneItems.find(i => i.uniqueId === selectedItem)?.name}</p>
                  <button
                    onClick={() => { setSceneItems(sceneItems.filter(i => i.uniqueId !== selectedItem)); setSelectedItem(null); }}
                    className="w-full mt-4 py-2.5 bg-red-50 text-red-500 text-[9px] font-black rounded-lg border border-red-100 flex items-center justify-center gap-2 hover:bg-red-500 hover:text-white transition-all"
                  >
                    <Trash2 size={12} /> REMOVE ITEM
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
