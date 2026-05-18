const musicInput = document.getElementById("music-input");
const songName = document.getElementById("song-name");
const songTime = document.getElementById("song-time");
const gameContainer = document.getElementById("game-container");
const scoreText = document.querySelector("#score span");

let score = 0;
let audio = new Audio();
let audioContext;
let analyser;
let source;

musicInput.addEventListener("change", async (event) => {

    const file = event.target.files[0];

    if(file){

        // Nombre canción
        songName.textContent = file.name;

        // URL local
        const musicURL = URL.createObjectURL(file);

        audio.src = musicURL;

        // Crear AudioContext
        audioContext = new AudioContext();

        analyser = audioContext.createAnalyser();

        source = audioContext.createMediaElementSource(audio);

        source.connect(analyser);

        analyser.connect(audioContext.destination);

        analyser.fftSize = 256;

        // Reproducir
        await audio.play();

        // Empezar análisis
        detectBeats();
    }

});


// Tiempo de canción
audio.addEventListener("timeupdate", () => {

    const current = formatTime(audio.currentTime);

    const duration = formatTime(audio.duration);

    songTime.textContent = `${current} / ${duration}`;
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

        const now = Date.now();

        // Si hay pico de volumen
        if(average > 90 && now - lastSpawn > 250){

            lastSpawn = now;

            spawnNote();
        }

        requestAnimationFrame(update);
    }

    update();
}


// Crear nota
function spawnNote(){

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

    note.addEventListener("click", () => {

    score++;

    scoreText.textContent = score;
    scoreText.style.transform = "scale(1.3) skew(-12deg)";

setTimeout(() => {

    scoreText.style.transform = "scale(1) skew(-12deg)";

}, 100);

    note.remove();

});

    // Dirección aleatoria
    const angle = Math.random() * Math.PI * 2;

    // Velocidad
    const speed = 4;

    // Movimiento
    const velocityX = Math.cos(angle) * speed;
    const velocityY = Math.sin(angle) * speed;

    function move(){

        x += velocityX;
        y += velocityY;

        note.style.left = x + "px";
        note.style.top = y + "px";

        // Eliminar si sale del mapa
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

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let mouseX = 0;
let mouseY = 0;
const trailPoints = [];

let lastX = mouseX;
let lastY = mouseY;

document.addEventListener("mousemove", (e) => {

    mouseX = e.clientX;
    mouseY = e.clientY;

    cursor.style.left = mouseX + "px";
    cursor.style.top = mouseY + "px";

    // Guardar punto
    trailPoints.push({
        x: mouseX,
        y: mouseY,
        life: 1
    });

});

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