/* Where a referral link can be shared. Used by the dashboard share
   buttons, click tracking and the admin traffic reports. */
export const CHANNELS = [
  { id: "whatsapp", label: "WhatsApp" },
  { id: "telegram", label: "Telegram" },
  { id: "facebook", label: "Facebook" },
  { id: "instagram", label: "Instagram" },
  { id: "linkedin", label: "LinkedIn" },
  { id: "x", label: "X (Twitter)" },
  { id: "email", label: "Email" },
  { id: "sms", label: "SMS" },
  { id: "copy", label: "Copied link" },
] as const;

export type ChannelId = (typeof CHANNELS)[number]["id"];
export const CHANNEL_IDS: string[] = CHANNELS.map((c) => c.id);
export const channelLabel = (id: string | null | undefined) =>
  CHANNELS.find((c) => c.id === id)?.label ?? (id ? id : "Direct / unknown");

/* the link a channel shares: tagged so clicks can be traced back to it */
export const taggedLink = (base: string, channel: string) => `${base}?s=${channel}`;

export function shareUrl(channel: string, link: string, text: string): string | null {
  const url = encodeURIComponent(taggedLink(link, channel));
  const msg = encodeURIComponent(`${text} ${taggedLink(link, channel)}`);
  switch (channel) {
    case "whatsapp":
      return `https://wa.me/?text=${msg}`;
    case "telegram":
      return `https://t.me/share/url?url=${url}&text=${encodeURIComponent(text)}`;
    case "facebook":
      return `https://www.facebook.com/sharer/sharer.php?u=${url}`;
    case "linkedin":
      return `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
    case "x":
      return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${url}`;
    case "email":
      return `mailto:?subject=${encodeURIComponent("A software team I recommend")}&body=${msg}`;
    case "sms":
      return `sms:?&body=${msg}`;
    default:
      return null; /* instagram, copy: no share page, so the link is copied */
  }
}
