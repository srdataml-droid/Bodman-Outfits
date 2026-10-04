import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Bodman Outfits",
    short_name: "Bodman",
    description: "Bespoke tailoring in Surulere, Lagos.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f9f9f9",
    theme_color: "#1b3e2d",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
