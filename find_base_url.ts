import axios from "axios";

const apiKey = "dk_MwDySPXquapN0DfWZ550BuwjADOThi64";
const baseUrls = [
  "https://agent.gigshub.cloud/api/v1",
  "https://agent.gigshub.cloud/api",
  "https://gigshub.cloud/api/v1",
  "https://gigshub.cloud/api"
];

async function findBaseUrl() {
  for (const baseUrl of baseUrls) {
    try {
      console.log(`Testing Base URL: ${baseUrl}...`);
      const response = await axios.get(`${baseUrl}/user`, {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Accept": "application/json"
        }
      });
      console.log(`SUCCESS at ${baseUrl}!!`);
      console.log("USER DATA:", JSON.stringify(response.data));
      return;
    } catch (error: any) {
      console.log(`FAILED ${baseUrl}: ${error.response?.status}`);
    }
  }
}

findBaseUrl();
