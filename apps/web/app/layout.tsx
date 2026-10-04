import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { WhatsAppFloatingButton } from "../components/whatsapp-floating-button";
import { getShopName, getWhatsAppLink } from "../lib/shop-settings";
import { SITE_URL } from "../lib/site-url";

// Async so the browser tab title uses the Admin-editable shop name rather
// than a constant baked in at build time.
export async function generateMetadata(): Promise<Metadata> {
  const shopName = await getShopName();
  return {
    metadataBase: new URL(SITE_URL),
    applicationName: shopName,
    manifest: "/manifest.webmanifest",
    verification: { google: "SJ2BNPLq6xTJpQU0y8-UpCtljlT6nSroCl1qQpLyBY0" },
    title: { default: `${shopName} | Bespoke Tailoring in Lagos`, template: `%s | ${shopName}` },
    description: "Bespoke suits, agbada, kaftans and modern menswear tailored in Surulere, Lagos. Book a fitting with Bodman Outfits.",
    openGraph: {
      type: "website",
      locale: "en_NG",
      siteName: shopName,
      title: `${shopName} | Bespoke Tailoring in Lagos`,
      description: "Bespoke tailoring in Surulere, Lagos. Explore suits, agbada, kaftans and modern menswear.",
      url: SITE_URL,
    },
    // Explicit links cover Google Search, browser tabs, and iOS home screens.
    icons: {
      icon: [
        { url: "/icons/favicon-48.png", type: "image/png", sizes: "48x48" },
        { url: "/icon.svg", type: "image/svg+xml", sizes: "any" },
        { url: "/icons/icon-192.png", type: "image/png", sizes: "192x192" },
      ],
      shortcut: "/icons/favicon-48.png",
      apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#1b3e2d",
};

export default async function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const whatsappLink = await getWhatsAppLink(
    "Hello Bodman Outfits, I'd like to know more about your bespoke tailoring.",
  );

  return (
    <html lang="en">
      <head>
        {/* Without JavaScript nothing would ever reveal scroll-revealed
            content, so force it visible rather than leaving it hidden. This
            covers staggered headings too: they are server-rendered already
            split and already marked hidden, so without this rule a no-JS
            reader would get a page whose main headings never appear. */}
        <noscript>
          {/* eslint-disable-next-line react/no-danger */}
          <style
            dangerouslySetInnerHTML={{
              __html:
                "[data-reveal]{opacity:1!important;transform:none!important}[data-stagger-word]{opacity:1!important;transform:none!important}",
            }}
          />
        </noscript>
      </head>
      <body>
        {children}
        <WhatsAppFloatingButton whatsappLink={whatsappLink} />
      </body>
    </html>
  );
}
