"use client";

import * as React from "react";
import { ChevronRight, ShieldCheck, Truck, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

import Navbar from "../component/navbar";
import Footer from "../component/footer";


const Input = React.forwardRef<HTMLInputElement, any>(({ className, label, id, ...props }, ref) => (
    <div className="space-y-2 w-full">
        {label && (
            <label htmlFor={id} className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">
                {label}
            </label>
        )}
        <input
            id={id}
            ref={ref}
            className={cn(
                "flex h-12 w-full rounded-sm border border-gray-300 bg-white px-4 py-2 text-sm text-[#0A192F] placeholder:text-gray-400 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all",
                className
            )}
            {...props}
        />
    </div>
));

const formatCurrency = (amount: number) => {
    return `Rs. ${amount.toLocaleString('en-LK')}`;
};

export default function CheckoutPage() {
    const router = useRouter();
    
    const [cartItems, setCartItems] = React.useState<any[]>([]);
    const [isLoaded, setIsLoaded] = React.useState(false);
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const [formData, setFormData] = React.useState({
        email: "",
        phone: "",
        firstName: "",
        lastName: "",
        address: "",
        city: "",
        district: "",
        postalCode: "",
    });


    React.useEffect(() => {
        const savedCart = localStorage.getItem("opulentia_cart");
        if (savedCart) {
            const parsedCart = JSON.parse(savedCart);
            if (parsedCart.length === 0) {
                router.push("/cart"); 
            } else {
                setCartItems(parsedCart);
            }
        } else {
            router.push("/cart");
        }
        setIsLoaded(true);
    }, [router]);


    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

    const shippingFee = 3500; 
    const total = subtotal + shippingFee;

    const handleContinueToPayment = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        localStorage.setItem("opulentia_shipping", JSON.stringify(formData));
        localStorage.setItem("opulentia_order_total", total.toString());
        

        setTimeout(() => {
            router.push("/payment"); 
        }, 800);
    };

    if (!isLoaded) return null;

    return (
        <div className="min-h-screen bg-[#FFFDF9] font-sans text-[#0A192F] flex flex-col">
            <Navbar />

        
            <div className="bg-[#FFFDF9] border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-6 py-4 text-xs flex items-center gap-3 font-semibold uppercase tracking-widest">
                    <button onClick={() => router.push("/cart")} className="text-gray-400 hover:text-[#0A192F] transition-colors flex items-center gap-1">
                        <ArrowLeft size={14} /> Cart
                    </button>
                    <span className="text-gray-300"><ChevronRight size={14} /></span>
                    <span className="text-[#D4AF37]">Information</span>
                    <span className="text-gray-300"><ChevronRight size={14} /></span>
                    <span className="text-gray-400">Payment</span>
                </div>
            </div>

            <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-12 md:py-16">
                <div className="flex flex-col-reverse lg:flex-row gap-16 items-start">
                    
                    <div className="w-full lg:w-3/5">
                        <h1 className="text-3xl font-light tracking-tight text-[#0A192F] mb-10">
                            Shipping Information
                        </h1>

                        <form onSubmit={handleContinueToPayment} className="space-y-10">
                            
                     
                            <section className="space-y-6">
                                <h2 className="text-lg font-semibold border-b border-gray-200 pb-2">Contact Details</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Input 
                                        id="email" name="email" type="email" label="Email Address" 
                                        placeholder="you@example.com" required 
                                        value={formData.email} onChange={handleInputChange}
                                    />
                                    <Input 
                                        id="phone" name="phone" type="tel" label="Phone Number" 
                                        placeholder="+94 77 123 4567" required 
                                        value={formData.phone} onChange={handleInputChange}
                                    />
                                </div>
                            </section>

                     
                            <section className="space-y-6">
                                <h2 className="text-lg font-semibold border-b border-gray-200 pb-2">Delivery Address</h2>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Input 
                                        id="firstName" name="firstName" type="text" label="First Name" 
                                        placeholder="John" required 
                                        value={formData.firstName} onChange={handleInputChange}
                                    />
                                    <Input 
                                        id="lastName" name="lastName" type="text" label="Last Name" 
                                        placeholder="Doe" required 
                                        value={formData.lastName} onChange={handleInputChange}
                                    />
                                </div>

                                <Input 
                                    id="address" name="address" type="text" label="Street Address" 
                                    placeholder="No 123, Galle Road" required 
                                    value={formData.address} onChange={handleInputChange}
                                />

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <Input 
                                        id="city" name="city" type="text" label="City" 
                                        placeholder="Colombo 03" required 
                                        value={formData.city} onChange={handleInputChange}
                                    />
                                    
                     
                                    <div className="space-y-2 w-full">
                                        <label htmlFor="district" className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">
                                            District
                                        </label>
                                        <select
                                            id="district" name="district" required
                                            value={formData.district} onChange={handleInputChange}
                                            className="flex h-12 w-full rounded-sm border border-gray-300 bg-white px-4 py-2 text-sm text-[#0A192F] focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all"
                                        >
                                            <option value="" disabled>Select District</option>
                                            <option value="Colombo">Colombo</option>
                                            <option value="Gampaha">Gampaha</option>
                                            <option value="Kalutara">Kalutara</option>
                                            <option value="Kandy">Kandy</option>
                                            <option value="Galle">Galle</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>

                                    <Input 
                                        id="postalCode" name="postalCode" type="text" label="Postal Code" 
                                        placeholder="00300" required 
                                        value={formData.postalCode} onChange={handleInputChange}
                                    />
                                </div>
                            </section>

             
                            <div className="pt-6 flex justify-end">
                                <button 
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="bg-[#0A192F] text-white px-10 py-5 text-[11px] tracking-[0.2em] uppercase font-bold rounded-sm hover:bg-[#D4AF37] hover:text-[#0A192F] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-3"
                                >
                                    {isSubmitting ? "Processing..." : "Continue to Payment"}
                                    {!isSubmitting && <ChevronRight size={16} />}
                                </button>
                            </div>

                        </form>
                    </div>

        
                    <div className="w-full lg:w-2/5">
                        <div className="bg-[#F9F9F9] border border-gray-200 rounded-sm p-8 sticky top-32">
                            
                            <h2 className="text-lg font-semibold text-gray-700 mb-6">Order Summary</h2>
                            
                            <div className="space-y-4 mb-8 max-h-[40vh] overflow-y-auto pr-2">
                                {cartItems.map((item) => (
                                    <div key={item.id} className="flex gap-4 items-center">
                                        <div className="relative h-16 w-16 bg-white border border-gray-200 rounded-sm flex items-center justify-center p-1 shrink-0">
                                            <img src={item.image} alt={item.name} className="max-w-full max-h-full object-contain" />
                                            <span className="absolute -top-2 -right-2 bg-gray-500 text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center">
                                                {item.quantity}
                                            </span>
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="text-sm font-bold text-[#0A192F] line-clamp-1">{item.name}</h4>
                                            <p className="text-xs text-gray-500">{item.variant}</p>
                                        </div>
                                        <div className="text-sm font-semibold text-gray-700">
                                            {formatCurrency(item.price * item.quantity)}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="border-t border-gray-200 pt-6 space-y-4">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Subtotal</span>
                                    <span className="font-semibold text-gray-800">{formatCurrency(subtotal)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500 flex items-center gap-2"><Truck size={14} /> Shipping</span>
                                    <span className="font-semibold text-gray-800">{formatCurrency(shippingFee)}</span>
                                </div>
                            </div>

                            <div className="border-t border-gray-200 mt-6 pt-6 flex justify-between items-center">
                                <span className="text-lg font-semibold text-gray-700">Total</span>
                                <div className="text-right">
                                    <span className="text-xs text-gray-400 font-medium mr-2">LKR</span>
                                    <span className="text-2xl font-bold text-[#0A192F]">{formatCurrency(total)}</span>
                                </div>
                            </div>

                            <div className="mt-8 bg-white border border-[#D4AF37]/30 rounded-sm p-4 flex items-center gap-3 text-xs text-gray-600">
                                <ShieldCheck size={20} className="text-[#D4AF37]" />
                                <p>Your data is encrypted and secure. Payments are processed on the next step.</p>
                            </div>

                        </div>
                    </div>

                </div>
            </main>

            <Footer />
        </div>
    );
}
