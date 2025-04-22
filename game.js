class Snake {
    constructor() {
        this.segments = [
            { x: 10, y: 10 }
        ];
        this.direction = 'right';
        this.nextDirection = 'right';
    }

    move(food) {
        const head = { ...this.segments[0] };

        switch (this.direction) {
            case 'up': head.y--; break;
            case 'down': head.y++; break;
            case 'left': head.x--; break;
            case 'right': head.x++; break;
        }

        // Wrap around logic
        head.x = (head.x + 20) % 20; // Wrap horizontally
        head.y = (head.y + 20) % 20; // Wrap vertically

        this.segments.unshift(head);
        
        if (head.x === food.x && head.y === food.y) {
            return true;
        }

        this.segments.pop();
        return false;
    }

    changeDirection(newDirection) {
        const opposites = {
            'up': 'down',
            'down': 'up',
            'left': 'right',
            'right': 'left'
        };

        if (opposites[this.direction] !== newDirection) {
            this.nextDirection = newDirection;
        }
    }

    update() {
        this.direction = this.nextDirection;
    }

    checkCollision(gridSize) {
        const head = this.segments[0];

        // Only check for self collision
        for (let i = 1; i < this.segments.length; i++) {
            if (head.x === this.segments[i].x && 
                head.y === this.segments[i].y) {
                return true;
            }
        }

        return false;
    }
}

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.gridSize = 20;
        this.setupCanvas();
        this.gameLoopId = null;
        this.initGame();
        this.touchStartX = null;
        this.touchStartY = null;
        this.paused = false;

        // Show intro screen for 3 seconds
        const introScreen = document.getElementById('introScreen');
        introScreen.style.display = 'flex';
        setTimeout(() => {
            introScreen.style.display = 'none';
            this.paused = false;
        }, 3000);

        // Add window resize event
        window.addEventListener('resize', this.handleResize.bind(this));

        document.addEventListener('keydown', this.handleKeyPress.bind(this));
        
        // Add touch event listeners for mobile - ensure they're properly passive
        this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), {passive: false});
        this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this), {passive: false});
        this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this), {passive: false});
        
        document.getElementById('restartButton').addEventListener('click', this.restartGame.bind(this));
        
        // Start the game loop only once
        this.startGameLoop();
    }

    handleResize() {
        this.setupCanvas();
        this.draw(); // Redraw immediately after resize
    }

    restartGame() {
        if (this.gameLoopId) {
            clearTimeout(this.gameLoopId);
            this.gameLoopId = null;
        }
        this.snake = new Snake();
        this.food = this.generateFood();
        this.score = 0;
        this.level = 1;
        this.gameOver = false;
        this.paused = false;
        document.getElementById('score').textContent = this.score;
        document.getElementById('level').textContent = this.level;
        this.startGameLoop();
    }

    startGameLoop() {
        const loop = () => {
            if (!this.paused) {
                this.update();
            }
            this.draw();
            // Adjust speed based on level: starts at 200ms delay at level 1, decreases by 15ms per level
            const delay = Math.max(50, 200 - ((this.level - 1) * 15));
            this.gameLoopId = setTimeout(loop, delay);
        };
        loop();
    }

    initGame() {
        this.snake = new Snake();
        this.food = this.generateFood();
        this.score = 0;
        this.level = 1;
        this.gameOver = false;
        this.paused = true; // Start paused for intro screen
        document.getElementById('score').textContent = this.score;
        document.getElementById('level').textContent = this.level;
    }

    generateFood() {
        const food = {
            x: Math.floor(Math.random() * this.gridSize),
            y: Math.floor(Math.random() * this.gridSize)
        };

        // Ensure food doesn't spawn on snake
        for (const segment of this.snake.segments) {
            if (food.x === segment.x && food.y === segment.y) {
                return this.generateFood();
            }
        }

        return food;
    }

    setupCanvas() {
        // Better mobile-friendly canvas sizing
        const maxWidth = Math.min(window.innerWidth - 20, 400);
        const maxHeight = Math.min(window.innerHeight - 160, 400);
        const size = Math.min(maxWidth, maxHeight);
        
        this.canvas.width = size;
        this.canvas.height = size;
        this.tileSize = this.canvas.width / this.gridSize;
    }

    handleTouchStart(event) {
        event.preventDefault();
        if (this.gameOver) return;
        
        const touch = event.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        this.touchStartX = touch.clientX - rect.left;
        this.touchStartY = touch.clientY - rect.top;
    }

    handleTouchMove(event) {
        event.preventDefault();
        if (this.gameOver || !this.touchStartX || !this.touchStartY) return;

        const touch = event.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        const currentX = touch.clientX - rect.left;
        const currentY = touch.clientY - rect.top;

        const deltaX = currentX - this.touchStartX;
        const deltaY = currentY - this.touchStartY;

        // Minimum swipe distance threshold (smaller for better responsiveness)
        const minSwipeDistance = 20;

        if (Math.abs(deltaX) > minSwipeDistance || Math.abs(deltaY) > minSwipeDistance) {
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                // Horizontal swipe
                if (deltaX > 0) {
                    this.snake.changeDirection('right');
                } else {
                    this.snake.changeDirection('left');
                }
            } else {
                // Vertical swipe
                if (deltaY > 0) {
                    this.snake.changeDirection('down');
                } else {
                    this.snake.changeDirection('up');
                }
            }
            
            // Reset touch start position after direction change
            this.touchStartX = currentX;
            this.touchStartY = currentY;
        }
    }

    handleTouchEnd(event) {
        event.preventDefault();
        this.touchStartX = null;
        this.touchStartY = null;
    }

    handleKeyPress(event) {
        if (this.gameOver) return;
        
        const keyMap = {
            'ArrowUp': 'up',
            'w': 'up',
            'W': 'up',
            'ArrowDown': 'down',
            's': 'down',
            'S': 'down',
            'ArrowLeft': 'left',
            'a': 'left',
            'A': 'left',
            'ArrowRight': 'right',
            'd': 'right',
            'D': 'right'
        };

        if (keyMap[event.key]) {
            event.preventDefault(); // Prevent page scrolling with arrow keys
            this.snake.changeDirection(keyMap[event.key]);
        }
    }

    update() {
        if (this.gameOver || this.paused) return;

        this.snake.update();

        if (this.snake.move(this.food)) {
            this.score++;
            document.getElementById('score').textContent = this.score;
            this.food = this.generateFood();
            
            // Level up every 4 points
            if (this.score % 4 === 0) {
                this.level++;
                document.getElementById('level').textContent = this.level;
                
                // Show level up popup
                const levelUpPopup = document.getElementById('levelUpPopup');
                document.getElementById('popupLevel').textContent = this.level;
                levelUpPopup.style.display = 'block';
                
                // Pause the game during level up
                this.paused = true;
                
                // Resume after 2 seconds (reduced from 3 for better game flow)
                setTimeout(() => {
                    levelUpPopup.style.display = 'none';
                    this.paused = false;
                }, 2000);
            }
        }

        if (this.snake.checkCollision(this.gridSize)) {
            this.gameOver = true;
        }
    }

    draw() {
        // Clear the canvas first
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw Albanian flag background
        this.ctx.fillStyle = '#E41E20';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw snake with animation
        const animationProgress = (Date.now() % 500) / 500; // Animation cycle of 500ms
        
        // Draw snake with animation
        for (let i = this.snake.segments.length - 1; i >= 0; i--) {
            const segment = this.snake.segments[i];
            const isHead = i === 0;
            const scale = isHead ? 1.2 : (1 - (i * 0.05)); // Head slightly larger
            
            // Add subtle wave motion
            const waveOffset = Math.sin(Date.now() / 200 + i) * 2;
            
            this.ctx.save();
            this.ctx.translate(
                (segment.x + 0.5) * this.tileSize,
                (segment.y + 0.5) * this.tileSize + waveOffset
            );
            this.ctx.scale(scale, scale);

            // Rotate head based on direction
            if (isHead) {
                let rotation = 0;
                switch (this.snake.direction) {
                    case 'up': rotation = -Math.PI/2; break;
                    case 'down': rotation = Math.PI/2; break;
                    case 'left': rotation = Math.PI; break;
                    case 'right': rotation = 0; break;
                }
                this.ctx.rotate(rotation);
            }
            
            // Draw body segment or head
            const size = this.tileSize - 2;
            if (isHead) {
                // Draw triangular head
                this.ctx.fillStyle = '#4CAF50';
                this.ctx.beginPath();
                this.ctx.moveTo(size/2, 0);
                this.ctx.lineTo(-size/2, -size/2);
                this.ctx.lineTo(-size/2, size/2);
                this.ctx.closePath();
                this.ctx.fill();

                // Draw eyes
                this.ctx.fillStyle = '#000';
                this.ctx.beginPath();
                this.ctx.arc(-size/6, -size/4, size/8, 0, Math.PI * 2);
                this.ctx.arc(-size/6, size/4, size/8, 0, Math.PI * 2);
                this.ctx.fill();
            } else {
                // Draw rounded rectangle for body segments
                this.ctx.fillStyle = '#4CAF50';
                this.ctx.beginPath();
                this.ctx.roundRect(-size/2, -size/2, size, size, 5);
                this.ctx.fill();
            }
            
            this.ctx.restore();
        }

        // Draw food
        this.ctx.fillStyle = '#fff';
        this.ctx.beginPath();
        this.ctx.arc(
            (this.food.x + 0.5) * this.tileSize,
            (this.food.y + 0.5) * this.tileSize,
            this.tileSize/2 - 1,
            0,
            Math.PI * 2
        );
        this.ctx.fill();

        if (this.gameOver) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold ' + Math.floor(this.canvas.width / 10) + 'px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Game Over!', this.canvas.width / 2, this.canvas.height / 2);
            this.ctx.font = 'bold ' + Math.floor(this.canvas.width / 20) + 'px Arial';
            this.ctx.fillText('Score: ' + this.score, this.canvas.width / 2, this.canvas.height / 2 + 40);
            this.ctx.fillText('Tap Restart to Play Again', this.canvas.width / 2, this.canvas.height / 2 + 80);
        }
    }
}

// Start the game - only create one instance and don't run duplicate game loops
document.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
});
