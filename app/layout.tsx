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
      data-theme="light"
      suppressHydrationWarning
      className={cn(plusJakarta.variable, jetbrainsMono.variable, "font-sans", geist.variable)}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('cs_odyssey_theme');if(t==='dark'){document.documentElement.classList.add('dark');document.documentElement.setAttribute('data-theme','dark');}else{document.documentElement.classList.remove('dark');document.documentElement.setAttribute('data-theme','light');}}catch(e){}})();`,
          }}
        />
      </head>
      <body
        className="min-h-screen bg-[#f7f7f8] text-slate-900 dark:bg-[#090D16] dark:text-slate-100 font-sans antialiased selection:bg-sky-500 selection:text-white dark:selection:bg-sky-400 dark:selection:text-slate-950"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
