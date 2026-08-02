import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { WhatsAppFloatingButton } from "../components/whatsapp-floating-button";
import { getWhatsAppLink } from "../lib/shop-settings";

export const metadata: Metadata = {
  title: {
    default: "Atelier Haute",
    template: "%s | Atelier Haute",
  },
  description: "Bespoke tailoring from Lagos.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const whatsappLink = await getWhatsAppLink(
    "Hello Atelier Haute, I'd like to know more about your bespoke tailoring.",
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
