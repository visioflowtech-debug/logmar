// remote.js

let peer = null;
let conn = null;

const connectBtn = document.getElementById('connect-btn');
const hostIdInput = document.getElementById('host-id-input');
const statusText = document.getElementById('connection-status');
const loginScreen = document.getElementById('login-screen');
const remoteInterface = document.getElementById('remote-interface');
const connectedHostLabel = document.getElementById('connected-host');
const statusDot = document.getElementById('status-dot');

// Initialize PeerJS
function initPeer() {
    peer = new Peer(null, {
        debug: 2
    });

    peer.on('open', (id) => {

    });

    peer.on('error', (err) => {
        console.error(err);
        statusText.textContent = "Error: " + err.type;
    });
}

connectBtn.addEventListener('click', () => {
    const hostId = hostIdInput.value.toUpperCase().trim();
    if (hostId.length !== 4) {
        statusText.textContent = "El ID debe tener 4 caracteres.";
        return;
    }

    statusText.textContent = "Conectando...";
    connectToHost(hostId);
});

const reconnectBtn = document.getElementById('reconnect-btn');
if (reconnectBtn) {
    reconnectBtn.addEventListener('click', () => {
        // Simple reload to reset state and reconnect flow
        window.location.reload();
    });
}

function connectToHost(hostId) {
    // The actual PeerJS ID is prefixed to avoid collisions globally
    // We use a prefix like "logmar-app-" + hostId
    const fullHostId = "logmar-app-" + hostId;

    if (conn) {
        conn.close();
    }

    conn = peer.connect(fullHostId);

    conn.on('open', () => {

        statusText.textContent = "¡Conectado!";

        // Switch UI
        loginScreen.style.display = 'none';
        remoteInterface.style.display = 'flex';
        connectedHostLabel.textContent = hostId;
        statusDot.classList.add('connected');
    });

    conn.on('close', () => {
        statusText.textContent = "Desconectado.";
        loginScreen.style.display = 'flex';
        remoteInterface.style.display = 'none';
        statusDot.classList.remove('connected');
        alert("Se perdió la conexión con la pantalla.");
    });

    conn.on('error', (err) => {
        console.error("Connection Error:", err);
        statusText.textContent = "No se pudo conectar. Verifica el ID.";
    });
}

function sendCommand(action, value = null) {
    if (conn && conn.open) {
        conn.send({
            action: action,
            value: value
        });

        // Haptic feedback if available
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
    } else {
        console.warn("Not connected");
    }
}

// Start PeerJS
initPeer();
