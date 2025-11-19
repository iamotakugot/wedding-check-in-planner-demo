import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, FacebookAuthProvider, OAuthProvider } from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

let app: ReturnType<typeof initializeApp> | null = null
let auth: ReturnType<typeof getAuth> | null = null

export function getFirebaseAuth() {
  if (app && auth) return auth
  if (!firebaseConfig.apiKey) return null
  app = initializeApp(firebaseConfig)
  auth = getAuth(app)
  return auth
}

export const googleProvider = new GoogleAuthProvider()
export const facebookProvider = new FacebookAuthProvider()
// LINE via OIDC (ต้องตั้งค่าใน Firebase Console → Authentication → OIDC)
export const lineProvider = new OAuthProvider('oidc.line')


