import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import fetch from 'node-fetch';

async function testBulkUpload() {
  try {
    // First login
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'password'
      }),
      credentials: 'include'
    });

    const cookies = loginResponse.headers.get('set-cookie');
    console.log('Login response:', await loginResponse.json());
    
    if (!cookies) {
      throw new Error('No cookies received from login');
    }

    // Create form data
    const form = new FormData();
    const filePath = path.join(__dirname, '..', 'test-deals.csv');
    form.append('file', fs.createReadStream(filePath));

    // Upload file
    const uploadResponse = await fetch('http://localhost:3000/api/admin/bulk-upload-deals', {
      method: 'POST',
      body: form,
      headers: {
        'Cookie': cookies
      }
    });

    console.log('Upload response:', await uploadResponse.json());
  } catch (error) {
    console.error('Error:', error);
  }
}

testBulkUpload(); 