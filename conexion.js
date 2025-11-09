// conexion.js - VERSIÓN CORREGIDA
class ESP32Connection {
    constructor() {
        this.isConnected = false;
        this.device = null;
        this.characteristic = null;
        this.initializeConnectionManager();
    }

    initializeConnectionManager() {
        console.log('🔌 Inicializando conexión...');
        this.createConnectionModal();
        setTimeout(() => this.showConnectionModal(), 1000);
    }

    createConnectionModal() {
        const modalHTML = `
        <div id="connectionModal" class="modal">
            <div class="modal-content">
                <h3>🔗 Conectar al Sistema Láser</h3>
                <div class="connection-options">
                    <button id="bluetoothBtn" class="connection-btn">
                        📱 Bluetooth
                    </button>
                </div>
                <div class="modal-actions">
                    <button id="cancelBtn" class="btn-secondary">Cancelar</button>
                </div>
            </div>
        </div>`;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        document.getElementById('bluetoothBtn').addEventListener('click', () => {
            this.connectViaBluetooth();
        });
        
        document.getElementById('cancelBtn').addEventListener('click', () => {
            this.hideConnectionModal();
        });
    }

    async connectViaBluetooth() {
        console.log('🔵 Conectando Bluetooth...');
        
        try {
            this.device = await navigator.bluetooth.requestDevice({
                acceptAllDevices: true,
                optionalServices: ['4fafc201-1fb5-459e-8fcc-c5c9c331914b']
            });

            console.log('📱 Dispositivo:', this.device.name);

            const server = await this.device.gatt.connect();
            const service = await server.getPrimaryService('4fafc201-1fb5-459e-8fcc-c5c9c331914b');
            this.characteristic = await service.getCharacteristic('beb5483e-36e1-4688-b7f5-ea07361b26a8');

            // ✅ NUEVO: Configurar escucha de notificaciones
            await this.setupNotifications();
            
            this.isConnected = true;
            console.log('✅ Bluetooth CONECTADO');
            
            this.hideConnectionModal();
            this.showNotification('Bluetooth conectado', 'success');
            
            if (window.laserSystem) {
                window.laserSystem.updateConnectionStatus('connected');
            }
            
        } catch (error) {
            console.error('❌ Error:', error);
            this.showNotification('Error: ' + error.message, 'error');
        }
    }

    // ✅ AGREGAR ESTA FUNCIÓN DENTRO DE LA CLASE (después de connectViaBluetooth)
    async setupNotifications() {
        this.characteristic.addEventListener('characteristicvaluechanged', event => {
            const value = new TextDecoder().decode(event.target.value);
            console.log('📡 Datos recibidos:', value);
            this.processESP32Data(value);
        });

        await this.characteristic.startNotifications();
        console.log('🔔 Notificaciones BLE activadas');
    }

    // ✅ AGREGAR ESTA FUNCIÓN DENTRO DE LA CLASE (después de setupNotifications)
    processESP32Data(data) {
    if (data.startsWith('SENSOR:')) {
        const distance = parseFloat(data.split(':')[1]);
        console.log('📊 Distancia recibida:', distance);
        
        // Enviar datos al sistema principal
        if (window.laserSystem) {
            window.laserSystem.processRealSensorData(distance);
        }
    }
}
    
    // ✅ NUEVO: También procesar mensajes de posición
    if (data.startsWith('POS:')) {
        const position = parseInt(data.split(':')[1]);
        console.log('📏 Posición recibida:', position);
        
        if (window.laserSystem) {
            // Actualizar posición en el sistema web
            window.laserSystem.systemState.currentPosition = position;
            window.laserSystem.updatePositionDisplays();
        }
    }
}

    async sendCommand(command) {
        if (!this.isConnected || !this.characteristic) {
            throw new Error('No hay conexión Bluetooth');
        }

        try {
            const encoder = new TextEncoder();
            const data = encoder.encode(command + '\n');
            await this.characteristic.writeValue(data);
            console.log('📤 Comando enviado:', command);
        } catch (error) {
            console.error('❌ Error enviando comando:', error);
            throw error;
        }
    }

    showConnectionModal() {
        const modal = document.getElementById('connectionModal');
        if (modal) modal.style.display = 'flex';
    }

    hideConnectionModal() {
        const modal = document.getElementById('connectionModal');
        if (modal) modal.style.display = 'none';
    }

    showNotification(message, type) {
        console.log(`[${type}] ${message}`);
    }
} // ✅ ESTE } CIERRA LA CLASE ESP32Connection

function showSection(sectionName) {
    console.log('🔍 Intentando mostrar sección:', sectionName);
    
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => {
        section.style.display = 'none';
    });
    
    const targetSection = document.getElementById(sectionName);
    if (targetSection) {
        targetSection.style.display = 'block';
        console.log('✅ Sección mostrada:', sectionName);
    } else {
        console.error('❌ Sección no encontrada:', sectionName);
        return;
    }
    
    const functionCards = document.querySelectorAll('.function-card');
    functionCards.forEach(card => {
        card.classList.remove('active');
        const onclickAttr = card.getAttribute('onclick');
        if (onclickAttr && onclickAttr.includes(sectionName)) {
            card.classList.add('active');
        }
    });
}

// Inicializar
let esp32Connection;
document.addEventListener('DOMContentLoaded', function() {
    esp32Connection = new ESP32Connection();
    window.esp32Connection = esp32Connection;
});


