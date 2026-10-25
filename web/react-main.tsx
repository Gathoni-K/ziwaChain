import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { fromBase64Url } from "../src/certificate/build";
import {
  runVerification,
  SAMPLE_BATCH_A,
  SAMPLE_BATCH_B,
  SAMPLE_BATCH_C,
  SAMPLE_BATCH_D,
  type VerificationResult,
  type CheckItem,
  type TimelineItem,
  type CheckStatus,
  type ResultsStatus,
} from "./main";
import {
  AppPreferencesProvider,
  useAppPreferences,
} from "./context";
import {
  getStatusBannerCopy,
  getTranslatedCheck,
  getTranslatedTimeline,
  getTranslatedMassStatus,
  getTranslatedStageName,
} from "./translations";
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
  className = "",
  type = "button",
  disabled = false,
  ariaLabel,
  id,
}: {
  children: ReactNode;
  variant?: "outline" | "danger" | "primary" | "ghost" | "active";
  onClick?: () => void;
  className?: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  ariaLabel?: string;
  id?: string;
}) {
  const baseStyles =
    "min-h-11 inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)] focus-visible:ring-offset-2 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer";

  const styles = {
    outline:
      "border border-[var(--border-main)] bg-[var(--bg-card)] text-[var(--text-main)] hover:border-[var(--primary)] hover:text-[var(--primary)] shadow-sm",
    danger:
      "border border-[var(--error-border)] bg-[var(--error-bg)] text-[var(--error)] hover:bg-[var(--error-bg)] hover:border-[var(--error)] shadow-sm",
    primary:
      "bg-[var(--primary)] text-[var(--primary-fg)] shadow hover:bg-[var(--primary-hover)] active:bg-[var(--primary-active)]",
    ghost:
      "border border-transparent bg-transparent text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-main)]",
    active:
      "border-2 border-[var(--primary)] bg-[var(--primary-light)] text-[var(--primary)] font-bold shadow-sm",
  };

  return (
    <button
      id={id}
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`${baseStyles} ${styles[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

function Card({
  children,
  title,
  subtitle,
  className = "",
  id,
}: {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
  id?: string;
}) {
  return (
    <section
      id={id}
      className={`rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 shadow-[var(--card-shadow)] transition-all duration-200 sm:p-7 ${className}`}
    >
      {title && (
        <div className="mb-5">
          <h2 className="text-xl font-bold tracking-tight text-[var(--text-heading)]">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-[var(--text-muted)]">{subtitle}</p>}
        </div>
      )}
      {children}
    </section>
  );
}

/**
 * QrShareCard – generates and displays a QR code for the certificate's public
 * verification deep-link entirely in the browser. The `qrcode` package is already
 * a runtime dependency (used server-side in src/certificate/qr.ts), so no new
 * dependency is needed. We use the browser-safe `QRCode.toDataURL()` API.
 *
 * The QR code encodes the certificate's own `verifyUrl` field, which is
 * `https://ziwachain.org/verify#c=<base64url(certJSON)>`. Scanning it opens the
 * public verification page with the full certificate pre-loaded in the URL fragment,
 * triggering the same cryptographic + on-chain checks as any other certificate load.
 */
function QrShareCard({
  verifyUrl,
  metadata,
}: {
  verifyUrl: string;
  metadata?: {
    batchId?: string;
    contract?: string;
    chainId?: string;
  };
}) {
  const { t } = useAppPreferences();
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrError, setQrError] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  // Dynamically resolve the active base URL (e.g. http://localhost:5173 when developing locally)
  // so that clicking the link, copying it, or scanning the QR code resolves to the active instance.
  const activeOrigin =
    typeof window !== "undefined" && window.location.origin
      ? window.location.origin
      : "https://ziwachain.org";

  const activeVerifyUrl = useMemo(() => {
    if (!verifyUrl) return "";
    return verifyUrl.replace(/^https?:\/\/[^/]+/, activeOrigin);
  }, [verifyUrl, activeOrigin]);

  // Generate QR whenever the verifyUrl or metadata changes
  useEffect(() => {
    let cancelled = false;
    setQrDataUrl(null);
    setQrError(null);

    import("qrcode")
      .then(async (QRCode) => {
        // Attempt 1: full payload URL if within safe QR size (< 2,000 characters)
        if (activeVerifyUrl.length <= 2000) {
          try {
            return await QRCode.default.toDataURL(activeVerifyUrl, {
              errorCorrectionLevel: "L",
              margin: 2,
              scale: 6,
              color: {
                dark: "#004d43",
                light: "#ffffff",
              },
            });
          } catch {
            // fall through to lightweight fallback
          }
        }

        // Attempt 2: lightweight reference URL with on-chain identifiers (matches src/certificate/qr.ts)
        const baseUrl = `${activeOrigin}/verify`;
        const batchId = metadata?.batchId && metadata.batchId !== "-" ? metadata.batchId : "";
        const contract = metadata?.contract && metadata.contract !== "-" ? metadata.contract : "";
        const chainId = metadata?.chainId && metadata.chainId !== "-" ? metadata.chainId : "";

        const fallbackUrl = batchId
          ? `${baseUrl}?batchId=${encodeURIComponent(batchId)}${
              contract ? `&contract=${encodeURIComponent(contract)}` : ""
            }${chainId ? `&chainId=${encodeURIComponent(chainId)}` : ""}`
          : activeVerifyUrl;

        return await QRCode.default.toDataURL(fallbackUrl, {
          errorCorrectionLevel: "M",
          margin: 2,
          scale: 6,
          color: {
            dark: "#004d43",
            light: "#ffffff",
          },
        });
      })
      .then((dataUrl) => {
        if (!cancelled) setQrDataUrl(dataUrl);
      })
      .catch((err: unknown) => {
        if (!cancelled) setQrError(String(err));
      });

    return () => {
      cancelled = true;
    };
  }, [activeVerifyUrl, activeOrigin, metadata?.batchId, metadata?.contract, metadata?.chainId]);

  const handleCopyLink = useCallback(() => {
    void navigator.clipboard?.writeText(activeVerifyUrl).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2500);
    });
  }, [activeVerifyUrl]);

  return (
    <Card>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-8">
        {/* QR image */}
        <div className="shrink-0">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt={t.verify.qrAlt}
              width={192}
              height={192}
              className="rounded-2xl border-2 border-[var(--border-subtle)] bg-white shadow-md"
            />
          ) : qrError ? (
            <div className="flex h-48 w-48 items-center justify-center rounded-2xl border-2 border-[var(--error-border)] bg-[var(--error-bg)] p-4 text-center text-xs text-[var(--error-text)]">
              QR unavailable
            </div>
          ) : (
            /* skeleton while generating */
            <div className="flex h-48 w-48 animate-pulse items-center justify-center rounded-2xl border-2 border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
              <svg className="h-10 w-10 text-[var(--text-subtle)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
            </div>
          )}
        </div>

        {/* Text + copy action */}
        <div className="flex min-w-0 flex-col gap-3">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-[var(--text-heading)]">
              {t.verify.qrTitle}
            </h2>
            <p className="mt-1.5 text-sm leading-6 text-[var(--text-muted)]">
              {t.verify.qrDesc}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              id="btn-copy-cert-link"
              onClick={handleCopyLink}
              className={`inline-flex min-h-10 items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)] ${
                linkCopied
                  ? "border border-[var(--success-border)] bg-[var(--success-bg)] text-[var(--success-text)]"
                  : "border border-[var(--border-main)] bg-[var(--bg-card)] text-[var(--primary)] hover:bg-[var(--primary-light)] shadow-sm"
              }`}
              aria-live="polite"
            >
              {linkCopied ? (
                <>
                  {/* checkmark */}
                  <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                  {t.verify.qrLinkCopied}
                </>
              ) : (
                <>
                  {/* link icon */}
                  <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  {t.verify.qrCopyLink}
                </>
              )}
            </button>

            {/* Clickable link for desktop readability & immediate browser opening */}
            <a
              href={activeVerifyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden truncate font-mono text-[11px] text-[var(--primary)] hover:underline sm:inline-flex items-center gap-1 max-w-xs"
              title={activeVerifyUrl}
            >
              <span className="truncate">{activeVerifyUrl.length > 50 ? `${activeVerifyUrl.slice(0, 50)}…` : activeVerifyUrl}</span>
              <svg className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </Card>
  );
}


function SiteNav() {
  const [open, setOpen] = useState(false);
  const { language, setLanguage, theme, toggleTheme, t } = useAppPreferences();

  const handleHowItWorksClick = () => {
    setOpen(false);
    if (window.location.pathname === "/" || window.location.pathname === "") {
      const el = document.getElementById("how-it-works");
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
        window.history.pushState(null, "", "#how-it-works");
        return;
      }
    }
    window.location.href = "/#how-it-works";
  };

  return (
    <header className="sticky top-0 z-40 mb-6 border-b border-[var(--border-subtle)] bg-[var(--bg-nav)] backdrop-blur-md transition-colors duration-200">
      <nav
        className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6"
        aria-label="Main navigation"
      >
        <a
          href="/"
          onClick={() => setOpen(false)}
          className="group flex flex-col focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)] rounded-lg p-1"
        >
          <span className="text-xs font-black uppercase tracking-[0.24em] text-[var(--primary)] transition-colors">
            ZiwaChain
          </span>
          <span className="mt-0.5 text-xs font-medium text-[var(--text-muted)]">
            {t.nav.brandSubtitle}
          </span>
        </a>

        {/* Desktop Controls & Navigation */}
        <div className="hidden items-center gap-6 sm:flex">
          <div className="flex items-center gap-1.5">
            <a
              href="/"
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)] ${
                window.location.pathname === "/"
                  ? "text-[var(--primary)] bg-[var(--primary-light)] font-bold"
                  : "text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-main)]"
              }`}
            >
              {t.nav.home}
            </a>
            <button
              type="button"
              onClick={handleHowItWorksClick}
              className="rounded-lg px-3 py-2 text-sm font-semibold text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-secondary)] hover:text-[var(--text-main)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)]"
            >
              {t.nav.howItWorks}
            </button>
          </div>

          <div className="h-5 w-px bg-[var(--border-subtle)]" aria-hidden="true" />

          {/* Controls: Language and Theme */}
          <div className="flex items-center gap-3">
            {/* Language Segmented Control */}
            <fieldset
              className="m-0 inline-flex items-center rounded-xl border border-[var(--border-main)] bg-[var(--bg-card)] p-1 shadow-sm"
              aria-label="Language selection"
            >
              <button
                type="button"
                onClick={() => setLanguage("en")}
                aria-pressed={language === "en"}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)] ${
                  language === "en"
                    ? "bg-[var(--primary)] text-[var(--primary-fg)] shadow-xs"
                    : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLanguage("sw")}
                aria-pressed={language === "sw"}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)] ${
                  language === "sw"
                    ? "bg-[var(--primary)] text-[var(--primary-fg)] shadow-xs"
                    : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
                }`}
              >
                SW
              </button>
            </fieldset>

            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border-main)] bg-[var(--bg-card)] text-[var(--text-main)] shadow-sm transition hover:border-[var(--primary)] hover:text-[var(--primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)]"
              aria-label={theme === "light" ? t.nav.themeDark : t.nav.themeLight}
              title={theme === "light" ? t.nav.themeDark : t.nav.themeLight}
            >
              {theme === "light" ? (
                <svg
                  className="h-4.5 w-4.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                  />
                </svg>
              ) : (
                <svg
                  className="h-4.5 w-4.5 text-amber-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              )}
            </button>
          </div>

          <div className="h-5 w-px bg-[var(--border-subtle)]" aria-hidden="true" />

          {/* Single primary Check a record action (no duplicate Verify link) */}
          <a
            href="/verify"
            className="rounded-xl bg-[var(--primary)] px-4 py-2.5 text-center text-sm font-bold text-[var(--primary-fg)] shadow transition hover:bg-[var(--primary-hover)] active:bg-[var(--primary-active)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)] focus-visible:ring-offset-2"
          >
            {t.nav.checkRecord}
          </a>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex items-center gap-2 sm:hidden">
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--border-main)] bg-[var(--bg-card)] text-xl text-[var(--text-main)] shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)]"
            aria-label={open ? t.nav.closeMenu : t.nav.openMenu}
            aria-expanded={open}
            aria-controls="mobile-nav-menu"
            onClick={() => setOpen(!open)}
          >
            <span aria-hidden="true">{open ? "✕" : "☰"}</span>
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {open && (
          <div
            id="mobile-nav-menu"
            className="absolute left-4 right-4 top-full mt-2 flex flex-col gap-3 rounded-2xl border border-[var(--border-main)] bg-[var(--bg-card)] p-5 shadow-2xl transition-all sm:hidden"
          >
            <a
              href="/"
              onClick={() => setOpen(false)}
              className="rounded-xl px-3 py-2.5 text-base font-semibold text-[var(--text-main)] hover:bg-[var(--bg-secondary)]"
            >
              {t.nav.home}
            </a>
            <button
              type="button"
              onClick={handleHowItWorksClick}
              className="text-left rounded-xl px-3 py-2.5 text-base font-semibold text-[var(--text-main)] hover:bg-[var(--bg-secondary)]"
            >
              {t.nav.howItWorks}
            </button>

            <div className="my-1 h-px bg-[var(--border-subtle)]" />

            <div className="flex items-center justify-between px-2">
              <span className="text-sm font-semibold text-[var(--text-muted)]">Language / Lugha</span>
              <div className="inline-flex rounded-xl border border-[var(--border-main)] bg-[var(--bg-card)] p-1">
                <button
                  type="button"
                  onClick={() => setLanguage("en")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
                    language === "en"
                      ? "bg-[var(--primary)] text-[var(--primary-fg)]"
                      : "text-[var(--text-muted)]"
                  }`}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage("sw")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
                    language === "sw"
                      ? "bg-[var(--primary)] text-[var(--primary-fg)]"
                      : "text-[var(--text-muted)]"
                  }`}
                >
                  Kiswahili
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between px-2">
              <span className="text-sm font-semibold text-[var(--text-muted)]">Theme</span>
              <button
                type="button"
                onClick={toggleTheme}
                className="flex items-center gap-2 rounded-xl border border-[var(--border-main)] bg-[var(--bg-card)] px-3 py-1.5 text-xs font-bold text-[var(--text-main)]"
              >
                <span>{theme === "light" ? "☀️ Light" : "🌙 Dark"}</span>
              </button>
            </div>

            <div className="my-1 h-px bg-[var(--border-subtle)]" />

            <a
              href="/verify"
              onClick={() => setOpen(false)}
              className="mt-1 rounded-xl bg-[var(--primary)] py-3 text-center text-sm font-bold text-[var(--primary-fg)] shadow hover:bg-[var(--primary-hover)]"
            >
              {t.nav.checkRecord}
            </a>
          </div>
        )}
      </nav>
    </header>
  );
}

function SiteFooter() {
  const { t } = useAppPreferences();
  return (
    <footer className="mt-20 border-t border-[var(--border-subtle)] pt-10 text-sm leading-6 text-[var(--text-muted)]">
      <div className="grid gap-8 sm:grid-cols-[1fr_auto]">
        <div>
          <p className="font-extrabold uppercase tracking-wider text-[var(--primary)]">ZiwaChain</p>
          <p className="mt-2 max-w-md">{t.footer.tagline}</p>
          <p className="mt-3 max-w-md text-xs leading-5 text-[var(--text-subtle)]">
            {t.footer.disclaimer}
          </p>
        </div>
        <div className="flex flex-col gap-2.5 sm:min-w-44">
          <a href="/" className="font-medium hover:text-[var(--primary)]">
            {t.footer.home}
          </a>
          <a href="/#how-it-works" className="font-medium hover:text-[var(--primary)]">
            {t.footer.howItWorks}
          </a>
          <a href="/verify" className="font-semibold text-[var(--primary)] hover:underline">
            {t.footer.checkRecord}
          </a>
        </div>
      </div>
      <p className="mt-10 border-t border-[var(--border-subtle)] pt-6 text-xs text-[var(--text-subtle)]">
        {t.footer.copyright}
      </p>
    </footer>
  );
}

function HomePage() {
  const { t } = useAppPreferences();
  const [selectedJourneyStep, setSelectedJourneyStep] = useState(0);
  const [expandedSteps, setExpandedSteps] = useState<Record<number, boolean>>({});

  const toggleStep = (index: number) => {
    setExpandedSteps((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const journeySteps = t.home.journeySteps;
  const currentStep = journeySteps[selectedJourneyStep] || journeySteps[0];

  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-main)] transition-colors duration-200">
      <SiteNav />
      <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 sm:py-6">
        <main>
          {/* Hero Section */}
          <section className="grid gap-12 py-10 sm:py-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <h1 className="max-w-2xl text-4xl font-extrabold tracking-tight text-[var(--text-heading)] sm:text-6xl">
                {t.home.heroTitle}
              </h1>
              <p className="mt-6 max-w-xl text-base leading-8 text-[var(--text-muted)] sm:text-lg">
                {t.home.heroDesc}
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <a
                  href="/verify"
                  className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[var(--primary)] px-6 py-3 text-center text-sm font-bold text-[var(--primary-fg)] shadow-sm transition hover:bg-[var(--primary-hover)] active:bg-[var(--primary-active)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)] focus-visible:ring-offset-2"
                >
                  {t.home.heroCtaCheck}
                </a>
                <a
                  href="#how-it-works"
                  className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[var(--border-main)] bg-[var(--bg-card)] px-6 py-3 text-center text-sm font-bold text-[var(--text-main)] shadow-sm transition hover:border-[var(--primary)] hover:text-[var(--primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)] focus-visible:ring-offset-2"
                >
                  {t.home.heroCtaHow}
                </a>
              </div>
            </div>

            {/* Interactive Journey Diagram */}
            <div className="rounded-3xl border border-[var(--border-main)] bg-[var(--bg-secondary)] p-6 shadow-md sm:p-8">
              <div className="mb-4">
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-[var(--primary)]">
                  {t.home.journeyTitle}
                </h3>
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  {t.home.journeySubtitle}
                </p>
              </div>

              <div className="flex flex-col gap-2.5">
                {journeySteps.map((step, index) => {
                  const isSelected = selectedJourneyStep === index;
                  return (
                    <button
                      key={step.id}
                      type="button"
                      onClick={() => setSelectedJourneyStep(index)}
                      className={`flex w-full items-center gap-4 rounded-2xl p-4 text-left transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)] ${
                        isSelected
                          ? "bg-[var(--bg-card)] shadow-md ring-2 ring-[var(--primary)] scale-[1.01]"
                          : "bg-[var(--bg-card)]/70 hover:bg-[var(--bg-card)] hover:shadow-sm"
                      }`}
                      aria-pressed={isSelected}
                    >
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                          isSelected
                            ? "bg-[var(--primary)] text-[var(--primary-fg)] ring-2 ring-[var(--primary-fg)]"
                            : "bg-[var(--bg-secondary)] text-[var(--text-muted)]"
                        }`}
                      >
                        {index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <span
                          className={`block text-sm font-bold ${
                            isSelected ? "text-[var(--text-heading)]" : "text-[var(--text-main)]"
                          }`}
                        >
                          {step.label}
                        </span>
                      </div>
                      <span className="text-xs text-[var(--primary)] font-bold">
                        {isSelected ? "●" : "○"}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Dynamic Detail Card for selected step */}
              <div className="mt-5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 shadow-sm transition-all duration-200">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--primary)]">
                  <span>{t.home.stepPrefix || "Step"} 0{selectedJourneyStep + 1}:</span>
                  <span>{currentStep.label}</span>
                </div>
                <p className="mt-2 text-sm leading-6 text-[var(--text-main)]">
                  {currentStep.detail}
                </p>
              </div>

              <p className="mt-4 text-center text-xs leading-5 text-[var(--text-subtle)]">
                {t.home.journeyDisclaimer}
              </p>
            </div>
          </section>

          {/* Why keep a record? */}
          <section className="grid gap-8 border-y border-[var(--border-subtle)] py-14 sm:grid-cols-2 sm:py-16">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight text-[var(--text-heading)]">
                {t.home.whyTitle}
              </h2>
            </div>
            <div className="space-y-4 text-base leading-7 text-[var(--text-muted)]">
              <p>{t.home.whyP1}</p>
              <p>{t.home.whyP2}</p>
            </div>
          </section>

          {/* How it works: Four simple steps with interactive details */}
          <section id="how-it-works" className="scroll-mt-20 py-14 sm:py-20">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--primary)]">
                {t.home.howBadge}
              </p>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-[var(--text-heading)] sm:text-4xl">
                {t.home.howTitle}
              </h2>
            </div>
            <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              {t.home.howSteps.map((step, index) => {
                const isExpanded = !!expandedSteps[index];
                return (
                  <article
                    key={step.step}
                    className="flex flex-col justify-between rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 shadow-[var(--card-shadow)] transition hover:border-[var(--primary)]"
                  >
                    <div>
                      <span className="text-xs font-black tracking-wider text-[var(--primary)]">
                        {step.step}
                      </span>
                      <h3 className="mt-3 text-lg font-bold text-[var(--text-heading)]">
                        {step.title}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
                        {step.summary}
                      </p>
                      {isExpanded && (
                        <div className="mt-3 border-t border-[var(--border-subtle)] pt-3 text-xs leading-5 text-[var(--text-main)] animate-fadeIn">
                          {step.detail}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleStep(index)}
                      className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-[var(--primary)] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)] rounded py-1 cursor-pointer"
                      aria-expanded={isExpanded}
                    >
                      <span>{isExpanded ? t.home.readLess : t.home.readMore}</span>
                      <span aria-hidden="true">{isExpanded ? "▲" : "▼"}</span>
                    </button>
                  </article>
                );
              })}
            </div>
          </section>

          {/* Value Props Grid */}
          <section className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-6 py-12 sm:px-10">
            <h2 className="max-w-2xl text-2xl font-extrabold tracking-tight text-[var(--text-heading)] sm:text-3xl">
              {t.home.valueTitle}
            </h2>
            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {t.home.valueItems.map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 text-sm font-semibold text-[var(--text-main)] shadow-xs transition hover:translate-y-[-1px]"
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--primary-light)] text-xs text-[var(--primary)]">
                    ✓
                  </span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </section>

          {/* What a digital record can and cannot tell you */}
          <section className="grid gap-6 py-14 sm:grid-cols-2 sm:py-20">
            <div className="sm:pr-4">
              <h2 className="text-3xl font-extrabold tracking-tight text-[var(--text-heading)]">
                {t.home.trustTitle}
              </h2>
            </div>
            <div className="space-y-4">
              <div className="rounded-2xl border border-[var(--success-border)] bg-[var(--success-bg)] p-5">
                <h3 className="font-bold text-[var(--success-text)]">{t.home.canTellTitle}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--success-text)]">
                  {t.home.canTellDesc}
                </p>
              </div>
              <div className="rounded-2xl border border-[var(--warning-border)] bg-[var(--warning-bg)] p-5">
                <h3 className="font-bold text-[var(--warning-text)]">{t.home.cannotProveTitle}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--warning-text)]">
                  {t.home.cannotProveDesc}
                </p>
              </div>
            </div>
          </section>

          {/* Have a collection certificate banner */}
          <section className="rounded-3xl border border-[var(--primary)] bg-[var(--primary)] px-6 py-12 text-[var(--primary-fg)] shadow-lg sm:px-10">
            <h2 className="text-3xl font-extrabold tracking-tight">
              {t.home.ctaBannerTitle}
            </h2>
            <p className="mt-3 max-w-xl text-base leading-7 opacity-90">
              {t.home.ctaBannerDesc}
            </p>
            <a
              href="/verify"
              className="mt-7 inline-flex items-center justify-center rounded-xl bg-[var(--bg-card)] px-6 py-3 text-sm font-bold text-[var(--text-heading)] shadow transition hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2"
            >
              {t.home.ctaBannerBtn}
            </a>
          </section>
        </main>

        <SiteFooter />
      </div>
    </div>
  );
}

function VerifyPage() {
  const { language, t } = useAppPreferences();
  const [json, setJson] = useState("");
  const [results, setResults] = useState<Results | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeDemo, setActiveDemo] = useState<string | null>(null);
  const [codeInput, setCodeInput] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  const handleCodeLookup = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = codeInput.trim();
    if (!query) return;
    const samples = [
      { tag: "batchA", cert: SAMPLE_BATCH_A },
      { tag: "batchB", cert: SAMPLE_BATCH_B },
      { tag: "batchC", cert: SAMPLE_BATCH_C },
      { tag: "batchD", cert: SAMPLE_BATCH_D },
    ];
    const match = samples.find(
      (s: any) =>
        s.cert?.shortCode?.toUpperCase() === query.toUpperCase() ||
        s.cert?.batchId?.toLowerCase() === query.toLowerCase() ||
        (s.cert?.batchId && s.cert.batchId.toLowerCase().includes(query.toLowerCase()))
    );
    if (match) {
      loadSample(match.cert, match.tag);
    } else if (query.startsWith("{")) {
      void verify(query, "manual");
    } else {
      setResults({
        ...emptyResults,
        status: "failed",
        statusText:
          language === "sw"
            ? `Msimbo "${query}" haukupatikana kwenye kumbukumbu za mfano. Tafadhali thibitisha msimbo au fungua kiungo cha cheti.`
            : `Code "${query}" was not found in sample records. Please check the code or use a certificate link.`,
      });
    }
  };

  const formatMassValue = (val: string) => {
    if (!val || val === "-" || val.toLowerCase().includes("not recorded")) {
      return language === "sw" ? "Haijarekodiwa bado" : "Not recorded yet";
    }
    return val;
  };

  const verify = async (value: string, demoTag?: string) => {
    if (!value.trim()) {
      setResults({
        ...emptyResults,
        status: "failed",
        statusText: "Enter a certificate JSON or use a certificate link before checking.",
      });
      return;
    }
    setActiveDemo(demoTag || null);
    setJson(value);
    setResults({
      ...emptyResults,
      status: "loading",
      statusText: "Checking the certificate in your browser...",
    });

    try {
      const res = await runVerification(value);
      setResults(res || readResults());
    } catch {
      setResults({
        ...emptyResults,
        status: "failed",
        statusText: "Unable to complete cryptographic check.",
      });
    }
  };

  const loadSample = (sample: unknown, demoTag: string) => {
    if (sample) void verify(JSON.stringify(sample, null, 2), demoTag);
  };

  const loadTampered = () => {
    const tampered = JSON.parse(JSON.stringify(SAMPLE_BATCH_A));
    if (tampered?.stages?.HARVEST_LOGGED?.payload) {
      tampered.stages.HARVEST_LOGGED.payload.quantityKg = 1001;
    }
    void verify(JSON.stringify(tampered, null, 2), "tampered");
  };

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => void verify(String(reader.result || ""), "file");
    reader.readAsText(file);
    event.target.value = "";
  };

  useEffect(() => {
    const checkUrl = () => {
      const hash = window.location.hash;
      if (hash && hash.includes("#c=")) {
        try {
          const base64UrlData = hash.split("#c=")[1];
          const decoded = JSON.parse(fromBase64Url(base64UrlData));
          const value = JSON.stringify(decoded, null, 2);
          setJson(value);
          setResults({
            ...emptyResults,
            status: "loading",
            statusText: "Checking the certificate in your browser...",
          });
          void runVerification(value).then((res) => setResults(res || readResults()));
          return;
        } catch {
          setResults({
            ...emptyResults,
            status: "failed",
            statusText: "Certificate not found — check the link and try again.",
          });
          return;
        }
      }

      // Handle ?batchId= from scanned fallback QR codes
      const searchParams = new URLSearchParams(window.location.search);
      const batchIdParam = searchParams.get("batchId");
      if (batchIdParam) {
        const samples = [
          { tag: "batchA", cert: SAMPLE_BATCH_A },
          { tag: "batchB", cert: SAMPLE_BATCH_B },
          { tag: "batchC", cert: SAMPLE_BATCH_C },
          { tag: "batchD", cert: SAMPLE_BATCH_D },
        ];
        const match = samples.find(
          (s: any) => s.cert?.batchId?.toLowerCase() === batchIdParam.toLowerCase()
        );
        if (match) {
          const value = JSON.stringify(match.cert, null, 2);
          setActiveDemo(match.tag);
          setJson(value);
          setResults({
            ...emptyResults,
            status: "loading",
            statusText: "Checking the certificate in your browser...",
          });
          void runVerification(value).then((res) => setResults(res || readResults()));
        }
      }
    };

    checkUrl();
    window.addEventListener("hashchange", checkUrl);
    return () => window.removeEventListener("hashchange", checkUrl);
  }, []);

  const copy = (key: string, value: string) => {
    if (value && value !== "-") {
      void navigator.clipboard?.writeText(value);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  const copyable = (key: string, label: string, value: string) => {
    const isCopied = copiedKey === key;
    return (
      <div className="flex min-w-0 items-start justify-between gap-3 border-b border-[var(--border-subtle)] py-3 last:border-0">
        <dt className="shrink-0 text-sm font-semibold text-[var(--text-muted)]">{label}</dt>
        <dd className="min-w-0 break-all text-right font-mono text-xs text-[var(--text-main)]">
          <span>{value}</span>
          {value !== "-" && (
            <button
              type="button"
              onClick={() => copy(key, value)}
              aria-label={`${t.verify.copy} ${label}`}
              className={`ml-2 min-h-7 rounded-md border px-2 py-0.5 text-[11px] font-sans font-semibold transition cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)] ${
                isCopied
                  ? "border-[var(--success-border)] bg-[var(--success-bg)] text-[var(--success)]"
                  : "border-[var(--border-main)] bg-[var(--bg-card)] text-[var(--primary)] hover:bg-[var(--primary-light)]"
              }`}
            >
              {isCopied ? t.verify.copied : t.verify.copy}
            </button>
          )}
        </dd>
      </div>
    );
  };

  const copyText = results
    ? getStatusBannerCopy(results.status, results.statusText, results.rejectionReason, language)
    : null;

  const latestEvent =
    results && results.timeline.length > 0
      ? results.timeline[results.timeline.length - 1]
      : undefined;

  const rawStage =
    results?.stageName ||
    (latestEvent
      ? getTranslatedTimeline(latestEvent.title, latestEvent.details, language).title.replace(/\.$/, "")
      : t.verify.timelineEmpty);

  const latestStage = getTranslatedStageName(rawStage, language);

  const massItems = results
    ? [
        [t.verify.amountsHarvested, results.mass.harvested],
        [t.verify.amountsAccepted, results.mass.accepted],
        [t.verify.amountsProcessed, results.mass.processed],
        [t.verify.amountsEndUse, results.mass.endUse],
      ]
    : [];

  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-main)] transition-colors duration-200">
      <SiteNav />
      <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6 sm:py-6">
        <header className="mb-8">
          <div className="max-w-2xl">
            <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text-heading)] sm:text-5xl">
              {t.verify.headerTitle}
            </h1>
            <p className="mt-3 text-base leading-7 text-[var(--text-muted)] sm:text-lg">
              {t.verify.headerDesc}
            </p>
          </div>
        </header>

        <main className="space-y-6">
          {/* Top Card: Public Verification & Code Search */}
          <Card title={t.verify.openCardTitle}>
            <p className="text-sm leading-6 text-[var(--text-muted)]">
              {t.verify.openCardDesc1}
            </p>

            {/* Quick search by certificate code or batch ID */}
            <form onSubmit={handleCodeLookup} className="mt-5 flex flex-col gap-3 sm:flex-row">
              <input
                id="inputCertCode"
                type="text"
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value)}
                placeholder={t.verify.searchPlaceholder}
                className="min-h-11 flex-1 rounded-xl border border-[var(--border-main)] bg-[var(--bg-input)] px-4 py-2 font-mono text-sm text-[var(--text-main)] outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-light)]"
              />
              <Button variant="primary" type="submit">
                {t.verify.btnSearch}
              </Button>
            </form>

            {/* Working Demonstration Examples - prominent and clearly labeled */}
            <div className="mt-6 border-t border-[var(--border-subtle)] pt-4">
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--text-subtle)]">
                {t.verify.demoExamplesTitle}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  id="btnLoadBatchA"
                  variant={activeDemo === "batchA" ? "active" : "outline"}
                  onClick={() => loadSample(SAMPLE_BATCH_A, "batchA")}
                >
                  {t.verify.demoWorking}
                </Button>
                <Button
                  id="btnLoadBatchB"
                  variant={activeDemo === "batchB" ? "active" : "outline"}
                  onClick={() => loadSample(SAMPLE_BATCH_B, "batchB")}
                >
                  {t.verify.demoRejected}
                </Button>
                <Button
                  id="btnLoadBatchC"
                  variant={activeDemo === "batchC" ? "active" : "outline"}
                  onClick={() => loadSample(SAMPLE_BATCH_C, "batchC")}
                >
                  {t.verify.demoCorrected}
                </Button>
                <Button
                  id="btnLoadBatchD"
                  variant={activeDemo === "batchD" ? "active" : "outline"}
                  onClick={() => loadSample(SAMPLE_BATCH_D, "batchD")}
                >
                  {t.verify.demoRepeated}
                </Button>
                <Button
                  id="btnTamperTest"
                  variant={activeDemo === "tampered" ? "danger" : "outline"}
                  onClick={loadTampered}
                >
                  {t.verify.demoChanged}
                </Button>
              </div>
            </div>

            {/* Advanced Section: Developer / Testing tools (JSON paste & upload) */}
            <details className="mt-5 border-t border-[var(--border-subtle)] pt-3 group">
              <summary className="cursor-pointer text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--primary)] focus:outline-none py-1">
                {t.verify.advancedJsonTitle}
              </summary>
              <div className="mt-3 space-y-3">
                <label
                  htmlFor="certificateJson"
                  className="block text-xs font-semibold text-[var(--text-main)]"
                >
                  {t.verify.pasteLabel}
                </label>
                <textarea
                  id="certificateJson"
                  value={json}
                  onChange={(event) => setJson(event.target.value)}
                  placeholder={t.verify.pastePlaceholder}
                  className="mt-1 min-h-28 w-full resize-y rounded-xl border border-[var(--border-main)] bg-[var(--bg-input)] p-3 font-mono text-xs text-[var(--text-main)] outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-light)]"
                  aria-describedby="lookup-help"
                />
                <p id="lookup-help" className="text-[11px] text-[var(--text-subtle)]">
                  {t.verify.pasteHelp}
                </p>

                <div className="flex flex-wrap items-center gap-3">
                  <Button variant="primary" onClick={() => void verify(json, "manual")}>
                    {t.verify.btnCheck}
                  </Button>
                  <label
                    htmlFor="fileInputReact"
                    className="inline-flex min-h-10 cursor-pointer items-center justify-center rounded-xl border border-[var(--border-main)] bg-[var(--bg-card)] px-4 py-2 text-xs font-semibold text-[var(--text-main)] shadow-sm hover:border-[var(--primary)] hover:text-[var(--primary)]"
                  >
                    {t.verify.btnChooseFile}
                    <input
                      ref={fileInput}
                      id="fileInputReact"
                      type="file"
                      accept=".json,application/json"
                      onChange={handleFile}
                      className="sr-only"
                    />
                  </label>
                </div>
              </div>
            </details>
          </Card>

          {/* 1. Label indicating real or synthetic demonstration record */}
          {results && (
            <div
              role="note"
              className="flex items-center justify-between rounded-xl border border-[var(--badge-demo-border)] bg-[var(--badge-demo-bg)] px-4 py-3 text-xs font-semibold text-[var(--badge-demo-text)] shadow-xs"
            >
              <span>
                {results.isSyntheticDemo
                  ? t.verify.demoRecordNotice
                  : language === "sw"
                    ? "Rekodi halisi ya mkusanyiko"
                    : "Real collection record"}
              </span>
              <span className="rounded-md border border-[var(--badge-demo-border)] px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider">
                {results.isSyntheticDemo
                  ? t.verify.demoBadge
                  : language === "sw"
                    ? "HALISI"
                    : "REAL"}
              </span>
            </div>
          )}

          {/* 2. Plain Language Certificate-Check Result (Status Banner) */}
          {results && copyText && (
            <div
              role="status"
              aria-live="polite"
              className={`rounded-2xl border p-5 shadow-sm transition-all ${
                results.status === "verified"
                  ? "border-[var(--success-border)] bg-[var(--success-bg)] text-[var(--success-text)]"
                  : results.status === "rejected"
                    ? "border-[var(--warning-border)] bg-[var(--warning-bg)] text-[var(--warning-text)]"
                    : results.status === "failed"
                      ? "border-[var(--error-border)] bg-[var(--error-bg)] text-[var(--error-text)]"
                      : "border-[var(--border-main)] bg-[var(--bg-card)] text-[var(--text-main)]"
              }`}
            >
              <div className="flex items-start gap-4">
                <span
                  aria-hidden="true"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-current text-lg font-bold"
                >
                  {copyText.icon}
                </span>
                <div>
                  <h2 className="text-lg font-bold tracking-tight">{copyText.label}</h2>
                  <p className="mt-1 text-sm leading-6 opacity-95">{copyText.text}</p>
                </div>
              </div>
            </div>
          )}

          {/* Verification Results: Items 3 through 7 */}
          {results && results.status !== "loading" && (
            <section className="space-y-6" aria-label="Certificate results details">
              {/* 3. Simple Summary of the Amounts (Collected, Accepted, Processed, Put to Use) */}
              <Card title={t.verify.amountsTitle}>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  {massItems.map(([label, value]) => {
                    const displayVal = formatMassValue(value);
                    const isMissing =
                      displayVal === "Not recorded yet" || displayVal === "Haijarekodiwa bado";
                    return (
                      <div
                        key={label}
                        className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-4"
                      >
                        <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-subtle)]">
                          {label}
                        </p>
                        <p
                          className={`mt-2 text-xl font-extrabold ${
                            isMissing
                              ? "text-sm font-semibold text-[var(--text-muted)] italic"
                              : "text-[var(--text-heading)]"
                          }`}
                        >
                          {displayVal}
                        </p>
                      </div>
                    );
                  })}
                </div>
                {results.massStatus && (
                  <p
                    className={`mt-4 text-sm font-bold ${
                      results.massStatus.includes("warning") ||
                      results.massStatus.includes("Violated")
                        ? "text-[var(--error)]"
                        : "text-[var(--primary)]"
                    }`}
                  >
                    {getTranslatedMassStatus(results.massStatus, language)}
                  </p>
                )}
                <p className="mt-4 text-xs leading-5 text-[var(--text-subtle)]">
                  {t.verify.amountsDisclaimer}
                </p>
              </Card>

              {/* 4. The Collection's Recorded Journey (Chronological Order) */}
              <Card title={t.verify.timelineTitle}>
                <div className="space-y-0">
                  {results.timeline.length ? (
                    results.timeline.map((event) => {
                      const translatedEvent = getTranslatedTimeline(
                        event.title,
                        event.details,
                        language
                      );
                      return (
                        <div
                          key={`${event.stageKey || event.title}-${event.rawTxHash || event.tx || event.meta}`}
                          className="relative flex gap-4 border-l-2 border-[var(--border-main)] pb-7 pl-6 last:border-transparent last:pb-0"
                        >
                          <span
                            aria-hidden="true"
                            className="absolute -left-[9px] top-1 h-4 w-4 rounded-full border-4 border-[var(--bg-card)] bg-[var(--primary)]"
                          />
                          <div className="min-w-0">
                            <h3 className="font-bold text-[var(--text-heading)]">
                              {translatedEvent.title}
                            </h3>
                            <p className="mt-0.5 text-xs text-[var(--text-subtle)]">{event.meta}</p>
                            <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">
                              {translatedEvent.details}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-[var(--text-muted)]">{t.verify.timelineEmpty}</p>
                  )}
                </div>
              </Card>

              {/* 5. Relevant Warnings or Missing Information */}
              {/* Rejection outcome card */}
              {results.status === "rejected" && (
                <Card title={t.verify.rejectionTitle}>
                  <div className="rounded-2xl border border-[var(--error-border)] bg-[var(--error-bg)] p-5 text-[var(--error-text)]">
                    <p className="font-bold">{t.verify.rejectionHeader}</p>
                    <p className="mt-1 text-sm">
                      {results.rejectionReason
                        ? `${language === "sw" ? "Sababu: " : "Reason: "}${
                            language === "sw" &&
                            (results.rejectionReason.toLowerCase().includes("mud") ||
                              results.rejectionReason.toLowerCase().includes("contamination"))
                              ? "Matope mengi na uchafu usio wa kibaolojia uliovuka kiwango kinachoruhusiwa."
                              : results.rejectionReason
                          }`
                        : "Quality inspection threshold was not met."}
                    </p>
                    <p className="mt-3 text-xs leading-5 font-semibold opacity-90">
                      {t.verify.rejectionRule}
                    </p>
                  </div>
                </Card>
              )}

              {/* Notice Cards (duplicate evidence flag, correction notice, etc.) */}
              {results.checks.some((check) => check.status === "notice") && (
                <Card title={t.verify.thingsTitle}>
                  <ul className="space-y-3">
                    {results.checks
                      .filter((check) => check.status === "notice")
                      .map((check, index) => {
                        const publicCheck = getTranslatedCheck(check, language);
                        return (
                          <li
                            key={`notice-${check.title || index}`}
                            className="rounded-2xl border border-[var(--warning-border)] bg-[var(--warning-bg)] p-4 text-[var(--warning-text)]"
                          >
                            <p className="font-bold">{publicCheck.title}</p>
                            <p className="mt-1 text-sm leading-6 opacity-95">
                              {publicCheck.description}
                            </p>
                          </li>
                        );
                      })}
                  </ul>
                </Card>
              )}

              {/* Notice if collection has not completed later stages */}
              {results.status === "verified" &&
                results.mass.accepted === "Not recorded yet" &&
                results.mass.processed === "Not recorded yet" && (
                  <div
                    role="note"
                    className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-4 text-xs text-[var(--text-muted)]"
                  >
                    {t.verify.missingDownstreamNotice}
                  </div>
                )}

              {/* 6. Certificate Code & Working QR / Link Section */}
              {results.verifyUrl && (
                <Card title={t.verify.codeCardTitle}>
                  <div className="space-y-6">
                    <dl className="grid gap-4 sm:grid-cols-2">
                      {copyable("shortCode", t.verify.certificateCode, results.metadata.shortCode)}
                    </dl>
                    <QrShareCard verifyUrl={results.verifyUrl} metadata={results.metadata} />
                  </div>
                </Card>
              )}

              {/* 7. Expandable Section for Technical Details */}
              <Card>
                <details className="group">
                  <summary className="flex cursor-pointer items-center justify-between text-base font-bold text-[var(--text-heading)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)] rounded py-1">
                    <span>{t.verify.techTitle}</span>
                    <span
                      className="text-xs transition-transform group-open:rotate-180"
                      aria-hidden="true"
                    >
                      ▼
                    </span>
                  </summary>
                  <div className="mt-5 space-y-6 border-t border-[var(--border-subtle)] pt-4">
                    {/* Internal Batch ID */}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-subtle)]">
                        {t.verify.batchId}
                      </h4>
                      <div className="mt-1 flex items-center justify-between rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-3">
                        <span className="font-mono text-xs text-[var(--text-main)] break-all">
                          {results.metadata.batchId}
                        </span>
                        <button
                          type="button"
                          onClick={() => copy("batchId", results.metadata.batchId)}
                          className="ml-3 shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold border border-[var(--border-main)] hover:bg-[var(--bg-card)]"
                        >
                          {copiedKey === "batchId" ? t.verify.copied : t.verify.copy}
                        </button>
                      </div>
                    </div>

                    {/* Work Credits attribution */}
                    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-4">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[var(--text-heading)]">
                          {t.verify.creditsTitle}
                        </span>
                        <span className="text-lg font-extrabold text-[var(--primary)]">
                          {results.credits} {t.verify.creditsRecordedSuffix}
                        </span>
                      </div>
                      <p className="mt-2 text-xs leading-5 text-[var(--text-muted)]">
                        {t.verify.creditsDesc}
                      </p>
                    </div>

                    {/* Cryptographic & Protocol Verification Checklist */}
                    <div>
                      <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-[var(--text-subtle)]">
                        {language === "sw"
                          ? "Ukaguzi wa Kriptografia na Kanuni za Mnyororo"
                          : "Cryptographic & Protocol Verification Checklist"}
                      </h4>
                      <ul className="space-y-3">
                        {results.checks.map((check, index) => {
                          const publicCheck = getTranslatedCheck(check, language);
                          return (
                            <li
                              key={`check-${check.title}`}
                              className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-4"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="font-semibold text-[var(--text-main)]">
                                  {publicCheck.title}
                                </span>
                                <span
                                  className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${
                                    check.status === "pass"
                                      ? "bg-[var(--success-bg)] text-[var(--success-text)] border border-[var(--success-border)]"
                                      : check.status === "fail"
                                        ? "bg-[var(--error-bg)] text-[var(--error-text)] border border-[var(--error-border)]"
                                        : "bg-[var(--warning-bg)] text-[var(--warning-text)] border border-[var(--warning-border)]"
                                  }`}
                                >
                                  {check.status === "pass"
                                    ? t.verify.badgeMatched
                                    : check.status === "fail"
                                      ? t.verify.badgeNotMatched
                                      : t.verify.badgeLookCloser}
                                </span>
                              </div>
                              <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">
                                {publicCheck.description}
                              </p>
                            </li>
                          );
                        })}
                      </ul>
                    </div>

                    {/* Technical Stage References (Block numbers, actor addresses, tx hashes) */}
                    <div>
                      <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-[var(--text-subtle)]">
                        {language === "sw"
                          ? "Kumbukumbu za Hatua kwenye Mnyororo"
                          : "On-Chain Stage References"}
                      </h4>
                      <div className="space-y-2">
                        {results.timeline.map((ev, idx) => (
                          <div
                            key={`tech-${ev.stageKey ?? ev.title}-${ev.blockNumber ?? ""}-${ev.actor ?? ""}`}
                            className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-3 text-xs space-y-1"
                          >
                            <div className="flex justify-between font-semibold text-[var(--text-main)]">
                              <span>{ev.stageKey || ev.title}</span>
                              {ev.blockNumber && (
                                <span className="font-mono text-[var(--text-subtle)]">
                                  Block #{ev.blockNumber}
                                </span>
                              )}
                            </div>
                            {ev.actor && (
                              <div className="text-[var(--text-muted)] font-mono text-[11px] break-all">
                                Actor: {ev.actor}
                              </div>
                            )}
                            {ev.tx && (
                              <div className="flex items-center justify-between pt-1">
                                <span className="font-mono text-[11px] text-[var(--primary)] break-all">
                                  {ev.rawTxHash || ev.tx}
                                </span>
                                {ev.rawTxHash && (
                                  <button
                                    type="button"
                                    onClick={() => copy(`tx-${idx}`, ev.rawTxHash!)}
                                    className="ml-2 shrink-0 rounded px-2 py-0.5 text-[10px] font-semibold border border-[var(--border-main)] hover:bg-[var(--bg-card)]"
                                  >
                                    {copiedKey === `tx-${idx}` ? t.verify.copied : t.verify.copy}
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Contract, Chain, Payment Reference */}
                    <dl className="border-t border-[var(--border-subtle)] pt-3 grid gap-3 sm:grid-cols-3">
                      {copyable("contract", t.verify.contract, results.metadata.contract)}
                      {copyable("chainId", t.verify.chain, results.metadata.chainId)}
                      {copyable("paymentRef", t.verify.paymentRef, results.metadata.paymentRef)}
                    </dl>
                  </div>
                </details>
              </Card>
            </section>
          )}
        </main>

        <SiteFooter />
      </div>

      {/* Hidden DOM elements for backward compatibility with DOM verification listeners */}
      <div aria-hidden="true" className="hidden">
        <div id="resultsArea">
          <div id="statusBanner" />
          <ul id="checklist" />
          <div id="massHarvested" />
          <div id="massAccepted" />
          <div id="massProcessed" />
          <div id="massEndUse" />
          <div id="massBalanceStatus" />
          <span id="creditsDisplay" />
          <span id="pseudonymDisplay" />
          <div id="timelineContainer" />
          <span id="metaBatchId" />
          <span id="metaContract" />
          <span id="metaChainId" />
          <span id="metaShortCode" />
          <span id="metaPaymentRef" />
          <span id="rpcDisplay" />
        </div>
        <textarea id="jsonInput" />
        <input id="fileInputLegacy" />
        <button id="btnVerify" type="button" />
        <button id="btnLoadBatchA" type="button" />
        <button id="btnLoadBatchB" type="button" />
        <button id="btnTamperTest" type="button" />
        <button id="btnLoadBatchC" type="button" />
        <button id="btnLoadBatchD" type="button" />
        <input id="fileInput" />
      </div>
    </div>
  );
}

function App() {
  const isVerify =
    window.location.pathname === "/verify" ||
    window.location.pathname.startsWith("/verify/") ||
    window.location.pathname === "/verify/index.html";

  return (
    <AppPreferencesProvider>
      {isVerify ? <VerifyPage /> : <HomePage />}
    </AppPreferencesProvider>
  );
}

const rootEl = document.getElementById("root");
if (rootEl) {
  createRoot(rootEl).render(<App />);
}
