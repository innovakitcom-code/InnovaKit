// ============================================
// CONFIGURACIÓN DE SUPABASE
// ⚠️ REEMPLAZA CON TUS DATOS ⚠️
// ============================================

const SUPABASE_URL = 'https://lvdjczfblanbadikccxo.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_O9oR1xmyeAy1ludJJlo3Rw_2gW9XZ_F';

// ✅ CAMBIA esta línea:
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Variables globales
let usuarioActual = null;
let productosGlobal = [];
let kitsGlobal = [];
let carritoGlobal = [];

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
    
    setTimeout(() => {
        notification.classList.remove('translate-x-full');
    }, 100);
    
    setTimeout(() => {
        notification.classList.add('translate-x-full');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}
