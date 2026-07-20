console.log("Environment PAYSTACK_SECRET_KEY checks:");
const key = process.env.PAYSTACK_SECRET_KEY;
if (key) {
  console.log("Length:", key.length);
  console.log("Starts with:", key.slice(0, 12));
  console.log("Ends with:", key.slice(-4));
  console.log("Has quotes?:", key.startsWith('"') || key.endsWith('"') || key.startsWith("'") || key.endsWith("'"));
  console.log("All chars code points:", [...key].map(c => c.charCodeAt(0)));
} else {
  console.log("PAYSTACK_SECRET_KEY is undefined");
}
