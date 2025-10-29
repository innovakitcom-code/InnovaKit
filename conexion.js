// conexion.js - COMUNICACIÓN CON ESP32
// Soporte para Bluetooth BLE y WiFi
class ESP32Connection {
    constructor() {
        this.connectionType = null; // 'bluetooth' | 'wifi'
        this.device = null;
        this.server = null;
        this.service = null;
        this.characteristic = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 3;
        
        this.initializeConnectionManager();
    }

    // ==================== GESTOR PRINCIPAL ====================
    initializeConnectionManager() {
        console.log('🔌 Inicializando gestor de conexión ESP32...');
        
        // Verificar disponibilidad de APIs
        this.checkAPIAvailability();
        
        // Configurar event listeners para UI
        this.setupConnectionUI();
    }

    checkAPIAvailability() {
        // Verificar si el navegador soporta Bluetooth
        if (navigator.bluetooth) {
            console.log('✅ Web Bluetooth API disponible');
        } else {
            console.log('❌ Web Bluetooth no disponible');
            this.showBluetoothError();
        }
    }

    // ==================== INTERFAZ DE CONEXIÓN ====================
    setupConnectionUI() {
        // Crear modal de conexión si no existe
        this.createConnectionModal();
        
        // Mostrar modal al cargar la página
        setTimeout(() => {
            this.showConnectionModal();
        }, 1000);
    }

    createConnectionModal() {
    console.log('🔧 Creando modal de conexión...');
    
    // Eliminar modal existente si hay
    const existingModal = document.getElementById('connectionModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    const modalHTML = `
    <div id="connectionModal" class="modal" style="display: none;">
        <div class="modal-content">
            <h3>🔗 Conectar al Sistema Láser</h3>
            <p>Selecciona el método de conexión:</p>
            
            <div class="connection-options">
                <button id="bluetoothBtn" class="connection-btn" style="padding: 1.5rem; border: 2px solid #e5e5e7; border-radius: 12px; background: white; cursor: pointer; text-align: left;">
                    <span style="font-size: 1.5rem; display: block; margin-bottom: 0.5rem;">📱</span>
                    <span style="font-weight: 600; display: block;">Bluetooth</span>
                    <span style="font-size: 0.9rem; color: #8e8e93; display: block;">Conectar vía BLE</span>
                </button>
                
                <button id="wifiBtn" class="connection-btn" style="padding: 1.5rem; border: 2px solid #e5e5e7; border-radius: 12px; background: white; cursor: pointer; text-align: left;">
                    <span style="font-size: 1.5rem; display: block; margin-bottom: 0.5rem;">🌐</span>
                    <span style="font-weight: 600; display: block;">WiFi</span>
                    <span style="font-size: 0.9rem; color: #8e8e93; display: block;">Conectar vía red local</span>
                </button>
            </div>
            
            <div class="connection-status">
                <div class="status-indicator disconnected"></div>
                <span id="connectionStatusText">Desconectado</span>
            </div>
            
            <div class="modal-actions">
                <button id="cancelBtn" class="btn-secondary">Cancelar</button>
                <button id="retryBtn" class="btn-primary" style="display: none;">Reintentar</button>
            </div>
        </div>
    </div>`;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // ✅ EVENT LISTENERS PARA AMBOS BOTONES
    document.getElementById('bluetoothBtn').addEventListener('click', () => {
        console.log('🔵 Bluetooth clickeado');
        this.connectViaBluetooth();
    });
    
    document.getElementById('wifiBtn').addEventListener('click', () => {
        console.log('🌐 WiFi clickeado');
        this.connectViaWiFi();
    });
    
    document.getElementById('cancelBtn').addEventListener('click', () => {
        this.hideConnectionModal();
    });
    
    document.getElementById('retryBtn').addEventListener('click', () => {
        this.retryConnection();
    });
    
    console.log('✅ Modal creado correctamente');
    
    // ✅ MOSTRAR EL MODAL INMEDIATAMENTE
    this.showConnectionModal();
}
    showConnectionModal() {
        document.getElementById('connectionModal').style.display = 'flex';
    }

    hideConnectionModal() {
        document.getElementById('connectionModal').style.display = 'none';
    }

   // ==================== CONEXIÓN BLUETOOTH BLE ====================
async connectViaBluetooth() {
    console.log('🔵 Iniciando conexión Bluetooth...');
     /*
    try {
        await permissionManager.checkBluetoothPermission();
    } catch (error) {
        this.updateConnectionUI('error', error.message);
        return;
    }
      */
    this.updateConnectionUI('connecting', 'Buscando dispositivos Bluetooth...');
    
    try {
        // ✅ VERSIÓN CORRECTA - sin duplicados
        const device = await navigator.bluetooth.requestDevice({
            acceptAllDevices: true,  // ← ESTO ES CLAVE
            optionalServices: [
                '4fafc201-1fb5-459e-8fcc-c5c9c331914b',
                'beb5483e-36e1-4688-b7f5-ea07361b26a8',
                'generic_access'
            ]
        });
        
        console.log('📱 Dispositivo seleccionado:', device.name);
        this.device = device;
        
        // Listeners de eventos del dispositivo
        device.addEventListener('gattserverdisconnected', () => {
            this.onDisconnected();
        });
        
        // ... el resto de tu código original sigue igual ...
        // Conectar al GATT server
        const server = await device.gatt.connect();
        this.server = server;
        
        // Obtener el servicio
        const service = await server.getPrimaryService('4fafc201-1fb5-459e-8fcc-c5c9c331914b');
        this.service = service;
        
        // Obtener características
        this.characteristic = await service.getCharacteristic('beb5483e-36e1-4688-b7f5-ea07361b26a8');
        
        // Configurar notificaciones
       
        
        this.connectionType = 'bluetooth';
        this.isConnected = true;
        this.reconnectAttempts = 0;
        
        console.log('✅ Conexión Bluetooth establecida');
        this.updateConnectionUI('connected', 'Conectado vía Bluetooth');
        this.onConnected();
        
    } catch (error) {
        console.error('❌ Error en conexión Bluetooth:', error);
        this.updateConnectionUI('error', `Error: ${error.message}`);
        this.handleConnectionError(error);
    }
}
    // ==================== CONEXIÓN WiFi ====================
    async connectViaWiFi() {
        console.log('🟡 Iniciando conexión WiFi...');
        this.updateConnectionUI('connecting', 'Conectando vía WiFi...');
        
        try {
            // Para WiFi, normalmente usarías WebSockets o HTTP
            // Aquí simulamos la conexión
            const wifiAddress = prompt('Ingresa la dirección IP del ESP32:', '192.168.1.100');
            
            if (!wifiAddress) {
                throw new Error('Dirección IP no proporcionada');
            }
            
            // En producción, aquí establecerías la conexión WebSocket
            this.wifiSocket = new WebSocket(`ws://${wifiAddress}:81`);
            
            this.wifiSocket.onopen = () => {
                this.connectionType = 'wifi';
                this.isConnected = true;
                this.reconnectAttempts = 0;
                
                console.log('✅ Conexión WiFi establecida');
                this.updateConnectionUI('connected', 'Conectado vía WiFi');
                this.onConnected();
            };
            
            this.wifiSocket.onmessage = (event) => {
                this.handleIncomingData(event.data);
            };
            
            this.wifiSocket.onclose = () => {
                this.onDisconnected();
            };
            
            this.wifiSocket.onerror = (error) => {
                this.handleConnectionError(error);
            };
            
        } catch (error) {
            console.error('❌ Error en conexión WiFi:', error);
            this.updateConnectionUI('error', `Error: ${error.message}`);
            this.handleConnectionError(error);
        }
    }

    // ==================== MANEJO DE DATOS ====================
    async sendCommand(command) {
        if (!this.isConnected) {
            throw new Error('No hay conexión activa');
        }
        
        try {
            if (this.connectionType === 'bluetooth' && this.characteristic) {
                // Convertir comando a ArrayBuffer para BLE
                const encoder = new TextEncoder();
                const data = encoder.encode(command + '\n');
                await this.characteristic.writeValue(data);
                
            } else if (this.connectionType === 'wifi' && this.wifiSocket) {
                this.wifiSocket.send(command + '\n');
            }
            
            console.log(`📤 Comando enviado: ${command}`);
            return true;
            
        } catch (error) {
            console.error('❌ Error enviando comando:', error);
            throw error;
        }
    }

    handleIncomingData(event) {
        try {
            let data;
            
            if (this.connectionType === 'bluetooth') {
                // Decodificar datos BLE
                const value = event.target.value;
                const decoder = new TextDecoder();
                data = decoder.decode(value);
            } else {
                // Datos WiFi
                data = event;
            }
            
            console.log(`📥 Datos recibidos: ${data}`);
            this.processIncomingData(data.trim());
            
        } catch (error) {
            console.error('❌ Error procesando datos:', error);
        }
    }

    processIncomingData(data) {
        // Procesar diferentes tipos de respuestas del ESP32
        if (data.startsWith('POS:')) {
            const position = parseInt(data.split(':')[1]);
            this.updatePosition(position);
            
        } else if (data.startsWith('SENSOR:')) {
            const distance = parseFloat(data.split(':')[1]);
            this.updateSensorReading(distance);
            
        } else if (data.startsWith('STATUS:')) {
            const status = data.split(':')[1];
            this.updateSystemStatus(status);
            
        } else if (data.startsWith('ERROR:')) {
            const errorMsg = data.split(':')[1];
            this.handleSystemError(errorMsg);
            
        } else if (data.startsWith('ACK:')) {
            console.log(`✅ Comando aceptado: ${data}`);
        }
    }

    // ==================== ACTUALIZACIONES DE ESTADO ====================
    updatePosition(steps) {
        if (window.laserSystem) {
            window.laserSystem.systemState.currentPosition = steps;
            window.laserSystem.updatePositionDisplays();
        }
    }

    updateSensorReading(distance) {
        document.getElementById('sensorDistance').textContent = distance.toFixed(1);
        
        // Actualizar gráfica si está activa
        if (window.laserSystem && window.laserSystem.updateGraph) {
            // Agregar dato a la gráfica
        }
    }

    updateSystemStatus(status) {
        const statusElement = document.getElementById('systemStatus');
        if (statusElement) {
            statusElement.textContent = status;
        }
    }

    handleSystemError(errorMsg) {
        console.error(`❌ Error del sistema: ${errorMsg}`);
        this.showNotification(`Error: ${errorMsg}`, 'error');
    }

    // ==================== MANEJO DE CONEXIÓN ====================
    onConnected() {
        this.hideConnectionModal();
        this.showNotification('Conexión establecida con ESP32', 'success');
        
        // Notificar al sistema principal
        if (window.laserSystem) {
            window.laserSystem.updateConnectionStatus('connected');
        }
    }

    onDisconnected() {
        this.isConnected = false;
        this.updateConnectionUI('disconnected', 'Desconectado');
        this.showNotification('Conexión perdida', 'warning');
        
        if (window.laserSystem) {
            window.laserSystem.updateConnectionStatus('disconnected');
        }
        
        // Intentar reconexión automática
        this.attemptReconnection();
    }

    attemptReconnection() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`🔄 Intento de reconexión ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
            
            setTimeout(() => {
                if (this.connectionType === 'bluetooth') {
                    this.connectViaBluetooth();
                } else if (this.connectionType === 'wifi') {
                    this.connectViaWiFi();
                }
            }, 2000);
        } else {
            this.showConnectionModal();
        }
    }

    handleConnectionError(error) {
        console.error('Error de conexión:', error);
        document.getElementById('retryBtn').style.display = 'block';
    }

    retryConnection() {
        document.getElementById('retryBtn').style.display = 'none';
        if (this.connectionType === 'bluetooth') {
            this.connectViaBluetooth();
        } else if (this.connectionType === 'wifi') {
            this.connectViaWiFi();
        }
    }

    // ==================== INTERFAZ DE USUARIO ====================
    updateConnectionUI(status, message) {
    const statusElement = document.getElementById('connectionStatusText');
    const indicator = document.querySelector('.status-indicator');
    
    if (statusElement) {
        statusElement.textContent = message;
    }
    
    if (indicator) {
        indicator.className = 'status-indicator ' + status;
    }
    
    console.log('🔧 Estado actualizado:', status, '-', message);
}

    showNotification(message, type = 'info') {
        // Usar el sistema de notificaciones del app.js
        if (window.laserSystem && window.laserSystem.showNotification) {
            window.laserSystem.showNotification(message, type);
        } else {
            console.log(`[${type}] ${message}`);
        }
    }

    showBluetoothError() {
        this.showNotification(
            'Bluetooth no está disponible en este navegador. Usa Chrome, Edge, o Safari en iOS.', 
            'error'
        );
    }

    // ==================== DESCONEXIÓN ====================
    async disconnect() {
        if (this.connectionType === 'bluetooth' && this.device) {
            if (this.device.gatt.connected) {
                this.device.gatt.disconnect();
            }
        } else if (this.connectionType === 'wifi' && this.wifiSocket) {
            this.wifiSocket.close();
        }
        
        this.isConnected = false;
        this.connectionType = null;
        this.updateConnectionUI('disconnected', 'Desconectado');
        
        if (window.laserSystem) {
            window.laserSystem.updateConnectionStatus('disconnected');
        }
    }
}

// ==================== INICIALIZACIÓN ====================
let esp32Connection;

document.addEventListener('DOMContentLoaded', function() {
    esp32Connection = new ESP32Connection();
    window.esp32Connection = esp32Connection;
});

// ==================== ESTILOS PARA EL MODAL ====================
const connectionStyles = `
<style>
.modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10000;
}

.modal-content {
    background: white;
    padding: 2rem;
    border-radius: 16px;
    max-width: 400px;
    width: 90%;
    text-align: center;
    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
}

.connection-options {
    display: flex;
    gap: 1rem;
    margin: 1.5rem 0;
    flex-direction: column;
}

.connection-btn {
    padding: 1.5rem;
    border: 2px solid #e5e5e7;
    border-radius: 12px;
    background: white;
    cursor: pointer;
    transition: all 0.2s;
    text-align: left;
}

.connection-btn:hover {
    border-color: #007aff;
    background: #f8f9fa;
    transform: translateY(-2px);
}

.bluetooth-btn:hover {
    border-color: #007aff;
}

.wifi-btn:hover {
    border-color: #34c759;
}

.btn-icon {
    font-size: 1.5rem;
    display: block;
    margin-bottom: 0.5rem;
}

.btn-text {
    font-weight: 600;
    display: block;
    font-size: 1.1rem;
}

.btn-desc {
    font-size: 0.9rem;
    color: #8e8e93;
    display: block;
}

.connection-status {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    margin: 1rem 0;
    padding: 1rem;
    border-radius: 8px;
    background: #f8f9fa;
}

.status-indicator {
    width: 10px;
    height: 10px;
    border-radius: 50%;
}

.status-indicator.connected { background: #34c759; }
.status-indicator.connecting { background: #ff9500; }
.status-indicator.error { background: #ff3b30; }
.status-indicator.disconnected { background: #8e8e93; }

.modal-actions {
    display: flex;
    gap: 1rem;
    justify-content: center;
    margin-top: 1.5rem;
}

.btn-primary {
    background: #007aff;
    color: white;
    border: none;
    padding: 0.8rem 1.5rem;
    border-radius: 8px;
    cursor: pointer;
}

.btn-secondary {
    background: #f8f9fa;
    color: #1d1d1f;
    border: 1px solid #c7c7cc;
    padding: 0.8rem 1.5rem;
    border-radius: 8px;
    cursor: pointer;
}
</style>
`;


document.head.insertAdjacentHTML('beforeend', connectionStyles);








