import { createSiteClient, normalizeSupportUrl } from "./supabase-client.js";

const channels = [
  { id: "whatsapp", label: "WhatsApp", url: "" },
  { id: "telegram", label: "Telegram", url: "" }
];
const status = document.querySelector("#supportChannelsStatus");
let channelsLoaded = false;

for (const channel of channels) {
  for (const button of document.querySelectorAll(`[data-support-channel="${channel.id}"]`)) {
    button.addEventListener("click", async () => {
      if (channel.url) {
        window.open(channel.url, "_blank", "noopener,noreferrer");
        return;
      }

      if (channelsLoaded) {
        status.textContent = `${channel.label} is not configured yet. Please check back later.`;
        document.querySelector("#contact").scrollIntoView({ behavior: "smooth" });
        return;
      }

      const pendingTab = window.open("about:blank", "_blank");
      if (!pendingTab) {
        status.textContent = `Loading the ${channel.label} link. Please click the button again in a moment.`;
        return;
      }

      pendingTab.opener = null;
      status.textContent = `Loading the ${channel.label} link…`;
      await channelsPromise;

      if (channel.url) {
        pendingTab.location.href = channel.url;
      } else {
        pendingTab.close();
        status.textContent = `${channel.label} is not configured yet. Please check back later.`;
      }
    });
  }
}

async function loadSupportChannels() {
  try {
    const supabase = await createSiteClient();
    const { data, error } = await supabase
      .from("site_support_channels")
      .select("id, url");
    if (error) throw error;

    if (!Array.isArray(data)) throw new Error("Supabase did not return the contact channel list.");

    const urlsById = new Map(data.map(({ id, url }) => [id, url]));
    let configuredCount = 0;

    for (const channel of channels) {
      const url = urlsById.get(channel.id);
      if (typeof url !== "string" || !url.trim()) continue;

      try {
        channel.url = normalizeSupportUrl(url, channel.id);
        configuredCount += 1;
      } catch (error) {
        console.error(`Invalid ${channel.label} link saved by the administrator.`, error);
      }
    }

    status.textContent = configuredCount
      ? "Contact buttons are managed by the site administrator."
      : "The buttons are shown here; their links will work once configured by the site administrator.";
  } catch (error) {
    console.error("Impossible de charger les liens WhatsApp et Telegram.", error);
    status.textContent = "The buttons are shown here, but their links are temporarily unavailable. Please use the official support resources below.";
  } finally {
    channelsLoaded = true;
  }
}

const channelsPromise = loadSupportChannels();
