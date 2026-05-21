const musicInput = document.getElementById("music-input");
const songName = document.getElementById("song-name");
const songTime = document.getElementById("song-time");
const gameContainer = document.getElementById("game-container");
const scoreText = document.querySelector("#score span");
const presetSongs = document.querySelectorAll(".preset-song");
const songPanel = document.getElementById("song-panel");
const progressBar = document.getElementById("progress-bar");

let score = 0;
let beatIntensity = 0;
let audio = new Audio();
let audioContext;
let analyser;
let source;

musicInput.addEventListener("change", async (event) => {

    const file = event.target.files[0];

    if(file){

        const musicURL = URL.createObjectURL(file);

        startSong(musicURL, file.name);
    }
});

presetSongs.forEach(button => {

    button.addEventListener("click", () => {

        const songSrc = button.dataset.song;

        const songTitle = button.textContent;

        startSong(songSrc, songTitle);

    });

});


// Tiempo de canción
audio.addEventListener("timeupdate", () => {

    const current = formatTime(audio.currentTime);

    const duration = formatTime(audio.duration);

    songTime.textContent = `${current} / ${duration}`;
    const progress = (audio.currentTime / audio.duration) * 100;

    progressBar.style.width = progress + "%";
});


// Convertir tiempo
function formatTime(seconds){

    if(isNaN(seconds)) return "0:00";

    const mins = Math.floor(seconds / 60);

    const secs = Math.floor(seconds % 60);

    return `${mins}:${secs.toString().padStart(2, "0")}`;
}


// Detectar ritmo
function detectBeats(){

    const bufferLength = analyser.frequencyBinCount;

    const dataArray = new Uint8Array(bufferLength);

    let lastSpawn = 0;

    function update(){

        analyser.getByteFrequencyData(dataArray);

        // Calcular volumen promedio
        let sum = 0;

        for(let i = 0; i < bufferLength; i++){

            sum += dataArray[i];
        }

        const average = sum / bufferLength;
        beatIntensity = Math.min(1, Math.max(0, (average - 50) / 100));

        const threshold = 70 + beatIntensity * 40;
        const cooldown = 500 - beatIntensity * 300;

        const now = Date.now();

        if(average > threshold && now - lastSpawn > cooldown){

            lastSpawn = now;
            const notesToSpawn = 1 + Math.floor(beatIntensity * 2);
            for (let i = 0; i < notesToSpawn; i++) {
                spawnNote(beatIntensity);
            }
        }

        requestAnimationFrame(update);
    }

    update();
}


// Crear nota
function spawnNote(intensity = 0){

    const note = document.createElement("div");

    note.classList.add("note");

    // Centro del contenedor
    const containerWidth = gameContainer.clientWidth;
    const containerHeight = gameContainer.clientHeight;

    const noteSize = 60;

    let x = (containerWidth / 2) - (noteSize / 2);
    let y = (containerHeight / 2) - (noteSize / 2);

    note.style.left = x + "px";
    note.style.top = y + "px";

    gameContainer.appendChild(note);

    // Dirección aleatoria
    const angle = Math.random() * Math.PI * 2;

    // Velocidad según intensidad del ritmo
    const speed = 2 + intensity * 8;

    const velocityX = Math.cos(angle) * speed;
    const velocityY = Math.sin(angle) * speed;

    function move(){

        x += velocityX;
        y += velocityY;

        note.style.left = x + "px";
        note.style.top = y + "px";

        // DETECCIÓN DE COLISIÓN
        const noteRect = note.getBoundingClientRect();

        const cursorRect = cursor.getBoundingClientRect();

        const collision = !(

            cursorRect.right < noteRect.left ||
            cursorRect.left > noteRect.right ||
            cursorRect.bottom < noteRect.top ||
            cursorRect.top > noteRect.bottom

        );

        if(collision){

            score++;

            scoreText.textContent = score;

            scoreText.style.transform = "scale(1.3) skew(-12deg)";

            setTimeout(() => {

                scoreText.style.transform = "scale(1) skew(-12deg)";

            }, 100);

            note.remove();

            return;
        }

        // Eliminar si sale
        if(
            x < -100 ||
            x > 550 ||
            y < -100 ||
            y > 550
        ){
            note.remove();
            return;
        }

        requestAnimationFrame(move);
    }

    move();
}

const cursor = document.getElementById("cursor");
const canvas = document.getElementById("trail-canvas");
const ctx = canvas.getContext("2d");
let trailPoints = [];
let mouseX = 0;
let mouseY = 0;

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

function updateCursor(x, y){

    mouseX = x;
    mouseY = y;

    if(cursor){

        cursor.style.left = mouseX + "px";
        cursor.style.top = mouseY + "px";
    }

    trailPoints.push({
        x: mouseX,
        y: mouseY,
        life: 1
    });

    if(trailPoints.length > 40){

        trailPoints.shift();
    }
}


// PC
document.addEventListener("mousemove", (e) => {

    updateCursor(e.clientX, e.clientY);

});


// MOBILE
document.addEventListener("touchmove", (e) => {

    const touch = e.touches[0];

    updateCursor(
        touch.clientX,
        touch.clientY
    );

}, { passive: true });

function animateTrail(){

    // Limpiar canvas REALMENTE
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dibujar trail
    for(let i = 0; i < trailPoints.length - 1; i++){

        const point = trailPoints[i];
        const nextPoint = trailPoints[i + 1];

        ctx.beginPath();

        ctx.moveTo(point.x, point.y);
        ctx.lineTo(nextPoint.x, nextPoint.y);

        ctx.strokeStyle = `rgba(255,0,0,${point.life})`;

        ctx.lineWidth = 12;

        ctx.lineCap = "round";

        ctx.stroke();

        // Fade
        point.life -= 0.03;
    }

    // Eliminar puntos muertos
    for(let i = trailPoints.length - 1; i >= 0; i--){

        if(trailPoints[i].life <= 0){

            trailPoints.splice(i, 1);
        }
    }

    requestAnimationFrame(animateTrail);
}
animateTrail();


// Canciones predefinidas
async function startSong(songSrc, songTitle){

    songName.textContent = songTitle;

    audio.src = songSrc;

    audioContext = new AudioContext();

    analyser = audioContext.createAnalyser();

    source = audioContext.createMediaElementSource(audio);

    source.connect(analyser);

    analyser.connect(audioContext.destination);

    analyser.fftSize = 256;

    await audio.play();

    detectBeats();

    songPanel.style.opacity = "0";

    songPanel.style.pointerEvents = "none";
}