"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    if (process.env.NODE_ENV !== "production") {
      const clearDevelopmentCache = async () => {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((registration) => registration.unregister()));

        if ("caches" in window) {
          const keys = await caches.keys();
          await Promise.all(
            keys
              .filter((key) => key.startsWith("apostolic-ia-"))
              .map((key) => caches.delete(key))
          );
        }
      };

      void clearDevelopmentCache();
      return;
    }

    const register = async () => {
      try {
        await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      } catch {
        // A aplicação continua utilizável online se o registro falhar.
      }
    };

    void register();
  }, []);

  return null;
}
