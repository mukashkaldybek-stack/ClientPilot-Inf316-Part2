import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ClientPilot — Autonomous Micro-SaaS for Freelancers',
  description: 'Manage clients, track billable project time, and generate professional invoices instantly.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}

