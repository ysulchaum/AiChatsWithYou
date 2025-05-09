import { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import './Login.css';

interface GoogleCredentialResponse {
  credential?: string;
}

interface UserInfo {
  name: string;
  email: string;
  picture: string;
  sub: string;
}

function Login() {
  const [status, setStatus] = useState<string>('');
  const navigate = useNavigate();

  const handleSuccess = async (credentialResponse: GoogleCredentialResponse) => {
    if (credentialResponse.credential) {
      const userInfo: UserInfo = jwtDecode(credentialResponse.credential);
      console.log('User Info:', userInfo);

      // Register or update user in backend
      try {
        const response = await fetch('http://localhost:5000/register-user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            google_sub: userInfo.sub,
            user_name: userInfo.name,
            email: userInfo.email,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to register user');
        }

        // Store user info in local storage
        localStorage.setItem('user', JSON.stringify(userInfo));
        setStatus('Login successful! Redirecting...');
        setTimeout(() => navigate('/'), 1000);
      } catch (error) {
        console.error('Error registering user:', error);
        setStatus('Login failed: Unable to register user.');
      }
    } else {
      setStatus('No credential received from Google.');
    }
  };

  const handleError = () => {
    console.error('Google Login Error');
    setStatus('Login failed: Unknown error.');
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">Welcome to Voice Assistant</h1>
        <p className="login-subtitle">Sign in to continue</p>
        <div className="google-login-container">
          <GoogleLogin
            onSuccess={handleSuccess}
            onError={handleError}
            theme="filled_blue"
            size="large"
            text="signin_with"
            ux_mode="popup"
          />
        </div>
        {status && <p className="login-status">{status}</p>}
      </div>
    </div>
  );
}

export default Login;