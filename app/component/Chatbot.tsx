"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Sparkles } from "lucide-react";

type Message = {
    id: string;
    text: string;
    sender: "user" | "bot";
};

export default function OpulentiaChatbot() {
    const [isOpen, setIsOpen] = React.useState(false);
    const [inputValue, setInputValue] = React.useState("");
    const [isTyping, setIsTyping] = React.useState(false);
    const messagesEndRef = React.useRef<HTMLDivElement>(null);
    
    // Generate a unique session ID once when the component mounts
    const [sessionId] = React.useState(() => `sid-${Math.random().toString(36).substr(2, 9)}`);

    const [messages, setMessages] = React.useState<Message[]>([
        {
            id: "initial-msg",
            text: "Welcome to Opulentia. How may our design concierge assist your vision today?",
            sender: "bot",
        },
    ]);

    React.useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isTyping]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim() || isTyping) return;

        const userText = inputValue;
        const userMsgId = `user-${Date.now()}`;
        
        setMessages((prev) => [...prev, { id: userMsgId, text: userText, sender: "user" }]);
        setInputValue("");
        setIsTyping(true);

        try {
            // Ensure this is your PRODUCTION URL from the n8n Webhook node
            const N8N_URL = "https://opulentia.app.n8n.cloud/webhook/0eee51b6-c58b-4891-99d4-90403a875a6d/chat";

            const response = await fetch(N8N_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: userText,
                    sessionId: sessionId,
                }),
            });

            if (!response.ok) throw new Error("Network response was not ok");

            const data = await response.json();

            setMessages((prev) => [...prev, {
                id: `bot-${Date.now()}`,
                text: data.output || "I am currently refining our records. Please try again shortly.",
                sender: "bot",
            }]);
        } catch (error) {
            console.error("Chat Error:", error);
            setMessages((prev) => [...prev, {
                // Unique ID prevents the "Duplicate Key" console error
                id: `error-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                text: "My apologies, the connection to our concierge is momentarily interrupted.",
                sender: "bot"
            }]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <>
            <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1, opacity: isOpen ? 0 : 1 }}
                whileHover={{ scale: 1.1 }}
                onClick={() => setIsOpen(true)}
                className="fixed bottom-8 right-8 z-[100] h-16 w-16 rounded-full shadow-[0_0_40px_rgba(212,175,55,0.4)] border border-[#D4AF37]/40 bg-[#0A192F] flex items-center justify-center"
            >
                <img src="/logo-with-text.png" alt="O" className="h-8 w-auto drop-shadow-[0_0_8px_rgba(212,175,55,0.5)]" />
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="fixed bottom-8 right-8 z-[110] w-[380px] h-[600px] max-h-[85vh] bg-white flex flex-col rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
                    >
                        <div className="bg-[#0A192F] px-6 py-5 flex items-center justify-between border-b border-[#D4AF37]/30">
                            <div className="flex items-center gap-3">
                                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                <h3 className="text-[#D4AF37] text-[10px] font-bold tracking-[0.3em] uppercase">Opulentia </h3>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="text-white/40 hover:text-white"><X size={20} /></button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 bg-[#F9F9F9] space-y-6">
                            {messages.map((msg) => (
                                <div key={msg.id} className={`flex w-full ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                                    <div className={`max-w-[85%] rounded-2xl px-5 py-3 text-sm font-light ${
                                        msg.sender === "user" ? "bg-[#0A192F] text-white rounded-br-none" : "bg-white border text-black rounded-bl-none shadow-sm"
                                    }`}>
                                        {msg.text}
                                    </div>
                                </div>
                            ))}
                            {isTyping && (
                                <div className="flex justify-start">
                                    <div className="bg-white border rounded-2xl rounded-bl-none px-5 py-3 flex gap-1">
                                        <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0 }} className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full" />
                                        <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full" />
                                        <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full" />
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        <form onSubmit={handleSendMessage} className="p-5 bg-[#F9F9F9] border-t flex gap-3">
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder="TYPE YOUR INQUIRY..."
                                className="flex-1 h-12 bg-gray border rounded-xl px-4 text-xs font-light focus:outline-none focus:ring-1 focus:ring-[#D4AF37] text-black placeholder:text-gray-400"
                            />
                            <button type="submit" disabled={!inputValue.trim() || isTyping} className="h-12 w-12 bg-[#D4AF37] rounded-xl flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-30">
                                <Send size={18} />
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}