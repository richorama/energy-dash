// The Things Energy Dash - Game Logic
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Set canvas to full window size
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        this.gameState = 'leaderboard'; // Start with leaderboard instead of menu
        this.selectedCharacter = 'dave'; // Default character
        
        // Performance monitoring
        this.performanceMetrics = {
            frameCount: 0,
            lastTime: performance.now(),
            fps: 0,
            renderTime: 0,
            updateTime: 0,
            maxRenderTime: 0,
            maxUpdateTime: 0,
            frameTimes: [],
            renderBreakdown: {
                skyGradient: 0,
                clouds: 0,
                buildings: 0,
                stars: 0,
                ground: 0,
                gameObjects: 0,
                ui: 0
            }
        };
        this.showPerformanceOverlay = false;
        
        // Game variables
        this.score = 0;
        this.distance = 0;
        this.speed = 6.5; // Increased from 3.5 for faster start
        this.baseSpeed = 6.5; // Increased from 3.5 for faster start
        this.gravity = 0.7;
        this.jumpPower = -16;
        this.gameTime = 0;
        this.backgroundOffset = 0;
        this.cloudOffset = 0;
        
        // Player object
        this.player = {
            x: 100,
            y: 300,
            width: 75,  // Increased from 50
            height: 105, // Increased from 70
            velocityY: 0,
            isJumping: false,
            isGrounded: true,
            color: '#ff6b6b',
            animFrame: 0,
            runCycle: 0
        };
        
        // Ground level
        this.groundY = this.canvas.height - 100;
        this.player.y = this.groundY - this.player.height;
        
        // Game arrays
        this.obstacles = [];
        this.collectibles = [];
        this.clouds = [];
        this.buildings = [];
        this.particles = [];
        this.grassTufts = [];
        this.pebbles = [];
        
        // Spawn timers
        this.obstacleSpawnTimer = 0;
        this.collectibleSpawnTimer = 0;
        this.particleTimer = 0;
        this.grassSpawnTimer = 0;
        this.pebbleSpawnTimer = 0;
        
        // Character data
        this.characters = {
            dave: { name: 'Dave', color: '#4a90e2', accent: '#2c5aa0', description: 'Big Softie' },
            mel: { name: 'Mel', color: '#8b4513', accent: '#654321', description: 'Coffee Lover' },
            ash: { name: 'Ash', color: '#32cd32', accent: '#228b22', description: 'Tech Support' },
            charlie: { name: 'Charlie & Riley', color: '#ff69b4', accent: '#e91e63', description: 'Double Trouble' }
        };
        
        // Obstacle types - All cardboard boxes with different sizes
        this.obstacleTypes = [
            { type: 'small_box', width: 35, height: 30, color: '#deb887', shadow: '#cd853f', points: 5 },    // Reduced from 60x53
            { type: 'medium_box', width: 45, height: 40, color: '#d2b48c', shadow: '#bc9a6a', points: 8 },  // Reduced from 75x68
            { type: 'large_box', width: 55, height: 50, color: '#f5deb3', shadow: '#ddd0a3', points: 12 },  // Reduced from 90x83
            { type: 'tall_box', width: 40, height: 60, color: '#daa520', shadow: '#b8860b', points: 10 }    // Reduced from 68x98
        ];
        
        // Collectible types - All energy symbols with different values
        this.collectibleTypes = [
            { type: 'white_energy', symbol: '⚡', points: 10, color: '#ffffff', rarity: 0.4 },
            { type: 'yellow_energy', symbol: '⚡', points: 25, color: '#ffff00', rarity: 0.3 },
            { type: 'blue_energy', symbol: '⚡', points: 50, color: '#00bfff', rarity: 0.2 },
            { type: 'gold_energy', symbol: '⚡', points: 100, color: '#ffd700', rarity: 0.1 }
        ];
        
        // City lighting system
        this.cityLightLevel = 0.0; // Start with all lights off
        this.energyCollected = 0;
        this.maxLightLevel = 0.95; // Maximum 95% of lights can be on
        
        this.setupEventListeners();
        this.setupUI();
        this.generateBackground();
        this.generateClouds();
        this.generateStars();
        
        // Initialize leaderboard as main screen
        this.showLeaderboard();
        
        this.gameLoop();
    }
    
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.groundY = this.canvas.height - 100;
        if (this.player) {
            this.player.y = this.groundY - this.player.height;
        }
    }
    
    setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' || e.code === 'ArrowUp') {
                e.preventDefault();
                
                // If we're on the leaderboard, start the game
                if (this.gameState === 'leaderboard') {
                    this.startGame();
                } else {
                    this.jump();
                }
            }
            // Performance overlay toggle
            if (e.code === 'KeyP' && e.ctrlKey) {
                e.preventDefault();
                this.showPerformanceOverlay = !this.showPerformanceOverlay;
            }
        });
        
        // Touch controls
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            
            // If we're on the leaderboard, start the game
            if (this.gameState === 'leaderboard') {
                this.startGame();
            } else {
                this.jump();
            }
        });
        
        // Mouse controls (for testing)
        this.canvas.addEventListener('click', () => {
            // If we're on the leaderboard, start the game
            if (this.gameState === 'leaderboard') {
                this.startGame();
            } else {
                this.jump();
            }
        });
    }
    
    setupUI() {
        // Start game button
        document.getElementById('startBtn').addEventListener('click', () => {
            this.startGame();
        });
        
        // Save score button (for high scores only)
        document.getElementById('saveScoreBtn').addEventListener('click', () => {
            const playerName = document.getElementById('playerName').value.trim();
            if (playerName) {
                this.saveScore();
                this.showLeaderboard();
            } else {
                alert('Please enter your name to save your high score!');
            }
        });
        
        // Allow Enter key to save score
        document.getElementById('playerName').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const playerName = document.getElementById('playerName').value.trim();
                if (playerName) {
                    this.saveScore();
                    this.showLeaderboard();
                } else {
                    alert('Please enter your name to save your high score!');
                }
            }
        });
    }
    
    startGame() {
        this.gameState = 'playing';
        this.resetGame();
        // Set default character color
        this.player.color = this.characters[this.selectedCharacter].color;
        this.hideAllMenus();
        
        // Show the game title again
        const gameTitle = document.querySelector('.arcade-title');
        if (gameTitle) {
            gameTitle.style.display = 'block';
        }
    }
    
    resetGame() {
        this.score = 0;
        this.distance = 0;
        this.speed = this.baseSpeed;
        this.gameTime = 0;
        this.backgroundOffset = 0;
        this.cloudOffset = 0;
        this.player.x = 100;
        this.player.y = this.groundY - this.player.height;
        this.player.velocityY = 0;
        this.player.isJumping = false;
        this.player.isGrounded = true;
        this.player.runCycle = 0;
        this.obstacles = [];
        this.collectibles = [];
        this.particles = [];
        this.grassTufts = [];
        this.pebbles = [];
        this.obstacleSpawnTimer = 0;
        this.collectibleSpawnTimer = 0;
        this.particleTimer = 0;
        this.grassSpawnTimer = 0;
        this.pebbleSpawnTimer = 0;
        
        // Reset lighting system
        this.cityLightLevel = 0.0; // Start with all lights off
        this.energyCollected = 0;
        this.resetBuildingLights();
        
        this.updateUI();
    }
    
    jump() {
        if (this.gameState === 'playing' && this.player.isGrounded) {
            this.player.velocityY = this.jumpPower;
            this.player.isJumping = true;
            this.player.isGrounded = false;
        }
    }
    
    updatePlayer() {
        // Apply gravity
        this.player.velocityY += this.gravity;
        this.player.y += this.player.velocityY;
        
        // Ground collision
        if (this.player.y >= this.groundY - this.player.height) {
            this.player.y = this.groundY - this.player.height;
            this.player.velocityY = 0;
            this.player.isJumping = false;
            this.player.isGrounded = true;
        }
    }
    
    spawnObstacle() {
        const types = this.obstacleTypes;
        const type = types[Math.floor(Math.random() * types.length)];
        
        const obstacle = {
            x: this.canvas.width,
            y: this.groundY - type.height,
            width: type.width,
            height: type.height,
            type: type.type,
            color: type.color,
            shadow: type.shadow,
            points: type.points,
            hasFragileLabel: Math.random() > 0.7 // 30% chance of having FRAGILE text
        };
        
        this.obstacles.push(obstacle);
    }
    
    spawnCollectible() {
        // Choose collectible type based on rarity
        let totalRarity = this.collectibleTypes.reduce((sum, type) => sum + type.rarity, 0);
        let random = Math.random() * totalRarity;
        let selectedType = this.collectibleTypes[0];
        
        for (let type of this.collectibleTypes) {
            if (random <= type.rarity) {
                selectedType = type;
                break;
            }
            random -= type.rarity;
        }
        
        const baseY = this.groundY - 80 - Math.random() * 100;
        const collectible = {
            x: this.canvas.width,
            y: baseY,
            baseY: baseY, // Store original Y for floating animation
            width: 70,   // Increased from 53
            height: 70,  // Increased from 53
            type: selectedType.type,
            symbol: selectedType.symbol,
            points: selectedType.points,
            color: selectedType.color,
            bobOffset: Math.random() * Math.PI * 2 // For floating animation
        };
        
        this.collectibles.push(collectible);
    }
    
    spawnGrassTuft() {
        // Create grass tuft at ground level
        const grassTuft = {
            x: this.canvas.width,
            y: this.groundY - 5, // Slightly above ground
            width: 8 + Math.random() * 6, // 8-14 pixels wide
            height: 8 + Math.random() * 10, // 8-18 pixels tall
            swayOffset: Math.random() * Math.PI * 2, // For swaying animation
            blades: Math.floor(3 + Math.random() * 4), // 3-6 grass blades
            color: ['#228b22', '#32cd32', '#006400'][Math.floor(Math.random() * 3)]
        };
        
        this.grassTufts.push(grassTuft);
    }
    
    spawnPebble() {
        // Create pebble embedded deeper in the soil
        const pebble = {
            x: this.canvas.width,
            y: this.groundY + 15 + Math.random() * 25, // Embedded deeper: 15-40 pixels below ground surface
            size: 3 + Math.random() * 6, // Slightly smaller: 3-9 pixels
            // Soil-appropriate colors - darker and lighter browns than the dirt (#8B4513)
            color: [
                '#5D2F0A', // Darker brown
                '#4A2507', // Very dark brown
                '#6B3710', // Medium dark brown
                '#A0522D', // Lighter brown
                '#CD853F', // Light brown/tan
                '#DEB887'  // Very light brown
            ][Math.floor(Math.random() * 6)],
            shape: Math.random() > 0.5 ? 'round' : 'oval',
            opacity: 0.3 + Math.random() * 0.4 // Random transparency: 30-70% opacity
        };
        
        this.pebbles.push(pebble);
    }
    
    generateBackground() {
        // Generate buildings with much better variety
        this.buildings = [];
        // Generate fewer buildings for better performance
        for (let i = 0; i < 15; i++) {  // Reduced from 25
            const height = 60 + Math.random() * 300;
            
            // Assign depth based on height - taller buildings are closer, shorter are further
            let depth, speed;
            if (height < 150) {
                // Background buildings - smaller, slower
                depth = 'background';
                speed = 0.2;
            } else if (height < 250) {
                // Middle ground buildings
                depth = 'middle';
                speed = 0.4;
            } else {
                // Foreground buildings - taller, faster
                depth = 'foreground';
                speed = 0.6;
            }
            
            const building = {
                x: i * 120 + Math.random() * 60,
                y: this.groundY - height,
                width: 90 + Math.random() * 90,
                height: height,
                color: this.getRandomBuildingColor(),
                windowPattern: Math.floor(Math.random() * 3),
                speed: speed, // Fixed speed based on depth
                depth: depth,
                windows: [] // Pre-generate window pattern
            };
            
            // Pre-generate window positions to avoid flickering
            const rows = Math.floor(building.height / 25);
            const cols = Math.floor(building.width / 20);
            
            for (let row = 1; row < rows; row++) {
                for (let col = 1; col < cols; col++) {
                    building.windows.push({
                        x: col * (building.width / cols) - 4,
                        y: row * (building.height / rows) - 4,
                        lit: Math.random() < this.cityLightLevel // Use lighting system
                    });
                }
            }
            
            this.buildings.push(building);
        }
        
        // Sort buildings by depth for proper rendering order (background to foreground)
        this.buildings.sort((a, b) => {
            const depthOrder = { 'background': 0, 'middle': 1, 'foreground': 2 };
            return depthOrder[a.depth] - depthOrder[b.depth];
        });
    }
    
    generateClouds() {
        // Generate multiple layers of clouds for depth - MORE CLOUDS!
        this.clouds = [];
        
        // Background clouds (far, slow, subtle) - Reduced for performance
        for (let i = 0; i < 6; i++) {  // Reduced from 12
            this.clouds.push({
                x: i * 200 + Math.random() * 100,
                y: 20 + Math.random() * 120,
                size: 75 + Math.random() * 60,
                speed: 0.1 + Math.random() * 0.15,
                opacity: 0.3 + Math.random() * 0.25,
                layer: 'back'
            });
        }
        
        // Mid-layer clouds - Reduced for performance
        for (let i = 0; i < 8; i++) {  // Reduced from 15
            this.clouds.push({
                x: i * 180 + Math.random() * 90,
                y: 30 + Math.random() * 140,
                size: 60 + Math.random() * 75,
                speed: 0.2 + Math.random() * 0.25,
                opacity: 0.5 + Math.random() * 0.3,
                layer: 'mid'
            });
        }
        
        // Foreground clouds (closer, faster, more opaque) - Reduced for performance
        for (let i = 0; i < 5; i++) {  // Reduced from 10
            this.clouds.push({
                x: i * 250 + Math.random() * 125,
                y: 25 + Math.random() * 100,
                size: 68 + Math.random() * 83,
                speed: 0.3 + Math.random() * 0.4,
                opacity: 0.6 + Math.random() * 0.4,
                layer: 'front'
            });
        }
        
        // Extra small wispy clouds - Reduced for performance
        for (let i = 0; i < 10; i++) {  // Reduced from 20
            this.clouds.push({
                x: i * 150 + Math.random() * 75,
                y: 15 + Math.random() * 160,
                size: 38 + Math.random() * 53,
                speed: 0.15 + Math.random() * 0.2,
                opacity: 0.2 + Math.random() * 0.3,
                layer: 'wispy'
            });
        }
    }
    
    generateStars() {
        // Generate beautiful dusk stars - Reduced for performance
        this.stars = [];
        
        // Small twinkling stars
        for (let i = 0; i < 40; i++) {  // Reduced from 80
            this.stars.push({
                x: Math.random() * this.canvas.width * 2, // Cover wider area
                y: Math.random() * this.canvas.height * 0.6, // Only in upper sky
                size: 2 + Math.random() * 3,
                brightness: 0.3 + Math.random() * 0.7,
                twinkleOffset: Math.random() * Math.PI * 2,
                twinkleSpeed: 0.02 + Math.random() * 0.03
            });
        }
        
        // Brighter stars
        for (let i = 0; i < 20; i++) {
            this.stars.push({
                x: Math.random() * this.canvas.width * 2,
                y: Math.random() * this.canvas.height * 0.5, // Higher in sky
                size: 2 + Math.random() * 3,
                brightness: 0.6 + Math.random() * 0.4,
                twinkleOffset: Math.random() * Math.PI * 2,
                twinkleSpeed: 0.01 + Math.random() * 0.02
            });
        }
    }
    
    getRandomBuildingColor() {
        const colors = [
            '#2c3e50', '#34495e', '#5d4e75', '#4a6741', 
            '#8b7355', '#6b705c', '#7f8471', '#5a6a62',
            '#4a5568', '#2d3748', '#553c9a', '#6f42c1'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    createParticle(x, y, type = 'collect') {
        if (type === 'collect') {
            // Create a spectacular collection effect with many particles
            const particleCount = 15 + Math.random() * 10; // 15-25 particles
            
            for (let i = 0; i < particleCount; i++) {
                // Multiple particle types for variety
                const particleType = Math.random();
                
                if (particleType < 0.4) {
                    // Sparkle particles - fast, bright, small
                    this.particles.push({
                        x: x + (Math.random() - 0.5) * 20,
                        y: y + (Math.random() - 0.5) * 20,
                        velocityX: (Math.random() - 0.5) * 8,
                        velocityY: -Math.random() * 6 - 2,
                        life: 45 + Math.random() * 15,
                        maxLife: 45 + Math.random() * 15,
                        color: ['#ffd700', '#ffff00', '#ffffff', '#00ffff'][Math.floor(Math.random() * 4)],
                        size: 2 + Math.random() * 2,
                        type: 'sparkle',
                        twinkle: Math.random() * Math.PI * 2
                    });
                } else if (particleType < 0.7) {
                    // Energy orbs - slower, larger, glowing
                    this.particles.push({
                        x: x + (Math.random() - 0.5) * 15,
                        y: y + (Math.random() - 0.5) * 15,
                        velocityX: (Math.random() - 0.5) * 4,
                        velocityY: -Math.random() * 4 - 1,
                        life: 60 + Math.random() * 20,
                        maxLife: 60 + Math.random() * 20,
                        color: ['#ffff00', '#ffd700', '#ffff7f'][Math.floor(Math.random() * 3)], // Changed to yellow shades
                        size: 4 + Math.random() * 4,
                        type: 'orb',
                        pulse: Math.random() * Math.PI * 2
                    });
                } else {
                    // Lightning particles - angular, electric
                    this.particles.push({
                        x: x + (Math.random() - 0.5) * 25,
                        y: y + (Math.random() - 0.5) * 25,
                        velocityX: (Math.random() - 0.5) * 10,
                        velocityY: -Math.random() * 5 - 3,
                        life: 30 + Math.random() * 10,
                        maxLife: 30 + Math.random() * 10,
                        color: ['#ffa500', '#ff8c00', '#ffb347'][Math.floor(Math.random() * 3)], // Changed to orange/yellow shades
                        size: 1 + Math.random() * 3,
                        type: 'lightning',
                        zigzag: Math.random() * 10
                    });
                }
            }
        } else {
            // Simple collision particles
            const colors = ['#ff6b6b', '#ff4444'];
            this.particles.push({
                x: x,
                y: y,
                velocityX: (Math.random() - 0.5) * 4,
                velocityY: -Math.random() * 3 - 2,
                life: 30,
                maxLife: 30,
                color: colors[Math.floor(Math.random() * colors.length)],
                size: 3 + Math.random() * 3,
                type: 'simple'
            });
        }
    }
    
    updateGame() {
        // Always update background elements for visual effect
        this.gameTime++;
        
        // Update buildings (always animate for visual appeal)
        for (let building of this.buildings) {
            building.x -= building.speed * 0.5; // Slower when not playing
            if (building.x + building.width < 0) {
                building.x = this.canvas.width + Math.random() * 100;
                const newHeight = 60 + Math.random() * 300; // Generate new height
                building.height = newHeight;
                building.y = this.groundY - building.height;
                building.color = this.getRandomBuildingColor();
                
                // Reassign depth properties based on new height
                if (newHeight < 150) {
                    building.depth = 'background';
                    building.speed = 0.2;
                    building.opacity = 0.6;
                } else if (newHeight < 250) {
                    building.depth = 'middle';
                    building.speed = 0.4;
                    building.opacity = 0.8;
                } else {
                    building.depth = 'foreground';
                    building.speed = 0.6;
                    building.opacity = 1.0;
                }
                
                // Only regenerate windows occasionally to prevent stuttering
                if (this.gameTime % 60 === 0 || building.windows.length === 0) {
                    // Regenerate windows for the new building
                    building.windows = [];
                    const rows = Math.floor(building.height / 25);
                    const cols = Math.floor(building.width / 20);
                    
                    for (let row = 1; row < rows; row++) {
                        for (let col = 1; col < cols; col++) {
                            building.windows.push({
                                x: col * (building.width / cols) - 4,
                                y: row * (building.height / rows) - 4,
                                lit: Math.random() < this.cityLightLevel // Use current lighting level
                            });
                        }
                    }
                }
            }
        }
        
        // Update clouds (always animate) - now with more cloud types
        for (let cloud of this.clouds) {
            cloud.x -= cloud.speed * 0.3; // Slower when not playing
            if (cloud.x + cloud.size * 2 < 0) {
                // Reset cloud position with appropriate spacing based on layer
                if (cloud.layer === 'wispy') {
                    cloud.x = this.canvas.width + Math.random() * 200;
                    cloud.y = 15 + Math.random() * 160;
                    cloud.size = 25 + Math.random() * 35;
                } else if (cloud.layer === 'back') {
                    cloud.x = this.canvas.width + Math.random() * 300;
                    cloud.y = 20 + Math.random() * 120;
                    cloud.size = 50 + Math.random() * 40;
                } else if (cloud.layer === 'mid') {
                    cloud.x = this.canvas.width + Math.random() * 250;
                    cloud.y = 30 + Math.random() * 140;
                    cloud.size = 40 + Math.random() * 50;
                } else if (cloud.layer === 'front') {
                    cloud.x = this.canvas.width + Math.random() * 400;
                    cloud.y = 25 + Math.random() * 100;
                    cloud.size = 45 + Math.random() * 55;
                }
            }
        }
        
        if (this.gameState !== 'playing') return;
        
        this.distance += this.speed * 0.1;
        this.score += 1; // Base score for survival
        
        // Increase speed over time (more gradual)
        this.speed = this.baseSpeed + (this.gameTime * 0.001);
        
        // Update background scrolling
        this.backgroundOffset += this.speed * 0.3;
        this.cloudOffset += this.speed * 0.1;
        
        // Update star twinkling
        for (let star of this.stars) {
            // Slow, gentle twinkling effect
            star.brightness = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(this.gameTime * 0.002 + star.x * 0.01));
        }
        
        // Update player animation
        this.player.runCycle += this.speed * 0.2;
        
        // Update player
        this.updatePlayer();
        
        // Spawn obstacles
        this.obstacleSpawnTimer++;
        const obstacleSpawnRate = Math.max(90 - this.gameTime * 0.015, 45); // Adjusted for faster speed: 90-45 frames (was 120-60)
        if (this.obstacleSpawnTimer > obstacleSpawnRate) {
            this.spawnObstacle();
            this.obstacleSpawnTimer = 0;
        }
        
        // Spawn collectibles
        this.collectibleSpawnTimer++;
        if (this.collectibleSpawnTimer > 150) { // Slightly more frequent due to faster speed (was 200)
            if (Math.random() < 0.6) { // 60% chance to spawn
                this.spawnCollectible();
            }
            this.collectibleSpawnTimer = 0;
        }
        
        // Spawn grass tufts (decorative)
        this.grassSpawnTimer++;
        if (this.grassSpawnTimer > 80 + Math.random() * 40) { // Random interval 80-120 frames
            if (Math.random() < 0.7) { // 70% chance to spawn
                this.spawnGrassTuft();
            }
            this.grassSpawnTimer = 0;
        }
        
        // Spawn pebbles (decorative)
        this.pebbleSpawnTimer++;
        if (this.pebbleSpawnTimer > 150 + Math.random() * 100) { // Longer interval: 150-250 frames
            if (Math.random() < 0.3) { // Reduced chance: 30% to spawn
                this.spawnPebble();
            }
            this.pebbleSpawnTimer = 0;
        }
        
        // Update obstacles
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obstacle = this.obstacles[i];
            obstacle.x -= this.speed;
            
            // Remove off-screen obstacles
            if (obstacle.x + obstacle.width < 0) {
                this.obstacles.splice(i, 1);
            }
            
            // Check collision with player
            else if (this.checkCollision(this.player, obstacle)) {
                this.gameOver();
                return;
            }
        }
        
        // Update collectibles
        for (let i = this.collectibles.length - 1; i >= 0; i--) {
            const collectible = this.collectibles[i];
            collectible.x -= this.speed;
            collectible.bobOffset += 0.15;
            collectible.baseY = collectible.baseY || collectible.y;
            collectible.y = collectible.baseY + Math.sin(collectible.bobOffset) * 8; // Smoother floating
            
            // Remove off-screen collectibles
            if (collectible.x + collectible.width < 0) {
                this.collectibles.splice(i, 1);
            }
            
            // Check collection
            else if (this.checkCollision(this.player, collectible)) {
                this.score += collectible.points;
                this.energyCollected += collectible.points;
                
                // Update city lighting based on energy collected
                this.updateCityLighting();
                
                this.createParticle(collectible.x + collectible.width/2, collectible.y + collectible.height/2, 'collect');
                this.collectibles.splice(i, 1);
            }
        }
        
        // Update particles
        this.particleTimer++;
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.x += particle.velocityX;
            particle.y += particle.velocityY;
            
            // Different physics for different particle types
            if (particle.type === 'sparkle') {
                particle.velocityY += 0.15; // Light gravity
                particle.twinkle += 0.2; // Twinkling animation
                particle.velocityX *= 0.98; // Air resistance
            } else if (particle.type === 'orb') {
                particle.velocityY += 0.1; // Very light gravity
                particle.pulse += 0.15; // Pulsing animation
                particle.velocityX *= 0.99; // Minimal air resistance
            } else if (particle.type === 'lightning') {
                particle.velocityY += 0.25; // Normal gravity
                particle.velocityX += Math.sin(particle.zigzag) * 0.5; // Zigzag motion
                particle.zigzag += 0.3;
            } else {
                particle.velocityY += 0.2; // Standard gravity for simple particles
            }
            
            particle.life--;
            
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
        
        // Update grass tufts
        for (let i = this.grassTufts.length - 1; i >= 0; i--) {
            const grass = this.grassTufts[i];
            grass.x -= this.speed;
            grass.swayOffset += 0.02; // Slow swaying animation
            
            // Remove off-screen grass
            if (grass.x + grass.width < 0) {
                this.grassTufts.splice(i, 1);
            }
        }
        
        // Update pebbles
        for (let i = this.pebbles.length - 1; i >= 0; i--) {
            const pebble = this.pebbles[i];
            pebble.x -= this.speed;
            
            // Remove off-screen pebbles
            if (pebble.x + pebble.size < 0) {
                this.pebbles.splice(i, 1);
            }
        }
        
        this.updateUI();
    }
    
    checkCollision(rect1, rect2) {
        // Use smaller margin for more accurate collision detection
        const margin = 1;
        return rect1.x + margin < rect2.x + rect2.width &&
               rect1.x + rect1.width - margin > rect2.x &&
               rect1.y + margin < rect2.y + rect2.height &&
               rect1.y + rect1.height - margin > rect2.y;
    }
    
    updateCityLighting() {
        // Calculate new light level based on energy collected
        // Every 25 energy points increases lighting by 10% (much faster progression)
        const lightIncrease = Math.floor(this.energyCollected / 25) * 0.1;
        this.cityLightLevel = Math.min(this.maxLightLevel, lightIncrease);
        
        // Update lights immediately when energy is collected
        this.updateBuildingLights();
    }
    
    updateBuildingLights() {
        // More aggressive lighting update for immediate visual feedback
        const targetLightLevel = this.cityLightLevel;
        
        if (targetLightLevel > 0) {
            for (let building of this.buildings) {
                // Calculate current light percentage for this building
                const totalWindows = building.windows.length;
                const litWindows = building.windows.filter(w => w.lit).length;
                const currentLevel = totalWindows > 0 ? litWindows / totalWindows : 0;
                
                // If we're below target level, light up more windows
                if (currentLevel < targetLightLevel) {
                    const windowsToLight = Math.ceil((targetLightLevel - currentLevel) * totalWindows);
                    let lit = 0;
                    
                    for (let window of building.windows) {
                        if (!window.lit && lit < windowsToLight) {
                            window.lit = true;
                            lit++;
                        }
                    }
                }
            }
        }
    }
    
    resetBuildingLights() {
        // Reset all building lights to initial state
        for (let building of this.buildings) {
            for (let window of building.windows) {
                window.lit = Math.random() < this.cityLightLevel;
            }
        }
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('finalDistance').textContent = Math.floor(this.distance);
        
        // Check if it's a high score
        if (this.isHighScore()) {
            // Clear the name input and focus on it
            const nameInput = document.getElementById('playerName');
            nameInput.value = '';
            
            // Show game over menu for high score entry
            console.log('High score detected, showing full game over menu');
            this.showGameOverMenu();
            
            // Focus on the name input after a short delay
            setTimeout(() => {
                nameInput.focus();
            }, 100);
        } else {
            // Show game over screen briefly, then auto-save and go to leaderboard
            console.log('Regular score, showing brief game over then leaderboard');
            this.showGameOverMenu();
            
            // Hide the high score elements for non-high scores
            const highScoreTitle = document.querySelector('#gameOverMenu h3');
            const nameContainer = document.querySelector('.input-container');
            const saveButton = document.getElementById('saveScoreBtn');
            
            if (highScoreTitle) highScoreTitle.style.display = 'none';
            if (nameContainer) nameContainer.style.display = 'none';
            if (saveButton) saveButton.style.display = 'none';
            
            // Auto-save and transition to leaderboard after 2 seconds
            setTimeout(() => {
                this.saveScoreAnonymous();
                this.showLeaderboard();
                
                // Restore elements for next time
                if (highScoreTitle) highScoreTitle.style.display = 'block';
                if (nameContainer) nameContainer.style.display = 'block';
                if (saveButton) saveButton.style.display = 'inline-block';
            }, 2000);
        }
    }
    
    render() {
        let phaseStartTime, phaseEndTime;
        
        // Clear canvas with dusk/twilight gradient sky
        phaseStartTime = performance.now();
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#1a1a2e');      // Dark blue-purple at top
        gradient.addColorStop(0.2, '#16213e');    // Deep twilight blue
        gradient.addColorStop(0.4, '#0f4c75');    // Medium blue
        gradient.addColorStop(0.6, '#3282b8');    // Lighter blue
        gradient.addColorStop(0.8, '#ff6b6b');    // Sunset orange/pink
        gradient.addColorStop(0.9, '#ffa726');    // Golden orange
        gradient.addColorStop(1, '#2d5016');      // Dark green ground level
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        phaseEndTime = performance.now();
        this.performanceMetrics.renderBreakdown.skyGradient = phaseEndTime - phaseStartTime;
        
        // Draw clouds with timing
        phaseStartTime = performance.now();
        // Draw wispy clouds first (furthest back)
        this.ctx.save();
        for (let cloud of this.clouds) {
            if (cloud.layer === 'wispy') {
                this.drawCloud(cloud.x, cloud.y, cloud.size, cloud.opacity);
            }
        }
        this.ctx.restore();
        
        // Draw background clouds
        this.ctx.save();
        for (let cloud of this.clouds) {
            if (cloud.layer === 'back') {
                this.drawCloud(cloud.x, cloud.y, cloud.size, cloud.opacity);
            }
        }
        this.ctx.restore();
        
        // Draw mid-layer clouds
        this.ctx.save();
        for (let cloud of this.clouds) {
            if (cloud.layer === 'mid') {
                this.drawCloud(cloud.x, cloud.y, cloud.size, cloud.opacity);
            }
        }
        this.ctx.restore();
        
        // Draw foreground clouds
        this.ctx.save();
        for (let cloud of this.clouds) {
            if (cloud.layer === 'front') {
                this.drawCloud(cloud.x, cloud.y, cloud.size, cloud.opacity);
            }
        }
        this.ctx.restore();
        phaseEndTime = performance.now();
        this.performanceMetrics.renderBreakdown.clouds = phaseEndTime - phaseStartTime;
        
        // Draw buildings with timing
        phaseStartTime = performance.now();
        for (let building of this.buildings) {
            this.drawBuilding(building);
        }
        phaseEndTime = performance.now();
        this.performanceMetrics.renderBreakdown.buildings = phaseEndTime - phaseStartTime;
        
        // Draw stars with timing
        phaseStartTime = performance.now();
        this.ctx.save();
        for (let star of this.stars) {
            this.drawStar(star.x, star.y, star.size, star.brightness);
        }
        this.ctx.restore();
        phaseEndTime = performance.now();
        this.performanceMetrics.renderBreakdown.stars = phaseEndTime - phaseStartTime;
        
        // Draw ground with timing
        phaseStartTime = performance.now();
        this.drawGround();
        phaseEndTime = performance.now();
        this.performanceMetrics.renderBreakdown.ground = phaseEndTime - phaseStartTime;
        
        // Draw game objects with timing
        phaseStartTime = performance.now();
        // Only draw game elements when playing
        if (this.gameState === 'playing') {
            // Count objects for performance monitoring
            const objectCounts = {
                obstacles: this.obstacles.length,
                collectibles: this.collectibles.length,
                particles: this.particles.length,
                clouds: this.clouds.length,
                buildings: this.buildings.length,
                stars: this.stars.length,
                grassTufts: this.grassTufts.length,
                pebbles: this.pebbles.length
            };
            
            // Store counts for performance overlay
            this.performanceMetrics.objectCounts = objectCounts;
            
            // Draw grass tufts (behind other objects)
            for (let grass of this.grassTufts) {
                this.drawGrassTuft(grass);
            }
            
            // Draw pebbles (behind other objects)
            for (let pebble of this.pebbles) {
                this.drawPebble(pebble);
            }
            
            // Draw obstacles with improved graphics
            for (let obstacle of this.obstacles) {
                this.drawObstacle(obstacle);
            }
            
            // Draw collectibles with glow effects
            for (let collectible of this.collectibles) {
                this.drawCollectible(collectible);
            }
            
            // Draw particles
            for (let particle of this.particles) {
                this.drawParticle(particle);
            }
            
            // Draw player with animation
            this.drawPlayer();
        }
        phaseEndTime = performance.now();
        this.performanceMetrics.renderBreakdown.gameObjects = phaseEndTime - phaseStartTime;
        
        // Draw UI with timing
        phaseStartTime = performance.now();
        this.drawArcadeUI();
        
        // Draw performance overlay if enabled
        if (this.showPerformanceOverlay) {
            this.drawPerformanceOverlay();
        }
        phaseEndTime = performance.now();
        this.performanceMetrics.renderBreakdown.ui = phaseEndTime - phaseStartTime;
    }
    
    drawCloud(x, y, size, opacity) {
        this.ctx.save();
        this.ctx.globalAlpha = opacity * 0.3; // More transparent
        
        // Simple cloud using just 3 circles
        this.ctx.fillStyle = 'rgba(245, 248, 255, 0.5)'; // More transparent color
        
        // Define minimal cloud puffs - just 3 circles
        const puffs = [
            { x: size * 0.25, y: size * 0.3, r: size * 0.35 },  // Left
            { x: size * 0.5, y: size * 0.15, r: size * 0.4 },   // Center (main)
            { x: size * 0.75, y: size * 0.3, r: size * 0.3 }    // Right
        ];
        
        // Draw simple cloud structure
        for (let puff of puffs) {
            this.ctx.beginPath();
            this.ctx.arc(x + puff.x, y + puff.y, puff.r, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        this.ctx.restore();
    }
    
    drawStar(x, y, size, brightness) {
        this.ctx.save();
        
        // Set star color with brightness variation
        const alpha = 0.3 + (brightness * 0.7); // Range from 0.3 to 1.0
        this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        
        // Draw a simple cross-shaped star
        this.ctx.beginPath();
        
        // Vertical line
        this.ctx.moveTo(x, y - size);
        this.ctx.lineTo(x, y + size);
        
        // Horizontal line
        this.ctx.moveTo(x - size, y);
        this.ctx.lineTo(x + size, y);
        
        this.ctx.strokeStyle = this.ctx.fillStyle;
        this.ctx.lineWidth = size * 0.3;
        this.ctx.lineCap = 'round';
        this.ctx.stroke();
        
        // Add a small center dot
        this.ctx.beginPath();
        this.ctx.arc(x, y, size * 0.2, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.restore();
    }
    
    drawBuilding(building) {
        this.ctx.save();
        
        // Main building body with gradient
        const gradient = this.ctx.createLinearGradient(building.x, 0, building.x + building.width, 0);
        gradient.addColorStop(0, building.color);
        gradient.addColorStop(1, this.darkenColor(building.color, 0.2));
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(building.x, building.y, building.width, building.height);
        
        // Building outline
        this.ctx.strokeStyle = this.darkenColor(building.color, 0.4);
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(building.x, building.y, building.width, building.height);
        
        // Windows with different patterns
        this.drawWindows(building);
        
        // Rooftop
        this.ctx.fillStyle = this.darkenColor(building.color, 0.3);
        this.ctx.fillRect(building.x - 5, building.y - 10, building.width + 10, 10);
        
        this.ctx.restore();
    }
    
    drawWindows(building) {
        // Use pre-generated window pattern to avoid flickering
        for (let window of building.windows) {
            if (window.lit) {
                // Window light
                this.ctx.fillStyle = '#ffff99';
                this.ctx.fillRect(building.x + window.x, building.y + window.y, 8, 8);
                
                // Window frame
                this.ctx.strokeStyle = '#666666';
                this.ctx.lineWidth = 0.5;
                this.ctx.strokeRect(building.x + window.x, building.y + window.y, 8, 8);
            } else {
                // Dark window
                this.ctx.fillStyle = '#87ceeb';
                this.ctx.fillRect(building.x + window.x, building.y + window.y, 8, 8);
                
                // Window frame
                this.ctx.strokeStyle = '#666666';
                this.ctx.lineWidth = 0.5;
                this.ctx.strokeRect(building.x + window.x, building.y + window.y, 8, 8);
            }
        }
    }
    
    drawGround() {
        // Underground dirt layer
        const dirtGradient = this.ctx.createLinearGradient(0, this.groundY, 0, this.canvas.height);
        dirtGradient.addColorStop(0, '#8B4513');
        dirtGradient.addColorStop(0.3, '#654321');
        dirtGradient.addColorStop(1, '#3E2723');
        this.ctx.fillStyle = dirtGradient;
        this.ctx.fillRect(0, this.groundY, this.canvas.width, this.canvas.height - this.groundY);
        
        // Main grass surface with richer gradient
        const grassGradient = this.ctx.createLinearGradient(0, this.groundY - 15, 0, this.groundY + 5);
        grassGradient.addColorStop(0, '#32cd32');
        grassGradient.addColorStop(0.5, '#228b22');
        grassGradient.addColorStop(1, '#006400');
        this.ctx.fillStyle = grassGradient;
        this.ctx.fillRect(0, this.groundY - 15, this.canvas.width, 20);
        
        // Platform-style ground border/edge
        this.ctx.strokeStyle = '#228B22';
        this.ctx.lineWidth = 4;
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.groundY);
        this.ctx.lineTo(this.canvas.width, this.groundY);
        this.ctx.stroke();
        
        // Add highlight on top of grass
        this.ctx.strokeStyle = '#7FFF7F';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.groundY - 1);
        this.ctx.lineTo(this.canvas.width, this.groundY - 1);
        this.ctx.stroke();
    }
    
    drawObstacle(obstacle) {
        // Shadow
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.fillRect(obstacle.x + 5, obstacle.y + obstacle.height, obstacle.width, 8);
        
        // Main obstacle body with gradient
        const shadowColor = obstacle.shadow || this.darkenColor(obstacle.color, 0.3);
        const gradient = this.ctx.createLinearGradient(obstacle.x, obstacle.y, obstacle.x, obstacle.y + obstacle.height);
        gradient.addColorStop(0, obstacle.color);
        gradient.addColorStop(1, shadowColor);
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        
        // Obstacle-specific details - All cardboard box variations
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        
        // Draw cardboard box details based on type
        if (obstacle.type === 'small_box') {
            // Small box - simple tape lines
            this.ctx.fillRect(obstacle.x + 5, obstacle.y + obstacle.height/2 - 1, obstacle.width - 10, 2);
            this.ctx.fillRect(obstacle.x + obstacle.width/2 - 1, obstacle.y + 5, 2, obstacle.height - 10);
        } else if (obstacle.type === 'medium_box') {
            // Medium box - cross tape pattern
            this.ctx.fillRect(obstacle.x + 5, obstacle.y + obstacle.height/2 - 1, obstacle.width - 10, 2);
            this.ctx.fillRect(obstacle.x + obstacle.width/2 - 1, obstacle.y + 5, 2, obstacle.height - 10);
            // Extra tape strips
            this.ctx.fillRect(obstacle.x + 10, obstacle.y + obstacle.height/3, obstacle.width - 20, 1);
            this.ctx.fillRect(obstacle.x + 10, obstacle.y + 2*obstacle.height/3, obstacle.width - 20, 1);
        } else if (obstacle.type === 'large_box') {
            // Large box - reinforced with extra tape
            this.ctx.fillRect(obstacle.x + 5, obstacle.y + obstacle.height/2 - 2, obstacle.width - 10, 4);
            this.ctx.fillRect(obstacle.x + obstacle.width/2 - 2, obstacle.y + 5, 4, obstacle.height - 10);
            // Corner reinforcements
            this.ctx.fillRect(obstacle.x + 5, obstacle.y + 5, 8, 2);
            this.ctx.fillRect(obstacle.x + obstacle.width - 13, obstacle.y + 5, 8, 2);
            this.ctx.fillRect(obstacle.x + 5, obstacle.y + obstacle.height - 7, 8, 2);
            this.ctx.fillRect(obstacle.x + obstacle.width - 13, obstacle.y + obstacle.height - 7, 8, 2);
        } else if (obstacle.type === 'tall_box') {
            // Tall box - vertical reinforcement
            this.ctx.fillRect(obstacle.x + obstacle.width/2 - 1, obstacle.y + 5, 2, obstacle.height - 10);
            this.ctx.fillRect(obstacle.x + 5, obstacle.y + obstacle.height/3, obstacle.width - 10, 2);
            this.ctx.fillRect(obstacle.x + 5, obstacle.y + 2*obstacle.height/3, obstacle.width - 10, 2);
            // Side tape
            this.ctx.fillRect(obstacle.x + obstacle.width/4, obstacle.y + 3, 1, obstacle.height - 6);
            this.ctx.fillRect(obstacle.x + 3*obstacle.width/4, obstacle.y + 3, 1, obstacle.height - 6);
        }
        
        // Add "FRAGILE" text on some boxes
        if (obstacle.hasFragileLabel) {
            this.ctx.fillStyle = '#8b0000';
            this.ctx.font = 'bold 8px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('FRAGILE', obstacle.x + obstacle.width/2, obstacle.y + obstacle.height/2 + 3);
        }
        
        // Outline
        this.ctx.strokeStyle = this.darkenColor(obstacle.color, 0.4);
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    }
    
    drawCollectible(collectible) {
        const centerX = collectible.x + collectible.width / 2;
        const centerY = collectible.y + collectible.height / 2;
        
        // Create multiple glow layers for beautiful effect
        this.ctx.save();
        
        // Outer glow (largest, most transparent)
        const outerGlow = this.ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 25);
        outerGlow.addColorStop(0, collectible.color + '60');
        outerGlow.addColorStop(0.3, collectible.color + '30');
        outerGlow.addColorStop(1, collectible.color + '00');
        this.ctx.fillStyle = outerGlow;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, 25, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Middle glow
        const middleGlow = this.ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 15);
        middleGlow.addColorStop(0, collectible.color + 'AA');
        middleGlow.addColorStop(0.5, collectible.color + '60');
        middleGlow.addColorStop(1, collectible.color + '00');
        this.ctx.fillStyle = middleGlow;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, 15, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Inner glow (brightest)
        const innerGlow = this.ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 8);
        innerGlow.addColorStop(0, '#ffffff');
        innerGlow.addColorStop(0.3, collectible.color);
        innerGlow.addColorStop(1, collectible.color + '80');
        this.ctx.fillStyle = innerGlow;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, 8, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Pulsing effect - create animated brightness
        const pulseIntensity = 0.3 + Math.sin(collectible.bobOffset * 3) * 0.2;
        
        // Core highlight with pulse
        this.ctx.fillStyle = `rgba(255, 255, 255, ${pulseIntensity})`;
        this.ctx.beginPath();
        this.ctx.arc(centerX - 2, centerY - 2, 4, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw the energy symbol with enhanced styling
        this.ctx.save();
        
        // Symbol shadow
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.font = 'bold 24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(collectible.symbol, centerX + 1, centerY + 1);
        
        // Main symbol with gradient
        const symbolGradient = this.ctx.createLinearGradient(centerX, centerY - 12, centerX, centerY + 12);
        symbolGradient.addColorStop(0, '#ffffff');
        symbolGradient.addColorStop(0.5, collectible.color);
        symbolGradient.addColorStop(1, this.darkenColor(collectible.color, 0.3));
        
        this.ctx.fillStyle = symbolGradient;
        this.ctx.fillText(collectible.symbol, centerX, centerY);
        
        // Symbol outline for better visibility
        this.ctx.strokeStyle = this.darkenColor(collectible.color, 0.5);
        this.ctx.lineWidth = 1;
        this.ctx.strokeText(collectible.symbol, centerX, centerY);
        
        // Add sparkle effects around the energy symbol
        const sparkleCount = 4;
        for (let i = 0; i < sparkleCount; i++) {
            const angle = (i / sparkleCount) * Math.PI * 2 + collectible.bobOffset;
            const sparkleX = centerX + Math.cos(angle) * 18;
            const sparkleY = centerY + Math.sin(angle) * 18;
            const sparkleSize = 1 + Math.sin(collectible.bobOffset * 2 + i) * 0.5;
            
            this.ctx.fillStyle = `rgba(255, 255, 255, ${0.7 + Math.sin(collectible.bobOffset * 3 + i) * 0.3})`;
            this.ctx.beginPath();
            this.ctx.arc(sparkleX, sparkleY, sparkleSize, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        this.ctx.restore();
        this.ctx.restore();
    }
    
    drawParticle(particle) {
        this.ctx.save();
        
        const alpha = particle.life / particle.maxLife;
        this.ctx.globalAlpha = alpha;
        
        if (particle.type === 'sparkle') {
            // Twinkling sparkle effect
            const twinkleAlpha = 0.5 + 0.5 * Math.sin(particle.twinkle);
            this.ctx.globalAlpha = alpha * twinkleAlpha;
            
            // Sparkle with radiating lines
            this.ctx.fillStyle = particle.color;
            this.ctx.strokeStyle = particle.color;
            this.ctx.lineWidth = 1;
            
            // Central dot
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Radiating lines for sparkle effect
            const lineLength = particle.size * 2;
            for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 2) {
                this.ctx.beginPath();
                this.ctx.moveTo(
                    particle.x + Math.cos(angle) * particle.size,
                    particle.y + Math.sin(angle) * particle.size
                );
                this.ctx.lineTo(
                    particle.x + Math.cos(angle) * lineLength,
                    particle.y + Math.sin(angle) * lineLength
                );
                this.ctx.stroke();
            }
            
        } else if (particle.type === 'orb') {
            // Pulsing energy orb with glow
            const pulseSize = particle.size + Math.sin(particle.pulse) * 2;
            
            // Outer glow
            const glow = this.ctx.createRadialGradient(
                particle.x, particle.y, 0,
                particle.x, particle.y, pulseSize * 2
            );
            glow.addColorStop(0, particle.color + 'AA');
            glow.addColorStop(0.5, particle.color + '40');
            glow.addColorStop(1, particle.color + '00');
            
            this.ctx.fillStyle = glow;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, pulseSize * 2, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Core orb
            this.ctx.fillStyle = particle.color;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, pulseSize, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Bright center
            this.ctx.fillStyle = '#ffffff';
            this.ctx.globalAlpha = alpha * 0.7;
            this.ctx.beginPath();
            this.ctx.arc(particle.x - pulseSize * 0.3, particle.y - pulseSize * 0.3, pulseSize * 0.4, 0, Math.PI * 2);
            this.ctx.fill();
            
        } else if (particle.type === 'lightning') {
            // Electric/lightning effect
            this.ctx.strokeStyle = particle.color;
            this.ctx.lineWidth = particle.size;
            this.ctx.lineCap = 'round';
            
            // Draw jagged lightning bolt
            this.ctx.beginPath();
            this.ctx.moveTo(particle.x - 5, particle.y - 5);
            this.ctx.lineTo(particle.x + 2, particle.y);
            this.ctx.lineTo(particle.x - 2, particle.y + 2);
            this.ctx.lineTo(particle.x + 5, particle.y + 5);
            this.ctx.stroke();
            
            // Add electric glow
            this.ctx.shadowColor = particle.color;
            this.ctx.shadowBlur = 8;
            this.ctx.stroke();
            
        } else {
            // Simple particle (fallback)
            this.ctx.fillStyle = particle.color;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        this.ctx.restore();
    }
    
    drawGrassTuft(grass) {
        this.ctx.save();
        
        // Calculate sway effect
        const swayAmount = Math.sin(grass.swayOffset) * 2;
        
        for (let i = 0; i < grass.blades; i++) {
            // Calculate blade position and properties
            const bladeX = grass.x + (i / grass.blades) * grass.width;
            const bladeHeight = grass.height * (0.7 + Math.random() * 0.3);
            const bladeWidth = 1 + Math.random();
            
            // Apply sway to top of blade
            const topX = bladeX + swayAmount * (i / grass.blades);
            
            // Draw grass blade
            this.ctx.strokeStyle = grass.color;
            this.ctx.lineWidth = bladeWidth;
            this.ctx.lineCap = 'round';
            
            this.ctx.beginPath();
            this.ctx.moveTo(bladeX, grass.y);
            this.ctx.quadraticCurveTo(
                bladeX + swayAmount * 0.5, 
                grass.y - bladeHeight * 0.5,
                topX, 
                grass.y - bladeHeight
            );
            this.ctx.stroke();
        }
        
        this.ctx.restore();
    }
    
    drawPebble(pebble) {
        this.ctx.save();
        
        // Apply transparency for subtle effect
        this.ctx.globalAlpha = pebble.opacity;
        
        // Simple solid fill pebble - no borders, shadows, or highlights
        this.ctx.fillStyle = pebble.color;
        if (pebble.shape === 'round') {
            this.ctx.beginPath();
            this.ctx.arc(pebble.x, pebble.y, pebble.size, 0, Math.PI * 2);
            this.ctx.fill();
        } else {
            this.ctx.beginPath();
            this.ctx.ellipse(pebble.x, pebble.y, pebble.size, pebble.size * 0.7, 0, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        this.ctx.restore();
    }
    
    drawPlayer() {
        const character = this.characters[this.selectedCharacter];
        
        // Player shadow
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.beginPath();
        this.ctx.ellipse(this.player.x + this.player.width/2, this.groundY + 4, this.player.width/2, 6, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Calculate animation offsets
        const runCycle = Math.sin(this.player.runCycle);
        const legOffset = runCycle * 3; // Smaller leg movement
        const bobOffset = Math.abs(runCycle) * 1; // Subtle vertical bob
        const eyeBounce = Math.abs(runCycle) * 0.5; // Eye bounce when running
        
        const playerY = this.player.y - bobOffset;
        const centerX = this.player.x + this.player.width / 2;
        const centerY = playerY + this.player.height / 2;
        
        // Draw small legs first (behind the body)
        this.ctx.fillStyle = character.color;
        
        // Calculate leg positions to connect to the bottom of the body
        const bodyRadius = this.player.width * 0.4;
        const legAttachY = centerY + bodyRadius - 4; // Attach to bottom of body, slightly overlapping
        
        // Left leg - small oval
        this.ctx.beginPath();
        this.ctx.ellipse(centerX - 8, legAttachY + legOffset, 4, 12, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Right leg - small oval  
        this.ctx.beginPath();
        this.ctx.ellipse(centerX + 8, legAttachY - legOffset, 4, 12, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Main body - large blue furry ball
        this.ctx.fillStyle = character.color;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, bodyRadius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Add fur texture to body
        this.drawFurTexture(centerX, centerY, bodyRadius);
        
        // Large round eyes - white base
        const eyeSize = bodyRadius * 0.3;
        const eyeOffsetX = bodyRadius * 0.3;
        const eyeOffsetY = -bodyRadius * 0.2 + eyeBounce;
        
        // Left eye white
        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.arc(centerX - eyeOffsetX, centerY + eyeOffsetY, eyeSize, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Right eye white
        this.ctx.beginPath();
        this.ctx.arc(centerX + eyeOffsetX, centerY + eyeOffsetY, eyeSize, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Eye pupils - large and expressive
        const pupilSize = eyeSize * 0.6;
        const pupilOffsetY = eyeBounce * 0.5;
        
        this.ctx.fillStyle = '#000000';
        // Left pupil
        this.ctx.beginPath();
        this.ctx.arc(centerX - eyeOffsetX, centerY + eyeOffsetY + pupilOffsetY, pupilSize, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Right pupil
        this.ctx.beginPath();
        this.ctx.arc(centerX + eyeOffsetX, centerY + eyeOffsetY + pupilOffsetY, pupilSize, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Eye highlights for liveliness
        this.ctx.fillStyle = '#ffffff';
        const highlightSize = pupilSize * 0.3;
        
        // Left eye highlight
        this.ctx.beginPath();
        this.ctx.arc(centerX - eyeOffsetX - pupilSize * 0.3, centerY + eyeOffsetY - pupilSize * 0.3, highlightSize, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Right eye highlight
        this.ctx.beginPath();
        this.ctx.arc(centerX + eyeOffsetX - pupilSize * 0.3, centerY + eyeOffsetY - pupilSize * 0.3, highlightSize, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    drawFluffyDave(playerY, legOffset, armOffset) {
        const centerX = this.player.x + this.player.width / 2;
        const character = this.characters['dave'];
        
        // Draw fluffy legs with movement - better positioned to connect to body
        this.ctx.fillStyle = character.color;
        
        // Left leg (fluffy oval) - positioned to connect to body
        this.ctx.beginPath();
        this.ctx.ellipse(this.player.x + 18, playerY + this.player.height - 18 + legOffset, 6, 15, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Right leg (fluffy oval) - positioned to connect to body
        this.ctx.beginPath();
        this.ctx.ellipse(this.player.x + 32, playerY + this.player.height - 18 - legOffset, 6, 15, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Add fur texture to legs
        this.drawFurTexture(this.player.x + 18, playerY + this.player.height - 18 + legOffset, 6);
        this.drawFurTexture(this.player.x + 32, playerY + this.player.height - 18 - legOffset, 6);
        
        // Main fluffy body (large oval) - positioned to overlap with legs
        this.ctx.fillStyle = character.color;
        this.ctx.beginPath();
        this.ctx.ellipse(centerX, playerY + 32, 20, 28, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Add fur texture to body
        this.drawFurTexture(centerX, playerY + 32, 20);
        
        // Fluffy arms with movement
        this.ctx.fillStyle = character.color;
        
        // Left arm (fluffy oval)
        this.ctx.beginPath();
        this.ctx.ellipse(this.player.x + 8, playerY + 25 + armOffset, 8, 5, Math.PI/6, 0, Math.PI * 2);
        this.ctx.fill();
        this.drawFurTexture(this.player.x + 8, playerY + 25 + armOffset, 6);
        
        // Right arm (fluffy oval)
        this.ctx.beginPath();
        this.ctx.ellipse(this.player.x + this.player.width - 8, playerY + 25 - armOffset, 8, 5, -Math.PI/6, 0, Math.PI * 2);
        this.ctx.fill();
        this.drawFurTexture(this.player.x + this.player.width - 8, playerY + 25 - armOffset, 6);
        
        // Fluffy head (large oval)
        this.ctx.fillStyle = character.color;
        this.ctx.beginPath();
        this.ctx.ellipse(centerX, playerY + 8, 15, 18, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Add fur texture to head
        this.drawFurTexture(centerX, playerY + 8, 15);
        
        // Eyes area (white ovals behind glasses)
        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.ellipse(centerX - 4, playerY + 6, 3, 4, 0, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.ellipse(centerX + 4, playerY + 6, 3, 4, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Large googly eyes
        this.ctx.fillStyle = '#000000';
        this.ctx.beginPath();
        this.ctx.ellipse(centerX - 4, playerY + 6, 2, 3, 0, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.ellipse(centerX + 4, playerY + 6, 2, 3, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Eye highlights
        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.arc(centerX - 4, playerY + 5, 1, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(centerX + 4, playerY + 5, 1, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Glasses frames
        this.ctx.strokeStyle = '#333333';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.ellipse(centerX - 4, playerY + 6, 5, 6, 0, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.beginPath();
        this.ctx.ellipse(centerX + 4, playerY + 6, 5, 6, 0, 0, Math.PI * 2);
        this.ctx.stroke();
        
        // Bridge of glasses
        this.ctx.beginPath();
        this.ctx.moveTo(centerX - 1, playerY + 6);
        this.ctx.lineTo(centerX + 1, playerY + 6);
        this.ctx.stroke();
        
        // Small mouth
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.arc(centerX, playerY + 12, 2, 0, Math.PI);
        this.ctx.stroke();
    }
    
    drawRegularCharacter(character, playerY, legOffset, armOffset) {
        // Draw legs (rounded rectangles) - better positioned to connect to body
        this.ctx.fillStyle = character.accent;
        
        // Left leg - positioned to connect to body
        this.ctx.beginPath();
        this.roundRect(this.ctx, this.player.x + 15, playerY + this.player.height - 30 + legOffset, 8, 30, 4);
        this.ctx.fill();
        
        // Right leg - positioned to connect to body
        this.ctx.beginPath();
        this.roundRect(this.ctx, this.player.x + 32, playerY + this.player.height - 30 - legOffset, 8, 30, 4);
        this.ctx.fill();
        
        // Main body (rounded rectangle) - positioned to overlap with legs
        this.ctx.fillStyle = character.color;
        this.ctx.beginPath();
        this.roundRect(this.ctx, this.player.x + 10, playerY + 15, this.player.width - 20, this.player.height - 25, 8);
        this.ctx.fill();
        
        // Arms (rounded rectangles)
        this.ctx.fillStyle = character.color;
        
        // Left arm
        this.ctx.beginPath();
        this.roundRect(this.ctx, this.player.x + 2, playerY + 20 + armOffset, 12, 6, 3);
        this.ctx.fill();
        
        // Right arm
        this.ctx.beginPath();
        this.roundRect(this.ctx, this.player.x + this.player.width - 14, playerY + 20 - armOffset, 12, 6, 3);
        this.ctx.fill();
        
        // Head (circle) - smaller and better proportioned
        this.ctx.fillStyle = character.color;
        this.ctx.beginPath();
        this.ctx.arc(this.player.x + this.player.width/2, playerY + 8, 8, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Head highlight
        this.ctx.fillStyle = this.lightenColor(character.color, 0.3);
        this.ctx.beginPath();
        this.ctx.arc(this.player.x + this.player.width/2 - 2, playerY + 6, 3, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Eyes (white circles with black pupils) - adjusted for smaller head
        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.arc(this.player.x + this.player.width/2 - 3, playerY + 7, 2, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(this.player.x + this.player.width/2 + 3, playerY + 7, 2, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Pupils
        this.ctx.fillStyle = '#000000';
        this.ctx.beginPath();
        this.ctx.arc(this.player.x + this.player.width/2 - 3, playerY + 7, 1, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(this.player.x + this.player.width/2 + 3, playerY + 7, 1, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Mouth (small arc) - adjusted position
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.arc(this.player.x + this.player.width/2, playerY + 10, 1.5, 0, Math.PI);
        this.ctx.stroke();
        
        // Character-specific details for non-Dave characters
        if (this.selectedCharacter === 'mel') {
            // Coffee cup accessory
            this.ctx.fillStyle = '#8b4513';
            this.ctx.beginPath();
            this.roundRect(this.ctx, this.player.x + this.player.width + 5, playerY + 18, 8, 6, 2);
            this.ctx.fill();
            
            // Cup handle
            this.ctx.strokeStyle = '#8b4513';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(this.player.x + this.player.width + 13, playerY + 21, 3, -Math.PI/2, Math.PI/2, false);
            this.ctx.stroke();
        } else if (this.selectedCharacter === 'ash') {
            // Tech glasses - adjusted for smaller head
            this.ctx.strokeStyle = '#000000';
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.arc(this.player.x + this.player.width/2 - 3, playerY + 7, 3, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.beginPath();
            this.ctx.arc(this.player.x + this.player.width/2 + 3, playerY + 7, 3, 0, Math.PI * 2);
            this.ctx.stroke();
            
            // Bridge of glasses
            this.ctx.beginPath();
            this.ctx.moveTo(this.player.x + this.player.width/2 - 1, playerY + 7);
            this.ctx.lineTo(this.player.x + this.player.width/2 + 1, playerY + 7);
            this.ctx.stroke();
        } else if (this.selectedCharacter === 'charlie') {
            // Draw second smaller character (Riley) next to Charlie
            const rileyX = this.player.x + this.player.width + 5;
            const rileySize = 0.7;
            
            // Riley's body (smaller)
            this.ctx.fillStyle = character.accent;
            this.ctx.beginPath();
            this.roundRect(this.ctx, rileyX, playerY + 20, (this.player.width - 16) * rileySize, (this.player.height - 30) * rileySize, 6);
            this.ctx.fill();
            
            // Riley's head - smaller proportioned
            this.ctx.fillStyle = character.color;
            this.ctx.beginPath();
            this.ctx.arc(rileyX + 8, playerY + 12, 6, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Riley's eyes
            this.ctx.fillStyle = '#ffffff';
            this.ctx.beginPath();
            this.ctx.arc(rileyX + 6, playerY + 11, 1.5, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.beginPath();
            this.ctx.arc(rileyX + 10, playerY + 11, 1.5, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.fillStyle = '#000000';
            this.ctx.beginPath();
            this.ctx.arc(rileyX + 6, playerY + 11, 0.8, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.beginPath();
            this.ctx.arc(rileyX + 10, playerY + 11, 0.8, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    
    drawFurTexture(centerX, centerY, radius) {
        // Add fluffy fur texture with small random lines
        this.ctx.strokeStyle = this.darkenColor(this.characters['dave'].color, 0.2);
        this.ctx.lineWidth = 1;
        
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const startX = centerX + Math.cos(angle) * (radius * 0.7);
            const startY = centerY + Math.sin(angle) * (radius * 0.7);
            const endX = centerX + Math.cos(angle) * (radius * 0.9);
            const endY = centerY + Math.sin(angle) * (radius * 0.9);
            
            this.ctx.beginPath();
            this.ctx.moveTo(startX, startY);
            this.ctx.lineTo(endX, endY);
            this.ctx.stroke();
        }
    }
    
    drawMountain(mountain) {
        this.ctx.save();
        this.ctx.globalAlpha = mountain.opacity;
        
        // Simple triangular mountain shape with gradient
        const gradient = this.ctx.createLinearGradient(mountain.x, mountain.y, mountain.x, mountain.y + mountain.height);
        gradient.addColorStop(0, this.lightenColor(mountain.color, 0.2));
        gradient.addColorStop(1, mountain.color);
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.moveTo(mountain.x, mountain.y + mountain.height);
        this.ctx.lineTo(mountain.x + mountain.width/2, mountain.y);
        this.ctx.lineTo(mountain.x + mountain.width, mountain.y + mountain.height);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Add some atmospheric detail
        this.ctx.fillStyle = this.lightenColor(mountain.color, 0.4);
        this.ctx.beginPath();
        this.ctx.moveTo(mountain.x + mountain.width * 0.1, mountain.y + mountain.height * 0.7);
        this.ctx.lineTo(mountain.x + mountain.width * 0.3, mountain.y + mountain.height * 0.4);
        this.ctx.lineTo(mountain.x + mountain.width * 0.5, mountain.y + mountain.height * 0.8);
        this.ctx.closePath();
        this.ctx.fill();
        
        this.ctx.restore();
    }
    
    drawHill(hill) {
        this.ctx.save();
        this.ctx.globalAlpha = hill.opacity;
        
        // Rounded hill shape
        const gradient = this.ctx.createLinearGradient(hill.x, hill.y, hill.x, hill.y + hill.height);
        gradient.addColorStop(0, this.lightenColor(hill.color, 0.3));
        gradient.addColorStop(1, hill.color);
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.moveTo(hill.x, hill.y + hill.height);
        this.ctx.quadraticCurveTo(hill.x + hill.width/2, hill.y, hill.x + hill.width, hill.y + hill.height);
        this.ctx.closePath();
        this.ctx.fill();
        
        this.ctx.restore();
    }
    
    drawFlyingObject(obj) {
        this.ctx.save();
        
        if (obj.type === 'bird') {
            // Simple bird silhouette
            this.ctx.fillStyle = '#333333';
            this.ctx.globalAlpha = 0.7;
            
            // Bird body
            this.ctx.beginPath();
            this.ctx.ellipse(obj.x, obj.y, obj.size * 0.6, obj.size * 0.3, 0, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Wing animation
            const wingFlap = Math.sin(obj.animFrame * 0.5) * 0.3;
            
            // Wings
            this.ctx.beginPath();
            this.ctx.ellipse(obj.x - obj.size * 0.4, obj.y - obj.size * 0.2 + wingFlap, obj.size * 0.4, obj.size * 0.2, 0, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.beginPath();
            this.ctx.ellipse(obj.x + obj.size * 0.4, obj.y - obj.size * 0.2 - wingFlap, obj.size * 0.4, obj.size * 0.2, 0, 0, Math.PI * 2);
            this.ctx.fill();
        } else if (obj.type === 'plane') {
            // Simple airplane silhouette
            this.ctx.fillStyle = '#666666';
            this.ctx.globalAlpha = 0.8;
            
            // Plane body
            this.ctx.fillRect(obj.x - obj.size, obj.y - obj.size * 0.2, obj.size * 2, obj.size * 0.4);
            
            // Wings
            this.ctx.fillRect(obj.x - obj.size * 0.6, obj.y - obj.size * 0.5, obj.size * 1.2, obj.size * 0.3);
            
            // Tail
            this.ctx.fillRect(obj.x + obj.size * 0.8, obj.y - obj.size * 0.4, obj.size * 0.4, obj.size * 0.3);
        }
        
        this.ctx.restore();
    }
    
    drawArcadeUI() {
        if (this.gameState !== 'playing') return;
        
        // Semi-transparent overlay for UI background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, 80);
        
        // Score display (top left)
        this.ctx.fillStyle = '#00ff80';
        this.ctx.font = 'bold 32px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('SCORE', 30, 35);
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 28px Arial';
        this.ctx.fillText(this.score.toString(), 30, 65);
        
        // Distance display (top center-left)
        this.ctx.fillStyle = '#00aaff';
        this.ctx.font = 'bold 32px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('DISTANCE', 250, 35);
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 28px Arial';
        this.ctx.fillText(Math.floor(this.distance) + 'M', 250, 65);
        
        // Speed display (top center-right)
        this.ctx.fillStyle = '#ffaa00';
        this.ctx.font = 'bold 32px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('SPEED', 500, 35);
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 28px Arial';
        this.ctx.fillText((this.speed / this.baseSpeed).toFixed(1) + 'X', 500, 65);
        
        // City Lighting Level indicator (mid-top)
        this.ctx.fillStyle = '#ffd700';
        this.ctx.font = 'bold 32px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('CITY POWER', 720, 35);
        
        // Draw power bar
        const barWidth = 150;
        const barHeight = 20;
        const barX = 720;
        const barY = 45;
        
        // Bar background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // Bar border
        this.ctx.strokeStyle = '#ffd700';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(barX, barY, barWidth, barHeight);
        
        // Bar fill - shows current lighting level
        const fillWidth = (this.cityLightLevel / this.maxLightLevel) * barWidth;
        const gradient = this.ctx.createLinearGradient(barX, barY, barX + fillWidth, barY);
        gradient.addColorStop(0, '#ff4444');
        gradient.addColorStop(0.5, '#ffff00');
        gradient.addColorStop(1, '#00ff00');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(barX, barY, fillWidth, barHeight);
        
        // Percentage text and debug info
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(Math.round((this.cityLightLevel / this.maxLightLevel) * 100) + '%', barX + barWidth/2, barY + 35);
        
        // Debug: Show energy collected
        this.ctx.fillStyle = '#cccccc';
        this.ctx.font = 'bold 12px Arial';
        this.ctx.fillText(`Energy: ${this.energyCollected}`, barX + barWidth/2, barY + 50);
        
        // Controls reminder (bottom)
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(0, this.canvas.height - 60, this.canvas.width, 60);
        
        this.ctx.fillStyle = '#cccccc';
        this.ctx.font = 'bold 24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('PRESS SPACE OR TAP TO JUMP', this.canvas.width / 2, this.canvas.height - 35);
        
        this.ctx.fillStyle = '#00ff80';
        this.ctx.font = 'bold 18px Arial';
        this.ctx.fillText('AVOID BOXES • COLLECT ENERGY ⚡ TO POWER UP THE CITY!', this.canvas.width / 2, this.canvas.height - 10);
    }
    
    // Helper function to draw rounded rectangles
    roundRect(ctx, x, y, width, height, radius) {
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
    }
    
    // Helper function to lighten colors
    lightenColor(color, factor) {
        const hex = color.replace('#', '');
        const r = Math.min(255, parseInt(hex.substr(0, 2), 16) + (255 * factor));
        const g = Math.min(255, parseInt(hex.substr(2, 2), 16) + (255 * factor));
        const b = Math.min(255, parseInt(hex.substr(4, 2), 16) + (255 * factor));
        return `rgb(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)})`;
    }
    
    darkenColor(color, factor) {
        // Simple color darkening function
        const hex = color.replace('#', '');
        const r = Math.max(0, parseInt(hex.substr(0, 2), 16) * (1 - factor));
        const g = Math.max(0, parseInt(hex.substr(2, 2), 16) * (1 - factor));
        const b = Math.max(0, parseInt(hex.substr(4, 2), 16) * (1 - factor));
        return `rgb(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)})`;
    }
    
    drawPerformanceOverlay() {
        const ctx = this.ctx;
        const metrics = this.performanceMetrics;
        const breakdown = metrics.renderBreakdown;
        
        // Semi-transparent background
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(10, 10, 320, 280);
        
        // Title
        ctx.fillStyle = '#00ff00';
        ctx.font = 'bold 16px monospace';
        ctx.fillText('Performance Monitor (Ctrl+P to toggle)', 20, 30);
        
        // Basic metrics
        ctx.font = '12px monospace';
        ctx.fillStyle = '#ffffff';
        let y = 50;
        
        ctx.fillText(`FPS: ${metrics.fps}`, 20, y);
        y += 15;
        ctx.fillText(`Frame Time: ${metrics.renderTime.toFixed(2)}ms`, 20, y);
        y += 15;
        ctx.fillText(`Update Time: ${metrics.updateTime.toFixed(2)}ms`, 20, y);
        y += 15;
        ctx.fillText(`Max Render: ${metrics.maxRenderTime.toFixed(2)}ms`, 20, y);
        y += 15;
        ctx.fillText(`Max Update: ${metrics.maxUpdateTime.toFixed(2)}ms`, 20, y);
        y += 20;
        
        // Object counts
        if (metrics.objectCounts) {
            ctx.fillStyle = '#00ffff';
            ctx.fillText('Object Counts:', 20, y);
            y += 15;
            
            ctx.fillStyle = '#ffffff';
            ctx.fillText(`Obstacles: ${metrics.objectCounts.obstacles}`, 20, y);
            y += 15;
            ctx.fillText(`Collectibles: ${metrics.objectCounts.collectibles}`, 20, y);
            y += 15;
            ctx.fillText(`Particles: ${metrics.objectCounts.particles}`, 20, y);
            y += 15;
            ctx.fillText(`Grass Tufts: ${metrics.objectCounts.grassTufts}`, 20, y);
            y += 15;
            ctx.fillText(`Pebbles: ${metrics.objectCounts.pebbles}`, 20, y);
            y += 15;
            ctx.fillText(`Clouds: ${metrics.objectCounts.clouds}`, 20, y);
            y += 15;
            ctx.fillText(`Buildings: ${metrics.objectCounts.buildings}`, 20, y);
            y += 15;
            ctx.fillText(`Stars: ${metrics.objectCounts.stars}`, 20, y);
            y += 20;
        }
        
        // Render breakdown
        ctx.fillStyle = '#ffff00';
        ctx.fillText('Render Breakdown:', 20, y);
        y += 15;
        
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`Sky Gradient: ${breakdown.skyGradient.toFixed(2)}ms`, 20, y);
        y += 15;
        ctx.fillText(`Clouds: ${breakdown.clouds.toFixed(2)}ms`, 20, y);
        y += 15;
        ctx.fillText(`Buildings: ${breakdown.buildings.toFixed(2)}ms`, 20, y);
        y += 15;
        ctx.fillText(`Stars: ${breakdown.stars.toFixed(2)}ms`, 20, y);
        y += 15;
        ctx.fillText(`Ground: ${breakdown.ground.toFixed(2)}ms`, 20, y);
        y += 15;
        ctx.fillText(`Game Objects: ${breakdown.gameObjects.toFixed(2)}ms`, 20, y);
        y += 15;
        ctx.fillText(`UI: ${breakdown.ui.toFixed(2)}ms`, 20, y);
        
        // Performance warnings
        y += 20;
        if (metrics.fps < 30) {
            ctx.fillStyle = '#ff0000';
            ctx.fillText('WARNING: Low FPS!', 20, y);
            y += 15;
        }
        if (metrics.renderTime > 16.67) {
            ctx.fillStyle = '#ff0000';
            ctx.fillText('WARNING: Frame time > 16.67ms!', 20, y);
            y += 15;
        }
        
        ctx.restore();
    }
    
    updateUI() {
        // UI is now drawn directly on canvas in drawArcadeUI()
        // Keep this function for compatibility but it's no longer needed
    }
    
    showMenu() {
        this.gameState = 'menu';
        this.hideAllMenus();
        document.getElementById('startMenu').classList.remove('hidden');
    }
    
    showGameOverMenu() {
        console.log('Showing game over menu');
        this.hideAllMenus();
        
        const gameOverMenu = document.getElementById('gameOverMenu');
        gameOverMenu.classList.remove('hidden');
        console.log('Game over menu visibility:', !gameOverMenu.classList.contains('hidden'));
        
        // Show the game title
        const gameTitle = document.querySelector('.arcade-title');
        if (gameTitle) {
            gameTitle.style.display = 'block';
        }
        
        // Ensure the menu is visible and on top
        gameOverMenu.style.display = 'block';
        gameOverMenu.style.zIndex = '15000';
    }
    
    isHighScore() {
        const scores = JSON.parse(localStorage.getItem('energyDashScores') || '[]');
        
        console.log('Checking if high score. Current score:', this.score);
        console.log('Existing scores count:', scores.length);
        
        // If less than 10 scores, it's always a high score
        if (scores.length < 10) {
            console.log('Less than 10 scores, this is a high score');
            return true;
        }
        
        // Check if current score beats the lowest high score
        const lowestHighScore = scores[scores.length - 1].score;
        const isHigh = this.score > lowestHighScore;
        console.log('Lowest high score:', lowestHighScore, 'Is high score:', isHigh);
        return isHigh;
    }
    
    showLeaderboard() {
        this.gameState = 'leaderboard';
        this.hideAllMenus();
        this.updateLeaderboardDisplay();
        document.getElementById('leaderboardMenu').classList.remove('hidden');
        
        // Hide the game title
        const gameTitle = document.querySelector('.arcade-title');
        if (gameTitle) {
            gameTitle.style.display = 'none';
        }
    }
    
    hideAllMenus() {
        document.getElementById('startMenu').classList.add('hidden');
        document.getElementById('gameOverMenu').classList.add('hidden');
        document.getElementById('leaderboardMenu').classList.add('hidden');
    }
    
    saveScore() {
        const playerName = document.getElementById('playerName').value.trim();
        
        // Don't save if no name is provided
        if (!playerName) {
            console.log('No name provided, not saving score');
            return;
        }
        
        const characterName = this.selectedCharacter ? this.characters[this.selectedCharacter].name : 'Player';
        
        const scoreEntry = {
            name: playerName,
            character: characterName,
            score: this.score,
            distance: Math.floor(this.distance),
            date: new Date().toLocaleDateString()
        };
        
        console.log('Saving score entry:', scoreEntry);
        
        // Get existing scores
        let scores = JSON.parse(localStorage.getItem('energyDashScores') || '[]');
        
        // Add new score
        scores.push(scoreEntry);
        
        // Sort by score (descending)
        scores.sort((a, b) => b.score - a.score);
        
        // Keep only top 10
        scores = scores.slice(0, 10);
        
        // Save back to localStorage
        localStorage.setItem('energyDashScores', JSON.stringify(scores));
        
        // Clear the input
        document.getElementById('playerName').value = '';
    }
    
    saveScoreAnonymous() {
        const scoreEntry = {
            name: 'Anonymous',
            character: 'Player',
            score: this.score,
            distance: Math.floor(this.distance),
            date: new Date().toLocaleDateString()
        };
        
        // Get existing scores
        let scores = JSON.parse(localStorage.getItem('energyDashScores') || '[]');
        
        // Add new score
        scores.push(scoreEntry);
        
        // Sort by score (descending)
        scores.sort((a, b) => b.score - a.score);
        
        // Keep only top 10
        scores = scores.slice(0, 10);
        
        // Save back to localStorage
        localStorage.setItem('energyDashScores', JSON.stringify(scores));
    }
    
    updateLeaderboardDisplay() {
        const scores = JSON.parse(localStorage.getItem('energyDashScores') || '[]');
        const container = document.getElementById('leaderboardList');
        
        if (scores.length === 0) {
            container.innerHTML = `
                <div class="score-entry">
                    <span class="score-rank">1.</span>
                    <span style="color: #888;">NO SCORES YET</span>
                    <span class="score-value">0</span>
                </div>
                <div class="score-entry">
                    <span class="score-rank">2.</span>
                    <span style="color: #888;">BE THE FIRST</span>
                    <span class="score-value">0</span>
                </div>
                <div class="score-entry">
                    <span class="score-rank">3.</span>
                    <span style="color: #888;">TO PLAY!</span>
                    <span class="score-value">0</span>
                </div>
            `;
            return;
        }
        
        let html = '';
        // Show top 10 scores with arcade styling
        for (let i = 0; i < 10; i++) {
            if (i < scores.length) {
                const score = scores[i];
                html += `
                    <div class="score-entry">
                        <span class="score-rank">${i + 1}.</span>
                        <span>${score.name}</span>
                        <span class="score-value">${score.score.toLocaleString()}</span>
                    </div>
                `;
            } else {
                // Fill empty slots
                html += `
                    <div class="score-entry">
                        <span class="score-rank">${i + 1}.</span>
                        <span style="color: #444;">---</span>
                        <span class="score-value" style="color: #444;">0</span>
                    </div>
                `;
            }
        }
        
        container.innerHTML = html;
    }
    
    gameLoop() {
        const loopStartTime = performance.now();
        
        // Update game logic with timing
        const updateStartTime = performance.now();
        this.updateGame();
        const updateEndTime = performance.now();
        this.performanceMetrics.updateTime = updateEndTime - updateStartTime;
        this.performanceMetrics.maxUpdateTime = Math.max(this.performanceMetrics.maxUpdateTime, this.performanceMetrics.updateTime);
        
        // Render with timing
        const renderStartTime = performance.now();
        this.render();
        const renderEndTime = performance.now();
        this.performanceMetrics.renderTime = renderEndTime - renderStartTime;
        this.performanceMetrics.maxRenderTime = Math.max(this.performanceMetrics.maxRenderTime, this.performanceMetrics.renderTime);
        
        // Calculate FPS and frame timing
        const currentTime = performance.now();
        const frameTime = currentTime - this.performanceMetrics.lastTime;
        this.performanceMetrics.lastTime = currentTime;
        this.performanceMetrics.frameCount++;
        
        // Maintain rolling average of frame times
        this.performanceMetrics.frameTimes.push(frameTime);
        if (this.performanceMetrics.frameTimes.length > 60) {
            this.performanceMetrics.frameTimes.shift();
        }
        
        // Calculate FPS every 60 frames
        if (this.performanceMetrics.frameCount % 60 === 0) {
            const averageFrameTime = this.performanceMetrics.frameTimes.reduce((a, b) => a + b, 0) / this.performanceMetrics.frameTimes.length;
            this.performanceMetrics.fps = Math.round(1000 / averageFrameTime);
            
            // Log performance warnings to console
            if (this.performanceMetrics.fps < 30) {
                console.warn(`Low FPS detected: ${this.performanceMetrics.fps}fps`);
            }
            if (this.performanceMetrics.renderTime > 16.67) {
                console.warn(`High render time: ${this.performanceMetrics.renderTime.toFixed(2)}ms`);
            }
            if (this.performanceMetrics.updateTime > 8) {
                console.warn(`High update time: ${this.performanceMetrics.updateTime.toFixed(2)}ms`);
            }
            
            // Log breakdown of expensive render phases
            const breakdown = this.performanceMetrics.renderBreakdown;
            if (breakdown.clouds > 5) {
                console.warn(`Cloud rendering is expensive: ${breakdown.clouds.toFixed(2)}ms`);
            }
            if (breakdown.buildings > 5) {
                console.warn(`Building rendering is expensive: ${breakdown.buildings.toFixed(2)}ms`);
            }
            if (breakdown.gameObjects > 3) {
                console.warn(`Game object rendering is expensive: ${breakdown.gameObjects.toFixed(2)}ms`);
            }
            
            // Log object count warnings
            if (this.performanceMetrics.objectCounts) {
                const counts = this.performanceMetrics.objectCounts;
                if (counts.particles > 100) {
                    console.warn(`High particle count: ${counts.particles}`);
                }
                if (counts.clouds > 50) {
                    console.warn(`High cloud count: ${counts.clouds}`);
                }
                if (counts.obstacles > 20) {
                    console.warn(`High obstacle count: ${counts.obstacles}`);
                }
                if (counts.collectibles > 15) {
                    console.warn(`High collectible count: ${counts.collectibles}`);
                }
                if (counts.grassTufts > 50) {
                    console.warn(`High grass tuft count: ${counts.grassTufts}`);
                }
                if (counts.pebbles > 30) {
                    console.warn(`High pebble count: ${counts.pebbles}`);
                }
            }
        }
        
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Start the game when the page loads
window.addEventListener('load', () => {
    new Game();
});
