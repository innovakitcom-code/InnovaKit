// ============================================
// CARRITO CON SUPABASE
// Para integrar con tu carrito existente
// ============================================

// Sincronizar carrito local con Supabase
async function sincronizarCarritoConSupabase() {
    if (!usuarioActual || !supabase) return;
    
    // Si hay items en el carrito local (de invitado), migrarlos
    if (window.carrito && window.carrito.length > 0) {
        for (const item of window.carrito) {
            await supabase.from('carrito').insert([{
                usuario_id: usuarioActual.id,
                producto_id: item.id || 1,
                cantidad: 1
            }]);
        }
        window.carrito = [];
        if (typeof actualizarContador === 'function') actualizarContador();
    }
    
    // Cargar carrito de Supabase
    const { data } = await supabase.from('carrito').select('*').eq('usuario_id', usuarioActual.id);
    if (data && data.length > 0 && window.carrito) {
        window.carrito = data.map(item => ({ nombre: 'Producto', precio: '0' }));
        if (typeof actualizarContador === 'function') actualizarContador();
    }
}
