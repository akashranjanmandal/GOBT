import type { Metadata } from "next";
import { requireAdmin } from "@/lib/referral/auth";
import { gscConfig, savedInspections } from "@/lib/analytics/gsc";
import { indexUrls } from "@/lib/analytics/index-urls";
import { PageHead } from "@/components/referral/adminui";
import { Card } from "@/components/referral/ui";
import IndexChecker from "@/components/analytics/IndexChecker";
import { Tabs } from "@/components/analytics/parts";

export const metadata: Metadata = { title: "Google index" };
export const dynamic = "force-dynamic";

export default async function Index() {
  await requireAdmin();
  const [urls, saved] = await Promise.all([indexUrls(), savedInspections()]);
  const connected = gscConfig().ok;
  /* problems first, then not checked, then indexed */
  const order = (v?: string) => (v === undefined ? 1 : v === "PASS" ? 2 : 0);
  const rows = urls.map((url) => ({ url, i: saved.get(url) ?? null })).sort((a, b) => order(a.i?.verdict) - order(b.i?.verdict) || a.url.localeCompare(b.url));

  return (
    <>
      <PageHead
        title="Website analytics"
        help="Whether Google has each page of gobt.in in its index, when it last visited, and why not if it isn't. Google allows about 2,000 checks a day."
      />
      <Tabs current="index" />
      {!connected && <p className="an-note">Connect Google Search Console first (see the Google Search tab).</p>}
      <Card
        title="Pages in Google"
        help={
          <>
            “Discovered – currently not indexed” and “Crawled – currently not indexed” are common for new pages and usually clear up with time and links. Pages Google
            hasn&apos;t indexed after a few weeks can be submitted in Search Console with <b>URL Inspection → Request indexing</b>. Download as{" "}
            <a className="ad-link" href="/api/referral/admin/analytics/export?report=index">
              CSV
            </a>
            .
          </>
        }
      >
        <IndexChecker rows={rows} connected={connected} />
      </Card>
    </>
  );
}
