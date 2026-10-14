import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CS Odyssey: Zero to Hero 6-Month Mastery',
  description: 'An interactive, self-paced Computer Science & Systems learning platform for Grade 9 students and self-taught learners to achieve CS mastery in 6 months.',
  openGraph: {
    title: 'CS Odyssey: Zero to Hero 6-Month Mastery',
    description: 'An interactive, self-paced Computer Science & Systems learning platform for Grade 9 students and self-taught learners to achieve CS mastery in 6 months.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CS Odyssey: Zero to Hero 6-Month Mastery',
    description: 'An interactive, self-paced Computer Science & Systems learning platform for Grade 9 students and self-taught learners to achieve CS mastery in 6 months.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-cyan-500 selection:text-slate-950" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
