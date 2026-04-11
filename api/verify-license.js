// api/verify-license.js — Vercel Serverless Function
// Proxy seguro para validación de licencias.
// La URL de Google Apps Script NUNCA llega al cliente — vive solo en variables de entorno.

const crypto = require('crypto');

// Patrón permitido para claves de licencia (alfanumérico + guiones)
const KEY_PATTERN = /^[A-Za-z0-9\-_]{4,200}$/;

module.exports = async function handler(req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'no-store');

    if (req.method !== 'POST') {
        return res.status(405).json({ valid: false, message: 'Método no permitido.' });
    }

    const { key } = req.body || {};

    if (!key || typeof key !== 'string' || !KEY_PATTERN.test(key.trim())) {
        return res.status(400).json({ valid: false, message: 'Formato de clave inválido.' });
    }

    const cleanKey = key.trim();

    const scriptUrl = process.env.GOOGLE_SCRIPT_URL;
    const licenseSecret = process.env.LICENSE_SECRET;

    if (!scriptUrl || !licenseSecret) {
        console.error('[verify-license] Variables de entorno faltantes: GOOGLE_SCRIPT_URL, LICENSE_SECRET');
        return res.status(500).json({ valid: false, message: 'Error de configuración del servidor.' });
    }

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);

        const upstream = await fetch(
            `${scriptUrl}?key=${encodeURIComponent(cleanKey)}`,
            { signal: controller.signal }
        );
        clearTimeout(timeout);

        if (!upstream.ok) {
            throw new Error(`Upstream responded with HTTP ${upstream.status}`);
        }

        const data = await upstream.json();

        if (data.valid) {
            // Crear token firmado con HMAC-SHA256
            // El cliente NO puede falsificar este token sin conocer LICENSE_SECRET
            const expiry = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 días
            const payload = `${cleanKey}:${expiry}`;
            const sig = crypto
                .createHmac('sha256', licenseSecret)
                .update(payload)
                .digest('hex');

            const tokenObj = {
                k: cleanKey.substring(0, 8), // primeros 8 chars solo para identificación
                e: expiry,
                s: sig
            };

            const token = Buffer.from(JSON.stringify(tokenObj)).toString('base64');

            return res.status(200).json({ valid: true, token });
        } else {
            return res.status(200).json({
                valid: false,
                message: data.message || 'Clave inválida o inactiva.'
            });
        }
    } catch (error) {
        if (error.name === 'AbortError') {
            console.error('[verify-license] Timeout al contactar el servidor de licencias.');
            return res.status(504).json({
                valid: false,
                message: 'El servidor de licencias no respondió. Intenta nuevamente.'
            });
        }
        console.error('[verify-license] Error:', error.message);
        return res.status(500).json({
            valid: false,
            message: 'Error de conexión con el servidor de licencias.'
        });
    }
};
