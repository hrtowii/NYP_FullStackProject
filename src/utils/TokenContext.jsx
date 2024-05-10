import React, { createContext, useState } from 'react';
// This is essentially a global variable / useState that is passed down to everything
// this is done so that after logging in, the token can be set and be available to all pages afterwards
export const TokenContext = createContext();

export const TokenProvider = ({ children }) => {
  const [token, setToken] = useState(null);

  const updateToken = (newToken) => {
    setToken(newToken);
  };

  return (
    <TokenContext.Provider value={{ token, updateToken }}>
      {children}
    </TokenContext.Provider>
  );
};