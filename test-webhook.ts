import express from 'express';
import crypto from 'crypto';
import request from 'supertest';

const app = express();

const paystackWebhookHandler = async (req: any, res: any) => {
  const secretKey = 'test_secret';
  const signature = req.headers['x-paystack-signature'];
  
  const hash = crypto.createHmac('sha512', secretKey).update(req.body).digest('hex');

  if (hash !== signature) {
    return res.status(401).json({ message: 'Verification failed' });
  }

  res.sendStatus(200);
};

app.post('/api/webhook/paystack', express.raw({ type: '*/*' }), paystackWebhookHandler);
app.use(express.json());

const payload = JSON.stringify({ event: 'charge.success', data: { reference: 'abc' } });
const sig = crypto.createHmac('sha512', 'test_secret').update(payload).digest('hex');

request(app)
  .post('/api/webhook/paystack')
  .set('x-paystack-signature', sig)
  .set('Content-Type', 'application/json')
  .send(payload)
  .expect(200)
  .then(() => console.log('success'))
  .catch((e) => console.error(e));
