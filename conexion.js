// conexion.js - VERSIÓN ULTRA SIMPLIFICADA
class ESP32Connection {
    constructor() {
        this.isConnected = false;
        this.device = null;
        this.characteristic = null;
    }

    async connectViaBluetooth() {
        console.log('🔵 Iniciando conexión Bluetooth...');
        
        try {
            // Solicitar dispositivo
            this.device = await navigator.bluetooth.requestDevice({
                acceptAllDevices: true,
                optionalServices: ['4fafc201-1fb5-459e-8fcc-c5c9c331914b']
            });

            console.log('📱 Dispositivo seleccionado:', this.device.name);

            // Conectar
            const server = await this.device.gatt.connect();
            const service = await server.getPrimaryService('4fafc201-1fb5-459e-8fcc-c5c9c331914b');
            this.characteristic = await service.getCharacteristic('beb5483e-36e1-4688-b7f5-ea07361b26a8');

            this.isConnected = true;
            console.log('✅ Conexión Bluetooth establecida');
            
            // Cerrar modal y notificar
            this.hideConnectionModal();
            if (window.laserSystem) {
                window.laserSystem.updateConnectionStatus('connected');
            }
            
        } catch (error) {
            console.error('❌ Error Bluetooth:', error);
            alert('Error Bluetooth: ' + error.message);
        }
    }

    async sendCommand(command) {
        if (!this.isConnected || !this.characteristic) {
            throw new Error('No conectado');
        }

        const encoder = new TextEncoder();
        const data = encoder.encode(command + '\n');
        await this.characteristic.writeValue(data);
        console.log('📤 Comando enviado:', command);
    }

    hideConnectionModal() {
        const modal = document.getElementById('connectionModal');
        if (modal) modal.style.display = 'none';
    }
}

// Inicializar
const esp32Connection = new ESP32Connection();

