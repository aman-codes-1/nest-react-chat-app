import { createContext, useLayoutEffect, useState } from 'react';
import { login } from '../../helpers';
import { AuthProviderProps, Context } from './IAuth';

export const AuthContext = createContext<Context>({
  auth: {},
  setAuth: () => null,
});

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const token = localStorage.getItem('token');
  const [auth, setAuth] = useState<any>();

  useLayoutEffect(() => {
    if (!auth && token) {
      login(token, setAuth);
    }
  }, [auth, token]);

  return (
    <AuthContext.Provider value={{ auth, setAuth }}>
      {children}
    </AuthContext.Provider>
  );
};
