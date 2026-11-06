import React from 'react';
import { Route, Routes, useNavigate, useLocation } from 'react-router-dom';
import { Login, PrivacyPolicy } from './components'
import Home from './container/Home';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { useEffect } from 'react';


const App = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {

    if (location.pathname != '/privacy-policy') {
      const User = localStorage.getItem('user') !== 'undefined' ? JSON.parse(localStorage.getItem('user')) : localStorage.clear();



      if (!User) navigate('/login');
    }

  }, []);

  return (
    <GoogleOAuthProvider clientId={`${process.env.REACT_APP_GOOGLE_API_TOKEN}`} >

      <Routes>
        <Route path="Login" element={<Login />} />
        <Route path="/*" element={<Home />} />
        <Route path='privacy-policy' element={<PrivacyPolicy />} />
      </Routes>

    </GoogleOAuthProvider>


  )
}

export default App






