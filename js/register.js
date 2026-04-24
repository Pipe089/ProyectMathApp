let loading = false;

document.addEventListener("DOMContentLoaded", () => {
    evitarAuth(); // CLAVE

    const btn = document.getElementById("btnRegister");
    if (btn) {
        btn.addEventListener("click", register);
    }
});

async function register() {
    if (loading) return; // evita múltiples clicks
    loading = true;

    const supabase = window.supabaseClient;
    const btn = document.getElementById("btnRegister");
    const msg = document.getElementById("msg");

    if (!supabase) {
        msg.innerText = "Error de conexión ❌";
        loading = false;
        return;
    }

    btn.disabled = true;
    msg.innerText = "Registrando... ⏳";

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const confirm_password = document.getElementById("confirm_password").value;

    // Validaciones
    if (!email || !password || !confirm_password) {
        msg.innerText = "Completa todos los campos❗";
        reset(btn);
        return;
    }

    if (password !== confirm_password) {
        msg.innerText = "Las contraseñas no coinciden ❌";
        reset(btn);
        return;
    }

    if (password.length < 6) {
        msg.innerText = "Mínimo 6 caracteres.";
        reset(btn);
        return;
    }

    try {
        // Registro
        const { error } = await supabase.auth.signUp({
            email,
            password
        });

        if (error) {
            msg.innerText = error.message;
            reset(btn);
            return;
        }

        // Login automático
        const { error: loginError } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (loginError) {
            msg.innerText = "Registro ok, pero error al iniciar sesión ❌";
            reset(btn);
            return;
        }

        msg.innerText = "Bienvenido 🚀";

        // Redirección
        setTimeout(() => {
            window.location.href = "dashboard.html";
        }, 800);

    } catch (err) {
        console.error(err);
        msg.innerText = "Error inesperado ❌";
        reset(btn);
    }
}

// Reset botón
function reset(btn) {
    loading = false;
    btn.disabled = false;
}