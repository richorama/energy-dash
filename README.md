# The Things Energy Dash

A browser-based endless runner game created for Centrica (British Gas) staff conference. Players control one of four "Things" characters as they run through obstacles and collect energy-themed items.

## Features

- **Four Characters**: Dave (Big Softie), Mel (Coffee Lover), Ash (Tech Support), Charlie & Riley (Double Trouble)
- **Endless Runner Gameplay**: Jump over obstacles while the speed increases
- **Obstacles**: Radiators, Toolboxes, Boilers/Pipes, Dripping Taps
- **Collectibles**: Blue Flames (+10), Lightning Bolts (+25), Smart Meters (+50), British Gas Stars (+100)
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
├── spec.md         # Original game specification
└── README.md       # This file
```

## Game Mechanics

- **Base Score**: +1 point per frame survived
- **Distance Scoring**: Based on how far the character travels
- **Speed Increase**: Game gradually gets faster and more challenging
- **Collision Detection**: Game ends when hitting any obstacle
- **Local Storage**: Leaderboard persists between browser sessions

## Customization

The game uses Centrica/British Gas branding colors:
- Primary: Blues (#003d7a, #0066cc)
- Accent: Bright green (#00ff80)
- Background: Sky blue gradient

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
