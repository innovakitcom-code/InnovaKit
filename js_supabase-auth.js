// ============================================
// AUTENTICACIÓN CON SUPABASE
// ============================================

async function registrarUsuarioSupabase(email, password, nombre, telefono) {
    if (!supabaseClient) {
        console.error('❌ supabaseClient no está definido');
        mostrarNotificacion('Error de conexión', 'error');
        return false;
    }
    
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
                telefono: telefono || null,
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
    if (!supabaseClient) {
        console.error('❌ supabaseClient no está definido');
        mostrarNotificacion('Error de conexión', 'error');
        return false;
    }
    
    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({ 
            email: email, 
            password: password 
        });
        if (error) throw error;
        
        await cargarUsuarioActualSupabase();
        actualizarUIUsuario();  // ← ACTUALIZAR UI DESPUÉS DEL LOGIN
        mostrarNotificacion(`✅ ¡Bienvenido, ${usuarioActual?.nombre || email}!`, 'success');
        return true;
    } catch (error) {
        mostrarNotificacion('Email o contraseña incorrectos', 'error');
        return false;
    }
}

async function cerrarSesionSupabase() {
    if (!supabaseClient) return;
    await supabaseClient.auth.signOut();
    usuarioActual = null;
    actualizarUIUsuario();  // ← ACTUALIZAR UI DESPUÉS DE CERRAR SESIÓN
    mostrarNotificacion('Sesión cerrada', 'info');
    // No recargar la página, solo actualizar UI
}

async function cargarUsuarioActualSupabase() {
    if (!supabaseClient) return null;
    
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return null;
    
    const { data: perfil } = await supabaseClient
        .from('perfiles')
        .select('*')
        .eq('id', user.id)
        .single();
    
    usuarioActual = {
        id: user.id,
        email: user.email,
        nombre: perfil?.nombre || user.email.split('@')[0],
        es_admin: perfil?.es_admin || false
    };
    
    return usuarioActual;
}

function actualizarUIUsuario() {
    console.log('🔄 Actualizando UI de usuario:', usuarioActual);
    
    const userDesktop = document.getElementById('user-desktop');
    if (!userDesktop) {
        console.warn('⚠️ user-desktop no encontrado');
        return;
    }
    
    if (usuarioActual) {
        userDesktop.innerHTML = `
            <div class="flex items-center gap-2 ml-4">
                <span class="text-sm font-semibold text-gray-700">👋 ${usuarioActual.nombre}</span>
                <button onclick="cerrarSesionSupabase()" class="text-red-600 text-sm hover:text-red-700">CERRAR</button>
            </div>
        `;
    } else {
        userDesktop.innerHTML = `
            <button onclick="mostrarModalLogin()" class="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-semibold btn-hover">
                <i class="fas fa-user"></i> Ingresar
            </button>
        `;
    }
    
    // También actualizar móvil
    const mobileContainer = document.querySelector('.sm\\:hidden .flex.justify-between');
    if (mobileContainer) {
        const existingBtn = mobileContainer.querySelector('button.bg-blue-600');
        if (usuarioActual) {
            if (existingBtn) {
                existingBtn.outerHTML = `<button onclick="cerrarSesionSupabase()" class="bg-red-600 text-white px-2 py-1 rounded-lg text-sm font-semibold ml-2">Salir</button>`;
            }
        } else {
            if (existingBtn && existingBtn.textContent.includes('Salir')) {
                existingBtn.outerHTML = `<button onclick="mostrarModalLogin()" class="bg-blue-600 text-white px-2 py-1 rounded-lg text-sm font-semibold ml-2"><i class="fas fa-user"></i></button>`;
            }
        }
    }
}

// Inicializar UI cuando carga la página
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🔐 Inicializando autenticación...');
    await cargarUsuarioActualSupabase();
    actualizarUIUsuario();
});
