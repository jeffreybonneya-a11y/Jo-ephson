import axios from "axios";

async function fetchDocs() {
  const docPaths = [
    "/api-docs",
    "/api/v1/api-docs",
    "/swagger-ui.html",
    "/swagger.json",
    "/api/v1/swagger.json",
    "/docs",
    "/api/v1/docs"
  ];

  for (const path of docPaths) {
    try {
      console.log(`GET https://gigzhub.net${path}...`);
      const res = await axios.get(`https://gigzhub.net${path}`);
      console.log(`SUCCESS GET ${path}:`, res.status, res.data.toString().substring(0, 500));
    } catch (e: any) {
      console.log(`FAILED GET ${path}:`, e.response?.status, e.message);
    }
  }
}

fetchDocs();
