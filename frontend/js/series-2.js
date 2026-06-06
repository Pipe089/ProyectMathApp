document.addEventListener("DOMContentLoaded", () => {
    protegerRuta();
    initGame();
});

let currentRound = 1;
let totalRounds = 5;
let earnedPoints = 0;
let currentAnswer = 0;
let currentSeries = [];
let userId = null;
let profileGrade = 'primero';
const pointsPerCorrect = 20;
const answersLog = [];
let usedSeries = []; // Para evitar series repetidas

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
    if (userGreeting) userGreeting.innerText = `¡Hola ${name}! Vamos a practicar series de 2 en 2. ¡Encuentra el próximo número!`;

    if (profileGrade === 'segundo') totalRounds = 7;

    usedSeries = []; // Resetear series usadas
    renderRound();
}

function randomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateQuestion(grade) {
    // Para ambos grados: series hasta 50
    const maxNumber = 50;
    const seriesLength = grade === 'segundo' ? 5 : 4; // número de elementos a mostrar

    // Generar una serie única que no se haya usado antes
    let startNumber, series, seriesKey;
    let attempts = 0;
    const maxAttempts = 100;

    do {

        // Generar cualquier número inicial (par o impar)
        startNumber = randomNumber(1, maxNumber - (seriesLength * 2));


        // Generar la serie: startNumber, startNumber+2, startNumber+4, etc.
        series = [];
        for (let i = 0; i < seriesLength; i++) {
            series.push(startNumber + (i * 2));
        }

        // Crear una clave para identificar la serie
        seriesKey = series.join(',');
        attempts++;
    } while (usedSeries.includes(seriesKey) && attempts < maxAttempts);

    // Guardar la serie como usada
    usedSeries.push(seriesKey);

    // El siguiente número es el último + 2
    const nextNumber = series[series.length - 1] + 2;

    return { series, answer: nextNumber };
}

function makeChoices(correct, grade) {
    const choices = new Set();
    choices.add(correct);

    // Generar opciones incorrectas
    while (choices.size < 4) {
        const delta = Math.floor(Math.random() * 4) + 1; // 1..4
        const sign = Math.random() < 0.5 ? -1 : 1;
        let candidate = correct + sign * delta;
        if (candidate < 0) candidate = Math.abs(candidate) + 1;
        choices.add(candidate);
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
    const q = generateQuestion(profileGrade);
    currentAnswer = q.answer;
    currentSeries = q.series;

    const qText = document.getElementById('questionText');
    const roundText = document.getElementById('roundText');
    const feedback = document.getElementById('feedback');
    const actionButton = document.getElementById('actionButton');

    if (qText) qText.innerText = `¿Cuál es el próximo número en la serie de 2 en 2?`;
    if (roundText) roundText.innerText = `Pregunta ${currentRound} de ${totalRounds}`;
    if (feedback) { feedback.innerText = ''; feedback.className = 'feedback'; }
    if (actionButton) { actionButton.style.display = 'none'; actionButton.disabled = false; }

    questionNeedsCorrecting = false;

    // Renderizar la serie
    const seriesDisplay = document.getElementById('seriesDisplay');
    if (seriesDisplay) {
        seriesDisplay.innerHTML = '';
        currentSeries.forEach(num => {
            const span = document.createElement('span');
            span.className = 'series-number';
            span.textContent = num;
            seriesDisplay.appendChild(span);
        });
    }

    // Renderizar opciones
    const options = document.getElementById('options');
    if (!options) return;
    options.innerHTML = '';
    const choices = makeChoices(q.answer, profileGrade);
    choices.forEach(choice => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerHTML = `<div class="opt-number">${choice}</div>`;
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

    const seriesText = currentSeries.join(', ');

    if (correct) {
        if (!questionNeedsCorrecting) {
            earnedPoints += pointsPerCorrect;
        }
        if (feedback) {
            feedback.innerText = `¡Muy bien! La serie es: ${seriesText}, ${currentAnswer}. Vas contando de 2 en 2. ¡Excelente!`;
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
            feedback.innerText = `Casi... La serie es: ${seriesText}, ${currentAnswer}. Recuerda, sumamos 2 cada vez. ¡Presiona corregir para intentarlo otra vez!`;
            feedback.classList.add('wrong');
        }
        if (btn) btn.classList.add('selected-wrong');
        if (actionButton) {
            actionButton.innerText = 'Corregir';
            actionButton.style.display = 'inline-flex';
        }
    }

    answersLog.push({ question: `Serie: ${seriesText}, ?`, respuesta: answerValue, correct });

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
    if (finalText) finalText.innerText = `¡Felicidades! Has ganado ${earnedPoints} puntos de exp. ¡Contaste perfecto de 2 en 2!`;

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
