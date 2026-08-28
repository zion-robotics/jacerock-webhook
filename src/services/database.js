const supabase = require('../config/supabase');

// ── CUSTOMERS ─────────────────────────────────────────────────────────────────

async function getOrCreateCustomer(whatsappNumber, name) {
  let { data: customer } = await supabase
    .from('customers')
    .select('*')
    .eq('whatsapp_number', whatsappNumber)
    .single();

  if (!customer) {
    const { data: newCustomer } = await supabase
      .from('customers')
      .insert({ whatsapp_number: whatsappNumber, full_name: name })
      .select()
      .single();
    customer = newCustomer;
  }

  return customer;
}

async function updateCustomerKYC(whatsappNumber, kycName) {
  const { data } = await supabase
    .from('customers')
    .update({ kyc_name: kycName, kyc_status: 'COMPLETED' })
    .eq('whatsapp_number', whatsappNumber)
    .select()
    .single();
  return data;
}

async function isBlacklisted(whatsappNumber) {
  const { data } = await supabase
    .from('customers')
    .select('is_blacklisted')
    .eq('whatsapp_number', whatsappNumber)
    .single();
  return data?.is_blacklisted || false;
}

// ── SESSIONS ──────────────────────────────────────────────────────────────────

async function getSession(whatsappNumber) {
  const { data } = await supabase
    .from('conversation_sessions')
    .select('*')
    .eq('whatsapp_number', whatsappNumber)
    .single();
  return data;
}

async function setSession(whatsappNumber, step, sessionData = {}, transactionId = null) {
  const existing = await getSession(whatsappNumber);

  if (existing) {
    await supabase
      .from('conversation_sessions')
      .update({
        current_step: step,
        session_data: sessionData,
        transaction_id: transactionId,
        last_activity: new Date().toISOString(),
      })
      .eq('whatsapp_number', whatsappNumber);
  } else {
    await supabase
      .from('conversation_sessions')
      .insert({
        whatsapp_number: whatsappNumber,
        current_step: step,
        session_data: sessionData,
        transaction_id: transactionId,
        bot_paused: false,
      });
  }
}

async function clearSession(whatsappNumber) {
  await supabase
    .from('conversation_sessions')
    .update({
      current_step: 'WELCOME',
      session_data: {},
      transaction_id: null,
      bot_paused: false,
      paused_by: null,
      paused_at: null,
    })
    .eq('whatsapp_number', whatsappNumber);
}

// ── PAUSE / RESUME BOT ────────────────────────────────────────────────────────

async function pauseBot(whatsappNumber, staffName) {
  const existing = await getSession(whatsappNumber);
  if (existing) {
    await supabase
      .from('conversation_sessions')
      .update({
        bot_paused: true,
        paused_by: staffName,
        paused_at: new Date().toISOString(),
      })
      .eq('whatsapp_number', whatsappNumber);
  } else {
    await supabase
      .from('conversation_sessions')
      .insert({
        whatsapp_number: whatsappNumber,
        current_step: 'HUMAN_TAKEOVER',
        bot_paused: true,
        paused_by: staffName,
        paused_at: new Date().toISOString(),
      });
  }
}

async function resumeBot(whatsappNumber) {
  await supabase
    .from('conversation_sessions')
    .update({
      bot_paused: false,
      paused_by: null,
      paused_at: null,
    })
    .eq('whatsapp_number', whatsappNumber);
}

async function isBotPaused(whatsappNumber) {
  const { data } = await supabase
    .from('conversation_sessions')
    .select('bot_paused')
    .eq('whatsapp_number', whatsappNumber)
    .single();
  return data?.bot_paused || false;
}

// ── EXCHANGE RATES ────────────────────────────────────────────────────────────

async function getExchangeRates() {
  const { data } = await supabase
    .from('exchange_rates')
    .select('*')
    .eq('is_active', true);
  return data || [];
}

async function getRateByCurrencyPair(pair) {
  const { data } = await supabase
    .from('exchange_rates')
    .select('*')
    .eq('currency_pair', pair)
    .single();
  return data;
}

async function updateExchangeRate(currencyPair, newRate, updatedBy) {
  const { data } = await supabase
    .from('exchange_rates')
    .update({ rate: newRate, updated_by: updatedBy, updated_at: new Date().toISOString() })
    .eq('currency_pair', currencyPair)
    .select()
    .single();
  return data;
}

// ── BANK ACCOUNTS ─────────────────────────────────────────────────────────────

async function getBankAccounts() {
  const { data } = await supabase
    .from('bank_accounts')
    .select('*')
    .eq('is_active', true);
  return data || [];
}

async function getBankById(id) {
  const { data } = await supabase
    .from('bank_accounts')
    .select('*')
    .eq('id', id)
    .single();
  return data;
}

// ── TRANSACTIONS ──────────────────────────────────────────────────────────────

async function createTransaction(whatsappNumber, customerId, kycName, currencyPair, rate) {
  const { data: refData } = await supabase.rpc('generate_transaction_reference');
  const reference = refData;
  const [fromCurrency, toCurrency] = currencyPair.split('_');

  const { data } = await supabase
    .from('transactions')
    .insert({
      reference,
      customer_id: customerId,
      whatsapp_number: whatsappNumber,
      kyc_name: kycName,
      currency_pair: currencyPair,
      from_currency: fromCurrency,
      to_currency: toCurrency,
      exchange_rate: rate,
      status: 'RATE_SELECTED',
    })
    .select()
    .single();

  return data;
}

async function updateTransaction(id, updates) {
  const { data } = await supabase
    .from('transactions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  return data;
}

async function getTransactionById(id) {
  const { data } = await supabase
    .from('transactions')
    .select('*')
    .eq('id', id)
    .single();
  return data;
}

async function getPendingTransactions() {
  const { data } = await supabase
    .from('transactions')
    .select('*')
    .eq('status', 'AWAITING_STAFF_APPROVAL')
    .order('created_at', { ascending: false });
  return data || [];
}

async function getAllTransactions(limit = 50) {
  const { data } = await supabase
    .from('transactions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  return data || [];
}

// ── AUDIT LOGS ────────────────────────────────────────────────────────────────

async function logAudit(transactionId, customerId, action, oldStatus, newStatus, performedBy = 'BOT', notes = '') {
  await supabase.from('audit_logs').insert({
    transaction_id: transactionId,
    customer_id: customerId,
    action,
    old_status: oldStatus,
    new_status: newStatus,
    performed_by: performedBy,
    notes,
  });
}

async function getAuditLogs(transactionId) {
  const { data } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('transaction_id', transactionId)
    .order('created_at', { ascending: true });
  return data || [];
}

async function getAllAuditLogs(limit = 100) {
  const { data } = await supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  return data || [];
}

// ── MESSAGES ──────────────────────────────────────────────────────────────────

async function saveMessage(whatsappNumber, direction, content, senderName = '', sentBy = 'BOT') {
  const { error } = await supabase.from('messages').insert({
    whatsapp_number: whatsappNumber,
    direction,
    content,
    sender_name: senderName,
    sent_by: sentBy,
  });
  if (error) {
    console.error('❌ saveMessage failed:', error.message);
  } else {
    console.log(`✅ saveMessage success: ${direction} for ${whatsappNumber}`);
  }
}

async function getMessages(whatsappNumber, limit = 50) {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('whatsapp_number', whatsappNumber)
    .order('created_at', { ascending: true })
    .limit(limit);
  if (error) console.error('❌ getMessages failed:', error.message);
  return data || [];
}

module.exports = {
  getOrCreateCustomer,
  updateCustomerKYC,
  isBlacklisted,
  getSession,
  setSession,
  clearSession,
  pauseBot,
  resumeBot,
  isBotPaused,
  getExchangeRates,
  getRateByCurrencyPair,
  updateExchangeRate,
  getBankAccounts,
  getBankById,
  createTransaction,
  updateTransaction,
  getTransactionById,
  getPendingTransactions,
  getAllTransactions,
  logAudit,
  getAuditLogs,
  getAllAuditLogs,
  saveMessage,
  getMessages,
};