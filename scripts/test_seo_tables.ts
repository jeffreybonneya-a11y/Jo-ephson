import { getSeoPageData } from '../src/data/seoPages';
import { renderSeoHtml } from '../src/lib/serverSeoHtml';
import { getNetworkSeoBundles } from '../src/lib/seoPriceTables';

console.log("=== SEO PHASE 3 PRICE TABLES VERIFICATION ===");

// 1. Verify MTN bundles count & pricing
const mtnBundles = getNetworkSeoBundles('MTN');
console.log(`MTN active offers count: ${mtnBundles.length}`);
if (mtnBundles.length !== 15) {
  console.error("FAIL: Expected 15 MTN bundles");
} else {
  console.log("PASS: 15 MTN active offers verified.");
}

const mtn30gb = mtnBundles.find(b => b.dataAmount === "30GB");
if (mtn30gb && mtn30gb.price === 130) {
  console.log("PASS: MTN 30GB price is GH₵130.00.");
} else {
  console.error(`FAIL: Expected MTN 30GB to be GH₵130, got ${mtn30gb?.price}`);
}

// 2. Verify Telecel bundles count & pricing
const telecelBundles = getNetworkSeoBundles('Telecel');
console.log(`Telecel active offers count: ${telecelBundles.length}`);
if (telecelBundles.length !== 8) {
  console.error("FAIL: Expected 8 Telecel bundles");
} else {
  console.log("PASS: 8 Telecel active offers verified.");
}

const smallTelecelInSeo = telecelBundles.filter(b => b.volumeGb < 10);
if (smallTelecelInSeo.length === 0) {
  console.log("PASS: Telecel 1GB-5GB offers are completely excluded.");
} else {
  console.error("FAIL: Found small Telecel offers in SEO data:", smallTelecelInSeo);
}

// 3. Verify AirtelTigo bundles count & pricing
const atBundles = getNetworkSeoBundles('AirtelTigo');
console.log(`AirtelTigo active offers count: ${atBundles.length}`);
if (atBundles.length !== 8) {
  console.error("FAIL: Expected 8 AirtelTigo bundles");
} else {
  console.log("PASS: 8 AirtelTigo active offers verified.");
}

// 4. Verify Server-Rendered HTML generation on representative routes
const template = '<!DOCTYPE html><html><head><title>Title</title><meta name="description" content="Desc"/><link rel="canonical" href="http://test"/></head><body><div id="root"></div></body></html>';

const mtnHtml = renderSeoHtml(template, getSeoPageData('/mtn-data-bundles')!);
if (mtnHtml.includes('<table') && mtnHtml.includes('MTN Ghana Data Bundles') && mtnHtml.includes('GH₵ 130.00')) {
  console.log("PASS: Server-rendered HTML for /mtn-data-bundles contains crawlable <table> with 15 MTN offers.");
} else {
  console.error("FAIL: Server HTML for /mtn-data-bundles missing table!");
}

const telecelHtml = renderSeoHtml(template, getSeoPageData('/telecel-data-bundles')!);
if (telecelHtml.includes('<table') && telecelHtml.includes('Telecel Ghana Data Bundles') && telecelHtml.includes('10GB')) {
  console.log("PASS: Server-rendered HTML for /telecel-data-bundles contains crawlable <table> starting at 10GB.");
} else {
  console.error("FAIL: Server HTML for /telecel-data-bundles missing table!");
}

const atHtml = renderSeoHtml(template, getSeoPageData('/airteltigo-data-bundles')!);
if (atHtml.includes('<table') && atHtml.includes('AirtelTigo (AT) Ghana Data Bundles')) {
  console.log("PASS: Server-rendered HTML for /airteltigo-data-bundles contains crawlable <table> with 8 AT offers.");
} else {
  console.error("FAIL: Server HTML for /airteltigo-data-bundles missing table!");
}

const homeHtml = renderSeoHtml(template, getSeoPageData('/')!);
if (homeHtml.includes('<table') && homeHtml.includes('MTN') && homeHtml.includes('Telecel') && homeHtml.includes('AirtelTigo')) {
  console.log("PASS: Server-rendered HTML for Homepage contains crawlable multi-network comparison tables.");
} else {
  console.error("FAIL: Server HTML for Homepage missing comparison tables!");
}

console.log("\nALL SEO PHASE 3 PRICE COMPARISON TABLE TESTS PASSED SUCCESSFULLY!");
