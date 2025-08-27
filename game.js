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
        this.speed = 2;
        this.baseSpeed = 2;
        this.gravity = 0.8;
        this.jumpPower = -15;
        this.gameTime = 0;
        
        // Player object
        this.player = {
            x: 100,
            y: 300,
            width: 40,
            height: 60,
            velocityY: 0,
            isJumping: false,
            isGrounded: true,
            color: '#ff6b6b'
        };
        
        // Ground level
        this.groundY = 360;
        this.player.y = this.groundY - this.player.height;
        
        // Game arrays
        this.obstacles = [];
        this.collectibles = [];
        this.backgroundElements = [];
        
        // Spawn timers
        this.obstacleSpawnTimer = 0;
        this.collectibleSpawnTimer = 0;
        this.backgroundSpawnTimer = 0;
        
        // Character data
        this.characters = {
            dave: { name: 'Dave', color: '#4a90e2', description: 'Big Softie' },
            mel: { name: 'Mel', color: '#8b4513', description: 'Coffee Lover' },
            ash: { name: 'Ash', color: '#32cd32', description: 'Tech Support' },
            charlie: { name: 'Charlie & Riley', color: '#ff69b4', description: 'Double Trouble' }
        };
        
        // Obstacle types
        this.obstacleTypes = [
            { type: 'radiator', width: 50, height: 30, color: '#d3d3d3', points: 5 },
            { type: 'toolbox', width: 40, height: 40, color: '#ff4500', points: 8 },
            { type: 'boiler', width: 60, height: 80, color: '#708090', points: 12 },
            { type: 'tap', width: 80, height: 15, color: '#4169e1', points: 6 }
        ];
        
        // Collectible types
        this.collectibleTypes = [
            { type: 'flame', symbol: '🔥', points: 10, color: '#1e90ff', rarity: 0.4 },
            { type: 'lightning', symbol: '⚡', points: 25, color: '#ffff00', rarity: 0.3 },
            { type: 'meter', symbol: '📟', points: 50, color: '#00ff00', rarity: 0.2 },
            { type: 'star', symbol: '✨', points: 100, color: '#ffd700', rarity: 0.1 }
        ];
        
        this.setupEventListeners();
        this.setupUI();
        this.generateBackground();
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
        this.player.color = this.characters[this.selectedCharacter].color;
        this.hideAllMenus();
    }
    
    resetGame() {
        this.score = 0;
        this.distance = 0;
        this.speed = this.baseSpeed;
        this.gameTime = 0;
        this.player.x = 100;
        this.player.y = this.groundY - this.player.height;
        this.player.velocityY = 0;
        this.player.isJumping = false;
        this.player.isGrounded = true;
        this.obstacles = [];
        this.collectibles = [];
        this.obstacleSpawnTimer = 0;
        this.collectibleSpawnTimer = 0;
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
            points: type.points
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
        
        const collectible = {
            x: this.canvas.width,
            y: this.groundY - 80 - Math.random() * 100, // Floating in air
            width: 30,
            height: 30,
            type: selectedType.type,
            symbol: selectedType.symbol,
            points: selectedType.points,
            color: selectedType.color,
            bobOffset: Math.random() * Math.PI * 2 // For floating animation
        };
        
        this.collectibles.push(collectible);
    }
    
    generateBackground() {
        // Generate some background elements
        for (let i = 0; i < 10; i++) {
            this.backgroundElements.push({
                x: i * 150,
                y: 50 + Math.random() * 100,
                width: 60 + Math.random() * 40,
                height: 80 + Math.random() * 60,
                color: `rgba(${100 + Math.random() * 100}, ${150 + Math.random() * 100}, ${200 + Math.random() * 55}, 0.3)`,
                speed: 0.5 + Math.random() * 0.5
            });
        }
    }
    
    updateGame() {
        if (this.gameState !== 'playing') return;
        
        this.gameTime++;
        this.distance += this.speed * 0.1;
        this.score += 1; // Base score for survival
        
        // Increase speed over time
        this.speed = this.baseSpeed + (this.gameTime * 0.001);
        
        // Update player
        this.updatePlayer();
        
        // Spawn obstacles
        this.obstacleSpawnTimer++;
        const obstacleSpawnRate = Math.max(60 - this.gameTime * 0.01, 30); // More frequent over time
        if (this.obstacleSpawnTimer > obstacleSpawnRate) {
            this.spawnObstacle();
            this.obstacleSpawnTimer = 0;
        }
        
        // Spawn collectibles
        this.collectibleSpawnTimer++;
        if (this.collectibleSpawnTimer > 180) { // Less frequent than obstacles
            if (Math.random() < 0.7) { // 70% chance to spawn
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
            collectible.bobOffset += 0.1;
            collectible.y += Math.sin(collectible.bobOffset) * 0.5; // Floating effect
            
            // Remove off-screen collectibles
            if (collectible.x + collectible.width < 0) {
                this.collectibles.splice(i, 1);
            }
            
            // Check collection
            else if (this.checkCollision(this.player, collectible)) {
                this.score += collectible.points;
                this.collectibles.splice(i, 1);
            }
        }
        
        // Update background elements
        for (let element of this.backgroundElements) {
            element.x -= element.speed;
            if (element.x + element.width < 0) {
                element.x = this.canvas.width + Math.random() * 200;
            }
        }
        
        this.updateUI();
    }
    
    checkCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('finalDistance').textContent = Math.floor(this.distance);
        this.showGameOverMenu();
    }
    
    render() {
        // Clear canvas
        this.ctx.fillStyle = '#87ceeb';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw background elements (buildings)
        for (let element of this.backgroundElements) {
            this.ctx.fillStyle = element.color;
            this.ctx.fillRect(element.x, element.y, element.width, element.height);
            
            // Simple windows
            this.ctx.fillStyle = 'rgba(255, 255, 0, 0.6)';
            for (let i = 0; i < 3; i++) {
                for (let j = 0; j < 4; j++) {
                    if (Math.random() > 0.3) {
                        this.ctx.fillRect(
                            element.x + 10 + i * 15,
                            element.y + 10 + j * 15,
                            8, 8
                        );
                    }
                }
            }
        }
        
        // Draw ground
        this.ctx.fillStyle = '#228b22';
        this.ctx.fillRect(0, this.groundY, this.canvas.width, this.canvas.height - this.groundY);
        
        // Draw ground line
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.groundY);
        this.ctx.lineTo(this.canvas.width, this.groundY);
        this.ctx.stroke();
        
        // Draw obstacles
        for (let obstacle of this.obstacles) {
            this.ctx.fillStyle = obstacle.color;
            this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
            
            // Add simple details based on type
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            if (obstacle.type === 'radiator') {
                // Draw radiator lines
                for (let i = 0; i < 3; i++) {
                    this.ctx.fillRect(obstacle.x + 10 + i * 10, obstacle.y + 5, 2, 20);
                }
            } else if (obstacle.type === 'toolbox') {
                // Draw handle
                this.ctx.fillRect(obstacle.x + 15, obstacle.y - 5, 10, 5);
            } else if (obstacle.type === 'boiler') {
                // Draw pipes
                this.ctx.fillRect(obstacle.x + 20, obstacle.y - 10, 5, 15);
                this.ctx.fillRect(obstacle.x + 35, obstacle.y - 10, 5, 15);
            }
        }
        
        // Draw collectibles
        for (let collectible of this.collectibles) {
            // Draw glow effect
            this.ctx.fillStyle = collectible.color + '40';
            this.ctx.fillRect(
                collectible.x - 5, collectible.y - 5,
                collectible.width + 10, collectible.height + 10
            );
            
            // Draw collectible
            this.ctx.fillStyle = collectible.color;
            this.ctx.fillRect(collectible.x, collectible.y, collectible.width, collectible.height);
            
            // Draw symbol
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '20px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(
                collectible.symbol,
                collectible.x + collectible.width / 2,
                collectible.y + collectible.height / 2 + 7
            );
        }
        
        // Draw player
        this.ctx.fillStyle = this.player.color;
        this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
        
        // Draw simple character details
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(this.player.x + 10, this.player.y + 10, 8, 8); // Eyes
        this.ctx.fillRect(this.player.x + 22, this.player.y + 10, 8, 8);
        
        // Draw character name
        this.ctx.fillStyle = '#000000';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'center';
        if (this.selectedCharacter) {
            this.ctx.fillText(
                this.characters[this.selectedCharacter].name,
                this.player.x + this.player.width / 2,
                this.player.y - 5
            );
        }
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
