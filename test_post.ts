import axios from "axios";

const apiKey = process.env.GIGZHUB_API_KEY;

async function testPOST() {
  const endpoints = [
    "/data/airteltigo",
    "/data/AirtelTigo",
    "/data/telecel",
    "/data/Telecel",
    "/data/mtn",
    "/data/MTN",
    "/purchase",
    "/data"
  ];

  for (const path of endpoints) {
    try {
      console.log(`POST to https://gigzhub.net/api/v1${path}...`);
      const res = await axios.post(`https://gigzhub.net/api/v1${path}`, {}, {
        headers: {
          "x-api-key": apiKey || "",
          "Content-Type": "application/json",
          "Accept": "application/json"
        }
      });
      console.log(`POST ${path} SUCCESS:`, res.status, res.data);
    } catch (e: any) {
      console.log(`POST ${path} FAILED:`, e.response?.status, JSON.stringify(e.response?.data || e.message));
    }
  }
}

testPOST();
