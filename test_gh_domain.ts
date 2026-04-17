import axios from "axios";

const apiKey = "dk_MwDySPXquapN0DfWZ550BuwjADOThi64";
const baseUrl = "https://gigshub.com.gh/api/v1";

async function testGhDomain() {
  try {
    const response = await axios.get(`${baseUrl}/data-variations`, {
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Accept": "application/json"
      }
    });
    console.log("SUCCESS GH DOMAIN:", JSON.stringify(response.data).substring(0, 200));
  } catch (error: any) {
    console.log(`FAILED GH DOMAIN: ${error.response?.status} - ${error.message}`);
  }
}

testGhDomain();
