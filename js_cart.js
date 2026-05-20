// ============================================
// SISTEMA DE CARRITO
// ============================================

// Cargar carrito del usuario
async function cargarCarrito() {
    if (!usuarioActual) {
        // Invitado: cargar desde localStorage
        const local = localStorage.getItem('cart_invitado');
        carritoGlobal = local ? JSON.parse(local) : [];
        actualizarUICarrito();
        return;
    }
    
    // Usuario logueado: cargar desde Supabase
    const { data, error } = await supabase
        .from('carrito')
        .select('*, productos(nombre, precio, imagen_principal)')
        .eq('usuario_id', usuarioActual.id);
    
    if (error) {
        console.error('Error cargando carrito:', error);
        return;
    }
    
    carritoGlobal = data.map(item => ({
        id: item.id,
        producto_id: item.producto_id,
        nombre: item.productos.nombre,
        precio: item.productos.precio,
        cantidad: item.cantidad || 1,
        imagen: item.productos.imagen_principal
    }));
    
    actualizarUICarrito();
}

// Agregar al carrito
async function agregarAlCarrito(productoId, nombre, precio, imagen) {
    if (!usuarioActual) {
        // Modo invitado
        carritoGlobal.push({ 
            producto_id: productoId, 
            nombre: nombre, 
            precio: precio, 
            cantidad: 1, 
            imagen: imagen || 'img/placeholder.png' 
        });
        localStorage.setItem('cart_invitado', JSON.stringify(carritoGlobal));
        mostrarNotificacion(`📦 ${nombre} agregado`, 'success');
        actualizarUICarrito();
        return;
    }
    
    // Usuario logueado
    // Verificar si ya existe
    const existe = carritoGlobal.find(item => item.producto_id === productoId);
    
    if (existe) {
        // Actualizar cantidad
        const { error } = await supabase
            .from('carrito')
            .update({ cantidad: (existe.cantidad || 1) + 1 })
            .eq('id', existe.id);
        
        if (error) {
            mostrarNotificacion('Error al agregar', 'error');
            return;
        }
    } else {
        // Insertar nuevo
        const { error } = await supabase
            .from('carrito')
            .insert([{ 
                usuario_id: usuarioActual.id, 
                producto_id: productoId, 
                cantidad: 1 
            }]);
        
        if (error) {
            mostrarNotificacion('Error al agregar', 'error');
            return;
        }
    }
    
    mostrarNotificacion(`📦 ${nombre} agregado`, 'success');
    await cargarCarrito();
}

// Eliminar del carrito
async function eliminarDelCarrito(itemId) {
    if (!usuarioActual) {
        carritoGlobal = carritoGlobal.filter((_, i) => i !== itemId);
        localStorage.setItem('cart_invitado', JSON.stringify(carritoGlobal));
    } else {
        await supabase.from('carrito').delete().eq('id', itemId);
        await cargarCarrito();
    }
    actualizarUICarrito();
    mostrarNotificacion('Producto eliminado', 'info');
}

// Vaciar carrito
async function vaciarCarrito() {
    if (!usuarioActual) {
        carritoGlobal = [];
        localStorage.setItem('cart_invitado', '[]');
    } else {
        await supabase.from('carrito').delete().eq('usuario_id', usuarioActual.id);
        await cargarCarrito();
    }
    actualizarUICarrito();
    mostrarNotificacion('Carrito vaciado', 'info');
}

// Actualizar UI del carrito
function actualizarUICarrito() {
    const count = carritoGlobal.reduce((sum, item) => sum + (item.cantidad || 1), 0);
    const total = carritoGlobal.reduce((sum, item) => sum + (parseInt(item.precio) * (item.cantidad || 1)), 0);
    
    // Actualizar contador en header
    const cartCount = document.getElementById('cart-count');
    if (cartCount) cartCount.textContent = count;
    
    // Actualizar modal del carrito
    const container = document.getElementById('carrito-items');
    const totalSpan = document.getElementById('carrito-total');
    
    if (container) {
        if (carritoGlobal.length === 0) {
            container.innerHTML = `
                <div class="text-center py-12 text-gray-500">
                    <i class="fas fa-shopping-cart text-5xl mb-3 text-gray-300"></i>
                    <p>Tu carrito está vacío</p>
                    <p class="text-sm mt-1">¡Agrega algunos productos!</p>
                </div>
            `;
        } else {
            container.innerHTML = carritoGlobal.map((item, idx) => `
                <div class="flex items-center gap-4 py-4 border-b">
                    <img src="${item.imagen || 'img/placeholder.png'}" 
                         alt="${item.nombre}"
                         class="w-16 h-16 object-contain bg-gray-50 rounded-lg">
                    <div class="flex-1">
                        <p class="font-semibold text-gray-800">${item.nombre}</p>
                        <p class="text-green-600 font-bold">${parseInt(item.precio).toLocaleString()} Gs.</p>
                        <div class="flex items-center gap-2 mt-1">
                            <span class="text-sm text-gray-500">Cantidad: ${item.cantidad || 1}</span>
                        </div>
                    </div>
                    <button onclick="eliminarDelCarrito(${usuarioActual ? item.id : idx})" 
                            class="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            `).join('');
        }
    }
    
    if (totalSpan) {
        totalSpan.innerHTML = `${total.toLocaleString()} <span class="text-sm font-normal">Gs.</span>`;
    }
}

// Mostrar/cerrar carrito
function verCarrito() {
    actualizarUICarrito();
    const modal = document.getElementById('modal-carrito');
    if (modal) modal.classList.add('active');
}

function cerrarCarrito() {
    const modal = document.getElementById('modal-carrito');
    if (modal) modal.classList.remove('active');
}

// Enviar pedido por WhatsApp
async function enviarPedidoWhatsApp() {
    if (carritoGlobal.length === 0) {
        mostrarNotificacion('Tu carrito está vacío', 'error');
        return;
    }
    
    const total = carritoGlobal.reduce((sum, item) => sum + (parseInt(item.precio) * (item.cantidad || 1)), 0);
    
    // Construir mensaje para WhatsApp
    let mensaje = '🛍️ *NUEVO PEDIDO INNOVAKIT*\n\n';
    mensaje += '*Productos:*\n';
    carritoGlobal.forEach((item, i) => {
        mensaje += `${i + 1}. ${item.nombre} - ${parseInt(item.precio).toLocaleString()} Gs. x ${item.cantidad || 1}\n`;
    });
    mensaje += `\n📦 *Total: ${total.toLocaleString()} Gs.*`;
    mensaje += `\n\n🚚 Envíos a todo Paraguay`;
    mensaje += `\n📞 Contacto: 0972 292 392`;
    
    // Guardar pedido en Supabase (solo si está logueado)
    if (usuarioActual) {
        await supabase
            .from('pedidos')
            .insert([{
                usuario_id: usuarioActual.id,
                productos: carritoGlobal,
                total: total,
                estado: 'pendiente'
            }]);
    }
    
    // Abrir WhatsApp
    const url = `https://wa.me/595972292392?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
    
    // Vaciar carrito después de enviar
    await vaciarCarrito();
    cerrarCarrito();
    mostrarNotificacion('Pedido enviado. Te contactaremos pronto.', 'success');
}

// Agregar modal de carrito si no existe
function agregarModalCarrito() {
    if (!document.getElementById('modal-carrito')) {
        document.body.insertAdjacentHTML('beforeend', `
            <div id="modal-carrito" class="modal">
                <div class="modal-container max-w-lg">
                    <div class="p-6">
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="text-2xl font-bold flex items-center gap-2">
                                <i class="fas fa-shopping-cart text-blue-600"></i>
                                Mi Carrito
                            </h3>
                            <button onclick="cerrarCarrito()" class="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
                        </div>
                        
                        <div id="carrito-items" class="max-h-96 overflow-y-auto">
                            <!-- Los items se cargan aquí -->
                        </div>
                        
                        <div class="border-t pt-4 mt-4">
                            <div class="flex justify-between items-center mb-4">
                                <span class="text-lg font-semibold">Total:</span>
                                <span id="carrito-total" class="text-2xl font-bold text-green-600">0 Gs.</span>
                            </div>
                            <div class="flex gap-3">
                                <button onclick="vaciarCarrito()" class="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-semibold transition flex items-center justify-center gap-2">
                                    <i class="fas fa-trash-alt"></i> Vaciar
                                </button>
                                <button onclick="enviarPedidoWhatsApp()" class="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-semibold transition flex items-center justify-center gap-2">
                                    <i class="fab fa-whatsapp"></i> Comprar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `);
    }
}

// Inicializar modal de carrito
document.addEventListener('DOMContentLoaded', agregarModalCarrito);