// Navigator Device Memory and Connection API Spoofing
// Makes headless browsers appear as normal desktop systems

(function() {
    'use strict';

    // =================================================================
    // Device Memory Spoofing
    // =================================================================
    // navigator.deviceMemory returns the amount of RAM in GB (rounded to power of 2)
    // Headless browsers sometimes report unusual values or undefined

    // Typical values: 0.25, 0.5, 1, 2, 4, 8, 16, 32 (GB)
    // We use 8 GB as it's common for modern Macs
    const spoofedDeviceMemory = 8;

    Object.defineProperty(navigator, 'deviceMemory', {
        get: function() {
            return spoofedDeviceMemory;
        },
        enumerable: true,
        configurable: true
    });

    // =================================================================
    // Navigator Connection API Spoofing
    // =================================================================
    // The Network Information API can reveal container/VM network characteristics
    // Real browsers show WiFi/ethernet with typical speeds

    const connectionInfo = {
        // Effective connection type (4g, 3g, 2g, slow-2g)
        effectiveType: '4g',

        // Round-trip time in milliseconds (lower is better)
        // 50-100ms is typical for good WiFi/broadband
        rtt: 50,

        // Downlink bandwidth in Mbps
        // 10+ is typical for good connections
        downlink: 10,

        // Whether the user has requested reduced data usage
        saveData: false,

        // Connection type (wifi, cellular, ethernet, none, unknown)
        type: 'wifi',

        // Maximum downlink speed in Mbps
        downlinkMax: Infinity,

        // Event handlers
        onchange: null,
        ontypechange: null
    };

    // Create a proper NetworkInformation-like object
    const networkInfo = {
        get effectiveType() { return connectionInfo.effectiveType; },
        get rtt() { return connectionInfo.rtt; },
        get downlink() { return connectionInfo.downlink; },
        get saveData() { return connectionInfo.saveData; },
        get type() { return connectionInfo.type; },
        get downlinkMax() { return connectionInfo.downlinkMax; },
        get onchange() { return connectionInfo.onchange; },
        set onchange(v) { connectionInfo.onchange = v; },
        get ontypechange() { return connectionInfo.ontypechange; },
        set ontypechange(v) { connectionInfo.ontypechange = v; },
        addEventListener: function() {},
        removeEventListener: function() {},
        dispatchEvent: function() { return true; }
    };

    // Set prototype to NetworkInformation if it exists
    if (typeof NetworkInformation !== 'undefined') {
        Object.setPrototypeOf(networkInfo, NetworkInformation.prototype);
    }

    // Override navigator.connection
    Object.defineProperty(navigator, 'connection', {
        get: function() {
            return networkInfo;
        },
        enumerable: true,
        configurable: true
    });

    // Also handle mozConnection and webkitConnection for browser compatibility
    Object.defineProperty(navigator, 'mozConnection', {
        get: function() {
            return networkInfo;
        },
        enumerable: true,
        configurable: true
    });

    Object.defineProperty(navigator, 'webkitConnection', {
        get: function() {
            return networkInfo;
        },
        enumerable: true,
        configurable: true
    });

    // =================================================================
    // Battery API Spoofing (getBattery)
    // =================================================================
    // Battery status can reveal desktop vs laptop vs VM
    // We report as a laptop on AC power (common for Mac users)

    const batteryInfo = {
        charging: true,           // Connected to power
        chargingTime: 0,          // Already charged
        dischargingTime: Infinity, // Not discharging (on AC)
        level: 1.0,               // 100% battery
        onchargingchange: null,
        onchargingtimechange: null,
        ondischargingtimechange: null,
        onlevelchange: null,
        addEventListener: function() {},
        removeEventListener: function() {},
        dispatchEvent: function() { return true; }
    };

    // Set prototype to BatteryManager if it exists
    if (typeof BatteryManager !== 'undefined') {
        Object.setPrototypeOf(batteryInfo, BatteryManager.prototype);
    }

    // Override navigator.getBattery
    if (navigator.getBattery) {
        navigator.getBattery = function() {
            return Promise.resolve(batteryInfo);
        };
    }

    // =================================================================
    // Max Touch Points (Desktop vs Mobile)
    // =================================================================
    // Desktops should have 0 touch points
    // Some headless configs incorrectly report touch support

    Object.defineProperty(navigator, 'maxTouchPoints', {
        get: function() {
            return 0;  // Desktop Mac has no touch
        },
        enumerable: true,
        configurable: true
    });

    // =================================================================
    // Online Status
    // =================================================================
    // Ensure online status is true

    Object.defineProperty(navigator, 'onLine', {
        get: function() {
            return true;
        },
        enumerable: true,
        configurable: true
    });

    // =================================================================
    // Do Not Track
    // =================================================================
    // Most users don't have DNT enabled, but some automation sets it

    Object.defineProperty(navigator, 'doNotTrack', {
        get: function() {
            return null;  // Not set (most common)
        },
        enumerable: true,
        configurable: true
    });

    console.log('[Stealth] Navigator device memory and connection spoofing applied');
})();




