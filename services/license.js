import { API_CONFIG } from '../config.js';

export async function verifyGumroadLicense(licenseKey) {
    if (!licenseKey) return { valid: false, message: "No key provided" };

    // Dev bypass (Handled at UI level mostly, but good to have here too)
    if (API_CONFIG.developerMode) return { valid: true, message: "Dev Mode Active" };

    // Legacy local bypass
    if (licenseKey.startsWith('TEST')) return { valid: true, message: "Test Key" };

    const endpoint = API_CONFIG.licenseServerUrl;

    if (!endpoint) {
        // Fallback for user before deployment
        if (licenseKey.startsWith('LUMINA-PRO')) return { valid: true, message: "Local Key (Server Not Configured)" };
        return { valid: false, message: "Server URL missing in config" };
    }

    try {
        // Google Apps Script usually requires 'no-cors' or handling redirects, 
        // but 'text/plain' or 'application/json' POST usually works if the script handles OPTIONS/CORS.
        // Web App must be deployed as "Anyone, even anonymous".

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // 'text/plain' avoids CORS preflight on simple requests to GAS
            body: JSON.stringify({ licenseKey: licenseKey.trim() })
        });

        const data = await response.json();

        if (data.valid) {
            return { valid: true, message: "Active" };
        } else {
            return { valid: false, message: data.message || "Invalid Key" };
        }
    } catch (error) {
        console.error("License Check Error:", error);
        return { valid: false, message: "Connection Error. Try again." };
    }
}
