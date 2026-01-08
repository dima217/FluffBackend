#!/usr/bin/env node

/**
 * Script to fetch Swagger JSON from the running backend application
 * Usage: node scripts/fetch-swagger.js [options]
 *
 * Options:
 *   --url <url>     Backend URL (default: http://localhost:3000)
 *   --output <path> Output file path (default: swagger.json)
 *   --pretty        Pretty print JSON output
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
let backendUrl = 'http://localhost:3000';
let outputPath = 'swagger.json';
let pretty = false;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--url' && args[i + 1]) {
    backendUrl = args[i + 1];
    i++;
  } else if (args[i] === '--output' && args[i + 1]) {
    outputPath = args[i + 1];
    i++;
  } else if (args[i] === '--pretty') {
    pretty = true;
  } else if (args[i] === '--help' || args[i] === '-h') {
    console.log(`
Usage: node scripts/fetch-swagger.js [options]

Options:
  --url <url>       Backend URL (default: http://localhost:3000)
  --output <path>   Output file path (default: swagger.json)
  --pretty          Pretty print JSON output
  --help, -h        Show this help message

Examples:
  node scripts/fetch-swagger.js
  node scripts/fetch-swagger.js --url http://localhost:3000 --output swagger.json --pretty
  node scripts/fetch-swagger.js --url https://api.example.com --output docs/swagger.json
`);
    process.exit(0);
  }
}

// Parse URL
const url = new URL(backendUrl);
const swaggerJsonUrl = `${backendUrl}/api-json`;

console.log(`Fetching Swagger JSON from: ${swaggerJsonUrl}`);

// Choose http or https module
const client = url.protocol === 'https:' ? https : http;

// Make request
const request = client.get(swaggerJsonUrl, (res) => {
  let data = '';

  if (res.statusCode !== 200) {
    console.error(`Error: Received status code ${res.statusCode}`);
    console.error(`Make sure the backend is running and Swagger is enabled at ${swaggerJsonUrl}`);
    process.exit(1);
  }

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      // Parse JSON to validate it
      const json = JSON.parse(data);

      // Format JSON if pretty flag is set
      const output = pretty ? JSON.stringify(json, null, 2) : JSON.stringify(json);

      // Ensure output directory exists
      const outputDir = path.dirname(outputPath);
      if (outputDir !== '.' && !fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Write to file
      fs.writeFileSync(outputPath, output, 'utf8');

      console.log(`✓ Swagger JSON saved to: ${path.resolve(outputPath)}`);
      console.log(`  File size: ${(output.length / 1024).toFixed(2)} KB`);
      console.log(`  API version: ${json.info?.version || 'unknown'}`);
      console.log(`  Endpoints: ${Object.keys(json.paths || {}).length}`);
    } catch (error) {
      console.error('Error parsing JSON:', error.message);
      process.exit(1);
    }
  });
});

request.on('error', (error) => {
  console.error(`Error fetching Swagger JSON: ${error.message}`);
  console.error(`Make sure the backend is running at ${backendUrl}`);
  process.exit(1);
});

request.setTimeout(10000, () => {
  console.error('Error: Request timeout');
  request.destroy();
  process.exit(1);
});
