import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, DM_Sans, JetBrains_Mono, Geist } from 'next/font/google';
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
  title: 'CS Odyssey: Zero to Hero 6-Month Mastery',
  description:
    'An interactive, self-paced Computer Science & Systems learning platform for Grade 9 students and self-taught learners to achieve CS mastery in 6 months.',
  openGraph: {
    title: 'CS Odyssey: Zero to Hero 6-Month Mastery',
    description:
      'An interactive, self-paced Computer Science & Systems learning platform for Grade 9 students and self-taught learners to achieve CS mastery in 6 months.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CS Odyssey: Zero to Hero 6-Month Mastery',
    description:
      'An interactive, self-paced Computer Science & Systems learning platform for Grade 9 students and self-taught learners to achieve CS mastery in 6 months.',
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
