window.protegerRuta = async function () {
    const supabase = window.supabaseClient;

    if (!supabase) return;

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        window.location.href = "login.html";
    }
};

window.evitarAuth = async function () {
    const supabase = window.supabaseClient;

    if (!supabase) return;

    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
        window.location.href = "dashboard.html";
    }
};

window.logout = async function () {
    const supabase = window.supabaseClient;

    if (!supabase) return;

    await supabase.auth.signOut();
    window.location.href = "login.html";
};