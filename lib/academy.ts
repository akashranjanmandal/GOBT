/* GOBT Robotics & AI Academy — the after-school training programme
   (from the admission banner). Shared by the page, form and API. */

export const ACADEMY = {
  name: "GOBT Robotics & AI Academy",
  initiative: "An initiative of Group Of Blooming Technicians (GOBT)",
  registrationFee: 599,
  eligibility: "School students, Class 4–12",
  address: "GOBT Office, Dighirpar, Falta",
  phone: "+91 89722 97093",
  whatsapp: "https://wa.me/918972297093",
};

export const ACADEMY_COURSES = [
  {
    id: "junior-robotics",
    title: "Junior Robotics",
    desc: "Robotics basics and hands-on practice for younger students.",
    bn: "ছোটদের জন্য রোবোটিক্সের মৌলিক ধারণা ও ব্যবহারিক প্রশিক্ষণ।",
    duration: "1 month",
    months: 1,
    fee: 999,
  },
  {
    id: "robotics-arduino",
    title: "Robotics & Arduino",
    desc: "Build robots with Arduino and put electronics to real use.",
    bn: "Arduino ব্যবহার করে রোবট তৈরি ও ইলেকট্রনিক্সের বাস্তব প্রয়োগ।",
    duration: "2 months",
    months: 2,
    fee: 2499,
  },
  {
    id: "python-ai",
    title: "Python & AI Basics",
    desc: "Learn Python programming and the foundations of artificial intelligence.",
    bn: "Python প্রোগ্রামিং ও কৃত্রিম বুদ্ধিমত্তা (AI)-এর ভিত্তি শেখা।",
    duration: "2 months",
    months: 2,
    fee: 2499,
  },
  {
    id: "advanced-robotics-iot",
    title: "Advanced Robotics & IoT",
    desc: "Design and build advanced robotics, IoT and automation projects.",
    bn: "উন্নত রোবোটিক্স, IoT ও অটোমেশন প্রজেক্ট তৈরি ও বাস্তবায়ন।",
    duration: "2 months",
    months: 2,
    fee: 3499,
  },
] as const;

export type AcademyCourseId = (typeof ACADEMY_COURSES)[number]["id"];

export const ACADEMY_LOCATIONS = ["Sarisha", "Dighirpar", "Falta"] as const;
export const ACADEMY_CLASSES = ["4", "5", "6", "7", "8", "9", "10", "11", "12"] as const;

export const ACADEMY_WHY = [
  { en: "Hands-on, project-based training", bn: "হাতে-কলমে প্রকল্পভিত্তিক প্রশিক্ষণ" },
  { en: "Modern tech: Arduino, ESP32, IoT and AI", bn: "Arduino, ESP32, IoT ও AI-এর আধুনিক প্রযুক্তি শেখা" },
  { en: "Direct guidance from experienced trainers", bn: "অভিজ্ঞ প্রশিক্ষকের সরাসরি দিকনির্দেশনা" },
  { en: "Certificate on course completion", bn: "কোর্স শেষে সার্টিফিকেট প্রদান" },
];

export const ACADEMY_ACTIVITIES = [
  { en: "Build your own robot", bn: "নিজের রোবট তৈরি করো" },
  { en: "Learn programming", bn: "প্রোগ্রামিং শেখো" },
  { en: "Explore the world of AI", bn: "AI-এর দুনিয়া জানো" },
  { en: "Work on IoT projects", bn: "IoT প্রকল্পে কাজ করো" },
  { en: "Take part in competitions", bn: "প্রতিযোগিতায় অংশ নাও" },
];

export const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

/* Indian mobile → 10 digits (accepts +91 / 91 / 0 prefixes, spaces, dashes) */
export function normaliseMobile(v: string) {
  let d = v.replace(/\D/g, "");
  if (d.length === 12 && d.startsWith("91")) d = d.slice(2);
  if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
  return /^[6-9]\d{9}$/.test(d) ? d : null;
}

export type AcademyForm = {
  name: string;
  studentClass: string;
  school: string;
  mobile: string;
  whatsapp: string;
  address: string;
  course: string;
  location: string;
};

/* the same rules on the page and on the server */
export function validateAcademy(f: AcademyForm) {
  const e: Partial<Record<keyof AcademyForm, string>> = {};
  if (f.name.trim().length < 2) e.name = "Please enter the student's name";
  if (!ACADEMY_CLASSES.includes(f.studentClass as (typeof ACADEMY_CLASSES)[number])) e.studentClass = "Please choose a class (4–12)";
  if (f.school.trim().length < 2) e.school = "Please enter the school name";
  if (!normaliseMobile(f.mobile)) e.mobile = "Enter a 10-digit mobile number";
  if (!normaliseMobile(f.whatsapp)) e.whatsapp = "Enter a 10-digit WhatsApp number";
  if (f.address.trim().length < 5) e.address = "Please enter your address";
  if (!ACADEMY_COURSES.some((c) => c.id === f.course)) e.course = "Please choose a course";
  if (!ACADEMY_LOCATIONS.includes(f.location as (typeof ACADEMY_LOCATIONS)[number])) e.location = "Please choose your nearest location";
  return e;
}
