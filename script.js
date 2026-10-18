
"use strict";

// =========================
// Configuration
// =========================

const rows = 8;
const columns = 16;

const notes = [
    "C5",
    "B4",
    "A4",
    "G4",
    "F4",
    "E4",
    "D4",
    "C4"
];

// false = note off
// true  = note on

const pattern = Array.from(
    { length: rows },
    () => Array(columns).fill(false)
);


// =========================
// DOM elements
// =========================

const gridElement = document.getElementById("grid");

const noteLabelsElement =
    document.getElementById("note-labels");

const selectionStatusElement =
    document.getElementById("selection-status");

const playButton =
    document.getElementById("play");

const stopButton =
    document.getElementById("stop");


// =========================
// Current selection
// =========================

let selectedRow = 0;
let selectedColumn = 0;


// =========================
// Audio
// =========================

// Main sequencer instrument
const synth =
    new Tone.PolySynth(Tone.Synth).toDestination();

// Separate synth for keyboard pitch preview
const previewSynth =
    new Tone.Synth().toDestination();

let sequence = null;
let isPlaying = false;


// =========================
// Create pitch labels
// =========================

notes.forEach(note => {
    const label = document.createElement("div");

    label.classList.add("note-label");
    label.textContent = note;

    noteLabelsElement.appendChild(label);
});


// =========================
// Update accessible cell name
// =========================

function updateCellLabel(cell, row, column) {
    cell.setAttribute("aria-label", notes[row]);

    cell.setAttribute(
        "aria-pressed",
        String(pattern[row][column])
    );

    cell.classList.toggle(
        "active",
        pattern[row][column]
    );
}


// =========================
// Create 16 x 8 grid
// =========================

for (let row = 0; row < rows; row++) {

    for (let column = 0; column < columns; column++) {

        const cell = document.createElement("button");

        cell.type = "button";
        cell.classList.add("cell");

        cell.dataset.row = row;
        cell.dataset.column = column;

        // Only the first cell is in the tab order
        cell.tabIndex =
            (row === 0 && column === 0) ? 0 : -1;

        updateCellLabel(cell, row, column);


        // Mouse interaction
        cell.addEventListener("click", async () => {

            await Tone.start();

            selectedRow = row;
            selectedColumn = column;

            updateSelection();

            toggleNote(row, column);

        });


        // Keyboard interaction
        cell.addEventListener(
            "keydown",
            handleKeydown
        );


        gridElement.appendChild(cell);

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

        // Only current cell is tabbable
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

    // Clear first so repeated updates can be announced
    selectionStatusElement.textContent = "";

    requestAnimationFrame(() => {

        selectionStatusElement.textContent =
            `Step ${selectedColumn + 1}`;

    });

}


// =========================
// Preview a pitch
// =========================

async function previewNote(row) {

    try {

        await Tone.start();

        previewSynth.triggerAttackRelease(
            notes[row],
            "16n"
        );

    } catch (error) {

        console.error(
            "Pitch preview failed:",
            error
        );

    }

}


// =========================
// Toggle a note
// =========================

function toggleNote(row, column) {

    pattern[row][column] =
        !pattern[row][column];

    const cell = getCell(row, column);

    updateCellLabel(cell, row, column);

    // Announce only On or Off
    const state = pattern[row][column]
        ? "On"
        : "Off";

    if (selectionStatusElement) {
        selectionStatusElement.textContent = state;
    }

    // Preview pitch when turning note on
    if (pattern[row][column]) {
        previewNote(row);
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
            column = Math.max(0, column - 1);
            horizontalMove = true;
            break;

        case "ArrowRight":
            event.preventDefault();
            column = Math.min(columns - 1, column + 1);
            horizontalMove = true;
            break;

        case "ArrowUp":
            event.preventDefault();
            row = Math.max(0, row - 1);
            break;

        case "ArrowDown":
            event.preventDefault();
            row = Math.min(rows - 1, row + 1);
            break;

        default:
            return;
    }

    selectedRow = row;
    selectedColumn = column;

    updateSelection();

    const destination = getCell(row, column);
    destination.focus();

    // 左右移动：更新 Step
    if (horizontalMove) {
        announceStep();
    }

    // 所有方向移动：试听音高
    await previewNote(row);
}



// =========================
// Playback sequence
// =========================

sequence = new Tone.Sequence(

    (time, column) => {

        for (let row = 0; row < rows; row++) {

            if (pattern[row][column]) {

                synth.triggerAttackRelease(
                    notes[row],
                    "16n",
                    time
                );

            }

        }

        updateCurrentColumn(column);

    },

    Array.from(
        { length: columns },
        (_, index) => index
    ),

    "16n"

);

sequence.loop = true;


// =========================
// Play
// =========================

async function play() {

    await Tone.start();

    if (isPlaying) return;

    isPlaying = true;

    sequence.start(0);

    Tone.Transport.start();

    if (selectionStatusElement) {
        selectionStatusElement.textContent =
            "Playback started";
    }

}


// =========================
// Stop
// =========================

function stop() {

    if (!isPlaying) return;

    isPlaying = false;

    Tone.Transport.stop();
    Tone.Transport.cancel();

    sequence.stop();

    updateCurrentColumn(-1);

    if (selectionStatusElement) {
        selectionStatusElement.textContent =
            "Playback stopped";
    }

}


// =========================
// Button events
// =========================

playButton.addEventListener(
    "click",
    play
);

stopButton.addEventListener(
    "click",
    stop
);


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
// Initialize
// =========================

updateSelection();
