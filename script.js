const rows = 8;
const columns = 8;

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

const pattern = Array.from(
    { length: rows },
    () => Array(columns).fill(false)
);

const gridElement = document.getElementById("grid");
const noteLabelsElement = document.getElementById("note-labels");

notes.forEach(note => {
    const label = document.createElement("div");

    label.classList.add("note-label");
    label.textContent = note;

    noteLabelsElement.appendChild(label);
});

for (let row = 0; row < rows; row++) {

    for (let column = 0; column < columns; column++) {

        const cell = document.createElement("div");

        cell.classList.add("cell");

        cell.dataset.row = row;
        cell.dataset.column = column;

        cell.addEventListener("click", () => {

            pattern[row][column] = !pattern[row][column];

            cell.classList.toggle(
                "active",
                pattern[row][column]
            );
        });

        gridElement.appendChild(cell);
    }
}

const synth = new Tone.PolySynth(Tone.Synth).toDestination();

let sequence;

sequence = new Tone.Sequence(
    (time, column) => {

        for (let row = 0; row < rows; row++) {

            if (pattern[row][column]) {

                synth.triggerAttackRelease(
                    notes[row],
                    "8n",
                    time
                );
            }
        }

        updateCurrentColumn(column);

    },
    [0, 1, 2, 3, 4, 5, 6, 7],
    "8n"
);

async function play() {

    await Tone.start();

    if (Tone.Transport.state !== "started") {
        sequence.start(0);
        Tone.Transport.start();
    }
}

document.getElementById("play")
    .addEventListener("click", play);

function stop() {

    Tone.Transport.stop();
    sequence.stop();

    updateCurrentColumn(-1);
}
function updateCurrentColumn(column) {

    const cells = document.querySelectorAll(".cell");

    cells.forEach(cell => {
        cell.classList.remove("current");
    });

    if (column === -1) {
        return;
    }

    cells.forEach(cell => {

        if (Number(cell.dataset.column) === column) {
            cell.classList.add("current");
        }
    });
}
document.getElementById("stop")
    .addEventListener("click", stop);



