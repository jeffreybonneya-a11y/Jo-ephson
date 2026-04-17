import axios from "axios";

const apiKey = "dk_MwDySPXquapN0DfWZ550BuwjADOThi64";
const baseUrl = "https://gigshub.cloud/api";

async function testPlans() {
  try {
    const response = await axios.get(`${baseUrl}/plans`, {
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Accept": "application/json"
      }
    });
    console.log("PLANS SUCCESS:", JSON.stringify(response.data, null, 2));
  } catch (error: any) {
    console.log(`PLANS FAILED: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
  }
}

testPlans();
