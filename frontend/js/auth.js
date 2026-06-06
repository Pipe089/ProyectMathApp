const SUPABASE_URL = "https://vvivungsdpyyowuwbffh.supabase.co";
const SUPABASE_KEY = "sb_publishable_gOvU4uVvsXjnlduOUn6MOQ_QPiIpxx6";

if (window.supabase) {
    window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
} else {
    console.error('Supabase library no cargó antes de inicializar el cliente.');
}

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