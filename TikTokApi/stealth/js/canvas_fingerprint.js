// Canvas Fingerprint Randomization
// Adds subtle noise to canvas rendering to prevent fingerprint tracking

(function() {
    'use strict';

    // Generate a session-unique noise seed
    // This ensures the same noise is applied consistently within a session
    // but differs between sessions
    const noiseSeed = Math.floor(Math.random() * 1000000);

    // Simple seeded random number generator for consistent noise
    function seededRandom(seed) {
        const x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
    }

    // Get a noise value for a specific position
    function getNoise(x, y, channel) {
        const seed = noiseSeed + x * 1000 + y + channel * 100;
        // Very small noise: -2 to +2 (out of 0-255 range)
        return Math.floor(seededRandom(seed) * 5) - 2;
    }

    // Store original methods
    const originalGetImageData = CanvasRenderingContext2D.prototype.getImageData;
    const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
    const originalToBlob = HTMLCanvasElement.prototype.toBlob;

    // Also handle WebGL contexts
    const originalWebGLReadPixels = WebGLRenderingContext.prototype.readPixels;
    const originalWebGL2ReadPixels = WebGL2RenderingContext.prototype.readPixels;

    // Override getImageData to add noise
    CanvasRenderingContext2D.prototype.getImageData = function(sx, sy, sw, sh) {
        const imageData = originalGetImageData.call(this, sx, sy, sw, sh);

        // Add subtle noise to the pixel data
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            const pixelIndex = i / 4;
            const x = pixelIndex % sw;
            const y = Math.floor(pixelIndex / sw);

            // Add noise to RGB channels (not alpha)
            // Only modify a small percentage of pixels to be subtle
            if (seededRandom(noiseSeed + i) < 0.1) {  // 10% of pixels
                data[i] = Math.max(0, Math.min(255, data[i] + getNoise(x, y, 0)));      // R
                data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + getNoise(x, y, 1)));  // G
                data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + getNoise(x, y, 2)));  // B
                // Alpha (data[i + 3]) is left unchanged
            }
        }

        return imageData;
    };

    // Override toDataURL to ensure noise is applied
    HTMLCanvasElement.prototype.toDataURL = function(type, quality) {
        // For 2D canvases, we need to get the context and apply noise
        const context = this.getContext('2d');
        if (context) {
            // The noise will be applied when reading via getImageData
            // We create a slightly modified canvas
            const width = this.width;
            const height = this.height;

            if (width > 0 && height > 0) {
                try {
                    // Get and put image data to trigger our noise injection
                    const imageData = context.getImageData(0, 0, width, height);
                    // Create a temporary canvas for the noisy version
                    const tempCanvas = document.createElement('canvas');
                    tempCanvas.width = width;
                    tempCanvas.height = height;
                    const tempContext = tempCanvas.getContext('2d');

                    // Use the original putImageData to avoid any hooks
                    tempContext.putImageData(imageData, 0, 0);

                    // Now call original toDataURL on the temp canvas
                    return originalToDataURL.call(tempCanvas, type, quality);
                } catch (e) {
                    // Security error or other issue - fall back to original
                    return originalToDataURL.call(this, type, quality);
                }
            }
        }

        // Fall back to original for WebGL or empty canvases
        return originalToDataURL.call(this, type, quality);
    };

    // Override toBlob similarly
    HTMLCanvasElement.prototype.toBlob = function(callback, type, quality) {
        const context = this.getContext('2d');
        if (context) {
            const width = this.width;
            const height = this.height;

            if (width > 0 && height > 0) {
                try {
                    const imageData = context.getImageData(0, 0, width, height);
                    const tempCanvas = document.createElement('canvas');
                    tempCanvas.width = width;
                    tempCanvas.height = height;
                    const tempContext = tempCanvas.getContext('2d');
                    tempContext.putImageData(imageData, 0, 0);

                    return originalToBlob.call(tempCanvas, callback, type, quality);
                } catch (e) {
                    return originalToBlob.call(this, callback, type, quality);
                }
            }
        }

        return originalToBlob.call(this, callback, type, quality);
    };

    // Add noise to WebGL readPixels
    function addNoiseToReadPixels(originalFn) {
        return function(x, y, width, height, format, type, pixels) {
            originalFn.call(this, x, y, width, height, format, type, pixels);

            // Only add noise if pixels is a typed array
            if (pixels && pixels.length) {
                const componentsPerPixel = format === 0x1908 ? 4 : 3;  // RGBA vs RGB

                for (let i = 0; i < pixels.length; i += componentsPerPixel) {
                    const pixelIndex = i / componentsPerPixel;
                    const px = pixelIndex % width;
                    const py = Math.floor(pixelIndex / width);

                    // Add noise to a subset of pixels
                    if (seededRandom(noiseSeed + i + 50000) < 0.1) {
                        if (type === 0x1401) {  // UNSIGNED_BYTE
                            pixels[i] = Math.max(0, Math.min(255, pixels[i] + getNoise(px, py, 0)));
                            pixels[i + 1] = Math.max(0, Math.min(255, pixels[i + 1] + getNoise(px, py, 1)));
                            pixels[i + 2] = Math.max(0, Math.min(255, pixels[i + 2] + getNoise(px, py, 2)));
                        }
                    }
                }
            }
        };
    }

    WebGLRenderingContext.prototype.readPixels = addNoiseToReadPixels(originalWebGLReadPixels);
    WebGL2RenderingContext.prototype.readPixels = addNoiseToReadPixels(originalWebGL2ReadPixels);

    // Make toString look native
    const nativeToString = function() {
        return 'function ' + this.name + '() { [native code] }';
    };

    // Patch toString for our overridden methods
    CanvasRenderingContext2D.prototype.getImageData.toString = nativeToString.bind({ name: 'getImageData' });
    HTMLCanvasElement.prototype.toDataURL.toString = nativeToString.bind({ name: 'toDataURL' });
    HTMLCanvasElement.prototype.toBlob.toString = nativeToString.bind({ name: 'toBlob' });

    console.log('[Stealth] Canvas fingerprint randomization applied');
})();

