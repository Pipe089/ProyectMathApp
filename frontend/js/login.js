document.addEventListener("DOMContentLoaded", () => {
    evitarAuth(); // evita entrar si ya está logueado

    const btn = document.getElementById("btnLogin");
    if (btn) {
        btn.addEventListener("click", login);
    }
});

async function login() {
    const supabase = window.supabaseClient;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const msg = document.getElementById("msg");

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        msg.innerText = error.message;
    } else {
        msg.innerText = "Bienvenido";
        setTimeout(() => {
            window.location.href = "dashboard.html";
        }, 1000);
    }
}