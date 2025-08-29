# Energy Dash

Energy Dash is a lightweight browser game where you guide a runner through stylized city streets, timing jumps to clear obstacles and gather glowing power cells.

Gameplay ramps up as pacing quickens; score comes from how long you survive and the number of power cells collected. High scores are kept locally so players can compete against their own best runs.

Built for portability and smooth play on modern browsers, the game supports both keyboard and touch input and can be deployed as a single static page.

## Features

- **Endless Runner Gameplay**: Jump over obstacles while the speed increases
- **Obstacles**: Cardboard boxes left out on the street
- **Collectibles**: Energy bolts to power up the city
- **Leaderboard**: Top 10 scores stored locally in browser
- **Responsive Design**: Works on desktop and mobile devices

## Controls

- **Desktop**: Press `SPACE` or `UP ARROW` to jump
- **Mobile/Touch**: Tap anywhere on the screen to jump

## How to Run

1. **Local Development**:
   - Open `index.html` in any modern web browser
   - No server required - runs entirely client-side

2. **Web Server Deployment**:
   - Upload all files to your web server
   - Access via the URL where you uploaded the files
   - Game data is stored locally in each user's browser

## Files Structure

```
bggame/
├── index.html      # Main HTML file with game interface
├── game.js         # Game logic and mechanics
└── README.md       # This file
```

## Game Mechanics

- **Base Score**: +1 point per frame survived
- **Distance Scoring**: Based on how far the character travels
- **Speed Increase**: Game gradually gets faster and more challenging
- **Collision Detection**: Game ends when hitting any obstacle
- **Local Storage**: Leaderboard persists between browser sessions

## Browser Compatibility

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 16+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Conference Deployment Notes

- Game runs entirely in the browser - no internet connection required after initial load
- Leaderboard is stored locally on each device
- Optimized for both keyboard (desktop) and touch (tablet/mobile) controls
- Typical game session lasts 30-60 seconds as specified
- No external dependencies - single HTML file deployment possible

## Technical Details

- Built with HTML5 Canvas API
- Uses requestAnimationFrame for smooth 60fps animation
- Responsive canvas that scales to fit different screen sizes
- Touch events for mobile compatibility
- LocalStorage for persistent leaderboard data
