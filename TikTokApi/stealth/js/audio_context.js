// AudioContext Fingerprint Protection
// Adds subtle noise to AudioContext to prevent audio fingerprinting

(function() {
    'use strict';

    // Generate a session-unique noise factor
    const audioNoiseFactor = 0.0001 + (Math.random() * 0.0001);

    // Store original AudioContext and OfflineAudioContext
    const OriginalAudioContext = window.AudioContext || window.webkitAudioContext;
    const OriginalOfflineAudioContext = window.OfflineAudioContext || window.webkitOfflineAudioContext;

    if (!OriginalAudioContext) {
        return; // AudioContext not supported
    }

    // Helper function to add noise to audio buffer
    function addNoiseToBuffer(buffer) {
        for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
            const channelData = buffer.getChannelData(channel);
            for (let i = 0; i < channelData.length; i++) {
                // Add very subtle noise that's imperceptible but changes fingerprint
                channelData[i] += (Math.random() - 0.5) * audioNoiseFactor;
            }
        }
        return buffer;
    }

    // Proxy for AnalyserNode.getFloatFrequencyData
    const originalGetFloatFrequencyData = AnalyserNode.prototype.getFloatFrequencyData;
    AnalyserNode.prototype.getFloatFrequencyData = function(array) {
        originalGetFloatFrequencyData.call(this, array);
        // Add subtle noise to frequency data
        for (let i = 0; i < array.length; i++) {
            array[i] += (Math.random() - 0.5) * 0.1;
        }
    };

    // Proxy for AnalyserNode.getByteFrequencyData
    const originalGetByteFrequencyData = AnalyserNode.prototype.getByteFrequencyData;
    AnalyserNode.prototype.getByteFrequencyData = function(array) {
        originalGetByteFrequencyData.call(this, array);
        // Add subtle noise to byte frequency data
        for (let i = 0; i < array.length; i++) {
            const noise = Math.floor((Math.random() - 0.5) * 2);
            array[i] = Math.max(0, Math.min(255, array[i] + noise));
        }
    };

    // Proxy for AnalyserNode.getFloatTimeDomainData
    const originalGetFloatTimeDomainData = AnalyserNode.prototype.getFloatTimeDomainData;
    AnalyserNode.prototype.getFloatTimeDomainData = function(array) {
        originalGetFloatTimeDomainData.call(this, array);
        // Add subtle noise to time domain data
        for (let i = 0; i < array.length; i++) {
            array[i] += (Math.random() - 0.5) * audioNoiseFactor;
        }
    };

    // Proxy for AnalyserNode.getByteTimeDomainData
    const originalGetByteTimeDomainData = AnalyserNode.prototype.getByteTimeDomainData;
    AnalyserNode.prototype.getByteTimeDomainData = function(array) {
        originalGetByteTimeDomainData.call(this, array);
        // Add subtle noise
        for (let i = 0; i < array.length; i++) {
            const noise = Math.floor((Math.random() - 0.5) * 2);
            array[i] = Math.max(0, Math.min(255, array[i] + noise));
        }
    };

    // Wrap OfflineAudioContext to add noise to rendered buffer
    if (OriginalOfflineAudioContext) {
        const OfflineAudioContextProxy = function(numberOfChannels, length, sampleRate) {
            const context = new OriginalOfflineAudioContext(numberOfChannels, length, sampleRate);

            // Store original startRendering
            const originalStartRendering = context.startRendering.bind(context);

            // Override startRendering to add noise to the result
            context.startRendering = function() {
                return originalStartRendering().then(function(renderedBuffer) {
                    // Add noise to the rendered buffer
                    return addNoiseToBuffer(renderedBuffer);
                });
            };

            return context;
        };

        // Copy prototype
        OfflineAudioContextProxy.prototype = OriginalOfflineAudioContext.prototype;

        // Replace global OfflineAudioContext
        Object.defineProperty(window, 'OfflineAudioContext', {
            value: OfflineAudioContextProxy,
            writable: true,
            configurable: true
        });

        if (window.webkitOfflineAudioContext) {
            Object.defineProperty(window, 'webkitOfflineAudioContext', {
                value: OfflineAudioContextProxy,
                writable: true,
                configurable: true
            });
        }
    }

    // Make modified methods appear native
    const nativeToString = function() {
        return 'function ' + this.name + '() { [native code] }';
    };

    AnalyserNode.prototype.getFloatFrequencyData.toString = nativeToString.bind({ name: 'getFloatFrequencyData' });
    AnalyserNode.prototype.getByteFrequencyData.toString = nativeToString.bind({ name: 'getByteFrequencyData' });
    AnalyserNode.prototype.getFloatTimeDomainData.toString = nativeToString.bind({ name: 'getFloatTimeDomainData' });
    AnalyserNode.prototype.getByteTimeDomainData.toString = nativeToString.bind({ name: 'getByteTimeDomainData' });

    console.log('[Stealth] AudioContext fingerprint protection applied');
})();




