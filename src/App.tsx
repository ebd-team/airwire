import { useEffect, useMemo, useState } from "react";

// --- Super-light i18n (EN + UK) without extra libraries ---
const messages = {
  en: {
    brand: "Airwire",
    title: "Airwire — Data Streaming & Remote Control Platform",
    description:
      "Platform for data streaming and remote control: real-time data transmission and low-latency video streaming. Simple deployment. Reliable operation.",
    tagline:
      "Platform for data streaming and remote control: real-time data transmission and low-latency video streaming. Simple deployment. Reliable operation.",
    emailAria: "Email Airwire team",
    footer: () => `© ${new Date().getFullYear()} Airwire`,
    langLabel: "Language",
    langEN: "English",
    langUK: "Українська",
  },
  uk: {
    brand: "Airwire",
    title: "Airwire — Платформа для стрімінгу даних і віддаленого керування",
    description:
      "Платформа для стрімінгу даних і віддаленого керування: передача даних в реальному часі та низька затримка потокового відео. Просте розгортання. Надійна робота.",
    tagline:
      "Платформа для стрімінгу даних і віддаленого керування: передача даних в реальному часі та низька затримка потокового відео. Просте розгортання. Надійна робота.",
    emailAria: "Написати команді Airwire",
    footer: () => `© ${new Date().getFullYear()} Airwire`,
    langLabel: "Мова",
    langEN: "English",
    langUK: "Українська",
  },
} as const;

type Lang = keyof typeof messages;

// --- URL param helper (for SEO-friendly / shareable lang links) ---
function getLangFromUrl(): Lang | null {
  if (typeof window === "undefined") return null;
  const p = new URLSearchParams(window.location.search);
  const v = p.get("lang");
  return v === "uk" || v === "en" ? (v as Lang) : null;
}

function getInitialLang(): Lang {
  const fromUrl = getLangFromUrl();
  if (fromUrl) return fromUrl;
  const stored = (typeof localStorage !== "undefined" && localStorage.getItem("airwire_lang")) as Lang | null;
  if (stored && stored in messages) return stored;
  const nav = (typeof navigator !== "undefined" && navigator.language) || "en";
  return nav.startsWith("uk") ? "uk" : "en";
}

// --- Minimal SEO utilities (no extra deps) ---
function setMeta(name: string, content: string) {
  let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("name", name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setOG(property: string, content: string) {
  let el = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("property", property);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setLink(rel: string, attrs: Record<string, string>) {
  let el = document.querySelector(`link[rel="${rel}"][data-managed="true"]`) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement("link");
    el.rel = rel;
    el.setAttribute("data-managed", "true");
    document.head.appendChild(el);
  }
  Object.entries(attrs).forEach(([k, v]) => el!.setAttribute(k, v));
}

export default function App() {
  const [lang, setLang] = useState<Lang>(getInitialLang);
  const t = useMemo(() => messages[lang], [lang]);

  // Persist language & reflect in URL (so we can add hreflang canonicals)
  useEffect(() => {
    try { localStorage.setItem("airwire_lang", lang); } catch {}

    if (typeof document !== "undefined") {
      // <html lang="…">
      document.documentElement.lang = lang;

      // Title & meta description
      document.title = t.title;
      setMeta("description", t.description);
      setMeta("robots", "index,follow");

      // Open Graph / Twitter
      const url = new URL(window.location.href);
      const canonical = new URL(url.pathname + url.hash, url.origin); // strip ?lang
      setOG("og:title", t.title);
      setOG("og:description", t.description);
      setOG("og:type", "website");
      setOG("og:url", canonical.toString());
      setMeta("twitter:card", "summary_large_image");
      setMeta("twitter:title", t.title);
      setMeta("twitter:description", t.description);

      // Canonical & hreflang
      setLink("canonical", { href: canonical.toString() });
      const current = new URL(window.location.href);
      const enUrl = new URL(current.toString()); enUrl.searchParams.set("lang", "en");
      const ukUrl = new URL(current.toString()); ukUrl.searchParams.set("lang", "uk");
      setLink("alternate", { href: enUrl.toString(), hreflang: "en" });
      setLink("alternate", { href: ukUrl.toString(), hreflang: "uk" });
      setLink("alternate", { href: canonical.toString(), hreflang: "x-default" });

      // JSON-LD (Organization + WebSite)
      const id = "airwire-jsonld";
      let script = document.getElementById(id) as HTMLScriptElement | null;
      if (!script) {
        script = document.createElement("script");
        script.id = id;
        script.type = "application/ld+json";
        document.head.appendChild(script);
      }
      const jsonld = {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "Airwire",
        url: canonical.toString(),
        sameAs: [],
        contactPoint: [{
          "@type": "ContactPoint",
          email: "ebd.team@outlook.com",
          contactType: lang === "uk" ? "Підтримка" : "Customer Support",
          availableLanguage: ["en", "uk"],
        }],
      };
      script.textContent = JSON.stringify(jsonld);
    }

    // Keep URL ?lang synced (but don’t create history spam)
    const u = new URL(window.location.href);
    u.searchParams.set("lang", lang);
    window.history.replaceState({}, "", u.toString());
  }, [lang, t.title, t.description]);

  return (
    <main
      style={{
        minHeight: "100svh",
        display: "grid",
        placeItems: "center",
        background: "#0b1220",
        color: "#e6edf3",
        padding: "2rem",
      }}
    >
      {/* Language switcher (top-right) */}
      <div
        style={{
          position: "fixed",
          top: 16,
          right: 16,
          display: "flex",
          gap: 8,
          alignItems: "center",
          fontSize: 12,
          opacity: 0.9,
        }}
        aria-label={t.langLabel}
      >
        <button
          onClick={() => setLang("en")}
          aria-pressed={lang === "en"}
          style={{
            padding: "6px 10px",
            borderRadius: 9999,
            border: "1px solid rgba(255,255,255,0.18)",
            background: lang === "en" ? "#1f6feb" : "transparent",
            color: lang === "en" ? "#fff" : "#e6edf3",
            cursor: "pointer",
          }}
        >
          {t.langEN}
        </button>
        <button
          onClick={() => setLang("uk")}
          aria-pressed={lang === "uk"}
          style={{
            padding: "6px 10px",
            borderRadius: 9999,
            border: "1px solid rgba(255,255,255,0.18)",
            background: lang === "uk" ? "#1f6feb" : "transparent",
            color: lang === "uk" ? "#fff" : "#e6edf3",
            cursor: "pointer",
          }}
        >
          {t.langUK}
        </button>
      </div>

      <section
        style={{
          maxWidth: 760,
          textAlign: "center",
          display: "grid",
          gap: "1.25rem",
        }}
      >
        <h1 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", margin: 0 }}>{t.brand}</h1>
        <p
          style={{
            opacity: 0.9,
            lineHeight: 1.6,
            fontSize: "clamp(1rem, 2.2vw, 1.125rem)",
            margin: 0,
          }}
        >
          {t.tagline}
        </p>

        <a
          href="mailto:ebd.team@outlook.com"
          style={{
            display: "inline-block",
            marginTop: "0.25rem",
            padding: "0.875rem 1.25rem",
            borderRadius: 9999,
            background: "#1f6feb",
            color: "white",
            textDecoration: "none",
            fontWeight: 600,
            boxShadow: "0 6px 20px rgba(31,111,235,0.35)",
          }}
          aria-label={t.emailAria}
        >
          ebd.team@outlook.com
        </a>

        <div style={{ opacity: 0.7, fontSize: 12, marginTop: "0.25rem" }}>{t.footer()}</div>
      </section>

      {/* Subtle radial glow */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          background:
            "radial-gradient(600px 300px at 50% -10%, rgba(31,111,235,0.25), transparent 60%), radial-gradient(400px 200px at 80% 110%, rgba(94,234,212,0.18), transparent 60%)",
          pointerEvents: "none",
          mixBlendMode: "screen",
        }}
      />
    </main>
  );
}
