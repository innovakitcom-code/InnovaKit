// ============================================
// AUTENTICACIÓN CON SUPABASE
// ============================================

async function registrarUsuarioSupabase(email, password, nombre, telefono = '') {
    try {
        const { data, error } = await supabaseClient.auth.signUp({
            email: email,
            password: password,
            options: { data: { nombre, telefono } }
        });

        if (error) throw error;

        if (data.user) {
            await supabaseClient.from('perfiles').insert([{
                id: data.user.id,
                nombre: nombre || email.split('@')[0],
                telefono: telefono, // <-- AGREGADO
                es_admin: false
            }]);
        }

        mostrarNotificacion('✅ Registro exitoso. Ya puedes iniciar sesión.', 'success');
        return true;
    } catch (error) {
        mostrarNotificacion(error.message, 'error');
        return false;
    }
}

async function iniciarSesionSupabase(email, password) {
    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error) throw error;

        await cargarUsuarioActualSupabase();
        mostrarNotificacion(`✅ ¡Bienvenido, ${window.usuarioActual?.nombre || email}!`, 'success');
        cerrarModalLogin(); 
        return true;
    } catch (error) {
        mostrarNotificacion('Email o contraseña incorrectos', 'error');
        return false;
    }
}

async function cerrarSesionSupabase() {
    try {
        await supabaseClient.auth.signOut();
    } catch (error) {
        console.error("Error al cerrar sesión en Supabase:", error);
    } finally {
        // Pase lo que pase, limpiamos la sesión local
        window.usuarioActual = null;
        window.carritoGlobal = [];
        
        // Actualizamos la interfaz (el botón vuelve a decir "Ingresar")
        actualizarUIUsuario();
        
        // Por las dudas, forzamos el cierre de cualquier modal de usuario que haya quedado abierto
        const modalPanel = document.getElementById('modal-user-panel');
        if (modalPanel) modalPanel.remove();
        
        // Restauramos el scroll
        document.body.style.overflow = '';
        
        mostrarNotificacion('Sesión cerrada correctamente', 'info');
    }
}

async function cargarUsuarioActualSupabase() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
        window.usuarioActual = null;
        actualizarUIUsuario();
        return null;
    }

    const { data: perfil } = await supabaseClient
        .from('perfiles')
        .select('*')
        .eq('id', user.id)
        .single();
    
    window.usuarioActual = {
        id: user.id,
        email: user.email,
        nombre: perfil?.nombre || user.email.split('@')[0],
        telefono: perfil?.telefono || '', // <-- AGREGADO
        es_admin: perfil?.es_admin || false
    };

    actualizarUIUsuario();
    return window.usuarioActual;
}

function actualizarUIUsuario() {
    const btnLogin = document.getElementById('btn-login');
    if (!btnLogin) return;

    if (window.usuarioActual) {
        btnLogin.innerHTML = `
            <span style="font-size:0.85rem;">👋 ${window.usuarioActual.nombre}</span>
        `;
        btnLogin.style.background = 'var(--paper)';
        btnLogin.style.color = 'var(--ink)';
        btnLogin.style.border = '1px solid var(--line)';
        
        btnLogin.onclick = null;
        btnLogin.addEventListener('click', (e) => {
            e.preventDefault();
            abrirPanelUsuario(); // <-- ABRE EL PANEL
        });
    } else {
        btnLogin.innerHTML = `<i class="fas fa-user"></i> <span>Ingresar</span>`;
        btnLogin.style.background = 'var(--blue)';
        btnLogin.style.color = 'var(--white)';
        btnLogin.style.border = 'none';
        
        btnLogin.onclick = null;
        btnLogin.addEventListener('click', (e) => {
            e.preventDefault();
            abrirModalLogin();
        });
    }
}

// ============================================
// MODALES
// ============================================
function abrirModalLogin() {
    document.getElementById('modal-login').classList.add('is-open');
    document.body.style.overflow = 'hidden';
}

function cerrarModalLogin(event) {
    if (event && event.target.id !== 'modal-login' && !event.target.closest('.modal__close')) return;
    document.getElementById('modal-login').classList.remove('is-open');
    document.body.style.overflow = '';
}

function abrirModalRegistro() {
    cerrarModalLogin();
    document.getElementById('modal-registro').classList.add('is-open');
    document.body.style.overflow = 'hidden';
}

function cerrarModalRegistro(event) {
    if (event && event.target.id !== 'modal-registro' && !event.target.closest('.modal__close')) return;
    document.getElementById('modal-registro').classList.remove('is-open');
    document.body.style.overflow = '';
}

// ============================================
// EVENTOS DE LOS FORMULARIOS
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    // Login Form
    document.getElementById('form-login')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const pass = document.getElementById('login-password').value;
        await iniciarSesionSupabase(email, pass);
    });

    // Registro Form
    document.getElementById('form-registro')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nombre = document.getElementById('reg-nombre').value;
        const telefono = document.getElementById('reg-telefono').value; // <-- AGREGADO
        const email = document.getElementById('reg-email').value;
        const pass = document.getElementById('reg-password').value;
        const exito = await registrarUsuarioSupabase(email, pass, nombre, telefono);
        if (exito) {
            cerrarModalRegistro();
            abrirModalLogin();
        }
    });
});
