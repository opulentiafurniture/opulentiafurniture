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
  const [cartCount, setCartCount] = React.useState(0);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const updateCartCount = React.useCallback(() => {
    try {
      const raw = localStorage.getItem("opulentia_cart") || "[]";
      const cart = JSON.parse(raw);

      const totalCount = Array.isArray(cart)
        ? cart.reduce((sum, item) => {
            const qty = Number(item.quantity ?? item.qty ?? 1);
            return sum + (Number.isFinite(qty) ? qty : 1);
          }, 0)
        : 0;

      setCartCount(totalCount);
    } catch (error) {
      console.error("Failed to read cart count:", error);
      setCartCount(0);
    }
  }, []);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  React.useEffect(() => {
    updateCartCount();

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    const handleCartUpdated = () => {
      updateCartCount();
    };

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === "opulentia_cart") {
        updateCartCount();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("cartUpdated", handleCartUpdated as EventListener);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("cartUpdated", handleCartUpdated as EventListener);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [updateCartCount]);

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
    return user.displayName || user.email?.split("@")[0] || "Account";
  };

  return (
    <nav className="w-full flex flex-col sticky top-0 z-[100] shadow-2xl">
      <div className="h-2 w-full bg-[#D4AF37] border-b border-black/20" />

      <div className="h-20 bg-[#0A192F] flex items-center">
        <div
          className="h-full px-8 flex items-center justify-center border-r border-white/10 relative overflow-hidden group cursor-pointer"
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
                  className={cn(
                    "transition-transform duration-300 hidden md:block",
                    isDropdownOpen && "rotate-180"
                  )}
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
            className="relative text-white hover:text-[#D4AF37] transition-colors p-2 rounded-full hover:bg-white/5"
            title="Cart"
          >
            <ShoppingCart size={22} strokeWidth={1.5} />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-[#D4AF37] text-[#0A192F] text-[10px] font-bold leading-none">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="h-1 w-full bg-[#7E650A]" />

      <div className="bg-white/95 backdrop-blur-md px-8 py-3 flex flex-col lg:flex-row justify-between items-center gap-4 border-b border-black/10">
        <div className="text-[10px] uppercase tracking-[0.2em] text-gray-500 hidden lg:block font-medium">
          Discover our latest collections
        </div>

        <div className="flex flex-col lg:flex-row items-center gap-6 w-full lg:w-auto">
          <button
            onClick={() => router.push("/Visualization")}
            className="flex items-center gap-2 bg-[#D4AF37] text-white px-5 py-2 text-[10px] tracking-widest uppercase rounded-sm font-bold hover:bg-[#B8860B] transition-all shadow-sm active:scale-95"
          >
            3D Visualization
          </button>

          <form
            method="get"
            action="/search"
            role="search"
            className="relative w-full max-w-xs"
          >
            <input
              id="navbar-search"
              name="q"
              type="search"
              placeholder="SEARCH CATALOGUE..."
              className="pl-10 pr-4 h-10 w-full text-[10px] tracking-widest uppercase bg-gray-50 border border-gray-200 rounded-md placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition"
            />
            <Search className="absolute left-3 top-3 text-gray-400" size={14} />
          </form>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;