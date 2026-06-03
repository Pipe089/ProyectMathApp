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
});

document.getElementById("btnLogout").addEventListener("click", logout);

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

        document.getElementById("bienvenida").innerText =
            `Bienvenido ${profile.nombre} ${profile.apellido} (${profile.rol})`;
        document.getElementById("formExtra").style.display = "none";

        if (profile.rol === 'docente') {
            await renderTeacherView(profile);
            return;
        }

        const progress = await loadProgress(user.id);
        renderProgress(progress);
        renderModules(profile);

    } catch (err) {
        console.error(err);
        document.body.innerHTML = "Error inesperado ❌";
    }
}

function renderModules(profile) {
    const modulesSection = document.getElementById("modules");
    const modulesGrid = document.getElementById("modulesGrid");
    const gradeLabel = document.getElementById("grade-label");

    const name = profile.nombre || "";
    const grade = profile.grado || "primero";
    const gradoTexto = grade === "segundo" ? "2.º grado" : "1.º grado";

    gradeLabel.innerText = `Bienvenido ${name}. Estos son los módulos para ${gradoTexto}.`;

    const modulesByGrade = {
        primero: [
            { title: "Sumas básicas", subtitle: "1 al 10", description: "Practica sumas fáciles con imágenes y fichas interactivas.", page: "sumas.html" },
            { title: "Restas básicas", subtitle: "1 al 10", description: "Resuelve restas paso a paso para comprender el resultado." },
            { title: "Series de 2 en 2", subtitle: "Patrones numéricos", description: "Sigue los números y completa la secuencia." },
            { title: "Comparar números", subtitle: "Mayor o menor", description: "Aprende a ordenar y comparar números de forma divertida." },
            { title: "Bingo de números", subtitle: "0 al 20", description: "Juega al bingo resolviendo ejercicios rápidos." }
        ],
        segundo: [
            { title: "Sumas avanzadas", subtitle: "10 al 25", description: "Ejercita sumas más grandes con retos crecientes.", page: "sumas-avanzadas.html" },
            { title: "Restas avanzadas", subtitle: "10 al 20", description: "Opera restas con números más altos y verifica tus respuestas." },
            { title: "Multiplicaciones", subtitle: "Tablas básicas", description: "Descubre las primeras multiplicaciones con juegos visuales." },
            { title: "Series de 5 en 5", subtitle: "Patrones numéricos", description: "Completa secuencias y aprende a contar de 5 en 5." },
            { title: "Geometría simple", subtitle: "Figuras y formas", description: "Reconoce figuras geométricas y sus nombres." }
        ]
    };

    const modules = modulesByGrade[grade] || modulesByGrade.primero;
    modulesGrid.innerHTML = modules.map(module => `
        <article class="module-card">
            <div class="module-badge">${module.subtitle}</div>
            <h4>${module.title}</h4>
            <p>${module.description}</p>
            <button class="module-btn" data-page="${module.page || ''}">Entrar</button>
        </article>
    `).join("");

    modulesSection.style.display = "block";

    modulesGrid.querySelectorAll('.module-btn').forEach((button, index) => {
        const page = button.dataset.page;
        if (page) {
            button.addEventListener('click', () => {
                window.location.href = page;
            });
        } else {
            button.addEventListener('click', () => {
                document.getElementById('msg').innerText = 'Próximamente disponible.';
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

function renderProgress(progress) {
    const card = document.getElementById('progressCard');
    const level = document.getElementById('progressLevel');
    const points = document.getElementById('progressPoints');

    level.innerText = progress.nivel || 'Iniciando';
    points.innerText = `${progress.puntos || 0} xp`;
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
    const modulesSection = document.getElementById('modules');
    const progressCard = document.getElementById('progressCard');
    const studentsContainer = document.getElementById('studentsContainer');
    const studentReport = document.getElementById('studentReport');

    document.getElementById('bienvenida').innerText =
        `Bienvenido ${profile.nombre} ${profile.apellido} (${profile.rol})`;

    modulesSection.style.display = 'none';
    progressCard.style.display = 'none';
    studentReport.style.display = 'none';
    teacherView.style.display = 'block';

    const degreeText = profile.grado === 'segundo' ? 'Segundo grado' : 'Primero';
    document.getElementById('teacherTitle').innerText = `Panel de docente - ${degreeText}`;
    document.getElementById('teacherGradeLabel').innerText = `Listado de estudiantes de ${degreeText} - ${profile.institucion}`;

    if (!profile.institucion) {
        document.getElementById('studentsContainer').innerHTML = `<div class="alert alert-warning">No se encontró institución para este docente. Actualiza tu perfil.</div>`;
        return;
    }

    const { students, error, debug } = await loadStudentsByGrade(profile.grado, profile.institucion);
    if (error) {
        document.getElementById('studentsContainer').innerHTML = `<div class="alert alert-danger">Error cargando estudiantes: ${escapeHtml(error)}</div>`;
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
                            <th>Correcta</th>
                            <th>Fecha</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${resultados.map(result => `
                            <tr>
                                <td>${result.operacion}</td>
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

        document.getElementById("bienvenida").innerText =
            `Bienvenido ${nombre} ${apellido} (${rol})`;

        document.getElementById("formExtra").style.display = "none";
        msg.innerText = "Perfil guardado correctamente ✅";

        if (rol === 'docente') {
            await renderTeacherView({ nombre, apellido, grado, rol, institucion });
        } else {
            const progress = await loadProgress(user.id);
            renderProgress(progress);
            renderModules({ nombre, apellido, grado, rol });
        }

    } catch (err) {
        console.error(err);
        msg.innerText = "Error inesperado ❌";
    }
}