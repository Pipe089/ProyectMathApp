document.addEventListener("DOMContentLoaded", () => {
    evitarAuth();

    const btn = document.getElementById("btnLogin");
    if (btn) {
        btn.addEventListener("click", login);
    }
});

async function login() {
    const supabase = window.supabaseClient;
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const msg = document.getElementById("msg");

    if (!email || !password) {
        showMessage("Completa el correo y la contraseña para continuar.", true);
        return;
    }

    if (!supabase) {
        showMessage("No se pudo conectar con el servicio. Intenta más tarde.", true);
        return;
    }

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        showMessage(formatAuthError(error), true);
    } else {
        showMessage("¡Bienvenido! Redirigiendo...", false);
        setTimeout(() => {
            window.location.href = "dashboard.html";
        }, 800);
    }
}

function formatAuthError(error) {
    const text = String(error?.message || error || '').toLowerCase();

    if (text.includes('invalid login credentials') || text.includes('invalid login') || text.includes('invalid credentials') || text.includes('wrong password')) {
        return 'Email o contraseña incorrectos. Verifica e intenta de nuevo.';
    }

    if (text.includes('user not found')) {
        return 'No existe una cuenta con ese correo. Regístrate primero.';
    }

    if (text.includes('invalid email')) {
        return 'Ingresa un correo válido.';
    }

    return 'No se pudo iniciar sesión. Intenta nuevamente.';
}

function showMessage(text, isError = true) {
    const msg = document.getElementById("msg");
    if (!msg) return;

    msg.innerText = text;
    msg.style.color = isError ? '#dc2626' : '#0f5132';
}
