// ============================================
// PANEL DE USUARIO (Perfil y Pedidos)
// ============================================

window.abrirPanelUsuario = async function() {
    if (!window.usuarioActual) return;

    const { data: pedidos, error } = await supabaseClient
        .from('pedidos')
        .select('*')
        .eq('usuario_id', window.usuarioActual.id)
        .order('created_at', { ascending: false });

    let pedidosHTML = '<p class="text-muted" style="text-align: center;">Aún no tienes pedidos realizados.</p>';
    
    if (pedidos && pedidos.length > 0) {
        pedidosHTML = pedidos.map(p => {
            let estadoColor = p.estado === 'completado' ? '#16a34a' : (p.estado === 'cancelado' ? '#dc2626' : '#d97706');
            let estadoBg = p.estado === 'completado' ? '#dcfce7' : (p.estado === 'cancelado' ? '#fee2e2' : '#fef3c7');
            
            return `
                <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 12px; background: #fff;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <span style="font-weight: 600; color: #1e293b;">Pedido #${p.id}</span>
                        <span style="background: ${estadoBg}; color: ${estadoColor}; padding: 4px 10px; border-radius: 99px; font-size: 0.8rem; font-weight: 600;">${p.estado.toUpperCase()}</span>
                    </div>
                    <p style="font-size: 0.85rem; color: #64748b; margin-bottom: 4px;">Fecha: ${new Date(p.created_at).toLocaleDateString('es-PY')}</p>
                    <p style="font-weight: 700; color: #7eb74a;">Total: Gs. ${p.total.toLocaleString('es-PY')}</p>
                </div>
            `;
        }).join('');
    }

    const modalHTML = `
        <div class="modal-overlay is-open" id="modal-user-panel" onclick="cerrarPanelUsuario(event)">
            <div class="modal" style="max-width: 600px;" onclick="event.stopPropagation()">
                <div class="modal__header">
                    <h3 class="modal__title">Mi Perfil</h3>
                    <button class="modal__close" onclick="cerrarPanelUsuario()"><i class="fas fa-times"></i></button>
                </div>
                <div class="modal__body">
                    <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin-bottom: 24px; border: 1px solid #e2e8f0;">
                        <p style="margin-bottom: 8px;"><i class="fas fa-user" style="color: #64748b; width: 20px;"></i> <strong>${window.usuarioActual.nombre}</strong></p>
                        <p style="margin-bottom: 0;"><i class="fas fa-envelope" style="color: #64748b; width: 20px;"></i> ${window.usuarioActual.email}</p>
                    </div>

                    <h4 style="font-size: 1.1rem; margin-bottom: 16px; color: #1e293b;"><i class="fas fa-shopping-bag" style="color: #3b82f6;"></i> Mis Pedidos</h4>
                    <div style="max-height: 300px; overflow-y: auto; padding-right: 8px;">
                        ${pedidosHTML}
                    </div>
                </div>
                <div class="modal__footer">
                    <button class="btn btn-outline" style="border-color: #ef4444; color: #ef4444; width: 100%;" onclick="cerrarSesionDesdePanel()">
                        <i class="fas fa-sign-out-alt"></i> Cerrar Sesión
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    document.body.style.overflow = 'hidden';
}

window.cerrarPanelUsuario = function(event) {
    if (event && event.target.id !== 'modal-user-panel') return;
    const modal = document.getElementById('modal-user-panel');
    if (modal) {
        modal.remove();
        document.body.style.overflow = '';
    }
}
// ============================================
// FUNCIÓN PARA CERRAR SESIÓN DESDE EL PANEL
// ============================================
window.cerrarSesionDesdePanel = async function() {
    // 1. Cerramos la ventana modal inmediatamente
    const modal = document.getElementById('modal-user-panel');
    if (modal) {
        modal.remove();
        document.body.style.overflow = '';
    }

    // 2. Cerramos la sesión en Supabase (y limpiamos la UI)
    await cerrarSesionSupabase(); 
};
