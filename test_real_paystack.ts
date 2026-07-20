import axios from 'axios';

async function testPaystack() {
  const key = process.env.PAYSTACK_SECRET_KEY;
  console.log("Using secret key starting with:", key ? key.slice(0, 10) : "undefined");
  try {
    const response = await axios.post('https://api.paystack.co/transaction/initialize', {
      email: "jeffreybonneya@gmail.com",
      amount: 1000, // 10 GHS
      reference: "test_ref_" + Date.now(),
      callback_url: "https://example.com",
      currency: "GHS"
    }, {
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json'
      }
    });
    console.log("Success! Response data:", JSON.stringify(response.data, null, 2));
  } catch (err: any) {
    console.log("Error status:", err.response?.status);
    console.log("Error message:", err.message);
    console.log("Error response data:", JSON.stringify(err.response?.data, null, 2));
  }
}

testPaystack();
