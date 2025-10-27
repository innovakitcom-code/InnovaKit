// permissions.js - Gestión de permisos para Bluetooth/WiFi
class PermissionManager {
    constructor() {
        this.permissions = {
            bluetooth: false,
            notifications: false,
            storage: true // localStorage siempre disponible
        };
    }

    async initializePermissions() {
        console.log('🔐 Inicializando permisos...');
        
        try {
            // Verificar y solicitar permisos Bluetooth
            await this.requestBluetoothPermission();
            
            // Solicitar permisos de notificaciones
            await this.requestNotificationPermission();
            
            // Verificar compatibilidad del navegador
            this.checkBrowserCompatibility();
            
            console.log('✅ Todos los permisos configurados');
            return true;
            
        } catch (error) {
            console.error('❌ Error en permisos:', error);
            this.showPermissionError(error);
            return false;
        }
    }

    async requestBluetoothPermission() {
        // Verificar si el navegador soporta Bluetooth
        if (!navigator.bluetooth) {
            throw new Error(
                'Tu navegador no soporta Bluetooth Web. ' +
                'Usa Chrome, Edge, o Safari en iOS 15+.'
            );
        }

        try {
            // Verificar permisos existentes
            const permissionStatus = await navigator.permissions.query({
                name: 'bluetooth'
            });

            console.log('📊 Estado permiso Bluetooth:', permissionStatus.state);

            if (permissionStatus.state === 'granted') {
                this.permissions.bluetooth = true;
                return true;
            }

            if (permissionStatus.state === 'denied') {
                throw new Error(
                    'Permiso Bluetooth denegado. ' +
                    'Ve a configuraciones del navegador y permite Bluetooth.'
                );
            }

            // Para solicitar permisos, necesitamos intentar una conexión
            // Esto activará el diálogo nativo del navegador
            console.log('🔵 Bluetooth disponible, permisos se solicitarán al conectar');
            this.permissions.bluetooth = true;
            return true;

        } catch (error) {
            console.error('❌ Error en permiso Bluetooth:', error);
            throw error;
        }
    }

    async requestNotificationPermission() {
        if (!('Notification' in window)) {
            console.log('⚠️ Notificaciones no soportadas');
            return false;
        }

        try {
            if (Notification.permission === 'granted') {
                this.permissions.notifications = true;
                return true;
            }

            if (Notification.permission === 'denied') {
                console.log('⚠️ Notificaciones denegadas por el usuario');
                return false;
            }

            // Solicitar permiso
            const permission = await Notification.requestPermission();
            this.permissions.notifications = (permission === 'granted');
            
            console.log('🔔 Permiso notificaciones:', permission);
            return this.permissions.notifications;

        } catch (error) {
            console.error('❌ Error en permiso notificaciones:', error);
            return false;
        }
    }

    checkBrowserCompatibility() {
        const compatibility = {
            webBluetooth: !!navigator.bluetooth,
            serviceWorker: 'serviceWorker' in navigator,
            storage: 'localStorage' in window,
            websocket: 'WebSocket' in window
        };

        console.log('🌐 Compatibilidad navegador:', compatibility);

        if (!compatibility.webBluetooth) {
            this.showCompatibilityWarning();
        }

        return compatibility;
    }

    showCompatibilityWarning() {
        const warningHTML = `
        <div class="compatibility-warning">
            <div class="warning-content">
                <h3>⚠️ Compatibilidad Limitada</h3>
                <p>Tu navegador no soporta todas las funciones:</p>
                <ul>
                    <li>✅ WiFi: Disponible</li>
                    <li>❌ Bluetooth: No disponible</li>
                </ul>
                <p>Para Bluetooth, usa:</p>
                <ul>
                    <li>Chrome 56+ (Android/Windows/Mac)</li>
                    <li>Edge 79+ (Windows)</li>
                    <li>Safari 15+ (iOS/Mac)</li>
                </ul>
                <button onclick="this.parentElement.parentElement.remove()">Entendido</button>
            </div>
        </div>
        `;

        document.body.insertAdjacentHTML('beforeend', warningHTML);
    }

    showPermissionError(error) {
        const errorHTML = `
        <div class="permission-error">
            <div class="error-content">
                <h3>🔒 Permiso Requerido</h3>
                <p>${error.message}</p>
                <div class="error-actions">
                    <button onclick="location.reload()">Reintentar</button>
                    <button onclick="this.parentElement.parentElement.remove()">Continuar sin Bluetooth</button>
                </div>
            </div>
        </div>
        `;

        document.body.insertAdjacentHTML('beforeend', errorHTML);
    }

    // Verificar permisos antes de acciones críticas
    async checkBluetoothPermission() {
        if (!this.permissions.bluetooth) {
            throw new Error('Permisos Bluetooth no concedidos');
        }
        return true;
    }

    getPermissionsStatus() {
        return this.permissions;
    }
}

// Inicializar gestor de permisos
const permissionManager = new PermissionManager();

// Estilos para los mensajes de permisos
const permissionStyles = `
<style>
.compatibility-warning, .permission-error {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10000;
}

.warning-content, .error-content {
    background: white;
    padding: 2rem;
    border-radius: 12px;
    max-width: 400px;
    margin: 1rem;
    text-align: center;
}

.warning-content h3, .error-content h3 {
    color: #ff9500;
    margin-bottom: 1rem;
}

.error-content h3 {
    color: #ff3b30;
}

.warning-content ul, .error-content ul {
    text-align: left;
    margin: 1rem 0;
}

.error-actions {
    display: flex;
    gap: 1rem;
    justify-content: center;
    margin-top: 1.5rem;
}

.error-actions button {
    padding: 0.8rem 1.5rem;
    border: none;
    border-radius: 8px;
    cursor: pointer;
}

.error-actions button:first-child {
    background: #007aff;
    color: white;
}

.error-actions button:last-child {
    background: #f8f9fa;
    color: #1d1d1f;
    border: 1px solid #c7c7cc;
}
</style>
`;

document.head.insertAdjacentHTML('beforeend', permissionStyles);