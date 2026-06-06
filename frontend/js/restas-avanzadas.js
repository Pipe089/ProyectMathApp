document.addEventListener("DOMContentLoaded", () => {
    protegerRuta();
    initGame();
});

let currentRound = 1;
let totalRounds = 7;
let earnedPoints = 0;
let currentAnswer = 0;
let currentA = 0;
let currentB = 0;
let userId = null;
let profileGrade = 'primero';
const pointsPerCorrect = 20;
const answersLog = [];
let lastAnswerCorrect = false;
let questionNeedsCorrecting = false;
let feedbackTimeout = null;

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
    document.getElementById('userGreeting').innerText = `¡Hola ${name}! Vamos a practicar restas.`;

    if (profileGrade === 'segundo') totalRounds = 7;
    renderRound();
}

function randomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateQuestion(grade) {
    const max = grade === 'segundo' ? 20 : 15;
    const min = 10;
    const a = randomNumber(min, max);
    const b = randomNumber(min, Math.min(a, max));
    return { a, b, answer: a - b };
}

function renderRound() {
    const q = generateQuestion(profileGrade);
    currentAnswer = q.answer;
    currentA = q.a;
    currentB = q.b;
    questionNeedsCorrecting = false;

    const feedback = document.getElementById('feedback');
    const actionButton = document.getElementById('actionButton');
    const answerInput = document.getElementById('answerInput');
    const verifyButton = document.getElementById('verifyButton');

    document.getElementById('questionText').innerText = `${q.a} - ${q.b}`;
    document.getElementById('roundText').innerText = `Pregunta ${currentRound} de ${totalRounds}`;
    if (feedback) {
        feedback.innerText = '';
        feedback.className = 'feedback';
    }
    if (feedbackTimeout) {
        clearTimeout(feedbackTimeout);
        feedbackTimeout = null;
    }
    if (actionButton) {
        actionButton.style.display = 'none';
        actionButton.onclick = null;
    }
    if (answerInput) {
        answerInput.value = '';
        answerInput.disabled = false;
    }
    if (verifyButton) {
        verifyButton.disabled = false;
        verifyButton.onclick = handleAnswer;
    }
    if (answerInput) answerInput.focus();
}

function clearFeedback() {
    const feedback = document.getElementById('feedback');
    if (!feedback) return;
    feedback.innerText = '';
    feedback.className = 'feedback';
    if (feedbackTimeout) {
        clearTimeout(feedbackTimeout);
        feedbackTimeout = null;
    }
}

async function handleAnswer() {
    const answerInput = document.getElementById('answerInput');
    const verifyButton = document.getElementById('verifyButton');
    const feedback = document.getElementById('feedback');
    const actionButton = document.getElementById('actionButton');

    const answerValue = parseInt(answerInput.value, 10);
    if (Number.isNaN(answerValue)) {
        if (feedback) {
            feedback.innerText = 'Por favor escribe un número válido.';
            feedback.className = 'feedback wrong';
        }
        return;
    }

    const correct = answerValue === currentAnswer;
    lastAnswerCorrect = correct;

    if (feedbackTimeout) {
        clearTimeout(feedbackTimeout);
        feedbackTimeout = null;
    }

    if (correct) {
        if (!questionNeedsCorrecting) earnedPoints += pointsPerCorrect;
        if (feedback) {
            feedback.innerText = `¡Muy bien! ${currentA} - ${currentB} = ${currentAnswer}.`;
            feedback.classList.add('correct');
            feedback.classList.remove('wrong');
        }
        if (answerInput) answerInput.disabled = true;
        if (verifyButton) verifyButton.disabled = true;
        if (actionButton) {
            actionButton.innerText = currentRound >= totalRounds ? 'Terminar' : 'Siguiente';
            actionButton.style.display = 'inline-flex';
        }
    } else {
        questionNeedsCorrecting = true;
        if (feedback) {
            feedback.innerText = `Casi... la respuesta correcta era ${currentAnswer}.`;
            feedback.classList.add('wrong');
            feedback.classList.remove('correct');
        }
        if (answerInput) answerInput.disabled = true;
        if (verifyButton) verifyButton.disabled = true;
        if (actionButton) {
            actionButton.innerText = 'Corregir';
            actionButton.style.display = 'inline-flex';
        }
    }

    answersLog.push({ question: `${currentA} - ${currentB}`, respuesta: answerValue, correct });

    if (feedback) {
        feedbackTimeout = setTimeout(clearFeedback, 3000);
    }

    if (actionButton) {
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
                if (feedback) {
                    feedback.innerText = '';
                    feedback.className = 'feedback';
                }
                if (answerInput) {
                    answerInput.disabled = false;
                    answerInput.value = '';
                    answerInput.focus();
                }
                if (verifyButton) verifyButton.disabled = false;
                actionButton.style.display = 'none';
            }
        };
    }
}

async function finishGame() {
    document.getElementById('questionCard').style.display = 'none';
    document.getElementById('endScreen').style.display = 'block';
    document.getElementById('finalText').innerText = `Felicidades, has ganado ${earnedPoints} puntos de exp.`;

    const progress = await saveProgress();
    document.getElementById('newTotalText').innerText = `Tu total ahora es ${progress.puntos} xp.`;

    if (window.parent !== window) {
        window.parent.postMessage({ type: 'gameCompleted', earnedPoints: earnedPoints, totalPoints: progress.puntos }, '*');
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

        if (selectError) {
            console.error('Error buscando progreso:', selectError);
        }

        if (existing) {
            totalPoints = parseInt(existing.puntos || 0, 10) + parseInt(earnedPoints, 10);
            level = getProgressLevel(totalPoints);
            const { data: updated, error: updateError } = await supabase
                .from('progreso')
                .update({ puntos: totalPoints, nivel: level })
                .eq('user_id', userId)
                .select('puntos')
                .maybeSingle();

            if (updateError) {
                console.error('Error actualizando progreso:', updateError);
            } else if (updated && updated.puntos) {
                totalPoints = parseInt(updated.puntos, 10);
            }
        } else {
            const payload = {
                user_id: userId,
                puntos: totalPoints,
                nivel: level
            };
            const { data: inserted, error: insertError } = await supabase
                .from('progreso')
                .insert([payload])
                .select('puntos')
                .maybeSingle();

            if (insertError) {
                console.error('Error insertando progreso:', insertError);
            } else if (inserted && inserted.puntos) {
                totalPoints = parseInt(inserted.puntos, 10);
            }
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

        const { error: resultsError } = await supabase
            .from('resultados')
            .insert(resultados);

        if (resultsError) {
            console.error('Error guardando resultados:', resultsError);
        }
    } catch (err) {
        console.error('Error guardando resultados:', err);
    }

    return { puntos: totalPoints, nivel: level };
}
