"use client";
import dynamic from "next/dynamic";

console.log("Page component loaded");

const GOBTApp = dynamic(() => import("@/components/GOBTApp"), { ssr: false });

export default function Page() {
  console.log("Page rendering");
  return <GOBTApp />;
}
