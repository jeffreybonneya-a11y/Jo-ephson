import axios from "axios";

const apiKey = process.env.GIGZHUB_API_KEY || "dk_MwDySPXquapN0DfWZ550BuwjADOThi64";

async function testPhoneFormatsWithValidSlug() {
  const phoneFormats = [
    "123",
    "abcdef",
    "057123456", // 9 digits (too short for 0XXXXXXXXX)
    "05712345678", // 11 digits (too long for 0XXXXXXXXX)
    "2335712345", // too short for 233XXXXXXXXX
    "2335712345678", // too long for 233XXXXXXXXX
    "0571234567" // standard 10 digit (0XXXXXXXXX)
  ];

  for (const phone of phoneFormats) {
    try {
      console.log(`Testing phone with valid slug: ${phone}...`);
      const res = await axios.post(`https://gigzhub.net/api/v1/order/airteltigo`, {
        phone,
        volume: 1,
        offerSlug: "ishare_data",
        type: "single"
      }, {
        headers: {
          "x-api-key": apiKey,
          "Content-Type": "application/json",
          "Accept": "application/json"
        }
      });
      console.log(`SUCCESS ${phone}:`, res.status, res.data);
    } catch (e: any) {
      console.log(`FAILED ${phone}: status ${e.response?.status}`, JSON.stringify(e.response?.data || e.message));
    }
  }
}

testPhoneFormatsWithValidSlug();
