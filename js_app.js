// ============================================
// APP PRINCIPAL - INICIALIZACIÓN
// ============================================

// Inicializar todo cuando la página carga
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Iniciando Innovakit con Supabase...');
    
    // Mostrar loading
    mostrarLoading(true);
    
    // 1. Cargar usuario actual
    await cargarUsuarioActual();
    
    // 2. Cargar productos y kits
    await cargarProductos();
    await cargarKits();
    
    // 3. Cargar carrito
    await cargarCarrito();
    
    // 4. Renderizar en la página
    renderizarProductos(productosGlobal);
    renderizarKits(kitsGlobal);
    
    // 5. Configurar eventos
    configurarEventos();
    
    // Ocultar loading
    mostrarLoading(false);
    
    console.log('✅ Innovakit listo');
    console.log(`📊 Estadísticas: ${productosGlobal.length} productos, ${kitsGlobal.length} kits`);
});

// Mostrar/ocultar loading
function mostrarLoading(mostrar) {
    const loading = document.getElementById('loading-overlay');
    if (loading) {
        if (mostrar) {
            loading.classList.remove('hidden');
        } else {
            loading.classList.add('hidden');
        }
    }
}

// Configurar eventos de UI
function configurarEventos() {
    // Menú móvil
    const menuBtn = document.getElementById('mobile-menu-btn');
    const mobileNav = document.getElementById('mobile-nav');
    if (menuBtn && mobileNav) {
        menuBtn.onclick = () => mobileNav.classList.toggle('hidden');
    }
    
    // Botón carrito
    const cartBtn = document.getElementById('cart-btn');
    if (cartBtn) {
        cartBtn.onclick = verCarrito;
    }
    
    // Botón usuario
    const userBtn = document.getElementById('user-btn');
    if (userBtn) {
        userBtn.onclick = () => {
            if (usuarioActual) {
                // Mostrar menú de usuario
                const dropdown = document.getElementById('user-dropdown');
                if (dropdown) {
                    dropdown.classList.toggle('hidden');
                }
            } else {
                mostrarModalLogin();
            }
        };
    }
    
    // Cerrar dropdown al hacer clic fuera
    document.addEventListener('click', (e) => {
        const dropdown = document.getElementById('user-dropdown');
        const userBtn = document.getElementById('user-btn');
        if (dropdown && !dropdown.classList.contains('hidden')) {
            if (!dropdown.contains(e.target) && e.target !== userBtn) {
                dropdown.classList.add('hidden');
            }
        }
    });
    
    // Botón admin
    const adminBtn = document.getElementById('admin-btn');
    if (adminBtn) {
        adminBtn.onclick = () => {
            window.location.href = '/admin.html';
        };
    }
    
    // Solicitar asesoría
    const asesoriaBtns = document.querySelectorAll('#solicitar-asesoria, .btn-asesoria');
    asesoriaBtns.forEach(btn => {
        btn.onclick = () => {
            window.open('https://wa.me/595972292392?text=¡Hola! Necesito asesoría para un proyecto técnico', '_blank');
        };
    });
    
    // Scroll suave para enlaces internos
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '#') return;
            
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
    
    // Cerrar modales con ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            cerrarModalLogin();
            cerrarModalRegistro();
            cerrarCarrito();
            cerrarModalProductoDetalle();
        }
    });
}

// Cargar el menú de usuario dropdown
function cargarDropdownUsuario() {
    const dropdown = document.getElementById('user-dropdown');
    if (!dropdown) return;
    
    if (usuarioActual) {
        dropdown.innerHTML = `
            <div class="py-2">
                <div class="px-4 py-3 border-b border-gray-100">
                    <p class="font-semibold text-gray-800">${usuarioActual.nombre}</p>
                    <p class="text-xs text-gray-500">${usuarioActual.email}</p>
                </div>
                ${usuarioActual.es_admin ? `
                    <a href="/admin.html" class="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-gray-700">
                        <i class="fas fa-chart-line w-5"></i> Panel Admin
                    </a>
                ` : ''}
                <button onclick="cerrarSesion()" class="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-red-600 w-full">
                    <i class="fas fa-sign-out-alt w-5"></i> Cerrar sesión
                </button>
            </div>
        `;
    }
}

// Agregar loading overlay al DOM
function agregarLoadingOverlay() {
    if (!document.getElementById('loading-overlay')) {
        document.body.insertAdjacentHTML('beforeend', `
            <div id="loading-overlay" class="fixed inset-0 bg-white bg-opacity-90 z-50 flex items-center justify-center hidden">
                <div class="text-center">
                    <div class="loading-spinner mx-auto mb-4"></div>
                    <p class="text-gray-600">Cargando Innovakit...</p>
                </div>
            </div>
        `);
    }
}

// Agregar dropdown de usuario al DOM
function agregarDropdownUsuario() {
    if (!document.getElementById('user-dropdown')) {
        const userMenu = document.getElementById('user-menu');
        if (userMenu) {
            userMenu.insertAdjacentHTML('beforeend', `
                <div id="user-dropdown" class="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 hidden z-50">
                    <!-- Contenido dinámico -->
                </div>
            `);
        }
    }
}

// Inicializar elementos adicionales
document.addEventListener('DOMContentLoaded', () => {
    agregarLoadingOverlay();
    agregarDropdownUsuario();
    cargarDropdownUsuario();
});
