"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Search, ShoppingCart, User, ChevronRight, Star, Heart, Menu, Box, Layout } from "lucide-react";
import { cn } from "@/lib/utils";
import Navbar from "./component/navbar";
import Footer from "./component/footer";
import Chatbot from "./component/Chatbot";
import { useRouter } from "next/navigation";

// Button and Input components (typed)
type ButtonVariant = "default" | "outline";
const Button: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; className?: string }
> = ({ variant = "default", className = "", children, ...props }) => {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center justify-center rounded-sm px-4 py-2 text-sm transition",
        variant === "outline"
          ? "border border-current bg-transparent"
          : "bg-[#D4AF37] text-[#0A192F]",
        className
      )}
    >
      {children}
    </button>
  );
};

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input {...props} className={cn("border rounded px-3 py-2 text-sm", props.className)} />
);

// Typed models for products and sections
interface Product {
  id: number;
  name: string;
  price: string;
  oldPrice?: string;
  img: string;
  rating?: number;
  category?: string;
  reviews?: number;
  liked?: boolean;
}

interface Section {
  title: string;
  subtitle: string;
  img: string;
  href: string;
  rev?: boolean;
}

// Sample data for PRODUCTS and SECTIONS (typed)
const PRODUCTS: Product[] = [
  { id: 1, name: "Royal Velvet Sofa", price: "Rs 89,990", oldPrice: "Rs 99,990", img: "/sofa.jpg", rating: 5, category: "Sofas" },
  { id: 2, name: "Modern Bookshelf", price: "Rs 42,500", oldPrice: "Rs 49,900", img: "/bookshelf.jpg", rating: 4, category: "Chairs" },
  { id: 3, name: "Marble Coffee Table", price: "Rs 34,900", oldPrice: "Rs 41,000", img: "/coffee_table.jpeg", rating: 5, category: "Tables" },
  { id: 21, name: "Grand Dining Table", price: "Rs 119,990", oldPrice: "Rs 134,990", img: "/dining-table.jpg", rating: 5, category: "Tables" },
  { id: 22, name: "Oak Dining Chair", price: "Rs 68,500", oldPrice: "Rs 77,000", img: "/dining-chair.jpeg", rating: 4, category: "Chairs" },
  { id: 23, name: "Luxury Pantry Cupboard", price: "Rs 84,900", oldPrice: "Rs 95,000", img: "/dining-cupboard.jpeg", rating: 5, category: "Storage" },
  { id: 31, name: "Royal King Bed", price: "Rs 129,990", oldPrice: "Rs 145,000", img: "/bedroom-bed.jpeg", rating: 5, category: "Beds" },
  { id: 34, name: "Luxury Wardrobe Unit", price: "Rs 159,900", oldPrice: "Rs 175,000", img: "/bedroom-wardrobe.jpeg", rating: 5, category: "Wardrobes" },
  { id: 35, name: "Elegant Dressing Table", price: "Rs 74,990", oldPrice: "Rs 84,000", img: "/bedroom-dresser.jpeg", rating: 4, category: "Dressers" },
]


const SECTIONS: Section[] = [
  { title: "Living Room", subtitle: "Curated Comfort", img: "/living.jpg", href: "/collections/living" },
  { title: "Bedroom", subtitle: "Rest in Style", img: "/bedroom.jpg", href: "/collections/bedroom", rev: true },
  { title: "Dining", subtitle: "Gather in Luxury", img: "/dining.jpg", href: "/collections/dining" },
];

// ProductCard implementation (typed)
const ProductCard = ({ product }: { product: Product }) => (
  <motion.div whileHover={{ y: -8 }} className="group bg-white flex flex-col h-full">
      <div className="relative aspect-square bg-[#F9F9F9] overflow-hidden rounded-sm flex items-center justify-center p-6 border border-transparent group-hover:border-gray-300 transition-all">
        <img
          src={product.img}
          alt={product.name}
          className="max-h-full max-w-full object-contain transition-transform duration-700 group-hover:scale-105"
        />
  
        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <button
            className="bg-white p-2 rounded-full shadow-lg hover:bg-[#D4AF37] hover:text-white transition-colors"
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
                window.location.href = "/cart";
              } catch (err) {
                console.error("Cart error:", err);
              }
            }}
          >
            <ShoppingCart size={16} />
          </button>
  
          <button
            className="bg-white p-2 rounded-full shadow-lg hover:bg-red-500 hover:text-white transition-colors"
            title="Add to wishlist"
            onClick={(e) => {
              e.stopPropagation();
              const key = "opulentia_wishlist";
              try {
                const raw = localStorage.getItem(key) || "[]";
                const list: number[] = JSON.parse(raw);
                const exists = list.includes(product.id);
                const next = exists ? list.filter((i) => i !== product.id) : [...list, product.id];
                localStorage.setItem(key, JSON.stringify(next));
              } catch (err) {
                console.error("Wishlist error:", err);
              }
            }}
          >
            <Heart size={16} />
          </button>
        </div>
      </div>
  
      <div className="mt-4 space-y-1.5 px-1">
        <div className="flex gap-0.5">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              size={10}
              className={cn(i < (product.rating ?? 0) ? "fill-[#D4AF37] text-[#D4AF37]" : "text-gray-300")}
            />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-black text-[#D4AF37]">{product.price}</span>
          <span className="text-[9px] text-gray-400 line-through">{product.oldPrice}</span>
        </div>
      </div>
    </motion.div>
  );

export default function OpulentiaHome() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white font-sans text-[#0A192F]">
      <Navbar />

      <div className="w-full bg-white space-y-12 pb-20">
        {/* HERO GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-1">
          <div className="h-[400px] overflow-hidden group relative">
            <img src="/living.jpg" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt="Living" />
            <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-all" />
          </div>
          <div className="h-[400px] overflow-hidden group relative">
            <img src="/bedroom.jpg" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt="Bedroom" />
            <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-all" />
          </div>
          <div className="h-[400px] overflow-hidden group relative">
            <img src="/dining.jpg" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt="Dining" />
            <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-all" />
          </div>
        </div>

        {/* BEST SELLER */}
        <section className="max-w-7xl mx-auto px-6">
          <div className="mb-10 flex items-center gap-4">
            <h2 className="text-2xl font-bold uppercase tracking-tighter">Best Seller</h2>
            <div className="h-px flex-1 bg-gray-100" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
            {PRODUCTS.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>

        {/* --- NEW: 3D VISUALIZATION CALL-TO-ACTION CARD --- */}
        <section className="max-w-7xl mx-auto px-6 py-10">
          <div className="relative overflow-hidden rounded-sm bg-[#0A192F] text-white shadow-2xl">
            <div className="absolute top-0 right-0 w-1/2 h-full hidden lg:block">
              {/* This represents your 3D Engine Preview */}
              <img 
                src="/living.jpg" 
                alt="3D Visualization" 
                className="w-full h-full object-cover opacity-40 grayscale"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0A192F] via-transparent to-transparent" />
            </div>

            <div className="relative z-10 p-12 lg:w-3/5 space-y-6">
              <div className="inline-flex items-center gap-2 bg-[#D4AF37] px-3 py-1 rounded-full shadow-lg">
                <Box size={14} className="text-[#0A192F]" />
                <span className="text-[10px] font-black text-[#0A192F] uppercase tracking-widest">Interactive 3D Engine</span>
              </div>
              
              <h2 className="text-4xl font-light tracking-[0.1em] uppercase leading-tight">
                Design Your <span className="text-[#D4AF37] italic font-medium">Dream Room</span> In Real-Time
              </h2>
              
              <p className="text-gray-400 text-sm font-light leading-relaxed max-w-md">
                Experience luxury like never before. Use our proprietary 3D Visualization tool to place real furniture, customize dimensions, and see your space come to life before you buy.
              </p>

              <div className="flex flex-wrap gap-6 pt-4">
              </div>

              <button 
                onClick={() => router.push("/visualization")}
                className="group flex items-center gap-4 bg-[#D4AF37] text-[#0A192F] px-8 py-4 text-xs font-black tracking-widest uppercase transition-all hover:bg-white active:scale-95 shadow-xl"
              >
                Launch Visualization 
                <ChevronRight size={16} className="transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        </section>

        {/* PROMOTION */}
        <section className="max-w-7xl mx-auto px-6">
          <div className="mb-10 flex items-center gap-4">
            <h2 className="text-2xl font-bold uppercase tracking-tighter">Promotion</h2>
            <div className="h-px flex-1 bg-gray-100" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
            {PRODUCTS.slice().reverse().map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      </div>

      {/* SECTIONS LIST */}
      <section className="space-y-1">
        {SECTIONS.map((section) => (
          <div 
            key={section.title}
            className={cn("flex flex-col lg:flex-row h-[500px] bg-white", section.rev && "lg:flex-row-reverse")}
          >
            <div className="w-full lg:w-1/2 bg-[#2D3339] flex flex-col items-center justify-center text-white p-12 text-center group overflow-hidden">
               <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 1 }}>
                 <h3 className="text-[10px] uppercase tracking-[0.5em] text-[#D4AF37] mb-4">{section.subtitle}</h3>
                 <h2 className="text-6xl font-extralight tracking-[0.2em] uppercase mb-8">{section.title}</h2>
                 <a href={section.href}>
                   <Button variant="outline" className="border-white text-white hover:bg-white hover:text-[#0A192F]">
                     Explore Collection
                   </Button>
                 </a>
               </motion.div>
            </div>
            <div className="w-full lg:w-1/2 relative group overflow-hidden">
               <img src={section.img} className="absolute inset-0 w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-110 grayscale-[30%] group-hover:grayscale-0" alt={section.title} />
               <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-all" />
            </div>
          </div>
        ))}
      </section>

      <Chatbot />
      <Footer />
    </div>
  );
}