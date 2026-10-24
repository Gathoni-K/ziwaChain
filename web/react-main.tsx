import { ChangeEvent, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { fromBase64Url } from "../src/certificate/build";
import { getRpcUrl } from "./config";
import "./tailwind.css";

type CheckStatus = "pass" | "fail" | "notice";
type ResultsStatus = "loading" | "verified" | "failed" | "rejected";

type Check = { title: string; status: CheckStatus; description: string };
type TimelineEvent = { title: string; meta: string; details: string; tx: string };

type Results = {
  status: ResultsStatus;
  statusText: string;
  checks: Check[];
  timeline: TimelineEvent[];
  mass: Record<string, string>;
  massStatus: string;
  credits: string;
  pseudonym: string;
  metadata: Record<string, string>;
};

const emptyResults: Results = {
  status: "loading",
  statusText: "Checking the certificate...",
  checks: [],
  timeline: [],
  mass: { harvested: "-", accepted: "-", processed: "-", endUse: "-" },
  massStatus: "",
  credits: "not available",
  pseudonym: "-",
  metadata: { batchId: "-", contract: "-", chainId: "-", shortCode: "-", paymentRef: "-" },
};

function readResults(): Results {
  const statusBanner = document.getElementById("statusBanner");
  const checklist = document.getElementById("checklist");
  const timeline = document.getElementById("timelineContainer");
  const read = (id: string) => document.getElementById(id)?.textContent || "-";
  const checks = Array.from(checklist?.children || []).map((item) => {
    const badge = item.querySelector(".check-badge")?.textContent?.toLowerCase() || "notice";
    return {
      title: item.querySelector(".check-title")?.textContent || "",
      status: (badge === "pass" || badge === "fail" ? badge : "notice") as CheckStatus,
      description: item.querySelector(".check-desc")?.textContent || "",
    };
  });
  const timelineEvents = Array.from(timeline?.children || []).map((item) => ({
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
  if (results.status === "verified") return { label: "The digital details match.", text: "The information on this certificate matches the saved digital records. This cannot prove by itself that every real-world event happened exactly as described.", icon: "✓" };
  if (results.status === "rejected") return { label: "This collection was not approved.", text: "The digital record is real, but the collection was not approved when it was checked.", icon: "!" };
  if (results.status === "failed") return { label: "Some details could not be confirmed.", text: results.statusText.includes("Invalid") ? "We could not read this certificate. Check the link or file and try again." : "We could not check every part of this record. Some information is still unconfirmed.", icon: "×" };
  return { label: "Checking this record", text: "We are checking the certificate and its saved digital records.", icon: "…" };
}

const publicCheckCopy = (check: Check): Check => {
  if (check.title.includes("Duplicate Evidence")) return { ...check, title: "Something needs a closer look.", description: "Some of the same digital evidence was also recorded for another collection. This does not automatically mean anyone did something wrong, but the information may need checking." };
  if (check.title.includes("Record Supersession")) return { ...check, title: "Earlier information was corrected.", description: "An earlier digital record was replaced with a corrected one. Open the extra details to see what changed." };
  if (check.title.includes("Payment Reference")) return { ...check, title: "Payment confirmation", description: "The record says that payment was confirmed. This does not mean ZiwaChain independently checked the payment with M-Pesa." };
  if (check.title.includes("Mass Balance")) return { ...check, title: "The recorded amounts fit together.", description: "The amounts recorded at each step do not exceed the amounts allowed by the system." };
  if (check.title.includes("Work Credits")) return { ...check, title: "Work-credit record", description: "The work-credit record matches the recorded use of the material." };
  if (check.title.includes("Pseudonym")) return { ...check, title: "Collection identity matches", description: "The certificate points to the same private collection identifier as the saved record." };
  if (check.title.includes("Hash") || check.title.includes("Cryptographic")) return { ...check, title: "Certificate details match", description: "The certificate's digital fingerprint matches the saved record." };
  if (check.title.includes("Event Provenance")) return { ...check, title: "Saved collection details match", description: "The saved record shows the same collection details." };
  return check;
};

function publicTimelineTitle(title: string, details: string) {
  if (title.includes("HARVEST") || title.includes("Harvest")) return "The collection was recorded.";
  if (title.includes("VERIFIED") || title.includes("Verified")) return details.toLowerCase().includes("rejected") ? "This collection was not approved." : "The collection was checked and approved.";
  if (title.includes("ACCEPTED") || title.includes("Accepted")) return "A receiving party recorded how much it accepted.";
  if (title.includes("PROCESSED") || title.includes("Processed")) return "The processing step was recorded.";
  if (title.includes("END_USE") || title.includes("End Use")) return "The record says that some material was put to use.";
  if (title.includes("SETTLEMENT") || title.includes("Settlement")) return "A payment confirmation was recorded.";
  return title;
}

function publicTimelineDetails(title: string, details: string) {
  if (title.includes("SETTLEMENT") || title.includes("Settlement")) return "The record says that payment was confirmed. This does not mean ZiwaChain independently checked the payment with M-Pesa.";
  if (title.includes("HARVEST") || title.includes("Harvest")) return "The amount collected was written into the record.";
  if (title.includes("VERIFIED") || title.includes("Verified")) return details.toLowerCase().includes("rejected") ? "The record says this collection was not approved." : "The record says this collection was checked and approved.";
  if (title.includes("ACCEPTED") || title.includes("Accepted")) return "The receiving party recorded the amount it accepted.";
  if (title.includes("PROCESSED") || title.includes("Processed")) return "The record includes a processing step.";
  if (title.includes("END_USE") || title.includes("End Use")) return "The record includes material put to use.";
  return details;
}

function App() {
  const [json, setJson] = useState("");
  const [results, setResults] = useState<Results | null>(null);
  const [verifier, setVerifier] = useState<typeof import("./main") | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    import("./main").then((module) => {
      setVerifier(module);
      const hash = window.location.hash;
      if (hash.startsWith("#c=")) {
        try {
          const decoded = JSON.parse(fromBase64Url(hash.slice(3)));
          const value = JSON.stringify(decoded, null, 2);
          setJson(value);
          void module.runVerification(value).then(() => setResults(readResults()));
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
    await verifier.runVerification(value);
    setResults(readResults());
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
  const latestStage = results?.timeline.at(-1) ? publicTimelineTitle(results.timeline.at(-1)!.title, results.timeline.at(-1)!.details).replace(/\.$/, "") : "No steps recorded";
  const massItems = results ? [["Amount collected", results.mass.harvested], ["Amount accepted", results.mass.accepted], ["Amount processed", results.mass.processed], ["Amount put to use", results.mass.endUse]] : [];

  return (
    <div className="min-h-screen bg-[#f5f7f4] text-slate-950">
      <div className="mx-auto max-w-5xl px-4 py-5 sm:px-6 sm:py-8">
        <header className="mb-8">
          <div className="flex items-start justify-between gap-4">
            <a href={window.location.pathname} className="group" aria-label="ZiwaChain certificate lookup">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-teal-800">ZiwaChain</p>
              <p className="mt-1 text-sm font-medium text-slate-600">Proof of environmental work, from collection to end use.</p>
            </a>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-500">Public record check</span>
          </div>
          <div className="mt-10 max-w-2xl">
            <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-5xl">What happened to this water hyacinth?</h1>
            <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg">ZiwaChain keeps a record of collected water hyacinth and follows what happens to it next.</p>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">When water hyacinth is collected, different people may handle it before it is put to use. ZiwaChain helps keep a record of what each person reports and what happens at each recorded step.</p>
          </div>
        </header>

        <main className="space-y-6">
          <Card title="Check a collection record">
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
                    <Button variant="danger" onClick={loadTampered}>Changed example</Button>
                    <Button onClick={() => loadSample(verifier?.SAMPLE_BATCH_C)}>Corrected example</Button>
                    <Button onClick={() => loadSample(verifier?.SAMPLE_BATCH_D)}>Repeated evidence</Button>
                  </div>
                </div>
              </div>
            </details>
          </Card>

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
                  <div><p className="text-sm font-semibold text-slate-500">What is this collection?</p><p className="mt-1 text-2xl font-bold text-teal-900">{results.mass.harvested}</p><p className="mt-1 text-sm text-slate-600">This is the amount collected, as written in the certificate.</p></div>
                  <div className="rounded-xl bg-[#eef4ef] p-4 sm:min-w-52"><p className="text-xs font-bold uppercase tracking-wider text-slate-500">Current progress</p><p className="mt-2 text-xl font-bold">{latestStage}</p><p className="mt-1 text-sm text-slate-600">Only recorded steps are shown.</p></div>
                </div>
                <dl className="mt-5 grid gap-x-8 sm:grid-cols-2">{copyable("Certificate code", results.metadata.shortCode)}{copyable("Batch ID", results.metadata.batchId)}</dl>
              </Card>

              <Card title="Amounts recorded">
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  {massItems.map(([label, value]) => <div key={label} className="rounded-xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-2 text-xl font-bold">{value}</p></div>)}
                </div>
                {results.massStatus && <p className={`mt-4 text-sm font-semibold ${results.massStatus.includes("Violated") ? "text-rose-700" : "text-teal-800"}`}>{results.massStatus.includes("Violated") ? "The recorded amounts do not fit together." : "The recorded amounts fit together."}</p>}
                <p className="mt-4 text-sm leading-6 text-slate-600">These amounts come from the saved record. They do not prove by themselves that a photograph or physical weighing is true.</p>
              </Card>

              <Card title="What happened next?">
                <div className="space-y-0">
                  {results.timeline.length ? results.timeline.map((event, index) => <div key={`${event.title}-${index}`} className="relative flex gap-4 border-l-2 border-slate-200 pb-7 pl-6 last:border-transparent last:pb-0"><span aria-hidden="true" className="absolute -left-[9px] top-1 h-4 w-4 rounded-full border-4 border-[#f5f7f4] bg-teal-800" /><div className="min-w-0"><h3 className="font-bold">{publicTimelineTitle(event.title, event.details)}</h3><p className="mt-1 text-xs text-slate-500">{event.meta}</p><p className="mt-1 text-sm leading-6 text-slate-700">{publicTimelineDetails(event.title, event.details)}</p></div></div>) : <p className="text-sm text-slate-600">No steps have been recorded yet.</p>}
                </div>
              </Card>

              {results.checks.some((check) => check.status === "notice") && <Card title="Things to look at"><ul className="space-y-3">{results.checks.filter((check) => check.status === "notice").map((check, index) => { const publicCheck = publicCheckCopy(check); return <li key={`${check.title}-${index}`} className="rounded-xl border border-amber-300 bg-amber-50 p-4"><p className="font-semibold text-amber-950">{publicCheck.title}</p><p className="mt-1 text-sm leading-6 text-amber-900">{publicCheck.description}</p></li>; })}</ul></Card>}

              <Card title="Work credits">
                <p className="text-sm leading-6 text-slate-600">Work credits are digital records linked to qualifying work recorded by this system. They are not money and are not carbon credits.</p>
                <p className="mt-4 text-3xl font-bold text-teal-900">{results.credits} <span className="text-base font-semibold text-slate-600">work credits recorded</span></p>
              </Card>

              <Card>
                <details>
                  <summary className="cursor-pointer list-inside text-base font-bold focus:outline-none focus:ring-2 focus:ring-teal-600">More details for people who want to check further</summary>
                  <div className="mt-5 space-y-6">
                    <ul className="space-y-3">{results.checks.map((check, index) => { const publicCheck = publicCheckCopy(check); return <li key={`${check.title}-${index}`} className="rounded-xl border border-slate-200 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><span className="font-semibold">{publicCheck.title}</span><span className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase ${check.status === "pass" ? "bg-teal-100 text-teal-900" : check.status === "fail" ? "bg-rose-100 text-rose-900" : "bg-amber-100 text-amber-950"}`}>{check.status === "pass" ? "matched" : check.status === "fail" ? "does not match" : "look closer"}</span></div><p className="mt-1 text-sm leading-6 text-slate-600">{publicCheck.description}</p></li>; })}</ul>
                    <dl className="border-t border-slate-100 pt-2">{copyable("Contract", results.metadata.contract)}{copyable("Chain", results.metadata.chainId)}{copyable("Payment reference", results.metadata.paymentRef)}</dl>
                  </div>
                </details>
              </Card>
            </section>
          )}
        </main>

        <footer className="mt-10 border-t border-slate-200 py-6 text-sm leading-6 text-slate-600">ZiwaChain helps people inspect recorded environmental-work records. A digital check can show whether the information matches the saved records; it cannot independently prove that every real-world claim is true.</footer>
      </div>

      <div aria-hidden="true" className="hidden">
        <div id="resultsArea"><div id="statusBanner" /><ul id="checklist" /><div id="massHarvested" /><div id="massAccepted" /><div id="massProcessed" /><div id="massEndUse" /><div id="massBalanceStatus" /><span id="creditsDisplay" /><span id="pseudonymDisplay" /><div id="timelineContainer" /><span id="metaBatchId" /><span id="metaContract" /><span id="metaChainId" /><span id="metaShortCode" /><span id="metaPaymentRef" /><span id="rpcDisplay" /></div>
        <textarea id="jsonInput" /><input id="fileInputLegacy" /><button id="btnVerify" /><button id="btnLoadBatchA" /><button id="btnTamperTest" /><button id="btnLoadBatchC" /><button id="btnLoadBatchD" /><input id="fileInput" />
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
