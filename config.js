// config.js - Configuración del Sistema Laser ESP32
// Este archivo centraliza todas las configuraciones

const ESP32Config = {
    // ==================== BLUETOOTH BLE ====================
    SERVICE_UUID: '4fafc201-1fb5-459e-8fcc-c5c9c331914b',
    CHARACTERISTIC_UUID: 'beb5483e-36e1-4688-b7f5-ea07361b26a8',
    DEVICE_NAME: 'ESP32_Laser_Control',
    
    // ==================== WIFI ====================
    WIFI: {
        SSID: 'ESP32_Laser',
        PASSWORD: '12345678',
        PORT: 81,
        TIMEOUT: 5000
    },
    
    // ==================== COMANDOS PROTOCOLO ====================
    COMMANDS: {
        MOVE: 'MOVE',
        HOME: 'HOMING_START',
        STOP: 'EMERGENCY_STOP',
        GET_POSITION: 'GET_POSITION',
        GET_SENSOR: 'GET_SENSOR',
        SET_SPEED: 'SET_SPEED',
        SET_MICROSTEP: 'SET_MICROSTEP',
        RESET_EMERGENCY: 'RESET_EMERGENCY'
    },
    
    // ==================== MOTOR (NEMA17 + DRV8825) ====================
    MOTOR: {
        STEPS_PER_REV: 200,      // NEMA17 típico
        MICROSTEPPING: 16,       // DRV8825 en 1/16
        MM_PER_REV: 2.0,         // Tornillo 2mm por vuelta
        MAX_SPEED: 1000,         // steps/segundo máximo
        ACCELERATION: 500,       // steps/segundo²
        
        // Pines ESP32 (cambia según tu conexión)
        PINS: {
            STEP: 26,
            DIR: 25,
            ENABLE: 27
        }
    },
    
    // ==================== SENSOR ULTRASÓNICO ====================
    SENSOR: {
        TRIG_PIN: 32,
        ECHO_PIN: 33,
        UPDATE_INTERVAL: 100,    // ms entre lecturas
        SMOOTHING_SAMPLES: 5,    // muestras para promedio
        MIN_DISTANCE: 10,        // mm
        MAX_DISTANCE: 500,       // mm
        TIMEOUT: 30000           // μs timeout para pulseIn
    },
    
    // ==================== FIN DE CARRERA ====================
    ENDSTOP: {
        PIN: 34,
        PULLUP: true
    },
    
    // ==================== PRESETS ====================
    PRESETS: {
        'foco': { position: 100, name: 'Punto Foco' },      // 10mm en steps
        'grabado': { position: 250, name: 'Modo Grabado' }, // 25mm en steps  
        'corte': { position: 400, name: 'Modo Corte' }      // 40mm en steps
    },
    
    // ==================== CÁLCULOS AUTOMÁTICOS ====================
    get STEPS_PER_MM() {
        return (this.MOTOR.STEPS_PER_REV * this.MOTOR.MICROSTEPPING) / this.MOTOR.MM_PER_REV;
    },
    
    get MAX_SPEED_MM_S() {
        return this.MOTOR.MAX_SPEED / this.STEPS_PER_MM;
    }
};

// ==================== FUNCIONES DE CONVERSIÓN ====================
ESP32Config.mmToSteps = function(mm) {
    return Math.round(mm * this.STEPS_PER_MM);
};

ESP32Config.stepsToMM = function(steps) {
    return steps / this.STEPS_PER_MM;
};

ESP32Config.getStepSize = function(stepMM) {
    return this.mmToSteps(stepMM);
};

// ==================== VALIDACIÓN ====================
ESP32Config.validateConfig = function() {
    const errors = [];
    
    if (this.STEPS_PER_MM <= 0) {
        errors.push('STEPS_PER_MM debe ser mayor a 0');
    }
    
    if (!this.SERVICE_UUID || !this.CHARACTERISTIC_UUID) {
        errors.push('UUIDs de Bluetooth no configurados');
    }
    
    if (errors.length > 0) {
        console.error('❌ Errores en config.js:', errors);
        return false;
    }
    
    console.log('✅ Configuración validada correctamente');
    console.log(`📐 Steps por mm: ${this.STEPS_PER_MM}`);
    console.log(`🚀 Velocidad máxima: ${this.MAX_SPEED_MM_S.toFixed(1)} mm/s`);
    
    return true;
};

// Validar al cargar
ESP32Config.validateConfig();

// Hacer disponible globalmente
window.ESP32Config = ESP32Config;


console.log('⚙️ config.js cargado - Sistema Laser ESP32');
