"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { ShoppingCart, Heart, Star, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import Navbar from "../component/navbar";
import Footer from "../component/footer";

const Button = React.forwardRef(({ className, variant = "default", ...props }: any, ref: any) => {
  const variants: any = {
    default: "bg-[#0A192F] text-white hover:bg-[#D4AF37] hover:text-[#0A192F]",
    outline: "border border-[#0A192F] text-[#0A192F] hover:bg-gray-100",
    gold: "bg-[#D4AF37] text-[#0A192F] font-bold hover:bg-white",
  };

  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center rounded-sm text-[10px] tracking-widest uppercase transition-all px-6 py-3",
        variants[variant],
        className
      )}
      {...props}
    />
  );
});

Button.displayName = "Button";

const LIVING_PRODUCTS = [
  { id: 7, name: "Royal Velvet Sofa", price: "Rs 89,990", oldPrice: "Rs 99,990", img: "/sofa.jpg", rating: 5, category: "Sofas" },
  { id: 8, name: "Modern Bookshelf", price: "Rs 42,500", oldPrice: "Rs 49,900", img: "/bookshelf.jpg", rating: 4, category: "Shelf" },
  { id: 9, name: "Marble Coffee Table", price: "Rs 34,900", oldPrice: "Rs 41,000", img: "/coffee_table.jpeg", rating: 5, category: "Tables" }

]
const FEATURES = [
  {
    title: "Curated Comfort",
    text: "Premium living room furniture designed for both elegance and everyday comfort.",
  },
  {
    title: "Timeless Materials",
    text: "Crafted with rich textures, durable frames, and finishes that elevate your space.",
  },
  {
    title: "Statement Pieces",
    text: "From sofas to tables, each piece is selected to create a luxurious focal point.",
  },
];

const ProductCard = ({ product }: { product: any }) => (
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
              window.dispatchEvent(new Event("cartUpdated"));
              
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
      <p className="text-[8px] text-gray-400 uppercase tracking-widest font-medium">{product.category}</p>
      <h3 className="text-[11px] font-bold uppercase tracking-tight text-[#0A192F] line-clamp-1">{product.name}</h3>
      <div className="flex gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            size={10}
            className={cn(i < product.rating ? "fill-[#D4AF37] text-[#D4AF37]" : "text-gray-300")}
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

export default function LivingRoomPage() {
  return (
    <div className="min-h-screen bg-white font-sans text-[#0A192F]">
      <Navbar/>

      <section className="relative h-[85vh] min-h-[560px] overflow-hidden">
        <img
          src="/living-hero.jpg"
          alt="Luxury living room"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/45" />

        <div className="relative z-10 max-w-7xl mx-auto h-full px-6 flex items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-2xl text-white"
          >
            <p className="text-[11px] uppercase tracking-[0.45em] text-[#D4AF37] mb-5">Living Collection</p>
            <h1 className="text-5xl md:text-7xl font-extralight uppercase tracking-[0.18em] leading-tight mb-6">
              Refined Living
            </h1>
            <p className="text-sm md:text-base text-white/85 max-w-xl leading-7 mb-8">
              Discover premium furniture pieces crafted to transform your living room into a timeless, elegant, and inviting space.
            </p>
            <div className="flex flex-wrap gap-4">
              <a href="#products">
                <Button variant="gold">Shop Now</Button>
              </a>
              <a href="#inspiration">
                <Button variant="outline" className="border-white text-white hover:bg-white hover:text-[#0A192F]">
                  Explore Style
                </Button>
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {FEATURES.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="border border-gray-200 p-8 bg-[#FAFAFA]"
            >
              <h3 className="text-lg font-semibold uppercase tracking-wider mb-3">{item.title}</h3>
              <p className="text-sm text-gray-600 leading-7">{item.text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section id="inspiration" className="grid grid-cols-1 lg:grid-cols-2 gap-0 bg-[#F7F7F7]">
        <div className="h-[520px] overflow-hidden">
          <img src="/living-feature.jpg" alt="Living room inspiration" className="w-full h-full object-cover" />
        </div>
        <div className="flex items-center px-8 md:px-16 py-16 bg-[#0A192F] text-white">
          <div className="max-w-xl">
            <p className="text-[10px] uppercase tracking-[0.45em] text-[#D4AF37] mb-4">Interior Elegance</p>
            <h2 className="text-4xl md:text-5xl font-extralight uppercase tracking-[0.16em] mb-6">
              Designed for Modern Homes
            </h2>
            <p className="text-sm text-white/80 leading-7 mb-8">
              Layer your space with sculpted seating, elegant coffee tables, and carefully selected décor accents that create balance, comfort, and luxury.
            </p>
            <a href="#products" className="inline-flex items-center gap-2 uppercase tracking-[0.18em] text-[11px] text-[#D4AF37] hover:text-white transition-colors">
              View Products <ChevronRight size={14} />
            </a>
          </div>
        </div>
      </section>

      <section id="products" className="max-w-7xl mx-auto px-6 py-20">
        <div className="mb-10 flex items-center gap-4">
          <h2 className="text-2xl font-bold uppercase tracking-tighter">Living Room Best Sellers</h2>
          <div className="h-px flex-1 bg-gray-100" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {LIVING_PRODUCTS.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 pb-24">
        <div className="bg-[#D4AF37] text-[#0A192F] px-8 md:px-16 py-14 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <p className="text-[10px] uppercase tracking-[0.45em] mb-3">Exclusive Offer</p>
            <h3 className="text-3xl md:text-4xl font-bold uppercase tracking-wide">Elevate Your Living Space</h3>
          </div>
          <a href="/">
            <Button className="bg-[#0A192F] text-white hover:bg-white hover:text-[#0A192F]">
              Shop Collection
            </Button>
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}
