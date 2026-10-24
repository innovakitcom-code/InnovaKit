// ============================================
// CONFIGURACIÓN DE SUPABASE Y GLOBALES
// ============================================

// Usamos las claves que ya tenías (encriptadas en base64)
const _SUPABASE_URL = 'aHR0cHM6Ly9sdmRqY3pmYmxhbmJhZGlrY2N4by5zdXBhYmFzZS5jby8=';
const _SUPABASE_ANON_KEY = 'c2JfcHVibGlzaGFibGVfTzlvUjF4bXllQXkxbHVkSkpsbzNSd18yZ1c5WFpfRg==';

const SUPABASE_URL = atob(_SUPABASE_URL);
const SUPABASE_ANON_KEY = atob(_SUPABASE_ANON_KEY);

// Inicializamos el cliente global
window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Variables globales que usaremos en toda la web
window.usuarioActual = null;
window.carritoGlobal = [];

// ============================================
// SISTEMA DE NOTIFICACIONES (Toasts)
// ============================================
window.mostrarNotificacion = function(mensaje, tipo = 'success') {
    // Creamos el contenedor si no existe
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    // Creamos la notificación
    const toast = document.createElement('div');
    toast.className = `toast toast--${tipo}`;
    
    let icono = 'fa-check-circle';
    if (tipo === 'error') icono = 'fa-exclamation-circle';
    if (tipo === 'warning') icono = 'fa-exclamation-triangle';

    toast.innerHTML = `
        <i class="fas ${icono} toast__icon"></i>
        <span class="toast__message">${mensaje}</span>
    `;

    container.appendChild(toast);

    // Animación de salida y eliminación
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
};
