// =============================================
// CONFIGURACIÓN SEGURA - INNOVAKIT
// ⚠️ NO SUBIR A GITHUB - SOLO PARA TU COMPUTADORA
// =============================================

const CONFIG_SEGURO_INNOVAKIT = {
    // Google Sheets para pedidos
    GOOGLE_SHEETS: {
        URL: 'https://script.google.com/macros/s/AKfycbw4Nl4e58j2BrmsjrMG-85VjuvOB77nVg0LhLuw6XYCV2cDOXvO3M_eYGijr_7A1Zpv/exec',
        ORIGEN: 'innovakit-web-paraguay',
        VERSION: '2.0'
    },
    
    // WhatsApp
    WHATSAPP: {
        NUMERO: '595972292392',
        MENSAJE_DEFAULT: '¡Hola! Quiero información sobre Innovakit',
        TIEMPO_RESPUESTA: '24 horas'
    },
    
    // Sistema de Admin
    ADMIN: {
        PASSWORD_PRINCIPAL: 'qwertyuiop',  // ⚠️ CAMBIA ESTO
        CODIGO_4_DIGITOS: '6058',                 // ⚠️ CAMBIA ESTO
        TOKEN_URL: 'adminpy',    // ⚠️ CAMBIA ESTO
        INTENTOS_MAXIMOS: 3
    }
};

// =============================================
// ⚠️ IMPORTANTE: CAMBIA ESTOS VALORES:
// 1. PASSWORD_PRINCIPAL → Pon una contraseña NUEVA
// 2. CODIGO_4_DIGITOS → Pon 4 dígitos diferentes
// 3. TOKEN_URL → Pon una palabra secreta
// =============================================

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.CONFIG_SEGURO = CONFIG_SEGURO_INNOVAKIT;
    console.log('✅ Configuración segura cargada (local)');

}
