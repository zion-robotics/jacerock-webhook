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

// ── MOBILE WALLETS ────────────────────────────────────────────────────────────

async function getMobileWallets() {
  const { data } = await supabase
    .from('mobile_wallets')
    .select('*')
    .eq('is_active', true);
  return data || [];
}

async function getMobileWalletById(id) {
  const { data } = await supabase
    .from('mobile_wallets')
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

async function saveMessage(whatsappNumber, direction, content, senderName = '', sentBy = 'BOT', mediaUrl = null) {
  const { error } = await supabase.from('messages').insert({
    whatsapp_number: whatsappNumber,
    direction,
    content,
    sender_name: senderName,
    sent_by: sentBy,
    media_url: mediaUrl,
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

// Upload downloaded WhatsApp media (image/document) to the "receipts" bucket
// and return a permanent public URL.
async function uploadMedia(buffer, mimeType, whatsappNumber) {
  const ext = mimeType.split('/')[1] || 'jpg';
  const fileName = `${whatsappNumber}_${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('receipts')
    .upload(fileName, buffer, { contentType: mimeType, upsert: false });

  if (uploadError) {
    console.error('❌ uploadMedia failed:', uploadError.message);
    return null;
  }

  const { data } = supabase.storage.from('receipts').getPublicUrl(fileName);
  return data?.publicUrl || null;
}

async function getLastTransactionByCustomer(whatsappNumber) {
  const { data } = await supabase
    .from('transactions')
    .select('*')
    .eq('whatsapp_number', whatsappNumber)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  return data || null;
}

// ── BUSINESS HOURS / HOLIDAYS / OUTAGE ────────────────────────────────────────

async function getBusinessHours() {
  const { data } = await supabase
    .from('business_hours')
    .select('*')
    .order('day_of_week', { ascending: true });
  return data || [];
}

async function updateBusinessHours(dayOfWeek, updates, updatedBy) {
  const { data } = await supabase
    .from('business_hours')
    .update({ ...updates, updated_by: updatedBy, updated_at: new Date().toISOString() })
    .eq('day_of_week', dayOfWeek)
    .select()
    .single();
  return data;
}

async function getHolidayByDate(dateStr) {
  // dateStr expected as 'YYYY-MM-DD'
  const { data } = await supabase
    .from('holidays')
    .select('*')
    .eq('holiday_date', dateStr)
    .maybeSingle();
  return data || null;
}

async function getAllHolidays() {
  const { data } = await supabase
    .from('holidays')
    .select('*')
    .order('holiday_date', { ascending: true });
  return data || [];
}

async function createHoliday(holidayDate, name, type, customMessage, createdBy) {
  const { data } = await supabase
    .from('holidays')
    .insert({
      holiday_date: holidayDate,
      name,
      type,
      custom_message: customMessage || null,
      created_by: createdBy,
    })
    .select()
    .single();
  return data;
}

async function deleteHoliday(id) {
  await supabase.from('holidays').delete().eq('id', id);
}

async function getBusinessStatus() {
  const { data } = await supabase
    .from('business_status')
    .select('*')
    .eq('id', 1)
    .single();
  return data;
}

async function updateAwayMessage(message, updatedBy) {
  const { data } = await supabase
    .from('business_status')
    .update({ away_message: message, updated_by: updatedBy, updated_at: new Date().toISOString() })
    .eq('id', 1)
    .select()
    .single();
  return data;
}

async function setOutage(isActive, message, expectedResolution, setBy) {
  const { data } = await supabase
    .from('business_status')
    .update({
      outage_active: isActive,
      outage_message: message || null,
      outage_expected_resolution: expectedResolution || null,
      outage_set_by: setBy,
      outage_set_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', 1)
    .select()
    .single();
  return data;
}

// Returns { open: boolean, reason: string, message: string|null }
// reason is one of: 'OUTAGE', 'HOLIDAY_CLOSED', 'HOLIDAY_ONLINE_ONLY', 'SCHEDULED_CLOSED', 'OPEN'
async function getAvailabilityStatus() {
  const status = await getBusinessStatus();

  // 1. Manual outage always takes priority
  if (status?.outage_active) {
    return {
      open: false,
      reason: 'OUTAGE',
      message: status.outage_message || status.away_message,
    };
  }

  // Current time in GMT
  const now = new Date();
  const gmtNow = new Date(now.toLocaleString('en-US', { timeZone: 'GMT' }));
  const dateStr = gmtNow.toISOString().split('T')[0]; // YYYY-MM-DD

  // 2. Holiday check
  const holiday = await getHolidayByDate(dateStr);
  if (holiday) {
    if (holiday.type === 'CLOSED') {
      return {
        open: false,
        reason: 'HOLIDAY_CLOSED',
        message: holiday.custom_message || status?.away_message,
      };
    }
    if (holiday.type === 'ONLINE_ONLY') {
      return {
        open: true,
        reason: 'HOLIDAY_ONLINE_ONLY',
        message: holiday.custom_message || null,
      };
    }
  }

  // 3. Scheduled weekly hours
  const dayOfWeek = gmtNow.getDay(); // 0 = Sunday ... 6 = Saturday
  const { data: hoursRow } = await supabase
    .from('business_hours')
    .select('*')
    .eq('day_of_week', dayOfWeek)
    .single();

  if (!hoursRow || !hoursRow.is_open) {
    return {
      open: false,
      reason: 'SCHEDULED_CLOSED',
      message: status?.away_message,
    };
  }

  const currentMinutes = gmtNow.getHours() * 60 + gmtNow.getMinutes();
  const [openH, openM] = hoursRow.open_time.split(':').map(Number);
  const [closeH, closeM] = hoursRow.close_time.split(':').map(Number);
  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;

  if (currentMinutes < openMinutes || currentMinutes >= closeMinutes) {
    return {
      open: false,
      reason: 'SCHEDULED_CLOSED',
      message: status?.away_message,
    };
  }

  return { open: true, reason: 'OPEN', message: null };
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
  getMobileWallets,
  getMobileWalletById,
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
  uploadMedia,
  getLastTransactionByCustomer,
  getBusinessHours,
  updateBusinessHours,
  getHolidayByDate,
  getAllHolidays,
  createHoliday,
  deleteHoliday,
  getBusinessStatus,
  updateAwayMessage,
  setOutage,
  getAvailabilityStatus,
};
