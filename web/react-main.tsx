import { ChangeEvent, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { getRpcUrl } from "./config";
import "./tailwind.css";

type CheckStatus = "pass" | "fail" | "notice";

type Check = {
  title: string;
  status: CheckStatus;
  description: string;
};

type TimelineEvent = {
  title: string;
  meta: string;
  details: string;
  tx: string;
};

type Results = {
  status: "loading" | "verified" | "failed" | "rejected";
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
  statusText: "",
  checks: [],
  timeline: [],
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

  const checks = Array.from(checklist?.children || []).map((item) => {
    const title = item.querySelector(".check-title")?.textContent || "";
    const badge = item.querySelector(".check-badge")?.textContent?.toLowerCase() || "notice";
    return {
      title,
      status: (badge === "pass" || badge === "fail" ? badge : "notice") as CheckStatus,
      description: item.querySelector(".check-desc")?.textContent || "",
    };
  });

  const timelineEvents = Array.from(timeline?.children || []).map((item) => {
    const children = item.children;
    return {
      title: children[0]?.textContent || "",
      meta: children[1]?.textContent || "",
      details: children[2]?.textContent || "",
      tx: children[3]?.textContent || "",
    };
  });

  const bannerClass = statusBanner?.className || "";
  const status = bannerClass.includes("failed")
    ? "failed"
    : bannerClass.includes("rejected")
      ? "rejected"
      : bannerClass.includes("verified")
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

function Button({ children, variant = "outline", onClick }: {
  children: React.ReactNode;
  variant?: "outline" | "danger" | "primary";
  onClick: () => void;
}) {
  const styles = {
    outline: "border-slate-300 bg-white text-slate-700 hover:border-emerald-500 hover:text-emerald-700",
    danger: "border-red-200 bg-white text-red-700 hover:bg-red-50",
    primary: "border-emerald-600 bg-emerald-600 text-white shadow-sm hover:bg-emerald-700",
  };
  return (
    <button type="button" onClick={onClick} className={`rounded-lg border px-4 py-2.5 text-sm font-semibold transition ${styles[variant]}`}>
      {children}
    </button>
  );
}

function Card({ children, title, className = "" }: { children: React.ReactNode; title?: string; className?: string }) {
  return (
    <section className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 ${className}`}>
      {title && <h2 className="mb-4 border-b border-slate-100 pb-3 text-lg font-bold tracking-tight text-slate-900">{title}</h2>}
      {children}
    </section>
  );
}

function App() {
  const [json, setJson] = useState("");
  const [results, setResults] = useState<Results | null>(null);
  const [verifier, setVerifier] = useState<typeof import("./main") | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    import("./main").then(setVerifier).catch((error) => {
      console.error("Unable to load certificate verifier", error);
    });
  }, []);

  const verify = async (value: string) => {
    if (!verifier || !value.trim()) return;
    setJson(value);
    setResults({ ...emptyResults, statusText: "Executing cryptographic and on-chain verification..." });
    await verifier.runVerification(value);
    setResults(readResults());
  };

  const loadSample = (sample: unknown) => verify(JSON.stringify(sample, null, 2));
  const loadTampered = () => {
    const tampered = JSON.parse(JSON.stringify(verifier?.SAMPLE_BATCH_A));
    tampered.stages.HARVEST_LOGGED.payload.quantityKg = 1001;
    loadSample(tampered);
  };

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => verify(String(reader.result || ""));
    reader.readAsText(file);
  };

  const statusStyles = {
    loading: "border-amber-300 bg-amber-50 text-amber-800",
    verified: "border-emerald-500 bg-emerald-50 text-emerald-800",
    failed: "border-red-400 bg-red-50 text-red-800",
    rejected: "border-amber-300 bg-amber-50 text-amber-800",
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <header className="mb-5">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="mb-1 text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">ZiwaChain Protocol</p>
              <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Certificate verification</h1>
            </div>
            <span className="rounded-full bg-slate-200 px-3 py-1 font-mono text-xs font-semibold text-slate-600">v1.0</span>
          </div>
          <div className="mb-4 flex items-start gap-3 rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
            <span className="mt-0.5 text-lg">✓</span>
            <span>Checked in your browser. No ZiwaClear server was contacted.</span>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-600">
            <strong className="text-slate-900">What these checks prove:</strong> every record existed at the specified time, no field was altered afterwards, and smart contract rules were enforced on-chain.
            <br /><br />
            <strong className="text-slate-900">What they do not prove:</strong> physical real-world facts such as the exact scale weight at the beach. That link relies on independent verification, wallet acceptance, and SMS confirmation.
          </div>
        </header>

        <Card title="1. Certificate input">
          <p className="mb-3 text-sm text-slate-500">Load from a QR code link, upload a JSON file, paste raw JSON, or test a demo batch.</p>
          <div className="mb-4 flex flex-wrap gap-2">
            <Button onClick={() => loadSample(verifier?.SAMPLE_BATCH_A)}>Load valid demo</Button>
            <Button variant="danger" onClick={loadTampered}>Load tampered demo</Button>
            <Button onClick={() => loadSample(verifier?.SAMPLE_BATCH_C)}>Load Batch C (Corrected)</Button>
            <Button onClick={() => loadSample(verifier?.SAMPLE_BATCH_D)}>Load Batch D (Duplicate Evidence)</Button>
          </div>
          <div className="mb-3 flex flex-wrap items-center gap-3 text-sm">
            <label htmlFor="fileInputReact" className="font-semibold text-slate-700">Upload .json:</label>
            <input ref={fileInput} id="fileInputReact" type="file" accept=".json,application/json" onChange={handleFile} className="text-sm text-slate-500 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:font-semibold file:text-slate-700" />
          </div>
          <textarea value={json} onChange={(event) => setJson(event.target.value)} placeholder="Paste certificate JSON here..." className="mb-3 h-28 w-full resize-y rounded-lg border border-slate-300 bg-slate-50 p-3 font-mono text-xs text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button variant="primary" onClick={() => verify(json)}>Run verification</Button>
            <span className="text-xs text-slate-500">RPC: <code className="font-mono">{getRpcUrl()}</code></span>
          </div>
        </Card>

        {results && (
          <main className="mt-5 space-y-5">
            <div className={`rounded-xl border-2 p-4 text-base font-bold ${statusStyles[results.status]}`}>{results.statusText}</div>
            <Card title="2. Cryptographic & on-chain audit steps">
              <ul className="space-y-2">
                {results.checks.map((check, index) => (
                  <li key={`${check.title}-${index}`} className={`rounded-lg border border-slate-200 border-l-4 p-3 ${check.status === "pass" ? "border-l-emerald-500" : check.status === "fail" ? "border-l-red-500 bg-red-50" : "border-l-amber-500 bg-amber-50"}`}>
                    <div className="flex items-center justify-between gap-3"><span className="font-semibold">{check.title}</span><span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${check.status === "pass" ? "bg-emerald-600 text-white" : check.status === "fail" ? "bg-red-600 text-white" : "bg-amber-600 text-white"}`}>{check.status}</span></div>
                    <p className="mt-1 text-sm text-slate-600">{check.description}</p>
                  </li>
                ))}
              </ul>
            </Card>
            <Card title="3. Chain of custody mass balance">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {Object.entries({ Harvested: results.mass.harvested, Accepted: results.mass.accepted, Processed: results.mass.processed, "End use": results.mass.endUse }).map(([label, value]) => <div key={label} className="rounded-lg bg-slate-50 p-3 text-center"><div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div><div className="mt-1 text-lg font-bold">{value}</div></div>)}
              </div>
              <p className={`mt-3 text-center text-sm font-semibold ${results.massStatus.includes("Violated") ? "text-red-600" : "text-emerald-700"}`}>{results.massStatus}</p>
            </Card>
            <Card title="4. Harvester work credits">
              <p className="mb-2 text-sm text-slate-500">Non-transferable ERC-1155 tokens minted 1:1 for verified biomass reaching circular end use.</p>
              <div className="flex items-baseline gap-2"><span className="text-4xl font-extrabold text-emerald-600">{results.credits}</span><span className="font-semibold">WORK_CREDIT tokens</span></div>
              <p className="mt-2 font-mono text-xs text-slate-500">Attributed to Pseudonym: {results.pseudonym}</p>
            </Card>
            <Card title="5. Batch lifecycle timeline">
              <div className="relative ml-2 border-l-2 border-slate-200 pl-6">
                {results.timeline.map((event, index) => <div key={`${event.title}-${index}`} className="relative mb-5 last:mb-0"><span className="absolute -left-[31px] top-1 h-3 w-3 rounded-full border-2 border-white bg-emerald-600 ring-1 ring-emerald-200" /><div className="font-bold">{event.title}</div><div className="text-xs text-slate-500">{event.meta}</div><div className="mt-1 text-sm">{event.details}</div><div className="mt-1 break-all font-mono text-xs text-emerald-700">{event.tx}</div></div>)}
              </div>
            </Card>
            <Card>
              <details>
                <summary className="cursor-pointer font-semibold">View raw on-chain technical metadata</summary>
                <div className="mt-3 space-y-2 text-sm">{Object.entries(results.metadata).map(([key, value]) => <p key={key}><strong className="capitalize">{key.replace(/([A-Z])/g, " $1")}:</strong> <span className="break-all font-mono text-xs">{value}</span></p>)}</div>
              </details>
            </Card>
          </main>
        )}

        <footer className="py-7 text-center text-xs text-slate-500">ZiwaChain Open Source Protocol · IEEE ClimateChain 2026 · Lake Victoria Sustainable Supply Chains</footer>
      </div>

      <div aria-hidden="true" className="hidden">
        <div id="resultsArea"><div id="statusBanner" /><ul id="checklist" /><div id="massHarvested" /><div id="massAccepted" /><div id="massProcessed" /><div id="massEndUse" /><div id="massBalanceStatus" /><span id="creditsDisplay" /><span id="pseudonymDisplay" /><div id="timelineContainer" /><span id="metaBatchId" /><span id="metaContract" /><span id="metaChainId" /><span id="metaShortCode" /><span id="metaPaymentRef" /><span id="rpcDisplay" /></div>
        <textarea id="jsonInput" /><input id="fileInputLegacy" />
        <button id="btnVerify" /><button id="btnLoadBatchA" /><button id="btnTamperTest" /><button id="btnLoadBatchC" /><button id="btnLoadBatchD" /><input id="fileInput" />
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
