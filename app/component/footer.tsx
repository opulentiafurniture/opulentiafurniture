"use client";

import * as React from "react";
import {
  Facebook,
  Youtube,
  Instagram,
  Linkedin,
  PhoneCall,
  Globe,
  Mail,
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Section = {
  title: string;
  links: string[];
};

const Footer: React.FC = () => {
  const footerSections: Section[] = [
    {
      title: "The Collective",
      links: [
        "About Us",
        "Our Artisans",
        "Milestones",
        "Board Of Directors",
        "Sustainability",
        "Investor Relations",
      ],
    },
    {
      title: "Resources",
      links: [
        "Digital Catalogue",
        "Care Guide",
        "Appliance Guide",
        "Project Portfolio",
        "Video Demos",
        "Brand Assets",
      ],
    },
    {
      title: "Services",
      links: [
        "Consultation",
        "Locations",
        "Private Viewing",
        "Installment Plans",
        "Logistics",
        "B2B Solutions",
      ],
    },
    {
      title: "Legal",
      links: [
        "Product Verification",
        "Privacy Policy",
        "Terms of Service",
        "Cookie Policy",
        "Whistleblowing",
        "Accessibility",
      ],
    },
  ];

  return (
    <footer
      id="Footer"
      className="w-full bg-[#030c1a] pt-24 pb-8 px-6 md:px-12 font-sans text-[#F3F4F6] border-t border-white/10"
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-10 pb-16 border-b border-white/10">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-start gap-4">
              <img
                src="/logo-with-text.png"
                alt="Opulentia logo"
                className="w-40 h-auto"
              />
            </div>

            <p className="text-[11px] leading-relaxed text-white uppercase tracking-[0.18em]">
              Elevating global living through bespoke craftsmanship and visionary
              interior design since 2005.
            </p>

            <div className="flex items-center gap-4">
              {[Facebook, Instagram, Youtube, Linkedin].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  aria-label={`Opulentia on ${Icon.displayName || Icon.name}`}
                  className="p-2 rounded-full border border-white/20 text-white hover:border-[#D4AF37] hover:text-[#D4AF37] hover:bg-white/5 transition-colors duration-200"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>

            <div className="space-y-3 text-sm text-white">
              <div className="flex items-center gap-2">
                <PhoneCall size={14} />
                <a
                  href="tel:+947234567890"
                  className="hover:text-[#D4AF37] transition-colors"
                >
                  +947 (234) 567-890
                </a>
              </div>

              <div className="flex items-center gap-2">
                <Mail size={14} />
                <a
                  href="mailto:hello@opulentia.com"
                  className="hover:text-[#D4AF37] transition-colors"
                >
                  hello@opulentia.com
                </a>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={14} />
                <span>Homagama, Pitipana Road, Sri Lanka</span>
              </div>

              <div className="flex items-center gap-2">
                <Globe size={14} />
                <a
                  href="https://opulentia.com"
                  className="hover:text-[#D4AF37] transition-colors"
                >
                  opulentia.com
                </a>
              </div>
            </div>
          </div>

          {footerSections.map((section) => (
            <div key={section.title} className="space-y-4">
              <h4 className="text-[10px] font-black text-white uppercase tracking-[0.28em] pb-1 border-b border-white/20 inline-block">
                {section.title}
              </h4>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-[11px] text-white/85 hover:text-[#D4AF37] transition-all duration-200 block"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-6">
        <div className="text-xs text-gray-500">

            © {new Date().getFullYear()} Opulentia. All rights reserved.
          </div>

          <div className="flex items-center gap-4">
            <a
              href="#"
              className="text-xs text-white/50 hover:text-[#D4AF37] transition-colors"
            >
              Privacy
            </a>
            <a
              href="#"
              className="text-xs text-white/50 hover:text-[#D4AF37] transition-colors"
            >
              Terms
            </a>
            <a
              href="#top"
              className="text-xs text-white/50 hover:text-[#D4AF37] transition-colors"
              aria-label="Back to top"
            >
              Back to top
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;