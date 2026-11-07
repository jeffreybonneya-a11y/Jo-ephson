import fs from 'fs';
import path from 'path';

function updateFile(filePath: string, searchStr: string | RegExp, replaceStr: string) {
  const absPath = path.resolve(filePath);
  if (!fs.existsSync(absPath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }
  let content = fs.readFileSync(absPath, 'utf8');
  const updated = content.replace(searchStr, replaceStr);
  fs.writeFileSync(absPath, updated, 'utf8');
  console.log(`Updated ${filePath}`);
}

// 1. src/data/seoPages.ts
let seoPagesContent = fs.readFileSync('src/data/seoPages.ts', 'utf8');
seoPagesContent = seoPagesContent.replaceAll('https://dataghananow.com/', 'https://kingjdeals.site/');
fs.writeFileSync('src/data/seoPages.ts', seoPagesContent, 'utf8');
console.log("Updated src/data/seoPages.ts");

// 2. public/sitemap.xml
let sitemapContent = fs.readFileSync('public/sitemap.xml', 'utf8');
sitemapContent = sitemapContent.replaceAll('https://dataghananow.com/', 'https://kingjdeals.site/');
fs.writeFileSync('public/sitemap.xml', sitemapContent, 'utf8');
console.log("Updated public/sitemap.xml");

// 3. public/robots.txt
let robotsContent = fs.readFileSync('public/robots.txt', 'utf8');
robotsContent = robotsContent.replaceAll('https://dataghananow.com/sitemap.xml', 'https://kingjdeals.site/sitemap.xml');
fs.writeFileSync('public/robots.txt', robotsContent, 'utf8');
console.log("Updated public/robots.txt");

// 4. src/lib/serverSeoHtml.ts
let serverSeoContent = fs.readFileSync('src/lib/serverSeoHtml.ts', 'utf8');
serverSeoContent = serverSeoContent.replaceAll('https://dataghananow.com/', 'https://kingjdeals.site/');
fs.writeFileSync('src/lib/serverSeoHtml.ts', serverSeoContent, 'utf8');
console.log("Updated src/lib/serverSeoHtml.ts");

// 5. src/components/SeoPageLayout.tsx
let seoLayoutContent = fs.readFileSync('src/components/SeoPageLayout.tsx', 'utf8');
seoLayoutContent = seoLayoutContent.replaceAll('https://dataghananow.com/', 'https://kingjdeals.site/');
fs.writeFileSync('src/components/SeoPageLayout.tsx', seoLayoutContent, 'utf8');
console.log("Updated src/components/SeoPageLayout.tsx");

// 6. src/App.tsx
let appContent = fs.readFileSync('src/App.tsx', 'utf8');
appContent = appContent.replaceAll('"https://dataghananow.com/"', '"https://kingjdeals.site/"');
fs.writeFileSync('src/App.tsx', appContent, 'utf8');
console.log("Updated src/App.tsx");

// 7. src/components/ReferralPromoModal.tsx
let refContent = fs.readFileSync('src/components/ReferralPromoModal.tsx', 'utf8');
refContent = refContent.replaceAll("'www.dataghananow.com'", "'kingjdeals.site'");
refContent = refContent.replaceAll("'https://www.dataghananow.com'", "'https://kingjdeals.site'");
fs.writeFileSync('src/components/ReferralPromoModal.tsx', refContent, 'utf8');
console.log("Updated src/components/ReferralPromoModal.tsx");
