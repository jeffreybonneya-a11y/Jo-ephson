import axios from 'axios';

const run = async () => {
  try {
    // Test 1: Invalid Key
    try {
      await axios.get(`https://api.paystack.co/transaction/verify/SOME_REF`, {
        headers: { Authorization: `Bearer sk_live_invalid` }
      });
    } catch (e: any) {
      console.log('Test 1 (Invalid Key) Error:', e.response?.data);
    }

    // Test 2: Valid format key, invalid ref
    try {
      await axios.get(`https://api.paystack.co/transaction/verify/SOME_REF*&^`, {
        headers: { Authorization: `Bearer sk_test_1234567890123456789012345678901234567890` }
      });
    } catch (e: any) {
      console.log('Test 2 (Valid key, bad ref) Error:', e.response?.data);
    }
    
    // Test 3: empty ref
    try {
      await axios.get(`https://api.paystack.co/transaction/verify/`, {
        headers: { Authorization: `Bearer sk_test_1234567890123456789012345678901234567890` }
      });
    } catch (e: any) {
       console.log('Test 3 (Empty ref URL) Error:', e.response?.data);
    }
  } catch (err) {
    console.error(err);
  }
}
run();
