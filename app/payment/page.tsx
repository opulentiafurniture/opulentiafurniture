"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronRight, CreditCard, Banknote, ShieldCheck, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

// Custom components
import Navbar from "../component/navbar";
import Footer from "../component/footer";

const formatCurrency = (amount: number) => {
  return `Rs. ${amount.toLocaleString('en-LK')}.00`;
};

// Mock Bank Data for Sri Lanka
const BANKS = [
  { name: "Sampath", logo: "/banks/sampath.png" },
  { name: "Commercial", logo: "/banks/com.png" },
  { name: "Nations Trust", logo: "/banks/ntb.png" },
  { name: "HSBC", logo: "/banks/hsbc.png" },
  { name: "BOC", logo: "/banks/boc.png" },
  { name: "DFCC", logo: "/banks/dfcc.png" },
  { name: "NDB", logo: "/banks/ndb.png" },
  { name: "HNB", logo: "/banks/hnb.png" },
  { name: "Peoples Bank", logo: "/banks/peoples.png" },
  { name: "Union Bank", logo: "/banks/union.png" },
  { name: "Seylan", logo: "/banks/seylan.png" },
  { name: "LOLC", logo: "/banks/lolc.png" },
];

const EMI_BANKS = ["Sampath", "HNB", "Seylan", "LOLC"];
const TENURES = [3, 6, 12, 24, 48];

export default function PaymentPage() {
  const router = useRouter();
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [orderTotal, setOrderTotal] = React.useState(0);
  const [paymentMethod, setPaymentMethod] = React.useState<"card" | "emi" | "cod">("card");
  const [selectedBank, setSelectedBank] = React.useState("");
  const [selectedTenure, setSelectedTenure] = React.useState(12);
  const [isProcessing, setIsProcessing] = React.useState(false);

  React.useEffect(() => {
    const total = localStorage.getItem("opulentia_order_total");
    if (total) {
      setOrderTotal(parseInt(total));
    } else {
      router.push("/cart");
    }
    setIsLoaded(true);
  }, [router]);

  const handleFinalizeOrder = () => {
    setIsProcessing(true);
    // Simulate payment gateway processing
    setTimeout(() => {
      setIsProcessing(false);
      localStorage.removeItem("opulentia_cart");
      localStorage.removeItem("opulentia_order_total");
      alert("Order Placed Successfully!");
      router.push("/");
    }, 2500);
  };

  if (!isLoaded) return null;

  const emiMonthly = Math.round(orderTotal / selectedTenure);

  return (
    <div className="min-h-screen bg-[#FFFDF9] font-sans text-[#0A192F] flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-12">
        
        {/* Step Progress Bar */}
        <div className="flex items-center justify-center mb-16 max-w-xl mx-auto">
          {[
            { id: 1, label: "Address" },
            { id: 2, label: "Payment" },
            { id: 3, label: "Confirmation" }
          ].map((step, idx) => (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center relative">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500",
                  step.id === 2 ? "bg-[#0A192F] border-[#0A192F] text-white" : 
                  step.id < 2 ? "bg-green-500 border-green-500 text-white" : "border-gray-200 text-gray-400"
                )}>
                  {step.id < 2 ? <Check size={18} /> : step.id}
                </div>
                <span className={cn("absolute -bottom-7 text-[10px] uppercase tracking-widest font-bold whitespace-nowrap", step.id === 2 ? "text-[#0A192F]" : "text-gray-400")}>
                  {step.label}
                </span>
              </div>
              {idx < 2 && <div className={cn("h-[2px] flex-1 mx-4", step.id < 2 ? "bg-green-500" : "bg-gray-200")} />}
            </React.Fragment>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mt-10">
          
          {/* Left Side: Payment Options */}
          <div className="lg:col-span-8 space-y-10">
            
            {/* 1. Credit/Debit Outright */}
            <section className="space-y-4">
              <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-4">Credit/Debit Cards Outright Purchase</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {BANKS.map((bank) => (
                  <button 
                    key={bank.name}
                    onClick={() => { setPaymentMethod("card"); setSelectedBank(bank.name); }}
                    className={cn(
                      "h-16 border rounded-sm flex items-center justify-center p-2 grayscale hover:grayscale-0 transition-all bg-white",
                      (paymentMethod === "card" && selectedBank === bank.name) ? "border-[#D4AF37] grayscale-0 shadow-md ring-1 ring-[#D4AF37]" : "border-gray-200"
                    )}
                  >
                    <span className="text-[10px] font-bold text-gray-400 uppercase">{bank.name}</span>
                  </button>
                ))}
              </div>
            </section>

            {/* 2. EMI Section */}
            <section className="space-y-6 pt-6 border-t border-gray-100">
              <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Credit Card Easy Installments (Easy EMI)</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {BANKS.filter(b => EMI_BANKS.includes(b.name)).map((bank) => (
                  <button 
                    key={bank.name + "emi"}
                    onClick={() => { setPaymentMethod("emi"); setSelectedBank(bank.name); }}
                    className={cn(
                      "h-16 border rounded-sm flex items-center justify-center p-2 grayscale hover:grayscale-0 transition-all bg-white",
                      (paymentMethod === "emi" && selectedBank === bank.name) ? "border-[#D4AF37] grayscale-0 shadow-md ring-1 ring-[#D4AF37]" : "border-gray-200"
                    )}
                  >
                    <span className="text-[10px] font-bold text-gray-400 uppercase">{bank.name} EMI</span>
                  </button>
                ))}
              </div>

              <AnimatePresence>
                {paymentMethod === "emi" && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="bg-white border border-gray-100 p-6 rounded-sm space-y-6 overflow-hidden">
                    <div className="space-y-3">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Tenure (Months)</p>
                      <div className="flex flex-wrap gap-6">
                        {TENURES.map(t => (
                          <label key={t} className="flex items-center gap-2 cursor-pointer group">
                            <input type="radio" name="tenure" checked={selectedTenure === t} onChange={() => setSelectedTenure(t)} className="accent-[#D4AF37]" />
                            <span className="text-xs font-medium text-gray-700 group-hover:text-[#D4AF37]">{t} month</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2 border-t pt-4 text-xs">
                       <div className="flex justify-between"><span>Order Value</span><span className="font-bold">{formatCurrency(orderTotal)}</span></div>
                       <div className="flex justify-between"><span>Handling Fee</span><span>Rs. 0.00</span></div>
                       <div className="flex justify-between text-[#D4AF37] font-bold pt-2 border-t mt-2">
                         <span>EMI/month (approx)</span>
                         <span>{formatCurrency(emiMonthly)}</span>
                       </div>
                    </div>
                    <button onClick={handleFinalizeOrder} className="w-full bg-[#E91E63] text-white py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-[#C2185B] transition-colors">Choose This Plan</button>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>

            {/* 3. Cash on Delivery */}
            <section className="pt-6 border-t border-gray-100">
              <label className="flex items-center gap-3 cursor-pointer p-4 bg-white border border-gray-100 rounded-sm hover:border-[#D4AF37] transition-all">
                <input type="radio" name="payment" checked={paymentMethod === "cod"} onChange={() => setPaymentMethod("cod")} className="accent-[#D4AF37]" />
                <span className="text-xs font-bold uppercase tracking-widest text-gray-700 flex items-center gap-2">
                  <Banknote size={16} /> Cash on Delivery
                </span>
              </label>
              {paymentMethod === "cod" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4">
                  <button onClick={handleFinalizeOrder} className="w-full bg-[#E91E63] text-white py-4 text-[10px] font-bold uppercase tracking-widest hover:bg-[#C2185B] transition-colors">Pay On Delivery</button>
                </motion.div>
              )}
            </section>
          </div>

          {/* Right Side: Mini Summary */}
          <div className="lg:col-span-4">
            <div className="bg-[#F4F4F4] p-8 sticky top-32 rounded-sm space-y-6">
              <h2 className="text-lg font-semibold text-gray-700">Order Summary</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-gray-500"><span>Subtotal</span><span className="font-bold text-gray-800">{formatCurrency(orderTotal - 3500)}</span></div>
                <div className="flex justify-between text-gray-500"><span>Shipping</span><span className="font-bold text-gray-800">Rs. 3,500.00</span></div>
              </div>
              <div className="border-t border-gray-200 pt-6 flex justify-between items-center">
                <span className="text-lg font-semibold">Total</span>
                <span className="text-xl font-bold text-[#0A192F]">{formatCurrency(orderTotal)}</span>
              </div>
              <div className="bg-white border border-green-200 p-4 rounded-sm flex items-center gap-3 text-[10px] text-green-700 font-bold uppercase tracking-wider">
                <ShieldCheck size={20} /> Secure Encryption Enabled
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      
      {/* Loading Overlay */}
      <AnimatePresence>
        {isProcessing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] bg-[#0A192F]/90 backdrop-blur-sm flex flex-col items-center justify-center text-white">
            <Loader2 className="animate-spin text-[#D4AF37] mb-4" size={48} />
            <p className="text-[10px] tracking-[0.5em] uppercase font-bold">Processing Secured Payment</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}