import fetch from 'node-fetch';

async function testUpdateStage() {
  try {
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
    
    // Get all deals to find one to update
    console.log('\nFetching deals...');
    const dealsResponse = await fetch('http://localhost:5000/api/deals', {
      headers: {
        Cookie: cookies || ''
      }
    });
    
    if (!dealsResponse.ok) {
      console.error('Failed to fetch deals:', await dealsResponse.text());
      return;
    }
    
    const deals = await dealsResponse.json();
    console.log(`Found ${deals.length} deals`);
    
    if (deals.length === 0) {
      console.error('No deals found to update');
      return;
    }
    
    // Pick the first deal
    const dealToUpdate = deals[0];
    console.log(`Selected deal to update: ${dealToUpdate.id} - ${dealToUpdate.name} (current stage: ${dealToUpdate.stage})`);
    
    // Determine the next stage
    const stages = ['prospecting', 'qualification', 'proposal', 'negotiation', 'closed_won'];
    const currentStageIndex = stages.indexOf(dealToUpdate.stage);
    const nextStage = currentStageIndex < stages.length - 1 
      ? stages[currentStageIndex + 1] 
      : 'closed_won';
    
    console.log(`\nUpdating deal ${dealToUpdate.id} to stage: ${nextStage}`);
    
    // Update the deal stage
    const updateResponse = await fetch(`http://localhost:5000/api/deals/${dealToUpdate.id}/stage`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookies || ''
      },
      body: JSON.stringify({ stage: nextStage })
    });
    
    if (!updateResponse.ok) {
      console.error('Failed to update deal stage:', await updateResponse.text());
      return;
    }
    
    const updatedDeal = await updateResponse.json();
    console.log('Deal updated successfully:', updatedDeal);
    
  } catch (error) {
    console.error('Error testing update stage:', error);
  }
}

testUpdateStage();
