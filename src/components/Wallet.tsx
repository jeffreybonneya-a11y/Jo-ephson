import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function Wallet() {
  const [phone, setPhone] = useState('');
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [amount, setAmount] = useState(10);
  const [loading, setLoading] = useState(false);

  const fetchWallet = async (p: string) => {
    const bRes = await fetch(`/wallet/balance/${p}`);
    const bData = await bRes.json();
    setBalance(bData.balance);
    const tRes = await fetch(`/wallet/transactions/${p}`);
    const tData = await tRes.json();
    setTransactions(tData.transactions);
  };

  const handleTopUp = async () => {
    if (!/^233\d{9}$/.test(phone)) return toast.error("Invalid phone");
    setLoading(true);
    const res = await fetch('/wallet/initiate-topup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, amount, email: 'customer@example.com' })
    });
    const data = await res.json();
    // Initialize Paystack with data.reference
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Your Wallet</CardTitle></CardHeader>
        <CardContent>
          <Input placeholder="Enter Phone 233..." value={phone} onChange={e => setPhone(e.target.value)} />
          <Button onClick={() => fetchWallet(phone)} className="mt-2">Check Balance</Button>
          <div className="text-2xl font-bold mt-4">Balance: GHS {balance.toFixed(2)}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Top Up</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {[10, 20, 50, 100].map(amt => (
                <Button key={amt} onClick={() => { setAmount(amt); handleTopUp(); }}>GHS {amt}</Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
