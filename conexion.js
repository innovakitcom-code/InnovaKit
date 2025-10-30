// conexion.js - VERSIÓN QUE FUNCIONA
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
            // ✅ ESTO SABEMOS QUE FUNCIONA (de la prueba en consola)
            this.device = await navigator.bluetooth.requestDevice({
                acceptAllDevices: true,
                optionalServices: ['4fafc201-1fb5-459e-8fcc-c5c9c331914b']
            });

            console.log('📱 Dispositivo:', this.device.name);

            const server = await this.device.gatt.connect();
            const service = await server.getPrimaryService('4fafc201-1fb5-459e-8fcc-c5c9c331914b');
            this.characteristic = await service.getCharacteristic('beb5483e-36e1-4688-b7f5-ea07361b26a8');

            this.isConnected = true;
            console.log('✅ Bluetooth CONECTADO');
            
            this.hideConnectionModal();
            this.showNotification('Bluetooth conectado', 'success');
            
            // Actualizar estado en la app principal
            if (window.laserSystem) {
                window.laserSystem.updateConnectionStatus('connected');
            }
            
        } catch (error) {
            console.error('❌ Error:', error);
            this.showNotification('Error: ' + error.message, 'error');
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
        // Puedes implementar notificaciones visuales aquí
    }
}
function showSection(sectionName) {
    console.log('🔍 Intentando mostrar sección:', sectionName);
    
    // ✅ CORREGIDO: Oculta todas las secciones con clase .content-section
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => {
        section.style.display = 'none';
        section.classList.remove('active'); // También quita la clase active
    });
    
    // ✅ Muestra solo la sección solicitada
    const targetSection = document.getElementById(sectionName);
    if (targetSection) {
        targetSection.style.display = 'block';
        targetSection.classList.add('active'); // Agrega clase active
        console.log('✅ Sección mostrada:', sectionName);
        
        // ✅ También actualiza los botones del scroll horizontal
        updateActiveFunctionCard(sectionName);
    } else {
        console.error('❌ Sección no encontrada:', sectionName);
    }
}

// ✅ Función para actualizar el botón activo en el scroll horizontal
function updateActiveFunctionCard(sectionName) {
    const functionCards = document.querySelectorAll('.function-card');
    functionCards.forEach(card => {
        card.classList.remove('active');
    });
    
    // Mapeo de secciones a botones
    const sectionToButton = {
        'manualSection': 0,
        'positionSection': 1, 
        'sensorSection': 2,
        'homingSection': 3,
        'presetsSection': 4,
        'configSection': 5
    };
    
    if (sectionToButton[sectionName] !== undefined) {
        functionCards[sectionToButton[sectionName]].classList.add('active');
    }
}
// Inicializar
let esp32Connection;
document.addEventListener('DOMContentLoaded', function() {
    esp32Connection = new ESP32Connection();
    window.esp32Connection = esp32Connection;
});


