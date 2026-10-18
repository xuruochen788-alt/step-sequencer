# Accessible Step Sequencer

An interactive 16-step sequencer built with JavaScript and [Tone.js](https://tonejs.github.io/), designed to support both mouse and keyboard interaction, with accessibility features for screen reader users.

## Features

- **16-step sequencer:** Create musical patterns using an 8 × 16 grid, with eight pitch rows ranging from C5 to C4.
- **Note editing:** Click a grid cell or use the keyboard to turn individual notes on or off.
- **Audio playback:** Play and stop the sequence using Tone.js.
- **Visual feedback:** Active notes, keyboard focus, and the current playback step are visually highlighted.
- **Pitch preview:** Hear the corresponding pitch when navigating between grid cells with the keyboard.
- **Keyboard navigation:** Move through the grid using the arrow keys, toggle notes with Enter or Space, and use Tab to navigate between the sequencer and other page controls.
- **Screen reader support:** Provides accessible names and note states for grid cells, along with announcements for step changes and note toggling.

## Keyboard Controls

| Key | Action |
|---|---|
| Left / Right Arrow | Move between steps, announce the step number, and preview the current pitch |
| Up / Down Arrow | Move between pitch rows and preview the new pitch |
| Enter / Space | Toggle the selected note on or off |
| Tab | Move between the sequencer and other page controls |

When using NVDA, press **NVDA + Space** to switch to Focus Mode if necessary. This allows the arrow keys to control navigation within the sequencer instead of being intercepted by the screen reader.

## Accessibility

The sequencer uses keyboard focus management to allow users to navigate the grid without tabbing through all 128 cells individually.

The keyboard interaction is designed to provide different feedback for different actions:

- Horizontal navigation announces the current step number and previews its pitch.
- Vertical navigation previews the new pitch without explicitly announcing the step number.
- Toggling a note announces whether it is on or off.
- Visual focus indicators help users identify the currently selected cell.

## Technologies

- HTML
- CSS
- JavaScript
- Tone.js

## Getting Started

1. Clone or download this repository.
2. Open `index.html` in a browser.
3. Click **Play** to start the sequence or **Stop** to stop playback.
4. Click grid cells to create your own musical pattern.

For local development, you can also run the project using a local web server, such as the Live Server extension in Visual Studio Code.

## Project Structure

```text
step-sequencer/
├── index.html   # Page structure and controls
├── style.css    # Grid layout and visual styling
├── script.js    # Sequencer logic, audio, and keyboard interaction
└── README.md    # Project documentation
```
