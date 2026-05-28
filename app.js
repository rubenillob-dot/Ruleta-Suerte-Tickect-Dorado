// ==========================================
// ESTADO DE LA APLICACIÓN
// ==========================================
// Nombres iniciales por defecto (manuales)
let participants = [
  "Arixu", "Rubén", "GamerX", "TwitchViewer", 
  "Lurker99", "Moderator", "SubTop", "Follower1", 
  "SubVip", "TwitchPrime", "SuperSub", "StreamFan"
];

let isSpinning = false;
let currentAngle = 0; // En radianes
let spinSpeed = 0;    // En radianes por frame
const friction = 0.982; // Fricción constante para la desaceleración
let lastSegmentIndex = -1;
let currentWinnerIndex = -1;
let speedMultiplier = 1.0; // Multiplicador de velocidad de rotación
let contadorSorteo = 1; // Contador global de sorteos

// Paleta de colores requerida (Versión pastel para reducir fatiga visual)
const colors = [
  '#B388FF', // Morado Pastel
  '#80DEEA', // Cyan Pastel
  '#4A4A4D'  // Gris Suave
];

// Audio Context para efectos de sonido sintéticos
let audioCtx = null;

// ==========================================
// ELEMENTOS DEL DOM
// ==========================================
const canvas = document.getElementById('wheel-canvas');
const ctx = canvas.getContext('2d');
const spinBtn = document.getElementById('spin-btn');
const manualInput = document.getElementById('manual-input');
const addManualBtn = document.getElementById('add-manual-btn');
const clearAllBtn = document.getElementById('clear-all-btn');
const participantsList = document.getElementById('participants-list');
const participantsCount = document.getElementById('participants-count');
const tickerCurrentName = document.getElementById('ticker-current-name');
const speedMultiplierInput = document.getElementById('speed-multiplier');
const multiplierDisplay = document.getElementById('multiplier-display');
const resetCounterBtn = document.getElementById('reset-counter-btn');

// Modal de Ganador
const winnerModal = document.getElementById('winner-modal');
const winnerNameSpan = document.getElementById('winner-name');
const modalCloseBtn = document.getElementById('modal-close-btn');
const modalRemoveBtn = document.getElementById('modal-remove-btn');

// ==========================================
// INICIALIZACIÓN
// ==========================================
window.addEventListener('DOMContentLoaded', () => {
  setupCanvasDPI();
  updateParticipantsList();
  
  // Event Listeners
  spinBtn.addEventListener('click', startSpin);
  addManualBtn.addEventListener('click', addManualNames);
  clearAllBtn.addEventListener('click', clearAllParticipants);
  
  // Modal buttons
  modalCloseBtn.addEventListener('click', closeWinnerModal);
  modalRemoveBtn.addEventListener('click', removeWinnerAndContinue);

  // Modal de Instrucciones y requisitos de participación
  const instructionsModal = document.getElementById('instructions-modal');
  const instructionsBtn = document.getElementById('instructions-btn');
  const instructionsCloseBtn = document.getElementById('instructions-close-btn');

  if (instructionsBtn && instructionsModal) {
    instructionsBtn.addEventListener('click', () => {
      instructionsModal.style.display = 'flex';
    });
  }

  if (instructionsCloseBtn && instructionsModal) {
    instructionsCloseBtn.addEventListener('click', () => {
      instructionsModal.style.display = 'none';
    });
  }

  if (instructionsModal) {
    instructionsModal.addEventListener('click', (e) => {
      if (e.target === instructionsModal) {
        instructionsModal.style.display = 'none';
      }
    });
  }

  // Control de velocidad
  if (speedMultiplierInput && multiplierDisplay) {
    speedMultiplierInput.addEventListener('input', (e) => {
      speedMultiplier = parseFloat(e.target.value);
      multiplierDisplay.textContent = speedMultiplier.toFixed(2) + 'x';
    });
  }

  // Reinicio de contador de sorteos
  if (resetCounterBtn) {
    resetCounterBtn.addEventListener('click', resetDrawCounter);
  }
  
  // Redibujado al cambiar tamaño
  window.addEventListener('resize', () => {
    setupCanvasDPI();
    drawWheel();
  });
});

// ==========================================
// CONFIGURACIÓN DEL CANVAS (PANTALLAS HIGH-DPI / RETINA)
// ==========================================
function setupCanvasDPI() {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  
  // Establecer el tamaño real del buffer del canvas
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  
  // Escalar el contexto para que las coordenadas coincidan con las del CSS
  ctx.resetTransform();
  ctx.scale(dpr, dpr);
}

// ==========================================
// SINTETIZADOR DE AUDIO (Web Audio API)
// ==========================================
function playTickSound() {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc.type = 'triangle';
    
    // Curva de frecuencia rápida descendente
    osc.frequency.setValueAtTime(650, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, audioCtx.currentTime + 0.04);
    
    gainNode.gain.setValueAtTime(0.12, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.04);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.04);
  } catch (e) {
    console.warn("Web Audio API no iniciada o bloqueada por políticas del navegador:", e);
  }
}

// ==========================================
// CONTROL DE PARTICIPANTES (ESTADO & UI)
// ==========================================
function updateParticipantsList() {
  // Limpiar lista visual
  participantsList.innerHTML = '';
  
  // Actualizar contador
  participantsCount.textContent = participants.length;
  
  if (participants.length === 0) {
    const emptyLi = document.createElement('li');
    emptyLi.className = 'empty-state';
    emptyLi.textContent = 'No hay participantes aún.';
    participantsList.appendChild(emptyLi);
    spinBtn.disabled = true;
  } else {
    spinBtn.disabled = false;
    
    // Contar ocurrencias para detectar duplicados
    const occurrences = {};
    participants.forEach(name => {
      occurrences[name] = (occurrences[name] || 0) + 1;
    });
    
    participants.forEach((name, index) => {
      const li = document.createElement('li');
      
      const span = document.createElement('span');
      span.className = 'name-text';
      span.textContent = name;
      
      // Verificar si el nombre está repetido en la lista total
      if (occurrences[name] > 1) {
        li.classList.add('item-duplicado');
        const badge = document.createElement('span');
        badge.className = 'duplicate-badge';
        badge.textContent = ' (Repetido)';
        span.appendChild(badge);
      }
      
      const removeBtn = document.createElement('button');
      removeBtn.className = 'btn-remove';
      removeBtn.title = `Eliminar a ${name}`;
      removeBtn.setAttribute('aria-label', `Eliminar a ${name}`);
      removeBtn.innerHTML = `
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
        </svg>
      `;
      removeBtn.addEventListener('click', () => {
        if (!isSpinning) deleteParticipant(index);
      });
      
      li.appendChild(span);
      li.appendChild(removeBtn);
      participantsList.appendChild(li);
    });
  }
  
  // Redibujar la ruleta
  drawWheel();
}

function addManualNames() {
  if (isSpinning) return;
  
  // 1. Captura el valor del textarea.
  const text = manualInput.value;
  if (!text.trim()) return;
  
  // 2. Usa el método .split() con una Expresión Regular (Regex) para dividir el texto
  // utilizando: comas (,), puntos y coma (;), guiones (-), tabulaciones (\t), o saltos de línea (\n).
  const cleanNames = text.split(/[,\;\-\t\n\r]+/)
    // 3. Pasa el resultado por un .map() aplicando .trim() a cada elemento.
    .map(name => name.trim())
    // 4. Finalmente, pasa la matriz por un .filter() para eliminar strings vacíos.
    .filter(name => name !== '');
    
  // Analizar el array en busca de duplicados en la entrada manual
  const inputDuplicates = cleanNames.filter((name, idx) => cleanNames.indexOf(name) !== idx);
  if (inputDuplicates.length > 0) {
    console.log('Se detectaron nombres repetidos en la entrada:', [...new Set(inputDuplicates)]);
  }
  
  if (cleanNames.length > 0) {
    // 5. Inserta este array limpio en la variable de participantes y redibuja.
    participants = [...participants, ...cleanNames];
    manualInput.value = ''; // Limpiar el input
    updateParticipantsList();
  }
}
function deleteParticipant(index) {
  if (isSpinning) return;
  
  participants.splice(index, 1);
  updateParticipantsList();
}

function clearAllParticipants() {
  if (isSpinning) return;
  
  participants = [];
  updateParticipantsList();
}

// Restablece el contador a cero y actualiza el DOM del ticket
function resetDrawCounter() {
  contadorSorteo = 0;
  
  const ticketSerialEl = document.getElementById('ticket-serial-number');
  if (ticketSerialEl) {
    ticketSerialEl.textContent = 'TICKET Nº: ARIXU-001';
  }
  
  const stubDrawEl = document.getElementById('stub-draw-number');
  if (stubDrawEl) {
    stubDrawEl.textContent = '#001';
  }
}

// ==========================================
// MOTOR DE RENDERIZADO DE LA RULETA (CANVAS)
// ==========================================
function drawWheel() {
  const rect = canvas.getBoundingClientRect();
  const width = rect.width;
  const height = rect.height;
  
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(centerX, centerY) - 20;
  
  ctx.clearRect(0, 0, width, height);
  
  // Si no hay participantes, reiniciar el ticker
  if (participants.length === 0) {
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.fillStyle = '#18181b';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#2f2f35';
    ctx.stroke();
    
    ctx.fillStyle = '#adadb8';
    ctx.font = 'bold 16px Poppins';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Añade participantes', centerX, centerY);
    
    drawCenterPin(centerX, centerY);
    
    if (tickerCurrentName) {
      tickerCurrentName.textContent = '-';
      tickerCurrentName.style.color = 'var(--text-muted)';
    }
    return;
  }
  
  const N = participants.length;
  const arcAngle = (2 * Math.PI) / N;
  
  // Calcular qué índice está bajo la aguja (a las 12 en punto = 1.5 * Math.PI)
  const pointerAngle = 1.5 * Math.PI;
  const relativeAngle = (pointerAngle - currentAngle + (2 * Math.PI * 100)) % (2 * Math.PI);
  const currentSegmentIndex = Math.floor(relativeAngle / arcAngle) % N;
  
  // Actualizar el mini-rectángulo (Ticker) con el nombre y color correspondiente
  if (tickerCurrentName) {
    tickerCurrentName.textContent = participants[currentSegmentIndex];
    let colorIndex = currentSegmentIndex % colors.length;
    if (currentSegmentIndex === N - 1 && colorIndex === 0 && N > 1) {
      colorIndex = 1; 
    }
    tickerCurrentName.style.color = colors[colorIndex];
  }
  
  // Dibujar cada segmento
  for (let i = 0; i < N; i++) {
    const startAngle = currentAngle + i * arcAngle;
    const endAngle = startAngle + arcAngle;
    
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, startAngle, endAngle, false);
    ctx.closePath();
    
    let colorIndex = i % colors.length;
    if (i === N - 1 && colorIndex === 0 && N > 1) {
      colorIndex = 1; 
    }
    const currentSegmentColor = colors[colorIndex];
    ctx.fillStyle = currentSegmentColor;
    ctx.fill();
    
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#0e0e10';
    ctx.stroke();
    
    // Dibujar texto rotado del participante
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(startAngle + arcAngle / 2);
    
    // Contraste inteligente de texto (Pastel Morado #B388FF y Cyan #80DEEA son claros)
    if (currentSegmentColor === '#B388FF' || currentSegmentColor === '#80DEEA') {
      ctx.fillStyle = '#0e0e10';
    } else {
      ctx.fillStyle = '#ffffff';
    }
    
    let fontSize = 14;
    if (N > 40) fontSize = 8;
    else if (N > 25) fontSize = 10;
    else if (N > 15) fontSize = 12;
    
    ctx.font = `bold ${fontSize}px Poppins`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    
    let displayName = participants[i];
    const maxChars = N > 30 ? 10 : 16;
    if (displayName.length > maxChars) {
      displayName = displayName.substring(0, maxChars - 2) + '..';
    }
    
    if (currentSegmentColor !== '#B388FF' && currentSegmentColor !== '#80DEEA') {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
    }
    
    ctx.fillText(displayName, radius - 24, 0);
    ctx.restore();
  }
  
  // Aro exterior
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
  ctx.lineWidth = 8;
  ctx.strokeStyle = '#2f2f35';
  ctx.stroke();
  
  drawCenterPin(centerX, centerY);
}

function drawCenterPin(centerX, centerY) {
  ctx.beginPath();
  ctx.arc(centerX, centerY, 34, 0, 2 * Math.PI);
  const gradGlow = ctx.createRadialGradient(centerX, centerY, 20, centerX, centerY, 34);
  gradGlow.addColorStop(0, 'rgba(145, 70, 255, 0.8)');
  gradGlow.addColorStop(1, 'rgba(119, 44, 232, 0)');
  ctx.fillStyle = gradGlow;
  ctx.fill();
  
  ctx.beginPath();
  ctx.arc(centerX, centerY, 24, 0, 2 * Math.PI);
  ctx.fillStyle = '#18181b';
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#9146ff';
  ctx.fill();
  ctx.stroke();
  
  ctx.beginPath();
  ctx.arc(centerX, centerY, 10, 0, 2 * Math.PI);
  ctx.fillStyle = '#80DEEA'; // Pastel Cyan
  ctx.fill();
}

// ==========================================
// FÍSICA Y ANIMACIÓN DEL GIRO
// ==========================================
function startSpin() {
  if (isSpinning || participants.length === 0) return;
  
  isSpinning = true;
  disableInputs(true);
  
  // Incrementar el contador de sorteos
  contadorSorteo += 1;
  
  // Fuerza inicial multiplicada por el slider de velocidad
  spinSpeed = (0.65 + Math.random() * 0.4) * speedMultiplier;
  lastSegmentIndex = -1;
  
  playTickSound();
  requestAnimationFrame(animateSpin);
}

function animateSpin() {
  if (spinSpeed > 0.0008) {
    currentAngle += spinSpeed;
    currentAngle %= 2 * Math.PI;
    
    // La desaceleración y duración escalan según el multiplicador
    const decelerationRate = (1 - 0.982) / speedMultiplier;
    const effectiveFriction = 1 - decelerationRate;
    spinSpeed *= effectiveFriction;
    
    const N = participants.length;
    const arcAngle = (2 * Math.PI) / N;
    const pointerAngle = 1.5 * Math.PI;
    const relativeAngle = (pointerAngle - currentAngle + (2 * Math.PI * 100)) % (2 * Math.PI);
    const currentSegmentIndex = Math.floor(relativeAngle / arcAngle) % N;
    
    if (currentSegmentIndex !== lastSegmentIndex) {
      triggerPointerTick();
      lastSegmentIndex = currentSegmentIndex;
    }
    
    drawWheel();
    requestAnimationFrame(animateSpin);
  } else {
    spinSpeed = 0;
    isSpinning = false;
    
    const N = participants.length;
    const arcAngle = (2 * Math.PI) / N;
    const pointerAngle = 1.5 * Math.PI;
    const relativeAngle = (pointerAngle - currentAngle + (2 * Math.PI * 100)) % (2 * Math.PI);
    currentWinnerIndex = Math.floor(relativeAngle / arcAngle) % N;
    
    drawWheel();
    showWinner(currentWinnerIndex);
    disableInputs(false);
  }
}

function triggerPointerTick() {
  const pointer = document.querySelector('.wheel-pointer');
  if (pointer) {
    pointer.classList.add('tick');
    setTimeout(() => {
      pointer.classList.remove('tick');
    }, 60);
  }
  playTickSound();
}

function disableInputs(disabled) {
  spinBtn.disabled = disabled;
  addManualBtn.disabled = disabled;
  clearAllBtn.disabled = disabled;
  manualInput.disabled = disabled;
  if (speedMultiplierInput) speedMultiplierInput.disabled = disabled;
  if (resetCounterBtn) resetCounterBtn.disabled = disabled;
  
  const deleteButtons = document.querySelectorAll('.btn-remove');
  deleteButtons.forEach(btn => btn.disabled = disabled);
}

// ==========================================
// PANELES Y MODAL DE GANADOR (RESOLUCIÓN)
// ==========================================
// Formatea el número a 3 dígitos con padStart
function formatDrawNumber(num) {
  return String(num).padStart(3, '0');
}

function showWinner(index) {
  const winnerName = participants[index];
  winnerNameSpan.textContent = winnerName;
  
  // Actualizar números dinámicos en el ticket
  const numeroFormateado = formatDrawNumber(contadorSorteo);
  const ticketSerialEl = document.getElementById('ticket-serial-number');
  if (ticketSerialEl) {
    ticketSerialEl.textContent = `TICKET Nº: ARIXU-${numeroFormateado}`;
  }
  const stubDrawEl = document.getElementById('stub-draw-number');
  if (stubDrawEl) {
    stubDrawEl.textContent = `#${numeroFormateado}`;
  }
  
  winnerModal.classList.remove('hidden');
  
  // Lanzar explosión de confeti avanzada usando la librería externa canvas-confetti
  try {
    if (typeof confetti === 'function') {
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#9146ff', '#00E5FF', '#ff007f', '#ffffff']
      });
      
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 60,
          origin: { x: 0, y: 0.8 },
          colors: ['#9146ff', '#00E5FF', '#ff007f']
        });
      }, 200);
      
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 60,
          origin: { x: 1, y: 0.8 },
          colors: ['#9146ff', '#00E5FF', '#ff007f']
        });
      }, 350);
    }
  } catch (error) {
    console.error("No se pudo iniciar el efecto de confeti:", error);
  }
  
  playWinnerFanfare();
}

// ==========================================
// PANELES Y MODAL DE GANADOR (RESOLUCIÓN)
// ==========================================
function closeWinnerModal() {
  winnerModal.classList.add('hidden');
}

function removeWinnerAndContinue() {
  if (currentWinnerIndex !== -1 && currentWinnerIndex < participants.length) {
    participants.splice(currentWinnerIndex, 1);
    currentWinnerIndex = -1;
    closeWinnerModal();
    updateParticipantsList();
  } else {
    closeWinnerModal();
  }
}

// Sintetizar fanfarria de victoria
function playWinnerFanfare() {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    
    const now = audioCtx.currentTime;
    const notes = [261.63, 329.63, 392.00, 523.25];
    
    notes.forEach((freq, idx) => {
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.1);
      
      gainNode.gain.setValueAtTime(0.08, now + idx * 0.1);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.6);
      
      osc.start(now + idx * 0.1);
      osc.stop(now + idx * 0.1 + 0.6);
    });
  } catch (e) {
    console.warn("Error reproduciendo fanfare de victoria:", e);
  }
}
