import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
// 1. Import your new Chatbot
import Chatbot from "./component/Chatbot"; // Adjust path as needed

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Opulentia",
  description: "Luxury Fine Furniture",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        
        {/* 2. Add it here so it floats on every page! */}
        <Chatbot />
      </body>
    </html>
  );
}