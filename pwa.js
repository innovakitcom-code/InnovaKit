// pwa.js - Funcionalidades avanzadas PWA
class PWAFeatures {
    constructor() {
        this.initPWA();
    }

    initPWA() {
        // Detectar si está instalado como PWA
        if (window.matchMedia('(display-mode: standalone)').matches) {
            console.log('📱 Ejecutando como PWA instalada');
            this.enablePWAFeatures();
        }

        // Manejar actualizaciones
        this.setupUpdateHandler();
        
        // Configurar atajos de teclado
        this.setupKeyboardShortcuts();
    }

    enablePWAFeatures() {
        // Ocultar barra de dirección en PWA
        document.documentElement.style.height = '100%';
        
        // Configurar gestos táctiles
        this.setupTouchGestures();
    }

    setupUpdateHandler() {
        // Detectar actualizaciones del Service Worker
        let newWorker;
        
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                if (newWorker) {
                    this.showUpdateNotification();
                }
            });
        }
    }

    showUpdateNotification() {
        // Mostrar notificación de actualización
        if (confirm('¡Nueva versión disponible! ¿Recargar para actualizar?')) {
            window.location.reload();
        }
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (event) => {
            // Atajos globales
            switch(event.key) {
                case 'Escape':
                    if (window.esp32Connection) {
                        window.esp32Connection.emergencyStop();
                    }
                    break;
                case ' ':
                    // Pausar/continuar
                    event.preventDefault();
                    break;
                case 'h':
                    // Homing rápido
                    if (window.laserSystem && event.ctrlKey) {
                        window.laserSystem.executeHoming();
                    }
                    break;
            }
        });
    }

    setupTouchGestures() {
        // Gestos táctiles para móviles
        let touchStartX = 0;
        let touchStartY = 0;

        document.addEventListener('touchstart', (event) => {
            touchStartX = event.touches[0].clientX;
            touchStartY = event.touches[0].clientY;
        });

        document.addEventListener('touchend', (event) => {
            const touchEndX = event.changedTouches[0].clientX;
            const touchEndY = event.changedTouches[0].clientY;
            
            const diffX = touchStartX - touchEndX;
            const diffY = touchStartY - touchEndY;

            // Swipe izquierda: abrir menú
            if (Math.abs(diffX) > 50 && Math.abs(diffY) < 50) {
                if (diffX > 0) {
                    document.getElementById('menuToggle').click();
                }
            }
        });
    }

    // Instalar PWA
    static async installPWA() {
        if ('BeforeInstallPromptEvent' in window) {
            let deferredPrompt;
            
            window.addEventListener('beforeinstallprompt', (event) => {
                event.preventDefault();
                deferredPrompt = event;
                
                // Mostrar botón de instalación
                this.showInstallButton(deferredPrompt);
            });
        }
    }

    static showInstallButton(deferredPrompt) {
        const installBtn = document.createElement('button');
        installBtn.textContent = '📱 Instalar App';
        installBtn.className = 'install-btn';
        installBtn.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 1000;
            padding: 10px 15px;
            background: #007aff;
            color: white;
            border: none;
            border-radius: 20px;
            cursor: pointer;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        `;
        
        installBtn.onclick = async () => {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                installBtn.remove();
            }
        };
        
        document.body.appendChild(installBtn);
    }
}

// Inicializar PWA cuando cargue el DOM
document.addEventListener('DOMContentLoaded', () => {
    new PWAFeatures();
    PWAFeatures.installPWA();
});

// Funciones globales para HTML
function disconnectDevice() {
    if (window.esp32Connection) {
        window.esp32Connection.disconnect();
    }
}

function installApp() {
    PWAFeatures.installPWA();
}