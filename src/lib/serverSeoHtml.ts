import { SeoPageData } from '../data/seoPages';

export function renderSeoHtml(template: string, seo: SeoPageData): string {
  // Breadcrumb schema
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://kingjdeals.site/"
      },
      ...(seo.categoryPath !== seo.path ? [
        {
          "@type": "ListItem",
          "position": 2,
          "name": seo.category,
          "item": `https://kingjdeals.site${seo.categoryPath}`
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": seo.h1,
          "item": seo.canonicalUrl
        }
      ] : [
        {
          "@type": "ListItem",
          "position": 2,
          "name": seo.h1,
          "item": seo.canonicalUrl
        }
      ])
    ]
  };

  const faqSchema = seo.faqs.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": seo.faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  } : null;

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": seo.h1,
    "description": seo.metaDescription,
    "provider": {
      "@type": "Organization",
      "name": "King J Deals",
      "url": "https://kingjdeals.site/",
      "logo": "https://kingjdeals.site/icon-512.png"
    },
    "areaServed": {
      "@type": "Country",
      "name": "Ghana"
    },
    "url": seo.canonicalUrl
  };

  const jsonLdBlock = `
    <script type="application/ld+json">${JSON.stringify(breadcrumbSchema)}</script>
    ${faqSchema ? `<script type="application/ld+json">${JSON.stringify(faqSchema)}</script>` : ''}
    <script type="application/ld+json">${JSON.stringify(serviceSchema)}</script>
  `;

  // Semantic HTML pre-rendered inside root for search bots
  const semanticContent = `
    <main style="min-height: 100vh; background-color: #070D1E; color: #f8fafc; padding: 2rem 1rem; font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif; max-width: 56rem; margin: 0 auto;">
      <nav aria-label="Breadcrumb" style="font-size: 0.875rem; color: #94a3b8; margin-bottom: 1.5rem;">
        <a href="/" style="color: #fbbf24; text-decoration: none;">Home</a>
        ${seo.categoryPath !== seo.path ? ` &gt; <a href="${seo.categoryPath}" style="color: #fbbf24; text-decoration: none;">${seo.category}</a>` : ''}
        &gt; <span>${seo.h1}</span>
      </nav>
      <article>
        <div style="display: inline-block; padding: 0.25rem 0.75rem; background: #0f172a; border: 1px solid rgba(251, 191, 36, 0.4); border-radius: 9999px; color: #fbbf24; font-size: 0.75rem; font-weight: 800; margin-bottom: 1rem; text-transform: uppercase;">
          ${seo.badge}
        </div>
        <h1 style="font-size: 2.25rem; font-weight: 900; line-height: 1.2; margin-bottom: 1rem; color: #ffffff; letter-spacing: -0.025em;">
          ${seo.h1}
        </h1>
        <p style="font-size: 1.125rem; color: #cbd5e1; line-height: 1.6; margin-bottom: 2rem;">
          ${seo.leadText}
        </p>
        <div style="margin-bottom: 2rem;">
          <a href="/" style="display: inline-block; background-color: #fbbf24; color: #020617; font-weight: 800; padding: 0.875rem 1.75rem; border-radius: 0.75rem; text-decoration: none; font-size: 1rem;">
            Order on King J Deals Store
          </a>
        </div>
        <section style="margin-bottom: 2.5rem;">
          <h2 style="font-size: 1.5rem; font-weight: 800; color: #ffffff; margin-bottom: 1rem; border-left: 4px solid #fbbf24; padding-left: 0.75rem;">
            ${seo.overviewHeading}
          </h2>
          ${seo.overviewParagraphs.map(p => `<p style="font-size: 1rem; color: #94a3b8; line-height: 1.6; margin-bottom: 0.75rem;">${p}</p>`).join('')}
        </section>
        <section style="margin-bottom: 2.5rem;">
          <h2 style="font-size: 1.5rem; font-weight: 800; color: #ffffff; margin-bottom: 1rem; border-left: 4px solid #fbbf24; padding-left: 0.75rem;">
            ${seo.featuresHeading}
          </h2>
          <ul style="list-style: none; padding: 0; margin: 0; display: grid; gap: 1rem;">
            ${seo.features.map(f => `
              <li style="background: #0f172a; border: 1px solid #1e293b; padding: 1rem; border-radius: 0.75rem;">
                <strong style="color: #fbbf24; display: block; margin-bottom: 0.25rem;">${f.title}</strong>
                <span style="color: #94a3b8; font-size: 0.875rem; line-height: 1.5;">${f.desc}</span>
              </li>
            `).join('')}
          </ul>
        </section>
        <section style="margin-bottom: 2.5rem;">
          <h2 style="font-size: 1.5rem; font-weight: 800; color: #ffffff; margin-bottom: 1rem; border-left: 4px solid #fbbf24; padding-left: 0.75rem;">
            ${seo.howItWorksHeading}
          </h2>
          <ol style="padding-left: 1.25rem; color: #cbd5e1; line-height: 1.7;">
            ${seo.howItWorksSteps.map(s => `
              <li style="margin-bottom: 0.75rem;">
                <strong style="color: #ffffff;">${s.title}:</strong> ${s.desc}
              </li>
            `).join('')}
          </ol>
        </section>
        <section style="margin-bottom: 2.5rem; background: rgba(251, 191, 36, 0.08); border: 1px solid rgba(251, 191, 36, 0.25); padding: 1.25rem; border-radius: 0.75rem;">
          <h2 style="font-size: 1.125rem; font-weight: 800; color: #fbbf24; margin-bottom: 0.75rem;">
            ${seo.guidelinesHeading}
          </h2>
          <ul style="padding-left: 1.25rem; color: #cbd5e1; line-height: 1.6;">
            ${seo.guidelines.map(g => `<li style="margin-bottom: 0.5rem;">${g}</li>`).join('')}
          </ul>
        </section>
        <section style="margin-bottom: 2.5rem;">
          <h2 style="font-size: 1.5rem; font-weight: 800; color: #ffffff; margin-bottom: 1rem; border-left: 4px solid #fbbf24; padding-left: 0.75rem;">
            Frequently Asked Questions
          </h2>
          <dl style="display: grid; gap: 1rem;">
            ${seo.faqs.map(faq => `
              <div style="background: #0f172a; border: 1px solid #1e293b; padding: 1rem; border-radius: 0.75rem;">
                <dt style="font-weight: 800; color: #ffffff; font-size: 1rem; margin-bottom: 0.5rem;">${faq.question}</dt>
                <dd style="color: #94a3b8; font-size: 0.875rem; line-height: 1.6; margin: 0;">${faq.answer}</dd>
              </div>
            `).join('')}
          </dl>
        </section>
        <section style="margin-bottom: 2.5rem;">
          <h2 style="font-size: 1.5rem; font-weight: 800; color: #ffffff; margin-bottom: 1rem; border-left: 4px solid #fbbf24; padding-left: 0.75rem;">
            Related Services &amp; Guides
          </h2>
          <ul style="list-style: none; padding: 0; margin: 0; display: grid; gap: 0.75rem;">
            ${seo.relatedLinks.map(l => `
              <li>
                <a href="${l.href}" style="color: #fbbf24; font-weight: 700; text-decoration: underline;">${l.label}</a>
                <span style="color: #64748b; font-size: 0.875rem; margin-left: 0.5rem;">- ${l.description}</span>
              </li>
            `).join('')}
          </ul>
        </section>
        <footer style="margin-top: 3rem; padding-top: 1.5rem; border-top: 1px solid #1e293b; font-size: 0.75rem; color: #64748b; text-align: center;">
          <p>King J Deals &copy; ${new Date().getFullYear()}. Independent digital deals vendor in Ghana. All brand trademarks belong to their respective owners.</p>
        </footer>
      </article>
    </main>
  `;

  let result = template;

  // Replace Title
  result = result.replace(/<title>.*?<\/title>/is, `<title>${seo.metaTitle}</title>`);

  // Replace Description
  result = result.replace(/<meta\s+name="description"\s+content=".*?"\s*\/?>/is, `<meta name="description" content="${seo.metaDescription}" />`);

  // Replace Canonical
  result = result.replace(/<link\s+rel="canonical"\s+href=".*?"\s*\/?>/is, `<link rel="canonical" href="${seo.canonicalUrl}" />`);

  // Replace Open Graph tags
  result = result.replace(/<meta\s+property="og:title"\s+content=".*?"\s*\/?>/is, `<meta property="og:title" content="${seo.metaTitle}" />`);
  result = result.replace(/<meta\s+property="og:description"\s+content=".*?"\s*\/?>/is, `<meta property="og:description" content="${seo.metaDescription}" />`);
  result = result.replace(/<meta\s+property="og:url"\s+content=".*?"\s*\/?>/is, `<meta property="og:url" content="${seo.canonicalUrl}" />`);

  // Replace Twitter tags
  result = result.replace(/<meta\s+name="twitter:title"\s+content=".*?"\s*\/?>/is, `<meta name="twitter:title" content="${seo.metaTitle}" />`);
  result = result.replace(/<meta\s+name="twitter:description"\s+content=".*?"\s*\/?>/is, `<meta name="twitter:description" content="${seo.metaDescription}" />`);
  result = result.replace(/<meta\s+name="twitter:url"\s+content=".*?"\s*\/?>/is, `<meta name="twitter:url" content="${seo.canonicalUrl}" />`);

  // Inject JSON-LD Schema before </head>
  result = result.replace('</head>', `${jsonLdBlock}\n</head>`);

  // Inject Semantic HTML inside <div id="root">
  result = result.replace(/<div id="root">.*?<\/div>/s, `<div id="root">${semanticContent}</div>`);

  return result;
}
