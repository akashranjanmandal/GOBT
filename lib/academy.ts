/* GOBT Robotics & AI Academy — the after-school training programme
   (from the admission banner). Shared by the page, form and API. */

export const ACADEMY = {
  name: "GOBT Robotics & AI Academy",
  initiative: "An initiative of Group Of Blooming Technicians (GOBT)",
  registrationFee: 599,
  eligibility: "Students from LKG to Class 12",
  address: "GOBT Office, Dighirpar, Falta",
  phone: "+91 89722 97093",
  whatsapp: "https://wa.me/918972297093",
};

export const ACADEMY_COURSES = [
  {
    id: "junior-robotics",
    title: "Junior Robotics",
    desc: "Robotics basics and hands-on practice for younger students.",
    duration: "1 month",
    months: 1,
    fee: 999,
  },
  {
    id: "robotics-arduino",
    title: "Robotics & Arduino",
    desc: "Build robots with Arduino and put electronics to real use.",
    duration: "2 months",
    months: 2,
    fee: 2499,
  },
  {
    id: "python-ai",
    title: "Python & AI Basics",
    desc: "Learn Python programming and the foundations of artificial intelligence.",
    duration: "2 months",
    months: 2,
    fee: 2499,
  },
  {
    id: "advanced-robotics-iot",
    title: "Advanced Robotics & IoT",
    desc: "Design and build advanced robotics, IoT and automation projects.",
    duration: "2 months",
    months: 2,
    fee: 3499,
  },
] as const;

export type AcademyCourseId = (typeof ACADEMY_COURSES)[number]["id"];

export const ACADEMY_LOCATIONS = ["Sarisha", "Dighirpar", "Falta"] as const;
export const ACADEMY_CLASSES = ["LKG", "UKG", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"] as const;
/* "LKG" reads as is; numbers read as "Class 5" */
export const classLabel = (c: string) => (/^\d+$/.test(c) ? `Class ${c}` : c);

/* why parents choose the academy (all from the admission banner) */
export const ACADEMY_WHY = [
  { title: "Hands-on, project-based", text: "Children learn by building real projects with their own hands, not just by listening." },
  { title: "Modern technology", text: "Arduino, ESP32, IoT and AI: the same tools engineers use." },
  { title: "Experienced trainers", text: "Direct guidance from trainers who work with this technology every day." },
  { title: "Certificate", text: "Every student receives a certificate when they complete the course." },
];

/* what students do in class */
export const ACADEMY_ACTIVITIES = [
  { title: "Build their own robot", icon: "robot" },
  { title: "Learn to code", icon: "code" },
  { title: "Explore AI", icon: "ai" },
  { title: "Make IoT projects", icon: "iot" },
  { title: "Take part in competitions", icon: "trophy" },
] as const;

/* Photos shown on the academy pages. Put files in public/academy/ with
   these names and they appear automatically (missing ones are skipped). */
export const ACADEMY_PHOTOS = [
  { file: "students-building-robot-car.jpg", alt: "Two students building a robot car in class", caption: "Building a robot car" },
  { file: "class-1.jpg", alt: "Students in a GOBT robotics class", caption: "In the classroom" },
  { file: "class-2.jpg", alt: "A student programming a robot", caption: "Coding the robot" },
  { file: "class-3.jpg", alt: "Students testing an IoT project", caption: "Testing an IoT project" },
  { file: "class-4.jpg", alt: "Students at a robotics competition", caption: "Competition day" },
  { file: "class-5.jpg", alt: "Students with their finished projects", caption: "Finished projects" },
  { file: "class-6.jpg", alt: "A trainer helping a student", caption: "Learning with a trainer" },
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
  if (!ACADEMY_CLASSES.includes(f.studentClass as (typeof ACADEMY_CLASSES)[number])) e.studentClass = "Please choose a class (LKG to Class 12)";
  if (f.school.trim().length < 2) e.school = "Please enter the school name";
  if (!normaliseMobile(f.mobile)) e.mobile = "Enter a 10-digit mobile number";
  if (!normaliseMobile(f.whatsapp)) e.whatsapp = "Enter a 10-digit WhatsApp number";
  if (f.address.trim().length < 5) e.address = "Please enter your address";
  if (!ACADEMY_COURSES.some((c) => c.id === f.course)) e.course = "Please choose a course";
  if (!ACADEMY_LOCATIONS.includes(f.location as (typeof ACADEMY_LOCATIONS)[number])) e.location = "Please choose your nearest location";
  return e;
}
