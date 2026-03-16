"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Star, ShoppingCart, Heart, ChevronRight } from 'lucide-react';
import Footer from "../../component/footer";
import Visualization from "@/app/Visualization/Visualization";
import { ALL_PRODUCTS } from "@/lib/product";

const relatedProducts = ALL_PRODUCTS;

export default function ProductDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [product, setProduct] = useState<any>(null);

  useEffect(() => {
    const found = ALL_PRODUCTS.find(p => p.id === Number(id));
    if (found) {
      setProduct(found);
    }
  }, [id]);

  if (!product) return <div className="h-screen w-full flex items-center justify-center font-bold text-gray-400">Loading Opulentia...</div>;

  return (
    <div className="min-h-screen bg-white text-[#0A192F]">

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

        <div className="h-[750px]">
          <Visualization
            isEmbedded
            showPageChrome={false}
            initialRoomConfig={{ width: 8, length: 8, wallHeight: 3.5, wallColor: '#f8fafc', floorColor: '#d4b895' }}
            initialSceneItems={product ? [{ uniqueId: `product-${product.id}`, url: product.modelUrl, position: [0, 0, 0], name: product.name, price: product.price }] : []}
          />
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
