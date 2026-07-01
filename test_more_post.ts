import axios from "axios";

const apiKey = process.env.GIGZHUB_API_KEY;

async function testMore() {
  const paths = [
    "/data/buy",
    "/data/order",
    "/data/create",
    "/data/send",
    "/data-plans",
    "/variations",
    "/plans",
    "/orders",
    "/order",
    "/data-variations",
    "/data/variations",
    "/data/purchase",
    "/purchase",
    "/transaction",
    "/transactions",
    "/topup",
    "/api/v1/data"
  ];

  for (const path of paths) {
    try {
      console.log(`POST to https://gigzhub.net/api/v1${path}...`);
      const res = await axios.post(`https://gigzhub.net/api/v1${path}`, {}, {
        headers: {
          "x-api-key": apiKey || "",
          "Content-Type": "application/json",
          "Accept": "application/json"
        }
      });
      console.log(`SUCCESS ${path}:`, res.status, res.data);
    } catch (e: any) {
      if (e.response?.status !== 404) {
        console.log(`FOUND ${path}: status ${e.response?.status}`, JSON.stringify(e.response?.data || e.message));
      }
    }
  }
}

testMore();
