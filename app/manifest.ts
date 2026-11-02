import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Rewe-Tracker Berlin",
    short_name: "Rewe-Tracker",
    description: "Berliner Rewes besuchen, bewerten und den besten finden.",
    lang: "de",
    start_url: "/",
    display: "standalone",
    background_color: "#f9f9f7",
    theme_color: "#cc071e",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
