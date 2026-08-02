"use client";

import { usePathname } from "next/navigation";
import { WhatsAppIcon } from "./whatsapp-icon";

interface WhatsAppFloatingButtonProps {
  whatsappLink: string | null;
}

export function WhatsAppFloatingButton({ whatsappLink }: WhatsAppFloatingButtonProps): React.ReactElement | null {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;
  if (!whatsappLink) return null;

  return (
    <a
      href={whatsappLink}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="group fixed z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--everglade)] text-white shadow-[0_12px_28px_rgb(27_62_45_/_35%)] transition duration-300 hover:-translate-y-0.5 hover:bg-[var(--copper)] hover:shadow-[0_16px_32px_rgb(200_118_58_/_32%)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--copper)]"
      style={{
        bottom: "calc(1.5rem + env(safe-area-inset-bottom))",
        right: "calc(1.5rem + env(safe-area-inset-right))",
      }}
    >
      <WhatsAppIcon className="h-6 w-6 transition-transform duration-300 group-hover:scale-110" />
    </a>
  );
}
