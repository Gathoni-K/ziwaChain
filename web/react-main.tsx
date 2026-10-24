import { ChangeEvent, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { fromBase64Url } from "../src/certificate/build";
import type { VerificationResult, CheckItem, TimelineItem, CheckStatus, ResultsStatus } from "./main";
import "./tailwind.css";

type Check = CheckItem;
type TimelineEvent = TimelineItem;
type Results = VerificationResult;

const emptyResults: Results = {
  status: "loading",
  statusText: "Checking the certificate...",
  stageName: "Checking...",
  isSyntheticDemo: false,
  checks: [],
  timeline: [],
  recordedDates: {},
  mass: { harvested: "-", accepted: "-", processed: "-", endUse: "-" },
  massStatus: "",
  credits: "0",
  pseudonym: "-",
  metadata: { batchId: "-", contract: "-", chainId: "-", shortCode: "-", paymentRef: "-" },
};

function readResults(): Results {
  const statusBanner = document.getElementById("statusBanner");
  const checklist = document.getElementById("checklist");
  const timeline = document.getElementById("timelineContainer");
  const read = (id: string) => document.getElementById(id)?.textContent || "-";
  const checks: Check[] = Array.from(checklist?.children || []).map((item) => {
    const badge = item.querySelector(".check-badge")?.textContent?.toLowerCase() || "notice";
    return {
      title: item.querySelector(".check-title")?.textContent || "",
      status: (badge === "pass" || badge === "fail" ? badge : "notice") as CheckStatus,
      description: item.querySelector(".check-desc")?.textContent || "",
    };
  });
  const timelineEvents: TimelineEvent[] = Array.from(timeline?.children || []).map((item) => ({
    title: item.children[0]?.textContent || "",
    meta: item.children[1]?.textContent || "",
    details: item.children[2]?.textContent || "",
    tx: item.children[3]?.textContent || "",
  }));
  const className = statusBanner?.className || "";
  const status: ResultsStatus = className.includes("failed")
    ? "failed"
    : className.includes("rejected")
      ? "rejected"
      : className.includes("verified")
        ? "verified"
        : "loading";
  return {
    status,
    statusText: statusBanner?.textContent || "",
    stageName: className.includes("rejected") ? "Rejected" : "Recorded",
    isSyntheticDemo: true,
    recordedDates: {},
    checks,
    timeline: timelineEvents,
    mass: {
      harvested: read("massHarvested"),
      accepted: read("massAccepted"),
      processed: read("massProcessed"),
      endUse: read("massEndUse"),
    },
    massStatus: read("massBalanceStatus"),
    credits: read("creditsDisplay"),
    pseudonym: read("pseudonymDisplay"),
    metadata: {
      batchId: read("metaBatchId"),
      contract: read("metaContract"),
      chainId: read("metaChainId"),
      shortCode: read("metaShortCode"),
      paymentRef: read("metaPaymentRef"),
    },
  };
}

function Button({
  children,
  variant = "outline",
  onClick,
}: {
  children: React.ReactNode;
  variant?: "outline" | "danger" | "primary";
  onClick: () => void;
}) {
  const styles = {
    outline: "border-slate-300 bg-white text-slate-700 hover:border-teal-600 hover:text-teal-800",
    danger: "border-rose-300 bg-white text-rose-800 hover:bg-rose-50",
    primary: "border-teal-800 bg-teal-800 text-white shadow-sm hover:bg-teal-900",
  };
  return (
    <button type="button" onClick={onClick} className={`min-h-11 rounded-lg border px-4 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-2 ${styles[variant]}`}>
      {children}
    </button>
  );
}

function Card({ children, title, className = "" }: { children: React.ReactNode; title?: string; className?: string }) {
  return (
    <section className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(15,61,58,0.06)] sm:p-7 ${className}`}>
      {title && <h2 className="mb-5 text-xl font-bold tracking-tight text-slate-950">{title}</h2>}
      {children}
    </section>
  );
}

function statusCopy(results: Results) {
  if (results.status === "verified") {
    return {
      label: "The digital details match.",
      text: "The information on this certificate matches the saved digital records. This cannot prove by itself that every real-world event happened exactly as described.",
      icon: "✓"
    };
  }
  if (results.status === "rejected") {
    return {
      label: "This collection was not approved.",
      text: results.rejectionReason
        ? `The digital record is authentic, but the collection was rejected during physical verification: ${results.rejectionReason} Work credits were withheld.`
        : "The digital record is authentic, but the collection was not approved when it was checked.",
      icon: "!"
    };
  }
  if (results.status === "failed") {
    return {
      label: "Some details could not be confirmed.",
      text: results.statusText.includes("Invalid")
        ? "We could not read this certificate. Check the link or file and try again."
        : results.statusText.includes("RPC") || results.statusText.includes("network") || results.statusText.includes("blockchain")
          ? "Live contract check could not run due to an RPC or network problem. Cryptographic hashes from the certificate were verified, but on-chain status is unconfirmed."
          : "We could not check every part of this record. Some information is still unconfirmed.",
      icon: "×"
    };
  }
  return { label: "Checking this record", text: "We are checking the certificate and its saved digital records.", icon: "…" };
}

const publicCheckCopy = (check: Check): Check => {
  if (check.title.includes("Duplicate Evidence")) {
    return {
      ...check,
      title: "Something needs a closer look.",
      description: check.description || "Some of the same digital evidence was also recorded for another collection. Shared evidence warrants review but does not automatically prove fraud."
    };
  }
  if (check.title.includes("Record Supersession") || check.title.includes("Correction")) {
    return {
      ...check,
      title: "Earlier information was corrected.",
      description: check.description || "An earlier digital record was replaced with a corrected one. Open the extra details to see what changed."
    };
  }
  if (check.title.includes("Settlement")) {
    return {
      ...check,
      title: "Settlement confirmation recorded",
      description: check.description || "Harvester payment receipt confirmed on-chain via SMS co-sign."
    };
  }
  if (check.title.includes("Payment Reference")) {
    return {
      ...check,
      title: "Payment confirmation",
      description: "The record says that payment was confirmed. This does not mean ZiwaChain independently checked the payment with M-Pesa."
    };
  }
  if (check.title.includes("Mass Balance") || check.title.includes("Conservation of Mass")) {
    return {
      ...check,
      title: "The recorded amounts fit together.",
      description: check.description || "The amounts recorded at each step do not exceed the amounts allowed by the system."
    };
  }
  if (check.title.includes("Work Credits")) {
    return {
      ...check,
      title: "Work-credit record",
      description: check.description || "The work-credit record matches the recorded use of the material."
    };
  }
  if (check.title.includes("Pseudonym")) {
    return {
      ...check,
      title: "Collection identity matches",
      description: "The certificate points to the same private collection identifier as the saved record."
    };
  }
  if (check.title.includes("Hash") || check.title.includes("Cryptographic")) {
    return {
      ...check,
      title: "Certificate details match",
      description: "The certificate's digital fingerprint matches the saved record."
    };
  }
  if (check.title.includes("Event Provenance")) {
    return {
      ...check,
      title: "Saved collection details match",
      description: "The saved record shows the same collection details."
    };
  }
  return check;
};

function publicTimelineTitle(title: string, details: string) {
  if (title.includes("HARVEST") || title.includes("Harvest")) return "The collection was recorded.";
  if (title.includes("VERIFIED") || title.includes("Verified")) return details.toLowerCase().includes("rejected") ? "This collection was not approved." : "The collection was checked and approved.";
  if (title.includes("ACCEPTED") || title.includes("Accepted")) return "A receiving party recorded how much it accepted.";
  if (title.includes("PROCESSED") || title.includes("Processed")) return "The processing step was recorded.";
  if (title.includes("END_USE") || title.includes("End Use")) return "The record says that some material was put to use.";
  if (title.includes("SETTLEMENT") || title.includes("Settlement")) return "A payment confirmation was recorded.";
  if (title.includes("CORRECTED") || title.includes("Corrected")) return "An earlier record was corrected on-chain.";
  return title;
}

function publicTimelineDetails(title: string, details: string) {
  if (title.includes("SETTLEMENT") || title.includes("Settlement")) return "The record says that payment was confirmed. This does not mean ZiwaChain independently checked the payment with M-Pesa.";
  if (title.includes("HARVEST") || title.includes("Harvest")) return "The amount collected was written into the record.";
  if (title.includes("VERIFIED") || title.includes("Verified")) return details.toLowerCase().includes("rejected") ? "The record says this collection was not approved." : "The record says this collection was checked and approved.";
  if (title.includes("ACCEPTED") || title.includes("Accepted")) return "The receiving party recorded the amount it accepted.";
  if (title.includes("PROCESSED") || title.includes("Processed")) return "The record includes a processing step.";
  if (title.includes("END_USE") || title.includes("End Use")) return "The record includes material put to use.";
  if (title.includes("CORRECTED") || title.includes("Corrected")) return details || "An earlier evidence hash was superseded by a corrected record.";
  return details;
}

function SiteNav() {
  const [open, setOpen] = useState(false);
  return (
    <nav className="relative flex items-center justify-between border-b border-slate-200 pb-4" aria-label="Main navigation">
      <a href="/" className="group" onClick={() => setOpen(false)}>
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-teal-800">ZiwaChain</p>
        <p className="mt-1 text-sm font-medium text-slate-600">Records for collected water hyacinth</p>
      </a>
      <button type="button" className="min-h-11 min-w-11 rounded-lg border border-slate-300 bg-white text-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-600 sm:hidden" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} aria-controls="site-menu" onClick={() => setOpen(!open)}>
        <span aria-hidden="true">{open ? "×" : "☰"}</span>
      </button>
      <div id="site-menu" className={`${open ? "absolute left-0 right-0 top-full z-10 mt-3 flex" : "hidden"} flex-col gap-1 rounded-xl border border-slate-200 bg-white p-3 shadow-lg sm:static sm:mt-0 sm:flex sm:flex-row sm:items-center sm:gap-5 sm:border-0 sm:p-0 sm:shadow-none`}>
        <a href="/" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-teal-50 hover:text-teal-900 focus:outline-none focus:ring-2 focus:ring-teal-600">Home</a>
        <a href="/#how-it-works" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-teal-50 hover:text-teal-900 focus:outline-none focus:ring-2 focus:ring-teal-600">How it works</a>
        <a href="/verify" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-teal-50 hover:text-teal-900 focus:outline-none focus:ring-2 focus:ring-teal-600">Verify a record</a>
        <a href="/verify" onClick={() => setOpen(false)} className="rounded-lg bg-teal-800 px-4 py-2.5 text-center text-sm font-bold text-white hover:bg-teal-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-2">Check a record</a>
      </div>
    </nav>
  );
}

function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-slate-200 pt-8 text-sm leading-6 text-slate-600">
      <div className="grid gap-8 sm:grid-cols-[1fr_auto]">
        <div><p className="font-bold text-teal-900">ZiwaChain</p><p className="mt-2 max-w-md">A public way to inspect records about collected water hyacinth and what happened at each recorded step.</p><p className="mt-3">A digital match shows that information agrees with saved records. It cannot prove that every real-world activity happened exactly as described.</p></div>
        <div className="flex flex-col gap-2 sm:min-w-40"><a href="/" className="hover:text-teal-800">Home</a><a href="/#how-it-works" className="hover:text-teal-800">How it works</a><a href="/verify" className="hover:text-teal-800">Verify a record</a></div>
      </div>
      <p className="mt-8 border-t border-slate-100 pt-4 text-xs">© {new Date().getFullYear()} ZiwaChain</p>
    </footer>
  );
}

function HomePage() {
  return (
    <div className="min-h-screen bg-[#f5f7f4] text-slate-950">
      <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-8">
        <SiteNav />
        <main>
          <section className="grid gap-10 py-14 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div><p className="text-sm font-bold uppercase tracking-[0.2em] text-teal-800">A clearer record of environmental work</p><h1 className="mt-4 max-w-2xl text-4xl font-bold tracking-tight text-slate-950 sm:text-6xl">Follow the journey of collected water hyacinth.</h1><p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">When water hyacinth is collected, different people may handle it before it is put to use. ZiwaChain helps keep a record of what happens along the way, so people can see what has been reported and check the saved information.</p><div className="mt-8 flex flex-wrap gap-3"><a href="/verify" className="rounded-lg bg-teal-800 px-5 py-3 text-center text-sm font-bold text-white hover:bg-teal-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-2">Check a record</a><a href="#how-it-works" className="rounded-lg border border-slate-300 bg-white px-5 py-3 text-center text-sm font-bold text-slate-700 hover:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-2">How it works</a></div></div>
            <div className="rounded-3xl border border-teal-900/10 bg-[#e6f0eb] p-6 sm:p-8" aria-label="A simple picture of a collection record's journey">
              <div className="flex flex-col gap-3">
                {["Collection recorded", "Collection checked", "Amount received and processed", "Record available to check"].map((label, index) => <div key={label} className="flex items-center gap-4 rounded-2xl bg-white/80 p-4 shadow-sm"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-800 text-sm font-bold text-white">{index + 1}</span><span className="font-semibold text-slate-800">{label}</span></div>)}
              </div>
              <p className="mt-5 text-center text-xs leading-5 text-slate-600">A simple view of the steps a record may contain. Not a report of a particular collection.</p>
            </div>
          </section>

          <section className="grid gap-8 border-y border-slate-200 py-14 sm:grid-cols-2 sm:py-16"><div><h2 className="text-3xl font-bold tracking-tight">Why keep a record?</h2></div><div className="space-y-4 text-base leading-7 text-slate-600"><p>Collecting water hyacinth is only one part of the story. Someone may receive it, another person may process it, and someone else may put it to use.</p><p>Without clear records, it can be difficult to follow what happened at each step. ZiwaChain is designed to make those steps easier to follow.</p></div></section>

          <section id="how-it-works" className="scroll-mt-6 py-14 sm:py-20"><div className="max-w-2xl"><p className="text-sm font-bold uppercase tracking-[0.2em] text-teal-800">How it works</p><h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Four simple steps.</h2></div><div className="mt-8 grid gap-4 md:grid-cols-4">{[["A collection is recorded", "The system records the amount of water hyacinth reported as collected."], ["The collection is checked", "An authorised person can approve or reject the record."], ["The journey is recorded", "The system can record how much was accepted, processed, and put to use as the collection moves forward."], ["People can check the record", "A certificate lets someone inspect the information saved about the collection."]].map(([title, text], index) => <article key={title} className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-sm font-bold text-teal-800">0{index + 1}</p><h3 className="mt-5 text-lg font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{text}</p></article>)}</div></section>

          <section className="rounded-3xl bg-[#e6f0eb] px-6 py-12 sm:px-10"><h2 className="max-w-2xl text-3xl font-bold tracking-tight">One record. A clearer picture of what happened.</h2><div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{["How much was reported as collected.", "How much was accepted and processed.", "How much was recorded as put to use.", "Whether the collection was approved or rejected.", "Whether a payment confirmation was recorded.", "Whether the digital details match saved records."].map((item) => <div key={item} className="rounded-xl bg-white/80 p-4 text-sm font-semibold text-slate-700">{item}</div>)}</div></section>

          <section className="grid gap-6 py-14 sm:grid-cols-2 sm:py-20"><div><h2 className="text-3xl font-bold tracking-tight">What a digital record can and cannot tell you.</h2></div><div className="space-y-4"><div className="rounded-2xl border border-teal-200 bg-teal-50 p-5"><h3 className="font-bold text-teal-950">What it can tell you</h3><p className="mt-2 text-sm leading-6 text-teal-900">The system can check whether the information on a certificate matches the digital records saved for it.</p></div><div className="rounded-2xl border border-amber-200 bg-amber-50 p-5"><h3 className="font-bold text-amber-950">What it cannot prove by itself</h3><p className="mt-2 text-sm leading-6 text-amber-900">A matching digital record does not, on its own, prove that every real-world event happened exactly as described.</p></div></div></section>

          <section className="rounded-3xl bg-teal-900 px-6 py-12 text-white sm:px-10"><h2 className="text-3xl font-bold tracking-tight">Have a collection certificate?</h2><p className="mt-3 max-w-xl leading-7 text-teal-50">Open its certificate or enter its code to see what has been recorded and check the digital details.</p><a href="/verify" className="mt-7 inline-block rounded-lg bg-white px-5 py-3 text-sm font-bold text-teal-900 hover:bg-teal-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-teal-900">Check a record</a></section>
        </main>
        <SiteFooter />
      </div>
    </div>
  );
}

function VerifyPage() {
  const [json, setJson] = useState("");
  const [results, setResults] = useState<Results | null>(null);
  const [verifier, setVerifier] = useState<typeof import("./main") | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    import("./main.js").then((module) => {
      setVerifier(module);
      const hash = window.location.hash;
      if (hash.startsWith("#c=")) {
        try {
          const decoded = JSON.parse(fromBase64Url(hash.slice(3)));
          const value = JSON.stringify(decoded, null, 2);
          setJson(value);
          void module.runVerification(value).then((res) => setResults(res || readResults()));
        } catch {
          setResults({ ...emptyResults, status: "failed", statusText: "Certificate not found — check the link and try again." });
        }
      }
    }).catch((error) => {
      console.error("Unable to load certificate verifier", error);
      setResults({ ...emptyResults, status: "failed", statusText: "We couldn't complete the checks — the verifier could not be loaded." });
    });
  }, []);

  const verify = async (value: string) => {
    if (!verifier || !value.trim()) {
      setResults({ ...emptyResults, status: "failed", statusText: "Enter a certificate JSON or use a certificate link before checking." });
      return;
    }
    setJson(value);
    setResults({ ...emptyResults, status: "loading", statusText: "Checking the certificate in your browser..." });
    const res = await verifier.runVerification(value);
    setResults(res || readResults());
  };

  const loadSample = (sample: unknown) => {
    if (sample) void verify(JSON.stringify(sample, null, 2));
  };

  const loadTampered = () => {
    if (!verifier) return;
    const tampered = JSON.parse(JSON.stringify(verifier.SAMPLE_BATCH_A));
    tampered.stages.HARVEST_LOGGED.payload.quantityKg = 1001;
    void verify(JSON.stringify(tampered, null, 2));
  };

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => void verify(String(reader.result || ""));
    reader.readAsText(file);
  };

  const copy = (value: string) => {
    if (value && value !== "-") void navigator.clipboard?.writeText(value);
  };

  const copyable = (label: string, value: string) => (
    <div className="flex min-w-0 items-start justify-between gap-3 border-b border-slate-100 py-3 last:border-0">
      <dt className="shrink-0 text-sm font-semibold text-slate-600">{label}</dt>
      <dd className="min-w-0 break-all text-right font-mono text-xs text-slate-800">
        {value}
        {value !== "-" && <button type="button" onClick={() => copy(value)} className="ml-2 min-h-8 rounded border border-slate-200 px-2 text-[11px] font-sans text-teal-800 hover:bg-teal-50 focus:outline-none focus:ring-2 focus:ring-teal-600">Copy</button>}
      </dd>
    </div>
  );

  const copyText = results ? statusCopy(results) : null;
  const latestEvent = results && results.timeline.length > 0 ? results.timeline[results.timeline.length - 1] : undefined;
  const latestStage = results?.stageName || (latestEvent ? publicTimelineTitle(latestEvent.title, latestEvent.details).replace(/\.$/, "") : "No steps recorded");
  const massItems = results ? [["Amount collected", results.mass.harvested], ["Amount accepted", results.mass.accepted], ["Amount processed", results.mass.processed], ["Amount put to use", results.mass.endUse]] : [];

  return (
    <div className="min-h-screen bg-[#f5f7f4] text-slate-950">
      <div className="mx-auto max-w-5xl px-4 py-5 sm:px-6 sm:py-8">
        <header className="mb-8">
          <SiteNav />
          <div className="mt-10 max-w-2xl">
            <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-5xl">Check a collection record</h1>
            <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg">Enter the code on a certificate, or open the certificate link you were given.</p>
          </div>
        </header>

        <main className="space-y-6">
          <Card title="Open the certificate link">
            <p className="text-sm leading-6 text-slate-600">Open the certificate link you received or scan its QR code. The record will open here automatically.</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">If you are testing or have the certificate file, use the extra options below.</p>
            <details className="mt-5 border-t border-slate-100 pt-4">
              <summary className="cursor-pointer text-sm font-bold focus:outline-none focus:ring-2 focus:ring-teal-600">More ways to check a record</summary>
              <div className="mt-4">
                <label htmlFor="certificateJson" className="block text-sm font-semibold text-slate-800">Paste the certificate file</label>
                <textarea id="certificateJson" value={json} onChange={(event) => setJson(event.target.value)} placeholder="Paste certificate details here…" className="mt-3 min-h-32 w-full resize-y rounded-xl border border-slate-300 bg-slate-50 p-3 font-mono text-xs text-slate-800 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100" aria-describedby="lookup-help" />
                <p id="lookup-help" className="mt-2 text-xs text-slate-500">This option is mainly for developers and local testing.</p>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <Button variant="primary" onClick={() => void verify(json)}>Check record</Button>
                  <label htmlFor="fileInputReact" className="min-h-11 cursor-pointer rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-teal-600 focus-within:ring-2 focus-within:ring-teal-600">Choose file<input ref={fileInput} id="fileInputReact" type="file" accept=".json,application/json" onChange={handleFile} className="sr-only" /></label>
                </div>
                <div className="mt-5 border-t border-slate-100 pt-4">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Local demonstrations</p>
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={() => loadSample(verifier?.SAMPLE_BATCH_A)}>Working example</Button>
                    <Button onClick={() => loadSample(verifier?.SAMPLE_BATCH_B)}>Rejected example</Button>
                    <Button variant="danger" onClick={loadTampered}>Changed example</Button>
                    <Button onClick={() => loadSample(verifier?.SAMPLE_BATCH_C)}>Corrected example</Button>
                    <Button onClick={() => loadSample(verifier?.SAMPLE_BATCH_D)}>Repeated evidence</Button>
                  </div>
                </div>
              </div>
            </details>
          </Card>

          {results && results.isSyntheticDemo && (
            <div className="rounded-xl border border-sky-300 bg-sky-50 px-4 py-3 text-xs font-semibold text-sky-950 flex items-center justify-between">
              <span>Synthetic testnet demonstration record (Base Sepolia)</span>
              <span className="rounded bg-sky-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sky-900">Demo Record</span>
            </div>
          )}

          {results && copyText && (
            <div role="status" aria-live="polite" className={`rounded-2xl border p-5 ${results.status === "verified" ? "border-teal-700 bg-teal-50" : results.status === "rejected" ? "border-amber-500 bg-amber-50" : results.status === "failed" ? "border-rose-500 bg-rose-50" : "border-slate-300 bg-white"}`}>
              <div className="flex items-start gap-3">
                <span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-current text-lg font-bold">{copyText.icon}</span>
                <div><h2 className="text-lg font-bold">{copyText.label}</h2><p className="mt-1 text-sm leading-6">{copyText.text}</p></div>
              </div>
            </div>
          )}

          {results && results.status !== "loading" && (
            <section className="space-y-6" aria-label="Certificate result">
              <Card title="Batch at a glance">
                <div className="grid gap-5 sm:grid-cols-[1fr_auto]">
                  <div>
                    <p className="text-sm font-semibold text-slate-500">What is this collection?</p>
                    <p className="mt-1 text-2xl font-bold text-teal-900">{results.mass.harvested}</p>
                    <p className="mt-1 text-sm text-slate-600">This is the amount collected, as written in the certificate.</p>
                  </div>
                  <div className="rounded-xl bg-[#eef4ef] p-4 sm:min-w-52">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Current progress</p>
                    <p className="mt-2 text-xl font-bold">{latestStage}</p>
                    <p className="mt-1 text-sm text-slate-600">Only recorded steps are shown.</p>
                  </div>
                </div>

                {results.recordedDates && (
                  <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 sm:grid-cols-3">
                    {results.recordedDates.collectedAt && <div><dt className="text-xs font-medium text-slate-500">Collected on</dt><dd className="mt-0.5 text-sm font-semibold text-slate-800">{results.recordedDates.collectedAt}</dd></div>}
                    {results.recordedDates.verifiedAt && <div><dt className="text-xs font-medium text-slate-500">Checked on</dt><dd className="mt-0.5 text-sm font-semibold text-slate-800">{results.recordedDates.verifiedAt}</dd></div>}
                    {results.recordedDates.acceptedAt && <div><dt className="text-xs font-medium text-slate-500">Accepted on</dt><dd className="mt-0.5 text-sm font-semibold text-slate-800">{results.recordedDates.acceptedAt}</dd></div>}
                    {results.recordedDates.settledAt && <div><dt className="text-xs font-medium text-slate-500">Settled on</dt><dd className="mt-0.5 text-sm font-semibold text-slate-800">{results.recordedDates.settledAt}</dd></div>}
                    {results.recordedDates.processedAt && <div><dt className="text-xs font-medium text-slate-500">Processed on</dt><dd className="mt-0.5 text-sm font-semibold text-slate-800">{results.recordedDates.processedAt}</dd></div>}
                    {results.recordedDates.endUseAt && <div><dt className="text-xs font-medium text-slate-500">Put to use on</dt><dd className="mt-0.5 text-sm font-semibold text-slate-800">{results.recordedDates.endUseAt}</dd></div>}
                  </dl>
                )}

                <dl className="mt-5 grid gap-x-8 sm:grid-cols-2">{copyable("Certificate code", results.metadata.shortCode)}{copyable("Batch ID", results.metadata.batchId)}</dl>
              </Card>

              {results.status === "rejected" && (
                <Card title="Rejection outcome">
                  <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
                    <p className="font-bold text-rose-950">Collection rejected at physical verification</p>
                    <p className="mt-1 text-sm text-rose-900">
                      {results.rejectionReason ? `Reason: ${results.rejectionReason}` : "Quality inspection threshold was not met."}
                    </p>
                    <p className="mt-2 text-xs font-semibold text-rose-800">
                      Under ZiwaChain protocol rules, stage Rejected is terminal. Commercial certificate of custody is withheld and 0 work credits were issued. Later stages were not completed.
                    </p>
                  </div>
                </Card>
              )}

              <Card title="Amounts recorded">
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  {massItems.map(([label, value]) => (
                    <div key={label} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
                      <p className="mt-2 text-xl font-bold">{value}</p>
                    </div>
                  ))}
                </div>
                {results.massStatus && (
                  <p className={`mt-4 text-sm font-semibold ${results.massStatus.includes("Violated") ? "text-rose-700" : "text-teal-800"}`}>
                    {results.massStatus}
                  </p>
                )}
                <p className="mt-4 text-sm leading-6 text-slate-600">These amounts come from the saved record. They do not prove by themselves that a photograph or physical weighing is true.</p>
              </Card>

              <Card title="What happened next?">
                <div className="space-y-0">
                  {results.timeline.length ? (
                    results.timeline.map((event, index) => (
                      <div key={`${event.title}-${index}`} className="relative flex gap-4 border-l-2 border-slate-200 pb-7 pl-6 last:border-transparent last:pb-0">
                        <span aria-hidden="true" className="absolute -left-[9px] top-1 h-4 w-4 rounded-full border-4 border-[#f5f7f4] bg-teal-800" />
                        <div className="min-w-0">
                          <h3 className="font-bold">{publicTimelineTitle(event.title, event.details)}</h3>
                          <p className="mt-1 text-xs text-slate-500">{event.meta}</p>
                          <p className="mt-1 text-sm leading-6 text-slate-700">{publicTimelineDetails(event.title, event.details)}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-600">No steps have been recorded yet.</p>
                  )}
                </div>
              </Card>

              {results.checks.some((check) => check.status === "notice") && (
                <Card title="Things to look at">
                  <ul className="space-y-3">
                    {results.checks
                      .filter((check) => check.status === "notice")
                      .map((check, index) => {
                        const publicCheck = publicCheckCopy(check);
                        return (
                          <li key={`${check.title}-${index}`} className="rounded-xl border border-amber-300 bg-amber-50 p-4">
                            <p className="font-semibold text-amber-950">{publicCheck.title}</p>
                            <p className="mt-1 text-sm leading-6 text-amber-900">{publicCheck.description}</p>
                          </li>
                        );
                      })}
                  </ul>
                </Card>
              )}

              <Card title="Work credits">
                <p className="text-sm leading-6 text-slate-600">Work credits are digital records linked to qualifying work recorded by this system. They are not money and are not carbon credits.</p>
                <p className="mt-4 text-3xl font-bold text-teal-900">{results.credits} <span className="text-base font-semibold text-slate-600">work credits recorded</span></p>
              </Card>

              <Card>
                <details>
                  <summary className="cursor-pointer list-inside text-base font-bold focus:outline-none focus:ring-2 focus:ring-teal-600">More details for people who want to check further</summary>
                  <div className="mt-5 space-y-6">
                    <ul className="space-y-3">
                      {results.checks.map((check, index) => {
                        const publicCheck = publicCheckCopy(check);
                        return (
                          <li key={`${check.title}-${index}`} className="rounded-xl border border-slate-200 p-4">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="font-semibold">{publicCheck.title}</span>
                              <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase ${check.status === "pass" ? "bg-teal-100 text-teal-900" : check.status === "fail" ? "bg-rose-100 text-rose-900" : "bg-amber-100 text-amber-950"}`}>
                                {check.status === "pass" ? "matched" : check.status === "fail" ? "does not match" : "look closer"}
                              </span>
                            </div>
                            <p className="mt-1 text-sm leading-6 text-slate-600">{publicCheck.description}</p>
                          </li>
                        );
                      })}
                    </ul>
                    <dl className="border-t border-slate-100 pt-2">{copyable("Contract", results.metadata.contract)}{copyable("Chain", results.metadata.chainId)}{copyable("Payment reference", results.metadata.paymentRef)}</dl>
                  </div>
                </details>
              </Card>
            </section>
          )}
        </main>

        <SiteFooter />
      </div>

      <div aria-hidden="true" className="hidden">
        <div id="resultsArea"><div id="statusBanner" /><ul id="checklist" /><div id="massHarvested" /><div id="massAccepted" /><div id="massProcessed" /><div id="massEndUse" /><div id="massBalanceStatus" /><span id="creditsDisplay" /><span id="pseudonymDisplay" /><div id="timelineContainer" /><span id="metaBatchId" /><span id="metaContract" /><span id="metaChainId" /><span id="metaShortCode" /><span id="metaPaymentRef" /><span id="rpcDisplay" /></div>
        <textarea id="jsonInput" /><input id="fileInputLegacy" /><button id="btnVerify" /><button id="btnLoadBatchA" /><button id="btnLoadBatchB" /><button id="btnTamperTest" /><button id="btnLoadBatchC" /><button id="btnLoadBatchD" /><input id="fileInput" />
      </div>
    </div>
  );
}

function App() {
  return window.location.pathname === "/verify" || window.location.pathname.startsWith("/verify/") ? <VerifyPage /> : <HomePage />;
}

createRoot(document.getElementById("root")!).render(<App />);
