import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { isConfigured } from "@/lib/env";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "FadeorFight: UFC picks, fight by fight", template: "%s · FadeorFight" },
  description: "UFC picks from Welly and Gordon on every fight, recaps after every card, and community pick'em.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,600;0,700;1,700&family=Barlow:wght@400;500;600&display=swap"
        />
      </head>
      <body>
        {!isConfigured && (
          <p className="demo-bar">
            Demo mode: these are sample fights and picks. Connect the database to go live.
          </p>
        )}
        <Header />
        <main className="wrap">{children}</main>
        <footer className="site-footer">
          <div className="wrap">
            <p>
              Picks are opinions, not guarantees. Bet only what you can afford to lose and only if
              you're of legal age where you live.
            </p>
            <p>© {new Date().getFullYear()} FadeorFight</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
