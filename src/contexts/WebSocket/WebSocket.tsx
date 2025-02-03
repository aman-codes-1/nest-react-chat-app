import { createContext, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../../hooks';

export const WebSocketContext = createContext<any>({});

export const WebSocketProvider = ({ children }: any) => {
  const { auth } = useAuth();
  const socket = useRef<Socket | null>(null);
  const isHiddenOrBlurredRef = useRef<boolean | null>(false);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  const updateOnlineStatus = (isOnline: boolean) => {
    if (!socket.current) return;
    if (isOnline && !socket?.current?.connected) {
      socket?.current?.connect();
    } else if (!isOnline && socket?.current?.connected) {
      socket?.current?.disconnect();
    }
  };

  const clearInactivityTimer = () => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
  };

  const startInactivityTimer = () => {
    clearInactivityTimer();
    inactivityTimerRef.current = setTimeout(() => {
      if (isHiddenOrBlurredRef?.current) {
        updateOnlineStatus(false);
      }
    }, 10000);
  };

  const resetInactivity = () => {
    clearInactivityTimer();
    updateOnlineStatus(true);
  };

  useEffect(() => {
    const serverUri = `${process.env.REACT_APP_PROXY_URI}`;
    if (!serverUri) {
      console.error('Missing REACT_APP_PROXY_URI environment variable');
      return;
    }
    socket.current = io(serverUri, {
      auth,
      transports: ['websocket'],
    });

    const handleOnline = () => updateOnlineStatus(true);
    const handleOffline = () => updateOnlineStatus(false);
    const handleInternetOnline = () => updateOnlineStatus(document.hasFocus());

    const handleBlur = () => {
      isHiddenOrBlurredRef.current = true;
      startInactivityTimer();
    };

    const handleFocus = () => {
      isHiddenOrBlurredRef.current = false;
      resetInactivity();
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        isHiddenOrBlurredRef.current = true;
        startInactivityTimer();
      } else {
        isHiddenOrBlurredRef.current = false;
        resetInactivity();
      }
    };

    handleOnline();

    const eventListeners: {
      target: Window | Document;
      event: string;
      handler: (e?: Event) => void;
    }[] = [
      { target: window, event: 'mousemove', handler: handleOnline },
      { target: window, event: 'keydown', handler: handleOnline },
      { target: window, event: 'click', handler: handleOnline },
      { target: window, event: 'scroll', handler: handleOnline },
      { target: window, event: 'focus', handler: handleFocus },
      { target: window, event: 'blur', handler: handleBlur },
      { target: window, event: 'online', handler: handleInternetOnline },
      { target: window, event: 'offline', handler: handleOffline },
      {
        target: document,
        event: 'visibilitychange',
        handler: handleVisibilityChange,
      },
    ];

    eventListeners.forEach(({ target, event, handler }) =>
      target.addEventListener(event, handler, { passive: true }),
    );

    return () => {
      eventListeners.forEach(({ target, event, handler }) =>
        target.removeEventListener(event, handler),
      );
      clearInactivityTimer();
      handleOffline();
    };
  }, [auth?.isLoggedIn]);

  return (
    <WebSocketContext.Provider value={{ socket: socket?.current }}>
      {children}
    </WebSocketContext.Provider>
  );
};
