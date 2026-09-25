const wa = require('../services/whatsapp');
const db = require('../services/database');
const { uploadReceiptToStorage } = require('../services/storage');

// ── Wrap outbound sends so every delivered message gets logged automatically ──
const _sendText = wa.sendText;
wa.sendText = async (to, text, ...rest) => {
  const result = await _sendText(to, text, ...rest);
  if (result) await db.saveMessage(to, 'OUTBOUND', text, '', 'BOT');
  return result;
};

const _sendButtons = wa.sendButtons;
wa.sendButtons = async (to, text, buttons, ...rest) => {
  const result = await _sendButtons(to, text, buttons, ...rest);
  if (result) await db.saveMessage(to, 'OUTBOUND', text, '', 'BOT');
  return result;
};

const _sendList = wa.sendList;
wa.sendList = async (to, text, buttonLabel, sections, ...rest) => {
  const result = await _sendList(to, text, buttonLabel, sections, ...rest);
  if (result) await db.saveMessage(to, 'OUTBOUND', text, '', 'BOT');
  return result;
};

const _sendTemplate = wa.sendTemplate;
wa.sendTemplate = async (to, templateName, variables, ...rest) => {
  const result = await _sendTemplate(to, templateName, variables, ...rest);
  if (result) await db.saveMessage(to, 'OUTBOUND', `[Template: ${templateName}]`, '', 'BOT');
  return result;
};

const RESTART_KEYWORDS = ['cancel', 'restart', 'back', 'menu', 'start', 'home', 'stop'];
const HOURS_KEYWORDS = ['hours', 'business hours', 'opening hours', 'open time', 'what time'];
const CANCEL_HINT = '\n\n_Type *cancel* at any time to return to the main menu._';

// WhatsApp list limits: row title 24 characters, row description 72 characters, 10 rows total
const WA_ROW_TITLE_MAX = 24;
const WA_ROW_DESC_MAX = 72;
const WA_MAX_ROWS = 10;

function clip(value, max) {
  const str = String(value ?? '').trim();
  return str.length > max ? str.slice(0, max - 1) + '…' : str;
}

const STATUS_LABELS = {
  SETTLEMENT_COMPLETED: 'completed successfully ✅',
  CLOSED: 'completed successfully ✅',
  REJECTED: 'rejected ❌',
  CANCELLED: 'cancelled',
  AWAITING_STAFF_APPROVAL: 'still being processed ⏳',
  UNDER_REVIEW: 'on hold, under review ⏳',
};

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function to12Hour(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

async function formatBusinessHoursText() {
  const hours = await db.getBusinessHours();
  const byDay = {};
  hours.forEach(h => { byDay[h.day_of_week] = h; });

  const lines = DAY_NAMES.map((name, i) => {
    const row = byDay[i];
    if (!row || !row.is_open) return `${name}: Closed`;
    return `${name}: ${to12Hour(row.open_time)} – ${to12Hour(row.close_time)} GMT`;
  });

  return `🕐 *Our Business Hours (GMT)*\n\n${lines.join('\n')}`;
}

async function buildRateDisplay() {
  const rates = await db.getExchangeRates();
  const map = {};
  rates.forEach(r => { map[r.currency_pair] = r.rate; });
  return `JACEROCK / AFRIKBERRY\n📊 DAILY EXCHANGE RATE\n\n` +
    `🇬🇲 GMD ➡️ NGN\n➡️ ${map['GMD_NGN'] || 'N/A'}\n\n` +
    `🇳🇬 NGN ➡️ GMD\n➡️ ${map['NGN_GMD'] || 'N/A'}\n\n` +
    `🇺🇸 USD ➡️ GMD\n➡️ ${map['USD_GMD'] || 'N/A'}\n\n` +
    `🇪🇺 EURO ➡️ GMD\n➡️ ${map['EUR_GMD'] || 'N/A'}\n\n` +
    `🇬🇧 GBP ➡️ GMD\n➡️ ${map['GBP_GMD'] || 'N/A'}\n\n` +
    `🇨🇦 CAD ➡️ GMD\n➡️ ${map['CAD_GMD'] || 'N/A'}\n\n` +
    `🇨🇫 CEFA ➡️ GMD\n➡️ ${map['CFA_GMD'] || 'N/A'}\n\n` +
    `💲 USDT ➡️ GMD\n➡️ ${map['USDT_GMD'] || 'N/A'}\n\n` +
    `━━━━━━━━━━━━━━━━━━\n⚠️ IMPORTANT NOTICE\n\n` +
    `Exchange rates are subject to market volatility and may change without prior notice.\n` +
    `Rates are reviewed every 60 minutes.`;
}

async function showMainMenu(to) {
  await wa.sendButtons(
    to,
    `Hello, welcome to Jacerock Capital Limited / AfrikBerry Virtual Assistance Platform.\n\nHow can we assist you today?`,
    [
      { id: 'EXCHANGE_RATES', title: '📊 Exchange Rates' },
      { id: 'CUSTOMER_CARE', title: '👩🏾‍💼 Customer Care' },
    ]
  );
}

async function showMainMenuReturning(to, name) {
  const lastTx = await db.getLastTransactionByCustomer(to);

  if (lastTx) {
    const statusLabel = STATUS_LABELS[lastTx.status] || lastTx.status.replace(/_/g, ' ').toLowerCase();
    const pairLabel = lastTx.currency_pair?.replace('_', ' → ') || '';

    await wa.sendButtons(
      to,
      `Welcome back, ${name}! 👋\n\n` +
      `Your last transaction *${lastTx.reference}* (${pairLabel}) was *${statusLabel}*.\n\n` +
      `Would you like to start a new transaction today?`,
      [
        { id: 'EXCHANGE_RATES', title: '📊 Exchange Rates' },
        { id: 'CUSTOMER_CARE', title: '👩🏾‍💼 Customer Care' },
      ]
    );
  } else {
    await wa.sendButtons(
      to,
      `Welcome back, ${name}! 👋\n\nGreat to see you again at Jacerock Capital Limited / AfrikBerry.\n\nHow can we assist you today?`,
      [
        { id: 'EXCHANGE_RATES', title: '📊 Exchange Rates' },
        { id: 'CUSTOMER_CARE', title: '👩🏾‍💼 Customer Care' },
      ]
    );
  }
}

async function showCurrencyPairList(to) {
  await wa.sendList(to,
    `Please select the currency pair you wish to transact:${CANCEL_HINT}`,
    'Select Currency Pair',
    [{ title: 'Available Currency Pairs', rows: [
      { id: 'GMD_NGN', title: '🇬🇲 GMD → NGN' },
      { id: 'NGN_GMD', title: '🇳🇬 NGN → GMD' },
      { id: 'USD_GMD', title: '🇺🇸 USD → GMD' },
      { id: 'EUR_GMD', title: '🇪🇺 EUR → GMD' },
      { id: 'GBP_GMD', title: '🇬🇧 GBP → GMD' },
      { id: 'CAD_GMD', title: '🇨🇦 CAD → GMD' },
      { id: 'CFA_GMD', title: '🇨🇫 CEFA → GMD' },
      { id: 'USDT_GMD', title: '💲 USDT → GMD' },
    ]}]
  );
}

async function handleMessage(from, message, senderName) {
  const blacklisted = await db.isBlacklisted(from);
  if (blacklisted) {
    await wa.sendText(from, 'We are unable to process your request at this time. Please contact support.');
    return;
  }

  const session = await db.getSession(from);
  const step = session?.current_step || 'WELCOME';
  const sessionData = session?.session_data || {};

  const msgType = message.type;
  const textBody = msgType === 'text' ? message.text?.body?.trim() : null;
  const buttonReply = msgType === 'interactive' && message.interactive?.type === 'button_reply'
    ? message.interactive.button_reply : null;
  const listReply = msgType === 'interactive' && message.interactive?.type === 'list_reply'
    ? message.interactive.list_reply : null;
  const replyId = buttonReply?.id || listReply?.id || null;

  console.log(`📍 Step: ${step} | From: ${from} | Type: ${msgType} | Reply: ${replyId || textBody}`);

  // ── BOT PAUSED CHECK (Human Takeover) ────────────────────────────────────
  const paused = await db.isBotPaused(from);
  if (paused) {
    console.log(`⏸️  Bot paused for ${from}: message handled by staff`);
    return; // Staff handles this conversation from dashboard
  }

  // ── "What are your hours?" self-serve — answered even while closed ───────
  if (textBody && HOURS_KEYWORDS.some(k => textBody.toLowerCase().includes(k))) {
    const hoursText = await formatBusinessHoursText();
    await wa.sendText(from, hoursText);
    return;
  }

  // ── BUSINESS AVAILABILITY GATE ─────────────────────────────────────────
  // Rates are the bedrock of the business — no rate/transaction activity is
  // permitted outside business hours, including finishing an in-progress
  // transaction. This intentionally overrides everything below it.
  const availability = await db.getAvailabilityStatus();
  if (!availability.open) {
    // Reset the session so any stale, unconfirmed rate/amount is discarded.
    // When the customer returns during business hours they start fresh.
    await db.clearSession(from);
    await wa.sendText(from, availability.message || 'We are currently closed for business. Please check back during our business hours.');
    return;
  }

  // GLOBAL RESTART
  if (textBody && RESTART_KEYWORDS.includes(textBody.toLowerCase())) {
    await db.clearSession(from);
    const existing = await db.getOrCreateCustomer(from, senderName);
    if (existing.kyc_status === 'COMPLETED' && existing.kyc_name) {
      await db.setSession(from, 'MAIN_MENU', { customerId: existing.id, kycName: existing.kyc_name, isReturning: true });
      await showMainMenuReturning(from, existing.kyc_name);
    } else {
      await db.setSession(from, 'MAIN_MENU', { customerId: existing.id });
      await showMainMenu(from);
    }
    return;
  }

  // WELCOME
  if (step === 'WELCOME') {
    const customer = await db.getOrCreateCustomer(from, senderName);

    if (customer.kyc_status === 'COMPLETED' && customer.kyc_name) {
      await db.setSession(from, 'MAIN_MENU', { customerId: customer.id, kycName: customer.kyc_name, isReturning: true });
      await showMainMenuReturning(from, customer.kyc_name);
    } else {
      await db.setSession(from, 'MAIN_MENU', { customerId: customer.id });
      await showMainMenu(from);
    }
    return;
  }

  // MAIN MENU
  if (step === 'MAIN_MENU') {
    if (replyId === 'EXCHANGE_RATES') {
      if (sessionData.isReturning && sessionData.kycName) {
        const rateText = await buildRateDisplay();
        await wa.sendText(from, rateText);
        await showCurrencyPairList(from);
        await db.setSession(from, 'CURRENCY_SELECT', { ...sessionData, kycName: sessionData.kycName });
      } else {
        await db.setSession(from, 'KYC_ASK', sessionData);
        await wa.sendButtons(from,
          `Hi,\n\nBefore we proceed, as part of our Know Your Customer (KYC) process, could you please provide your full name exactly as shown on your valid ID?\n\nDo you wish to proceed?`,
          [
            { id: 'KYC_YES', title: '✅ Yes, Proceed' },
            { id: 'KYC_NO', title: '❌ No' },
          ]
        );
      }
    } else if (replyId === 'CUSTOMER_CARE') {
      await db.setSession(from, 'CUSTOMER_CARE', sessionData);
      await wa.sendList(from,
        '👩🏾‍💼 CUSTOMER CARE SUPPORT\n\nPlease select the type of assistance you require:',
        'Select Option',
        [{ title: 'Support Options', rows: [
          { id: 'CS_TRANSACTION', title: 'Transaction Enquiry' },
          { id: 'CS_STATUS', title: 'Transaction Status' },
          { id: 'CS_PAYMENT', title: 'Payment Issue' },
          { id: 'CS_SETTLEMENT', title: 'Settlement Issue' },
          { id: 'CS_KYC', title: 'KYC Assistance' },
          { id: 'CS_AGENT', title: 'Speak with Agent' },
        ]}]
      );
    } else {
      if (sessionData.isReturning && sessionData.kycName) {
        await showMainMenuReturning(from, sessionData.kycName);
      } else {
        await showMainMenu(from);
      }
    }
    return;
  }

  // KYC ASK
  if (step === 'KYC_ASK') {
    if (replyId === 'KYC_YES') {
      await db.setSession(from, 'KYC_INPUT', sessionData);
      await wa.sendText(from, `Please type your full name exactly as it appears on your valid ID:${CANCEL_HINT}`);
    } else if (replyId === 'KYC_NO') {
      await db.clearSession(from);
      await wa.sendText(from, `No problem. Your request has been cancelled.\n\n_Type *menu* to start again._`);
    } else {
      await wa.sendButtons(from, `Please select an option to continue:`,
        [{ id: 'KYC_YES', title: '✅ Yes, Proceed' }, { id: 'KYC_NO', title: '❌ No' }]
      );
    }
    return;
  }

  // KYC INPUT
  if (step === 'KYC_INPUT') {
    if (!textBody || textBody.length < 3) {
      await wa.sendText(from, `Please enter your full name as shown on your ID (minimum 3 characters):${CANCEL_HINT}`);
      return;
    }
    await db.updateCustomerKYC(from, textBody);
    const rateText = await buildRateDisplay();
    await wa.sendText(from, rateText);
    await showCurrencyPairList(from);
    await db.setSession(from, 'CURRENCY_SELECT', { ...sessionData, kycName: textBody });
    return;
  }

  // CURRENCY SELECT
  if (step === 'CURRENCY_SELECT') {
    const validPairs = ['GMD_NGN','NGN_GMD','USD_GMD','EUR_GMD','GBP_GMD','CAD_GMD','CFA_GMD','USDT_GMD'];
    if (!replyId || !validPairs.includes(replyId)) {
      await wa.sendText(from, `Please select a currency pair from the list above.${CANCEL_HINT}`);
      return;
    }
    const rateData = await db.getRateByCurrencyPair(replyId);
    if (!rateData) {
      await wa.sendText(from, `Sorry, that currency pair is currently unavailable. Please try another or type *cancel* to return to the menu.`);
      return;
    }
    const [fromCurrency, toCurrency] = replyId.split('_');
    const pairLabel = replyId.replace('_', ' → ');
    await db.setSession(from, 'AMOUNT_DIRECTION', {
      ...sessionData,
      currencyPair: replyId,
      rate: rateData.rate,
      pairLabel,
      fromCurrency,
      toCurrency,
    });
    await wa.sendButtons(from,
      `You have selected:\n\n*${pairLabel}*\nCurrent rate: *${rateData.rate}* ${toCurrency} per ${fromCurrency}\n\nHow would you like to enter the amount?`,
      [
        { id: 'DIR_FROM', title: `I'm sending ${fromCurrency}` },
        { id: 'DIR_TO', title: `They receive ${toCurrency}` },
      ]
    );
    return;
  }

  // AMOUNT DIRECTION
  if (step === 'AMOUNT_DIRECTION') {
    const { fromCurrency, toCurrency } = sessionData;
    if (replyId === 'DIR_FROM') {
      await db.setSession(from, 'AMOUNT_INPUT', { ...sessionData, amountDirection: 'FROM' });
      await wa.sendText(from, `Please enter the amount in ${fromCurrency} you would like to send:${CANCEL_HINT}`);
    } else if (replyId === 'DIR_TO') {
      await db.setSession(from, 'AMOUNT_INPUT', { ...sessionData, amountDirection: 'TO' });
      await wa.sendText(from, `Please enter the amount in ${toCurrency} you would like the recipient to receive:${CANCEL_HINT}`);
    } else {
      await wa.sendButtons(from, `Please select an option:`,
        [
          { id: 'DIR_FROM', title: `I have ${fromCurrency} to send` },
          { id: 'DIR_TO', title: `I want them to get ${toCurrency}` },
        ]
      );
    }
    return;
  }

  // AMOUNT INPUT
  if (step === 'AMOUNT_INPUT') {
    const enteredAmount = parseFloat(textBody);
    if (!enteredAmount || isNaN(enteredAmount) || enteredAmount <= 0) {
      await wa.sendText(from, `Please enter a valid amount (numbers only, e.g. 500):${CANCEL_HINT}`);
      return;
    }
    const { rate, pairLabel, fromCurrency, toCurrency, amountDirection } = sessionData;
    const rateNum = parseFloat(rate);

    let amount, settlementAmount, calculationLine;
    if (amountDirection === 'TO') {
      settlementAmount = enteredAmount.toFixed(2);
      amount = (enteredAmount / rateNum).toFixed(2);
      calculationLine = `${Number(settlementAmount).toLocaleString()} ${toCurrency} ÷ ${rateNum} = ${Number(amount).toLocaleString()} ${fromCurrency}`;
    } else {
      amount = enteredAmount;
      settlementAmount = (enteredAmount * rateNum).toFixed(2);
      calculationLine = `${Number(amount).toLocaleString()} ${fromCurrency} × ${rateNum} = ${Number(settlementAmount).toLocaleString()} ${toCurrency}`;
    }

    await db.setSession(from, 'PAYMENT_METHOD', { ...sessionData, amount, settlementAmount });
    await wa.sendButtons(from,
      `Thank you.\n\n*Transaction Summary*\n\nExchange: ${pairLabel}\nYou send: *${amount} ${fromCurrency}*\nRate: ${rate}\n\n*Calculation:*\n${calculationLine}\n\nRecipient receives: *${Number(settlementAmount).toLocaleString()} ${toCurrency}*\n\n⚠️ Rates are subject to change until payment is confirmed.\n\nPlease select your preferred payment method:`,
      [
        { id: 'BANK_TRANSFER', title: '🏦 Bank Transfer' },
        { id: 'CASH_DEPOSIT', title: '💵 Cash Deposit' },
        { id: 'MOBILE_WALLET', title: '📱 Mobile Wallet' },
      ]
    );
    return;
  }

  // PAYMENT METHOD
  if (step === 'PAYMENT_METHOD') {
    if (!replyId || !['BANK_TRANSFER','CASH_DEPOSIT','MOBILE_WALLET'].includes(replyId)) {
      await wa.sendText(from, `Please select a payment method from the options above.${CANCEL_HINT}`);
      return;
    }

    const { bankListFailures = 0, ...baseData } = sessionData;

    if (replyId === 'CASH_DEPOSIT') {
      await db.setSession(from, 'CASH_DEPOSIT_METHOD', { ...baseData, paymentMethod: 'CASH_DEPOSIT' });

      // On an ONLINE_ONLY holiday the physical office is closed — only offer bank deposit.
      if (availability.reason === 'HOLIDAY_ONLINE_ONLY') {
        await wa.sendButtons(from,
          `💵 CASH DEPOSIT\n\nOur office is closed today, but online deposits are still available:`,
          [{ id: 'CASH_BANK', title: '🏦 Pay at Bank' }]
        );
      } else {
        await wa.sendButtons(from,
          `💵 CASH DEPOSIT\n\nPlease select your preferred cash deposit option:`,
          [
            { id: 'CASH_OFFICE', title: '🏢 Visit Our Office' },
            { id: 'CASH_BANK', title: '🏦 Pay at Bank' },
          ]
        );
      }
      return;
    }

    if (replyId === 'MOBILE_WALLET') {
      await db.setSession(from, 'MOBILE_WALLET', { ...baseData, paymentMethod: 'MOBILE_WALLET' });
      await wa.sendText(from, `📱 MOBILE WALLET TRANSFER\n\nPlease contact our team via Customer Care for mobile wallet payment details.\n\nOnce your transfer is complete, please upload your receipt here.${CANCEL_HINT}`);
      return;
    }

    // BANK TRANSFER
    const banks = await db.getBankAccounts();
    if (!banks || banks.length === 0) {
      await wa.sendText(from, `Bank transfer accounts are not available right now. Please choose another payment method or contact Customer Care.${CANCEL_HINT}`);
      return;
    }

    const bankRows = banks.slice(0, WA_MAX_ROWS).map(b => ({
      id: b.id,
      title: clip(b.bank_name, WA_ROW_TITLE_MAX),
      description: clip(`${b.bank_name}${b.country ? ' | ' + b.country : ''}`, WA_ROW_DESC_MAX),
    }));

    const listResult = await wa.sendList(from,
      `Please select the bank account you would like to make your payment to:${CANCEL_HINT}`,
      'Select Bank',
      [{ title: 'Available Banks', rows: bankRows }]
    );

    if (listResult) {
      await db.setSession(from, 'BANK_SELECT', { ...baseData, paymentMethod: 'BANK_TRANSFER' });
      return;
    }

    const failures = bankListFailures + 1;

    if (failures === 1) {
      await db.setSession(from, 'PAYMENT_METHOD', { ...baseData, bankListFailures: failures });
      await wa.sendText(from, `Sorry, we could not load the bank list just now. Please try again by tapping Bank Transfer below.${CANCEL_HINT}`);
      await wa.sendButtons(from, `Please select your preferred payment method:`, [
        { id: 'BANK_TRANSFER', title: '🏦 Bank Transfer' },
        { id: 'CASH_DEPOSIT', title: '💵 Cash Deposit' },
        { id: 'MOBILE_WALLET', title: '📱 Mobile Wallet' },
      ]);
      return;
    }

    const numberedList = banks
      .map((b, i) => `${i + 1}. ${b.bank_name}${b.country ? ` (${b.country})` : ''}`)
      .join('\n');
    const textResult = await wa.sendText(from,
      `We are still unable to load the bank menu. Please reply with the number of the bank you want to pay to:\n\n${numberedList}${CANCEL_HINT}`
    );

    if (textResult) {
      await db.setSession(from, 'BANK_SELECT', {
        ...baseData,
        paymentMethod: 'BANK_TRANSFER',
        bankTextList: banks.map(b => b.id),
      });
    } else {
      await db.setSession(from, 'PAYMENT_METHOD', { ...baseData, bankListFailures: failures });
    }
    return;
  }

  // CASH DEPOSIT METHOD (office vs bank)
  if (step === 'CASH_DEPOSIT_METHOD') {
    if (replyId === 'CASH_OFFICE') {
      await db.setSession(from, 'CASH_DEPOSIT', { ...sessionData });
      await wa.sendText(from,
        `🏢 OFFICE VISIT\n\nPlease visit us at our office:\n\n*Jacerock Capital Limited*\nMosque Complex, behind Marimoo Building\nAfricell Head Office, Kairaba Avenue\nThe Gambia\n\nOffice Hours: Monday to Friday, 9am to 5pm\n\nPlease bring the exact amount and your valid ID.\n\nOnce your deposit has been made, please upload your receipt here.${CANCEL_HINT}`
      );
    } else if (replyId === 'CASH_BANK') {
      await db.setSession(from, 'CASH_DEPOSIT', { ...sessionData });
      const banks = await db.getBankAccounts();
      const bankRows = banks.map(b => ({ id: b.id, title: b.bank_name.substring(0, 20), description: b.country }));
      await wa.sendList(from,
        `🏦 BANK CASH DEPOSIT\n\nPlease select the bank where you would like to make your cash deposit:${CANCEL_HINT}`,
        'Select Bank',
        [{ title: 'Available Banks', rows: bankRows }]
      );
    } else {
      await wa.sendButtons(from,
        `Please select your preferred cash deposit option:`,
        [
          { id: 'CASH_OFFICE', title: '🏢 Visit Our Office' },
          { id: 'CASH_BANK', title: '🏦 Pay at Bank' },
        ]
      );
    }
    return;
  }

  // CASH DEPOSIT / MOBILE WALLET RECEIPT
  if (step === 'CASH_DEPOSIT' || step === 'MOBILE_WALLET') {
    if (msgType === 'image' || msgType === 'document') {
      const { kycName, currencyPair, rate, amount, settlementAmount, paymentMethod } = sessionData;
      const customer = await db.getOrCreateCustomer(from, senderName);
      const transaction = await db.createTransaction(from, customer.id, kycName, currencyPair, parseFloat(rate));

      const mediaId = message.image?.id || message.document?.id;
      let receiptUrl = null;
      if (mediaId) {
        receiptUrl = await uploadReceiptToStorage(mediaId, process.env.WHATSAPP_TOKEN, transaction.reference);
      }

      await db.updateTransaction(transaction.id, {
        amount, settlement_amount_ngn: settlementAmount, payment_method: paymentMethod,
        status: 'RECEIPT_UPLOADED', receipt_uploaded_at: new Date().toISOString(),
        receipt_url: receiptUrl,
      });
      await db.setSession(from, 'AWAITING_SETTLEMENT', { ...sessionData, transactionId: transaction.id }, transaction.id);
      await wa.sendTemplate(from, 'payment_received', [kycName, transaction.reference]);
      await wa.sendText(from, `Please provide the Nigerian bank account details where you would like to receive your settlement.\n\nKindly reply with:\n\n*Account Name:*\n*Bank Name:*\n*Account Number:*${CANCEL_HINT}`);
    } else {
      await wa.sendText(from, `Please upload your payment receipt as an image or document to proceed.${CANCEL_HINT}`);
    }
    return;
  }

  // BANK SELECT
  if (step === 'BANK_SELECT') {
    const { bankTextList, ...baseData } = sessionData;
    let selectedId = replyId;

    if (!selectedId && Array.isArray(bankTextList) && textBody) {
      const chosen = /^\d+$/.test(textBody) ? parseInt(textBody, 10) : 0;
      if (chosen < 1 || chosen > bankTextList.length) {
        await wa.sendText(from, `Please reply with a number from the list above.${CANCEL_HINT}`);
        return;
      }
      selectedId = bankTextList[chosen - 1];
    }

    if (!selectedId) {
      await wa.sendText(from, `Please select a bank from the list above.${CANCEL_HINT}`);
      return;
    }
    const bank = await db.getBankById(selectedId);
    if (!bank) {
      await wa.sendText(from, `Invalid selection. Please try again.${CANCEL_HINT}`);
      return;
    }
    await db.setSession(from, 'KYC_DISCLAIMER', { ...baseData, selectedBankId: selectedId, selectedBank: bank });
    await wa.sendButtons(from,
      `⚠️ IMPORTANT NOTICE\n\nDear Customer,\n\nJacerock/AfrikBerry ONLY ACCEPTS BANK TRANSFERS FROM AN ACCOUNT WITH THE SAME ACCOUNT NAME PROVIDED DURING KYC VERIFICATION.\n\nThird-party transfers may be rejected or placed on hold pending verification.\n\nDo you wish to proceed?`,
      [
        { id: 'DISCLAIMER_YES', title: '✅ Yes, Proceed' },
        { id: 'DISCLAIMER_NO', title: '❌ Cancel' },
      ]
    );
    return;
  }

  // KYC DISCLAIMER
  if (step === 'KYC_DISCLAIMER') {
    if (replyId === 'DISCLAIMER_NO') {
      await db.clearSession(from);
      await wa.sendText(from, `Your request has been cancelled.\n\nThank you for contacting Jacerock Capital Limited.\n\n_Type *menu* to start again._`);
      return;
    }
    if (replyId === 'DISCLAIMER_YES') {
      const { selectedBank, kycName, currencyPair, rate, amount, settlementAmount, paymentMethod } = sessionData;
      const customer = await db.getOrCreateCustomer(from, senderName);
      const transaction = await db.createTransaction(from, customer.id, kycName, currencyPair, parseFloat(rate));
      await db.updateTransaction(transaction.id, {
        amount, settlement_amount_ngn: settlementAmount,
        payment_method: paymentMethod, selected_bank_id: selectedBank.id,
        status: 'PAYMENT_INSTRUCTIONS_ISSUED',
      });
      await db.setSession(from, 'AWAITING_RECEIPT', { ...sessionData, transactionId: transaction.id }, transaction.id);
      await wa.sendText(from,
        `🏦 PAYMENT ACCOUNT\n\nBank: *${selectedBank.bank_name}*\nAccount Name: *${selectedBank.account_name}*\nAccount Number: *${selectedBank.account_number}*\n\nReference: *${transaction.reference}*\n\nPlease make your payment only after confirming the account details above.\n\nOnce payment has been completed, please upload your payment receipt here.${CANCEL_HINT}`
      );
    } else {
      await wa.sendButtons(from, `Do you wish to proceed with the transfer?`,
        [{ id: 'DISCLAIMER_YES', title: '✅ Yes, Proceed' }, { id: 'DISCLAIMER_NO', title: '❌ Cancel' }]
      );
    }
    return;
  }

  // AWAITING RECEIPT
  if (step === 'AWAITING_RECEIPT') {
    const { transactionId, kycName } = sessionData;
    if (msgType === 'image' || msgType === 'document') {
      const mediaId = message.image?.id || message.document?.id;
      const transaction = await db.getTransactionById(transactionId);
      let receiptUrl = null;
      if (mediaId) {
        receiptUrl = await uploadReceiptToStorage(mediaId, process.env.WHATSAPP_TOKEN, transaction.reference);
      }
      await db.updateTransaction(transactionId, {
        status: 'RECEIPT_UPLOADED',
        receipt_uploaded_at: new Date().toISOString(),
        receipt_url: receiptUrl,
      });
      await db.setSession(from, 'AWAITING_SETTLEMENT', sessionData, transactionId);
      await wa.sendTemplate(from, 'payment_received', [kycName, transaction.reference]);
      await wa.sendText(from, `Please provide the Nigerian bank account details where you would like to receive your settlement.\n\nKindly reply with:\n\n*Account Name:*\n*Bank Name:*\n*Account Number:*${CANCEL_HINT}`);
    } else {
      await wa.sendText(from, `Please upload your payment receipt as an image or document to proceed.${CANCEL_HINT}`);
    }
    return;
  }

  // AWAITING SETTLEMENT
  if (step === 'AWAITING_SETTLEMENT') {
    if (!textBody) {
      await wa.sendText(from, `Please provide your settlement account details as text.\n\nFormat:\n*Account Name:*\n*Bank Name:*\n*Account Number:*${CANCEL_HINT}`);
      return;
    }
    await db.setSession(from, 'SETTLEMENT_CONFIRM', { ...sessionData, settlementRaw: textBody }, sessionData.transactionId);
    await wa.sendButtons(from,
      `🔎 PLEASE CONFIRM YOUR SETTLEMENT DETAILS\n\n${textBody}\n\nPlease confirm that the above information is correct.`,
      [
        { id: 'SETTLE_PROCEED', title: '✅ Proceed' },
        { id: 'SETTLE_DECLINE', title: '❌ Re-enter Details' },
      ]
    );
    return;
  }

  // SETTLEMENT CONFIRM
  if (step === 'SETTLEMENT_CONFIRM') {
    const { transactionId, settlementRaw, kycName } = sessionData;
    if (replyId === 'SETTLE_DECLINE') {
      await db.setSession(from, 'AWAITING_SETTLEMENT', sessionData, transactionId);
      await wa.sendText(from, `Your settlement details have not been confirmed.\n\nPlease re-enter your correct settlement account details:\n\n*Account Name:*\n*Bank Name:*\n*Account Number:*${CANCEL_HINT}`);
      return;
    }
    if (replyId === 'SETTLE_PROCEED') {
      await db.updateTransaction(transactionId, { status: 'AWAITING_STAFF_APPROVAL', settlement_account_name: settlementRaw });
      await db.logAudit(transactionId, null, 'SETTLEMENT_CONFIRMED', 'RECEIPT_UPLOADED', 'AWAITING_STAFF_APPROVAL');
      await db.setSession(from, 'PROCESSING', sessionData, transactionId);
      const transaction = await db.getTransactionById(transactionId);
      await wa.sendText(from,
        `✅ Settlement Details Confirmed\n\nThank you.\n\nYour transaction has been submitted for payment verification and settlement processing.\n\n⏳ Please remain patient for approximately 10–20 minutes while our team reviews and processes your transaction.\n\nTransaction Reference: *${transaction.reference}*\n\nYou will receive an update once processing has been completed.\n\nThank you for choosing Jacerock Capital Limited.`
      );
    } else {
      await wa.sendButtons(from,
        `🔎 PLEASE CONFIRM YOUR SETTLEMENT DETAILS\n\n${settlementRaw}\n\nIs this correct?`,
        [{ id: 'SETTLE_PROCEED', title: '✅ Proceed' }, { id: 'SETTLE_DECLINE', title: '❌ Re-enter Details' }]
      );
    }
    return;
  }

  // CUSTOMER CARE
  if (step === 'CUSTOMER_CARE') {
    if (replyId === 'CS_AGENT') {
      await db.clearSession(from);
      await wa.sendText(from, `👩🏾‍💼 Your request has been forwarded to our customer care team.\n\nA team member will attend to your request shortly.\n\nThank you for your patience.`);
    } else if (replyId) {
      await wa.sendText(from, `Thank you for reaching out. A member of our team will review your request and get back to you shortly.\n\nPlease have your transaction reference ready if applicable.\n\n_Type *menu* to return to the main menu._`);
      await db.clearSession(from);
    } else {
      await wa.sendList(from,
        '👩🏾‍💼 CUSTOMER CARE SUPPORT\n\nPlease select the type of assistance you require:',
        'Select Option',
        [{ title: 'Support Options', rows: [
          { id: 'CS_TRANSACTION', title: 'Transaction Enquiry' },
          { id: 'CS_STATUS', title: 'Transaction Status' },
          { id: 'CS_PAYMENT', title: 'Payment Issue' },
          { id: 'CS_SETTLEMENT', title: 'Settlement Issue' },
          { id: 'CS_KYC', title: 'KYC Assistance' },
          { id: 'CS_AGENT', title: 'Speak with Agent' },
        ]}]
      );
    }
    return;
  }

  // PROCESSING: check real status instead of always saying "still processing"
  if (step === 'PROCESSING') {
    const transaction = await db.getTransactionById(sessionData.transactionId);

    if (!transaction) {
      await db.clearSession(from);
      await showMainMenu(from);
      return;
    }

    if (transaction.status === 'SETTLEMENT_COMPLETED' || transaction.status === 'CLOSED') {
      await db.clearSession(from);
      const customer = await db.getOrCreateCustomer(from, senderName);
      await db.setSession(from, 'MAIN_MENU', { customerId: customer.id, kycName: transaction.kyc_name, isReturning: true });
      await wa.sendButtons(from,
        `✅ Your transaction *${transaction.reference}* (${transaction.currency_pair?.replace('_', ' → ')}) has been completed successfully!\n\nWould you like to start a new transaction today?`,
        [
          { id: 'EXCHANGE_RATES', title: '📊 Exchange Rates' },
          { id: 'CUSTOMER_CARE', title: '👩🏾‍💼 Customer Care' },
        ]
      );
    } else if (transaction.status === 'REJECTED') {
      await db.clearSession(from);
      const customer = await db.getOrCreateCustomer(from, senderName);
      await db.setSession(from, 'MAIN_MENU', { customerId: customer.id, kycName: transaction.kyc_name, isReturning: true });
      await wa.sendButtons(from,
        `❌ Your transaction *${transaction.reference}* was rejected.${transaction.rejection_reason ? `\n\nReason: ${transaction.rejection_reason}` : ''}\n\nWould you like to start a new transaction, or contact Customer Care?`,
        [
          { id: 'EXCHANGE_RATES', title: '📊 Exchange Rates' },
          { id: 'CUSTOMER_CARE', title: '👩🏾‍💼 Customer Care' },
        ]
      );
    } else {
      await wa.sendText(from, `Your transaction reference *${transaction.reference}* is currently being processed by our team.\n\nPlease be patient. You will be notified once your transfer is complete.\n\nThank you for choosing Jacerock Capital Limited.`);
    }
    return;
  }

  // FALLBACK
  await db.clearSession(from);
  await showMainMenu(from);
}

module.exports = { handleMessage };
