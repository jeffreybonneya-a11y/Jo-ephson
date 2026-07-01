console.log("Environment keys:");
Object.keys(process.env).forEach(key => {
  if (key.includes("API") || key.includes("KEY") || key.includes("SECRET") || key.includes("GIGZHUB")) {
    console.log(`${key}: ${process.env[key] ? "DEFINED" : "UNDEFINED"} (Length: ${process.env[key]?.length || 0})`);
  }
});
