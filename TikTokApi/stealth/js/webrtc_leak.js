// WebRTC Leak Prevention
// Prevents WebRTC from leaking real IP addresses when using proxies

(function() {
    'use strict';

    // Store original constructors
    const originalRTCPeerConnection = window.RTCPeerConnection ||
        window.webkitRTCPeerConnection ||
        window.mozRTCPeerConnection;

    // If RTCPeerConnection doesn't exist, nothing to do
    if (!originalRTCPeerConnection) {
        return;
    }

    // Create a proxy for RTCPeerConnection that filters ICE candidates
    const RTCPeerConnectionProxy = function(config, constraints) {
        // Modify the ICE servers configuration to prevent STUN/TURN server connections
        // that would reveal the real IP
        const modifiedConfig = config ? { ...config } : {};

        // Remove iceServers or set to empty to prevent external IP discovery
        // This may break some WebRTC functionality, but prevents IP leaks
        if (modifiedConfig.iceServers) {
            modifiedConfig.iceServers = [];
        }

        // Create the real connection with modified config
        const pc = new originalRTCPeerConnection(modifiedConfig, constraints);

        // Store original methods
        const originalSetLocalDescription = pc.setLocalDescription.bind(pc);

        // Wrap setLocalDescription to modify the SDP
        pc.setLocalDescription = async function(description) {
            if (description && description.sdp) {
                // Remove IP addresses from SDP
                let sdp = description.sdp;

                // Replace real IPs in candidate lines with 0.0.0.0
                sdp = sdp.replace(
                    /a=candidate:[^\r\n]*/g,
                    (match) => {
                        // Keep only relay candidates, filter host and srflx
                        if (match.includes(' host ') || match.includes(' srflx ')) {
                            return '';  // Remove the line
                        }
                        return match;
                    }
                );

                // Remove empty lines created by removing candidates
                sdp = sdp.replace(/\r\n\r\n+/g, '\r\n');

                description = new RTCSessionDescription({
                    type: description.type,
                    sdp: sdp
                });
            }
            return originalSetLocalDescription(description);
        };

        return pc;
    };

    // Copy static properties and prototype
    RTCPeerConnectionProxy.prototype = originalRTCPeerConnection.prototype;

    // Replace the global RTCPeerConnection
    Object.defineProperty(window, 'RTCPeerConnection', {
        value: RTCPeerConnectionProxy,
        writable: true,
        configurable: true
    });

    // Also handle webkit prefix
    if (window.webkitRTCPeerConnection) {
        Object.defineProperty(window, 'webkitRTCPeerConnection', {
            value: RTCPeerConnectionProxy,
            writable: true,
            configurable: true
        });
    }

    // Handle mozRTCPeerConnection for Firefox
    if (window.mozRTCPeerConnection) {
        Object.defineProperty(window, 'mozRTCPeerConnection', {
            value: RTCPeerConnectionProxy,
            writable: true,
            configurable: true
        });
    }

    console.log('[Stealth] WebRTC leak prevention applied');
})();


