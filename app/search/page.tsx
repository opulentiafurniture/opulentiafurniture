"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ShoppingCart, Heart, Star } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import Navbar from "../component/navbar";
import Footer from "../component/footer";
import { ALL_PRODUCTS } from "@/lib/product";

const ProductCard = ({ product }: { product: any }) => {
  const router = useRouter();

  return (
    <motion.div
      whileHover={{ y: -8 }}
      className="group bg-white flex flex-col h-full cursor-pointer"
      onClick={() => router.push(product.href ?? `/product/${product.id}`)}
    >
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
                  existing.qty = (existing.qty || existing.quantity || 1) + 1;
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
                window.dispatchEvent(
                  new CustomEvent("cartAdded", {
                    detail: { name: product.name },
                  })
                );
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
        <p className="text-[8px] text-gray-400 uppercase tracking-widest font-medium">
          {product.category}
        </p>

        <h3 className="text-[11px] font-bold uppercase tracking-tight text-[#0A192F] line-clamp-1">
          {product.name}
        </h3>

        <div className="flex gap-0.5">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              size={10}
              className={cn(
                i < product.rating ? "fill-[#D4AF37] text-[#D4AF37]" : "text-gray-300"
              )}
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
};

export default function SearchPage() {
  const searchParams = useSearchParams();
  const rawQuery = searchParams.get("q") || "";
  const query = rawQuery.trim().toLowerCase();

  const results = ALL_PRODUCTS.filter((product) =>
    product.name.toLowerCase().includes(query) ||
    product.category.toLowerCase().includes(query) ||
    product.price.toLowerCase().includes(query) ||
    product.oldPrice.toLowerCase().includes(query)
  );

  return (
    <div className="min-h-screen bg-white text-[#0A192F]">
      <Navbar />

      <section className="max-w-7xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold mb-4">Search Results</h1>

        <p className="text-gray-600 mb-10">
          {query
            ? `Showing results for "${rawQuery}"`
            : "Enter a search term to browse products."}
        </p>

        {query && results.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {results.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : query ? (
          <div className="py-16 text-center text-gray-500">
            No products found for "{rawQuery}".
          </div>
        ) : (
          <div className="py-16 text-center text-gray-500">
            Start searching for beds, sofas, tables, chairs, wardrobes, and more.
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}