// ============================================
// GESTIÓN DE PRODUCTOS
// ============================================

async function cargarProductosDestacados() {
    const grid = document.getElementById('featured-products');
    if (!grid) return; // Si no estamos en el index, no hace nada

    try {
        // Traemos los primeros 4 productos activos de la base de datos
        const { data, error } = await supabaseClient
            .from('productos')
            .select('*')
            .eq('activo', true)
            .limit(4);

        if (error) throw error;

        if (!data || data.length === 0) {
            grid.innerHTML = '<p class="text-muted">No hay productos destacados por ahora.</p>';
            return;
        }

        // Dibujamos las tarjetas
        grid.innerHTML = data.map(producto => {
            const precioFormateado = producto.precio ? producto.precio.toLocaleString('es-PY') : '0';
            const imagen = producto.imagen_principal || 'assets/img/placeholder.png';
            const enStock = producto.stock === true;

            return `
                <div class="product-card animate-fade-in-up">
                    <div class="product-card__image-wrapper">
                        ${!enStock ? '<div class="product-card__badge">Sin stock</div>' : ''}
                        <img src="${imagen}" alt="${producto.nombre}" class="product-card__image" loading="lazy">
                    </div>
                    <div class="product-card__content">
                        <h3 class="product-card__title">${producto.nombre}</h3>
                        <span class="product-card__category">${producto.categoria || 'General'}</span>
                        <div class="product-card__price">Gs. ${precioFormateado}</div>
                        <button class="btn btn-primary btn-block" onclick="verDetalleProducto(${producto.id})">
                            Ver detalles
                        </button>
                    </div>
                </div>
            `;
        }).join('');

    } catch (error) {
        console.error('Error cargando productos:', error);
        grid.innerHTML = '<p class="text-muted">Error al cargar los productos. Intenta más tarde.</p>';
    }
}

// Función temporal para el botón "Ver detalles" (luego haremos el modal)
window.verDetalleProducto = function(id) {
    mostrarNotificacion('El modal de detalle estará listo pronto 🚧', 'warning');
};