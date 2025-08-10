const gm = require('gm');
const fs = require('fs');
const path = require('path');

async function createSimpleGif() {
    console.log('🧪 Testing simple GIF creation without fonts...');
    
    try {
        // Create temp directory
        const tempDir = '/tmp/simple_gif_test';
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
        
        // Create 3 simple colored frames without text
        const colors = ['red', 'green', 'blue'];
        const framePaths = [];
        
        for (let i = 0; i < colors.length; i++) {
            const framePath = path.join(tempDir, `frame_${i}.png`);
            
            await new Promise((resolve, reject) => {
                gm(200, 150, colors[i])
                    .write(framePath, (err) => {
                        if (err) {
                            console.error(`Error creating frame ${i}:`, err.message);
                            reject(err);
                        } else {
                            console.log(`✅ Created frame ${i}: ${colors[i]}`);
                            resolve();
                        }
                    });
            });
            
            framePaths.push(framePath);
        }
        
        // Create animated GIF from frames
        console.log('Creating animated GIF from frames...');
        
        const gifBuffer = await new Promise((resolve, reject) => {
            let gmCommand = gm();
            
            // Add all frames
            framePaths.forEach(framePath => {
                gmCommand = gmCommand.in(framePath);
            });
            
            // Configure and create GIF
            gmCommand
                .delay(50) // 0.5 seconds per frame
                .loop(0) // Infinite loop
                .toBuffer('GIF', (err, buffer) => {
                    // Clean up frame files
                    framePaths.forEach(path => {
                        try {
                            fs.unlinkSync(path);
                        } catch (e) {}
                    });
                    
                    try {
                        fs.rmdirSync(tempDir);
                    } catch (e) {}
                    
                    if (err) {
                        console.error('GIF creation error:', err.message);
                        reject(err);
                    } else {
                        resolve(buffer);
                    }
                });
        });
        
        // Check if we got a valid GIF
        console.log(`✅ GIF created: ${gifBuffer.length} bytes`);
        console.log(`   Header check: ${gifBuffer[0] === 0x47 && gifBuffer[1] === 0x49 ? 'Valid GIF87a/89a' : 'Invalid GIF'}`);
        
        // Save test GIF
        const outputPath = '/tmp/working_test.gif';
        fs.writeFileSync(outputPath, gifBuffer);
        console.log(`✅ Test GIF saved: ${outputPath}`);
        
        return gifBuffer;
        
    } catch (error) {
        console.error('❌ Simple GIF test failed:', error.message);
        throw error;
    }
}

// Test with actual PNG files (simulate screenshot scenario)
async function testWithRealPngs() {
    console.log('\n🎬 Testing with actual PNG buffers (screenshot simulation)...');
    
    try {
        // First create some PNG files
        const pngBuffers = [];
        const tempPngs = [];
        
        for (let i = 0; i < 3; i++) {
            const tempPngPath = `/tmp/test_png_${i}.png`;
            
            // Create PNG file
            await new Promise((resolve, reject) => {
                const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1'];
                gm(400, 300, colors[i])
                    .write(tempPngPath, (err) => {
                        if (err) reject(err);
                        else resolve();
                    });
            });
            
            // Read back as buffer (this simulates what we get from page.screenshot())
            const pngBuffer = fs.readFileSync(tempPngPath);
            pngBuffers.push(pngBuffer);
            tempPngs.push(tempPngPath);
            
            console.log(`✅ Created PNG buffer ${i}: ${pngBuffer.length} bytes`);
        }
        
        // Now create GIF from these PNG buffers (real scenario)
        const tempDir = '/tmp/gif_from_real_pngs';
        fs.mkdirSync(tempDir, { recursive: true });
        
        // Write PNG buffers to temp files
        const framePaths = [];
        for (let i = 0; i < pngBuffers.length; i++) {
            const framePath = path.join(tempDir, `frame_${i.toString().padStart(3, '0')}.png`);
            fs.writeFileSync(framePath, pngBuffers[i]);
            framePaths.push(framePath);
        }
        
        // Create GIF
        const gifBuffer = await new Promise((resolve, reject) => {
            let gmCommand = gm();
            
            framePaths.forEach(framePath => {
                gmCommand = gmCommand.in(framePath);
            });
            
            gmCommand
                .delay(30) // 0.3 seconds per frame
                .loop(0)
                .resize(400, 300, '!') // Force exact size
                .toBuffer('GIF', (err, buffer) => {
                    // Cleanup
                    framePaths.forEach(path => {
                        try { fs.unlinkSync(path); } catch(e) {}
                    });
                    try { fs.rmdirSync(tempDir); } catch(e) {}
                    
                    // Cleanup temp PNGs
                    tempPngs.forEach(path => {
                        try { fs.unlinkSync(path); } catch(e) {}
                    });
                    
                    if (err) reject(err);
                    else resolve(buffer);
                });
        });
        
        console.log(`✅ Created GIF from PNG buffers: ${gifBuffer.length} bytes`);
        
        // Save final test
        fs.writeFileSync('/tmp/final_test.gif', gifBuffer);
        console.log('✅ Final test GIF: /tmp/final_test.gif');
        
        return gifBuffer;
        
    } catch (error) {
        console.error('❌ PNG buffer test failed:', error.message);
        throw error;
    }
}

async function main() {
    try {
        console.log('🚀 Starting Simple GIF Tests\n');
        
        await createSimpleGif();
        await testWithRealPngs();
        
        console.log('\n🎉 All tests passed! GraphicsMagick GIF creation is working.');
        console.log('\n📋 Ready to integrate with screenshot service.');
        
    } catch (error) {
        console.error('\n❌ Tests failed:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { createSimpleGif, testWithRealPngs };