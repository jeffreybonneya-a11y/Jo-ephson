import axios from "axios";

const apiKey = process.env.GIGZHUB_API_KEY || "dk_MwDySPXquapN0DfWZ550BuwjADOThi64";

async function checkBalance() {
  try {
    const res = await axios.get("https://gigzhub.net/api/v1/balance", {
      headers: { "x-api-key": apiKey }
    });
    console.log("Current balance:", res.data);
  } catch (e: any) {
    console.error("Balance fetch failed:", e.message);
  }
}

checkBalance();
