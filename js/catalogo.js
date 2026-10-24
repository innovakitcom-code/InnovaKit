// ============================================
// CATÁLOGO CON PAGINACIÓN Y FILTROS + MODAL
// ============================================

let todosLosProductos = [];
let productosFiltrados = [];
let paginaActual = 1;
const productosPorPagina = 8;

// --- 1. FUNCIÓN DEL MODAL ---
window.abrirModalDetalleProducto = function(id) {
    const prod = todosLosProductos.find(p => p.id === id);
    if (!prod) return;

    let imagenes = Array.isArray(prod.imagenes) && prod.imagenes.length > 0 
        ? prod.imagenes 
        : [prod.imagen_principal || 'assets/img/placeholder.png'];

    let imagenPrincipal = imagenes[0];
    
    let miniaturasHTML = '';
    if (imagenes.length > 1) {
        miniaturasHTML = `
            <div style="display: flex; gap: 8px; margin-top: 16px; overflow-x: auto; padding-bottom: 8px;">
                ${imagenes.map((img, i) => `
                    <img src="${img}" 
                         onclick="document.getElementById('modal-main-img').src='${img}'; document.querySelectorAll('.modal-thumb').forEach(t => t.style.borderColor='transparent'); this.style.borderColor='var(--blue)';" 
                         class="modal-thumb"
                         style="width: 60px; height: 60px; object-fit: contain; border: 2px solid ${i === 0 ? 'var(--blue)' : 'transparent'}; border-radius: 8px; cursor: pointer; background: #fff; padding: 4px; box-sizing: border-box; transition: border 0.2s;">
                `).join('')}
            </div>
        `;
    }

    let especificacionesHTML = '';
    if (Array.isArray(prod.especificaciones) && prod.especificaciones.length > 0) {
        especificacionesHTML = prod.especificaciones.map(e => `<li style="margin-bottom: 8px;"><i class="fas fa-check-circle" style="color: #22c55e; margin-right: 8px;"></i> ${e}</li>`).join('');
    } else {
        especificacionesHTML = '<li>No hay especificaciones técnicas cargadas.</li>';
    }

    // 4. Documentos (Manuales) - MOVIDO ACÁ
    let documentosHTML = '';
    if (Array.isArray(prod.documentos) && prod.documentos.length > 0) {
        documentosHTML = `
            <div style="margin-top: 16px;">
                <h4 style="font-size: 0.95rem; color: #1e293b; margin-bottom: 8px;"><i class="fas fa-file-pdf" style="color: #ef4444;"></i> Manuales y Documentos</h4>
                <div style="display: flex; flex-direction: column; gap: 8px;">
                    ${prod.documentos.map(doc => `
                        <a href="${doc.archivo}" target="_blank" style="display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; color: #3b82f6; text-decoration: none; font-size: 0.9rem; font-weight: 500;">
                            <i class="fas fa-download"></i> ${doc.nombre}
                        </a>
                    `).join('')}
                </div>
            </div>
        `;
    }

    const modalHTML = `
        <div class="modal-detalle is-open" id="modal-detalle-overlay" onclick="cerrarModalDetalle(event)">
            <div class="modal-detalle__content" onclick="event.stopPropagation()" style="max-width: 900px; padding: 0; background: #fff; border-radius: 16px; overflow: hidden; display: flex; flex-direction: column;">
                
                <div style="padding: 16px 24px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: flex-end; align-items: center;">
                    <button onclick="cerrarModalDetalle()" style="background:none; border:none; font-size:1.5rem; cursor:pointer; color:#64748b;"><i class="fas fa-times"></i></button>
                </div>

                <div style="padding: 24px; display: grid; grid-template-columns: 1fr 1fr; gap: 32px; overflow-y: auto; max-height: 70vh;">
                    
                    <div>
                        <div style="display: flex; align-items: center; justify-content: center; background: #f8fafc; border-radius: 12px; padding: 20px; height: 300px;">
                            <img id="modal-main-img" src="${imagenPrincipal}" alt="${prod.nombre}" style="max-width: 100%; max-height: 100%; object-fit: contain;">
                        </div>
                        ${miniaturasHTML}
                    </div>

                    <div>
                        <h2 style="font-size: 1.6rem; font-weight: 800; color: #1e293b; margin-bottom: 16px; line-height: 1.2;">${prod.nombre}</h2>
                        
                        <div style="font-size: 2rem; font-weight: 800; color: var(--green); margin-bottom: 16px;">
                            ${prod.precio.toLocaleString('es-PY')} Gs.
                            ${prod.stock ? '<span style="font-size: 0.8rem; background: #dcfce7; color: #166534; padding: 4px 10px; border-radius: 99px; margin-left: 10px; vertical-align: middle;">En stock</span>' : ''}
                        </div>
                        
                        <p style="margin-bottom: 24px; color: #475569; line-height: 1.6;">
                            ${prod.descripcion || 'Sin descripción disponible.'}
                        </p>

                        ${especificacionesHTML ? `
                        <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px;">
                            <ul style="list-style: none; padding: 0; margin: 0; font-size: 0.9rem; color: #1e3a8a;">
                                ${especificacionesHTML}
                            </ul>
                        </div>
                        ` : ''}

                        ${documentosHTML} <!-- ACÁ SE MUESTRAN LOS MANUALES -->
                    </div>
                </div>

                <div style="padding: 24px; background: #f8fafc; display: flex; gap: 12px; border-top: 1px solid #e2e8f0;">
                    <button class="btn btn-whatsapp" onclick="window.open('https://wa.me/595972292392?text=Hola, quiero info de ${prod.nombre}', '_blank')" style="flex: 1; padding: 14px;"><i class="fab fa-whatsapp"></i> Comprar por WhatsApp</button>
                    <button class="btn btn-primary" onclick="agregarAlCarrito(${prod.id}, '${prod.nombre.replace(/'/g, "\\'")}', ${prod.precio}, '${imagenPrincipal}'); cerrarModalDetalle();" style="flex: 1; padding: 14px;"><i class="fas fa-shopping-cart"></i> Agregar al carrito</button>
                    <button class="btn btn-outline" onclick="cerrarModalDetalle()" style="flex: 1; padding: 14px;">Seguir viendo productos</button>
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

// --- 2. LÓGICA DEL CATÁLOGO ---
async function inicializarCatalogo() {
    const grid = document.getElementById('catalogo-grid');
    if (!grid) return;

    try {
        const { data, error } = await supabaseClient
            .from('productos')
            .select('*')
            .eq('activo', true)
            .is('kit_id', null)
        //    .order('id'); //

        if (error) throw error;

        let productosMezclados = data || [];
        productosMezclados.sort(() => Math.random() - 0.5);

        todosLosProductos = data || [];
        productosFiltrados = [...todosLosProductos];

        // Leer parámetros de la URL
        const urlParams = new URLSearchParams(window.location.search);
        const q = urlParams.get('q');
        const cat = urlParams.get('cat');

        // Si hay búsqueda, llenar el input y mostrar el banner
        if (q) {
            const searchInput = document.getElementById('search-input');
            if (searchInput) {
                searchInput.value = q;
            }
            const banner = document.getElementById('resultado-busqueda');
            if (banner) {
                banner.style.display = 'block';
                document.getElementById('texto-busqueda').textContent = q;
            }
        }

        // Si hay categoría, activar el botón del dropdown
        if (cat) {
            const catItem = document.querySelector(`.dropdown-item[data-cat="${cat}"]`);
            if (catItem) {
                document.querySelectorAll('.dropdown-item').forEach(i => i.classList.remove('active'));
                catItem.classList.add('active');
                const btnDropdown = document.getElementById('btn-dropdown-cat');
                if(btnDropdown) btnDropdown.innerHTML = catItem.innerHTML + ' <i class="fas fa-chevron-down" style="font-size: 0.8rem; margin-left: 4px;"></i>';
            }
        }

        // Si hay filtros desde la URL, aplicarlos
        if (q || cat) {
            aplicarFiltros();
        } else {
            renderizarPagina();
        }
        
        configurarEventos();

    } catch (error) {
        console.error('Error:', error);
        grid.innerHTML = '<p class="text-muted" style="grid-column: 1/-1; text-align: center;">Error al cargar productos.</p>';
    }
}

function renderizarPagina() {
    const grid = document.getElementById('catalogo-grid');
    const pagContainer = document.getElementById('pagination-container');
    
    if (productosFiltrados.length === 0) {
        grid.innerHTML = '<p class="text-muted" style="grid-column: 1/-1; text-align: center; padding: 40px;">No se encontraron productos.</p>';
        pagContainer.style.display = 'none';
        return;
    }

    pagContainer.style.display = 'flex';

    const inicio = (paginaActual - 1) * productosPorPagina;
    const fin = inicio + productosPorPagina;
    const productosPagina = productosFiltrados.slice(inicio, fin);
    const totalPaginas = Math.ceil(productosFiltrados.length / productosPorPagina);

    document.getElementById('page-info').textContent = `Página ${paginaActual} de ${totalPaginas}`;
    document.getElementById('btn-prev').disabled = paginaActual === 1;
    document.getElementById('btn-next').disabled = paginaActual === totalPaginas;

    // Dibujar tarjetas
    grid.innerHTML = productosPagina.map(prod => {
        const precio = prod.precio ? prod.precio.toLocaleString('es-PY') : '0';
        const imagen = prod.imagen_principal || 'assets/img/placeholder.png';
        const enStock = prod.stock === true;
        
        return `
            <div class="product-card animate-fade-in-up">
                <div class="product-card__image-wrapper">
                    <img src="${imagen}" alt="${prod.nombre}" class="product-card__image" loading="lazy">
                </div>
                <div class="product-card__content">
                    <h3 class="product-card__title">${prod.nombre}</h3>
                    <span class="product-card__category">${prod.categoria || 'Componente'}</span>
                    <div class="product-card__price">${precio} Gs.</div>
                    
                    <div class="product-card__footer">
                        ${enStock ? '<span class="badge-stock">En stock</span>' : '<span class="badge-nostock">Sin stock</span>'}
                        <button class="btn-detalles" onclick="abrirModalDetalleProducto(${prod.id})">Ver detalles ›</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// --- 3. FILTROS Y EVENTOS ---
function aplicarFiltros() {
    const texto = document.getElementById('search-input').value.toLowerCase();
    const precioRango = document.getElementById('price-filter').value;
    const categoriaActiva = document.querySelector('.dropdown-item.active')?.dataset.cat || 'todos';

    productosFiltrados = todosLosProductos.filter(prod => {
        const coincideTexto = prod.nombre.toLowerCase().includes(texto) || (prod.descripcion || '').toLowerCase().includes(texto);
        const coincideCategoria = categoriaActiva === 'todos' || prod.categoria === categoriaActiva;
        
        let coincidePrecio = true;
        if (precioRango !== 'todos') {
            const [min, max] = precioRango.split('-').map(Number);
            coincidePrecio = prod.precio >= min && prod.precio <= max;
        }

        return coincideTexto && coincideCategoria && coincidePrecio;
    });

    paginaActual = 1;
    renderizarPagina();
}

function configurarEventos() {
    document.getElementById('search-input').addEventListener('input', aplicarFiltros);
    document.getElementById('price-filter').addEventListener('change', aplicarFiltros);

    document.getElementById('btn-prev').addEventListener('click', () => {
        if (paginaActual > 1) { paginaActual--; renderizarPagina(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
    });
    document.getElementById('btn-next').addEventListener('click', () => {
        const totalPaginas = Math.ceil(productosFiltrados.length / productosPorPagina);
        if (paginaActual < totalPaginas) { paginaActual++; renderizarPagina(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
    });

    const dropdown = document.getElementById('dropdown-categorias');
    const btnDropdown = document.getElementById('btn-dropdown-cat');
    
    if(btnDropdown) {
        btnDropdown.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('active');
        });
    }

    document.addEventListener('click', () => {
        if(dropdown) dropdown.classList.remove('active');
    });

    document.querySelectorAll('.dropdown-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.dropdown-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            if(btnDropdown) btnDropdown.innerHTML = item.innerHTML + ' <i class="fas fa-chevron-down" style="font-size: 0.8rem; margin-left: 4px;"></i>';
            
            if(dropdown) dropdown.classList.remove('active');
            aplicarFiltros();
        });
    });
}

document.addEventListener('DOMContentLoaded', inicializarCatalogo);
