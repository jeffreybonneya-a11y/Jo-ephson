import axios from "axios";

const apiKey = "dk_MwDySPXquapN0DfWZ550BuwjADOThi64";
const baseUrl = "https://agent.gigshub.cloud/api";

async function testEndpoints() {
  const endpoints = [
    "/data-variations",
    "/data/variations",
    "/variations",
    "/data-plans"
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`Testing ${endpoint}...`);
      const response = await axios.get(`${baseUrl}${endpoint}`, {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Accept": "application/json"
        }
      });
      console.log(`SUCCESS ${endpoint}:`, JSON.stringify(response.data).substring(0, 200));
    } catch (error: any) {
      console.log(`FAILED ${endpoint}: ${error.response?.status} - ${error.message}`);
    }
  }
}

testEndpoints();
