const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const gm = require('gm');

async function testFixedGifCreation() {
    console.log('🧪 Testing fixed GIF creation approach...');
    
    try {
        // Create temp directory
        const tempDir = '/tmp/fixed_gif_test';
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
        
        // Create test PNG frames
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1'];
        const framePaths = [];
        
        for (let i = 0; i < colors.length; i++) {
            const framePath = path.join(tempDir, `frame_${i.toString().padStart(3, '0')}.png`);
            
            await new Promise((resolve, reject) => {
                gm(300, 200, colors[i])
                    .write(framePath, (err) => {
                        if (err) reject(err);
                        else resolve();
                    });
            });
            
            framePaths.push(framePath);
            console.log(`✅ Created frame: ${framePath}`);
        }
        
        // Test GM command line approach
        const gifPath = path.join(tempDir, 'output.gif');
        const command = [
            'convert',
            '-delay', '30',
            '-loop', '0',
            path.join(tempDir, 'frame_*.png'),
            '-resize', '300x200!',
            gifPath
        ];
        
        console.log('Running GM command:', 'gm', command.join(' '));
        
        const gifBuffer = await new Promise((resolve, reject) => {
            const gmProcess = spawn('gm', command, { stdio: 'pipe' });
            
            let stderr = '';
            gmProcess.stderr.on('data', (data) => {
                stderr += data.toString();
            });
            
            gmProcess.stdout.on('data', (data) => {
                console.log('GM stdout:', data.toString());
            });
            
            gmProcess.on('close', (code) => {
                console.log(`GM process exited with code: ${code}`);
                console.log(`Stderr: ${stderr}`);
                
                if (code === 0 && fs.existsSync(gifPath)) {
                    const buffer = fs.readFileSync(gifPath);
                    console.log(`✅ GIF created: ${buffer.length} bytes`);
                    
                    // Cleanup
                    framePaths.forEach(path => fs.unlinkSync(path));
                    fs.unlinkSync(gifPath);
                    fs.rmdirSync(tempDir);
                    
                    resolve(buffer);
                } else {
                    reject(new Error(`GM failed with code ${code}: ${stderr}`));
                }
            });
            
            gmProcess.on('error', (error) => {
                reject(error);
            });
        });
        
        // Verify GIF header
        const isValidGif = gifBuffer[0] === 0x47 && gifBuffer[1] === 0x49;
        console.log(`✅ GIF validation: ${isValidGif ? 'Valid' : 'Invalid'}`);
        
        // Save test output
        fs.writeFileSync('/tmp/working_gif.gif', gifBuffer);
        console.log('✅ Working GIF saved: /tmp/working_gif.gif');
        
        return true;
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        return false;
    }
}

if (require.main === module) {
    testFixedGifCreation().then(success => {
        if (success) {
            console.log('\n🎉 Fixed GIF creation is working!');
            console.log('Ready to test with the screenshot service.');
        } else {
            console.log('\n❌ GIF creation still not working.');
        }
        process.exit(success ? 0 : 1);
    });
}