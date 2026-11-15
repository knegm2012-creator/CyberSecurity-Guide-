import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, JetBrains_Mono, Geist } from 'next/font/google';
import './globals.css';
import { cn } from "@/lib/utils";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'CS Odyssey: Zero to Hero A–Z Computer Science Mastery',
  description:
    'A complete 16-stage A-to-Z Computer Science & Systems Engineering workbench from binary & Python fundamentals through C/C++, Go, x86-64, cybersecurity, DSA, compilers, cloud native SRE, and AI/HPC systems.',
  openGraph: {
    title: 'CS Odyssey: Zero to Hero A–Z Computer Science Mastery',
    description:
      'A complete 16-stage A-to-Z Computer Science & Systems Engineering workbench from binary & Python fundamentals through C/C++, Go, x86-64, cybersecurity, DSA, compilers, cloud native SRE, and AI/HPC systems.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CS Odyssey: Zero to Hero A–Z Computer Science Mastery',
    description:
      'A complete 16-stage A-to-Z Computer Science & Systems Engineering workbench from binary & Python fundamentals through C/C++, Go, x86-64, cybersecurity, DSA, compilers, cloud native SRE, and AI/HPC systems.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={cn("dark", plusJakarta.variable, jetbrainsMono.variable, "font-sans", geist.variable)}
    >
      <body
        className="min-h-screen bg-[#090D16] text-slate-100 font-sans antialiased selection:bg-sky-400 selection:text-slate-950"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
