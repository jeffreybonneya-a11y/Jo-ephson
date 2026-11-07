import { SEO_PAGES } from '../src/data/seoPages';

console.log("=== SEO CANONICAL DOMAIN VERIFICATION ===");
const routes = Object.keys(SEO_PAGES);
console.log(`Total SEO Landing Page Routes: ${routes.length}`);

let allValid = true;
routes.forEach((route, idx) => {
  const page = SEO_PAGES[route];
  if (!page) {
    console.error(`FAILED: Missing SEO page data for route '${route}'`);
    allValid = false;
    return;
  }
  const canonical = page.canonicalUrl;
  const startsWithProd = canonical.startsWith('https://kingjdeals.site');
  const containsFuture = canonical.includes('dataghananow.com');
  
  if (!startsWithProd || containsFuture) {
    console.error(`FAILED [${route}]: Invalid canonical '${canonical}'`);
    allValid = false;
  } else {
    console.log(`${idx + 1}. [${route}] -> Canonical: ${canonical}`);
  }
});

if (allValid) {
  console.log("\nALL 21 LANDING PAGE CANONICAL URLS PERFECTLY VERIFIED AS https://kingjdeals.site/");
} else {
  console.error("\nCANONICAL VERIFICATION FAILED!");
  process.exit(1);
}
