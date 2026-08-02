import { RangeTest } from "@/components/range/range-test";
import { SITE_URL } from "@/lib/site";

export const metadata = {
  title: "Vocal Range Test — Find Your Vocal Range",
  description:
    "A free two-minute vocal range test: hold a comfortable note, slide to your lowest and highest, and see your range and voice type on a keyboard. Runs in the browser with your mic — no signup.",
  alternates: { canonical: `${SITE_URL}/range` },
};

export default function RangePage() {
  return <RangeTest />;
}
