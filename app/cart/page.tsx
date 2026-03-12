"use client";

import * as React from "react";
import { Minus, Plus, X, ArrowRight, Loader2, Tag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import Navbar from "../component/navbar";
import Footer from "../component/footer";


const formatCurrency = (amount: number) => {
  return `Rs. ${amount.toLocaleString('en-LK')}`;
};


const INITIAL_CART_ITEMS = [
  {
    id: 1,
    name: "King sized bed",
    variant: "Ivory",
    price: 120000, 
    quantity: 2,
    image: "/slide1.jpg", 
  },
  {
    id: 2,
    name: "Royal velvet single sofa",
    variant: "Red",
    price: 132000, 
    quantity: 1,
    image: "/sofa.png", 
  },
];

export default function CartPage() {
  const router = useRouter();
  
  
  const [cartItems, setCartItems] = React.useState<any[]>([]);
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [isCheckingOut, setIsCheckingOut] = React.useState(false);
  
  const [showCouponInput, setShowCouponInput] = React.useState(false);
  const [couponCode, setCouponCode] = React.useState("");
  const [discount, setDiscount] = React.useState(0);
  React.useEffect(() => {
    const savedCart = localStorage.getItem("opulentia_cart");
    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
    } else {
      setCartItems(INITIAL_CART_ITEMS);
    }
    setIsLoaded(true);
  }, []);


  React.useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("opulentia_cart", JSON.stringify(cartItems));
    }
  }, [cartItems, isLoaded]);


  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const total = Math.max(0, subtotal - discount);

  const handleUpdateQuantity = (id: number, delta: number) => {
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newQuantity = Math.max(1, item.quantity + delta);
          return { ...item, quantity: newQuantity };
        }
        return item;
      })
    );
  };

  const handleRemoveItem = (id: number) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (couponCode.toUpperCase() === "LUXURY10") {
      setDiscount(10000); 
      alert("Coupon applied successfully!");
    } else {
      alert("Invalid coupon code. Try LUXURY10");
      setDiscount(0);
    }
  };

  const handleCheckout = () => {
    setIsCheckingOut(true);
 
    router.push("/checkout"); 
  };


  if (!isLoaded) return null; 

  return (
    <div className="min-h-screen bg-[#FFFDF9] font-sans text-[#0A192F] flex flex-col">
      <Navbar />

      <div className="bg-[#FFFDF9] border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 text-sm flex items-center gap-2">
          <a href="/" className="font-semibold text-[#0A192F] hover:text-[#D4AF37] transition-colors">
            Home
          </a>
          <span className="text-gray-400 font-bold">&gt;</span>
          <span className="text-[#D4AF37] font-semibold">Cart</span>
        </div>
      </div>

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-12 md:py-16">
        
        <h1 className="text-4xl md:text-5xl font-semibold text-[#5A6376] text-center mb-16 tracking-tight">
          Your Cart
        </h1>

        <div className="flex flex-col lg:flex-row gap-12 items-start">
          
          {/* Left Column: Cart Items List */}
          <div className="w-full lg:w-2/3">
            
            <div className="hidden md:grid grid-cols-12 text-[10px] font-bold text-gray-400 tracking-widest uppercase pb-4 border-b border-gray-200">
              <div className="col-span-6">Product</div>
              <div className="col-span-2 text-center">Price</div>
              <div className="col-span-2 text-center">Quantity</div>
              <div className="col-span-2 text-right">Total</div>
            </div>

            {cartItems.length > 0 ? (
              <div className="flex flex-col">
                <AnimatePresence>
                  {cartItems.map((item) => (
                    <motion.div 
                      key={item.id} 
                      layout 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -50, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="grid grid-cols-1 md:grid-cols-12 items-center gap-6 py-8 border-b border-gray-100 overflow-hidden"
                    >
                      
                      <div className="col-span-1 md:col-span-6 flex items-center gap-6">
                        <div className="w-24 h-24 bg-gray-50 rounded-sm flex items-center justify-center p-2 shrink-0 border border-gray-100">
                          <img 
                            src={item.image} 
                            alt={item.name} 
                            className="max-w-full max-h-full object-contain" 
                          />
                        </div>
                        <div>
                          <h3 className="font-bold text-[#0A192F] text-sm mb-1">{item.name}</h3>
                          <p className="text-gray-500 text-xs">{item.variant}</p>
                        </div>
                      </div>

                
                      <div className="col-span-1 md:col-span-2 flex justify-between md:justify-center items-center">
                        <span className="md:hidden text-[10px] font-bold text-gray-400 uppercase tracking-widest">Price</span>
                        <span className="font-semibold text-gray-700 whitespace-nowrap">{formatCurrency(item.price)}</span>
                      </div>

                   
                      <div className="col-span-1 md:col-span-2 flex justify-between md:justify-center items-center">
                        <span className="md:hidden text-[10px] font-bold text-gray-400 uppercase tracking-widest">Quantity</span>
                        <div className="flex items-center gap-3 bg-[#F4F4F4] rounded-full px-3 py-1.5">
                          <button 
                            onClick={() => handleUpdateQuantity(item.id, -1)}
                            className="text-gray-500 hover:text-black transition-colors"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="text-sm font-semibold w-6 text-center text-gray-800">
                            {item.quantity}
                          </span>
                          <button 
                            onClick={() => handleUpdateQuantity(item.id, 1)}
                            className="text-gray-500 hover:text-black transition-colors"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>

                    
                      <div className="col-span-1 md:col-span-2 flex items-center justify-between md:justify-end gap-6">
                        <div className="flex justify-between w-full md:w-auto items-center">
                          <span className="md:hidden text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total</span>
                          <span className="font-bold text-gray-800 whitespace-nowrap">{formatCurrency(item.price * item.quantity)}</span>
                        </div>
                        <button 
                          onClick={() => handleRemoveItem(item.id)}
                          className="bg-[#F4F4F4] p-1.5 rounded-full hover:bg-red-50 hover:text-red-500 text-gray-500 transition-colors shrink-0"
                          title="Remove item"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="py-20 text-center"
              >
                <p className="text-gray-500 mb-6">Your cart is currently empty.</p>
                <button 
                  onClick={() => router.push("/")}
                  className="inline-block bg-[#D4AF37] text-[#0A192F] px-8 py-3 text-[10px] font-bold uppercase tracking-[0.3em] rounded-sm hover:bg-yellow-500 transition-colors"
                >
                  Continue Shopping
                </button>
              </motion.div>
            )}
          </div>

          
          <div className="w-full lg:w-1/3">
            <div className="bg-[#F4F4F4] rounded-sm overflow-hidden sticky top-32">
              
              <div className="p-8 pb-6">
                <h2 className="text-lg font-semibold text-gray-700 mb-8">Order Summary</h2>
                
                <div className="flex justify-between text-sm mb-4">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-bold text-gray-800">{formatCurrency(subtotal)}</span>
                </div>
                
                {discount > 0 && (
                  <div className="flex justify-between text-sm mb-4 text-[#569859]">
                    <span>Discount</span>
                    <span className="font-bold">-{formatCurrency(discount)}</span>
                  </div>
                )}

                <div className="flex justify-between items-center text-sm mb-6">
                  <span className="text-gray-500">Shipping</span>
                  <span className="font-medium text-gray-500 text-[11px] uppercase tracking-wider">Calculated at checkout</span>
                </div>
                
           
                {!showCouponInput ? (
                  <button 
                    onClick={() => setShowCouponInput(true)}
                    className="text-[#569859] flex items-center gap-1.5 text-xs font-semibold hover:text-[#467d49] transition-colors mt-2"
                  >
                    Add coupon code <ArrowRight size={14} />
                  </button>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="flex gap-2 mt-4">
                    <input 
                      type="text" 
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="e.g. LUXURY10" 
                      className="flex-1 text-xs px-3 py-2 border border-gray-300 rounded-sm outline-none focus:border-[#569859]"
                    />
                    <button type="submit" className="bg-[#569859] text-white px-3 py-2 rounded-sm text-xs font-bold hover:bg-[#467d49] transition-colors">
                      Apply
                    </button>
                  </form>
                )}
              </div>

          
              <div className="bg-[#EAEAEA] p-8 py-6 flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-700">Total</span>
                <span className="text-xl font-bold text-gray-800">{formatCurrency(total)}</span>
              </div>

           
              <button 
                onClick={handleCheckout}
                disabled={cartItems.length === 0 || isCheckingOut}
                className="w-full bg-[#0A192F] text-white py-5 flex items-center justify-center gap-2 text-[11px] tracking-[0.2em] uppercase font-bold hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCheckingOut ? (
                  <><Loader2 size={16} className="animate-spin" /> Proceeding...</>
                ) : (
                  "Checkout"
                )}
              </button>

            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}