const fs = require("fs");
const path = require("path");

// Path to where config.local.js should be created
const outputPath = path.join(__dirname, "../js/config.local.js");

const content = `
window.__APP_ENV__ = {
    TMDB_API_KEY: "${process.env.TMDB_API_KEY || ""}",
    OMDB_API_KEY: "${process.env.OMDB_API_KEY || ""}"
};
`;

fs.writeFileSync(outputPath, content);
console.log("✅ Generated js/config.local.js for Netlify");
