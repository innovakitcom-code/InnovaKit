// ============================================
// LÓGICA DE KITS (Búsqueda por marca + Modal Completo)
// ============================================

let productosKitActuales = [];

function iniciarCarrusel(elemento) {
    new Swiper(elemento, {
        loop: true,
        navigation: {
            nextEl: elemento.querySelector('.swiper-button-next'),
            prevEl: elemento.querySelector('.swiper-button-prev'),
        },
        pagination: {
            el: elemento.querySelector('.swiper-pagination'),
            clickable: true,
        }
    });
}

async function cargarDetalleKit() {
    const grid = document.getElementById('kit-products-grid');
    const tituloEl = document.getElementById('kit-titulo');
    const descEl = document.getElementById('kit-descripcion');
    const heroEl = document.querySelector('.kit-hero');
    
    if (!grid) return;

    // 1. Leemos la marca desde la URL (ej: ?marca=acebott)
    const urlParams = new URLSearchParams(window.location.search);
    let marca = urlParams.get('marca') || 'kuongshun'; // Por defecto Kuongshun
    marca = marca.toLowerCase();

    let kitId = 1; // ID de respaldo
    let busquedaNombre = marca === 'acebott' ? 'Acebott' : 'Kuongshun';

    try {
        // 2. Buscamos el kit en la tabla 'kits' por su nombre
        const { data: kitData } = await supabaseClient
            .from('kits')
            .select('*')
            .ilike('nombre', `%${busquedaNombre}%`)
            .single();

        if (kitData) {
            kitId = kitData.id; // Obtenemos el ID real de tu BD
            tituloEl.textContent = kitData.nombre;
            descEl.textContent = kitData.descripcion || 'Componentes y proyectos para armar y aprender.';
            
            // Si el kit tiene imagen de portada, la ponemos en el Hero
            if (kitData.imagen_portada && heroEl) {
                const rutaImagen = kitData.imagen_portada.replace(/\\/g, '/');
                heroEl.style.backgroundImage = `url('${rutaImagen}')`;
            }
        } else {
            // Si no encuentra el kit en la BD, usamos los datos por defecto
            kitId = marca === 'acebott' ? 2 : 1;
            tituloEl.textContent = marca === 'acebott' ? 'Línea Acebott' : 'Línea Kuongshun';
            descEl.textContent = "Componentes y proyectos para armar y aprender.";
        }

        // 3. Traemos los productos que tengan el kit_id que encontramos
        const { data: productos, error } = await supabaseClient
            .from('productos')
            .select('*')
            .eq('kit_id', kitId)
            .eq('activo', true);

        if (error) throw error;
        
        productosKitActuales = productos || [];

        if (productosKitActuales.length === 0) {
            grid.innerHTML = `<p class="text-muted" style="text-align: center; padding: 40px;">No se encontraron productos para la línea ${busquedaNombre}.</p>`;
            return;
        }

        // 4. Dibujar las tarjetas
        grid.innerHTML = productosKitActuales.map((prod, index) => {
            const precio = prod.precio ? prod.precio.toLocaleString('es-PY') : '0';
            
            // Manejo de imágenes (usa el array si existe, si no, la principal)
            let imagenes = Array.isArray(prod.imagenes) && prod.imagenes.length > 0 
                ? prod.imagenes 
                : [prod.imagen_principal || 'assets/img/placeholder.png'];
            
            let galeriaHTML = `
                <div class="swiper producto-swiper-${index}" style="width:100%; height:100%;">
                    <div class="swiper-wrapper">
                        ${imagenes.map(img => `<div class="swiper-slide"><img src="${img}" alt="${prod.nombre}"></div>`).join('')}
                    </div>
                    ${imagenes.length > 1 ? '<div class="swiper-button-next"></div><div class="swiper-button-prev"></div>' : ''}
                </div>
            `;

            return `
                <div class="kit-product-card animate-fade-in-up">
                    <div class="kit-product-card__media">
                        ${galeriaHTML}
                    </div>
                    <div class="kit-product-card__info">
                        <h3>${prod.nombre}</h3>
                        <p class="kit-product-card__desc">${prod.descripcion || 'Sin descripción.'}</p>
                        <div class="kit-product-card__price">${precio} Gs.</div>
                        
                        <a href="#" class="kit-product-card__link" onclick="event.preventDefault(); abrirModalDetalle(${index})">Ver detalles completos...</a>
                        
                        <div class="kit-product-card__actions">
                            <button class="btn btn-primary" onclick="agregarAlCarrito(${prod.id}, '${prod.nombre.replace(/'/g, "\\'")}', ${prod.precio}, '${imagenes[0]}')">
                                <i class="fas fa-cart-plus"></i> Agregar
                            </button>
                            <a href="https://wa.me/595972292392?text=Hola, quiero info de ${prod.nombre}" target="_blank" class="btn btn-whatsapp">
                                <i class="fab fa-whatsapp"></i> Consultar
                            </a>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // 5. Iniciar los carruseles
        setTimeout(() => {
            productosKitActuales.forEach((_, index) => {
                const swiperEl = document.querySelector(`.producto-swiper-${index}`);
                if (swiperEl && swiperEl.querySelectorAll('.swiper-slide').length > 1) iniciarCarrusel(swiperEl);
            });
        }, 100);

    } catch (error) {
        console.error('Error:', error);
        grid.innerHTML = '<p class="text-muted" style="text-align: center;">Error al cargar los productos.</p>';
    }
}

// ============================================
// FUNCIÓN PARA ABRIR EL MODAL DE DETALLE
// ============================================
window.abrirModalDetalle = function(index) {
    const prod = productosKitActuales[index];
    if (!prod) return;

    let imagenes = Array.isArray(prod.imagenes) && prod.imagenes.length > 0 
        ? prod.imagenes 
        : [prod.imagen_principal || 'assets/img/placeholder.png'];

    let componentesHTML = '';
    if (Array.isArray(prod.componentes_lista) && prod.componentes_lista.length > 0) {
        componentesHTML = prod.componentes_lista.map(c => `<li>${c}</li>`).join('');
    } else {
        componentesHTML = '<li>No hay lista de componentes detallada.</li>';
    }

    let especificacionesHTML = '';
    if (Array.isArray(prod.especificaciones) && prod.especificaciones.length > 0) {
        especificacionesHTML = prod.especificaciones.map(e => `<li><i class="fas fa-check-circle" style="color: #22c55e;"></i> ${e}</li>`).join('');
    }

    const modalHTML = `
        <div class="modal-detalle is-open" id="modal-detalle-overlay" onclick="cerrarModalDetalle(event)">
            <div class="modal-detalle__content" onclick="event.stopPropagation()">
                
                <div class="modal-detalle__header">
                    <h2>${prod.nombre}</h2>
                    <button onclick="cerrarModalDetalle()" style="background:none; border:none; font-size:1.5rem; cursor:pointer; color:#64748b;"><i class="fas fa-times"></i></button>
                </div>

                <div class="modal-detalle__body">
                    <div class="modal-galeria">
                        <div class="modal-galeria__main">
                            <img id="modal-main-img" src="${imagenes[0]}" alt="${prod.nombre}">
                        </div>
                        <div class="modal-galeria__thumbs">
                            ${imagenes.map((img, i) => `<img src="${img}" class="${i === 0 ? 'active' : ''}" onclick="cambiarImagenModal('${img}', this)">`).join('')}
                        </div>
                    </div>

                    <div class="modal-info">
                        <div>
                            <h4><i class="fas fa-align-left" style="color: var(--blue);"></i> Descripción completa</h4>
                            <p>${prod.descripcion || 'Sin descripción disponible.'}</p>
                        </div>

                        <div>
                            <h4><i class="fas fa-box-open" style="color: var(--green);"></i> Componentes incluidos</h4>
                            <div class="modal-componentes">
                                <ul>${componentesHTML}</ul>
                            </div>
                        </div>

                        ${especificacionesHTML ? `
                        <div>
                            <h4><i class="fas fa-microchip" style="color: var(--blue);"></i> Características técnicas</h4>
                            <div class="modal-especificaciones">
                                <ul>${especificacionesHTML}</ul>
                            </div>
                        </div>
                        ` : ''}
                    </div>
                </div>

                <div class="modal-detalle__footer">
                    <button class="btn btn-outline" onclick="cerrarModalDetalle()">Cerrar</button>
                    <button class="btn btn-primary" onclick="agregarAlCarrito(${prod.id}, '${prod.nombre.replace(/'/g, "\\'")}', ${prod.precio}, '${imagenes[0]}'); cerrarModalDetalle();"><i class="fas fa-cart-plus"></i> Agregar al carrito</button>
                    <a href="https://wa.me/595972292392" target="_blank" class="btn btn-whatsapp"><i class="fab fa-whatsapp"></i> Consultar por WhatsApp</a>
                </div>

            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    document.body.style.overflow = 'hidden';
}

window.cerrarModalDetalle = function(event) {
    if (event && event.target.id !== 'modal-detalle-overlay') return;
    const modal = document.getElementById('modal-detalle-overlay');
    if (modal) {
        modal.remove();
        document.body.style.overflow = '';
    }
}

window.cambiarImagenModal = function(src, el) {
    document.getElementById('modal-main-img').src = src;
    document.querySelectorAll('.modal-galeria__thumbs img').forEach(img => img.classList.remove('active'));
    el.classList.add('active');
}

document.addEventListener('DOMContentLoaded', cargarDetalleKit);
