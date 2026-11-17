"use client";

import { useState } from "react";
import Link from "next/link";

const checkoutUrl = process.env.NEXT_PUBLIC_GUMROAD_PRODUCT_URL ?? "";

const features = [
  ["01", "Daily sales tracker", "Record daily revenue, payment methods, discounts and sales totals."],
  ["02", "Recipe costing", "Work out ingredient costs, portion costs and menu margins."],
  ["03", "Inventory control", "Track opening stock, purchases, usage and closing quantities."],
  ["04", "Monthly profit snapshot", "Bring sales and operating costs together for a simple monthly view."]
];

export default function CafeOwnerProfitKitPage() {
  const [email, setEmail] = useState("");
  return (
    <main style={{ minHeight: "100vh", background: "#080b10", color: "#f4f1e9", fontFamily: "Arial, sans-serif" }}>
      <div style={{ maxWidth: 1120, margin: "0 auto", padding: "28px 22px 72px" }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, borderBottom: "1px solid #292b2e", paddingBottom: 22 }}>
          <Link href="/" style={{ color: "#d7b879", letterSpacing: 3, fontWeight: 800, textDecoration: "none" }}>ITCM <span style={{ color: "#f4f1e9", fontWeight: 400 }}>GLOBAL</span></Link>
          <span style={{ color: "#a9a18f", fontSize: 12, letterSpacing: 2 }}>DIGITAL TOOLKIT</span>
        </header>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 38, alignItems: "center", padding: "76px 0 58px" }}>
          <div>
            <p style={{ color: "#d7b879", letterSpacing: 3, fontSize: 11, fontWeight: 700 }}>BUILT FOR INDEPENDENT CAFÉS</p>
            <h1 style={{ fontSize: "clamp(38px,7vw,68px)", lineHeight: 1.02, letterSpacing: -2, margin: "18px 0" }}>Run your café with <span style={{ color: "#d7b879" }}>clear numbers.</span></h1>
            <p style={{ color: "#b9b6ae", lineHeight: 1.8, fontSize: 16, maxWidth: 560 }}>A practical spreadsheet toolkit to organise daily sales, understand recipe costs, keep an eye on stock and review monthly performance.</p>
            <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 16, marginTop: 28 }}>
              <strong style={{ fontSize: 34 }}>$12 <small style={{ fontSize: 12, color: "#aaa" }}>USD · proposed launch price</small></strong>
              {checkoutUrl ? <a href={checkoutUrl} target="_blank" rel="noopener noreferrer" style={{ background: "#d7b879", color: "#111", padding: "15px 22px", borderRadius: 6, textDecoration: "none", fontWeight: 800 }}>Get the toolkit</a> : <span style={{ border: "1px solid #756344", color: "#d7b879", padding: "13px 16px", borderRadius: 6, fontSize: 13 }}>Checkout setup in progress</span>}
            </div>
            <p style={{ color: "#85827b", fontSize: 11, lineHeight: 1.6, marginTop: 13 }}>{checkoutUrl ? "Secure checkout is provided by the configured payment page." : "This page is prepared. Online checkout will activate after the official Gumroad product link is configured."}</p>
          </div>
          <div style={{ border: "1px solid #665638", borderRadius: 14, padding: 24, background: "radial-gradient(circle at 80% 10%, #332b1d, #11151b 60%)", boxShadow: "0 22px 70px #0008" }}>
            <div style={{ color: "#d7b879", fontSize: 11, letterSpacing: 2 }}>THE CAFÉ OWNER PROFIT KIT</div>
            <div style={{ margin: "24px 0", padding: 20, border: "1px solid #39352c", borderRadius: 8, background: "#0c1016" }}>
              <div style={{ display: "flex", justifyContent: "space-between", color: "#aaa", fontSize: 11 }}><span>MONTHLY OVERVIEW</span><span>SPREADSHEET TOOLKIT</span></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 18 }}>
                {["SALES", "FOOD COST", "STOCK", "PROFIT"].map((item) => <div key={item} style={{ padding: 16, background: "#171d25", borderRadius: 6 }}><div style={{ color: "#a6a6a0", fontSize: 10 }}>{item}</div><div style={{ color: "#d7b879", fontSize: 19, marginTop: 9 }}>TRACK</div></div>)}
              </div>
            </div>
            <p style={{ color: "#aaa69c", fontSize: 12, lineHeight: 1.7 }}>Simple tools for independent café owners. No subscription is advertised for this one-time digital product.</p>
          </div>
        </section>

        <section style={{ borderTop: "1px solid #292b2e", paddingTop: 34 }}>
          <p style={{ color: "#d7b879", letterSpacing: 2, fontSize: 11 }}>WHAT'S INSIDE</p>
          <h2 style={{ fontSize: 30, margin: "8px 0 22px" }}>Four everyday operating tools</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 }}>
            {features.map(([number, title, description]) => <article key={number} style={{ border: "1px solid #292f38", background: "#10151d", padding: 20, borderRadius: 9 }}>
              <span style={{ color: "#d7b879", fontSize: 11 }}>{number}</span><h3 style={{ fontSize: 17 }}>{title}</h3><p style={{ color: "#aaa", fontSize: 13, lineHeight: 1.7 }}>{description}</p>
            </article>)}
          </div>
        </section>

        <section style={{ marginTop: 40, padding: 24, border: "1px solid #3d372b", borderRadius: 9, background: "#11151b" }}>
          <h2 style={{ marginTop: 0 }}>Get product updates</h2>
          <p style={{ color: "#aaa", fontSize: 13 }}>Leave your email to request information about the toolkit. This form does not take payment or create an order.</p>
          <form action="mailto:ufstwold@gmail.com" method="get" style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            <input aria-label="Email address" type="email" name="subject" placeholder="Your email address" value={email} onChange={(event) => setEmail(event.target.value)} required style={{ flex: "1 1 220px", background: "#080b10", color: "#fff", border: "1px solid #39414b", borderRadius: 5, padding: 13 }} />
            <button type="submit" style={{ background: "#252c35", color: "#fff", border: "1px solid #454d57", borderRadius: 5, padding: "13px 18px" }}>Request details</button>
          </form>
        </section>

        <footer style={{ marginTop: 36, color: "#777", fontSize: 11, lineHeight: 1.7 }}>
          <p>ITCM GLOBAL AI · Digital products</p>
          <p>This toolkit is for operational planning and record-keeping. It is not accounting, tax, legal or financial advice. Results depend on the accuracy of information entered by the user. Product contents and compatibility should be checked before purchase.</p>
        </footer>
      </div>
    </main>
  );
}
