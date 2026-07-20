console.log("Environment VITE_PAYSTACK_PUBLIC_KEY checks:");
const key = process.env.VITE_PAYSTACK_PUBLIC_KEY;
if (key) {
  console.log("Length:", key.length);
  console.log("Starts with:", key.slice(0, 12));
  console.log("Ends with:", key.slice(-4));
} else {
  console.log("VITE_PAYSTACK_PUBLIC_KEY is undefined");
}
