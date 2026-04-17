import axios from "axios";

const apiKey = "dk_MwDySPXquapN0DfWZ550BuwjADOThi64";
const baseUrl = "https://agent.gigshub.cloud/api/v1";

async function testApiKeyHeader() {
  try {
    const response = await axios.get(`${baseUrl}/user`, {
      headers: {
        "apikey": apiKey,
        "Accept": "application/json"
      }
    });
    console.log("SUCCESS WITH apikey header:", JSON.stringify(response.data));
  } catch (error: any) {
    console.log(`FAILED with apikey header: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
  }
}

testApiKeyHeader();
