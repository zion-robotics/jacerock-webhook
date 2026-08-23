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
      });
  }
}

async function clearSession(whatsappNumber) {
  await supabase
    .from('conversation_sessions')
    .update({ current_step: 'WELCOME', session_data: {}, transaction_id: null })
    .eq('whatsapp_number', whatsappNumber);
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

module.exports = {
  getOrCreateCustomer,
  updateCustomerKYC,
  isBlacklisted,
  getSession,
  setSession,
  clearSession,
  getExchangeRates,
  getRateByCurrencyPair,
  getBankAccounts,
  getBankById,
  createTransaction,
  updateTransaction,
  getTransactionById,
  logAudit,
};
