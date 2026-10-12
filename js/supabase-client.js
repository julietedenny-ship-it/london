import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./supabase-config.js";

let clientPromise;

export function createSiteClient() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error("Configure l’URL et la clé publique du projet Supabase dans js/supabase-config.js.");
  }

  if (!clientPromise) {
    clientPromise = import("https://esm.sh/@supabase/supabase-js@2").then(({ createClient }) =>
      createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    );
  }

  return clientPromise;
}

const supportHosts = {
  whatsapp: new Set(["wa.me", "api.whatsapp.com", "whatsapp.com", "www.whatsapp.com"]),
  telegram: new Set(["t.me", "telegram.me", "www.telegram.me"])
};

export function normalizeSupportUrl(value, channelId) {
  const trimmed = value.trim();
  if (!trimmed) return "";

  let url;
  try {
    url = new URL(trimmed);
  } catch {
    throw new Error("Entre une adresse URL complète et valide.");
  }

  if (
    url.protocol !== "https:" ||
    !supportHosts[channelId]?.has(url.hostname.toLowerCase()) ||
    url.username ||
    url.password ||
    url.port ||
    url.pathname === "/"
  ) {
    throw new Error("Utilise une adresse HTTPS valide de WhatsApp ou Telegram correspondant au canal.");
  }

  return url.href;
}
