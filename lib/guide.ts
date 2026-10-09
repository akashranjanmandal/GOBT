/* Bloom, the on-page guide. Sections and forms talk to it through a
   window event, so nothing needs a shared context. */

export type GuideMood = "neutral" | "happy" | "worried" | "angry";

export type GuideMessage = {
  text: string;
  mood?: GuideMood;
  /* ms before the bubble tucks itself away; 0 keeps it open */
  ttl?: number;
};

export const EVT_GUIDE = "gobt:guide";

export function guideSay(msg: GuideMessage) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<GuideMessage>(EVT_GUIDE, { detail: msg }));
}

/* Bloom's body shapes; it morphs smoothly between them */
export type GuideShape = "round" | "flower" | "star" | "bean" | "cloud" | "drop" | "squircle";

/* Faces it can pull */
export type GuideFace = "happy" | "curious" | "wink" | "love" | "star" | "wow" | "focused" | "cat";

/* What Bloom says in each section, in page order. `id` is the section's
   DOM id; `anchor` is the heading it swims up beside. */
export const GUIDE_STOPS: {
  id: string;
  anchor: string;
  text: string;
  shape: GuideShape;
  face: GuideFace;
  /* "above": perch over the anchor's top-right corner instead of beside its words */
  place?: "above";
}[] = [
  { id: "home", anchor: ".hero-title", shape: "round", face: "happy", text: "Hi, I'm Bloom! Scroll down and I'll swim along and tell you what each part of GOBT is about." },
  { id: "services", anchor: ".sh-title", shape: "flower", face: "star", text: "Ooh, this is everything we build: AI, IoT, websites, apps and more. Pick one to peek inside!" },
  { id: "work", anchor: ".sh-title", shape: "bean", face: "wow", text: "Our favourite projects! Tap any one to see how we built it." },
  { id: "clients", anchor: ".sh-title", shape: "cloud", face: "love", text: "Say hi to our lovely clients, businesses that went digital with us." },
  { id: "process", anchor: ".sh-title", shape: "squircle", face: "curious", text: "How we work, in three easy steps. You see your project at every stage. No surprises!" },
  { id: "why", anchor: ".sh-title", shape: "drop", face: "wink", text: "Why pick us? No lock-in, honest billing, and we stick around after launch." },
  { id: "security", anchor: ".sh-title", shape: "star", face: "focused", text: "Bug hunt time! Move across the screen to find the sneaky flaws hiding in the code." },
  { id: "estimate", anchor: ".sh-title", shape: "squircle", face: "curious", text: "Play with these to guess your project's timeline, then tap “Get a custom quote”!" },
  { id: "voices", anchor: ".sh-title", shape: "cloud", face: "love", text: "Psst… here's what our clients say about us. Use the arrows to read more." },
  { id: "team", anchor: ".sh-title", shape: "round", face: "cat", text: "Meet my humans! These are the people who'll build your project." },
  { id: "careers", anchor: ".sh-title", shape: "flower", face: "star", text: "We're hiring! Tap a role if you'd like to join the team." },
  { id: "faq", anchor: ".sh-title", shape: "bean", face: "curious", text: "Got questions? Tap any one and the answer pops open." },
  { id: "contact", anchor: ".cf", place: "above", shape: "drop", face: "happy", text: "Last stop! Tell us about your project. I'll help if anything isn't quite right." },
];

/* what Bloom grumbles when it's told to hush */
export const GUIDE_SULKS = [
  "Hmph! Fine, I'll be quiet… I was only trying to help!",
  "Wow. Rude. I'll just sit in my corner then.",
  "Grr… okay, okay, not another word!",
];

/* and what it says when it's tapped back to life */
export const GUIDE_WELCOMES = [
  "Yay, you called me back! I knew you'd miss me.",
  "I'm back! Let's keep exploring together.",
  "Hehe, hi again! Where were we?",
];

/* Plain-language help for the contact form */
export function explainEmail(value: string): string {
  const v = value.trim();
  if (!v) return "I need your email so we can reply. Something like name@company.com works.";
  if (/\s/.test(v)) return "Your email has a space in it. Emails can't contain spaces, so try removing it.";
  if (!v.includes("@")) return `“${v}” is missing the @ sign. An email looks like name@company.com.`;
  const [user, domain = ""] = v.split("@");
  if (!user) return "Add your name before the @, like name@company.com.";
  if ((v.match(/@/g) ?? []).length > 1) return "There's more than one @ in your email. It should have exactly one.";
  if (!domain) return "Add your email provider after the @, like @gmail.com.";
  if (!domain.includes(".") || domain.endsWith(".")) return `Almost there! “@${domain}” needs an ending like .com or .in.`;
  return "That email doesn't look quite right. Check it looks like name@company.com.";
}

export function explainMessage(value: string): string {
  const left = 10 - value.trim().length;
  if (value.trim().length === 0)
    return "Tell us a little about your project: what you want built, your timeline and a rough budget.";
  return `Just ${left} more character${left === 1 ? "" : "s"}, please. A line about your goals, timeline or budget is perfect.`;
}

/* ── Bloom filling in the contact form as a chat ── */
export type GuideField = "name" | "email" | "company" | "message";

export const EVT_GUIDE_FILL = "gobt:guide-fill";
export const EVT_GUIDE_SUBMIT = "gobt:guide-submit";

export const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

export function guideFill(field: GuideField, value: string) {
  window.dispatchEvent(new CustomEvent<{ field: GuideField; value: string }>(EVT_GUIDE_FILL, { detail: { field, value } }));
}

export function guideSubmit() {
  window.dispatchEvent(new Event(EVT_GUIDE_SUBMIT));
}
