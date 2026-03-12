"use client";

import * as React from "react";
import { User, ShoppingCart, Search, LogOut, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";


import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";

const Navbar = () => {
  const router = useRouter();
  const [user, setUser] = React.useState<any>(null);
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);


  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setIsDropdownOpen(false); 
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Dining", href: "/dining" },
    { name: "Living", href: "/living" },
    { name: "Bedroom", href: "/bedroom" },
    { name: "About", href: "/about" },
    { name: "Contact", href: "/#Footer" }, 
  ];


  const getDisplayName = () => {
    if (!user) return "";
    return user.displayName || user.email?.split('@')[0] || "Account";
  };

  return (
    <nav className="w-full flex flex-col sticky top-0 z-[100] shadow-2xl">
   
      <div className="h-2 w-full bg-[#D4AF37] border-b border-black/20" />

      <div className="h-20 bg-[#0A192F] flex items-center">
        
        <div 
          className="h-full px-8 flex items-center justify-center border-r relative overflow-hidden group cursor-pointer" 
          onClick={() => router.push("/")}
        >
          <img 
            src="/logo-with-text.png" 
            alt="Opulentia" 
            className="h-14 w-auto relative z-10 drop-shadow-[0_0_10px_rgba(212,175,55,0.3)]"
          />
        </div>

        <div className="flex-1 flex justify-center items-center gap-12">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="text-white text-[11px] tracking-[0.25em] uppercase font-light hover:text-[#D4AF37] transition-all duration-300 relative group"
            >
              {link.name}
              <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-[#D4AF37] transition-all duration-500 group-hover:w-full" />
            </a>
          ))}
        </div>

        <div className="flex items-center gap-6 px-10">
          
       
          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 text-white hover:text-[#D4AF37] transition-colors p-2 rounded-sm hover:bg-white/5"
              >
                <User size={22} strokeWidth={1.5} />
                <span className="text-[11px] tracking-widest uppercase hidden md:block">
                  {getDisplayName()}
                </span>
                <ChevronDown 
                  size={14} 
                  className={cn("transition-transform duration-300 hidden md:block", isDropdownOpen && "rotate-180")} 
                />
              </button>

           
              {isDropdownOpen && (
                <div className="absolute right-0 mt-4 w-48 bg-white shadow-xl rounded-sm border border-black/10 overflow-hidden z-[110] py-1">
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      router.push("/profile"); 
                    }}
                    className="w-full text-left px-4 py-3 text-[10px] tracking-widest uppercase text-[#0A192F] hover:bg-gray-50 transition-colors flex items-center gap-3"
                  >
                    <User size={14} /> Profile
                  </button>
                  
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left px-4 py-3 text-[10px] tracking-widest uppercase text-red-600 hover:bg-red-50 transition-colors flex items-center gap-3 border-t border-gray-100"
                  >
                    <LogOut size={14} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
         
            <button
              onClick={() => router.push("/csignin")}
              className="text-white hover:text-[#D4AF37] transition-colors p-2 rounded-full hover:bg-white/5"
              title="Sign in"
            >
              <User size={22} strokeWidth={1.5} />
            </button>
          )}

          <button
            onClick={() => router.push("/cart")}
            className="text-white hover:text-[#D4AF37] transition-colors p-2 rounded-full hover:bg-white/5"
            title="Cart"
          >
            <ShoppingCart size={22} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      <div className="h-2 w-full bg-[#7E650A]" />

      <div className="bg-white backdrop-blur-md px-6 py-3 flex flex-col lg:flex-row justify-between items-center gap-3 border-b border-black sticky top-[60px] z-[90]">
        <div className="text-[9px] uppercase tracking-widest text-black hidden lg:block">
          Discover our latest collections
        </div>

        <form
          method="get"
          action="/search"
          role="search"
          className="relative w-full max-w-xs"
          aria-label="Search catalogue"
        >
          <label htmlFor="navbar-search" className="sr-only">
            Search catalogue
          </label>

          <input
            id="navbar-search"
            name="q"
            type="search"
            aria-label="Search catalogue"
            placeholder="SEARCH CATALOGUE..."
            className="pl-10 pr-10 h-9 w-full text-[10px] tracking-widest uppercase bg-transparent border border-b border-black rounded placeholder-black/50 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition"
          />

          <Search className="absolute left-3 top-2.5 text-gray-400" size={14} />

          <button
            type="reset"
            aria-label="Clear search"
            className="absolute right-2 top-1.5 text-gray-500 hover:text-gray-700 p-1 opacity-0 focus:opacity-100 focus:outline-none transition-opacity"
            title="Clear"
          >
           <span aria-hidden>×</span>
          </button>
        </form>
      </div>
    </nav>
  );
};

export default Navbar;