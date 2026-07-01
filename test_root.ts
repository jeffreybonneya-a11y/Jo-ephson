import axios from "axios";

const apiKey = process.env.GIGZHUB_API_KEY;

async function testRoot() {
  try {
    const res = await axios.get("https://gigzhub.net/api/v1/", {
      headers: {
        "x-api-key": apiKey || "",
        "Accept": "application/json"
      }
    });
    console.log("ROOT GET SUCCESS:", res.status, res.data);
  } catch (e: any) {
    console.log("ROOT GET FAILED:", e.response?.status, e.response?.data || e.message);
  }

  try {
    const res = await axios.get("https://gigzhub.net/", {
      headers: {
        "x-api-key": apiKey || "",
        "Accept": "application/json"
      }
    });
    console.log("DOMAIN ROOT GET SUCCESS:", res.status, res.data);
  } catch (e: any) {
    console.log("DOMAIN ROOT GET FAILED:", e.response?.status, e.response?.data || e.message);
  }
}

testRoot();
