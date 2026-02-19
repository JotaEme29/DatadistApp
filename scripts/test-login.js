const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load environment variables
const envPath = path.resolve(process.cwd(), '.env.local');
console.log('Loading .env.local from:', envPath);
const envConfig = dotenv.parse(fs.readFileSync(envPath));
for (const k in envConfig) {
  process.env[k] = envConfig[k];
}

async function testLogin() {
  const username = process.env.DATADIS_USERNAME;
  const password = process.env.DATADIS_PASSWORD;

  console.log('------------------------------------------------');
  console.log('Testing Datadis Login...');
  console.log('Username length:', username.length);
  console.log('Password length:', password.length);
  if (username.trim() !== username) console.warn('WARNING: Username has leading/trailing whitespace!');
  if (password.trim() !== password) console.warn('WARNING: Password has leading/trailing whitespace!');

  const url = 'https://datadis.es/nikola-auth/tokens/login';
  console.log('Target URL:', url);

  try {
    const params = new URLSearchParams();
    params.append('username', username);
    params.append('password', password);

    console.log('Trying application/x-www-form-urlencoded...');
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      body: params.toString(),
    });

    console.log('Response Status:', response.status);
    console.log('Response StatusText:', response.statusText);
    
    const text = await response.text();
    console.log('Response Body Preview:', text.substring(0, 200));

    if (response.ok) {
      console.log('SUCCESS: Login successful!');
    } else {
      console.error('FAILURE: Login failed.');
    }
  } catch (error) {
    console.error('EXCEPTION:', error);
  }
  console.log('------------------------------------------------');
}

testLogin();
