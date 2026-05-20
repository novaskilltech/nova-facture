import { cookies } from "next/headers"
import { redirect } from "next/navigation"

const SESSION_COOKIE = "nova-facture-session"
const DEFAULT_SECRET = "super-secret-nova-facture-key-2026-secure-default"

function getSecretKey(): string {
  return process.env.JWT_SECRET || DEFAULT_SECRET
}

// Encodeur de texte pour l'utilisation Web Crypto API
const encoder = new TextEncoder()

/**
 * Signe une charge utile avec HMAC-SHA256
 */
async function signSession(userId: string, expiresAt: number): Promise<string> {
  const secret = getSecretKey()
  const payload = `${userId}.${expiresAt}`
  
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  )
  
  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(payload)
  )
  
  const signatureArray = Array.from(new Uint8Array(signatureBuffer))
  const signatureBase64 = btoa(String.fromCharCode(...signatureArray))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")
    
  return `${payload}.${signatureBase64}`
}

/**
 * Vérifie un jeton de session signé
 * Retourne le userId si valide, sinon null
 */
async function verifySession(token: string): Promise<string | null> {
  const parts = token.split(".")
  if (parts.length !== 3) return null
  
  const [userId, expiresAtStr, signature] = parts
  const expiresAt = parseInt(expiresAtStr, 10)
  
  // Vérification de l'expiration
  if (isNaN(expiresAt) || Date.now() > expiresAt) {
    return null
  }
  
  const secret = getSecretKey()
  const payload = `${userId}.${expiresAt}`
  
  try {
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    )
    
    const sigBuf = new Uint8Array(
      atob(signature.replace(/-/g, "+").replace(/_/g, "/"))
        .split("")
        .map((c) => c.charCodeAt(0))
    )
    
    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      sigBuf,
      encoder.encode(payload)
    )
    
    return isValid ? userId : null
  } catch {
    return null
  }
}

export async function getSession(): Promise<string | null> {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get(SESSION_COOKIE)
  if (!sessionToken?.value) return null
  
  return await verifySession(sessionToken.value)
}

export async function setSession(userId: string) {
  const cookieStore = await cookies()
  const sevenDaysMs = 1000 * 60 * 60 * 24 * 7
  const expiresAt = Date.now() + sevenDaysMs
  
  const token = await signSession(userId, expiresAt)
  
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  })
}

export async function clearSession() {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  })
}

export async function requireAuth() {
  const session = await getSession()
  if (!session) {
    redirect("/login")
  }
  return session
}

