import axios from "axios";

const apiKey = process.env.GIGZHUB_API_KEY;

async function testPlans() {
  const paths = [
    "/data/plans",
    "/data/variations",
    "/data-plans",
    "/variations",
    "/plans",
    "/data/bundles",
    "/bundles"
  ];

  for (const path of paths) {
    try {
      console.log(`GET https://gigzhub.net/api/v1${path}...`);
      const res = await axios.get(`https://gigzhub.net/api/v1${path}`, {
        headers: {
          "x-api-key": apiKey || "",
          "Accept": "application/json"
        }
      });
      console.log(`SUCCESS GET ${path}:`, res.status, JSON.stringify(res.data).substring(0, 500));
    } catch (e: any) {
      console.log(`FAILED GET ${path}:`, e.response?.status, e.response?.data || e.message);
    }
  }
}

testPlans();
