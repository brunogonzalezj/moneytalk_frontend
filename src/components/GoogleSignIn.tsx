import React, { useEffect, useRef } from 'react';
import { useAuthStore } from '../stores/authStore';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

interface GoogleSignInProps {
  mode?: 'signin' | 'signup';
  className?: string;
  onSuccess?: () => void;
}

declare global {
  interface Window {
    google: any;
  }
}

const GoogleSignIn: React.FC<GoogleSignInProps> = ({
  mode = 'signin',
  className = '',
  onSuccess
}) => {
  const loginWithGoogle = useAuthStore((state) => state.loginWithGoogle);
  const googleButtonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    // Cargar Google Sign-In script
    const loadGoogleScript = () => {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initializeGoogleSignIn;
      document.head.appendChild(script);

      return () => {
        document.head.removeChild(script);
      };
    };

    const initializeGoogleSignIn = () => {
      if (window.google && window.google.accounts && googleButtonRef.current) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID!,
          callback: handleGoogleResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        // Renderizar el botón de Google
        window.google.accounts.id.renderButton(googleButtonRef.current, {
          theme: 'filled_black',
          size: 'large',
          text: mode === 'signin' ? 'signin_with' : 'signup_with',
          shape: 'rectangular',
          logo_alignment: 'left',
          width: '100%',
        });
      }
    };

    const handleGoogleResponse = async (response: any) => {
      try {
        // response.credential contiene el ID token de Google
        await loginWithGoogle(response.credential);
        // Llamar a onSuccess después de login exitoso
        if (onSuccess) {
          onSuccess();
        }
      } catch {
        // The store already showed the error
      }
    };

    // Verificar si el script ya está cargado
    if (window.google && window.google.accounts) {
      initializeGoogleSignIn();
    } else {
      loadGoogleScript();
    }
  }, [loginWithGoogle, mode, onSuccess]);

  // Without a client id the button cannot work, so it is not shown
  if (!GOOGLE_CLIENT_ID) return null;

  return (
    <div className={`w-full ${className}`}>
      <div
        ref={googleButtonRef}
        className="w-full flex justify-center"
        style={{ minHeight: '40px' }}
      />
      <div className="relative mt-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400">
            O {mode === 'signin' ? 'inicia sesión' : 'regístrate'} con Google
          </span>
        </div>
      </div>
    </div>
  );
};

export default GoogleSignIn;