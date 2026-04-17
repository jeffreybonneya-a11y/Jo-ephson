import axios from "axios";

const apiKey = "dk_MwDySPXquapN0DfWZ550BuwjADOThi64";
const domains = ["https://agent.gigshub.cloud", "https://gigshub.cloud"];
const prefixes = ["/api/v1", "/api", "/api/v2", "/api/reseller", "/api/reseller/v1"];
const endpoints = ["/user", "/data/plans", "/plans", "/profile"];

async function bruteForce() {
  for (const domain of domains) {
    for (const prefix of prefixes) {
      for (const endpoint of endpoints) {
        const url = `${domain}${prefix}${endpoint}`;
        try {
          console.log(`Testing ${url}...`);
          const response = await axios.get(url, {
            headers: {
              "Authorization": `Bearer ${apiKey}`,
              "Accept": "application/json"
            },
            timeout: 5000
          });
          if (typeof response.data === 'object') {
             console.log(`!!! SUCCESS !!! FOUND API AT: ${url}`);
             console.log("DATA TYPE:", typeof response.data);
             return;
          } else {
             console.log(`HTML received at ${url}`);
          }
        } catch (error: any) {
          console.log(`FAILED ${url}: ${error.response?.status || error.message}`);
        }
      }
    }
  }
}

bruteForce();
