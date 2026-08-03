import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { WhatsAppFloatingButton } from "../components/whatsapp-floating-button";
import { getShopName, getWhatsAppLink } from "../lib/shop-settings";

// Async so the browser tab title uses the Admin-editable shop name rather
// than a constant baked in at build time.
export async function generateMetadata(): Promise<Metadata> {
  const shopName = await getShopName();
  return {
    title: { default: shopName, template: `%s | ${shopName}` },
    description: "Bespoke tailoring from Lagos.",
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const whatsappLink = await getWhatsAppLink(
    "Hello Bodman Outfits, I'd like to know more about your bespoke tailoring.",
  );

  return (
    <html lang="en">
      <head>
        {/* Without JavaScript nothing would ever reveal scroll-revealed
            content, so force it visible rather than leaving it hidden. */}
        <noscript>
          {/* eslint-disable-next-line react/no-danger */}
          <style dangerouslySetInnerHTML={{ __html: '[data-reveal]{opacity:1!important;transform:none!important}' }} />
        </noscript>
      </head>
      <body>
        {children}
        <WhatsAppFloatingButton whatsappLink={whatsappLink} />
      </body>
    </html>
  );
}
