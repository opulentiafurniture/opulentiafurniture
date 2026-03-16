"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation"; 
import { cn } from "../../lib/utils";
import { auth, db } from "@/lib/firebase"; 
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

const Button = React.forwardRef(({ className, variant = "gold", isLoading, children, ...props }: any, ref) => {
  const variants: any = {
    gold: "bg-[#D4AF37] text-[#0A192F] hover:bg-yellow hover:shadow-[0_0_30px_rgba(212,175,55,0.5)]",
    ghost: "border border-white/10 text-white/60 hover:text-white hover:bg-yellow-500/5",
  };
  return (
    <button 
      ref={ref} 
      className={cn(
        "group relative overflow-hidden inline-flex items-center justify-center rounded-sm text-[10px] font-bold uppercase tracking-[0.3em] transition-all duration-500 disabled:opacity-50 h-14 px-8", 
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
Button.displayName = "Button";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    id?: string;
    className?: string;
    label?: React.ReactNode;
    error?: string | false | null;
    helpText?: React.ReactNode;
    suffix?: React.ReactNode; 
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ id, className, label, error, helpText, suffix, ...props }, ref) => (
    <div className="space-y-2 w-full group">
        <div className="flex justify-between items-center px-1">
            <label htmlFor={id} className={cn(
                "text-[9px] text-white/30 uppercase tracking-[0.2em] transition-colors",
                (error ? "text-red-300" : "group-focus-within:text-[#D4AF37]")
            )}>
                {label}
            </label>
        </div>
        
        <div className="relative w-full">
            <input 
                id={id}
                ref={ref}
                aria-invalid={!!error}
                aria-describedby={error ? `${id}-error` : helpText ? `${id}-help` : undefined}
                className={cn(
                    "flex h-12 w-full rounded-sm border px-4 py-2 text-sm placeholder:text-white/5 focus:outline-none transition-all duration-300",
                    "bg-white/[0.03] text-white border-white/10 focus:border-[#D4AF37]/50 focus:bg-white/[0.07]",
                    error ? "border-red-400 bg-white/[0.025] focus:border-red-400" : "",
                    suffix ? "pr-12" : "",
                    className
                )} 
                {...props} 
            />
            {suffix && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center">
                    {suffix}
                </div>
            )}
        </div>
     
        {error ? (
            <p id={`${id}-error`} className="text-[11px] text-red-400 mt-1">{error}</p>
        ) : helpText ? (
            <p id={`${id}-help`} className="text-[11px] text-white/40 mt-1">{helpText}</p>
        ) : null}
    </div>
));
Input.displayName = "Input";

const ImageSlider = ({ images }: { images: string[] }) => {
  const [index, setIndex] = React.useState(0);
  React.useEffect(() => {
    const timer = setInterval(() => setIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1)), 7000);
    return () => clearInterval(timer);
  }, [images.length]);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1.05 }}
          exit={{ opacity: 0, filter: "blur(0px)" }}
          transition={{ duration: 1, ease: "linear" }}
          className="absolute inset-0"
        >
          <img src={images[index]} className="w-full h-full object-cover" alt="Luxury Interior" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#030812]/20 via-transparent to-[#030812]" />
          <div className="absolute inset-0 bg-[#0A192F]/40 mix-blend-multiply" />
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default function OpulentiaSignUp() {
  const router = useRouter();

  const [isLoading, setIsLoading] = React.useState(false);
  const [showPass, setShowPass] = React.useState(false);
  const [showConfirmPass, setShowConfirmPass] = React.useState(false);

  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");

  const [nameError, setNameError] = React.useState<string | false | null>(false);
  const [emailError, setEmailError] = React.useState<string | false | null>(false);
  const [passwordError, setPasswordError] = React.useState<string | false>(false);
  const [confirmPasswordError, setConfirmPasswordError] = React.useState<string | false>(false);

  const images = ["/slide.jpg", "/slide1.jpg", "/slide3.png"];

  const validateEmail = (v: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

  const resetErrors = () => {
    setNameError(false);
    setEmailError(false);
    setPasswordError(false);
    setConfirmPasswordError(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    resetErrors();

    let ok = true;

    if (!name.trim()) {
      setNameError("Full name is required.");
      ok = false;
    }

    if (!validateEmail(email)) {
      setEmailError("Please enter a valid email address.");
      ok = false;
    }

    if (!password.trim()) {
      setPasswordError("Password is required.");
      ok = false;
    } else if (password.trim().length < 8) {
      setPasswordError("Password must be at least 8 characters.");
      ok = false;
    }

    if (password !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match.");
      ok = false;
    }

    if (!ok) return;

    setIsLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      if (userCredential.user) {
        await updateProfile(userCredential.user, {
          displayName: name.trim()
        });

        // Save profile data into Firestore so the profile page can reliably display the user name
        await setDoc(doc(db, "users", userCredential.user.uid), {
          name: name.trim(),
          displayName: name.trim(),
          email,
          role: "user",
          createdAt: serverTimestamp(),
        });

        // Ensure new users start with a clean cart in localStorage
        try {
          localStorage.removeItem("opulentia_cart");
        } catch (error) {
          console.warn("Could not clear cart on signup:", error);
        }
      }
      
      router.push("/"); 
      
    } catch (err: any) {
      console.error("Firebase SignUp Error:", err);
      if (err?.code === "auth/email-already-in-use") {
        setEmailError("An account with this email already exists.");
      } else if (err?.code === "auth/invalid-email") {
        setEmailError("The email address is invalid.");
      } else {
        setEmailError("The authentication service is currently unreachable.");
      }
      setIsLoading(false);
    } 
  };

  return (
    <div className="min-h-screen w-full bg-[#030c1a] flex items-center justify-center p-4 md:p-8 font-sans selection:bg-[#D4AF37] selection:text-[#0A192F]">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-7xl h-[820px] grid grid-cols-1 lg:grid-cols-2 rounded-[48px] overflow-hidden shadow-[0_50px_120px_-20px_rgba(0,0,0,1)] border border-white/5 bg-white/[0.01] backdrop-blur-3xl"
      >
        
        <div className="relative hidden lg:block overflow-hidden border-r border-black">
          <ImageSlider images={images} />

          <div className="absolute inset-0 flex flex-col items-center justify-center p-20">
            <motion.div
              whileHover={{ y: -10, scale: 1.02 }}
              className="relative z-20 bg-black/40 border border-white/10 rounded-[40px] p-12 flex flex-col items-center text-center shadow-[0_30px_60px_rgba(0,0,0,0.5)]"
              style={{ backdropFilter: "blur(1px)", WebkitBackdropFilter: "blur(1px)" }}
            >
              <img src="/logo-with-text.png" className="w-60 mb-8 drop-shadow-[0_0_30px_rgba(212,175,55,0.3)]" alt="Opulentia" />
              <div className="h-[1px] w-20 bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-transparent mb-6" />
              <p className="text-[#D4AF37] text-[10px] tracking-[0.7em] uppercase font-semibold">Elevating Interior Vision</p>
            </motion.div>
          </div>
        </div>
        
        <div className="flex flex-col items-center justify-center p-12 lg:p-20 relative overflow-y-auto no-scrollbar">
          <div className="w-full max-w-sm space-y-8">
            <header className="space-y-2">
              <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-4xl font-extralight tracking-tighter text-white uppercase leading-none"
              >
                CREATE ACCOUNT
              </motion.h1>
              <p className="text-white text-[11px] tracking-[0.4em] uppercase font-light">Register to Opulentia </p>
            </header>

            <form className="space-y-5" onSubmit={handleSignUp} noValidate>
              <Input
                label="Full Name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e: any) => {
                  setName(e.target.value);
                  if (nameError) setNameError(false);
                }}
                error={nameError}
              />

              <Input
                label="Email Address"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e: any) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError(false);
                }}
                error={emailError}
              />

              <Input
                label="Password"
                type={showPass ? "text" : "password"}
                placeholder="Create a password"
                value={password}
                onChange={(e: any) => {
                  setPassword(e.target.value);
                  if (passwordError) setPasswordError(false);
                }}
                error={passwordError}
                suffix={
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="text-white/10 hover:text-[#7E650A] transition-colors p-1"
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
              />

              <Input
                label="Confirm Password"
                type={showConfirmPass ? "text" : "password"}
                placeholder="Repeat your password"
                value={confirmPassword}
                onChange={(e: any) => {
                  setConfirmPassword(e.target.value);
                  if (confirmPasswordError) setConfirmPasswordError(false);
                }}
                error={confirmPasswordError}
                suffix={
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="text-white/10 hover:text-[#7E650A] transition-colors p-1"
                  >
                    {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
              />

              <div className="pt-4">
                <Button className="w-full" isLoading={isLoading} type="submit">
                  Sign Up <ArrowRight className="ml-3 group-hover:translate-x-2 transition-transform" size={16} />
                </Button>
              </div>
            </form>

            <footer className="pt-6 text-center border-t border-white/5">
              <p className="text-[10px] text-white/20 tracking-[0.3em] uppercase">
                Already have an account?{' '}
                <a
                  href="/csignin"
                  className="text-[#D4AF37] cursor-pointer hover:text-white transition-colors underline underline-offset-8 decoration-[#7E650A]/30"
                >
                  Sign In
                </a>
              </p>
            </footer>
          </div>
        </div>
      </motion.div>
    </div>
  );
}