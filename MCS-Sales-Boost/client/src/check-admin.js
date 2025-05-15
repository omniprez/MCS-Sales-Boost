// Simple script to check if the current user is an admin
const checkAdmin = async () => {
  try {
    const response = await fetch('/api/auth/check', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    
    if (!response.ok) {
      console.error("Auth check failed with status:", response.status);
      document.body.innerHTML = '<div style="padding: 20px; color: red;">Not logged in</div>';
      return;
    }
    
    const data = await response.json();
    console.log("Auth check response data:", data);
    
    if (data.authenticated && data.user) {
      const isAdmin = data.user.role === 'admin';
      document.body.innerHTML = `
        <div style="padding: 20px;">
          <h2>User Information</h2>
          <p><strong>Name:</strong> ${data.user.name}</p>
          <p><strong>Username:</strong> ${data.user.username}</p>
          <p><strong>Role:</strong> ${data.user.role}</p>
          <p><strong>Is Admin:</strong> ${isAdmin ? 'Yes' : 'No'}</p>
        </div>
      `;
    } else {
      document.body.innerHTML = '<div style="padding: 20px; color: red;">Not authenticated</div>';
    }
  } catch (error) {
    console.error('Auth check error:', error);
    document.body.innerHTML = `<div style="padding: 20px; color: red;">Error: ${error.message}</div>`;
  }
};

// Run the check when the page loads
window.addEventListener('DOMContentLoaded', checkAdmin);
