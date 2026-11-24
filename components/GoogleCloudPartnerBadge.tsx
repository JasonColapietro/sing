import Image from "next/image";

/** Supplied plain partner artwork. Badge and caption intentionally have no links. */
export function GoogleCloudPartnerBadge() {
  return (
    <aside data-suede-cloud-partner aria-label="Google Cloud partnership" style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 24, flexWrap: "wrap", padding: "32px 24px 72px", background: "#f7f8fa", color: "#344054", borderTop: "1px solid #d0d5dd", font: "14px/1.6 system-ui, sans-serif", textAlign: "center", width: "100%", boxSizing: "border-box" }}>
      <div style={{ background: "#fff", padding: "12px 18px", border: "1px solid #d0d5dd", borderRadius: 6, maxWidth: "100%", boxSizing: "border-box" }}>
        <Image src="/google-cloud-partner.png" alt="Google Cloud Partner" width={724} height={256} style={{ display: "block", width: 232, maxWidth: "100%", height: "auto" }} />
      </div>
      <p style={{ maxWidth: 390, margin: 0 }}><strong style={{ display: "block", color: "#172b4d", fontSize: 16 }}>Suede · Google Cloud Partner</strong>Through JC Investment Group LLC, with suedeai.ai as its verified domain. Google Cloud partner since September 2025.</p>
    </aside>
  );
}
