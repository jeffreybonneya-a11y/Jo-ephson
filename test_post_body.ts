import axios from "axios";

const apiKey = process.env.GIGZHUB_API_KEY;

async function testWithBody() {
  const payload = {
    phone: "0571234567",
    volume: 1,
    offerSlug: "at_1gb_promo"
  };

  const paths = [
    "/data/airteltigo",
    "/data/AirtelTigo",
    "/data/telecel",
    "/data/Telecel",
    "/data/mtn",
    "/data/MTN",
    "/data/at"
  ];

  for (const path of paths) {
    try {
      console.log(`POST to https://gigzhub.net/api/v1${path} with body...`);
      const res = await axios.post(`https://gigzhub.net/api/v1${path}`, payload, {
        headers: {
          "x-api-key": apiKey || "",
          "Content-Type": "application/json",
          "Accept": "application/json"
        }
      });
      console.log(`SUCCESS ${path}:`, res.status, res.data);
    } catch (e: any) {
      console.log(`FAILED ${path}:`, e.response?.status, JSON.stringify(e.response?.data || e.message));
    }
  }
}

testWithBody();
