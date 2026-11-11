import type { Metadata } from "next";
import { ACADEMY_COURSES, classLabel } from "@/lib/academy";
import { requireAdmin } from "@/lib/referral/auth";
import { academyRegistrations } from "@/lib/referral/stats";
import { PageHead } from "@/components/referral/adminui";
import { Card, Empty, Stat, fmtTime } from "@/components/referral/ui";

export const metadata: Metadata = { title: "Academy registrations" };

export default async function Academy() {
  await requireAdmin();
  const rows = await academyRegistrations();
  const byCourse = ACADEMY_COURSES.map((c) => ({ course: c, n: rows.filter((r) => r.course === c.id).length }));

  return (
    <>
      <PageHead
        title="Academy registrations"
        help="Every registration from gobt.in/academy/form. Each one is also emailed to the careers inbox. Call or WhatsApp the parent to confirm admission."
      />
      <div className="ad-stats">
        <Stat label="Registrations" value={rows.length} hint="All time" tone="gold" />
        {byCourse.map((b) => (
          <Stat key={b.course.id} label={b.course.title} value={b.n} tone="plain" />
        ))}
      </div>
      <Card title="Latest registrations">
        {rows.length === 0 ? (
          <Empty>No registrations yet. Share gobt.in/academy/form with parents.</Empty>
        ) : (
          <table className="rt">
            <thead>
              <tr>
                <th>Student</th>
                <th>Course</th>
                <th>Contact</th>
                <th>Centre</th>
                <th>When</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td data-label="Student">
                    <b>{r.name}</b>
                    <small>
                      {classLabel(r.studentClass)} · {r.school}
                    </small>
                    <small>{r.address}</small>
                  </td>
                  <td data-label="Course">{ACADEMY_COURSES.find((c) => c.id === r.course)?.title ?? r.course}</td>
                  <td data-label="Contact">
                    <a href={`tel:+91${r.mobile}`}>+91 {r.mobile}</a>
                    <small>
                      <a href={`https://wa.me/91${r.whatsapp}`} target="_blank" rel="noopener noreferrer">
                        WhatsApp +91 {r.whatsapp}
                      </a>
                    </small>
                  </td>
                  <td data-label="Centre">{r.location}</td>
                  <td data-label="When">{fmtTime(r.at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </>
  );
}
