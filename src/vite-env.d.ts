/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Backend base URL, e.g. http://localhost:3000/api */
  readonly VITE_API_URL?: string;
  /** Google OAuth client id; without it the Google button is hidden */
  readonly VITE_GOOGLE_CLIENT_ID?: string;
  /** VAPID public key for push notifications (same pair as the backend) */
  readonly VITE_VAPID_PUBLIC_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
