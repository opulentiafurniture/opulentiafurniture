"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Mail, Shield, Calendar, Loader2, Package, Heart, Edit2, ShoppingBag, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation"; 
import { cn } from "@/lib/utils";


import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, updateProfile } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import Navbar from "../component/navbar";
import Footer from "../component/footer";

const Button = React.forwardRef(({ className, variant = "gold", isLoading, children, ...props }: any, ref) => {
    const variants: any = {
        gold: "bg-[#D4AF37] text-[#0A192F] hover:bg-yellow-500 hover:shadow-[0_0_20px_rgba(212,175,55,0.4)]",
        ghost: "border border-white/10 text-white hover:bg-white/5",
        danger: "border border-red-500/50 text-red-400 hover:bg-red-500/10",
    };
    return (
        <button 
            ref={ref} 
            className={cn(
                "group relative overflow-hidden inline-flex items-center justify-center rounded-sm text-[10px] font-bold uppercase tracking-[0.3em] transition-all duration-500 disabled:opacity-50 px-6 py-3", 
                variants[variant], 
                className
            )} 
            {...props}
        >
            <span className="relative z-10 flex items-center gap-2">
                {isLoading ? <Loader2 className="animate-spin" size={16} /> : children}
            </span>
         </button>
    );
});

export default function OpulentiaProfile() {
  const router = useRouter();
  const [userData, setUserData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  const [activeTab, setActiveTab] = React.useState("Profile Details");

  const [isEditing, setIsEditing] = React.useState(false);
  const [editName, setEditName] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const data = docSnap.data();
            setUserData(data);
            setEditName(data.name || data.displayName || ""); 
          } else {
            setUserData({
              email: user.email,
              displayName: user.displayName || user.email?.split('@')[0],
              role: "user"
            });
            setEditName(user.displayName || user.email?.split('@')[0] || "");
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        } finally {
          setLoading(false);
        }
      } else {
        router.push("/csignin");
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleSaveProfile = async () => {
    if (!auth.currentUser) return;
    
    setIsSaving(true);
    try {
      await updateProfile(auth.currentUser, { displayName: editName });
      const docRef = doc(db, "users", auth.currentUser.uid);
      await updateDoc(docRef, { name: editName, displayName: editName });

      setUserData((prev: any) => ({ ...prev, name: editName, displayName: editName }));
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update profile", error);
      alert("Failed to update profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "Recently";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(date);
  };

  if (loading && !userData) {
    return (
      <div className="min-h-screen bg-[#030c1a] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#D4AF37]" size={40} />
      </div>
    );
  }



  const renderProfileDetails = () => (
    <>
      <header className="mb-10 border-b border-white/10 pb-6 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-extralight tracking-tighter uppercase mb-2">My Profile</h1>
          <p className="text-[11px] text-[#D4AF37] tracking-[0.3em] uppercase">Manage your Opulentia account</p>
        </div>
        
        <div className="hidden sm:flex gap-3">
          {isEditing ? (
            <>
              <Button variant="ghost" onClick={() => setIsEditing(false)} disabled={isSaving}>Cancel</Button>
              <Button variant="gold" onClick={handleSaveProfile} isLoading={isSaving}>Save</Button>
            </>
          ) : (
            <Button variant="ghost" onClick={() => setIsEditing(true)}>
              <Edit2 size={14} /> Edit Profile
            </Button>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
   
        <div className="space-y-2 group">
          <label className="text-[9px] text-white/30 uppercase tracking-[0.2em] flex items-center gap-2">
            <User size={12} /> Full Name
          </label>
          {isEditing ? (
            <input 
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="h-12 w-full rounded-sm border border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none bg-white/5 px-4 py-3 text-sm font-light text-white transition-all"
              placeholder="Enter your name"
              autoFocus
            />
          ) : (
            <div className="h-12 w-full rounded-sm border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-light">
              {userData?.displayName || userData?.name || "Opulentia Guest"}
            </div>
          )}
        </div>


        <div className="space-y-2">
          <label className="text-[9px] text-white/30 uppercase tracking-[0.2em] flex items-center gap-2">
            <Mail size={12} /> Email Address
          </label>
          <div className="h-12 w-full rounded-sm border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-light text-white/40 cursor-not-allowed">
            {userData?.email}
          </div>
        </div>

 
        <div className="space-y-2">
          <label className="text-[9px] text-white/30 uppercase tracking-[0.2em] flex items-center gap-2">
            <Shield size={12} /> Account Tier
          </label>
          <div className="h-12 w-full rounded-sm border border-[#D4AF37]/30 bg-[#D4AF37]/5 px-4 py-3 text-[11px] font-bold tracking-widest uppercase text-[#D4AF37] flex items-center">
            {userData?.role === "admin" ? "Administrator" : "Standard Member"}
          </div>
        </div>


        <div className="space-y-2">
          <label className="text-[9px] text-white/30 uppercase tracking-[0.2em] flex items-center gap-2">
            <Calendar size={12} /> Member Since
          </label>
          <div className="h-12 w-full rounded-sm border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-light">
            {formatDate(userData?.createdAt)}
          </div>
        </div>
      </div>
      
      <div className="mt-8 sm:hidden flex flex-col gap-3">
        {isEditing ? (
          <>
            <Button variant="gold" className="w-full" onClick={handleSaveProfile} isLoading={isSaving}>Save Changes</Button>
            <Button variant="ghost" className="w-full" onClick={() => setIsEditing(false)} disabled={isSaving}>Cancel</Button>
          </>
        ) : (
          <Button variant="ghost" className="w-full" onClick={() => setIsEditing(true)}>
            <Edit2 size={14} /> Edit Profile
          </Button>
        )}
      </div>
    </>
  );

  const renderOrderHistory = () => (
    <>
      <header className="mb-10 border-b border-white/10 pb-6">
        <h1 className="text-3xl font-extralight tracking-tighter uppercase mb-2">Order History</h1>
        <p className="text-[11px] text-[#D4AF37] tracking-[0.3em] uppercase">Track and manage your purchases</p>
      </header>
  
      <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-white/10 rounded-sm bg-white/[0.01]">
        <div className="h-16 w-16 rounded-full bg-white/5 flex items-center justify-center mb-6">
          <Package size={24} className="text-[#D4AF37]" />
        </div>
        <h3 className="text-sm font-bold tracking-widest uppercase mb-2">No Orders Yet</h3>
        <p className="text-[11px] text-white/40 tracking-wider mb-8 max-w-xs">You haven't placed any orders with Opulentia. Discover our latest collections to elevate your space.</p>
        <Button onClick={() => router.push("/")}>
          Start Shopping <ArrowRight size={14} className="ml-2" />
        </Button>
      </div>
    </>
  );

  const renderWishlist = () => (
    <>
      <header className="mb-10 border-b border-white/10 pb-6">
        <h1 className="text-3xl font-extralight tracking-tighter uppercase mb-2">My Wishlist</h1>
        <p className="text-[11px] text-[#D4AF37] tracking-[0.3em] uppercase">Curate your perfect interior</p>
      </header>

      <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-white/10 rounded-sm bg-white/[0.01]">
        <div className="h-16 w-16 rounded-full bg-white/5 flex items-center justify-center mb-6">
          <Heart size={24} className="text-[#D4AF37]" />
        </div>
        <h3 className="text-sm font-bold tracking-widest uppercase mb-2">Your wishlist is empty</h3>
        <p className="text-[11px] text-white/40 tracking-wider mb-8 max-w-xs">Save your favorite luxury pieces here to easily find them later or share with your designer.</p>
        <Button onClick={() => router.push("/")}>
          Explore Collections <ArrowRight size={14} className="ml-2" />
        </Button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[#030c1a] font-sans text-white selection:bg-[#D4AF37] selection:text-[#0A192F] flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-12 lg:py-20 flex flex-col lg:flex-row gap-12">

        <aside className="w-full lg:w-64 space-y-2 shrink-0">
          <h2 className="text-[10px] text-white/40 uppercase tracking-[0.3em] mb-6 px-4">Account Menu</h2>
          <nav className="space-y-1">
            {[
              { name: "Profile Details", icon: User },
              { name: "Order History", icon: Package },
              { name: "Wishlist", icon: Heart },
            ].map((item) => (
              <button 
                key={item.name}
                onClick={() => setActiveTab(item.name)}
                className={cn(
                  "w-full flex items-center gap-4 px-4 py-3 text-[11px] tracking-widest uppercase transition-all rounded-sm",
                  activeTab === item.name 
                    ? "bg-[#D4AF37]/10 text-[#D4AF37] border-l-2 border-[#D4AF37]" 
                    : "text-white/60 hover:text-white hover:bg-white/5 border-l-2 border-transparent"
                )}
              >
                <item.icon size={16} />
                {item.name}
              </button>
            ))}
          </nav>
        </aside>

        <section className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div 
              key={activeTab} 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-white/[0.02] border border-white/10 rounded-2xl p-8 lg:p-12 backdrop-blur-md min-h-[500px]"
            >
              {activeTab === "Profile Details" && renderProfileDetails()}
              {activeTab === "Order History" && renderOrderHistory()}
              {activeTab === "Wishlist" && renderWishlist()}
            </motion.div>
          </AnimatePresence>
        </section>

      </main>

      <Footer />
    </div>
  );
}