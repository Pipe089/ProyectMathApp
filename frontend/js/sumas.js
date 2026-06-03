document.addEventListener("DOMContentLoaded", () => {
    protegerRuta();
    initGame();

    document.getElementById('btnBack').addEventListener('click', () => {
        window.location.href = 'dashboard.html';
    });

    document.getElementById('btnFinish').addEventListener('click', () => {
        window.location.href = 'dashboard.html';
    });
});

let currentRound = 1;
let totalRounds = 5;
let earnedPoints = 0;
let currentAnswer = 0;
let userId = null;
let profileGrade = 'primero';
const pointsPerCorrect = 20;
const answersLog = [];

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
    document.getElementById('userGreeting').innerText = `¡Hola ${name}! Resuelve las sumas y gana puntos.`;

    if (profileGrade === 'segundo') {
        totalRounds = 7;
    }

    renderRound();
}

function renderRound() {
    const question = generateQuestion(profileGrade);
    currentAnswer = question.answer;
    document.getElementById('questionText').innerText = question.text;
    document.getElementById('roundText').innerText = `Pregunta ${currentRound} de ${totalRounds}`;
    document.getElementById('scoreText').innerText = `Puntos ganados: ${earnedPoints}`;
    document.getElementById('feedback').innerText = '';
    document.getElementById('answerInput').value = '';
    document.getElementById('answerInput').focus();

    document.getElementById('btnSubmit').onclick = handleAnswer;
}

function generateQuestion(grade) {
    const max = grade === 'segundo' ? 20 : 10;
    const min = 1;
    const a = randomNumber(min, max);
    const b = randomNumber(min, max);
    const text = `${a} + ${b}`;
    return { text, answer: a + b };
}

function randomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function handleAnswer() {
    const answerInput = document.getElementById('answerInput');
    const answerValue = parseInt(answerInput.value, 10);
    const feedback = document.getElementById('feedback');

    if (Number.isNaN(answerValue)) {
        feedback.innerText = 'Por favor escribe un número válido.';
        return;
    }

    const correct = answerValue === currentAnswer;
    if (correct) {
        earnedPoints += pointsPerCorrect;
        feedback.innerText = '¡Muy bien! Ganaste puntos ✨';
        feedback.classList.add('correct');
        feedback.classList.remove('wrong');
    } else {
        feedback.innerText = `Casi... la respuesta correcta era ${currentAnswer}.`; 
        feedback.classList.add('wrong');
        feedback.classList.remove('correct');
    }

    answersLog.push({
        question: document.getElementById('questionText').innerText,
        correct,
    });

    if (currentRound >= totalRounds) {
        await finishGame();
        return;
    }

    currentRound += 1;
    setTimeout(renderRound, 900);
}

async function finishGame() {
    document.getElementById('questionCard').style.display = 'none';
    document.getElementById('endScreen').style.display = 'block';
    document.getElementById('finalText').innerText = `Felicidades, has ganado ${earnedPoints} puntos de exp.`;

    const progress = await saveProgress();
    document.getElementById('newTotalText').innerText = `Tu total ahora es ${progress.puntos} xp.`;
}

async function saveProgress() {
    const supabase = window.supabaseClient;
    if (!supabase) {
        console.error('Supabase no cargó en saveProgress');
        return { puntos: earnedPoints, nivel: 'Sumas básicas' };
    }

    const level = 'Sumas básicas';
    let totalPoints = parseInt(earnedPoints, 10);

    try {
        // Buscar si ya existe progreso
        const { data: existing, error: selectError } = await supabase
            .from('progreso')
            .select('id, puntos')
            .eq('user_id', userId)
            .maybeSingle();

        if (selectError) {
            console.error('Error buscando progreso:', selectError);
        }

        if (existing) {
            // Actualizar progreso existente
            totalPoints = parseInt(existing.puntos || 0, 10) + parseInt(earnedPoints, 10);
            console.log(`Actualizando progreso: ${existing.puntos} + ${earnedPoints} = ${totalPoints}`);
            
            const { data: updated, error: updateError } = await supabase
                .from('progreso')
                .update({ puntos: totalPoints })
                .eq('user_id', userId)
                .select('puntos')
                .maybeSingle();

            if (updateError) {
                console.error('Error actualizando progreso:', updateError);
            } else {
                console.log('Progreso actualizado:', updated);
                if (updated && updated.puntos) {
                    totalPoints = parseInt(updated.puntos, 10);
                }
            }
        } else {
            // Insertar nuevo progreso
            console.log(`Insertando nuevo progreso: user_id=${userId}, puntos=${totalPoints}, nivel=${level}`);
            
            const payload = {
                user_id: userId,
                puntos: totalPoints,
                nivel: level
            };
            console.log('Payload a insertar:', payload);
            
            const { data: inserted, error: insertError } = await supabase
                .from('progreso')
                .insert([payload])
                .select('puntos')
                .maybeSingle();

            if (insertError) {
                console.error('Error insertando progreso:', insertError);
                console.log('Reintentando con valores fijos...');
            } else {
                console.log('Progreso insertado:', inserted);
                if (inserted && inserted.puntos) {
                    totalPoints = parseInt(inserted.puntos, 10);
                }
            }
        }
    } catch (err) {
        console.error('Error en saveProgress:', err);
    }

    // Guardar resultados
    try {
        const resultados = answersLog.map(item => ({
            user_id: userId,
            operacion: item.question,
            correcta: item.correct,
            fecha: new Date().toISOString()
        }));

        const { error: resultsError } = await supabase
            .from('resultados')
            .insert(resultados);

        if (resultsError) {
            console.error('Error guardando resultados:', resultsError);
        } else {
            console.log('Resultados guardados:', resultados.length);
        }
    } catch (err) {
        console.error('Error guardando resultados:', err);
    }

    return { puntos: totalPoints, nivel: level };
}
