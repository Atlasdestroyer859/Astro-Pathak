import type { Metadata } from 'next';
import {
  Cinzel,
  Cinzel_Decorative,
  Cormorant_Garamond,
  Noto_Sans_Devanagari,
} from 'next/font/google';
import './globals.css';

/* ── Fonts loaded by Next.js — zero FOUC, inlined into HTML ────── */
const cinzel = Cinzel({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-cinzel',       // matches var(--font-cinzel) in CSS
  display: 'swap',
});

const cinzelDeco = Cinzel_Decorative({
  subsets: ['latin'],
  weight: ['400', '700', '900'],
  variable: '--font-cinzel-deco',  // matches var(--font-cinzel-deco) in CSS
  display: 'swap',
});

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',    // matches var(--font-cormorant) in CSS
  display: 'swap',
});

const devanagari = Noto_Sans_Devanagari({
  subsets: ['devanagari'],
  weight: ['300', '400', '500'],
  variable: '--font-noto',         // matches var(--font-noto) in CSS
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Astro Pathak — Vedic Jyotish Consultation by Pandit H.R. Pathak',
  description:
    'Get authentic Vedic astrology consultation from Pandit H.R. Pathak with 25+ years of experience. Book Kundli Analysis, Marriage Compatibility, Career & Finance, Vastu, Numerology and more.',
  keywords:
    'vedic jyotish, kundli analysis, astrology consultation, pandit HR pathak, numerology, vastu shastra, horoscope',
  openGraph: {
    title: 'Astro Pathak — Vedic Jyotish Consultation',
    description: 'Authentic Vedic astrology by Pandit H.R. Pathak. Book online or in-person.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${cinzel.variable} ${cinzelDeco.variable} ${cormorant.variable} ${devanagari.variable}`}
    >
      {/* suppressHydrationWarning stops React noise from browser extensions */}
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
