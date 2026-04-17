import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const test = async () => {
    try {
        const response = await axios.get(`https://api.paystack.co/transaction/verify/`, {
            headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` }
        });
        console.log(response.data);
    } catch (e: any) {
        console.log(e.response?.data);
    }
}
test();
