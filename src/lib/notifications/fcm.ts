import crypto from 'crypto';
import { platformPrisma } from '@/lib/prisma-core';
import { NanoNotificationPayload } from './types';

interface ServiceAccountCredentials {
  project_id: string;
  client_email: string;
  private_key: string;
}

let cachedAccessToken: string | null = null;
let tokenExpiresAt = 0;

/**
 * Obtiene las credenciales de Firebase del entorno
 */
function getFirebaseCredentials(): {
  serviceAccount?: ServiceAccountCredentials;
  serverKey?: string;
  projectId?: string;
} {
  const serverKey = process.env.FCM_SERVER_KEY || process.env.FIREBASE_SERVER_KEY;
  const rawServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
  const projectId = process.env.FIREBASE_PROJECT_ID;

  if (rawServiceAccount) {
    try {
      const parsed = JSON.parse(rawServiceAccount);
      return {
        serviceAccount: {
          project_id: parsed.project_id || projectId || '',
          client_email: parsed.client_email || '',
          private_key: parsed.private_key || '',
        },
        projectId: parsed.project_id || projectId,
        serverKey,
      };
    } catch (e) {
      console.warn('[FCM] Error parseando FIREBASE_SERVICE_ACCOUNT JSON:', e);
    }
  }

  // Comprobar archivo firebase-service-account.json en disco
  try {
    const fs = require('fs');
    const path = require('path');
    const possiblePaths = [
      '/app/firebase-service-account.json',
      path.join(process.cwd(), 'firebase-service-account.json'),
      path.join(process.cwd(), '..', 'firebase-service-account.json'),
    ];

    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        const fileContent = fs.readFileSync(p, 'utf8');
        const parsed = JSON.parse(fileContent);
        return {
          serviceAccount: {
            project_id: parsed.project_id || projectId || '',
            client_email: parsed.client_email || '',
            private_key: parsed.private_key || '',
          },
          projectId: parsed.project_id || projectId,
          serverKey,
        };
      }
    }
  } catch {}

  return { serverKey, projectId };
}

/**
 * Genera un Access Token OAuth2 usando la Service Account (RSA-SHA256 nativo de Node.js)
 */
async function getOAuth2AccessToken(creds: ServiceAccountCredentials): Promise<string | null> {
  const now = Math.floor(Date.now() / 1000);

  if (cachedAccessToken && tokenExpiresAt > now + 60) {
    return cachedAccessToken;
  }

  try {
    const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
    const claimSet = Buffer.from(
      JSON.stringify({
        iss: creds.client_email,
        scope: 'https://www.googleapis.com/auth/firebase.messaging',
        aud: 'https://oauth2.googleapis.com/token',
        exp: now + 3600,
        iat: now,
      })
    ).toString('base64url');

    const unsignedToken = `${header}.${claimSet}`;
    const sign = crypto.createSign('RSA-SHA256');
    sign.update(unsignedToken);
    const signature = sign.sign(creds.private_key, 'base64url');
    const jwtAssertion = `${unsignedToken}.${signature}`;

    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwtAssertion,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('[FCM OAuth2] Error obteniendo access token:', errText);
      return null;
    }

    const data = await res.json();
    cachedAccessToken = data.access_token;
    tokenExpiresAt = now + (data.expires_in || 3600);
    return cachedAccessToken;
  } catch (err) {
    console.error('[FCM OAuth2] Fallo al generar token con Service Account:', err);
    return null;
  }
}

/**
 * Despacha push nativo de FCM a un token de Android / iOS
 */
export async function sendNativeFcmPush(
  fcmToken: string,
  payload: NanoNotificationPayload,
  subId?: string
): Promise<boolean> {
  const { serviceAccount, serverKey, projectId } = getFirebaseCredentials();

  // Opción A: Google FCM HTTP v1 con Service Account (Estándar oficial moderno)
  if (serviceAccount && serviceAccount.private_key && serviceAccount.client_email) {
    const accessToken = await getOAuth2AccessToken(serviceAccount);
    if (accessToken && serviceAccount.project_id) {
      try {
        const url = `https://fcm.googleapis.com/v1/projects/${serviceAccount.project_id}/messages:send`;
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            message: {
              token: fcmToken,
              notification: {
                title: payload.title,
                body: payload.body,
              },
              data: {
                url: payload.url || '/',
                tag: payload.tag || 'liberated-slot',
                title: payload.title,
                body: payload.body,
                ...(payload.data
                  ? Object.fromEntries(Object.entries(payload.data).map(([k, v]) => [k, String(v)]))
                  : {}),
              },
              android: {
                priority: 'high',
                notification: {
                  channel_id: 'liberated_slots',
                  priority: 'PRIORITY_HIGH',
                  default_sound: true,
                  default_vibrate_timings: true,
                  visibility: 'PUBLIC',
                },
              },
            },
          }),
        });

        if (res.ok) return true;

        const errData = await res.json().catch(() => ({}));
        const errorCode = errData?.error?.details?.[0]?.errorCode || errData?.error?.status;

        if (errorCode === 'UNREGISTERED' || errorCode === 'INVALID_ARGUMENT') {
          console.log('[FCM v1] Token inválido o app desinstalada, borrando de DB:', fcmToken);
          if (subId) {
            await platformPrisma.pushSubscription.delete({ where: { id: subId } }).catch(() => {});
          } else {
            await platformPrisma.pushSubscription.deleteMany({ where: { endpoint: fcmToken } }).catch(() => {});
          }
        } else {
          console.warn('[FCM v1] Error enviando push:', errData);
        }
        return false;
      } catch (e) {
        console.error('[FCM v1] Excepción en fetch:', e);
        return false;
      }
    }
  }

  // Opción B: FCM Legacy Server Key (fallback directo)
  if (serverKey) {
    try {
      const res = await fetch('https://fcm.googleapis.com/fcm/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `key=${serverKey}`,
        },
        body: JSON.stringify({
          to: fcmToken,
          priority: 'high',
          notification: {
            title: payload.title,
            body: payload.body,
            sound: 'default',
            channel_id: 'liberated_slots',
          },
          data: {
            url: payload.url || '/',
            tag: payload.tag || 'liberated-slot',
            ...(payload.data || {}),
          },
        }),
      });

      if (res.ok) return true;
      return false;
    } catch (e) {
      console.error('[FCM Legacy] Error enviando:', e);
      return false;
    }
  }

  console.log('[FCM] Omitiendo push nativo: Configurar FIREBASE_SERVICE_ACCOUNT o FCM_SERVER_KEY.');
  return false;
}
