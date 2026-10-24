// ============================================
// MAIN.JS - Inicialización global
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    // 1. INYECTAR MODALES
    if (!document.getElementById('modal-carrito')) {
        const modalesHTML = `
            <div id="modal-carrito" class="modal-overlay" onclick="cerrarModalCarrito(event)">
                <div class="modal" style="max-width: 500px;" onclick="event.stopPropagation()">
                    <div class="modal__header">
                        <h3 class="modal__title"><i class="fas fa-shopping-cart" style="color:var(--blue); margin-right:8px;"></i> Tu carrito</h3>
                        <button class="modal__close" onclick="cerrarModalCarrito()"><i class="fas fa-times"></i></button>
                    </div>
                    <div class="modal__body">
                        <div id="carrito-lista" style="max-height: 400px; overflow-y: auto;"><p class="text-center text-muted" style="padding: 20px;">Cargando carrito...</p></div>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 20px; padding-top: 20px; border-top: 2px solid var(--line);"><span style="font-weight: 600; font-size: 1.1rem; color: var(--ink);">Total:</span><span id="carrito-total" style="font-weight: 800; font-size: 1.4rem; color: var(--green);">Gs. 0</span></div>
                    </div>
                    <div class="modal__footer" style="display: flex; gap: 12px;">
                        <button onclick="vaciarCarrito()" class="btn btn-outline" style="flex: 1; border-color: var(--danger); color: var(--danger);"><i class="fas fa-trash"></i> Vaciar</button>
                        <button onclick="enviarPedidoWhatsApp()" class="btn btn-whatsapp" style="flex: 2;"><i class="fab fa-whatsapp"></i> Comprar por WhatsApp</button>
                    </div>
                </div>
            </div>

            <div id="modal-login" class="modal-overlay" onclick="cerrarModalLogin(event)">
                <div class="modal" style="max-width: 420px;" onclick="event.stopPropagation()">
                    <div class="modal__header">
                        <h3 class="modal__title">Iniciar Sesión</h3>
                        <button class="modal__close" onclick="cerrarModalLogin()"><i class="fas fa-times"></i></button>
                    </div>
                    <div class="modal__body">
                        <form id="form-login">
                            <div class="form-group"><label class="form-label">Correo electrónico</label><input type="email" id="login-email" class="form-input" required placeholder="tu@email.com"></div>
                            <div class="form-group"><label class="form-label">Contraseña</label><input type="password" id="login-password" class="form-input" required placeholder="••••••••"></div>
                            <button type="submit" class="btn btn-primary btn-block" style="margin-top: 10px;">Ingresar</button>
                        </form>
                        <p style="text-align:center; margin-top: 20px; font-size: 0.9rem; color: var(--muted);">¿No tienes cuenta? <a href="#" onclick="event.preventDefault(); abrirModalRegistro();" style="color: var(--blue); font-weight: 600;">Regístrate</a></p>
                    </div>
                </div>
            </div>

            <div id="modal-registro" class="modal-overlay" onclick="cerrarModalRegistro(event)">
                <div class="modal" style="max-width: 420px;" onclick="event.stopPropagation()">
                    <div class="modal__header">
                        <h3 class="modal__title">Crear Cuenta</h3>
                        <button class="modal__close" onclick="cerrarModalRegistro()"><i class="fas fa-times"></i></button>
                    </div>
                    <div class="modal__body">
                        <form id="form-registro">
                            <div class="form-group"><label class="form-label">Nombre completo</label><input type="text" id="reg-nombre" class="form-input" required placeholder="Tu nombre"></div>
                            <div class="form-group"><label class="form-label">Teléfono / WhatsApp</label><input type="tel" id="reg-telefono" class="form-input" placeholder="Ej: 0972 292392"></div>
                            <div class="form-group"><label class="form-label">Correo electrónico</label><input type="email" id="reg-email" class="form-input" required placeholder="tu@email.com"></div>
                            <div class="form-group"><label class="form-label">Contraseña</label><input type="password" id="reg-password" class="form-input" required placeholder="Mínimo 6 caracteres"></div>
                            <button type="submit" class="btn btn-primary btn-block" style="margin-top: 10px;">Registrarse</button>
                        </form>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalesHTML);

        document.getElementById('form-login')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            await iniciarSesionSupabase(document.getElementById('login-email').value, document.getElementById('login-password').value);
        });
        document.getElementById('form-registro')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const exito = await registrarUsuarioSupabase(document.getElementById('reg-email').value, document.getElementById('reg-password').value, document.getElementById('reg-nombre').value, document.getElementById('reg-telefono').value);
            if (exito) { cerrarModalRegistro(); abrirModalLogin(); }
        });
    }

    // 2. Menú Móvil
    const overlay = document.getElementById('menu-overlay');
    const menu = document.getElementById('mobile-menu');
    const btnOpen = document.getElementById('btn-open-menu');
    const btnClose = document.getElementById('btn-close-menu');

    if(btnOpen && menu && overlay) {
        btnOpen.addEventListener('click', () => { menu.classList.add('is-open'); overlay.classList.add('is-open'); document.body.style.overflow = 'hidden'; });
        btnClose.addEventListener('click', () => { menu.classList.remove('is-open'); overlay.classList.remove('is-open'); document.body.style.overflow = ''; });
        overlay.addEventListener('click', () => { menu.classList.remove('is-open'); overlay.classList.remove('is-open'); document.body.style.overflow = ''; });
    }

    // 3. Botones del Header
    document.getElementById('btn-carrito')?.addEventListener('click', (e) => { e.preventDefault(); abrirModalCarrito(); });
    document.getElementById('btn-login')?.addEventListener('click', (e) => {
        e.preventDefault();
        if (window.usuarioActual) abrirPanelUsuario();
        else abrirModalLogin();
    });

    // 4. Cargar datos iniciales
    await cargarUsuarioActualSupabase();
    await cargarCarritoSupabase();

    // 5. Cargar productos destacados
    if (document.getElementById('featured-products')) {
        await cargarProductosDestacados();
    }

    // 6. ANIMACIÓN DE SCROLL
    const animatedElements = document.querySelectorAll('.scroll-animate, .fade-left, .fade-right, .section, .info-block, .spec-card, .product-card');
    animatedElements.forEach(el => {
        if (!el.classList.contains('scroll-animate') && !el.classList.contains('fade-left') && !el.classList.contains('fade-right')) {
            el.classList.add('scroll-animate');
        }
    });

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target); 
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.scroll-animate, .fade-left, .fade-right').forEach(el => observer.observe(el));

    // 7. TRANSICIÓN SUAVE ENTRE PÁGINAS
    document.querySelectorAll('a[href]').forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            const paginaActual = window.location.pathname.split('/').pop() || 'index.html';
            const esAnclaMismaPagina = href.startsWith('#') || href.includes(paginaActual + '#');
            
            if (href && !esAnclaMismaPagina && !href.startsWith('http') && !href.startsWith('mailto') && !href.startsWith('tel') && !this.hasAttribute('target')) {
                e.preventDefault();
                sessionStorage.setItem('navegando_interno', 'true');
                document.body.style.transition = 'opacity 0.4s ease';
                document.body.style.opacity = '0';
                setTimeout(() => { window.location.href = href; }, 400);
            }
        });
    });
}); // <-- ESTA LLAVE ES LA QUE FALTABA

// SOLUCIÓN BOTÓN ATRÁS (Va FUERA del DOMContentLoaded)
window.addEventListener('pageshow', function(event) {
    if (event.persisted || sessionStorage.getItem('navegando_interno')) {
        document.body.style.opacity = '1';
        document.body.style.transition = '';
        sessionStorage.removeItem('navegando_interno');
    }
});
