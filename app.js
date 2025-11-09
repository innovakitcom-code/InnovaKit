// app.js - SISTEMA DE CONTROL LASER PROFESIONAL
// Compatible con ESP32 vía Bluetooth/WiFi

class LaserControlSystem {
    constructor() {
        // Configuración del motor paso a paso (NEMA + DRV8825)
        this.motorConfig = {
            stepsPerRevolution: 200,    // NEMA 17 típico
            microstepping: 16,          // DRV8825 configurable
            mmPerRevolution: 4,         // Tornillo 4mm por vuelta
            maxSpeed: 1000,             // steps/segundo
            acceleration: 500           // steps/segundo²
        };
        
        // Estado del sistema
        this.systemState = {
            currentPosition: 0,         // posición en steps
            targetPosition: 0,
            isMoving: false,
            emergencyStop: false,
            homingCompleted: false,
            connectionStatus: 'disconnected' // disconnected | connecting | connected
        };
        
        // Configuración de sensor ultrasónico
        this.sensorConfig = {
            updateInterval: 100,        // ms
            signalSmoothing: 5,         // muestras para promedio
            minDistance: 10,            // mm
            maxDistance: 500            // mm
        };
        
        // Presets de altura
        this.presets = {
            'foco': { position: 100, name: 'Punto Foco' },      // 10mm en steps
            'grabado': { position: 250, name: 'Modo Grabado' }, // 25mm en steps
            'corte': { position: 400, name: 'Modo Corte' }      // 40mm en steps
        };
        
        // Almacenamiento local de presets personalizados
        this.customPresets = JSON.parse(localStorage.getItem('laserPresets') || '{}');
        
        this.sensorInterval = null; // ← IMPORTANTE: agregar esto
        
        this.initializeSystem();
    }

    // ==================== INICIALIZACIÓN ====================
    initializeSystem() {
        console.log('🔧 Inicializando Sistema de Control Láser...');
        this.calculateStepConversions();
        this.loadUserSettings();
        this.setupEventListeners();
        
        // ✅ INICIALIZAR LECTURA REAL DE SENSOR
this.startRealSensorReading();
        
        // En producción, aquí se inicializa la conexión con ESP32
        this.initializeHardwareConnection();
        // ✅ NUEVO: Iniciar sistema de sincronización
    this.setupStateSync();
    }

  // ==================== SENSOR EN TIEMPO REAL ====================
startRealSensorReading() {
    console.log('📊 Esperando datos reales del sensor...');
    // Los datos vendrán por Bluetooth automáticamente
    this.sensorData = []; // Inicializar array para la gráfica
    this.maxDataPoints = 50; // Mantener últimos 50 puntos
}

// ✅ NUEVA FUNCIÓN: Procesar datos reales del sensor
processRealSensorData(distance) {
    console.log('📊 Procesando dato real:', distance);
    this.updateSensorDisplay(distance);
    this.updateSensorGraph(distance);
}

// ✅ NUEVA FUNCIÓN: Actualizar gráfica en tiempo real
updateSensorGraph(distance) {
    if (!this.sensorData) {
        this.sensorData = [];
        this.maxDataPoints = 50;
    }
    
    // Agregar nuevo dato
    this.sensorData.push({
        timestamp: Date.now(),
        distance: distance
    });
    
    // Mantener solo los últimos puntos
    if (this.sensorData.length > this.maxDataPoints) {
        this.sensorData.shift();
    }
    
    // Dibujar gráfica
    this.drawSensorGraph();
}

// ✅ NUEVA FUNCIÓN: Dibujar la gráfica
drawSensorGraph() {
    const canvas = document.getElementById('sensorGraph');
    if (!canvas) {
        console.log('⚠️ Canvas no encontrado');
        return;
    }
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Limpiar canvas
    ctx.clearRect(0, 0, width, height);
    
    if (!this.sensorData || this.sensorData.length < 2) {
        // Mostrar mensaje si no hay datos
        ctx.fillStyle = '#8e8e93';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Esperando datos del sensor...', width / 2, height / 2);
        return;
    }
    
    // Configurar estilo de la línea
    ctx.strokeStyle = '#007aff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    // Dibujar línea
    const xStep = width / (this.maxDataPoints - 1);
    
    this.sensorData.forEach((point, index) => {
        const x = index * xStep;
        // Normalizar distancia (0-500mm a 0-height)
        const y = height - (point.distance / 500) * height;
        
        if (index === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    
    ctx.stroke();
}
    stopSensorSimulation() {
        if (this.sensorInterval) {
            clearInterval(this.sensorInterval);
            console.log('📊 Simulación de sensor detenida');
        }
    }

    updateSensorDisplay(distance) {
        const sensorElement = document.getElementById('sensorDistance');
        if (sensorElement) {
            sensorElement.textContent = distance;
        }
    }

    calculateStepConversions() {
        // Cálculo preciso: steps por mm
        this.stepsPerMM = (this.motorConfig.stepsPerRevolution * 
                          this.motorConfig.microstepping) / 
                          this.motorConfig.mmPerRevolution;
        console.log(`📐 Steps por mm: ${this.stepsPerMM}`);
    }

    // ==================== CONEXIÓN HARDWARE ====================
    initializeHardwareConnection() {
        // En producción: Conexión real con ESP32
        // Por ahora simulamos conexión exitosa
        setTimeout(() => {
            this.updateConnectionStatus('connected');
            this.showNotification('Sistema conectado y listo', 'success');
        }, 1000);
    }

    // ✅ VERSIÓN CORREGIDA:
updateConnectionStatus(status) {
    this.systemState.connectionStatus = status;
    
    // ✅ BUSCAR EL ELEMENTO CORRECTO: 'globalConnectionStatus'
    const statusElement = document.getElementById('globalConnectionStatus');
    if (statusElement) {
        statusElement.textContent = 
            status === 'connected' ? '🟢 Conectado' : 
            status === 'connecting' ? '🟡 Conectando...' : '🔴 Desconectado';
    } else {
        console.log('⚠️ Elemento globalConnectionStatus no encontrado');
    }
}

    // ==================== CONTROL MANUAL ====================
    moveZ(direction) {
        if (this.systemState.emergencyStop) {
            this.showNotification('Sistema en parada de emergencia', 'error');
            return;
        }

        const steps = direction === 'up' ? 
            this.currentStepSize * this.stepsPerMM : 
            -this.currentStepSize * this.stepsPerMM;

        this.moveToPosition(this.systemState.currentPosition + steps);
    }

    async moveToPosition(targetSteps) {
        if (this.systemState.isMoving) {
            this.showNotification('El sistema ya se está moviendo', 'warning');
            return;
        }

        try {
            this.systemState.isMoving = true;
            this.systemState.targetPosition = targetSteps;
            
            // En producción: Enviar comando a ESP32
            const command = `MOVE:${targetSteps}`;
            await this.sendCommandToESP32(command);
            
            // Simular movimiento (en producción esto viene del ESP32)
            this.simulateMovement(targetSteps);
            
        } catch (error) {
            this.showNotification(`Error de movimiento: ${error.message}`, 'error');
            this.systemState.isMoving = false;
        }
    }

    simulateMovement(targetSteps) {
        // Simulación suave del movimiento
        const startPosition = this.systemState.currentPosition;
        const distance = targetSteps - startPosition;
        const duration = Math.abs(distance) * 10; // ms
        
        let startTime = null;
        
        const animate = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = (timestamp - startTime) / duration;
            
            if (progress < 1) {
                this.systemState.currentPosition = startPosition + (distance * progress);
                this.updatePositionDisplays();
                requestAnimationFrame(animate);
            } else {
                this.systemState.currentPosition = targetSteps;
                this.systemState.isMoving = false;
                this.updatePositionDisplays();
                this.showNotification('Movimiento completado', 'success');
            }
        };
        
        requestAnimationFrame(animate);
    }

    // ==================== AUTO-FOCUS AUTOMÁTICO ====================
    async startAutoFocus() {
        if (this.systemState.emergencyStop) {
            this.showNotification('Parada de emergencia activa', 'error');
            return;
        }

        this.showNotification('🔍 Iniciando auto-focus...', 'info');
        
        try {
            // 1. Moverse a posición segura inicial
            await this.moveToPosition(0);
            
            // 2. Escanear rango mientras se lee el sensor
            const focusPoint = await this.scanForBestFocus();
            
            // 3. Mover al punto óptimo
            await this.moveToPosition(focusPoint);
            
            this.showNotification(`✅ Auto-focus completado. Posición óptima: ${this.stepsToMM(focusPoint).toFixed(1)}mm`, 'success');
            
        } catch (error) {
            this.showNotification(`Error en auto-focus: ${error.message}`, 'error');
        }
    }

    async scanForBestFocus() {
        return new Promise((resolve) => {
            const scanRange = 400; // steps a escanear
            const stepSize = 10;   // steps por medición
            let bestPosition = 0;
            let bestSignal = Infinity;
            let currentStep = 0;
            
            const scanInterval = setInterval(() => {
                if (currentStep >= scanRange) {
                    clearInterval(scanInterval);
                    resolve(bestPosition);
                    return;
                }
                
                // Simular lectura del sensor (en producción: leer sensor real)
                const sensorValue = this.simulateSensorReading(currentStep);
                
                // Enfoque óptimo = mínima distancia (para láser)
                if (sensorValue < bestSignal) {
                    bestSignal = sensorValue;
                    bestPosition = currentStep;
                }
                
                currentStep += stepSize;
                this.systemState.currentPosition = currentStep;
                this.updatePositionDisplays();
                
            }, 50); // 50ms entre mediciones
        });
    }

    simulateSensorReading(position) {
        // Simulación de lectura de sensor ultrasónico
        // En producción: reemplazar con lectura real del ESP32
        const optimalPosition = 200; // posición óptima simulada
        const baseDistance = 50 + Math.abs(position - optimalPosition) * 0.1;
        const noise = (Math.random() - 0.5) * 5;
        return Math.max(10, baseDistance + noise);
    }

    // ==================== HOMING ====================
    async executeHoming() {
        if (this.systemState.emergencyStop) {
            this.showNotification('Parada de emergencia activa', 'error');
            return;
        }

        this.showNotification('🏠 Iniciando secuencia de homing...', 'info');
        
        try {
            // En producción: Activar rutina de homing en ESP32
            await this.sendCommandToESP32('HOMING_START');
            
            // Simular homing
            this.simulateHoming();
            
        } catch (error) {
            this.showNotification(`Error en homing: ${error.message}`, 'error');
        }
    }

    simulateHoming() {
        this.systemState.isMoving = true;
        
        // Simular búsqueda de fin de carrera
        setTimeout(() => {
            this.systemState.currentPosition = 0;
            this.systemState.homingCompleted = true;
            this.systemState.isMoving = false;
            this.updatePositionDisplays();
            this.showNotification('✅ Homing completado - Posición cero establecida', 'success');
        }, 3000);
    }

    // ==================== EMERGENCY STOP ====================
    emergencyStop() {
        this.systemState.emergencyStop = true;
        this.systemState.isMoving = false;
        
        // En producción: Enviar comando de parada de emergencia al ESP32
        this.sendCommandToESP32('EMERGENCY_STOP');
        
        this.showNotification('⛔ PARADA DE EMERGENCIA ACTIVADA', 'error');
        
        // Reactivar después de 3 segundos
        setTimeout(() => {
            this.systemState.emergencyStop = false;
            this.showNotification('Sistema reactivado', 'info');
        }, 3000);
    }

    // ==================== GESTIÓN DE PRESETS ====================
    saveCurrentPosition(name) {
        if (!name.trim()) {
            this.showNotification('Ingresa un nombre para el preset', 'warning');
            return;
        }
        
        this.customPresets[name] = {
            position: this.systemState.currentPosition,
            name: name,
            timestamp: new Date().toISOString()
        };
        
        localStorage.setItem('laserPresets', JSON.stringify(this.customPresets));
        this.showNotification(`Preset "${name}" guardado`, 'success');
        this.updatePresetsDisplay();
    }

    gotoPreset(presetKey) {
        const preset = this.presets[presetKey] || this.customPresets[presetKey];
        if (preset) {
            this.moveToPosition(preset.position);
            this.showNotification(`Moviendo a: ${preset.name}`, 'info');
        }
    }

    // ==================== COMUNICACIÓN ESP32 REAL ====================
async sendCommandToESP32(command) {
    console.log(`📡 Enviando comando REAL a ESP32: ${command}`);
    
    // ✅ USAR LA CONEXIÓN BLUETOOTH REAL
    if (window.esp32Connection && window.esp32Connection.isConnected) {
        try {
            await window.esp32Connection.sendCommand(command);
            console.log(`✅ Comando enviado correctamente: ${command}`);
            return `ACK:${command}`;
        } catch (error) {
            console.error(`❌ Error enviando comando: ${error}`);
            throw error;
        }
    } else {
        console.error('❌ No hay conexión Bluetooth disponible');
        throw new Error('No hay conexión Bluetooth');
    }
}
    // ==================== UTILIDADES ====================
    stepsToMM(steps) {
        return steps / this.stepsPerMM;
    }

    mmToSteps(mm) {
        return mm * this.stepsPerMM;
    }

    updatePositionDisplays() {
        const positionMM = this.stepsToMM(this.systemState.currentPosition).toFixed(1);
        document.querySelectorAll('.position-display').forEach(display => {
            display.textContent = positionMM;
        });
        
        // Actualizar distancia del sensor
        const sensorValue = this.simulateSensorReading(this.systemState.currentPosition);
        document.getElementById('sensorDistance').textContent = sensorValue.toFixed(1);
    }

    showNotification(message, type = 'info') {
        // Implementar sistema de notificaciones en UI
        console.log(`[${type.toUpperCase()}] ${message}`);
        
        // Mostrar en interfaz (simplificado)
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // ==================== CONFIGURACIÓN ====================
    setStepSize(mm) {
        this.currentStepSize = mm;
        document.getElementById('currentStep').textContent = mm;
    }

    setMicrostepping(microstep) {
        this.motorConfig.microstepping = parseInt(microstep);
        this.calculateStepConversions();
        this.showNotification(`Microstepping configurado: 1/${microstep}`, 'info');
    }

    setSpeed(speed) {
        // En producción: Enviar configuración de velocidad al ESP32
        this.sendCommandToESP32(`SET_SPEED:${speed}`);
        this.showNotification(`Velocidad configurada: ${speed} mm/s`, 'info');
    }

    // ==================== EVENT LISTENERS ====================
    setupEventListeners() {
        // Configurar paso por defecto
        this.setStepSize(1.0);
        
        // En producción: agregar listeners para eventos de hardware
        console.log('🎯 Event listeners configurados');
    }

    loadUserSettings() {
        // Cargar configuración del usuario desde localStorage
        const settings = JSON.parse(localStorage.getItem('laserSettings') || '{}');
        if (settings.currentStepSize) {
            this.setStepSize(settings.currentStepSize);
        }
    }
}
// ==================== SINCRONIZACIÓN ====================
setupStateSync() {
    console.log('🔄 Configurando sincronización automática...');
    
    // Sincronizar cuando se conecte el Bluetooth
    if (window.esp32Connection) {
        // Esperar a que esté conectado y luego sincronizar
        setTimeout(() => {
            this.syncWithESP32();
        }, 3000);
    }
}

async syncWithESP32() {
    try {
        console.log('🔄 Sincronizando estado con ESP32...');
        
        // Solicitar posición actual al ESP32
        await this.sendCommandToESP32('GET_POSITION');
        console.log('✅ Solicitud de sincronización enviada');
        
        // El ESP32 responderá con "POS:XXX" y se procesará automáticamente
        // gracias a los cambios que ya hicimos en processESP32Data
        
    } catch (error) {
        console.log('⚠️ Sincronización falló:', error);
        // No es crítico - el sistema sigue funcionando
    }
}
// ==================== INICIALIZACIÓN GLOBAL ====================
let laserSystem;

document.addEventListener('DOMContentLoaded', function() {
    laserSystem = new LaserControlSystem();
    console.log('🚀 Sistema de Control Láser inicializado');
    
    // Hacer disponible globalmente para la interfaz
    window.laserSystem = laserSystem;
});

// ==================== FUNCIONES GLOBALES PARA HTML ====================
function moveZ(direction) {
    if (window.laserSystem) {
        window.laserSystem.moveZ(direction);
    }
}

function setStepSize(size) {
    if (window.laserSystem) {
        window.laserSystem.setStepSize(size);
    }
}

function startAutoFocus() {
    if (window.laserSystem) {
        window.laserSystem.startAutoFocus();
    }
}

function executeHoming() {
    if (window.laserSystem) {
        laserSystem.executeHoming();
    }
}

function emergencyStop() {
    if (window.laserSystem) {
        laserSystem.emergencyStop();
    }
}

function savePreset() {
    const name = document.getElementById('presetName').value;
    if (window.laserSystem && name) {
        laserSystem.saveCurrentPosition(name);
        document.getElementById('presetName').value = '';
    }
}

function gotoPreset(presetKey) {
    if (window.laserSystem) {
        laserSystem.gotoPreset(presetKey);
    }
}

function setMicrostepping(value) {
    if (window.laserSystem) {
        laserSystem.setMicrostepping(value);
    }
}

function setSpeed(value) {
    if (window.laserSystem) {
        laserSystem.setSpeed(value);
    }
}




