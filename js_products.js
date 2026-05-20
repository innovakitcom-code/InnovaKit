// ============================================
// GESTIÓN DE PRODUCTOS Y KITS
// ============================================

// Cargar productos desde Supabase
async function cargarProductos() {
    try {
        const { data, error } = await supabase
            .from('productos')
            .select('*')
            .eq('activo', true)
            .order('id', { ascending: false });
        
        if (error) throw error;
        
        productosGlobal = data || [];
        console.log(`✅ Cargados ${productosGlobal.length} productos`);
        return productosGlobal;
    } catch (error) {
        console.error('Error cargando productos:', error);
        mostrarNotificacion('Error cargando productos', 'error');
        return [];
    }
}

// Cargar kits desde Supabase
async function cargarKits() {
    try {
        const { data, error } = await supabase
            .from('kits')
            .select('*')
            .eq('activo', true);
        
        if (error) throw error;
        
        kitsGlobal = data || [];
        console.log(`✅ Cargados ${kitsGlobal.length} kits`);
        return kitsGlobal;
    } catch (error) {
        console.error('Error cargando kits:', error);
        return [];
    }
}

// Renderizar productos en el grid
function renderizarProductos(productos) {
    const grid = document.getElementById('productos-grid');
    if (!grid) return;
    
    if (!productos || productos.length === 0) {
        grid.innerHTML = `
            <div class="col-span-full text-center py-16">
                <i class="fas fa-microchip text-5xl text-gray-300 mb-4"></i>
                <p class="text-gray-500">No hay productos disponibles</p>
                <p class="text-sm text-gray-400 mt-1">Pronto agregaremos más productos</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = productos.map(producto => `
        <div class="product-card group" onclick="verDetalleProducto(${producto.id})">
            <div class="relative overflow-hidden bg-gray-50">
                <img src="${producto.imagen_principal || 'img/placeholder.png'}" 
                     alt="${producto.nombre}"
                     class="w-full h-48 object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                     loading="lazy">
                ${!producto.stock ? '<span class="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">Sin stock</span>' : ''}
            </div>
            <div class="p-4">
                <h3 class="font-bold text-lg mb-1 line-clamp-2 min-h-[56px]">${producto.nombre}</h3>
                ${producto.categoria ? `<p class="text-xs text-gray-500 mb-2">${producto.categoria}</p>` : ''}
                <div class="flex justify-between items-center mt-3">
                    <span class="text-green-600 font-bold text-xl">${producto.precio.toLocaleString()} Gs.</span>
                    <button onclick="event.stopPropagation(); agregarAlCarrito(${producto.id}, '${producto.nombre.replace(/'/g, "\\'")}', ${producto.precio}, '${producto.imagen_principal}')" 
                            class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition flex items-center gap-2 ${!producto.stock ? 'opacity-50 cursor-not-allowed' : ''}"
                            ${!producto.stock ? 'disabled' : ''}>
                        <i class="fas fa-cart-plus"></i>
                        <span class="hidden sm:inline">Agregar</span>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Renderizar kits
function renderizarKits(kits) {
    const grid = document.getElementById('kits-grid');
    if (!grid) return;
    
    if (!kits || kits.length === 0) {
        grid.innerHTML = `
            <div class="col-span-full text-center py-16">
                <i class="fas fa-box text-5xl text-gray-300 mb-4"></i>
                <p class="text-gray-500">No hay kits disponibles</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = kits.map(kit => `
        <div class="kit-card group cursor-pointer" onclick="verDetalleKit(${kit.id})">
            <div class="relative overflow-hidden h-48">
                <img src="${kit.imagen_portada || 'img/kit-placeholder.jpg'}" 
                     alt="${kit.nombre}"
                     class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
                <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            </div>
            <div class="p-6">
                <h3 class="font-bold text-xl mb-2">${kit.nombre}</h3>
                <p class="text-gray-600 mb-4 line-clamp-2">${kit.descripcion || 'Kit completo para aprender electrónica y robótica'}</p>
                <button class="btn-primary w-full text-center" onclick="event.stopPropagation(); verDetalleKit(${kit.id})">
                    Ver detalles
                </button>
            </div>
        </div>
    `).join('');
}

// Ver detalle de producto (modal)
async function verDetalleProducto(id) {
    const producto = productosGlobal.find(p => p.id === id);
    if (!producto) return;
    
    const especificaciones = producto.especificaciones || [];
    
    const modalHTML = `
        <div id="modal-producto-detalle" class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onclick="cerrarModalProductoDetalle(event)">
            <div class="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onclick="event.stopPropagation()">
                <div class="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
                    <h3 class="text-xl font-bold">${producto.nombre}</h3>
                    <button onclick="cerrarModalProductoDetalle()" class="text-2xl">&times;</button>
                </div>
                <div class="p-6">
                    <div class="grid md:grid-cols-2 gap-6">
                        <div>
                            <img src="${producto.imagen_principal || 'img/placeholder.png'}" 
                                 alt="${producto.nombre}"
                                 class="w-full h-auto object-contain bg-gray-50 rounded-xl">
                        </div>
                        <div>
                            <p class="text-3xl font-bold text-green-600 mb-4">${producto.precio.toLocaleString()} Gs.</p>
                            <p class="text-gray-700 mb-4">${producto.descripcion || 'Sin descripción'}</p>
                            
                            ${especificaciones.length > 0 ? `
                                <div class="mb-4">
                                    <h4 class="font-semibold text-lg mb-2">📋 Especificaciones</h4>
                                    <ul class="space-y-1">
                                        ${especificaciones.map(esp => `<li class="flex items-start gap-2"><span class="text-blue-500">•</span> ${esp}</li>`).join('')}
                                    </ul>
                                </div>
                            ` : ''}
                            
                            <div class="flex gap-3 mt-6">
                                <button onclick="agregarAlCarrito(${producto.id}, '${producto.nombre.replace(/'/g, "\\'")}', ${producto.precio}, '${producto.imagen_principal}'); cerrarModalProductoDetalle()" 
                                        class="flex-1 bg-blue-600 text-white py-3 rounded-xl font-semibold transition hover:bg-blue-700">
                                    <i class="fas fa-cart-plus mr-2"></i> Agregar
                                </button>
                                <button onclick="comprarAhora(${producto.id}, '${producto.nombre.replace(/'/g, "\\'")}', ${producto.precio})" 
                                        class="flex-1 bg-green-500 text-white py-3 rounded-xl font-semibold transition hover:bg-green-600">
                                    <i class="fab fa-whatsapp mr-2"></i> Comprar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    document.body.style.overflow = 'hidden';
}

function cerrarModalProductoDetalle(event) {
    if (event && event.target !== event.currentTarget) return;
    const modal = document.getElementById('modal-producto-detalle');
    if (modal) {
        modal.remove();
        document.body.style.overflow = '';
    }
}

// Comprar ahora (sin carrito)
function comprarAhora(id, nombre, precio) {
    const mensaje = `¡Hola! Quiero comprar:%0A- ${nombre} - ${precio.toLocaleString()} Gs.`;
    window.open(`https://wa.me/595972292392?text=${encodeURIComponent(mensaje)}`, '_blank');
}

// Ver detalle de kit
function verDetalleKit(id) {
    const kit = kitsGlobal.find(k => k.id === id);
    if (!kit) return;
    
    mostrarNotificacion(`📦 ${kit.nombre} - Próximamente más detalles`, 'info');
    window.open(`https://wa.me/595972292392?text=¡Hola! Quiero información sobre el kit: ${kit.nombre}`, '_blank');
}
