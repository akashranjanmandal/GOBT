/* Certificates: types, wording templates, signatories and numbering.
   Shared by the public pages, the admin form and the image renderer. */

export const ORG = "Group of Blooming Technicians";

export const CERT_KINDS = [
  { id: "internship", label: "Internship", title: "Certificate of Completion", roleLabel: "Internship role", rolePlaceholder: "Operations & Project Coordinator" },
  { id: "training", label: "Training", title: "Certificate of Completion", roleLabel: "Training / course name", rolePlaceholder: "Robotics & Arduino" },
  { id: "work", label: "Work completion", title: "Certificate of Completion", roleLabel: "Work / project", rolePlaceholder: "Website development for Mohini Printers" },
  { id: "custom", label: "Custom", title: "Certificate of Appreciation", roleLabel: "Role or subject (optional)", rolePlaceholder: "" },
] as const;

export type CertKind = (typeof CERT_KINDS)[number]["id"];
export const kindOf = (id: string) => CERT_KINDS.find((k) => k.id === id) ?? CERT_KINDS[0];

/* the two people who sign every certificate */
export const SIGNATORIES = [
  { name: "Suprime Mandal", title: "director" },
  { name: "Subhodeep Ghosh", title: "director" },
] as const;

export const PRONOUNS = [
  { id: "she", label: "She / her", sub: "she", obj: "her", pos: "her" },
  { id: "he", label: "He / his", sub: "he", obj: "him", pos: "his" },
  { id: "they", label: "They / their", sub: "they", obj: "them", pos: "their" },
] as const;
export type PronounId = (typeof PRONOUNS)[number]["id"];
const pron = (id: string) => PRONOUNS.find((p) => p.id === id) ?? PRONOUNS[2];
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/* 2026-04-29 → 29-04-2026, the style printed on GOBT certificates */
export function printDate(iso: string | null | undefined) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return "";
  const [y, m, d] = iso.split("-");
  return `${d}-${m}-${y}`;
}

/* GOBT/C/0826/001 ↔ GOBT-C-0826-001 (used in links and the QR code) */
export const slugOf = (certNo: string) => certNo.trim().toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, "");
export const certPrefix = (issuedOn: string) => {
  const [y, m] = issuedOn.split("-");
  return `GOBT/C/${m}${y.slice(2)}/`;
};

export type CertFields = {
  kind: string;
  title: string;
  recipient: string;
  pronoun: string;
  role: string;
  startDate: string;
  endDate: string;
  skills: string;
  body: string;
  note: string;
  issuedOn: string;
  certNo?: string;
};

/* Ready-made wording for each type. **double stars** mark bold words. */
export function templateText(f: CertFields): { body: string; note: string } {
  const p = pron(f.pronoun);
  const name = f.recipient.trim() || "Full Name";
  const role = f.role.trim();
  const from = printDate(f.startDate);
  const to = printDate(f.endDate);
  const period = from && to ? ` from ${from} to ${to}` : from ? ` from ${from}` : "";
  const skills = f.skills.trim().replace(/\.$/, "");
  const article = /^[aeiou]/i.test(role) ? "an" : "a";

  switch (f.kind) {
    case "training":
      return {
        body: `This is to certify that **${name}** has successfully completed the ${role ? `**${role}** ` : ""}training programme conducted by **${ORG}** (GOBT)${period}.${skills ? ` During the training, ${p.sub} gained hands-on experience in ${skills}.` : ""}`,
        note: `${cap(p.pos)} curiosity, effort and consistency throughout the programme were commendable. We wish ${p.obj} success in ${p.pos} future learning.`,
      };
    case "work":
      return {
        body: `This is to certify that **${name}** has successfully completed the work on ${role ? `**${role}** ` : ""}for **${ORG}** (GOBT)${period}.${skills ? ` During this engagement, ${p.sub} worked on ${skills}.` : ""}`,
        note: `${cap(p.pos)} professionalism, quality of work and commitment to deadlines were commendable. We wish ${p.obj} continued success.`,
      };
    case "custom":
      return {
        body: `This is to certify that **${name}**${role ? ` (**${role}**)` : ""} has been recognised by **${ORG}** (GOBT)${period}.${skills ? ` ${cap(skills)}.` : ""}`,
        note: `We thank ${p.obj} for ${p.pos} contribution and wish ${p.obj} every success.`,
      };
    default:
      return {
        body: `This is to certify that **${name}** has successfully completed ${p.pos} internship as ${article} ${role ? `**${role}** ` : ""}Intern at **${ORG}** (GOBT)${period}.${skills ? ` During ${p.pos} tenure, ${p.sub} gained practical exposure to ${skills}.` : ""}`,
        note: `${cap(p.pos)} proactiveness, dedication, and willingness to learn were commendable. We wish ${p.obj} success in ${p.pos} future endeavours.`,
      };
  }
}

/* "Hello **world**" → [{w:"Hello"}, {w:"world", bold:true}] */
export function words(text: string) {
  const out: { w: string; bold: boolean }[] = [];
  text.split(/(\*\*[^*]+\*\*)/).forEach((part) => {
    const bold = part.startsWith("**") && part.endsWith("**");
    part
      .replace(/\*\*/g, "")
      .split(/\s+/)
      .filter(Boolean)
      .forEach((w) => out.push({ w, bold }));
  });
  return out;
}

export const plainText = (text: string) => text.replace(/\*\*/g, "");
