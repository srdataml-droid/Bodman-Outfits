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
    /*
     * Declared rather than left to the file convention. `app/icon.svg` is
     * served correctly at /icon.svg, but the automatic <link rel="icon"> was
     * not being emitted into the head on this Next version, so the tab stayed
     * blank while the file itself was fine. Naming it here is one line, is
     * visible to whoever reads this next, and does not depend on convention
     * detection surviving a version bump.
     */
    icons: {
      icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
      shortcut: "/icon.svg",
      apple: "/icon.svg",
    },
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
