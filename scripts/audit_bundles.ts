import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function runAudit() {
  console.log("--- STARTING READ-ONLY FIRESTORE AUDIT ---");

  // 1. Audit bundles
  const bundlesSnap = await getDocs(collection(db, "bundles"));
  const allBundles = bundlesSnap.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  console.log(`Total bundle documents in database: ${allBundles.length}`);

  const activeBundles = allBundles.filter((b: any) => b.active === true);
  const inactiveBundles = allBundles.filter((b: any) => b.active === false || b.active === undefined);

  console.log(`Active bundle documents count: ${activeBundles.length}`);
  console.log(`Inactive bundle documents count: ${inactiveBundles.length}`);

  console.log("\n--- INVENTORY OF ALL ACTIVE BUNDLE DOCUMENTS ---");
  activeBundles.forEach((b: any, index) => {
    console.log(
      `${index + 1}. [${b.id}] Network: "${b.network || b.category}" | Amount: "${b.dataAmount}" | Price: GH₵${b.price} | Active: ${b.active} | Name: "${b.name}" | PackageType: "${b.packageType || 'N/A'}" | Category: "${b.category || 'N/A'}"`
    );
  });

  // Group active bundles by network
  const grouped: Record<string, any[]> = {};
  for (const b of activeBundles as any[]) {
    const net = (b.network || b.category || "Unknown").trim();
    if (!grouped[net]) grouped[net] = [];
    grouped[net].push(b);
  }

  console.log("\n--- ACTIVE BUNDLES BY NETWORK ---");
  for (const [net, items] of Object.entries(grouped)) {
    console.log(`Network: ${net} -> ${items.length} active documents`);
  }

  // Check Telecel bundles below 10GB
  const smallTelecelActive = activeBundles.filter((b: any) => {
    const net = (b.network || b.category || "").trim().toLowerCase();
    if (net !== "telecel") return false;
    const amtStr = (b.dataAmount || "").trim().toLowerCase();
    const numMatch = amtStr.match(/([\d.,]+)/);
    if (!numMatch) return false;
    const val = parseFloat(numMatch[1]);
    if (amtStr.includes("mb")) return true;
    return val < 10;
  });

  console.log(`\nActive Telecel bundles below 10GB count: ${smallTelecelActive.length}`);
  if (smallTelecelActive.length > 0) {
    console.log("Violating small Telecel active bundles:", smallTelecelActive);
  }

  // Check inactive Telecel 1GB-5GB
  const smallTelecelInactive = inactiveBundles.filter((b: any) => {
    const net = (b.network || b.category || "").trim().toLowerCase();
    if (net !== "telecel") return false;
    const amtStr = (b.dataAmount || "").trim().toLowerCase();
    const numMatch = amtStr.match(/([\d.,]+)/);
    if (!numMatch) return false;
    const val = parseFloat(numMatch[1]);
    if (amtStr.includes("mb")) return true;
    return val >= 1 && val <= 5;
  });
  console.log(`Inactive Telecel 1GB-5GB documents count: ${smallTelecelInactive.length}`);

  // Check customer order/transaction collections count
  console.log("\n--- CUSTOMER DATA COLLECTIONS AUDIT ---");
  const collectionsToAudit = ["orders", "agent_orders", "transactions", "user_wallets", "complaints"];
  for (const colName of collectionsToAudit) {
    try {
      const snap = await getDocs(collection(db, colName));
      console.log(`Collection '${colName}': ${snap.size} total records preserved.`);
    } catch (e: any) {
      console.log(`Collection '${colName}': error reading - ${e.message}`);
    }
  }

  console.log("\n--- AUDIT COMPLETE ---");
  process.exit(0);
}

runAudit().catch(err => {
  console.error("Audit failed:", err);
  process.exit(1);
});
