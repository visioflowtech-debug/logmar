/**
 * license.ts — Sistema de licencias de LogMAR Pro
 *
 * Flujo de activación:
 *   1. Usuario ingresa clave → POST /api/verify-license
 *   2. Servidor valida con Google Apps Script y devuelve token firmado
 *   3. Token (base64 JSON {k, e, s}) se guarda en localStorage
 *   4. En cada carga: si el token es válido y no expiró → app desbloqueada
 *
 * Seguridad: la URL de Google Apps Script NUNCA llega al cliente.
 * El proxy serverless (api/verify-license.js) la lee de variables de entorno.
 */

import type { LicenseToken } from './types';

const API_URL = '/api/verify-license';
const STORAGE_KEY = 'logmar_license_token';

function isActivated(): boolean {
  const tokenStr = localStorage.getItem(STORAGE_KEY);
  if (!tokenStr) return false;
  try {
    const token = JSON.parse(atob(tokenStr)) as LicenseToken;
    return (
      token !== null &&
      typeof token.e === 'number' &&
      typeof token.s === 'string' &&
      token.e > Date.now()
    );
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return false;
  }
}

function lockApp(): void {
  const overlay = document.getElementById('license-overlay');
  if (overlay) {
    overlay.classList.remove('hidden');
    overlay.style.display = 'flex';
  }
  document.body.style.overflow = 'hidden';
}

function unlockApp(): void {
  const overlay = document.getElementById('license-overlay');
  if (overlay) {
    overlay.classList.add('hidden');
    setTimeout(() => {
      overlay.style.display = 'none';
    }, 500);
  }
  document.body.style.overflow = '';
  window.dispatchEvent(new CustomEvent('app-unlocked'));
}

function showMessage(text: string, type: 'info' | 'success' | 'error'): void {
  const el = document.getElementById('license-message');
  if (el) {
    el.textContent = text;
    el.className = `license-message ${type}`;
  }
}

async function handleVerification(): Promise<void> {
  const input = document.getElementById('license-key') as HTMLInputElement | null;
  const key = input?.value.trim() ?? '';

  if (!key) {
    showMessage('Por favor ingresa una clave.', 'error');
    return;
  }

  showMessage('Verificando...', 'info');

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key }),
    });

    const data = (await response.json()) as { valid?: boolean; token?: string; message?: string };

    if (data.valid && data.token) {
      localStorage.setItem(STORAGE_KEY, data.token);
      localStorage.removeItem('logmar_license_active'); // Eliminar flag legacy
      showMessage('¡Licencia activada correctamente!', 'success');
      setTimeout(() => unlockApp(), 1000);
    } else {
      showMessage(data.message ?? 'Clave inválida o inactiva.', 'error');
    }
  } catch (error) {
    console.error('[LicenseManager] Error de verificación:', error);
    showMessage('Error de conexión. Verifica tu internet.', 'error');
  }
}

function deactivate(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem('logmar_license_active');
  location.reload();
}

function init(): void {
  if (isActivated()) {
    unlockApp();
  } else {
    lockApp();
  }

  const verifyBtn = document.getElementById('verify-license-btn');
  verifyBtn?.addEventListener('click', () => void handleVerification());

  const licenseInput = document.getElementById('license-key');
  licenseInput?.addEventListener('keypress', (e: KeyboardEvent) => {
    if (e.key === 'Enter') void handleVerification();
  });
}

export const LicenseManager = { init, isActivated, deactivate };
