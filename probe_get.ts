import axios from "axios";

const apiKey = process.env.GIGZHUB_API_KEY;

async function probe() {
  const paths = [
    "/user",
    "/profile",
    "/plans",
    "/bundles",
    "/networks",
    "/network",
    "/services",
    "/orders",
    "/order",
    "/transactions",
    "/transaction",
    "/history",
    "/v1/plans",
    "/v1/bundles",
    "/v1/services"
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
      console.log(`GET ${path} SUCCESS:`, res.status, JSON.stringify(res.data).substring(0, 300));
    } catch (e: any) {
      if (e.response?.status !== 404) {
        console.log(`GET ${path} FAILED:`, e.response?.status, e.response?.data || e.message);
      }
    }
  }
}

probe();
