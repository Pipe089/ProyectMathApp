document.addEventListener("DOMContentLoaded", () => {
    protegerRuta(); // CLAVE
    init();

    const btn = document.getElementById("btnGuardar");
    if (btn) {
        btn.addEventListener("click", guardarPerfil);
    }

    const rolSelect = document.getElementById("rol");
    if (rolSelect) {
        rolSelect.addEventListener("change", handleRoleChange);
        handleRoleChange();
    }

    const backButton = document.getElementById("btnBackToList");
    if (backButton) {
        backButton.addEventListener("click", hideStudentReport);
    }

    const closeOverlay = document.getElementById('closeGameOverlay');
    if (closeOverlay) {
        closeOverlay.addEventListener('click', closeGameOverlay);
    }
});

document.getElementById("btnLogout").addEventListener("click", logout);

function openGameOverlay(page) {
    const overlay = document.getElementById('gameOverlay');
    const iframe = document.getElementById('gameOverlayFrame');
    if (!overlay || !iframe) return;

    iframe.src = page;
    overlay.style.display = 'flex';
    document.querySelector('.main-content').style.overflow = 'hidden';
}

function closeGameOverlay() {
    const overlay = document.getElementById('gameOverlay');
    const iframe = document.getElementById('gameOverlayFrame');
    if (!overlay || !iframe) return;

    iframe.src = '';
    overlay.style.display = 'none';
    document.querySelector('.main-content').style.overflow = 'auto';
}

window.addEventListener('message', async (event) => {
    if (event.data.type === 'gameCompleted') {
        setTimeout(() => {
            closeGameOverlay();
        }, 10000);

        const supabase = window.supabaseClient;
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const progress = await loadProgress(user.id);
            renderProgress(progress);
        }
    }
});

async function init() {
    const supabase = window.supabaseClient;

    // Verificar que Supabase cargó
    if (!supabase) {
        document.body.innerHTML = "Error: Supabase no cargó ❌";
        return;
    }

    try {
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error) {
            console.error(error);
            document.body.innerHTML = "Error obteniendo usuario ❌";
            return;
        }

        // Si no hay sesión
        if (!user) {
            window.location.href = "login.html";
            return;
        }

        // 🔍 Buscar perfil
        const { data: profile, error: errorProfile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .maybeSingle();

        if (errorProfile) {
            console.error(errorProfile);
            document.getElementById("msg").innerText = "Error cargando perfil ❌";
            return;
        }

        // Si NO existe perfil → mostrar formulario
        if (!profile) {
            document.getElementById("formExtra").style.display = "block";
            handleRoleChange();
            return;
        }

        document.getElementById("formExtra").style.display = "none";

        if (profile.rol === 'docente') {
            await renderTeacherView(profile);
            return;
        }

        const progress = await loadProgress(user.id);
        renderProgress(progress);
        renderModules(profile);

        const studentDashboard = document.getElementById("studentDashboard");
        const heroTitle = document.getElementById("heroTitle");
        const avatarName = document.getElementById("avatarName");

        if (studentDashboard) studentDashboard.style.display = "block";
        if (heroTitle) heroTitle.innerHTML = `¡Bienvenido <span id="heroName">${profile.nombre}</span>!`;
        if (avatarName) avatarName.innerText = profile.nombre || "Usuario";

    } catch (err) {
        console.error(err);
        document.body.innerHTML = "Error inesperado ❌";
    }
}

function renderModules(profile) {
    const modulesGrid = document.getElementById("modulesGrid");
    const modulesSubtitle = document.getElementById("modulesSubtitle");

    const grade = profile.grado || "primero";
    const gradoTexto = grade === "segundo" ? "2.º grado" : "1.º grado";
    modulesSubtitle.innerText = `Bienvenido ${profile.nombre}. Estos son los módulos para ${gradoTexto}.`;

    const modulesByGrade = {
        primero: [
            { subtitle: "1 al 10", title: "Sumas básicas", desc: "Practica sumas fáciles.", icon: "➕", page: "sumas.html" },
            { subtitle: "1 al 10", title: "Restas básicas", desc: "Resuelve restas paso a paso.", icon: "➖", page: "restas.html" },
            { subtitle: "Patrones", title: "Series de 2 en 2", desc: "Sigue los números.", icon: "2️⃣", page: "series-2.html" },
            { subtitle: "Formas", title: "Formas básicas", desc: "Conoce las figuras.", icon: "⬜", page: "formas.html" }
        ],
        segundo: [
            { subtitle: "10 al 25", title: "Sumas avanzadas", desc: "Sumas más grandes.", icon: "➕", page: "sumas-avanzadas.html" },
            { subtitle: "10 al 20", title: "Restas avanzadas", desc: "Opera restas complejas.", icon: "➖", page: "" },
            { subtitle: "Tablas", title: "Multiplicaciones", desc: "Las primeras mult.", icon: "✖️", page: "" },
            { subtitle: "5 en 5", title: "Series de 5 en 5", desc: "Patrones numéricos.", icon: "5️⃣", page: "" }
        ]
    };

    const modules = modulesByGrade[grade] || modulesByGrade.primero;

    modulesGrid.innerHTML = modules.map((m, idx) => `
        <article class="module-card card-${(idx % 4) + 1}" data-page="${m.page || ''}">
            <p class="subtitle">${m.subtitle}</p>
            <p class="title">${m.title}</p>
            <p class="desc">${m.desc}</p>
            <div class="illustration">${m.icon}</div>
            <button class="btn-enter" data-page="${m.page || ''}">Entrar</button>
        </article>
    `).join("");

    modulesGrid.querySelectorAll('.module-card').forEach(card => {
        const page = card.dataset.page;
        card.addEventListener('click', () => {
            if (!page) {
                document.getElementById('msg').innerText = 'Próximamente disponible.';
                return;
            }
            openGameOverlay(page);
        });

        const button = card.querySelector('.btn-enter');
        if (button) {
            button.addEventListener('click', event => {
                event.stopPropagation();
                if (!page) {
                    document.getElementById('msg').innerText = 'Próximamente disponible.';
                    return;
                }
                openGameOverlay(page);
            });
        }
    });
}

async function loadProgress(userId) {
    const supabase = window.supabaseClient;
    if (!supabase) {
        console.error('Supabase no cargó en loadProgress');
        return { puntos: 0, nivel: 'Iniciando' };
    }

    const { data: progress, error } = await supabase
        .from('progreso')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

    if (error) {
        console.error('Error cargando progreso:', error);
        return { puntos: 0, nivel: 'Iniciando' };
    }

    if (!progress) {
        return { puntos: 0, nivel: 'Iniciando' };
    }

    return { puntos: progress.puntos || 0, nivel: progress.nivel || 'Iniciando' };
}

function getLevelFromPoints(points) {
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

function renderProgress(progress) {
    const card = document.getElementById('progressCard');
    const level = document.getElementById('progressLevel');
    const points = document.getElementById('progressPoints');

    const calculatedLevel = getLevelFromPoints(progress.puntos || 0);
    level.innerText = calculatedLevel;
    points.innerText = `${progress.puntos || 0} xp`;
    card.style.display = 'flex';
}

function getLevelInfo(points) {
    points = parseInt(points, 10) || 0;
    const levels = [
        { min: 0, max: 49, label: '🌱 Semilla' },
        { min: 50, max: 199, label: '📘 Novato' },
        { min: 200, max: 499, label: '🌟 Aprendiz' },
        { min: 500, max: 999, label: '🔆 Practicante' },
        { min: 1000, max: 1999, label: '🔥 Experto' },
        { min: 2000, max: 3499, label: '👑 Maestro' },
        { min: 3500, max: 4999, label: '💠 Gran Maestro' },
        { min: 5000, max: Infinity, label: '💎 Leyenda' }
    ];

    for (const lvl of levels) {
        if (points >= lvl.min && points <= lvl.max) return { ...lvl };
    }
    return levels[0];
}

function renderProgress(progress) {
    const card = document.getElementById('progressCard');
    const levelEl = document.getElementById('progressLevel');
    const pointsEl = document.getElementById('progressPoints');
    const fill = document.getElementById('progressBarFill');
    const percentEl = document.getElementById('progressPercent');

    const pts = parseInt(progress.puntos || 0, 10);
    const info = getLevelInfo(pts);
    levelEl.innerText = info.label;
    pointsEl.innerText = `${pts} xp`;

    // calculate percentage toward next level
    let percent = 100;
    if (info.max === Infinity) {
        percent = 100;
    } else {
        const span = info.max - info.min + 1;
        percent = Math.round(((pts - info.min) / span) * 100);
        if (percent < 0) percent = 0;
        if (percent > 100) percent = 100;
    }

    if (fill) fill.style.width = percent + '%';
    if (percentEl) percentEl.innerText = percent + '%';

    card.style.display = 'flex';
}

function escapeHtml(text) {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function handleRoleChange() {
    const rolSelect = document.getElementById('rol');
    const edadInput = document.getElementById('edad');
    const institucionInput = document.getElementById('institucion');

    if (!rolSelect || !edadInput || !institucionInput) {
        return;
    }

    const rol = rolSelect.value;

    if (rol === 'docente') {
        edadInput.value = '';
        edadInput.disabled = true;
        edadInput.required = false;
        institucionInput.required = true;
    } else {
        edadInput.disabled = false;
        edadInput.required = true;
        institucionInput.required = false;
    }
}

async function renderTeacherView(profile) {
    const supabase = window.supabaseClient;
    const teacherView = document.getElementById('teacherView');
    const studentDashboard = document.getElementById('studentDashboard');
    const studentsContainer = document.getElementById('studentsContainer');
    const studentReport = document.getElementById('studentReport');

    if (!teacherView || !studentsContainer) {
        console.error('Teacher view elements not found');
        return;
    }

    if (studentDashboard) studentDashboard.style.display = 'none';
    if (studentReport) studentReport.style.display = 'none';
    teacherView.style.display = 'block';

    const degreeText = profile.grado === 'segundo' ? 'Segundo grado' : 'Primero';

    const teacherTitle = document.getElementById('teacherTitle');
    const teacherGradeLabel = document.getElementById('teacherGradeLabel');

    if (teacherTitle) teacherTitle.innerText = `Panel de docente - ${degreeText}`;
    if (teacherGradeLabel) teacherGradeLabel.innerText = `Listado de estudiantes de ${degreeText} - ${profile.institucion}`;

    const avatarName = document.getElementById('avatarName');
    if (avatarName) avatarName.innerText = profile.nombre || 'Usuario';

    if (!profile.institucion) {
        studentsContainer.innerHTML = `<div class="alert alert-warning">No se encontró institución para este docente. Actualiza tu perfil.</div>`;
        return;
    }

    const { students, error, debug } = await loadStudentsByGrade(profile.grado, profile.institucion);
    if (error) {
        studentsContainer.innerHTML = `<div class="alert alert-danger">Error cargando estudiantes: ${escapeHtml(error)}</div>`;
        return;
    }

    renderStudentsList(students, degreeText, debug);
}

async function loadStudentsByGrade(grade, institucion) {
    const normalizedInstitution = institucion ? institucion.trim() : '';

    if (!normalizedInstitution) {
        console.warn('Institución vacía al cargar estudiantes');
        return { students: [], error: 'Institución está vacía', debug: `grado=${grade}` };
    }

    const url = new URL('/api/teacher/students', window.location.origin);
    url.searchParams.set('grado', grade);
    url.searchParams.set('institucion', normalizedInstitution);
    console.log('Consultando', url.toString());

    let response;
    try {
        response = await fetch(url.toString());
    } catch (err) {
        console.error('Fetch falló para /api/teacher/students:', err);
        return { students: [], error: `No se pudo conectar con el backend: ${err.message}`, debug: url.toString() };
    }

    if (!response.ok) {
        const errorText = await response.text();
        console.error('Error API teacher students:', response.status, response.statusText, errorText);
        return { students: [], error: `API error ${response.status}: ${response.statusText} - ${errorText}`, debug: url.toString() };
    }

    const students = await response.json();
    if (!Array.isArray(students)) {
        console.error('Respuesta inválida de estudiantes:', students);
        return { students: [], error: 'Respuesta inválida de la API de estudiantes', debug: url.toString() };
    }

    if (students.length === 0) {
        return { students: [], error: null, debug: `Consulta exitosa, 0 estudiantes devueltos para grado=${grade} institución=${normalizedInstitution}` };
    }

    return { students: students.sort((a, b) => b.puntos - a.puntos), error: null, debug: `Consulta exitosa, ${students.length} estudiantes devueltos` };
}

function renderStudentsList(students, degreeText, debugMessage) {
    const container = document.getElementById('studentsContainer');

    if (!students.length) {
        container.innerHTML = `
            <div class="alert alert-info">No hay estudiantes registrados para ${degreeText}.</div>
            <div class="alert alert-secondary mt-3"><strong>Debug:</strong> ${escapeHtml(debugMessage || 'Sin información adicional')}</div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="table-responsive">
            <table class="table table-striped">
                <thead>
                    <tr>
                        <th>Estudiante</th>
                        <th>Grado</th>
                        <th>Puntos XP</th>
                        <th>Nivel</th>
                        <th>Acción</th>
                    </tr>
                </thead>
                <tbody>
                    ${students.map(student => `
                        <tr>
                            <td>${student.nombre} ${student.apellido}</td>
                            <td>${student.grado}</td>
                            <td>${student.puntos}</td>
                            <td>${student.nivel}</td>
                            <td><button class="btn btn-primary btn-sm view-report-btn" data-userid="${student.id}">Ver informe</button></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;

    container.querySelectorAll('.view-report-btn').forEach(button => {
        button.addEventListener('click', () => {
            showStudentReport(button.dataset.userid);
        });
    });
}

async function showStudentReport(userId) {
    const studentsContainer = document.getElementById('studentsContainer');
    const studentReport = document.getElementById('studentReport');

    const url = new URL(`/api/teacher/student/${encodeURIComponent(userId)}/report`, window.location.origin);
    const response = await fetch(url.toString());

    if (!response.ok) {
        console.error('Error API student report:', response.statusText);
        document.getElementById('reportSummary').innerHTML = `<div class="alert alert-danger">Error al cargar el informe del estudiante.</div>`;
        return;
    }

    const report = await response.json();
    const { studentProfile, progressData, resultados } = report;

    if (!studentProfile) {
        document.getElementById('reportSummary').innerHTML = `<div class="alert alert-danger">No se encontró el estudiante.</div>`;
        return;
    }

    const nombreCompleto = `${studentProfile.nombre} ${studentProfile.apellido}`;
    const gradoText = studentProfile.grado === 'segundo' ? 'Segundo grado' : 'Primero';

    document.getElementById('reportTitle').innerText = `Informe de ${nombreCompleto}`;
    document.getElementById('reportSummary').innerHTML = `
        <p><strong>Grado:</strong> ${gradoText}</p>
        <p><strong>Puntos XP:</strong> ${progressData?.puntos || 0}</p>
        <p><strong>Nivel:</strong> ${progressData?.nivel || 'Iniciando'}</p>
    `;

    if (!resultados || resultados.length === 0) {
        document.getElementById('reportResults').innerHTML = `<div class="alert alert-warning">No hay resultados registrados aún.</div>`;
    } else {
        document.getElementById('reportResults').innerHTML = `
            <div class="table-responsive">
                <table class="table table-bordered">
                    <thead>
                        <tr>
                            <th>Operación</th>
                            <th>Respuesta</th>
                            <th>Correcta</th>
                            <th>Fecha</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${resultados.map(result => `
                            <tr>
                                <td>${result.operacion}</td>
                                <td>${result.respuesta ?? ''}</td>
                                <td>${result.correcta ? 'Sí' : 'No'}</td>
                                <td>${new Date(result.fecha).toLocaleString()}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    studentsContainer.style.display = 'none';
    studentReport.style.display = 'block';
}

function hideStudentReport() {
    document.getElementById('studentReport').style.display = 'none';
    document.getElementById('studentsContainer').style.display = 'block';
}

// Guardar perfil
async function guardarPerfil() {
    const supabase = window.supabaseClient;

    const { data: { user } } = await supabase.auth.getUser();

    const nombre = document.getElementById("nombre").value.trim();
    const apellido = document.getElementById("apellido").value.trim();
    const edadInput = document.getElementById("edad");
    let edad = parseInt(edadInput.value, 10);
    const rol = document.getElementById("rol").value;
    const grado = document.getElementById("grado").value;
    const institucion = document.getElementById("institucion").value.trim();

    const msg = document.getElementById("msg");

    // Validación
    if (!nombre || !apellido || !grado) {
        msg.innerText = "Completa todos los datos obligatorios ❗";
        return;
    }

    if (rol === "docente") {
        if (!institucion) {
            msg.innerText = "Los docentes deben indicar su institución ❗";
            return;
        }
    } else {
        if (isNaN(edad)) {
            msg.innerText = "Debes ingresar una edad válida para estudiante ❗";
            return;
        }

        if (edad < 5 || edad > 8) {
            msg.innerText = "Los estudiantes deben tener entre 5 y 8 años ❌";
            return;
        }
    }

    try {
        const profileData = {
            id: user.id,
            nombre: nombre,
            apellido: apellido,
            grado: grado,
            rol: rol
        };

        if (rol === "estudiante") {
            profileData.edad = edad;
        }

        if (institucion) {
            profileData.institucion = institucion;
        }

        const { error } = await supabase.from("profiles").insert([profileData]);

        if (error) {
            console.error(error);
            msg.innerText = "Error al guardar ❌";
            return;
        }

        const bienvenidaElement = document.getElementById("bienvenida");
        if (bienvenidaElement) {
            bienvenidaElement.innerText = `Bienvenido ${nombre} ${apellido} (${rol})`;
        }

        document.getElementById("formExtra").style.display = "none";
        msg.innerText = "Perfil guardado correctamente ✅";

        if (rol === 'docente') {
            await renderTeacherView({ nombre, apellido, grado, rol, institucion });
        } else {
            const progress = await loadProgress(user.id);
            renderProgress(progress);
            renderModules({ nombre, apellido, grado, rol });
            const studentDashboard = document.getElementById('studentDashboard');
            if (studentDashboard) studentDashboard.style.display = 'block';
        }

    } catch (err) {
        console.error(err);
        msg.innerText = "Error inesperado ❌";
    }
}