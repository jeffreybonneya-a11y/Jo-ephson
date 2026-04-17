import axios from "axios";

const apiKey = "dk_MwDySPXquapN0DfWZ550BuwjADOThi64";
const baseUrl = "https://agent.gigshub.cloud/api/v1";

async function finalTest() {
  const endpoints = [
    "/data/plans",
    "/data",
    "/user",
    "/plans",
    "/variations"
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`Testing ${endpoint} with apikey header...`);
      const response = await axios.get(`${baseUrl}${endpoint}`, {
        headers: {
          "apikey": apiKey,
          "Accept": "application/json"
        }
      });
      console.log(`SUCCESS ${endpoint} (apikey):`, JSON.stringify(response.data).substring(0, 100));
    } catch (e) {}

    try {
      console.log(`Testing ${endpoint} with Authorization: Bearer...`);
      const response = await axios.get(`${baseUrl}${endpoint}`, {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Accept": "application/json"
        }
      });
      console.log(`SUCCESS ${endpoint} (Bearer):`, JSON.stringify(response.data).substring(0, 100));
    } catch (e) {}
  }
}

finalTest();
