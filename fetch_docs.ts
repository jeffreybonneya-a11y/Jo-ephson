import axios from "axios";

async function main() {
  try {
    const res = await axios.get("https://gigzhub.net/api-docs");
    const html = res.data;
    console.log("HTML length:", html.length);
    
    // Find lines/text containing "phone" or "format" or "02" or "05" or "233"
    const regexes = [
      /phone/gi,
      /format/gi,
      /233/gi,
      /0[0-9]{9}/gi,
      /number/gi
    ];
    
    for (const r of regexes) {
      const matches = html.match(r);
      console.log(`Regex ${r}: matched ${matches ? matches.length : 0} times`);
    }

    // Print some text around matches
    let index = 0;
    while ((index = html.indexOf("phone", index)) !== -1) {
      console.log("--- MATCH ---");
      console.log(html.substring(Math.max(0, index - 150), Math.min(html.length, index + 150)));
      index += 5;
    }
  } catch (err: any) {
    console.error("Error fetching docs:", err.message);
  }
}

main();
