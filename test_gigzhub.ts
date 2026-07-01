import axios from "axios";

const apiKey = process.env.GIGZHUB_API_KEY;
console.log("Using API Key from process.env, length:", apiKey?.length);

async function testGigzhub() {
  console.log("Testing balance on gigzhub.net...");
  try {
    const res = await axios.get("https://gigzhub.net/api/v1/balance", {
      headers: {
        "x-api-key": apiKey || "",
        "Accept": "application/json"
      }
    });
    console.log("gigzhub.net balance response status:", res.status);
    console.log("gigzhub.net balance data:", res.data);
  } catch (error: any) {
    console.log("gigzhub.net balance error:", error.response?.status, error.response?.data || error.message);
  }

  // Probe endpoint formats for data delivery
  const probes = [
    "/data",
    "/data/purchase",
    "/purchase",
    "/data/airteltigo",
    "/data/telecel",
    "/airteltigo",
    "/telecel",
  ];

  for (const path of probes) {
    try {
      console.log(`Testing GET https://gigzhub.net/api/v1${path}...`);
      const res = await axios.get(`https://gigzhub.net/api/v1${path}`, {
        headers: {
          "x-api-key": apiKey || "",
          "Accept": "application/json"
        }
      });
      console.log(`GET ${path} SUCCESS:`, JSON.stringify(res.data).substring(0, 300));
    } catch (e: any) {
      console.log(`GET ${path} FAILED:`, e.response?.status, e.response?.data || e.message);
    }
  }
}

testGigzhub();
