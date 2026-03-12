"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Search, ShoppingCart, User, ChevronRight, Star, Heart, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import Navbar from "./component/navbar";
import Footer from "./component/footer";



const Button = React.forwardRef(({ className, variant = "default", ...props }: any, ref: any) => {
  const variants: any = {
    default: "bg-[#0A192F] text-white hover:bg-[#D4AF37] hover:text-[#0A192F]",
    outline: "border border-[#0A192F] text-[#0A192F] hover:bg-gray-100",
    gold: "bg-[#D4AF37] text-[#0A192F] font-bold hover:bg-white",
  };
  return (
    <button
      ref={ref}
      className={cn("inline-flex items-center justify-center rounded-sm text-[10px] tracking-widest uppercase transition-all px-6 py-3", variants[variant], className)}
      {...props}
    />
  );
});

const Input = React.forwardRef(({ className, ...props }: any, ref: any) => (
  <input
    ref={ref}
    className={cn("flex h-9 w-full rounded-sm border border-gray-200 bg-white px-3 py-1 text-xs outline-none focus:ring-1 focus:ring-[#D4AF37]", className)}
    {...props}
  />
));



const SECTIONS = [
  { title: "Bedroom", subtitle: "The Heart of the Home", img: "/bedroom.jpg", rev: false, href: "/bedroom" },
  { title: "Living", subtitle: "Comfort Meets Class", img: "/living.jpg", rev: true, href: "/living" },
  { title: "Dining", subtitle: "Elevated Gatherings", img: "/dining.jpg", rev: false, href: "/dining" },
];


const PRODUCTS = [
  { id: 1, name: "Grey Fabric Sofa", price: "Rs 67,149", oldPrice: "Rs 75,000", img: "/sofa.png", rating: 5 },
  { id: 2, name: "Mint Velvet Tub Chairs", price: "Rs 57,149", oldPrice: "Rs 65,000", img: "/mint-set.png", rating: 4 },
  { id: 3, name: "Luxury Sofa Bed", price: "Rs 87,149", oldPrice: "Rs 95,000", img: "/sofa-bed.png", rating: 5 },
  { id: 4, name: "Mahogany Coffee Table", price: "Rs 27,149", oldPrice: "Rs 35,000", img: "/coffee-table.png", rating: 5 },
  { id: 5, name: "Azure Accent Chair", price: "Rs 37,149", oldPrice: "Rs 45,000", img: "/blue-chair.png", rating: 4 },
  { id: 6, name: "Classic Armchair", price: "Rs 47,149", oldPrice: "Rs 55,000", img: "/armchair.png", rating: 5 },
  { id: 7, name: "Velvet Dining Set", price: "Rs 77,149", oldPrice: "Rs 85,000", img: "/dining-set.png", rating: 5 },
  { id: 8, name: "Elegant Sideboard", price: "Rs 57,149", oldPrice: "Rs 65,000", img: "/sideboard.png", rating: 4 },
  { id: 9, name: "Ornate Console Table", price: "Rs 47,149", oldPrice: "Rs 55,000", img: "/console-table.png", rating: 5 },
  { id: 10, name: "Modern Side Chair", price: "Rs 37,149", oldPrice: "Rs 45,000", img: "/side-chair.png", rating: 4 },
];

const ProductCard = ({ product }: { product: any }) => (
  <motion.div 
    whileHover={{ y: -8 }}
    className="group bg-white flex flex-col h-full"
  >
    
    <div className="relative aspect-square bg-[#F9F9F9] overflow-hidden rounded-sm flex items-center justify-center p-6 border border-transparent group-hover:border-gray transition-all">
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
              const id = product.id;
              const existing = cart.find((item) => item.id === id);
              if (existing) {
                existing.qty = (existing.qty || 1) + 1;
              } else {
                cart.push({ id, qty: 1, name: product.name, price: product.price, img: product.img });
              }
              localStorage.setItem(key, JSON.stringify(cart));
              const btn = e.currentTarget as HTMLButtonElement;
              btn.animate([{ transform: "scale(1)" }, { transform: "scale(1.06)" }, { transform: "scale(1)" }], { duration: 160 });
             
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
            const id = product.id;
            try {
              const raw = localStorage.getItem(key) || "[]";
              const list: number[] = JSON.parse(raw);
              const exists = list.includes(id);
              const next = exists ? list.filter((i) => i !== id) : [...list, id];
              localStorage.setItem(key, JSON.stringify(next));
              const btn = e.currentTarget as HTMLButtonElement;
              btn.setAttribute("aria-pressed", String(!exists));
              btn.title = exists ? "Remove from wishlist" : "Remove from wishlist";
              if (!exists) {
                btn.classList.add("bg-red-500", "text-white");
              } else {
                btn.classList.remove("bg-red-500", "text-white");
              }

              btn.animate([{ transform: "scale(1)" }, { transform: "scale(1.08)" }, { transform: "scale(1)" }], { duration: 180 });
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
            className={cn(i < product.rating ? "fill-[#D4AF37] text-[#D4AF37]" : "text-gray-300")} 
          />
        ))}
      </div>
      <p className="text-[8px] text-gray-400 uppercase tracking-widest font-medium">Opulentia Fine Furniture</p>
      <h3 className="text-[11px] font-bold uppercase tracking-tight text-[#0A192F] line-clamp-1">{product.name}</h3>
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-black text-[#D4AF37]">{product.price}</span>
        <span className="text-[9px] text-gray-400 line-through">{product.oldPrice}</span>
      </div>
    </div>
  </motion.div>
);



export default function OpulentiaHome() {
  return (
    <div className="min-h-screen bg-white font-sans text-[#0A192F]">
      
     <Navbar />

      <div className="w-full bg-white space-y-12 pb-20">
      
   
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

      <Footer />
    </div>
  );
}