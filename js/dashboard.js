document.addEventListener("DOMContentLoaded", () => {
    protegerRuta(); // CLAVE
    init();

    const btn = document.getElementById("btnGuardar");
    if (btn) {
        btn.addEventListener("click", guardarPerfil);
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
            return;
        }

        // Si ya existe perfil
        document.getElementById("bienvenida").innerText =
            `Bienvenido ${profile.nombre} ${profile.apellido} (${profile.rol})`;

    } catch (err) {
        console.error(err);
        document.body.innerHTML = "Error inesperado ❌";
    }
}

// Guardar perfil
async function guardarPerfil() {
    const supabase = window.supabaseClient;

    const { data: { user } } = await supabase.auth.getUser();

    const nombre = document.getElementById("nombre").value.trim();
    const apellido = document.getElementById("apellido").value.trim();
    const edad = parseInt(document.getElementById("edad").value);
    const rol = document.getElementById("rol").value;
    const grado = document.getElementById("grado").value;

    const msg = document.getElementById("msg");

    // Validación
    if (!apellido || !edad || !grado) {
        msg.innerText = "Completa todos los datos ❗";
        return;
    }

    try {
        const { error } = await supabase.from("profiles").insert([
            {
                id: user.id,
                nombre: nombre,
                apellido: apellido,
                edad: edad,
                grado: grado,
                rol: rol
            }
        ]);

        if (error) {
            console.error(error);
            msg.innerText = "Error al guardar ❌";
            return;
        }

        // limpiar datos temporales
        localStorage.removeItem("temp_nombre");
        localStorage.removeItem("temp_rol");

        // mostrar bienvenida
        document.getElementById("bienvenida").innerText =
            `Bienvenido ${nombre} ${apellido} (${rol})`;

        document.getElementById("formExtra").style.display = "none";
        msg.innerText = "Perfil guardado correctamente ✅";

    } catch (err) {
        console.error(err);
        msg.innerText = "Error inesperado ❌";
    }
}