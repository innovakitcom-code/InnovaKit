// ============================================
// SISTEMA DE AUTENTICACIÓN
// ============================================

// Registrar nuevo usuario
async function registrarUsuario(email, password, nombre, telefono) {
    try {
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: { nombre: nombre || email.split('@')[0], telefono: telefono || null }
            }
        });
        
        if (error) throw error;
        
        if (data.user) {
            // Crear perfil en la tabla perfiles
            const { error: perfilError } = await supabase
                .from('perfiles')
                .insert([{
                    id: data.user.id,
                    nombre: nombre || email.split('@')[0],
                    telefono: telefono || null,
                    es_admin: false
                }]);
            
            if (perfilError) console.error('Error creando perfil:', perfilError);
        }
        
        mostrarNotificacion('✅ Registro exitoso. Ya puedes iniciar sesión.', 'success');
        return true;
    } catch (error) {
        mostrarNotificacion(error.message, 'error');
        return false;
    }
}

// Iniciar sesión
async function iniciarSesion(email, password) {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) throw error;
        
        await cargarUsuarioActual();
        mostrarNotificacion(`✅ ¡Bienvenido, ${usuarioActual?.nombre || email}!`, 'success');
        return true;
    } catch (error) {
        mostrarNotificacion('Email o contraseña incorrectos', 'error');
        return false;
    }
}

// Cerrar sesión
async function cerrarSesion() {
    await supabase.auth.signOut();
    usuarioActual = null;
    actualizarUIUsuario();
    if (typeof cargarCarrito === 'function') await cargarCarrito();
    mostrarNotificacion('Sesión cerrada', 'info');
}

// Cargar usuario actual
async function cargarUsuarioActual() {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
        usuarioActual = null;
        actualizarUIUsuario();
        return null;
    }
    
    // Obtener perfil adicional
    const { data: perfil } = await supabase
        .from('perfiles')
        .select('*')
        .eq('id', user.id)
        .single();
    
    usuarioActual = {
        id: user.id,
        email: user.email,
        nombre: perfil?.nombre || user.email.split('@')[0],
        telefono: perfil?.telefono,
        es_admin: perfil?.es_admin || false
    };
    
    actualizarUIUsuario();
    return usuarioActual;
}

// Actualizar UI según usuario
function actualizarUIUsuario() {
    const userNameSpan = document.getElementById('user-name');
    const authButtons = document.getElementById('auth-buttons');
    const adminBtn = document.getElementById('admin-btn');
    
    if (!userNameSpan) return;
    
    if (usuarioActual) {
        userNameSpan.textContent = usuarioActual.nombre;
        
        if (authButtons) {
            authButtons.innerHTML = `
                <button onclick="cerrarSesion()" class="text-red-400 hover:text-red-300 text-sm">
                    <i class="fas fa-sign-out-alt"></i> Salir
                </button>
            `;
        }
        
        if (adminBtn && usuarioActual.es_admin) {
            adminBtn.classList.remove('hidden');
        } else if (adminBtn) {
            adminBtn.classList.add('hidden');
        }
    } else {
        userNameSpan.textContent = 'Invitado';
        
        if (authButtons) {
            authButtons.innerHTML = `
                <button onclick="mostrarModalLogin()" class="hover:text-blue-300">Ingresar</button>
                <span class="text-gray-500">|</span>
                <button onclick="mostrarModalRegistro()" class="hover:text-blue-300">Registrarse</button>
            `;
        }
        
        if (adminBtn) adminBtn.classList.add('hidden');
    }
}

// ============================================
// MODALES
// ============================================

function mostrarModalLogin() {
    const modal = document.getElementById('modal-login');
    if (modal) modal.classList.add('active');
}

function mostrarModalRegistro() {
    const modal = document.getElementById('modal-registro');
    if (modal) modal.classList.add('active');
}

function cerrarModalLogin() {
    const modal = document.getElementById('modal-login');
    if (modal) modal.classList.remove('active');
    document.getElementById('form-login')?.reset();
}

function cerrarModalRegistro() {
    const modal = document.getElementById('modal-registro');
    if (modal) modal.classList.remove('active');
    document.getElementById('form-registro')?.reset();
}

// ============================================
// EVENT LISTENERS
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // Formulario de login
    const formLogin = document.getElementById('form-login');
    if (formLogin) {
        formLogin.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            
            if (await iniciarSesion(email, password)) {
                cerrarModalLogin();
                if (typeof cargarCarrito === 'function') await cargarCarrito();
            }
        });
    }
    
    // Formulario de registro
    const formRegistro = document.getElementById('form-registro');
    if (formRegistro) {
        formRegistro.addEventListener('submit', async (e) => {
            e.preventDefault();
            const nombre = document.getElementById('reg-nombre').value;
            const telefono = document.getElementById('reg-telefono').value;
            const email = document.getElementById('reg-email').value;
            const password = document.getElementById('reg-password').value;
            
            if (await registrarUsuario(email, password, nombre, telefono)) {
                cerrarModalRegistro();
                mostrarModalLogin();
            }
        });
    }
});