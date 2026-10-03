import { useEffect } from "react";

/**
 * Canonical production origin — SINGLE SOURCE OF TRUTH untuk semua
 * canonical URL, Open Graph URL, dan sitemap. Ganti hanya di sini
 * saat domain produksi berubah (lihat README → Custom Domain Setup).
 */
export const SITE_URL = "https://database.smkmuh1-skh.sch.id";

export const SITE_NAME = "Database Quest Warrior: Mutuharjo";

/** Branding OG image 1200x630 (dibuat oleh scripts/generate-seo-images.mjs). */
export const OG_IMAGE = `${SITE_URL}/og/database-quest-warrior-belajar-sql.png`;

type SeoOptions = {
  /** Judul halaman tanpa suffix situs — akan otomatis jadi `${title} | ${SITE_NAME}`. */
  title: string;
  description: string;
  /** Path canonical, mis. "/materi" atau "/" — otomatis diprefix SITE_URL. */
  path: string;
  robots?: "index, follow" | "noindex, nofollow";
  ogType?: "website" | "article";
};

const ISO_ATTRIBUTE = "data-seo";

/** Element selector helper: only touch tags we own. */
function ensureMeta(selector: string, create: () => HTMLElement): HTMLElement {
  let el = document.head.querySelector<HTMLElement>(selector);
  if (!el) {
    el = create();
    document.head.appendChild(el);
  }
  return el;
}

function setMetaName(name: string, content: string) {
  const el = ensureMeta(`meta[name="${name}"]`, () => {
    const m = document.createElement("meta");
    m.setAttribute("name", name);
    return m;
  });
  el.setAttribute("content", content);
}

function setMetaProperty(property: string, content: string) {
  const el = ensureMeta(`meta[property="${property}"]`, () => {
    const m = document.createElement("meta");
    m.setAttribute("property", property);
    return m;
  });
  el.setAttribute("content", content);
}

function setLinkRel(rel: string, href: string) {
  const el = ensureMeta(`link[rel="${rel}"]`, () => {
    const l = document.createElement("link");
    l.setAttribute("rel", rel);
    return l;
  });
  el.setAttribute("href", href);
}

/**
 * Sinkronkan metadata dokumen untuk satu halaman (SPA).
 * Aman dipanggil di setiap halaman publik maupun privat —
 * hook ini hanya mengatur <head>, tidak menyentuh logika aplikasi.
 */
export function useSeo({
  title,
  description,
  path,
  robots = "index, follow",
  ogType = "website",
}: SeoOptions): void {
  const canonicalUrl = `${SITE_URL}${path === "/" ? "/" : path}`;

  useEffect(() => {
    // Title unik per halaman
    document.title = `${title} | ${SITE_NAME}`;

    // Deskripsi
    setMetaName("description", description);
    setMetaName("robots", robots);

    // Canonical — selalu konsisten dengan domain utama
    setLinkRel("canonical", canonicalUrl);

    // Open Graph
    setMetaProperty("og:title", title);
    setMetaProperty("og:description", description);
    setMetaProperty("og:url", canonicalUrl);
    setMetaProperty("og:type", ogType);
    setMetaProperty("og:site_name", SITE_NAME);
    setMetaProperty("og:image", OG_IMAGE);
    setMetaProperty("og:image:width", "1200");
    setMetaProperty("og:image:height", "630");
    setMetaProperty("og:image:alt", `${SITE_NAME} — platform belajar SQL dan database untuk siswa SMK`);
    setMetaProperty("og:locale", "id_ID");

    // Twitter Card
    setMetaName("twitter:card", "summary_large_image");
    setMetaName("twitter:title", title);
    setMetaName("twitter:description", description);
    setMetaName("twitter:image", OG_IMAGE);
  }, [title, description, canonicalUrl, robots, ogType]);
}

/* ----------------------------- JSON-LD helpers ----------------------------- */

/** Pasang satu blok JSON-LD dengan id deterministik (mengganti bila sudah ada). */
function upsertJsonLd(id: string, data: object) {
  const selector = `script[type="application/ld+json"][data-seo="${id}"]`;
  let el = document.head.querySelector<HTMLScriptElement>(selector);
  if (!el) {
    el = document.createElement("script");
    el.type = "application/ld+json";
    el.setAttribute(ISO_ATTRIBUTE, id);
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

/** Hapus blok JSON-LD milik halaman sebelumnya (saat navigasi SPA). */
export function clearPageJsonLd(): void {
  document.head
    .querySelectorAll<HTMLScriptElement>('script[type="application/ld+json"][data-seo]')
    .forEach((el) => el.remove());
}

/**
 * JSON-LD sitewide: WebSite + EducationalOrganization.
 * Dipasang sekali di root App. Schema hanya untuk halaman publik yang
 * memang merepresentasikan konten ini — tidak ada schema palsu.
 */
export function useSiteJsonLd(): void {
  useEffect(() => {
    upsertJsonLd("site-website", {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: SITE_NAME,
      alternateName: ["Database Quest Warrior", "Database Quest Mutuharjo", "dq: Mutuharjo"],
      url: SITE_URL,
      description:
        "Platform belajar SQL dan database gratis untuk siswa SMK: materi interaktif, latihan query SQL online, studi kasus, dan battle kompetitif.",
      inLanguage: "id-ID",
      audience: {
        "@type": "EducationalAudience",
        educationalRole: "student",
      },
    });

    upsertJsonLd("site-organization", {
      "@context": "https://schema.org",
      "@type": "EducationalOrganization",
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/apple-touch-icon.png`,
      description:
        "Platform pembelajaran database dan SQL untuk siswa SMK PPLG — dibuat oleh MrStepen (Joko Endriyanto) SMK Muhammadiyah 1 Sukoharjo.",
      parentOrganization: {
        "@type": "EducationalOrganization",
        name: "SMK Muhammadiyah 1 Sukoharjo",
        url: "https://smkmuh1-skh.sch.id",
      },
    });
  }, []);
}

/**
 * JSON-LD per halaman publik (dipasang oleh useSeoPageJsonLd):
 * WebPage + BreadcrumbList.
 */
export function usePageJsonLd(
  name: string,
  description: string,
  path: string,
  breadcrumbs: { name: string; path: string }[],
): void {
  useEffect(() => {
    const url = `${SITE_URL}${path === "/" ? "/" : path}`;
    upsertJsonLd("page-webpage", {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name,
      description,
      url,
      isPartOf: { "@type": "WebSite", name: SITE_NAME, url: SITE_URL },
      inLanguage: "id-ID",
    });

    if (breadcrumbs.length > 0) {
      upsertJsonLd("page-breadcrumb", {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: breadcrumbs.map((crumb, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: crumb.name,
          item: `${SITE_URL}${crumb.path === "/" ? "/" : crumb.path}`,
        })),
      });
    }
  }, [name, description, path, breadcrumbs]);
}
