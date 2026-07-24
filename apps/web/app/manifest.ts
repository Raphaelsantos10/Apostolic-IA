import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Apostolic IA",
    short_name: "Apostolic IA",
    description: "Plataforma de estudos bíblicos em desenvolvimento.",
    start_url: "/",
    display: "standalone",
    background_color: "#F8FAFC",
    theme_color: "#174EA6",
    lang: "pt-PT",
    orientation: "any",
    categories: ["education", "books"],
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any"
      },
      {
        src: "/icon-maskable.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable"
      }
    ]
  };
}
