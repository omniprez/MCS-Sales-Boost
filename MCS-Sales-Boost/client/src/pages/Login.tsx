import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useToast } from "../hooks/use-toast";
import { useAuth } from '../contexts/AuthContext';
import '../styles/login.css';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagesPreloaded, setImagesPreloaded] = useState(false);
  const [errorDetails, setErrorDetails] = useState('');
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { login, isLoading } = useAuth();

  // Preload images for better user experience
  useEffect(() => {
    const preloadImages = async () => {
      const imagesToPreload = [
        '/images/wave-background.jpg',
        '/images/rogers-capital-logo.png'
      ];

      try {
        const promises = imagesToPreload.map((src) => {
          return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = src;
            img.onload = resolve;
            img.onerror = reject;
          });
        });

        await Promise.all(promises);
        setImagesPreloaded(true);
      } catch (error) {
        console.error('Failed to preload images:', error);
        // Continue anyway to not block the login
        setImagesPreloaded(true);
      }
    };

    preloadImages();
  }, []);

  // Try direct API connection
  const testApiConnection = async () => {
    try {
      setErrorDetails('Testing API connection...');
      
      // Try fetch with a simple endpoint without authentication
      const response = await fetch('/api/health-check');
      const data = await response.text();
      
      setErrorDetails(prev => prev + '\nHealth check response: ' + data);
      
      // Try database connection test
      try {
        const dbResponse = await fetch('/api/db-direct-test');
        const dbData = await dbResponse.text();
        setErrorDetails(prev => prev + '\nDB test response: ' + dbData);
      } catch (dbError) {
        setErrorDetails(prev => prev + '\nDB test error: ' + (dbError instanceof Error ? dbError.message : String(dbError)));
      }
    } catch (error) {
      setErrorDetails(prev => prev + '\nAPI test error: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setErrorDetails('');
    
    try {
      console.log('Login: Attempting login with username:', username);

      // Use the login function from AuthContext
      const user = await login(username, password);

      // If login is successful (no error thrown), show success toast
      toast({
        title: "Success",
        description: `Login successful!`,
      });

      // Add a small delay to ensure session is fully established
      console.log('Login: Login successful, waiting briefly before redirect...');
      await new Promise(resolve => setTimeout(resolve, 300));

      // Use the router to navigate to the dashboard
      console.log('Login: Redirecting to dashboard');

      // Force a hard navigation to ensure a clean state
      window.location.href = '/';

      // As a fallback, also try the router navigation
      setTimeout(() => {
        setLocation('/');
      }, 100);

    } catch (error) {
      console.error('Login: Login error:', error);
      
      // Show error toast
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to login",
        variant: "destructive"
      });
      
      // Set error details to show in the UI
      setErrorDetails('Login error: ' + (error instanceof Error ? error.message : String(error)));
      
      // Automatically test API connection
      await testApiConnection();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      {/* Loading overlay */}
      <div className={`loading-overlay ${isSubmitting ? 'visible' : ''}`}>
        <div className="loading-spinner"></div>
      </div>

      {/* Enhanced background structure */}
      <div className="background-wrapper">
        <img
          src="/images/wave-background.jpg"
          alt=""
          className="background-image"
          style={{ opacity: imagesPreloaded ? 1 : 0, transition: 'opacity 0.5s ease' }}
        />
      </div>
      <div className="background-overlay"></div>

      <div className="login-container" style={{ opacity: imagesPreloaded ? 1 : 0, transition: 'opacity 0.5s ease' }}>
        <div className="glow glow-1"></div>
        <div className="glow glow-2"></div>

        <img src="/images/rogers-capital-logo.png" alt="Rogers Capital" className="rogers-logo" />

        <h1 className="app-title">MCS SalesBoost</h1>
        <p className="app-subtitle">Manage wireless and fiber connectivity sales</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="username">Username</label>
            <input
              className="form-input"
              id="username"
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
              disabled={isSubmitting}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              className="form-input"
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              disabled={isSubmitting}
            />
          </div>

          <button
            type="submit"
            className="submit-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Signing in..." : "Sign In"}
          </button>
          
          {/* Error diagnostics section */}
          {errorDetails && (
            <div className="error-details" style={{ 
              marginTop: '20px', 
              color: '#fff', 
              backgroundColor: 'rgba(220, 53, 69, 0.7)', 
              padding: '10px', 
              borderRadius: '5px',
              fontSize: '12px',
              whiteSpace: 'pre-wrap'
            }}>
              <details>
                <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>Error Details (Click to expand)</summary>
                <div style={{ marginTop: '10px' }}>
                  {errorDetails}
                </div>
              </details>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
