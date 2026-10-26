// ============================================
// GESTIÓN DE PRODUCTOS
// ============================================

async function cargarProductosDestacados() {
    const grid = document.getElementById('featured-products');
    if (!grid) return;

    try {
        const { data, error } = await supabaseClient
            .from('productos')
            .select('*')
            .eq('activo', true)
            .limit(20);

        if (error) throw error;

        if (!data || data.length === 0) {
            grid.innerHTML = '<p class="text-muted">No hay productos destacados por ahora.</p>';
            return;
        }
        
        let productosMezclados = data.sort(() => Math.random() - 0.5);
        let productosAMostrar = productosMezclados.slice(0, 4);

        grid.innerHTML = productosAMostrar.map(producto => {
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
    // En lugar de abrir el modal (que requiere que los productos estén cargados en memoria),
    // redirigimos al catálogo con el ID del producto, y el catálogo se encarga de abrir el modal.
    window.location.href = `catalogo.html?producto=${id}`;
};

// ============================================
// LÓGICA DE REVIEWS EN EL HOME (Filtros y Azar)
// ============================================

let todasLasReviews = [];

async function cargarReviews() {
    const container = document.getElementById('reviews-home-container');
    if (!container) return;

    try {
        const { data, error } = await supabaseClient
            .from('reviews')
            .select('*')
            .eq('aprobada', true)
            .order('created_at', { ascending: false });

        if (error) throw error;

        todasLasReviews = (data || []).sort(() => Math.random() - 0.5);
        filtrarReviews('componentes');

    } catch (error) {
        console.error('Error cargando reviews:', error);
        container.innerHTML = '<p style="text-align: center; grid-column: 1/-1; color: #64748b;">No se pudieron cargar las opiniones.</p>';
    }
}

// --- FILTRO DE REVIEWS Y ESTILOS DE BOTONES ---
window.filtrarReviews = function(categoria) {
    const container = document.getElementById('reviews-home-container');
    const btnComponentes = document.getElementById('btn-rev-componentes');
    const btn3d = document.getElementById('btn-rev-3d');
    
    btnComponentes.className = 'btn';
    btnComponentes.style.background = '#e2e8f0';
    btnComponentes.style.color = '#475569';
    
    btn3d.className = 'btn';
    btn3d.style.background = '#e2e8f0';
    btn3d.style.color = '#475569';

    if (categoria === 'componentes') {
        btnComponentes.className = 'btn btn-primary';
        btnComponentes.style.background = '';
        btnComponentes.style.color = '';
    } else {
        btn3d.className = 'btn btn-primary';
        btn3d.style.background = '';
        btn3d.style.color = '';
    }

    let filtradas = todasLasReviews.filter(r => {
        if (categoria === 'componentes') {
            return r.tipo === 'producto' || r.tipo === 'kit' || !r.tipo || r.tipo === 'componente';
        } else {
            return r.tipo === '3d';
        }
    });

    let aMostrar = filtradas.slice(0, 3);

    if (aMostrar.length === 0) {
        container.innerHTML = '<p style="text-align: center; grid-column: 1/-1; color: #64748b; padding: 20px;">Aún no hay opiniones en esta categoría.</p>';
        return;
    }

    container.innerHTML = aMostrar.map(r => {
        let estrellas = '';
        for(let i=1; i<=5; i++) {
            estrellas += `<i class="fas fa-star" style="color: ${i <= r.rating ? '#eab308' : '#e2e8f0'};"></i>`;
        }

         return `
            <div class="review-card-home animate-fade-in-up" style="background: #fff; padding: 24px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; display: flex; flex-direction: column;">
                <div style="margin-bottom: 12px;">${estrellas}</div>
                <p style="color: #475569; font-size: 0.95rem; line-height: 1.6; margin-bottom: 20px; font-style: italic; flex: 1;">
                    "${r.comentario || 'Sin comentario'}"
                </p>
                
                <!-- MOSTRAR LA FOTO SI EXISTE -->
                ${r.foto ? `<img src="${r.foto}" alt="Foto de la reseña" style="width: 100%; max-height: 150px; object-fit: cover; border-radius: 8px; margin-bottom: 16px; border: 1px solid #e2e8f0;">` : ''}
                
                <div style="display: flex; align-items: center; gap: 12px; border-top: 1px solid #f1f5f9; padding-top: 16px;">
                    <div style="width: 36px; height: 36px; background: #f1f5f9; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #64748b;">
                        <i class="fas fa-user"></i>
                    </div>
                    <div>
                        <p style="font-weight: 600; font-size: 0.9rem; color: #1e293b; margin: 0;">Cliente Innovakit</p>
                        <p style="font-size: 0.8rem; color: #94a3b8; margin: 0;">${new Date(r.created_at).toLocaleDateString('es-PY')}</p>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// ============================================
// MODAL PARA DEJAR UNA NUEVA OPINIÓN
// ============================================
window.abrirModalNuevaReview = function() {
    if (!window.usuarioActual) {
        mostrarNotificacion('Inicia sesión para dejar tu opinión', 'warning');
        abrirModalLogin();
        return;
    }

    const modalHTML = `
        <div class="modal-overlay is-open" id="modal-review-overlay" onclick="cerrarModalReview(event)">
            <div class="modal" style="max-width: 500px;" onclick="event.stopPropagation()">
                
                <div class="modal__header">
                    <h3 class="modal__title">Dejar mi opinión</h3>
                    <button class="modal__close" onclick="cerrarModalReview()"><i class="fas fa-times"></i></button>
                </div>

                <div class="modal__body">
                    <form id="form-nueva-review">
                        <div class="form-group">
                            <label class="form-label">¿Qué estás opinando?</label>
                            <select id="review-tipo" class="form-input" required>
                                <option value="producto">Un componente o kit</option>
                                <option value="3d">Un diseño de impresión 3D</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Calificación</label>
                            <select id="review-rating" class="form-input" required>
                                <option value="5">⭐⭐⭐⭐⭐ (Excelente)</option>
                                <option value="4">⭐⭐⭐⭐ (Muy bueno)</option>
                                <option value="3">⭐⭐⭐ (Bueno)</option>
                                <option value="2">⭐⭐ (Regular)</option>
                                <option value="1">⭐ (Malo)</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Tu comentario</label>
                            <textarea id="review-comentario" class="form-input" rows="4" required placeholder="Contanos tu experiencia..."></textarea>
                        </div>

                        <!-- NUEVO CAMPO DE FOTO -->
                        <div class="form-group">
                            <label class="form-label">Foto de tu proyecto (Opcional)</label>
                            <input type="file" id="review-foto" class="form-input" accept="image/*" style="padding: 10px; background: #f8fafc;">
                        </div>

                        <button type="submit" class="btn btn-primary" style="width: 100%; padding: 14px; margin-top: 8px;">Enviar Opinión</button>
                    </form>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    document.body.style.overflow = 'hidden';

    document.getElementById('form-nueva-review').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('button[type="submit"]');
        const textoOriginal = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
        btn.disabled = true;

        let urlFoto = null;
        const fileInput = document.getElementById('review-foto');

        // 1. Si el usuario subió una foto, la guardamos en Supabase Storage
        if (fileInput.files.length > 0) {
            const file = fileInput.files[0];
            const nombreArchivo = `review-${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
            
            const { data: uploadData, error: uploadError } = await supabaseClient.storage
                .from('imagenes') // Usamos el mismo bucket que creamos para los productos
                .upload(nombreArchivo, file);

            if (uploadError) {
                mostrarNotificacion('Error al subir la imagen', 'error');
                btn.innerHTML = textoOriginal;
                btn.disabled = false;
                return;
            }

            // Obtenemos la URL pública de la imagen
            const { data: urlData } = supabaseClient.storage
                .from('imagenes')
                .getPublicUrl(nombreArchivo);
            
            urlFoto = urlData.publicUrl;
        }

        // 2. Guardamos la review en la base de datos (con o sin foto)
        const { error } = await supabaseClient.from('reviews').insert([{
            usuario_id: window.usuarioActual.id,
            tipo: document.getElementById('review-tipo').value,
            rating: parseInt(document.getElementById('review-rating').value),
            comentario: document.getElementById('review-comentario').value,
            foto: urlFoto, // Acá guardamos la URL de la foto
            aprobada: false 
        }]);

        if (error) {
            console.error(error);
            mostrarNotificacion('Error al enviar la opinión', 'error');
            btn.innerHTML = textoOriginal;
            btn.disabled = false;
        } else {
            mostrarNotificacion('¡Gracias! Tu opinión fue enviada y será revisada.', 'success');
            cerrarModalReview();
        }
    });
}

window.cerrarModalReview = function(event) {
    if (event && event.target.id !== 'modal-review-overlay') return;
    const modal = document.getElementById('modal-review-overlay');
    if (modal) {
        modal.remove();
        document.body.style.overflow = '';
    }
}

// Ejecutar al cargar el Home
document.addEventListener('DOMContentLoaded', cargarReviews);
