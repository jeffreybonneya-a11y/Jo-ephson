import axios from "axios";

const apiKey = process.env.GIGZHUB_API_KEY;

async function testVariations() {
  const paths = [
    "/data/airteltigo/purchase",
    "/data/AirtelTigo/purchase",
    "/data/airteltigo/buy",
    "/data/AirtelTigo/buy",
    "/data/airteltigo/order",
    "/data/AirtelTigo/order",
    "/data/airtel-tigo",
    "/data/Airtel-Tigo",
    "/data/airtel-tigo/purchase",
    "/data/Airtel-Tigo/purchase",
    "/airteltigo/purchase",
    "/AirtelTigo/purchase",
    "/airteltigo/buy",
    "/AirtelTigo/buy",
    "/airteltigo/order",
    "/AirtelTigo/order",
    "/data/telecel/purchase",
    "/data/Telecel/purchase",
    "/data/telecel/buy",
    "/data/Telecel/buy",
    "/data/mtn/purchase",
    "/data/MTN/purchase",
    "/data/mtn/buy",
    "/data/MTN/buy",
    "/data/at/purchase",
    "/data/AT/purchase"
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

testVariations();
