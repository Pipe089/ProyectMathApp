document.addEventListener("DOMContentLoaded", () => {
    protegerRuta();
    initGame();
});

let currentRound = 1;
let totalRounds = 5;
let earnedPoints = 0;
let currentAnswer = '';
let currentShape = {};
let userId = null;
let profileGrade = 'primero';
const pointsPerCorrect = 20;
const answersLog = [];
let usedShapes = [];

async function initGame() {
    const supabase = window.supabaseClient;
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        window.location.href = 'login.html';
        return;
    }

    userId = user.id;

    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

    if (profileError || !profile) {
        window.location.href = 'dashboard.html';
        return;
    }

    profileGrade = profile.grado || 'primero';
    const name = profile.nombre || 'Estudiante';
    const userGreeting = document.getElementById('userGreeting');
    if (userGreeting) userGreeting.innerText = `¡Hola ${name}! Vamos a aprender formas. ¿Puedes identificarlas?`;

    if (profileGrade === 'segundo') totalRounds = 7;

    usedShapes = [];
    renderRound();
}

function randomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Banco de formas disponibles
const shapesBank = [
    { name: 'Círculo', svg: 'circle', display: '●', description: 'Forma redonda' },
    { name: 'Cuadrado', svg: 'square', display: '■', description: 'Forma con 4 lados iguales' },
    { name: 'Triángulo', svg: 'triangle', display: '▲', description: 'Forma con 3 lados' },
    { name: 'Rectángulo', svg: 'rectangle', display: '▭', description: 'Forma alargada con 4 lados' },
    { name: 'Estrella', svg: 'star', display: '★', description: 'Forma puntuda' }
];

function generateQuestion(grade) {
    let shape;
    let attempts = 0;
    const maxAttempts = 20;

    do {
        shape = shapesBank[randomNumber(0, shapesBank.length - 1)];
        attempts++;
    } while (usedShapes.includes(shape.name) && attempts < maxAttempts);

    usedShapes.push(shape.name);
    return shape;
}

function makeChoices(correctShape) {
    const choices = new Set();
    choices.add(correctShape.name);

    // Agregar opciones incorrectas
    while (choices.size < 4) {
        const randomShape = shapesBank[randomNumber(0, shapesBank.length - 1)];
        choices.add(randomShape.name);
    }

    const arr = Array.from(choices);
    // Mezclar opciones
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function renderRound() {
    const shape = generateQuestion(profileGrade);
    currentAnswer = shape.name;
    currentShape = shape;

    const qText = document.getElementById('questionText');
    const roundText = document.getElementById('roundText');
    const feedback = document.getElementById('feedback');
    const actionButton = document.getElementById('actionButton');

    if (qText) qText.innerText = '¿Qué forma es esta?';
    if (roundText) roundText.innerText = `Pregunta ${currentRound} de ${totalRounds}`;
    if (feedback) { feedback.innerText = ''; feedback.className = 'feedback'; }
    if (actionButton) { actionButton.style.display = 'none'; actionButton.disabled = false; }

    questionNeedsCorrecting = false;

    // Renderizar la forma
    const shapeDisplay = document.getElementById('shapeDisplay');
    if (shapeDisplay) {
        shapeDisplay.innerHTML = '';
        const shapeElement = document.createElement('div');
        shapeElement.className = 'shape-item';

        if (shape.svg === 'circle') {
            shapeElement.innerHTML = '<svg viewBox="0 0 100 100" class="shape-svg"><circle cx="50" cy="50" r="40" class="shape-fill"/></svg>';
        } else if (shape.svg === 'square') {
            shapeElement.innerHTML = '<svg viewBox="0 0 100 100" class="shape-svg"><rect x="20" y="20" width="60" height="60" class="shape-fill"/></svg>';
        } else if (shape.svg === 'triangle') {
            shapeElement.innerHTML = '<svg viewBox="0 0 100 100" class="shape-svg"><polygon points="50,10 90,90 10,90" class="shape-fill"/></svg>';
        } else if (shape.svg === 'rectangle') {
            shapeElement.innerHTML = '<svg viewBox="0 0 100 100" class="shape-svg"><rect x="15" y="30" width="70" height="40" class="shape-fill"/></svg>';
        } else if (shape.svg === 'star') {
            shapeElement.innerHTML = '<svg viewBox="0 0 100 100" class="shape-svg"><polygon points="50,15 61,35 82,35 65,48 72,68 50,55 28,68 35,48 18,35 39,35" class="shape-fill"/></svg>';
        }

        shapeDisplay.appendChild(shapeElement);
    }

    // Renderizar opciones
    const options = document.getElementById('options');
    if (!options) return;
    options.innerHTML = '';
    const choices = makeChoices(shape);
    choices.forEach(choice => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerHTML = `<div class="opt-text">${choice}</div>`;
        btn.addEventListener('click', () => handleChoice(choice, btn));
        options.appendChild(btn);
    });
}

function disableOptions() {
    const options = document.querySelectorAll('#options .option-btn');
    options.forEach(b => b.disabled = true);
}

function enableOptions() {
    const options = document.querySelectorAll('#options .option-btn');
    options.forEach(b => {
        b.disabled = false;
        b.classList.remove('selected-wrong', 'selected-correct');
    });
}

function clearFeedback() {
    const feedback = document.getElementById('feedback');
    if (feedback) {
        feedback.innerText = '';
        feedback.className = 'feedback';
    }
}

let lastAnswerCorrect = false;
let questionNeedsCorrecting = false;

async function handleChoice(answerValue, btn) {
    disableOptions();
    const feedback = document.getElementById('feedback');
    const actionButton = document.getElementById('actionButton');
    const correct = answerValue === currentAnswer;
    lastAnswerCorrect = correct;

    if (correct) {
        if (!questionNeedsCorrecting) {
            earnedPoints += pointsPerCorrect;
        }
        if (feedback) {
            feedback.innerText = `¡Muy bien! Es un ${currentAnswer}. ${currentShape.description}. ¡Excelente!`;
            feedback.classList.add('correct');
        }
        if (btn) btn.classList.add('selected-correct');
        if (actionButton) {
            actionButton.innerText = currentRound >= totalRounds ? 'Terminar' : 'Siguiente';
            actionButton.style.display = 'inline-flex';
        }
    } else {
        questionNeedsCorrecting = true;
        if (feedback) {
            feedback.innerText = `Casi... Es un ${currentAnswer}. ${currentShape.description}. ¡Presiona corregir para intentarlo otra vez!`;
            feedback.classList.add('wrong');
        }
        if (btn) btn.classList.add('selected-wrong');
        if (actionButton) {
            actionButton.innerText = 'Corregir';
            actionButton.style.display = 'inline-flex';
        }
    }

    answersLog.push({ question: `¿Qué forma es esta?`, respuesta: answerValue, correct });

    // Remover listener anterior para evitar acumulación
    if (actionButton) {
        actionButton.onclick = null;
        actionButton.onclick = async () => {
            if (lastAnswerCorrect) {
                if (currentRound >= totalRounds) {
                    await finishGame();
                    return;
                }
                currentRound += 1;
                renderRound();
            } else {
                clearFeedback();
                enableOptions();
                if (actionButton) actionButton.style.display = 'none';
            }
        };
    }
}

async function finishGame() {
    const questionCard = document.getElementById('questionCard');
    const endScreen = document.getElementById('endScreen');
    const finalText = document.getElementById('finalText');
    const newTotalText = document.getElementById('newTotalText');

    if (questionCard) questionCard.style.display = 'none';
    if (endScreen) endScreen.style.display = 'block';
    if (finalText) finalText.innerText = `¡Felicidades! Has ganado ${earnedPoints} puntos de exp. ¡Conoces muy bien las formas!`;

    const progress = await saveProgress();
    if (newTotalText) newTotalText.innerText = `Tu total ahora es ${progress.puntos} xp.`;

    // Notificar al dashboard que cierre el overlay y actualice los puntos
    if (window.parent !== window) {
        window.parent.postMessage({
            type: 'gameCompleted',
            earnedPoints: earnedPoints,
            totalPoints: progress.puntos
        }, '*');
    }
}

function getProgressLevel(points) {
    points = parseInt(points, 10) || 0;
    if (points < 50) return '🌱 Semilla';
    if (points < 200) return '📘 Novato';
    if (points < 500) return '🌟 Aprendiz';
    if (points < 1000) return '🔆 Practicante';
    if (points < 2000) return '🔥 Experto';
    if (points < 3500) return '👑 Maestro';
    if (points < 5000) return '💠 Gran Maestro';
    return '💎 Leyenda';
}

async function saveProgress() {
    const supabase = window.supabaseClient;
    if (!supabase) {
        console.error('Supabase no cargó en saveProgress');
        const fallbackPoints = parseInt(earnedPoints, 10) || 0;
        return { puntos: fallbackPoints, nivel: getProgressLevel(fallbackPoints) };
    }

    let totalPoints = parseInt(earnedPoints, 10);
    let level = getProgressLevel(totalPoints);

    try {
        const { data: existing, error: selectError } = await supabase
            .from('progreso')
            .select('id, puntos')
            .eq('user_id', userId)
            .maybeSingle();

        if (selectError) console.error('Error buscando progreso:', selectError);

        if (existing) {
            totalPoints = parseInt(existing.puntos || 0, 10) + parseInt(earnedPoints, 10);
            level = getProgressLevel(totalPoints);

            const { data: updated, error: updateError } = await supabase
                .from('progreso')
                .update({ puntos: totalPoints, nivel: level })
                .eq('user_id', userId)
                .select('puntos')
                .maybeSingle();

            if (updateError) console.error('Error actualizando progreso:', updateError);
            else if (updated && updated.puntos) totalPoints = parseInt(updated.puntos, 10);
        } else {
            const payload = { user_id: userId, puntos: totalPoints, nivel: level };
            const { data: inserted, error: insertError } = await supabase
                .from('progreso')
                .insert([payload])
                .select('puntos')
                .maybeSingle();

            if (insertError) console.error('Error insertando progreso:', insertError);
            else if (inserted && inserted.puntos) totalPoints = parseInt(inserted.puntos, 10);
        }
    } catch (err) {
        console.error('Error en saveProgress:', err);
    }

    try {
        const resultados = answersLog.map(item => ({
            user_id: userId,
            operacion: item.question,
            respuesta: item.respuesta,
            correcta: item.correct,
            fecha: new Date().toISOString()
        }));
        const { error: resultsError } = await supabase.from('resultados').insert(resultados);
        if (resultsError) console.error('Error guardando resultados:', resultsError);
    } catch (err) {
        console.error('Error guardando resultados:', err);
    }

    return { puntos: totalPoints, nivel: level };
}
