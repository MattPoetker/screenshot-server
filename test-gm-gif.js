const gm = require('gm');
const fs = require('fs');
const path = require('path');

// Test GraphicsMagick GIF creation in isolation
async function testGraphicsMagick() {
    console.log('🧪 Testing GraphicsMagick GIF creation...');
    
    try {
        // Test 1: Check if GraphicsMagick is available
        console.log('1. Testing GraphicsMagick availability...');
        const { spawn } = require('child_process');
        
        const testGM = new Promise((resolve, reject) => {
            const gmProcess = spawn('gm', ['version'], { stdio: 'pipe' });
            
            let output = '';
            gmProcess.stdout.on('data', (data) => {
                output += data.toString();
            });
            
            gmProcess.on('error', (error) => {
                reject(error);
            });
            
            gmProcess.on('close', (code) => {
                if (code === 0) {
                    resolve(output);
                } else {
                    reject(new Error(`GM exited with code ${code}`));
                }
            });
        });
        
        try {
            const gmVersion = await testGM;
            console.log('✅ GraphicsMagick available:', gmVersion.split('\n')[0]);
        } catch (error) {
            console.log('❌ GraphicsMagick not available:', error.message);
            return false;
        }
        
        // Test 2: Create simple test images
        console.log('\n2. Creating test frame images...');
        
        const tempDir = '/tmp/gif_test';
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
        
        // Create 3 simple test images using GraphicsMagick
        const frameFiles = [];
        for (let i = 0; i < 3; i++) {
            const framePath = path.join(tempDir, `frame_${i}.png`);
            
            await new Promise((resolve, reject) => {
                gm(200, 150, `#${i === 0 ? 'ff0000' : i === 1 ? '00ff00' : '0000ff'}`)
                    .fontSize(30)
                    .fill('white')
                    .drawText(50, 80, `Frame ${i + 1}`)
                    .write(framePath, (err) => {
                        if (err) reject(err);
                        else resolve();
                    });
            });
            
            frameFiles.push(framePath);
            console.log(`✅ Created frame: ${framePath}`);
        }
        
        // Test 3: Create animated GIF
        console.log('\n3. Creating animated GIF...');
        
        const gifPath = path.join(tempDir, 'test.gif');
        
        await new Promise((resolve, reject) => {
            let gmCommand = gm();
            
            frameFiles.forEach(framePath => {
                gmCommand = gmCommand.in(framePath);
            });
            
            gmCommand
                .delay(50) // 50 centiseconds = 0.5 seconds
                .loop(0) // Infinite loop
                .write(gifPath, (err) => {
                    if (err) {
                        console.error('GM Error details:', err);
                        reject(err);
                    } else {
                        resolve();
                    }
                });
        });
        
        // Check if GIF was created
        if (fs.existsSync(gifPath)) {
            const gifStats = fs.statSync(gifPath);
            console.log(`✅ GIF created successfully: ${gifPath}`);
            console.log(`   Size: ${gifStats.size} bytes`);
            
            // Test reading GIF as buffer
            const gifBuffer = fs.readFileSync(gifPath);
            console.log(`✅ GIF buffer size: ${gifBuffer.length} bytes`);
            console.log(`   GIF header check: ${gifBuffer[0] === 0x47 && gifBuffer[1] === 0x49 ? 'Valid GIF' : 'Invalid GIF'}`);
            
            // Cleanup
            frameFiles.forEach(file => fs.unlinkSync(file));
            fs.unlinkSync(gifPath);
            fs.rmdirSync(tempDir);
            
            return true;
        } else {
            console.log('❌ GIF file was not created');
            return false;
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        return false;
    }
}

// Test GraphicsMagick with PNG frames (simulate real scenario)
async function testWithPngFrames() {
    console.log('\n🎬 Testing with PNG frame buffers...');
    
    try {
        // Create some test PNG frames in memory
        const frames = [];
        
        for (let i = 0; i < 3; i++) {
            const framePath = `/tmp/test_frame_${i}.png`;
            
            // Create test PNG
            await new Promise((resolve, reject) => {
                gm(400, 300, `#${i === 0 ? 'red' : i === 1 ? 'green' : 'blue'}`)
                    .fontSize(40)
                    .fill('white')
                    .drawText(150, 160, `PNG ${i + 1}`)
                    .write(framePath, (err) => {
                        if (err) reject(err);
                        else resolve();
                    });
            });
            
            // Read as buffer (simulate screenshot output)
            const frameBuffer = fs.readFileSync(framePath);
            frames.push(frameBuffer);
            
            // Cleanup temp file
            fs.unlinkSync(framePath);
        }
        
        console.log(`✅ Created ${frames.length} PNG frame buffers`);
        
        // Now create GIF from PNG buffers
        const tempDir = '/tmp/gif_from_png';
        fs.mkdirSync(tempDir, { recursive: true });
        
        // Save frames as temp files
        const framePaths = [];
        for (let i = 0; i < frames.length; i++) {
            const framePath = path.join(tempDir, `frame_${i.toString().padStart(3, '0')}.png`);
            fs.writeFileSync(framePath, frames[i]);
            framePaths.push(framePath);
        }
        
        // Create GIF
        const gifBuffer = await new Promise((resolve, reject) => {
            let gmCommand = gm();
            
            framePaths.forEach(framePath => {
                gmCommand = gmCommand.in(framePath);
            });
            
            gmCommand
                .delay(20) // 20 centiseconds = 0.2 seconds
                .loop(0)
                .resize(400, 300, '!')
                .toBuffer('GIF', (err, buffer) => {
                    // Cleanup
                    framePaths.forEach(path => fs.unlinkSync(path));
                    fs.rmdirSync(tempDir);
                    
                    if (err) {
                        reject(err);
                    } else {
                        resolve(buffer);
                    }
                });
        });
        
        console.log(`✅ Created GIF from PNG frames: ${gifBuffer.length} bytes`);
        console.log(`   GIF header: ${gifBuffer[0] === 0x47 && gifBuffer[1] === 0x49 ? 'Valid' : 'Invalid'}`);
        
        // Save test output
        fs.writeFileSync('/tmp/test_output.gif', gifBuffer);
        console.log('✅ Test GIF saved to: /tmp/test_output.gif');
        
        return true;
        
    } catch (error) {
        console.error('❌ PNG frame test failed:', error.message);
        return false;
    }
}

// Run tests
async function runAllTests() {
    console.log('🚀 Starting GraphicsMagick GIF Tests\n');
    
    const basicTest = await testGraphicsMagick();
    const pngTest = await testWithPngFrames();
    
    console.log('\n📊 Test Results:');
    console.log(`   Basic GM Test: ${basicTest ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   PNG Frame Test: ${pngTest ? '✅ PASS' : '❌ FAIL'}`);
    
    if (basicTest && pngTest) {
        console.log('\n🎉 All tests passed! GraphicsMagick GIF creation is working.');
        return true;
    } else {
        console.log('\n⚠️  Some tests failed. Check GraphicsMagick installation.');
        return false;
    }
}

if (require.main === module) {
    runAllTests().then(success => {
        process.exit(success ? 0 : 1);
    });
}

module.exports = { testGraphicsMagick, testWithPngFrames, runAllTests };