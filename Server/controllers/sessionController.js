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

module.exports = {
  createSession,
  getSessions,
  updateSessionStatus
};