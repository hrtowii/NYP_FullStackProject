import React, { createContext, useState, useEffect } from 'react';
// This is essentially a global variable / useState that is passed down to everything
// this is done so that after logging in, the token can be set and be available to all pages afterwards
export const TokenContext = createContext();

export const TokenProvider = ({ children }) => {
  const [token, setToken] = useState(() => {
    // Initialize token from localStorage
    return localStorage.getItem('token') || null;
  });

  useEffect(() => {
    // Update localStorage whenever token changes
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }, [token]);
  const updateToken = (newToken) => {
    console.log("new token: "+newToken)
    setToken(newToken);
  };

  return (
    <TokenContext.Provider value={{ token, updateToken }}>
      {children}
    </TokenContext.Provider>
  );
};