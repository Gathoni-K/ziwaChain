import React, { ChangeEvent, useEffect, useRef, useState, type ReactNode } from "react";
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
  formatLocaleDate,
  getStatusBannerCopy,
  getTranslatedCheck,
  getTranslatedTimeline,
  getTranslatedMassStatus,
  getTranslatedStageName,
} from "./i18n";
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
}: {
  children: ReactNode;
  variant?: "outline" | "danger" | "primary" | "ghost" | "active";
  onClick?: () => void;
  className?: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  ariaLabel?: string;
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

function SiteNav() {
  const [open, setOpen] = useState(false);
  const { language, setLanguage, theme, toggleTheme, t } = useAppPreferences();

  const handleHowItWorksClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    setOpen(false);
    if (window.location.pathname === "/" || window.location.pathname === "") {
      const el = document.getElementById("how-it-works");
      if (el) {
        e.preventDefault();
        el.scrollIntoView({ behavior: "smooth" });
        window.history.pushState(null, "", "#how-it-works");
      }
    }
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
            <a
              href="/#how-it-works"
              onClick={handleHowItWorksClick}
              className="rounded-lg px-3 py-2 text-sm font-semibold text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-secondary)] hover:text-[var(--text-main)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)]"
            >
              {t.nav.howItWorks}
            </a>
          </div>

          <div className="h-5 w-px bg-[var(--border-subtle)]" aria-hidden="true" />

          {/* Controls: Language and Theme */}
          <div className="flex items-center gap-3">
            {/* Language Segmented Control */}
            <div
              className="inline-flex items-center rounded-xl border border-[var(--border-main)] bg-[var(--bg-card)] p-1 shadow-sm"
              role="group"
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
            </div>

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
            <a
              href="/#how-it-works"
              onClick={handleHowItWorksClick}
              className="rounded-xl px-3 py-2.5 text-base font-semibold text-[var(--text-main)] hover:bg-[var(--bg-secondary)]"
            >
              {t.nav.howItWorks}
            </a>

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
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-main)] bg-[var(--bg-card)] px-3.5 py-1 text-xs font-bold uppercase tracking-[0.16em] text-[var(--primary)] shadow-xs">
                <span className="h-2 w-2 rounded-full bg-[var(--primary)] animate-pulse" />
                {t.home.heroBadge}
              </div>
              <h1 className="mt-5 max-w-2xl text-4xl font-extrabold tracking-tight text-[var(--text-heading)] sm:text-6xl">
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
            <div
              className="rounded-3xl border border-[var(--border-main)] bg-[var(--bg-secondary)] p-6 shadow-md sm:p-8"
              aria-label={t.home.journeyTitle}
            >
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
                  <span>Step 0{selectedJourneyStep + 1}:</span>
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
  const fileInput = useRef<HTMLInputElement>(null);

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
    const checkHash = () => {
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
        } catch {
          setResults({
            ...emptyResults,
            status: "failed",
            statusText: "Certificate not found — check the link and try again.",
          });
        }
      }
    };

    checkHash();
    window.addEventListener("hashchange", checkHash);
    return () => window.removeEventListener("hashchange", checkHash);
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
          {/* Main Certificate Input / Demo Loader */}
          <Card title={t.verify.openCardTitle}>
            <p className="text-sm leading-6 text-[var(--text-muted)]">
              {t.verify.openCardDesc1}
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
              {t.verify.openCardDesc2}
            </p>

            <details className="mt-5 border-t border-[var(--border-subtle)] pt-4">
              <summary className="cursor-pointer text-sm font-bold text-[var(--primary)] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)] rounded py-1">
                {t.verify.moreWaysSummary}
              </summary>
              <div className="mt-4">
                <label
                  htmlFor="certificateJson"
                  className="block text-sm font-semibold text-[var(--text-main)]"
                >
                  {t.verify.pasteLabel}
                </label>
                <textarea
                  id="certificateJson"
                  value={json}
                  onChange={(event) => setJson(event.target.value)}
                  placeholder={t.verify.pastePlaceholder}
                  className="mt-3 min-h-32 w-full resize-y rounded-xl border border-[var(--border-main)] bg-[var(--bg-input)] p-3 font-mono text-xs text-[var(--text-main)] outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-light)]"
                  aria-describedby="lookup-help"
                />
                <p id="lookup-help" className="mt-2 text-xs text-[var(--text-subtle)]">
                  {t.verify.pasteHelp}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <Button variant="primary" onClick={() => void verify(json, "manual")}>
                    {t.verify.btnCheck}
                  </Button>
                  <label
                    htmlFor="fileInputReact"
                    className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-xl border border-[var(--border-main)] bg-[var(--bg-card)] px-4 py-2.5 text-sm font-semibold text-[var(--text-main)] shadow-sm hover:border-[var(--primary)] hover:text-[var(--primary)] focus-within:ring-2 focus-within:ring-[var(--ring-focus)]"
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

                {/* Demo record buttons */}
                <div className="mt-6 border-t border-[var(--border-subtle)] pt-4">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--text-subtle)]">
                    {t.verify.demoHeader}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={activeDemo === "batchA" ? "active" : "outline"}
                      onClick={() => loadSample(SAMPLE_BATCH_A, "batchA")}
                    >
                      {t.verify.demoWorking}
                    </Button>
                    <Button
                      variant={activeDemo === "batchB" ? "active" : "outline"}
                      onClick={() => loadSample(SAMPLE_BATCH_B, "batchB")}
                    >
                      {t.verify.demoRejected}
                    </Button>
                    <Button
                      variant={activeDemo === "tampered" ? "danger" : "outline"}
                      onClick={loadTampered}
                    >
                      {t.verify.demoChanged}
                    </Button>
                    <Button
                      variant={activeDemo === "batchC" ? "active" : "outline"}
                      onClick={() => loadSample(SAMPLE_BATCH_C, "batchC")}
                    >
                      {t.verify.demoCorrected}
                    </Button>
                    <Button
                      variant={activeDemo === "batchD" ? "active" : "outline"}
                      onClick={() => loadSample(SAMPLE_BATCH_D, "batchD")}
                    >
                      {t.verify.demoRepeated}
                    </Button>
                  </div>
                </div>
              </div>
            </details>
          </Card>

          {/* Testnet demonstration notice */}
          {results && results.isSyntheticDemo && (
            <div
              role="note"
              className="flex items-center justify-between rounded-xl border border-[var(--badge-demo-border)] bg-[var(--badge-demo-bg)] px-4 py-3 text-xs font-semibold text-[var(--badge-demo-text)] shadow-xs"
            >
              <span>{t.verify.demoRecordNotice}</span>
              <span className="rounded-md border border-[var(--badge-demo-border)] px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider">
                {t.verify.demoBadge}
              </span>
            </div>
          )}

          {/* Dynamic Status Banner */}
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

          {/* Verification Results Cards */}
          {results && results.status !== "loading" && (
            <section className="space-y-6" aria-label="Certificate results details">
              {/* Batch at a glance */}
              <Card title={t.verify.glanceTitle}>
                <div className="grid gap-6 sm:grid-cols-[1fr_auto]">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-subtle)]">
                      {t.verify.harvestedLabel}
                    </p>
                    <p className="mt-1 text-3xl font-extrabold text-[var(--primary)]">
                      {results.mass.harvested}
                    </p>
                    <p className="mt-1 text-sm text-[var(--text-muted)]">
                      {t.verify.harvestedDesc}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-4 sm:min-w-56">
                    <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-subtle)]">
                      {t.verify.progressLabel}
                    </p>
                    <p className="mt-1 text-xl font-bold text-[var(--text-heading)]">
                      {latestStage}
                    </p>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">
                      {t.verify.progressNote}
                    </p>
                  </div>
                </div>

                {/* Localized Dates */}
                {results.recordedDates && (
                  <dl className="mt-6 grid grid-cols-2 gap-3 border-t border-[var(--border-subtle)] pt-4 sm:grid-cols-3">
                    {results.recordedDates.collectedAt && (
                      <div>
                        <dt className="text-xs font-medium text-[var(--text-subtle)]">
                          {t.verify.dates.collectedOn}
                        </dt>
                        <dd className="mt-0.5 text-sm font-semibold text-[var(--text-main)]">
                          {formatLocaleDate(results.recordedDates.collectedAt, language)}
                        </dd>
                      </div>
                    )}
                    {results.recordedDates.verifiedAt && (
                      <div>
                        <dt className="text-xs font-medium text-[var(--text-subtle)]">
                          {t.verify.dates.checkedOn}
                        </dt>
                        <dd className="mt-0.5 text-sm font-semibold text-[var(--text-main)]">
                          {formatLocaleDate(results.recordedDates.verifiedAt, language)}
                        </dd>
                      </div>
                    )}
                    {results.recordedDates.acceptedAt && (
                      <div>
                        <dt className="text-xs font-medium text-[var(--text-subtle)]">
                          {t.verify.dates.acceptedOn}
                        </dt>
                        <dd className="mt-0.5 text-sm font-semibold text-[var(--text-main)]">
                          {formatLocaleDate(results.recordedDates.acceptedAt, language)}
                        </dd>
                      </div>
                    )}
                    {results.recordedDates.settledAt && (
                      <div>
                        <dt className="text-xs font-medium text-[var(--text-subtle)]">
                          {t.verify.dates.settledOn}
                        </dt>
                        <dd className="mt-0.5 text-sm font-semibold text-[var(--text-main)]">
                          {formatLocaleDate(results.recordedDates.settledAt, language)}
                        </dd>
                      </div>
                    )}
                    {results.recordedDates.processedAt && (
                      <div>
                        <dt className="text-xs font-medium text-[var(--text-subtle)]">
                          {t.verify.dates.processedOn}
                        </dt>
                        <dd className="mt-0.5 text-sm font-semibold text-[var(--text-main)]">
                          {formatLocaleDate(results.recordedDates.processedAt, language)}
                        </dd>
                      </div>
                    )}
                    {results.recordedDates.endUseAt && (
                      <div>
                        <dt className="text-xs font-medium text-[var(--text-subtle)]">
                          {t.verify.dates.putToUseOn}
                        </dt>
                        <dd className="mt-0.5 text-sm font-semibold text-[var(--text-main)]">
                          {formatLocaleDate(results.recordedDates.endUseAt, language)}
                        </dd>
                      </div>
                    )}
                  </dl>
                )}

                <dl className="mt-6 grid gap-x-8 border-t border-[var(--border-subtle)] pt-3 sm:grid-cols-2">
                  {copyable("shortCode", t.verify.certificateCode, results.metadata.shortCode)}
                  {copyable("batchId", t.verify.batchId, results.metadata.batchId)}
                </dl>
              </Card>

              {/* Rejection outcome details */}
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

              {/* Amounts recorded */}
              <Card title={t.verify.amountsTitle}>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  {massItems.map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-4"
                    >
                      <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-subtle)]">
                        {label}
                      </p>
                      <p className="mt-2 text-xl font-extrabold text-[var(--text-heading)]">
                        {value}
                      </p>
                    </div>
                  ))}
                </div>
                {results.massStatus && (
                  <p
                    className={`mt-4 text-sm font-bold ${
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

              {/* Lifecycle Timeline */}
              <Card title={t.verify.timelineTitle}>
                <div className="space-y-0">
                  {results.timeline.length ? (
                    results.timeline.map((event, index) => {
                      const translatedEvent = getTranslatedTimeline(event.title, event.details, language);
                      return (
                        <div
                          key={`${event.title}-${index}`}
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
                            {event.tx && event.tx !== "tx: pending" && (
                              <p className="mt-1 font-mono text-[11px] text-[var(--primary)]">
                                {event.tx}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-[var(--text-muted)]">{t.verify.timelineEmpty}</p>
                  )}
                </div>
              </Card>

              {/* Things to look at (Notices) */}
              {results.checks.some((check) => check.status === "notice") && (
                <Card title={t.verify.thingsTitle}>
                  <ul className="space-y-3">
                    {results.checks
                      .filter((check) => check.status === "notice")
                      .map((check, index) => {
                        const publicCheck = getTranslatedCheck(check, language);
                        return (
                          <li
                            key={`${check.title}-${index}`}
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

              {/* Work credits */}
              <Card title={t.verify.creditsTitle}>
                <p className="text-sm leading-6 text-[var(--text-muted)]">
                  {t.verify.creditsDesc}
                </p>
                <p className="mt-4 text-3xl font-extrabold text-[var(--primary)]">
                  {results.credits}{" "}
                  <span className="text-base font-semibold text-[var(--text-muted)]">
                    {t.verify.creditsRecordedSuffix}
                  </span>
                </p>
              </Card>

              {/* Technical Inspection Details */}
              <Card>
                <details className="group">
                  <summary className="flex cursor-pointer items-center justify-between text-base font-bold text-[var(--text-heading)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)] rounded py-1">
                    <span>{t.verify.techTitle}</span>
                    <span className="text-xs transition-transform group-open:rotate-180" aria-hidden="true">
                      ▼
                    </span>
                  </summary>
                  <div className="mt-5 space-y-6 border-t border-[var(--border-subtle)] pt-4">
                    <ul className="space-y-3">
                      {results.checks.map((check, index) => {
                        const publicCheck = getTranslatedCheck(check, language);
                        return (
                          <li
                            key={`${check.title}-${index}`}
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

                    <dl className="border-t border-[var(--border-subtle)] pt-2">
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
        <button id="btnVerify" />
        <button id="btnLoadBatchA" />
        <button id="btnLoadBatchB" />
        <button id="btnTamperTest" />
        <button id="btnLoadBatchC" />
        <button id="btnLoadBatchD" />
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
