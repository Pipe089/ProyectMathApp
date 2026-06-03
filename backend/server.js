require('dotenv').config();
const express = require('express');
const path = require('path');
const ws = require('ws');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const port = process.env.PORT || 3000;
const frontendPath = path.join(__dirname, '../frontend');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const isServiceRoleKey = SUPABASE_SERVICE_ROLE_KEY && !SUPABASE_SERVICE_ROLE_KEY.startsWith('sb_') && !SUPABASE_SERVICE_ROLE_KEY.startsWith('anon') && !SUPABASE_SERVICE_ROLE_KEY.includes('publishable');

if (SUPABASE_SERVICE_ROLE_KEY && !isServiceRoleKey) {
  console.warn('Advertencia: SUPABASE_SERVICE_ROLE_KEY parece ser una llave pública o inválida. Usa la llave de servicio real de Supabase.');
}

const supabaseAdmin = SUPABASE_URL && isServiceRoleKey
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      realtime: { transport: ws }
    })
  : null;

app.use(express.json());
app.use(express.static(frontendPath));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend funcionando' });
});

app.get('/api/progreso/:userId', async (req, res) => {
  if (!supabaseAdmin) {
    return res.status(500).json({ error: 'Supabase admin no está configurado' });
  }

  const { userId } = req.params;
  const { data, error } = await supabaseAdmin
    .from('progreso')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  if (!data) {
    return res.json({ puntos: 0, nivel: 'Iniciando' });
  }

  return res.json(data);
});

app.post('/api/progreso', async (req, res) => {
  if (!supabaseAdmin) {
    return res.status(500).json({ error: 'Supabase admin no está configurado' });
  }

  const { user_id, puntos, nivel } = req.body;
  if (!user_id || typeof puntos !== 'number') {
    return res.status(400).json({ error: 'Falta user_id o puntos' });
  }

  const { data: existing, error: selectError } = await supabaseAdmin
    .from('progreso')
    .select('*')
    .eq('user_id', user_id)
    .maybeSingle();

  if (selectError) {
    return res.status(500).json({ error: selectError.message });
  }

  if (existing) {
    const totalPoints = (existing.puntos || 0) + puntos;
    const { data, error: updateError } = await supabaseAdmin
      .from('progreso')
      .update({ puntos: totalPoints, nivel })
      .eq('id', existing.id)
      .select('*')
      .maybeSingle();

    if (updateError) {
      return res.status(500).json({ error: updateError.message });
    }

    return res.json(data);
  }

  const { data: inserted, error: insertError } = await supabaseAdmin
    .from('progreso')
    .insert([{ user_id, nivel, puntos }])
    .select('*')
    .maybeSingle();

  if (insertError) {
    return res.status(500).json({ error: insertError.message });
  }

  return res.json(inserted);
});

app.post('/api/resultados', async (req, res) => {
  if (!supabaseAdmin) {
    return res.status(500).json({ error: 'Supabase admin no está configurado' });
  }

  const resultados = req.body.resultados;
  if (!Array.isArray(resultados) || resultados.length === 0) {
    return res.status(400).json({ error: 'Falta el cuerpo de resultados' });
  }

  const { data, error } = await supabaseAdmin
    .from('resultados')
    .insert(resultados);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.json({ inserted: data.length });
});

app.get('/api/teacher/students', async (req, res) => {
  if (!supabaseAdmin) {
    return res.status(500).json({ error: 'Supabase admin no está configurado' });
  }

  const { grado, institucion } = req.query;
  console.log('/api/teacher/students request', { grado, institucion });

  if (!grado || !institucion) {
    return res.status(400).json({ error: 'Falta grado o institución' });
  }

  const normalizedInstitution = String(institucion).trim();
  const { data: students, error: studentsError } = await supabaseAdmin
    .from('profiles')
    .select('id, nombre, apellido, grado, rol, institucion')
    .eq('rol', 'estudiante')
    .eq('grado', grado)
    .ilike('institucion', `%${normalizedInstitution}%`);

  if (studentsError) {
    console.error('/api/teacher/students supabase error', studentsError);
    return res.status(500).json({ error: studentsError.message });
  }

  console.log('/api/teacher/students found', students?.length || 0);
  if (!students || students.length === 0) {
    return res.json([]);
  }

  const ids = students.map(student => student.id);
  const { data: progressList, error: progressError } = await supabaseAdmin
    .from('progreso')
    .select('user_id, puntos, nivel')
    .in('user_id', ids);

  if (progressError) {
    console.error('/api/teacher/students progress error', progressError);
    return res.status(500).json({ error: progressError.message });
  }

  const progressMap = (progressList || []).reduce((acc, item) => {
    acc[item.user_id] = item;
    return acc;
  }, {});

  const result = students.map(student => ({
    ...student,
    puntos: progressMap[student.id]?.puntos || 0,
    nivel: progressMap[student.id]?.nivel || 'Iniciando'
  }));

  console.log('/api/teacher/students returning', result.length);
  return res.json(result);
});

app.get('/api/teacher/student/:userId/report', async (req, res) => {
  if (!supabaseAdmin) {
    return res.status(500).json({ error: 'Supabase admin no está configurado' });
  }

  const { userId } = req.params;
  if (!userId) {
    return res.status(400).json({ error: 'Falta userId' });
  }

  const [{ data: studentProfile, error: profileError }, { data: progressData, error: progressError }, { data: resultados, error: resultadosError }] = await Promise.all([
    supabaseAdmin.from('profiles').select('nombre, apellido, grado').eq('id', userId).maybeSingle(),
    supabaseAdmin.from('progreso').select('puntos, nivel').eq('user_id', userId).maybeSingle(),
    supabaseAdmin.from('resultados').select('operacion, correcta, fecha').eq('user_id', userId).order('fecha', { ascending: false })
  ]);

  if (profileError || progressError || resultadosError) {
    return res.status(500).json({ error: (profileError || progressError || resultadosError).message });
  }

  return res.json({ studentProfile, progressData, resultados });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

app.listen(port, () => {
  console.log(`Backend escuchando en http://localhost:${port}`);
});
