import fetch from 'node-fetch';
import { db } from '../server/db';
import { deals } from '../shared/schema';

async function checkAPI() {
  try {
    console.log('Checking database...');
    const allDeals = await db.select().from(deals);
    console.log(`Found ${allDeals.length} deals in database`);
    
    // Check API endpoints
    console.log('\nChecking API endpoints...');
    
    // Login first to get a session
    console.log('Logging in...');
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'password'
      })
    });
    
    if (!loginResponse.ok) {
      console.error('Login failed:', await loginResponse.text());
      return;
    }
    
    const cookies = loginResponse.headers.get('set-cookie');
    console.log('Login successful, got cookies:', cookies);
    
    // Check dashboard endpoint
    console.log('\nChecking dashboard endpoint...');
    const dashboardResponse = await fetch('http://localhost:5000/api/dashboard', {
      headers: {
        Cookie: cookies || ''
      }
    });
    
    if (!dashboardResponse.ok) {
      console.error('Dashboard API failed:', await dashboardResponse.text());
      return;
    }
    
    const dashboardData = await dashboardResponse.json();
    console.log('Dashboard API response:', JSON.stringify(dashboardData, null, 2));
    
    // Check pipeline endpoint
    console.log('\nChecking pipeline endpoint...');
    const pipelineResponse = await fetch('http://localhost:5000/api/pipeline', {
      headers: {
        Cookie: cookies || ''
      }
    });
    
    if (!pipelineResponse.ok) {
      console.error('Pipeline API failed:', await pipelineResponse.text());
      return;
    }
    
    const pipelineData = await pipelineResponse.json();
    console.log(`Pipeline API returned ${pipelineData.length} deals`);
    if (pipelineData.length > 0) {
      console.log('First pipeline deal:', JSON.stringify(pipelineData[0], null, 2));
    }
    
  } catch (error) {
    console.error('Error checking API:', error);
  } finally {
    process.exit(0);
  }
}

checkAPI();
