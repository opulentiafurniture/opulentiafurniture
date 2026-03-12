"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Message = {
    id: string;
    text: string;
    sender: "user" | "bot";
};

export default function Chatbot() {
    const [isOpen, setIsOpen] = React.useState(false);
    const [inputValue, setInputValue] = React.useState("");
    const [isTyping, setIsTyping] = React.useState(false);
    const messagesEndRef = React.useRef<HTMLDivElement>(null);

    const [messages, setMessages] = React.useState<Message[]>([
        {
            id: "1",
            text: "Welcome to Opulentia. How may our design concierge assist you today?",
            sender: "bot",
        },
    ]);

    React.useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isTyping]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim()) return;

        const newUserMsg: Message = {
            id: Date.now().toString(),
            text: inputValue,
            sender: "user",
        };
        
        setMessages((prev) => [...prev, newUserMsg]);
        setInputValue("");
        setIsTyping(true);

        setTimeout(() => {
            const botResponse: Message = {
                id: (Date.now() + 1).toString(),
                text: "Thank you for reaching out. One of our luxury interior specialists will review your request and connect with you shortly.",
                sender: "bot",
            };
            setMessages((prev) => [...prev, botResponse]);
            setIsTyping(false);
        }, 1500);
    };

    return (
        <>
            <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(true)}
                className={cn(
                    "fixed bottom-6 right-6 z-[100] h-16 w-16 rounded-full shadow-[0_0_30px_rgba(212,175,55,0.3)] border border-[#D4AF37]/50 overflow-hidden bg-[#0A192F] flex items-center justify-center transition-all",
                    isOpen ? "opacity-0 pointer-events-none" : "opacity-100"
                )}
                aria-label="Open chat"
            >
                <img 
                    src="/logo-with-text.png" 
                    alt="Chat with Opulentia" 
                    className="h-10 w-10 object-contain drop-shadow-[0_0_8px_rgba(212,175,55,0.5)]" 
                />
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="fixed bottom-6 right-6 z-[110] w-[350px] sm:w-[400px] h-[600px] max-h-[85vh] bg-white flex flex-col rounded-sm shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] border border-gray-200 overflow-hidden"
                    >
                        <div className="bg-[#0A192F] px-6 py-4 flex items-center justify-between border-b border-[#D4AF37]/30 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center border border-[#D4AF37]/50">
                                     <img src="/logo-with-text.png" alt="O" className="h-4 w-4 object-contain" />
                                </div>
                                <div>
                                    <h3 className="text-[#D4AF37] text-[11px] font-bold tracking-[0.2em] uppercase">Opulentia Concierge</h3>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                        <span className="text-white/60 text-[9px] uppercase tracking-wider">Online</span>
                                    </div>
                                </div>
                            </div>
                            <button 
                                onClick={() => setIsOpen(false)}
                                className="text-white/60 hover:text-white transition-colors p-1"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 bg-[#F9F9F9] space-y-6">
                            {messages.map((msg) => (
                                <div 
                                    key={msg.id} 
                                    className={cn(
                                        "flex w-full",
                                        msg.sender === "user" ? "justify-end" : "justify-start"
                                    )}
                                >
                                    <div 
                                        className={cn(
                                            "max-w-[80%] rounded-sm px-4 py-3 text-sm font-light leading-relaxed",
                                            msg.sender === "user" 
                                                ? "bg-[#0A192F] text-white rounded-br-none shadow-md" 
                                                : "bg-white border border-gray-100 text-gray-800 rounded-bl-none shadow-sm"
                                        )}
                                    >
                                        {msg.text}
                                    </div>
                                </div>
                            ))}
                            
                            {isTyping && (
                                <div className="flex w-full justify-start">
                                    <div className="bg-white border border-gray-100 rounded-sm rounded-bl-none px-4 py-3 shadow-sm flex items-center gap-1">
                                        <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0 }} className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full" />
                                        <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full" />
                                        <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full" />
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        <form 
                            onSubmit={handleSendMessage}
                            className="p-4 bg-white border-t border-gray-100 flex items-center gap-2 shrink-0"
                        >
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder="TYPE YOUR MESSAGE..."
                                className="flex-1 h-12 bg-gray-50 border border-gray-200 rounded-sm px-4 text-xs font-light text-[#0A192F] focus:outline-none focus:ring-1 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-all placeholder:text-[10px] placeholder:tracking-widest placeholder:uppercase"
                            />
                            <button
                                type="submit"
                                disabled={!inputValue.trim() || isTyping}
                                className="h-12 w-12 bg-[#D4AF37] text-[#0A192F] rounded-sm flex items-center justify-center hover:bg-yellow-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                            >
                                <Send size={16} className="-ml-1" />
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
