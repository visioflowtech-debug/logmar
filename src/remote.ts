/**
 * remote.ts — Lógica del control remoto (remote.html)
 *
 * Se conecta a la pantalla principal via PeerJS usando el ID de 4 caracteres.
 * Envía comandos como objetos { action, value? } via DataChannel.
 *
 * sendCommand se expone en window para que los onclick del HTML funcionen.
 */

import Peer, { type DataConnection } from 'peerjs';

let peer: Peer | null = null;
let conn: DataConnection | null = null;

const connectBtn      = document.getElementById('connect-btn')!;
const hostIdInput     = document.getElementById('host-id-input') as HTMLInputElement;
const statusText      = document.getElementById('connection-status')!;
const loginScreen     = document.getElementById('login-screen')!;
const remoteInterface = document.getElementById('remote-interface')!;
const statusDot       = document.getElementById('status-dot')!;

function initPeer(): void {
  peer = new Peer({ debug: 2 });
  peer.on('error', (err) => {
    console.error(err);
    statusText.textContent = `Error: ${(err as Error & { type?: string }).type ?? err}`;
  });
}

function connectToHost(hostId: string): void {
  if (!peer) return;
  if (conn) conn.close();

  const fullHostId = `logmar-app-${hostId}`;
  conn = peer.connect(fullHostId);

  conn.on('open', () => {
    statusText.textContent = '¡Conectado!';
    loginScreen.style.display = 'none';
    remoteInterface.style.display = 'flex';
    statusDot.classList.add('connected');
  });

  conn.on('close', () => {
    statusText.textContent = 'Desconectado.';
    loginScreen.style.display = 'flex';
    remoteInterface.style.display = 'none';
    statusDot.classList.remove('connected');
    alert('Se perdió la conexión con la pantalla.');
  });

  conn.on('error', (err) => {
    console.error('Connection Error:', err);
    statusText.textContent = 'No se pudo conectar. Verifica el ID.';
  });
}

function sendCommand(action: string, value: string | null = null): void {
  if (conn?.open) {
    conn.send({ action, value });
    if (navigator.vibrate) navigator.vibrate(50);
  } else {
    console.warn('Not connected');
  }
}

// Exponer sendCommand en window para los onclick inline del HTML
declare global {
  interface Window { sendCommand: (action: string, value?: string | null) => void; }
}
window.sendCommand = sendCommand;

// Event listeners
connectBtn.addEventListener('click', () => {
  const hostId = hostIdInput.value.toUpperCase().trim();
  if (hostId.length !== 4) {
    statusText.textContent = 'El ID debe tener 4 caracteres.';
    return;
  }
  statusText.textContent = 'Conectando...';
  connectToHost(hostId);
});

document.getElementById('reconnect-btn')?.addEventListener('click', () => {
  window.location.reload();
});

// Inicializar PeerJS
initPeer();
