// Game State Management
let gameState = {
  currentPhase: 'start', // start, scoop, pour, filter, results
  purity: 0,
  squeezeCount: 0,
  maxSqueezes: 15,
  gameActive: false,
  waterLevel: 100, // Water level percentage (100% = full tube)
  isSqueezing: false,
  playerName: ''
};

// DOM Elements
const screens = {
  start: document.getElementById('startScreen'),
  game: document.getElementById('gameScreen'),
  results: document.getElementById('resultsScreen')
};

const phases = {
  scoop: document.getElementById('scoopPhase'),
  pour: document.getElementById('pourPhase'),
  filter: document.getElementById('filterPhase')
};

const elements = {
  startBtn: document.getElementById('startBtn'),
  resetBtn: document.getElementById('resetBtn'),
  retryBtn: document.getElementById('retryBtn'),
  shareBtn: document.getElementById('shareBtn'),
  dirtyTub: document.getElementById('dirtyTub'),
  filledCup: document.getElementById('filledCup'),
  squeezeBtn: document.getElementById('squeezeBtn'),
  purityScore: document.getElementById('purityScore'),
  purityPercent: document.getElementById('purityPercent'),
  purityFill: document.getElementById('purityFill'),
  currentPhase: document.getElementById('currentPhase'),
  finalPurity: document.getElementById('finalPurity'),
  resultsMessage: document.getElementById('resultsMessage'),
  playerNameInput: document.getElementById('playerName')
};

// Screen Management
function showScreen(screenName) {
  Object.values(screens).forEach(screen => screen.classList.add('hidden'));
  screens[screenName].classList.remove('hidden');
}

function showPhase(phaseName) {
  Object.values(phases).forEach(phase => phase.classList.add('hidden'));
  if (phases[phaseName]) {
    phases[phaseName].classList.remove('hidden');
  }
}

// Game Flow Functions
function startGame() {
  // Capture player name
  gameState.playerName = (elements.playerNameInput?.value || 'Player').trim().slice(0,20) || 'Player';
  gameState.currentPhase = 'scoop';
  gameState.purity = 0;
  gameState.squeezeCount = 0;
  gameState.gameActive = true;
  
  showScreen('game');
  showPhase('scoop');
  updatePurityDisplay();
  elements.currentPhase.textContent = `Welcome, ${gameState.playerName}! Click the dirty tub to scoop water!`;
}

function scoopWater() {
  if (gameState.currentPhase !== 'scoop') return;
  elements.currentPhase.textContent = "Scooping...";
  // Show cup and play simple fill animation by toggling class
  const cup = document.getElementById('cup');
  if (cup) {
    cup.classList.remove('hidden');
    cup.classList.add('animate-fill');
  }
  setTimeout(() => {
    elements.currentPhase.textContent = "Great! Now pour into the filter tube!";
    gameState.currentPhase = 'pour';
    showPhase('pour');
  }, 1000);
}

function pourWater() {
  if (gameState.currentPhase !== 'pour') return;
  elements.currentPhase.textContent = "Pouring...";
  const filledCup = document.getElementById('filledCup');
  if (filledCup) {
    filledCup.classList.add('animate-pour');
  }
  // After pour animation, move to filter phase
  setTimeout(() => {
    elements.currentPhase.textContent = "Perfect! Now squeeze to filter the water!";
    gameState.currentPhase = 'filter';
    gameState.waterLevel = 100; // Reset water level to full
    showPhase('filter');
    updateWaterLevel();
    const bucket = document.getElementById('cleanBucket');
    if (bucket) {
      bucket.style.position = 'absolute';
      bucket.style.left = '';
      bucket.style.top = '';
      bucket.style.transform = 'translate(-50%, -50%)';
    }
    initializeBucketDrag();
  }, 1200);
}

function squeezeFilter() {
  if (gameState.currentPhase !== 'filter' || gameState.squeezeCount >= gameState.maxSqueezes || gameState.isSqueezing) return;
  
  gameState.isSqueezing = true;
  gameState.squeezeCount++;
  
  // Animate button press
  elements.squeezeBtn.classList.add('pressed');
  elements.squeezeBtn.disabled = true;
  
  // Reduce water level
  gameState.waterLevel = Math.max(0, gameState.waterLevel - (100 / gameState.maxSqueezes));
  updateWaterLevel();
  
  // Create multiple drops (3-6 drops per squeeze)
  const numDrops = Math.floor(Math.random() * 4) + 3; // 3-6 drops
  for (let i = 0; i < numDrops; i++) {
    setTimeout(() => {
      const isDirty = Math.random() < 0.25; // 25% chance of dirty drop
      createDrop(isDirty, i * 100); // Stagger drops by 100ms
    }, i * 150);
  }
  
  // Update progress
  elements.currentPhase.textContent = `Move bucket to catch drops! ${gameState.squeezeCount}/${gameState.maxSqueezes}`;
  
  // Release button after delay
  setTimeout(() => {
    elements.squeezeBtn.classList.remove('pressed');
    elements.squeezeBtn.classList.add('released');
    elements.squeezeBtn.disabled = false;
    gameState.isSqueezing = false;
    
    // Remove released class after animation
    setTimeout(() => {
      elements.squeezeBtn.classList.remove('released');
    }, 300);
  }, 2000); // 2 second delay for multiple drops
  
  // Check if filtering is complete
  if (gameState.squeezeCount >= gameState.maxSqueezes) {
    setTimeout(() => {
      endGame();
    }, 3000);
  }
}

function createDrop(isDirty, delay = 0) {
  const drop = document.createElement('img');
  drop.src = isDirty ? 'img/dirty-drop.svg' : 'img/water-drop.svg';
  drop.className = isDirty ? 'drop dirty-drop' : 'drop clean-drop';
  drop.style.position = 'absolute';
  drop.style.width = '22px';
  drop.style.height = '30px';
  
  // Random horizontal position with minimum spacing
  const dropZone = document.getElementById('dropZone');
  const zoneRect = dropZone.getBoundingClientRect();
  const centerX = zoneRect.width / 2;
  const minSpacing = 28; // px
  const range = Math.min(zoneRect.width - 40, 200);
  let positions = (dropZone._activePositions || []).filter(p => Date.now() - p.time < 1000);
  let x;
  for (let attempt = 0; attempt < 20; attempt++) {
    const candidate = centerX + (Math.random() - 0.5) * range;
    if (positions.every(p => Math.abs(p.x - candidate) >= minSpacing)) { x = candidate; break; }
  }
  if (x == null) x = centerX + (Math.random() - 0.5) * range;
  positions.push({ x, time: Date.now() });
  dropZone._activePositions = positions;

  drop.style.left = `${x}px`;
  drop.style.top = '20px'; // Start from tube spout area
  drop.style.zIndex = '15';
  drop.style.pointerEvents = 'auto';
  drop.style.transition = 'top 1.5s ease-in';
  dropZone.appendChild(drop);
  
  // Animate drop falling
  setTimeout(() => {
  drop.style.top = '100px'; // Fall to bottom of drop zone
  }, 50);
  
  // Check for bucket collision during fall
  const checkCollision = () => {
    if (!drop.parentNode) return;
    
    const dropRect = drop.getBoundingClientRect();
    const bucket = document.getElementById('cleanBucket');
    const bucketRect = bucket.getBoundingClientRect();
    
    // Check if drop overlaps with bucket
    if (dropRect.bottom >= bucketRect.top &&
        dropRect.top <= bucketRect.bottom &&
        dropRect.right >= bucketRect.left &&
        dropRect.left <= bucketRect.right) {
      
      // Drop caught by bucket!
      if (isDirty) {
        gameState.purity = Math.max(0, gameState.purity - 8);
        createSplash(dropRect.left + 11, dropRect.top + 15);
      } else {
        gameState.purity = Math.min(100, gameState.purity + 12);
        createCleanSplash(dropRect.left + 11, dropRect.top + 15);
        
        // Visual feedback for catching clean drop
        bucket.style.transform += ' scale(1.1)';
        setTimeout(() => {
          bucket.style.transform = bucket.style.transform.replace(' scale(1.1)', '');
        }, 200);
      }
      
      updatePurityDisplay();
      drop.remove();
      return true;
    }
    return false;
  };
  
  // Check collision every 100ms during fall
  const collisionInterval = setInterval(() => {
    if (checkCollision()) {
      clearInterval(collisionInterval);
    }
  }, 100);
  
  // Remove drop after animation if not caught
  setTimeout(() => {
    clearInterval(collisionInterval);
    if (drop.parentNode) {
      // Drop missed - no points gained or lost
      drop.remove();
    }
  }, 2100);
}

function createSplash(x, y) {
  const splash = document.createElement('img');
  splash.src = 'img/dirt-splash.svg';
  splash.className = 'splash';
  splash.style.position = 'fixed';
  splash.style.left = `${x - 20}px`;
  splash.style.top = `${y - 20}px`;
  splash.style.width = '40px';
  splash.style.height = '40px';
  splash.style.zIndex = '100';
  splash.style.pointerEvents = 'none';
  document.body.appendChild(splash);
  
  setTimeout(() => splash.remove(), 600);
}

function createCleanSplash(x, y) {
  // Create blue sparkle effect for clean drops
  for (let i = 0; i < 5; i++) {
    const sparkle = document.createElement('div');
    sparkle.style.position = 'fixed';
    sparkle.style.left = `${x + (Math.random() - 0.5) * 40}px`;
    sparkle.style.top = `${y + (Math.random() - 0.5) * 40}px`;
    sparkle.style.width = '4px';
    sparkle.style.height = '4px';
    sparkle.style.background = '#29b6f6';
    sparkle.style.borderRadius = '50%';
    sparkle.style.zIndex = '100';
    sparkle.style.opacity = '0.8';
    sparkle.style.transition = 'all 0.6s ease-out';
    sparkle.style.pointerEvents = 'none';
    document.body.appendChild(sparkle);
    
    setTimeout(() => {
      sparkle.style.opacity = '0';
      sparkle.style.transform = 'scale(0)';
    }, 50);
    
    setTimeout(() => sparkle.remove(), 650);
  }
}

function updatePurityDisplay() {
  const purityText = `${Math.round(gameState.purity)}%`;
  elements.purityScore.textContent = purityText;
  elements.purityPercent.textContent = purityText;
  elements.purityFill.style.width = `${gameState.purity}%`;
}

function updateWaterLevel() {
  // Update water level in the inline SVG
  const waterLevelRect = document.getElementById('waterLevel');
  if (waterLevelRect) {
  const maxHeight = 103; // Max height of water in new tube design
    const currentHeight = (gameState.waterLevel / 100) * maxHeight;
  const yPosition = 17 + (maxHeight - currentHeight); // Start from bottom and work up
    
    waterLevelRect.setAttribute('height', currentHeight);
    waterLevelRect.setAttribute('y', yPosition);
    
    // Update particle visibility based on water level
    const particles = document.querySelectorAll('.water-particle');
    particles.forEach((particle) => {
      const particleY = parseFloat(particle.getAttribute('cy'));
      const waterTop = yPosition;
      
      // Hide particles that are above water level
      if (particleY < waterTop) {
        particle.style.opacity = '0';
      } else {
        // Show particles with their original opacity
        const originalOpacity = particle.getAttribute('opacity') || '0.6';
        particle.style.opacity = originalOpacity;
      }
    });
  }
}

function endGame() {
  gameState.currentPhase = 'results';
  gameState.gameActive = false;
  
  // Update final results
  elements.finalPurity.textContent = `${Math.round(gameState.purity)}%`;
  
  // Set results message based on purity level
  let message = "";
  if (gameState.purity >= 90) {
    message = "Excellent! You've created very clean water that's safe to drink!";
  } else if (gameState.purity >= 70) {
    message = "Good job! The water is much cleaner now.";
  } else if (gameState.purity >= 50) {
    message = "Not bad! With more practice, you can make even cleaner water.";
  } else {
    message = "Keep trying! Clean water takes patience and skill.";
  }
  elements.resultsMessage.textContent = message;
  
  // Show results screen
  setTimeout(() => {
    showScreen('results');
    if (gameState.purity >= 80) {
      showConfetti();
    }
  }, 1000);
}

function resetGame() {
  gameState = {
    currentPhase: 'start',
    purity: 0,
    squeezeCount: 0,
    maxSqueezes: 15,
    gameActive: false,
    waterLevel: 100,
    isSqueezing: false
  };
  
  // Clear any remaining drops
  document.querySelectorAll('.drop, .splash').forEach(el => el.remove());
  
  // Reset button state
  if (elements.squeezeBtn) {
    elements.squeezeBtn.classList.remove('pressed', 'released');
    elements.squeezeBtn.disabled = false;
  }
  
  showScreen('start');
}

function shareResults() {
  const text = `I just filtered water and achieved ${Math.round(gameState.purity)}% purity in Tube Clean: Water Rescue! 💧 #CleanWater #CharityWater`;
  
  if (navigator.share) {
    navigator.share({
      title: 'Tube Clean: Water Rescue',
      text: text,
      url: window.location.href
    });
  } else {
    // Fallback to clipboard
    navigator.clipboard.writeText(text).then(() => {
      alert('Results copied to clipboard!');
    });
  }
}

// Confetti effect for good results
function showConfetti() {
  for (let i = 0; i < 50; i++) {
    const confetti = document.createElement('div');
    confetti.style.position = 'fixed';
    confetti.style.left = Math.random() * 100 + 'vw';
    confetti.style.top = '-10px';
    confetti.style.width = '8px';
    confetti.style.height = '16px';
    confetti.style.background = `hsl(${Math.random() * 360}, 80%, 60%)`;
    confetti.style.borderRadius = '3px';
    confetti.style.zIndex = '1000';
    confetti.style.opacity = '0.8';
    confetti.style.transition = 'top 2s linear, opacity 2s linear';
    confetti.style.pointerEvents = 'none';
    document.body.appendChild(confetti);
    
    setTimeout(() => {
      confetti.style.top = '100vh';
      confetti.style.opacity = '0';
    }, 100);
    
    setTimeout(() => confetti.remove(), 2100);
  }
}

// Bucket drag functionality
function initializeBucketDrag() {
  const bucket = document.getElementById('cleanBucket');
  if (!bucket) return;
  
  let isDragging = false;
  let startX, startY, initialLeft, initialTop;
  
  bucket.addEventListener('mousedown', startDrag);
  bucket.addEventListener('touchstart', startDrag);
  
  function startDrag(e) {
    isDragging = true;
    bucket.classList.add('dragging');
    
    const rect = bucket.getBoundingClientRect();
    const clientX = e.clientX || e.touches[0].clientX;
    const clientY = e.clientY || e.touches[0].clientY;
    
    startX = clientX;
    startY = clientY;
    initialLeft = rect.left;
    initialTop = rect.top;
    
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', stopDrag);
    document.addEventListener('touchmove', drag);
    document.addEventListener('touchend', stopDrag);
    
    e.preventDefault();
  }
  
  function drag(e) {
    if (!isDragging) return;
    
    const clientX = e.clientX || e.touches[0].clientX;
    
    const deltaX = clientX - startX;
    
  const bucketArea = document.querySelector('.bucket-area');
  const bucketRect = bucketArea.getBoundingClientRect();
    
  let newLeft = initialLeft + deltaX - bucketRect.left;
    
  // Constrain bucket within bucket area (horizontal only)
  newLeft = Math.max(10, Math.min(newLeft, bucketRect.width - 70));
    
    bucket.style.position = 'absolute';
    bucket.style.left = newLeft + 'px';
  bucket.style.top = '50%';
  bucket.style.transform = 'translateY(-50%)';
    
    e.preventDefault();
  }
  
  function stopDrag() {
    isDragging = false;
    bucket.classList.remove('dragging');
    
    document.removeEventListener('mousemove', drag);
    document.removeEventListener('mouseup', stopDrag);
    document.removeEventListener('touchmove', drag);
    document.removeEventListener('touchend', stopDrag);
  }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM loaded, initializing game...');
  
  // Debug: Check if elements exist
  console.log('Start button:', elements.startBtn);
  console.log('Game screen:', screens.game);
  
  // Event Listeners
  if (elements.startBtn) {
    elements.startBtn.addEventListener('click', function() {
      console.log('Start button clicked!');
      startGame();
    });
  } else {
    console.error('Start button not found!');
  }
  
  if (elements.resetBtn) {
    elements.resetBtn.addEventListener('click', resetGame);
  }
  
  if (elements.retryBtn) {
    elements.retryBtn.addEventListener('click', resetGame);
  }
  
  if (elements.shareBtn) {
    elements.shareBtn.addEventListener('click', shareResults);
  }
  
  if (elements.dirtyTub) {
    elements.dirtyTub.addEventListener('click', scoopWater);
  }
  
  if (elements.filledCup) {
    elements.filledCup.addEventListener('click', pourWater);
  }
  
  if (elements.squeezeBtn) {
    elements.squeezeBtn.addEventListener('click', squeezeFilter);
  }
  
  // Initialize bucket drag functionality
  initializeBucketDrag();
  
  // Initialize game
  showScreen('start');
  console.log('Game initialized');
});
