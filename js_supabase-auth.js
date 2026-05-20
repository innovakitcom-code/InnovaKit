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
    mostrarNotificacion('Sesión cerrada', 'info');
    location.reload();
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
