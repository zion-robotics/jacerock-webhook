const { createClient } = require('@supabase/supabase-js');

// Admin client — uses the service role key, bypasses RLS.
// ONLY use this for trusted backend/admin operations, never expose to frontend.
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = supabaseAdmin;
