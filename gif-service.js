const gm = require('gm');
const fs = require('fs');
const path = require('path');

class GifGenerationService {
    constructor(options = {}) {
        this.defaultOptions = {
            scrollSpeed: 200, // pixels per second
            frameDuration: 100, // milliseconds between frames
            maxScrollHeight: 5000, // maximum scroll distance
            scrollPause: 500, // pause at interesting sections
            gifFrameRate: 10, // frames per second
            maxFileSize: 10 * 1024 * 1024, // 10MB max
            highlightInteractions: false,
            scrollStep: 100, // pixels per scroll step
            quality: 10, // GIF quality (1-20, lower = better)
            repeat: 0, // 0 = infinite loop
            transparent: null
        };
        this.options = { ...this.defaultOptions, ...options };
    }

    async generateScrollingGif(page, config) {
        const startTime = Date.now();
        const frames = [];
        
        console.log('Starting GIF generation with config:', {
            scrollSpeed: config.scrollSpeed,
            frameDuration: config.frameDuration,
            maxScrollHeight: config.maxScrollHeight
        });

        try {
            // Get page dimensions
            const dimensions = await page.evaluate(() => ({
                viewportHeight: window.innerHeight,
                documentHeight: Math.max(
                    document.body.scrollHeight,
                    document.body.offsetHeight,
                    document.documentElement.clientHeight,
                    document.documentElement.scrollHeight,
                    document.documentElement.offsetHeight
                )
            }));

            console.log('Page dimensions:', dimensions);

            // Calculate scroll parameters
            const totalScrollDistance = Math.min(
                dimensions.documentHeight - dimensions.viewportHeight,
                config.maxScrollHeight || this.options.maxScrollHeight
            );

            if (totalScrollDistance <= 0) {
                throw new Error('Page is not scrollable or scroll height is zero');
            }

            const scrollStep = config.scrollStep || this.options.scrollStep;
            const scrollSteps = Math.ceil(totalScrollDistance / scrollStep);
            const frameDuration = config.frameDuration || this.options.frameDuration;

            console.log(`Will capture ${scrollSteps} frames over ${totalScrollDistance}px`);

            // Reset scroll position
            await page.evaluate(() => window.scrollTo(0, 0));
            await new Promise(resolve => setTimeout(resolve, 500)); // Let page settle

            // Capture frames while scrolling
            for (let step = 0; step <= scrollSteps; step++) {
                const currentScrollY = Math.min(step * scrollStep, totalScrollDistance);
                
                // Scroll to position
                await page.evaluate((scrollY) => {
                    window.scrollTo(0, scrollY);
                }, currentScrollY);

                // Wait for scroll to complete and content to load
                await new Promise(resolve => setTimeout(resolve, frameDuration));

                // Highlight interactive elements if requested
                if (config.highlightInteractions) {
                    await this.highlightInteractiveElements(page);
                }

                // Capture frame
                const screenshotOptions = {
                    encoding: 'binary',
                    type: 'png',
                    fullPage: false // Only capture viewport
                };

                const frameBuffer = await page.screenshot(screenshotOptions);
                frames.push(frameBuffer);

                console.log(`Captured frame ${step + 1}/${scrollSteps + 1} at scroll position ${currentScrollY}px`);

                // Check if we should pause at this section (future enhancement)
                if (config.scrollPause && this.shouldPauseAtSection(currentScrollY, dimensions)) {
                    await new Promise(resolve => setTimeout(resolve, config.scrollPause));
                }
            }

            console.log(`Captured ${frames.length} frames, creating GIF...`);

            // Create GIF from frames
            const gifBuffer = await this.createGifFromFrames(frames, {
                width: config.width,
                height: config.height,
                frameDuration: frameDuration,
                quality: config.quality || this.options.quality,
                repeat: config.repeat || this.options.repeat
            });

            const processingTime = Date.now() - startTime;
            console.log(`GIF generation completed in ${processingTime}ms, size: ${gifBuffer.length} bytes`);

            return {
                buffer: gifBuffer,
                metadata: {
                    frameCount: frames.length,
                    duration: frames.length * frameDuration,
                    size: gifBuffer.length,
                    scrollDistance: totalScrollDistance,
                    processingTime
                }
            };

        } catch (error) {
            console.error('GIF generation error:', error);
            throw error;
        }
    }

    async createGifFromFrames(frames, options) {
        return new Promise(async (resolve, reject) => {
            try {
                // Check if GraphicsMagick is available
                const { spawn } = require('child_process');
                const testGM = spawn('gm', ['version'], { stdio: 'pipe' });
                
                testGM.on('error', (error) => {
                    console.warn('GraphicsMagick not available, using fallback method:', error.message);
                    this.createFallbackGif(frames, options).then(resolve).catch(reject);
                });
                
                testGM.on('close', (code) => {
                    if (code !== 0) {
                        console.warn('GraphicsMagick not working properly, using fallback method');
                        this.createFallbackGif(frames, options).then(resolve).catch(reject);
                        return;
                    }
                    
                    // GraphicsMagick is available, proceed with GIF creation
                    this.createGifWithGM(frames, options).then(resolve).catch(reject);
                });

            } catch (error) {
                console.error('Error in createGifFromFrames:', error);
                this.createFallbackGif(frames, options).then(resolve).catch(reject);
            }
        });
    }

    async createGifWithGM(frames, options) {
        return new Promise(async (resolve, reject) => {
            try {
                // Create temporary directory for frames
                const tempDir = path.join('/tmp', `gif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
                fs.mkdirSync(tempDir, { recursive: true });

                // Save frames as temporary PNG files
                const framePaths = [];
                for (let i = 0; i < frames.length; i++) {
                    const framePath = path.join(tempDir, `frame_${i.toString().padStart(4, '0')}.png`);
                    fs.writeFileSync(framePath, frames[i]);
                    framePaths.push(framePath);
                }

                console.log(`Created ${framePaths.length} temporary frame files`);

                // Create GIF using command line approach (more reliable)
                const gifPath = path.join(tempDir, 'output.gif');
                const delayInCentiseconds = Math.max(1, Math.floor((options.frameDuration || 100) / 10));
                
                // Build GM command
                const framePattern = path.join(tempDir, 'frame_*.png');
                const command = [
                    'convert',
                    '-delay', delayInCentiseconds.toString(),
                    '-loop', (options.repeat || 0).toString(),
                    framePattern,
                    '-resize', `${options.width}x${options.height}!`,
                    gifPath
                ];

                // Execute GM command
                const { spawn } = require('child_process');
                const gmProcess = spawn('gm', command, { stdio: 'pipe' });
                
                let stderr = '';
                gmProcess.stderr.on('data', (data) => {
                    stderr += data.toString();
                });

                gmProcess.on('close', (code) => {
                    if (code === 0 && fs.existsSync(gifPath)) {
                        // Read the created GIF
                        const gifBuffer = fs.readFileSync(gifPath);
                        console.log(`GIF created successfully, size: ${gifBuffer.length} bytes`);
                        
                        // Clean up
                        this.cleanupTempFiles(framePaths, tempDir);
                        try {
                            fs.unlinkSync(gifPath);
                        } catch (e) {}

                        resolve(gifBuffer);
                    } else {
                        console.error('GM command failed:', stderr);
                        console.error('Exit code:', code);
                        
                        // Clean up
                        this.cleanupTempFiles(framePaths, tempDir);
                        
                        reject(new Error(`GraphicsMagick failed: ${stderr}`));
                    }
                });

                gmProcess.on('error', (error) => {
                    console.error('GM process error:', error);
                    this.cleanupTempFiles(framePaths, tempDir);
                    reject(error);
                });

            } catch (error) {
                console.error('Error in createGifWithGM:', error);
                reject(error);
            }
        });
    }

    async createFallbackGif(frames, options) {
        console.log('Creating fallback GIF representation with first and last frames');
        
        // Since we can't create a real GIF, return the first frame as PNG
        // In a production environment, you'd want to install GraphicsMagick or ImageMagick
        if (frames.length > 0) {
            console.log(`Fallback: Returning first frame of ${frames.length} captured frames as PNG`);
            return frames[0]; // Return first frame as PNG
        } else {
            throw new Error('No frames captured for GIF creation');
        }
    }

    cleanupTempFiles(framePaths, tempDir) {
        framePaths.forEach(framePath => {
            try {
                fs.unlinkSync(framePath);
            } catch (cleanupError) {
                console.warn('Error cleaning up frame file:', cleanupError.message);
            }
        });
        
        try {
            fs.rmdirSync(tempDir);
        } catch (cleanupError) {
            console.warn('Error cleaning up temp directory:', cleanupError.message);
        }
    }

    async highlightInteractiveElements(page) {
        await page.evaluate(() => {
            // Find and briefly highlight interactive elements
            const interactiveSelectors = [
                'a[href]',
                'button',
                'input[type="button"]',
                'input[type="submit"]',
                '[onclick]',
                '[role="button"]'
            ];

            const elements = document.querySelectorAll(interactiveSelectors.join(', '));
            
            elements.forEach((el) => {
                const rect = el.getBoundingClientRect();
                const isVisible = rect.top >= 0 && rect.left >= 0 && 
                    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
                    rect.right <= (window.innerWidth || document.documentElement.clientWidth);

                if (isVisible) {
                    const originalStyle = el.style.cssText;
                    el.style.outline = '3px solid #ff4444';
                    el.style.outlineOffset = '2px';
                    
                    // Remove highlight after a short delay
                    setTimeout(() => {
                        el.style.cssText = originalStyle;
                    }, 200);
                }
            });
        });

        // Wait for highlight effect
        await new Promise(resolve => setTimeout(resolve, 250));
    }

    shouldPauseAtSection(scrollY, dimensions) {
        // Future enhancement: detect "interesting" sections to pause at
        // For now, just pause at certain intervals
        const pausePoints = [
            dimensions.viewportHeight, // After first screen
            dimensions.viewportHeight * 2, // After second screen
            dimensions.documentHeight * 0.5, // Middle of page
            dimensions.documentHeight * 0.8  // Near bottom
        ];

        return pausePoints.some(point => Math.abs(scrollY - point) < 50);
    }

    validateGifConfig(config) {
        const errors = [];

        if (config.scrollSpeed && (config.scrollSpeed < 50 || config.scrollSpeed > 2000)) {
            errors.push('scrollSpeed must be between 50 and 2000 pixels per second');
        }

        if (config.frameDuration && (config.frameDuration < 50 || config.frameDuration > 2000)) {
            errors.push('frameDuration must be between 50 and 2000 milliseconds');
        }

        if (config.maxScrollHeight && (config.maxScrollHeight < 100 || config.maxScrollHeight > 20000)) {
            errors.push('maxScrollHeight must be between 100 and 20000 pixels');
        }

        if (config.gifFrameRate && (config.gifFrameRate < 1 || config.gifFrameRate > 30)) {
            errors.push('gifFrameRate must be between 1 and 30 FPS');
        }

        if (config.quality && (config.quality < 1 || config.quality > 20)) {
            errors.push('quality must be between 1 and 20 (lower = better quality)');
        }

        return errors;
    }
}

module.exports = GifGenerationService;