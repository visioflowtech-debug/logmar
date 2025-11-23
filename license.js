// license.js

const LicenseManager = {
    // URL de tu Google Apps Script (Reemplazar después de desplegar)
    API_URL: 'https://script.google.com/macros/s/AKfycbwzm6qi5TbR9j5FE8xxkiQxoqIYLsJhViRDDop1f2rqAUgSs107qZ800HXmTtIuRCVh/exec',
    TEST_KEY: 'IT-WORKS-PERFECTLY', // Clave para pruebas

    init() {
        if (this.isActivated()) {
            this.unlockApp();
        } else {
            this.lockApp();
        }

        // Configurar el botón de verificar
        const verifyBtn = document.getElementById('verify-license-btn');
        if (verifyBtn) {
            verifyBtn.addEventListener('click', () => this.handleVerification());
        }

        // Configurar input para verificar al presionar Enter
        const licenseInput = document.getElementById('license-key');
        if (licenseInput) {
            licenseInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.handleVerification();
            });
        }
    },

    isActivated() {
        return localStorage.getItem('logmar_license_active') === 'true';
    },

    lockApp() {
        const overlay = document.getElementById('license-overlay');
        if (overlay) {
            overlay.classList.remove('hidden');
            overlay.style.display = 'flex'; // Asegurar que se muestre
        }
        document.body.style.overflow = 'hidden'; // Evitar scroll
    },

    unlockApp() {
        const overlay = document.getElementById('license-overlay');
        if (overlay) {
            overlay.classList.add('hidden');
            setTimeout(() => {
                overlay.style.display = 'none';
            }, 500); // Esperar a la transición CSS
        }
        document.body.style.overflow = '';

        // Disparar evento para que main.js sepa que puede iniciar si estaba esperando
        window.dispatchEvent(new CustomEvent('app-unlocked'));
    },

    async handleVerification() {
        const input = document.getElementById('license-key');
        const key = input.value.trim();

        if (!key) {
            this.showMessage('Por favor ingresa una clave.', 'error');
            return;
        }

        this.showMessage('Verificando...', 'info');

        // 1. Verificar clave de prueba
        if (key === this.TEST_KEY) {
            setTimeout(() => {
                this.activateSuccess();
            }, 1000);
            return;
        }

        // 2. Verificar con Google Sheets
        try {
            // Google Apps Script requiere GET o POST con redirecciones. 
            // Usamos GET para simplicidad en este caso.
            const url = `${this.API_URL}?key=${encodeURIComponent(key)}`;

            const response = await fetch(url);
            const data = await response.json();

            if (data.valid) {
                this.activateSuccess();
            } else {
                this.showMessage(data.message || 'Clave inválida o inactiva.', 'error');
            }
        } catch (error) {
            console.error('Error de verificación:', error);
            this.showMessage('Error de conexión. Verifica tu internet.', 'error');
        }
    },

    activateSuccess() {
        localStorage.setItem('logmar_license_active', 'true');
        this.showMessage('¡Licencia activada correctamente!', 'success');
        setTimeout(() => {
            this.unlockApp();
        }, 1000);
    },

    showMessage(text, type) {
        const el = document.getElementById('license-message');
        if (el) {
            el.textContent = text;
            el.className = `license-message ${type}`;
        }
    },

    deactivate() {
        localStorage.removeItem('logmar_license_active');
        location.reload();
    }
};

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    LicenseManager.init();
});
