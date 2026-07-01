import axios from "axios";

const apiKey = process.env.GIGZHUB_API_KEY;
const domains = [
  "https://gigzhub.net",
  "https://agent.gigshub.cloud"
];

const paths = [
  "/api/v1/data/airteltigo",
  "/api/v1/data/AirtelTigo",
  "/api/v1/data/telecel",
  "/api/v1/data/Telecel",
  "/api/v1/data/mtn",
  "/api/v1/data/MTN",
  "/api/v1/data/at",
  "/api/v1/data/AT",
  "/api/v1/airteltigo",
  "/api/v1/AirtelTigo",
  "/api/v1/telecel",
  "/api/v1/Telecel",
  "/api/v1/mtn",
  "/api/v1/MTN",
  "/api/v1/at",
  "/api/v1/AT"
];

async function probeBoth() {
  for (const domain of domains) {
    for (const path of paths) {
      try {
        console.log(`POST to ${domain}${path}...`);
        const res = await axios.post(`${domain}${path}`, {}, {
          headers: {
            "x-api-key": apiKey || "",
            "Content-Type": "application/json",
            "Accept": "application/json"
          }
        });
        console.log(`SUCCESS: POST ${domain}${path} returned status ${res.status}:`, res.data);
      } catch (e: any) {
        console.log(`ERROR: POST ${domain}${path} returned status ${e.response?.status}:`, e.response?.data || e.message);
      }
    }
  }
}

probeBoth();
