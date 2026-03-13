"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, Sofa, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import Navbar from "../component/navbar";
import Footer from "../component/footer";

const Button = React.forwardRef(({ className, variant = "default", ...props }: any, ref: any) => {
  const variants: any = {
    default: "bg-[#0A192F] text-white hover:bg-[#D4AF37] hover:text-[#0A192F]",
    outline: "border border-[#0A192F] text-[#0A192F] hover:bg-gray-100",
    gold: "bg-[#D4AF37] text-[#0A192F] font-bold hover:bg-white",
  };

  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center rounded-sm text-[10px] tracking-widest uppercase transition-all px-6 py-3",
        variants[variant],
        className
      )}
      {...props}
    />
  );
});

Button.displayName = "Button";

const VALUES = [
  {
    icon: Sparkles,
    title: "Timeless Design",
    text: "We curate furniture pieces that blend elegance, comfort, and lasting visual appeal for modern homes.",
  },
  {
    icon: Sofa,
    title: "Crafted Comfort",
    text: "Every collection is selected to bring warmth, functionality, and luxury into everyday living spaces.",
  },
  {
    icon: ShieldCheck,
    title: "Trusted Quality",
    text: "We focus on premium materials, durable craftsmanship, and thoughtful details that stand the test of time.",
  },
];

const STATS = [
  { value: "10+", label: "Years of Excellence" },
  { value: "5k+", label: "Happy Customers" },
  { value: "200+", label: "Luxury Pieces" },
  { value: "100%", label: "Style Focused" },
];

export default function AboutUsPage() {
  return (
    <div className="min-h-screen bg-white font-sans text-[#0A192F]">
      <Navbar />

      <section className="relative h-[78vh] min-h-[520px] overflow-hidden">
        <img
          src="/about-hero.jpeg"
          alt="Elegant furniture showroom"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/50" />

        <div className="relative z-10 max-w-7xl mx-auto h-full px-6 flex items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl text-white"
          >
            <p className="text-[11px] uppercase tracking-[0.45em] text-[#D4AF37] mb-5">About Opulentia</p>
            <h1 className="text-5xl md:text-7xl font-extralight uppercase tracking-[0.16em] leading-tight mb-6">
              Designed for Beautiful Living
            </h1>
            <p className="text-sm md:text-base text-white/85 max-w-2xl leading-7 mb-8">
              Opulentia was created to bring luxury furniture and timeless interior elegance into every home. We believe furniture should do more than fill a room. It should define comfort, reflect identity, and create memorable spaces.
            </p>
            <a href="#story">
              <Button variant="gold">Discover Our Story</Button>
            </a>
          </motion.div>
        </div>
      </section>

      <section id="story" className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
          >
            <p className="text-[10px] uppercase tracking-[0.45em] text-[#D4AF37] mb-4">Our Story</p>
            <h2 className="text-4xl md:text-5xl font-extralight uppercase tracking-[0.14em] mb-6">
              Where Luxury Meets Everyday Comfort
            </h2>
            <p className="text-sm text-gray-600 leading-8 mb-5">
              Founded with a passion for refined interiors, Opulentia is dedicated to curating furniture collections that elevate living, dining, and bedroom spaces. Our goal is to make elegant design feel welcoming, practical, and deeply personal.
            </p>
            <p className="text-sm text-gray-600 leading-8 mb-8">
              From statement sofas to serene bedroom pieces, each item is chosen for its craftsmanship, comfort, and timeless appeal. We focus on helping customers create homes that feel luxurious without losing warmth and functionality.
            </p>
            <a
              href="/"
              className="inline-flex items-center gap-2 uppercase tracking-[0.18em] text-[11px] text-[#0A192F] hover:text-[#D4AF37] transition-colors"
            >
              Explore Collections <ArrowRight size={14} />
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
            className="overflow-hidden h-[520px]"
          >
            <img
              src="/about-story.jpeg"
              alt="Luxury interior"
              className="w-full h-full object-cover"
            />
          </motion.div>
        </div>
      </section>

      <section className="bg-[#0A192F] py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12 text-center text-white">
            <p className="text-[10px] uppercase tracking-[0.45em] text-[#D4AF37] mb-4">Our Values</p>
            <h2 className="text-4xl md:text-5xl font-extralight uppercase tracking-[0.14em] mb-4">
              What Defines Us
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {VALUES.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="border border-white/10 bg-white/5 p-8 text-white"
                >
                  <Icon className="w-10 h-10 text-[#D4AF37] mb-5" />
                  <h3 className="text-xl font-semibold uppercase tracking-wider mb-3">{item.title}</h3>
                  <p className="text-sm text-white/75 leading-7">{item.text}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
              className="bg-[#F8F6F1] border border-[#E8DFC9] p-8 text-center"
            >
              <h3 className="text-3xl md:text-4xl font-bold text-[#0A192F] mb-2">{stat.value}</h3>
              <p className="text-[11px] uppercase tracking-[0.2em] text-gray-500">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 overflow-hidden">
          <div className="bg-[#D4AF37] text-[#0A192F] px-8 md:px-14 py-16 flex items-center">
            <div>
              <p className="text-[10px] uppercase tracking-[0.45em] mb-4">Our Mission</p>
              <h2 className="text-3xl md:text-4xl font-bold uppercase tracking-wide mb-5">
                To Turn Houses into Elegant Homes
              </h2>
              <p className="text-sm leading-8 text-[#0A192F]/80">
                We aim to inspire thoughtful living through premium furniture collections that bring beauty, comfort, and personality into every corner of the home.
              </p>
            </div>
          </div>

          <div className="bg-[#F7F7F7] px-8 md:px-14 py-16 flex items-center">
            <div>
              <p className="text-[10px] uppercase tracking-[0.45em] text-[#D4AF37] mb-4">Why Choose Us</p>
              <h2 className="text-3xl md:text-4xl font-bold uppercase tracking-wide mb-5 text-[#0A192F]">
                Curated Luxury with Lasting Value
              </h2>
              <p className="text-sm leading-8 text-gray-600 mb-8">
                Whether you are redesigning a single room or furnishing an entire home, Opulentia offers collections that are elegant, cohesive, and crafted to leave a lasting impression.
              </p>
              <a href="#Footer">
                <Button className="bg-[#0A192F] text-white hover:bg-[#D4AF37] hover:text-[#0A192F]">
                  Contact Us
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}