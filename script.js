
"use strict";

// =========================
// Configuration
// =========================

const rows = 3;
const maxColumns = 16;

// Current number of visible steps.
let columns = 16;

const drumTracks = [
    "Kick Drum",
    "Snare Drum",
    "Hi-Hat"
];

// false = drum hit off
// true  = drum hit on
//
// Always store up to 16 steps.
// Changing the visible step count does not erase hidden steps.

const pattern = Array.from(
    { length: rows },
    () => Array(maxColumns).fill(false)
);


// =========================
// DOM elements
// =========================

const gridElement = document.getElementById("grid");
const trackLabelsElement = document.getElementById("track-labels");
const selectionStatusElement =
    document.getElementById("selection-status");

const playButton = document.getElementById("play");
const stopButton = document.getElementById("stop");

const stepCountSelect =
    document.getElementById("step-count");

const kickVolumeSlider =
    document.getElementById("kick-volume");

const snareVolumeSlider =
    document.getElementById("snare-volume");

const hiHatVolumeSlider =
    document.getElementById("hihat-volume");

const kickVolumeValue =
    document.getElementById("kick-volume-value");

const snareVolumeValue =
    document.getElementById("snare-volume-value");

const hiHatVolumeValue =
    document.getElementById("hihat-volume-value");


// =========================
// Current selection
// =========================

let selectedRow = 0;
let selectedColumn = 0;
let isPlaying = false;


// =========================
// Audio instruments
// =========================

// Kick: low bass-drum sound.

const kick = new Tone.MembraneSynth({
    pitchDecay: 0.05,
    octaves: 6,
    oscillator: {
        type: "sine"
    },
    envelope: {
        attack: 0.001,
        decay: 0.35,
        sustain: 0
    }
}).toDestination();


// Snare: filtered white noise.

const snareFilter = new Tone.Filter({
    type: "highpass",
    frequency: 1200,
    rolloff: -12
}).toDestination();

const snare = new Tone.NoiseSynth({
    noise: {
        type: "white"
    },
    envelope: {
        attack: 0.001,
        decay: 0.18,
        sustain: 0
    }
});

snare.connect(snareFilter);


// Hi-Hat: short white noise.

const hiHat = new Tone.NoiseSynth({
    noise: {
        type: "white"
    },
    envelope: {
        attack: 0.001,
        decay: 0.25,
        sustain: 0,
        release: 0.05
    },
    volume: -12
}).toDestination();


// Store all instruments in one array.

const drumInstruments = [
    kick,
    snare,
    hiHat
];


// =========================
// Track volume settings
// =========================

function updateTrackVolume(instrument, slider, output) {

    const volume = Number(slider.value);

    // Set instrument volume in decibels.
    instrument.volume.value = volume;

    // Display current volume.
    output.textContent = `${volume} dB`;
}


// Initialize volume settings.

updateTrackVolume(
    kick,
    kickVolumeSlider,
    kickVolumeValue
);

updateTrackVolume(
    snare,
    snareVolumeSlider,
    snareVolumeValue
);

updateTrackVolume(
    hiHat,
    hiHatVolumeSlider,
    hiHatVolumeValue
);


// Listen for volume changes.

kickVolumeSlider.addEventListener("input", () => {
    updateTrackVolume(
        kick,
        kickVolumeSlider,
        kickVolumeValue
    );
});

snareVolumeSlider.addEventListener("input", () => {
    updateTrackVolume(
        snare,
        snareVolumeSlider,
        snareVolumeValue
    );
});

hiHatVolumeSlider.addEventListener("input", () => {
    updateTrackVolume(
        hiHat,
        hiHatVolumeSlider,
        hiHatVolumeValue
    );
});


// =========================
// Play one drum sound
// =========================

function playDrum(
    row,
    time = undefined,
    isActive = pattern[row][selectedColumn]
) {

    // Active steps sound louder than inactive steps.
    const velocity = isActive ? 0.8 : 0.2;

    switch (row) {

        case 0:
            kick.triggerAttackRelease(
                "C1",
                "8n",
                time,
                velocity
            );
            break;

        case 1:
            snare.triggerAttackRelease(
                "16n",
                time,
                velocity
            );
            break;

        case 2:
            hiHat.triggerAttackRelease(
                "16n",
                time,
                velocity
            );
            break;
    }
}


// =========================
// Preview selected drum
// =========================

async function previewDrum(row) {

    try {

        await Tone.start();

        // Use the current cell's active state.
        playDrum(
            row,
            undefined,
            pattern[row][selectedColumn]
        );

    } catch (error) {

        console.error("Drum preview failed:", error);

    }
}


// =========================
// Create drum track labels
// =========================

drumTracks.forEach(trackName => {

    const label = document.createElement("div");

    label.classList.add("track-label");
    label.textContent = trackName;

    trackLabelsElement.appendChild(label);

});


// =========================
// Update accessible cell name
// =========================

function updateCellLabel(cell, row, column) {

    const isActive = pattern[row][column];

    cell.setAttribute(
        "aria-label",
        `${drumTracks[row]}, Step ${column + 1}`
    );

    cell.setAttribute(
        "aria-pressed",
        String(isActive)
    );

    cell.classList.toggle(
        "active",
        isActive
    );
}


// =========================
// Create dynamic drum grid
// =========================

function createGrid() {

    // Remove the previous grid.
    gridElement.innerHTML = "";

    // Update the accessible grid description.
    gridElement.setAttribute(
        "aria-label",
        `${columns}-step drum sequencer with Kick Drum, Snare Drum, and Hi-Hat tracks`
    );

    // Update the number of grid columns.
    gridElement.style.gridTemplateColumns =
        `repeat(${columns}, 42px)`;

    for (let row = 0; row < rows; row++) {

        for (let column = 0; column < columns; column++) {

            const cell = document.createElement("button");

            cell.type = "button";
            cell.classList.add("cell");

            cell.dataset.row = row;
            cell.dataset.column = column;

            // Only the selected cell is in the Tab order.
            cell.tabIndex =
                (row === selectedRow &&
                 column === selectedColumn) ? 0 : -1;

            updateCellLabel(
                cell,
                row,
                column
            );

            // Mouse or touch interaction.
            cell.addEventListener("click", async () => {

                await Tone.start();

                selectedRow = row;
                selectedColumn = column;

                updateSelection();

                toggleDrum(row, column);

            });

            // Keyboard interaction.
            cell.addEventListener(
                "keydown",
                handleKeydown
            );

            gridElement.appendChild(cell);

        }
    }
}


// =========================
// Get a cell
// =========================

function getCell(row, column) {

    return gridElement.querySelector(
        `[data-row="${row}"][data-column="${column}"]`
    );

}


// =========================
// Update selection
// =========================

function updateSelection() {

    const cells =
        gridElement.querySelectorAll(".cell");

    cells.forEach(cell => {

        const row = Number(cell.dataset.row);
        const column = Number(cell.dataset.column);

        const isSelected =
            row === selectedRow &&
            column === selectedColumn;

        // Roving tabindex.
        cell.tabIndex = isSelected ? 0 : -1;

        cell.classList.toggle(
            "selected",
            isSelected
        );

    });

}


// =========================
// Announce step number
// =========================

function announceStep() {

    if (!selectionStatusElement) return;

    // Announce only the current step number.
    selectionStatusElement.textContent =
        `Step ${selectedColumn + 1}`;

}


// =========================
// Toggle a drum hit
// =========================

function toggleDrum(row, column) {

    // Change the current cell state.
    pattern[row][column] =
        !pattern[row][column];

    const cell = getCell(row, column);

    updateCellLabel(
        cell,
        row,
        column
    );

    const state =
        pattern[row][column] ? "On" : "Off";

    // Announce the changed state.
    if (selectionStatusElement) {

        selectionStatusElement.textContent =
            `${drumTracks[row]}, Step ${column + 1}, ${state}`;

    }

    // Preview the drum only when turning a hit on.
    if (pattern[row][column]) {

        previewDrum(row);

    }

}


// =========================
// Keyboard navigation
// =========================

async function handleKeydown(event) {

    const cell = event.target.closest(".cell");

    if (!cell) return;

    let row = Number(cell.dataset.row);
    let column = Number(cell.dataset.column);

    let horizontalMove = false;

    switch (event.key) {

        case "ArrowLeft":

            event.preventDefault();

            column = Math.max(
                0,
                column - 1
            );

            horizontalMove = true;

            break;


        case "ArrowRight":

            event.preventDefault();

            column = Math.min(
                columns - 1,
                column + 1
            );

            horizontalMove = true;

            break;


        case "ArrowUp":

            event.preventDefault();

            row = Math.max(
                0,
                row - 1
            );

            break;


        case "ArrowDown":

            event.preventDefault();

            row = Math.min(
                rows - 1,
                row + 1
            );

            break;


        default:

            // Enter and Space use the native button behavior.
            return;

    }

    selectedRow = row;
    selectedColumn = column;

    updateSelection();

    const destination = getCell(row, column);

    destination.focus();

    // Only announce when moving horizontally.
    if (horizontalMove) {

        announceStep();

    }

    // Preview the selected drum.
    // The volume depends on whether the cell is active.
    await previewDrum(row);

}


// =========================
// Playback sequence
// =========================

let sequence = null;

function createSequence() {

    // Dispose of the previous sequence.
    if (sequence) {

        sequence.stop();
        sequence.dispose();

    }

    sequence = new Tone.Sequence(

        (time, column) => {

            for (let row = 0; row < rows; row++) {

                if (pattern[row][column]) {

                    // Active steps use normal playback volume.
                    playDrum(row, time, true);

                }

            }

            // Update visual playhead in sync with audio.
            Tone.Draw.schedule(() => {

                updateCurrentColumn(column);

            }, time);

        },

        Array.from(
            { length: columns },
            (_, index) => index
        ),

        "16n"

    );

    sequence.loop = true;

}


// =========================
// Play
// =========================

async function play() {

    try {

        await Tone.start();

        if (isPlaying) return;

        isPlaying = true;

        Tone.Transport.bpm.value = 110;

        sequence.start(0);

        Tone.Transport.start();

        if (selectionStatusElement) {

            selectionStatusElement.textContent =
                "Playback started";

        }

    } catch (error) {

        console.error("Playback failed:", error);

        isPlaying = false;

    }

}


// =========================
// Stop
// =========================

function stop() {

    if (isPlaying) {

        isPlaying = false;

        Tone.Transport.stop();
        Tone.Transport.cancel();

        if (sequence) {
            sequence.stop();
        }

        if (selectionStatusElement) {

            selectionStatusElement.textContent =
                "Playback stopped";

        }

    }

    updateCurrentColumn(-1);

}


// =========================
// Highlight playback column
// =========================

function updateCurrentColumn(column) {

    const cells =
        gridElement.querySelectorAll(".cell");

    cells.forEach(cell => {

        cell.classList.toggle(
            "current",
            Number(cell.dataset.column) === column
        );

    });

}


// =========================
// Step count settings
// =========================

stepCountSelect.addEventListener("change", () => {

    const newColumns =
        Number(stepCountSelect.value);

    // Only allow 4, 8, or 16 steps.
    if (![4, 8, 16].includes(newColumns)) {
        return;
    }

    // Stop current playback before rebuilding.
    stop();

    // Update the visible step count.
    columns = newColumns;

    // Keep selection inside the new grid.
    selectedColumn = Math.min(
        selectedColumn,
        columns - 1
    );

    // Rebuild the grid and sequence.
    createGrid();

    createSequence();

    updateSelection();

    updateCurrentColumn(-1);

    // Announce the new setting.
    if (selectionStatusElement) {

        selectionStatusElement.textContent =
            `${columns} steps selected`;

    }

});


// =========================
// Button events
// =========================

playButton.addEventListener("click", play);

stopButton.addEventListener("click", stop);


// =========================
// Initialize
// =========================

// Create the initial 16-step grid.
createGrid();

// Create the initial playback sequence.
createSequence();

// Set the initial keyboard selection.
updateSelection();

