// The Things Energy Dash - Game Logic
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.gameState = 'menu'; // menu, playing, gameOver, leaderboard
        this.selectedCharacter = null;
        
        // Game variables
        this.score = 0;
        this.distance = 0;
        this.speed = 3.5;
        this.baseSpeed = 3.5;
        this.gravity = 0.7;
        this.jumpPower = -16;
        this.gameTime = 0;
        this.backgroundOffset = 0;
        this.cloudOffset = 0;
        
        // Player object
        this.player = {
            x: 100,
            y: 300,
            width: 50,
            height: 70,
            velocityY: 0,
            isJumping: false,
            isGrounded: true,
            color: '#ff6b6b',
            animFrame: 0,
            runCycle: 0
        };
        
        // Ground level
        this.groundY = 360;
        this.player.y = this.groundY - this.player.height;
        
        // Game arrays
        this.obstacles = [];
        this.collectibles = [];
        this.clouds = [];
        this.buildings = [];
        this.particles = [];
        
        // Spawn timers
        this.obstacleSpawnTimer = 0;
        this.collectibleSpawnTimer = 0;
        this.particleTimer = 0;
        
        // Character data
        this.characters = {
            dave: { name: 'Dave', color: '#4a90e2', accent: '#2c5aa0', description: 'Big Softie' },
            mel: { name: 'Mel', color: '#8b4513', accent: '#654321', description: 'Coffee Lover' },
            ash: { name: 'Ash', color: '#32cd32', accent: '#228b22', description: 'Tech Support' },
            charlie: { name: 'Charlie & Riley', color: '#ff69b4', accent: '#e91e63', description: 'Double Trouble' }
        };
        
        // Obstacle types - All cardboard boxes with different sizes
        this.obstacleTypes = [
            { type: 'small_box', width: 40, height: 35, color: '#deb887', shadow: '#cd853f', points: 5 },
            { type: 'medium_box', width: 50, height: 45, color: '#d2b48c', shadow: '#bc9a6a', points: 8 },
            { type: 'large_box', width: 60, height: 55, color: '#f5deb3', shadow: '#ddd0a3', points: 12 },
            { type: 'tall_box', width: 45, height: 65, color: '#daa520', shadow: '#b8860b', points: 10 }
        ];
        
        // Collectible types - All energy symbols with different values
        this.collectibleTypes = [
            { type: 'white_energy', symbol: '⚡', points: 10, color: '#ffffff', rarity: 0.4 },
            { type: 'yellow_energy', symbol: '⚡', points: 25, color: '#ffff00', rarity: 0.3 },
            { type: 'blue_energy', symbol: '⚡', points: 50, color: '#00bfff', rarity: 0.2 },
            { type: 'gold_energy', symbol: '⚡', points: 100, color: '#ffd700', rarity: 0.1 }
        ];
        
        this.setupEventListeners();
        this.setupUI();
        this.generateBackground();
        this.generateClouds();
        this.gameLoop();
    }
    
    setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' || e.code === 'ArrowUp') {
                e.preventDefault();
                this.jump();
            }
        });
        
        // Touch controls
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.jump();
        });
        
        // Mouse controls (for testing)
        this.canvas.addEventListener('click', () => {
            this.jump();
        });
    }
    
    setupUI() {
        // Character selection
        const characterBtns = document.querySelectorAll('.character-btn');
        characterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                characterBtns.forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                this.selectedCharacter = btn.dataset.character;
                document.getElementById('startBtn').disabled = false;
            });
        });
        
        // Start game button
        document.getElementById('startBtn').addEventListener('click', () => {
            if (this.selectedCharacter) {
                this.startGame();
            }
        });
        
        // Restart button
        document.getElementById('restartBtn').addEventListener('click', () => {
            this.saveScore();
            this.resetGame();
            this.showMenu();
        });
        
        // Leaderboard buttons
        document.getElementById('showLeaderboardBtn').addEventListener('click', () => {
            this.saveScore();
            this.showLeaderboard();
        });
        
        document.getElementById('backToMenuBtn').addEventListener('click', () => {
            this.showMenu();
        });
    }
    
    startGame() {
        this.gameState = 'playing';
        this.resetGame();
        if (this.selectedCharacter) {
            this.player.color = this.characters[this.selectedCharacter].color;
        }
        this.hideAllMenus();
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
        this.obstacleSpawnTimer = 0;
        this.collectibleSpawnTimer = 0;
        this.particleTimer = 0;
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
            width: 35,
            height: 35,
            type: selectedType.type,
            symbol: selectedType.symbol,
            points: selectedType.points,
            color: selectedType.color,
            bobOffset: Math.random() * Math.PI * 2 // For floating animation
        };
        
        this.collectibles.push(collectible);
    }
    
    generateBackground() {
        // Generate buildings with better variety
        this.buildings = [];
        for (let i = 0; i < 15; i++) {
            const height = 60 + Math.random() * 120;
            const building = {
                x: i * 120 + Math.random() * 40,
                y: this.groundY - height,
                width: 80 + Math.random() * 40,
                height: height,
                color: this.getRandomBuildingColor(),
                windowPattern: Math.floor(Math.random() * 3),
                speed: 0.3 + Math.random() * 0.2,
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
                        lit: Math.random() > 0.2 // 80% chance of being lit
                    });
                }
            }
            
            this.buildings.push(building);
        }
    }
    
    generateClouds() {
        // Generate fluffy clouds
        this.clouds = [];
        for (let i = 0; i < 8; i++) {
            this.clouds.push({
                x: i * 200 + Math.random() * 100,
                y: 30 + Math.random() * 80,
                size: 40 + Math.random() * 30,
                speed: 0.2 + Math.random() * 0.3,
                opacity: 0.6 + Math.random() * 0.3
            });
        }
    }
    
    getRandomBuildingColor() {
        const colors = [
            '#b0c4de', '#d3d3d3', '#f0f8ff', '#e6e6fa', 
            '#ffefd5', '#fff8dc', '#f5f5dc', '#faf0e6'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    createParticle(x, y, type = 'collect') {
        const colors = type === 'collect' ? ['#ffd700', '#ffff00', '#00ff00'] : ['#ff6b6b', '#ff4444'];
        this.particles.push({
            x: x,
            y: y,
            velocityX: (Math.random() - 0.5) * 4,
            velocityY: -Math.random() * 3 - 2,
            life: 30,
            maxLife: 30,
            color: colors[Math.floor(Math.random() * colors.length)],
            size: 3 + Math.random() * 3
        });
    }
    
    updateGame() {
        // Always update background elements for visual effect
        this.gameTime++;
        
        // Update buildings (always animate for visual appeal)
        for (let building of this.buildings) {
            building.x -= building.speed * 0.5; // Slower when not playing
            if (building.x + building.width < 0) {
                building.x = this.canvas.width + Math.random() * 200;
                building.height = 60 + Math.random() * 120;
                building.y = this.groundY - building.height;
                building.color = this.getRandomBuildingColor();
                
                // Regenerate windows for the new building
                building.windows = [];
                const rows = Math.floor(building.height / 25);
                const cols = Math.floor(building.width / 20);
                
                for (let row = 1; row < rows; row++) {
                    for (let col = 1; col < cols; col++) {
                        building.windows.push({
                            x: col * (building.width / cols) - 4,
                            y: row * (building.height / rows) - 4,
                            lit: Math.random() > 0.2 // 80% chance of being lit
                        });
                    }
                }
            }
        }
        
        // Update clouds (always animate)
        for (let cloud of this.clouds) {
            cloud.x -= cloud.speed * 0.3; // Slower when not playing
            if (cloud.x + cloud.size * 2 < 0) {
                cloud.x = this.canvas.width + Math.random() * 300;
                cloud.y = 30 + Math.random() * 80;
                cloud.size = 40 + Math.random() * 30;
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
        
        // Update player animation
        this.player.runCycle += this.speed * 0.2;
        
        // Update player
        this.updatePlayer();
        
        // Spawn obstacles
        this.obstacleSpawnTimer++;
        const obstacleSpawnRate = Math.max(120 - this.gameTime * 0.015, 60); // Slower spawn rate, more spacing
        if (this.obstacleSpawnTimer > obstacleSpawnRate) {
            this.spawnObstacle();
            this.obstacleSpawnTimer = 0;
        }
        
        // Spawn collectibles
        this.collectibleSpawnTimer++;
        if (this.collectibleSpawnTimer > 200) { // Less frequent than obstacles
            if (Math.random() < 0.6) { // 60% chance to spawn
                this.spawnCollectible();
            }
            this.collectibleSpawnTimer = 0;
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
            particle.velocityY += 0.2; // Gravity
            particle.life--;
            
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
        
        this.updateUI();
    }
    
    checkCollision(rect1, rect2) {
        // Add a small margin to make collisions more forgiving
        const margin = 3;
        return rect1.x + margin < rect2.x + rect2.width &&
               rect1.x + rect1.width - margin > rect2.x &&
               rect1.y + margin < rect2.y + rect2.height &&
               rect1.y + rect1.height - margin > rect2.y;
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('finalDistance').textContent = Math.floor(this.distance);
        this.showGameOverMenu();
    }
    
    render() {
        // Clear canvas with gradient sky
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#87ceeb');
        gradient.addColorStop(0.7, '#b0e0e6');
        gradient.addColorStop(1, '#98fb98');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw clouds with proper layering
        this.ctx.save();
        for (let cloud of this.clouds) {
            this.drawCloud(cloud.x, cloud.y, cloud.size, cloud.opacity);
        }
        this.ctx.restore();
        
        // Draw buildings with depth
        for (let building of this.buildings) {
            this.drawBuilding(building);
        }
        
        // Draw ground with texture
        this.drawGround();
        
        // Only draw game elements when playing
        if (this.gameState === 'playing') {
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
    }
    
    drawCloud(x, y, size, opacity) {
        this.ctx.save();
        this.ctx.globalAlpha = opacity;
        
        // Create a more natural cloud shape with overlapping circles
        const cloudParts = [
            { x: 0, y: 0, r: size * 0.5 },
            { x: size * 0.3, y: size * 0.1, r: size * 0.4 },
            { x: size * 0.6, y: 0, r: size * 0.35 },
            { x: size * 0.2, y: -size * 0.15, r: size * 0.25 },
            { x: size * 0.5, y: -size * 0.1, r: size * 0.2 },
            { x: size * 0.8, y: size * 0.05, r: size * 0.15 }
        ];
        
        // Draw cloud shadow first
        this.ctx.fillStyle = 'rgba(200, 200, 200, 0.3)';
        for (let part of cloudParts) {
            this.ctx.beginPath();
            this.ctx.arc(x + part.x + 2, y + part.y + 2, part.r, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // Draw main cloud
        this.ctx.fillStyle = '#ffffff';
        for (let part of cloudParts) {
            this.ctx.beginPath();
            this.ctx.arc(x + part.x, y + part.y, part.r, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // Add subtle highlight
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        for (let i = 0; i < 3; i++) {
            const part = cloudParts[i];
            this.ctx.beginPath();
            this.ctx.arc(x + part.x - part.r * 0.2, y + part.y - part.r * 0.2, part.r * 0.3, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        this.ctx.restore();
    }
    
    drawBuilding(building) {
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
        // Ground base
        this.ctx.fillStyle = '#228b22';
        this.ctx.fillRect(0, this.groundY, this.canvas.width, this.canvas.height - this.groundY);
        
        // Ground texture lines
        this.ctx.strokeStyle = '#32cd32';
        this.ctx.lineWidth = 1;
        for (let i = 0; i < this.canvas.width; i += 20) {
            const x = (i - this.backgroundOffset) % this.canvas.width;
            this.ctx.beginPath();
            this.ctx.moveTo(x, this.groundY + 5);
            this.ctx.lineTo(x + 10, this.groundY + 5);
            this.ctx.stroke();
        }
        
        // Ground border
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.groundY);
        this.ctx.lineTo(this.canvas.width, this.groundY);
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
        this.ctx.globalAlpha = particle.life / particle.maxLife;
        this.ctx.fillStyle = particle.color;
        this.ctx.beginPath();
        this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
    }
    
    drawPlayer() {
        // Don't draw player if no character is selected
        if (!this.selectedCharacter || !this.characters[this.selectedCharacter]) {
            return;
        }
        
        const character = this.characters[this.selectedCharacter];
        
        // Player shadow
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.beginPath();
        this.ctx.ellipse(this.player.x + this.player.width/2, this.groundY + 4, this.player.width/2, 6, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Calculate animation offsets
        const runCycle = Math.sin(this.player.runCycle);
        const legOffset = runCycle * 4;
        const armOffset = Math.sin(this.player.runCycle + Math.PI) * 3;
        const bobOffset = Math.abs(runCycle) * 2; // Slight vertical bob when running
        
        const playerY = this.player.y - bobOffset;
        
        // Special rendering for Dave (fluffy character)
        if (this.selectedCharacter === 'dave') {
            this.drawFluffyDave(playerY, legOffset, armOffset);
        } else {
            // Regular character rendering for others
            this.drawRegularCharacter(character, playerY, legOffset, armOffset);
        }
        
        // Character name with better styling
        this.ctx.fillStyle = '#000000';
        this.ctx.font = 'bold 12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(
            character.name,
            this.player.x + this.player.width / 2 + 1,
            playerY - 12
        );
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillText(
            character.name,
            this.player.x + this.player.width / 2,
            playerY - 13
        );
    }
    
    drawFluffyDave(playerY, legOffset, armOffset) {
        const centerX = this.player.x + this.player.width / 2;
        const character = this.characters['dave'];
        
        // Draw fluffy legs with movement
        this.ctx.fillStyle = character.color;
        
        // Left leg (fluffy oval)
        this.ctx.beginPath();
        this.ctx.ellipse(this.player.x + 15, playerY + this.player.height - 15 + legOffset, 6, 12, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Right leg (fluffy oval)
        this.ctx.beginPath();
        this.ctx.ellipse(this.player.x + 30, playerY + this.player.height - 15 - legOffset, 6, 12, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Add fur texture to legs
        this.drawFurTexture(this.player.x + 15, playerY + this.player.height - 15 + legOffset, 6);
        this.drawFurTexture(this.player.x + 30, playerY + this.player.height - 15 - legOffset, 6);
        
        // Main fluffy body (large oval)
        this.ctx.fillStyle = character.color;
        this.ctx.beginPath();
        this.ctx.ellipse(centerX, playerY + 30, 20, 25, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Add fur texture to body
        this.drawFurTexture(centerX, playerY + 30, 20);
        
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
        // Draw legs (rounded rectangles)
        this.ctx.fillStyle = character.accent;
        
        // Left leg
        this.ctx.beginPath();
        this.roundRect(this.ctx, this.player.x + 12, playerY + this.player.height - 25 + legOffset, 8, 25, 4);
        this.ctx.fill();
        
        // Right leg  
        this.ctx.beginPath();
        this.roundRect(this.ctx, this.player.x + 28, playerY + this.player.height - 25 - legOffset, 8, 25, 4);
        this.ctx.fill();
        
        // Main body (rounded rectangle)
        this.ctx.fillStyle = character.color;
        this.ctx.beginPath();
        this.roundRect(this.ctx, this.player.x + 8, playerY + 15, this.player.width - 16, this.player.height - 30, 8);
        this.ctx.fill();
        
        // Arms (rounded rectangles)
        this.ctx.fillStyle = character.color;
        
        // Left arm
        this.ctx.beginPath();
        this.roundRect(this.ctx, this.player.x - 2, playerY + 20 + armOffset, 12, 6, 3);
        this.ctx.fill();
        
        // Right arm
        this.ctx.beginPath();
        this.roundRect(this.ctx, this.player.x + this.player.width - 10, playerY + 20 - armOffset, 12, 6, 3);
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
    
    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('distance').textContent = Math.floor(this.distance);
        document.getElementById('speed').textContent = (this.speed / this.baseSpeed).toFixed(1);
    }
    
    showMenu() {
        this.gameState = 'menu';
        this.hideAllMenus();
        document.getElementById('startMenu').classList.remove('hidden');
    }
    
    showGameOverMenu() {
        document.getElementById('gameOverMenu').classList.remove('hidden');
    }
    
    showLeaderboard() {
        this.gameState = 'leaderboard';
        this.hideAllMenus();
        this.updateLeaderboardDisplay();
        document.getElementById('leaderboardMenu').classList.remove('hidden');
    }
    
    hideAllMenus() {
        document.getElementById('startMenu').classList.add('hidden');
        document.getElementById('gameOverMenu').classList.add('hidden');
        document.getElementById('leaderboardMenu').classList.add('hidden');
    }
    
    saveScore() {
        const playerName = document.getElementById('playerName').value || 'Anonymous';
        const characterName = this.selectedCharacter ? this.characters[this.selectedCharacter].name : 'Unknown';
        
        const scoreEntry = {
            name: playerName,
            character: characterName,
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
        
        // Clear the input
        document.getElementById('playerName').value = '';
    }
    
    updateLeaderboardDisplay() {
        const scores = JSON.parse(localStorage.getItem('energyDashScores') || '[]');
        const container = document.getElementById('leaderboardList');
        
        if (scores.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #b3d9ff;">No scores yet!</p>';
            return;
        }
        
        let html = '<h3>Top 10 Scores</h3>';
        scores.forEach((score, index) => {
            html += `
                <div class="leaderboard-entry">
                    <span>${index + 1}. ${score.name} (${score.character})</span>
                    <span>${score.score} pts (${score.distance}m)</span>
                </div>
            `;
        });
        
        container.innerHTML = html;
    }
    
    gameLoop() {
        this.updateGame();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Start the game when the page loads
window.addEventListener('load', () => {
    new Game();
});
