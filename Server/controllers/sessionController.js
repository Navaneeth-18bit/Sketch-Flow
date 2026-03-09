const { supabase } = require("../utils/supabase");

const createSession = async (req, res, next) => {
  try {
    const { title } = req.body;
    if (!title) {
      return res.status(400).json({ error: "Session title is required" });
    }

    const { data: session, error } = await supabase
      .from('sessions')
      .insert({
        teacher_id: req.user.uid,
        title,
        status: 'active'
      })
      .select()
      .single();

    if (error) throw error;
    res.json(session);
  } catch (error) {
    next(error);
  }
};

const getSessions = async (req, res, next) => {
  try {
    const { data: sessions, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('teacher_id', req.user.uid)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(sessions);
  } catch (error) {
    next(error);
  }
};

const updateSessionStatus = async (req, res, next) => {
  try {
    const { sessionId, status } = req.body;
    if (!['active', 'completed', 'archived'].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const { data: session, error } = await supabase
      .from('sessions')
      .update({ status })
      .eq('session_id', sessionId)
      .eq('teacher_id', req.user.uid)
      .select()
      .single();

    if (error) throw error;
    res.json(session);
  } catch (error) {
    next(error);
  }
};

const getSessionStrokes = async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    const { data: sketch, error } = await supabase
      .from('rough_sketches')
      .select('stroke_data, created_at')
      .eq('session_id', sessionId)
      .eq('teacher_id', req.user.uid)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is no rows returned
      throw error;
    }

    res.json(sketch ? sketch : { stroke_data: null });
  } catch (error) {
    next(error);
  }
};

const saveSessionStrokes = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { strokeData } = req.body;

    if (!strokeData) {
      return res.status(400).json({ error: "Stroke data is required" });
    }

    // First try to find an existing sketch for this session
    const { data: existingSketch, error: fetchError } = await supabase
      .from('rough_sketches')
      .select('sketch_id')
      .eq('session_id', sessionId)
      .eq('teacher_id', req.user.uid)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    if (existingSketch) {
      // Update existing sketch
      const { data, error } = await supabase
        .from('rough_sketches')
        .update({ stroke_data: strokeData })
        .eq('sketch_id', existingSketch.sketch_id)
        .select()
        .single();

      if (error) throw error;
      return res.json(data);
    } else {
      // Insert new sketch
      const { data, error } = await supabase
        .from('rough_sketches')
        .insert({
          session_id: sessionId,
          teacher_id: req.user.uid,
          stroke_data: strokeData
        })
        .select()
        .single();

      if (error) throw error;
      return res.status(201).json(data);
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createSession,
  getSessions,
  updateSessionStatus,
  getSessionStrokes,
  saveSessionStrokes
};