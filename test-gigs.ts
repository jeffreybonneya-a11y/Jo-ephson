import axios from 'axios';

async function testGigsHub() {
  try {
    const response = await axios.post('https://www.gigshub.cloud/api/v1/order/mtn', {
      type: "single",
      volume: "2",
      phone: "233241234567",
      offerSlug: "mtn_data_bundle",
      webhookUrl: "https://king-j-deals.onrender.com/api/webhook/gigshub"
    }, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'x-api-key': 'dk_e87pONcP0e0NxTfZg-gvEwwpVf025Czu' // From user's prompt
      }
    });
    console.log("SUCCESS:", response.data);
  } catch (error: any) {
    if (error.response) {
      console.log("STATUS:", error.response.status);
      console.log("DATA:", JSON.stringify(error.response.data, null, 2));
    } else {
      console.log("ERROR MESSAGE:", error.message);
    }
  }
}

testGigsHub();
