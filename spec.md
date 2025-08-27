This is a game for Centrica (Britiish Gas) staff to play at an internal conference. 

It will be available at a stall, and will need to be played on a keyboard.

🎮 Game Specification – The Things Energy Dash
1. Overview

A simple, browser-based endless runner in HTML5 + JavaScript (Canvas API).

Player controls a chosen “Thing” character (Dave, Mel, Ash, or Charlie & Riley).

Character automatically runs left → right across the screen.

Player taps (or presses space/↑) to jump over obstacles.

Game ends if the character collides with an obstacle.

Scoring is based on distance travelled + bonus points from collectibles.

Includes a leaderboard for tracking top scores.

2. Core Gameplay

Movement:

Character runs at a constant horizontal speed.

Speed gradually increases over time (difficulty curve).

Jump is a single key/tap press; no double-jumps.

Obstacles (spawn randomly, increasing in frequency with difficulty):

Radiators (low hurdle)

Toolboxes (medium jump)

Boilers/pipes (taller, require higher jump)

Dripping taps (puddles to leap over)

Collectibles (appear occasionally between obstacles):

🔥 Blue flames = +10 points

⚡ Lightning bolts = +25 points

📟 Smart meters = +50 points

✨ British Gas stars (rare) = +100 points

Game Over:

Triggered if the player collides with an obstacle.

Display score + option to restart.

3. Controls

Desktop: Press Space or Arrow Up to jump.

Mobile/Touch: Tap anywhere on the screen to jump.

4. Scoring System

Base score = distance travelled (e.g. +1 per frame survived).

Bonus score = collectibles picked up.

Final score = distance + bonuses.

5. Characters (The Things)

At start, player chooses 1 of 4 characters:

Dave (big softie)

Mel (favourite, coffee cup)

Ash (teenage tech support)

Charlie & Riley (double trouble toddlers, run side by side as one unit)

Each is just a different sprite; no gameplay differences.

6. Visual Style

Background: simple scrolling suburban street or home backdrop.

Ground: flat running line.

Colour palette: Centrica/British Gas branding (blues/whites).

Characters + obstacles: sprite images (PNG/transparent).

7. Leaderboard

Store top 10 scores in localStorage (client-side, persists on that browser).

Each entry includes: Name + Character + Score.

After Game Over:

Prompt player to enter a name (optional).

Update leaderboard if their score qualifies.

Display the leaderboard when the game isn't being played.


8. Game Loop & Technical Notes

Use requestAnimationFrame for smooth animation.

Update cycle:

Update player position & jump physics.

Scroll background + spawn/move obstacles.

Check collisions (player ↔ obstacles).

Check collectibles pickups.

Update score.

Render everything.

Canvas resolution: responsive design, scales to fit window.

Keep round duration short (30–60s average before failure).