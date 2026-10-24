// ============================================
// LÓGICA DEL CARRITO (SUPABASE)
// ============================================

// Variable global para almacenar los items
window.carritoGlobal = [];

async function cargarCarritoSupabase() {
    if (!window.usuarioActual) {
        window.carritoGlobal = [];
        actualizarContadorCarrito();
        return;
    }

    try {
        const { data, error } = await supabaseClient
            .from('carrito')
            .select('*, productos(nombre, precio, imagen_principal)')
            .eq('usuario_id', window.usuarioActual.id);

        if (error) throw error;
        window.carritoGlobal = data || [];
        actualizarContadorCarrito();
    } catch (error) {
        console.error('Error cargando carrito:', error);
    }
}

async function agregarAlCarrito(productoId, nombre, precio, imagen) {
    if (!window.usuarioActual) {
        mostrarNotificacion('Inicia sesión para agregar al carrito', 'warning');
        abrirModalLogin();
        return;
    }

    try {
        // Verificar si el producto ya está en el carrito
        const itemExistente = window.carritoGlobal.find(item => item.producto_id === productoId);

        if (itemExistente) {
            // Si existe, sumamos 1 a la cantidad
            await supabaseClient.from('carrito')
                .update({ cantidad: itemExistente.cantidad + 1 })
                .eq('id', itemExistente.id);
        } else {
            // Si no existe, lo insertamos
            await supabaseClient.from('carrito').insert([{
                usuario_id: window.usuarioActual.id,
                producto_id: productoId,
                cantidad: 1
            }]);
        }

        mostrarNotificacion(`📦 ${nombre} agregado al carrito`, 'success');
        await cargarCarritoSupabase(); // Recargar para actualizar el número
    } catch (error) {
        console.error('Error al agregar:', error);
        mostrarNotificacion('Error al agregar al carrito', 'error');
    }
}

async function eliminarDelCarrito(itemId) {
    try {
        await supabaseClient.from('carrito').delete().eq('id', itemId);
        await cargarCarritoSupabase();
        renderizarCarritoModal(); // Actualizar la vista del modal
    } catch (error) {
        mostrarNotificacion('Error al eliminar', 'error');
    }
}

async function vaciarCarrito() {
    if (!window.usuarioActual || window.carritoGlobal.length === 0) return;
    if (confirm('¿Estás seguro de vaciar el carrito?')) {
        await supabaseClient.from('carrito').delete().eq('usuario_id', window.usuarioActual.id);
        await cargarCarritoSupabase();
        cerrarModalCarrito();
        mostrarNotificacion('Carrito vaciado', 'info');
    }
}

function actualizarContadorCarrito() {
    // Sumar todas las cantidades
    const totalItems = window.carritoGlobal.reduce((sum, item) => sum + item.cantidad, 0);
    const contador = document.getElementById('carrito-count-desktop');
    if (contador) contador.textContent = totalItems;
}

// ============================================
// MODAL DEL CARRITO (Vista)
// ============================================
function abrirModalCarrito() {
    renderizarCarritoModal();
    document.getElementById('modal-carrito').classList.add('is-open');
    document.body.style.overflow = 'hidden';
}

function cerrarModalCarrito(event) {
    if (event && event.target.id !== 'modal-carrito' && !event.target.closest('.modal__close')) return;
    document.getElementById('modal-carrito').classList.remove('is-open');
    document.body.style.overflow = '';
}

function renderizarCarritoModal() {
    const lista = document.getElementById('carrito-lista');
    const totalEl = document.getElementById('carrito-total');
    if (!lista) return;

    if (!window.usuarioActual) {
        lista.innerHTML = '<p class="text-center text-muted" style="padding: 20px;">Inicia sesión para ver tu carrito.</p>';
        totalEl.textContent = 'Gs. 0';
        return;
    }

    if (window.carritoGlobal.length === 0) {
        lista.innerHTML = '<p class="text-center text-muted" style="padding: 20px;">Tu carrito está vacío.</p>';
        totalEl.textContent = 'Gs. 0';
        return;
    }

    let total = 0;
    
    lista.innerHTML = window.carritoGlobal.map(item => {
        const precio = item.productos.precio;
        const subtotal = precio * item.cantidad;
        total += subtotal;

        return `
            <div style="display: flex; align-items: center; gap: 12px; padding: 12px 0; border-bottom: 1px solid var(--line);">
                <img src="${item.productos.imagen_principal || 'assets/img/placeholder.png'}" alt="${item.productos.nombre}" style="width: 50px; height: 50px; object-fit: contain; background: #f8fafc; border-radius: 8px;">
                <div style="flex: 1;">
                    <p style="font-weight: 600; font-size: 0.9rem; color: var(--ink);">${item.productos.nombre}</p>
                    <p style="color: var(--green); font-size: 0.85rem; font-weight: 700;">Gs. ${precio.toLocaleString('es-PY')} x ${item.cantidad}</p>
                </div>
                <button onclick="eliminarDelCarrito(${item.id})" style="background: #fee2e2; color: #ef4444; border: none; width: 30px; height: 30px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center;">
                    <i class="fas fa-trash-alt" style="font-size: 0.8rem;"></i>
                </button>
            </div>
        `;
    }).join('');

    totalEl.textContent = `Gs. ${total.toLocaleString('es-PY')}`;
}

// ============================================
// ENVIAR PEDIDO POR WHATSAPP
// ============================================
async function enviarPedidoWhatsApp() {
    if (!window.usuarioActual || window.carritoGlobal.length === 0) return;

    const total = window.carritoGlobal.reduce((sum, item) => sum + (item.productos.precio * item.cantidad), 0);
    
    let mensaje = "¡Hola! Quiero realizar el siguiente pedido:\n\n";
    window.carritoGlobal.forEach((item, index) => {
        mensaje += `${index + 1}. ${item.productos.nombre} - ${item.cantidad} und. (Gs. ${(item.productos.precio * item.cantidad).toLocaleString('es-PY')})\n`;
    });
    mensaje += `\n*TOTAL: Gs. ${total.toLocaleString('es-PY')}*\n\n`;
    mensaje += `👤 Cliente: ${window.usuarioActual.nombre}\n`;
    
    try {
        // Registrar el pedido en la base de datos antes de enviar a WhatsApp
        const { data, error } = await supabaseClient.from('pedidos').insert([{
            usuario_id: window.usuarioActual.id,
            productos: window.carritoGlobal.map(i => ({ id: i.producto_id, nombre: i.productos.nombre, precio: i.productos.precio, cantidad: i.cantidad })),
            total: total,
            estado: 'pendiente'
        }]).select();

        if (error) throw error;
        const pedidoId = data[0].id;
        
        mensaje += `📋 N° de Pedido: #${pedidoId}\n`;
        
        // Abrir WhatsApp
        window.open(`https://wa.me/595972292392?text=${encodeURIComponent(mensaje)}`, '_blank');
        
        // Vaciar el carrito
        await supabaseClient.from('carrito').delete().eq('usuario_id', window.usuarioActual.id);
        await cargarCarritoSupabase();
        cerrarModalCarrito();
        
        mostrarNotificacion(`✅ Pedido #${pedidoId} registrado`, 'success');

    } catch (error) {
        console.error('Error al procesar pedido:', error);
        mostrarNotificacion('Error al procesar el pedido', 'error');
    }
}