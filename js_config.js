// ============================================
// CONFIGURACIÓN DE SUPABASE (ofuscada básicamente)
// ============================================

// URL ofuscada (base64 simple)
const _SUPABASE_URL = 'aHR0cHM6Ly9sdmRqY3pmYmxhbmJhZGlrY2N4by5zdXBhYmFzZS5jby8=';
const _SUPABASE_ANON_KEY = 'c2JfcHVibGlzaGFibGVfTzlvUjF4bXllQXkxbHVkSkpsbzNSd18yZ1c5WFpfRg==';

// Decodificar
const SUPABASE_URL = atob(_SUPABASE_URL);
const SUPABASE_ANON_KEY = atob(_SUPABASE_ANON_KEY);

// Crear cliente
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Variables globales
let usuarioActual = null;
let productosGlobal = [];

// ============================================
// NOTIFICACIONES
// ============================================

function mostrarNotificacion(mensaje, tipo = 'success') {
    const notification = document.createElement('div');
    notification.className = `fixed top-20 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-white font-medium transition-all duration-300 transform translate-x-full ${
        tipo === 'success' ? 'bg-green-500' : 
        tipo === 'error' ? 'bg-red-500' : 
        tipo === 'info' ? 'bg-blue-500' : 'bg-yellow-500'
    }`;
    notification.innerHTML = `
        <div class="flex items-center gap-2">
            <i class="fas ${tipo === 'success' ? 'fa-check-circle' : tipo === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
            <span>${mensaje}</span>
        </div>
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => notification.classList.remove('translate-x-full'), 100);
    setTimeout(() => {
        notification.classList.add('translate-x-full');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}
