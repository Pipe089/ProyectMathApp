let loading = false;

document.addEventListener("DOMContentLoaded", () => {
    evitarAuth();

    const btn = document.getElementById("btnRegister");
    if (btn) {
        btn.addEventListener("click", register);
    }
});

async function register() {
    if (loading) return;
    loading = true;

    const supabase = window.supabaseClient;
    const btn = document.getElementById("btnRegister");

    if (!supabase) {
        showMessage("No se pudo conectar con el servicio. Intenta más tarde.", true);
        loading = false;
        return;
    }

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const confirm_password = document.getElementById("confirm_password").value;

    if (!email || !password || !confirm_password) {
        showMessage("Completa todos los campos para registrarte.", true);
        reset(btn);
        return;
    }

    if (password !== confirm_password) {
        showMessage("Las contraseñas no coinciden.", true);
        reset(btn);
        return;
    }

    if (password.length < 6) {
        showMessage("La contraseña debe tener al menos 6 caracteres y 2 letras.", true);
        reset(btn);
        return;
    }

    btn.disabled = true;
    showMessage("Registrando tu cuenta...", false);

    try {
        const { error } = await supabase.auth.signUp({
            email,
            password
        });

        if (error) {
            showMessage(formatRegisterError(error), true);
            reset(btn);
            return;
        }

        const { error: loginError } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (loginError) {
            showMessage("Cuenta creada, pero no se pudo iniciar sesión automáticamente.", true);
            reset(btn);
            return;
        }

        showMessage("Cuenta creada con éxito. Redirigiendo...", false);
        setTimeout(() => {
            window.location.href = "dashboard.html";
        }, 800);
    } catch (err) {
        console.error(err);
        showMessage("No se pudo crear tu cuenta. Intenta nuevamente.", true);
        reset(btn);
    }
}

function formatRegisterError(error) {
    const text = String(error?.message || error || '').toLowerCase();

    if (text.includes('already registered') || text.includes('user already exists') || text.includes('duplicate') || text.includes('already exists')) {
        return 'Ese correo ya tiene una cuenta. Inicia sesión o prueba con otro correo.';
    }

    if (text.includes('invalid email')) {
        return 'Ingresa un correo válido.';
    }

    if (text.includes('password should be at least') || text.includes('password must be at least') || text.includes('password is invalid')) {
        return 'La contraseña debe tener al menos 6 caracteres y 2 letras.';
    }

    return 'No se pudo crear la cuenta. Intenta nuevamente.';
}

function showMessage(text, isError = true) {
    const msg = document.getElementById("msg");
    if (!msg) return;

    msg.innerText = text;
    msg.style.color = isError ? '#dc2626' : '#0f5132';
}

function reset(btn) {
    loading = false;
    if (btn) {
        btn.disabled = false;
    }
}
