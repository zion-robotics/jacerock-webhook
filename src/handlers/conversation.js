const wa = require('../services/whatsapp');
const db = require('../services/database');

// ── RATE DISPLAY BUILDER ──────────────────────────────────────────────────────
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

// ── MAIN MESSAGE HANDLER ──────────────────────────────────────────────────────
async function handleMessage(from, message, senderName) {
  const blacklisted = await db.isBlacklisted(from);
  if (blacklisted) {
    await wa.sendText(from, 'We are unable to process your request at this time. Please contact support.');
    return;
  }

  const session = await db.getSession(from);
  const step = session?.current_step || 'WELCOME';
  const sessionData = session?.session_data || {};
  const transactionId = session?.transaction_id;

  const msgType = message.type;
  const textBody = msgType === 'text' ? message.text?.body?.trim() : null;
  const buttonReply = msgType === 'interactive' && message.interactive?.type === 'button_reply'
    ? message.interactive.button_reply
    : null;
  const listReply = msgType === 'interactive' && message.interactive?.type === 'list_reply'
    ? message.interactive.list_reply
    : null;
  const replyId = buttonReply?.id || listReply?.id || null;

  console.log(`📍 Step: ${step} | From: ${from} | Type: ${msgType} | Reply: ${replyId || textBody}`);

  // ── WELCOME ───────────────────────────────────────────────────────────────
  if (step === 'WELCOME') {
    const customer = await db.getOrCreateCustomer(from, senderName);
    await db.setSession(from, 'MAIN_MENU', { customerId: customer.id });

    await wa.sendButtons(
      from,
      `Hello, welcome to Jacerock Capital Limited / AfrikBerry Virtual Assistance Platform.\n\nHow can we be of assistance today?`,
      [
        { id: 'EXCHANGE_RATES', title: '📊 Exchange Rates' },
        { id: 'CUSTOMER_CARE', title: '👩🏾‍💼 Customer Care' },
      ]
    );
    return;
  }

  // ── MAIN MENU ─────────────────────────────────────────────────────────────
  if (step === 'MAIN_MENU') {
    if (replyId === 'EXCHANGE_RATES') {
      await db.setSession(from, 'KYC_ASK', sessionData);
      await wa.sendButtons(
        from,
        `Hi,\n\nBefore we proceed, as part of our Know Your Customer (KYC) process, could you please provide your full name exactly as shown on your valid ID?\n\nDo you wish to proceed?`,
        [
          { id: 'KYC_YES', title: '✅ Yes' },
          { id: 'KYC_NO', title: '❌ No' },
        ]
      );
    } else if (replyId === 'CUSTOMER_CARE') {
      await db.setSession(from, 'CUSTOMER_CARE', sessionData);
      await wa.sendList(
        from,
        '👩🏾‍💼 CUSTOMER CARE SUPPORT\n\nPlease select the type of assistance you require:',
        'Select Option',
        [{
          title: 'Support Options',
          rows: [
            { id: 'CS_TRANSACTION', title: 'Transaction Enquiry' },
            { id: 'CS_STATUS', title: 'Transaction Status' },
            { id: 'CS_PAYMENT', title: 'Payment Issue' },
            { id: 'CS_SETTLEMENT', title: 'Settlement Issue' },
            { id: 'CS_KYC', title: 'KYC Assistance' },
            { id: 'CS_AGENT', title: 'Speak with Agent' },
          ],
        }]
      );
    } else {
      await wa.sendButtons(
        from,
        `How can we assist you today?`,
        [
          { id: 'EXCHANGE_RATES', title: '📊 Exchange Rates' },
          { id: 'CUSTOMER_CARE', title: '👩🏾‍💼 Customer Care' },
        ]
      );
    }
    return;
  }

  // ── KYC ASK ───────────────────────────────────────────────────────────────
  if (step === 'KYC_ASK') {
    if (replyId === 'KYC_YES') {
      await db.setSession(from, 'KYC_INPUT', sessionData);
      await wa.sendText(from, 'Please type your full name exactly as it appears on your valid ID:');
    } else if (replyId === 'KYC_NO') {
      await db.clearSession(from);
      await wa.sendText(from, 'No problem. Your request has been cancelled.\n\nYou may return to the main menu whenever you are ready.');
    }
    return;
  }

  // ── KYC INPUT ─────────────────────────────────────────────────────────────
  if (step === 'KYC_INPUT') {
    if (!textBody || textBody.length < 3) {
      await wa.sendText(from, 'Please enter your full name as shown on your ID (minimum 3 characters):');
      return;
    }

    const kycName = textBody;
    await db.updateCustomerKYC(from, kycName);
    await db.setSession(from, 'RATE_DISPLAY', { ...sessionData, kycName });

    const rateText = await buildRateDisplay();
    await wa.sendText(from, rateText);

    await wa.sendList(
      from,
      'Please select the currency pair you wish to transact:',
      'Select Currency Pair',
      [{
        title: 'Available Currency Pairs',
        rows: [
          { id: 'GMD_NGN', title: '🇬🇲 GMD → NGN' },
          { id: 'NGN_GMD', title: '🇳🇬 NGN → GMD' },
          { id: 'USD_GMD', title: '🇺🇸 USD → GMD' },
          { id: 'EUR_GMD', title: '🇪🇺 EUR → GMD' },
          { id: 'GBP_GMD', title: '🇬🇧 GBP → GMD' },
          { id: 'CAD_GMD', title: '🇨🇦 CAD → GMD' },
          { id: 'CFA_GMD', title: '🇨🇫 CEFA → GMD' },
          { id: 'USDT_GMD', title: '💲 USDT → GMD' },
        ],
      }]
    );
    await db.setSession(from, 'CURRENCY_SELECT', { ...sessionData, kycName });
    return;
  }

  // ── CURRENCY SELECT ───────────────────────────────────────────────────────
  if (step === 'CURRENCY_SELECT') {
    const validPairs = ['GMD_NGN', 'NGN_GMD', 'USD_GMD', 'EUR_GMD', 'GBP_GMD', 'CAD_GMD', 'CFA_GMD', 'USDT_GMD'];
    if (!replyId || !validPairs.includes(replyId)) {
      await wa.sendText(from, 'Please select a currency pair from the list above.');
      return;
    }

    const rateData = await db.getRateByCurrencyPair(replyId);
    if (!rateData) {
      await wa.sendText(from, 'Sorry, that currency pair is currently unavailable. Please try again later.');
      return;
    }

    const pairLabel = replyId.replace('_', ' → ');
    await db.setSession(from, 'AMOUNT_INPUT', { ...sessionData, currencyPair: replyId, rate: rateData.rate, pairLabel });

    await wa.sendText(
      from,
      `You have selected:\n\n${pairLabel}\n\nCurrent rate: ${rateData.rate} per ${rateData.from_currency}\n\nPlease enter the amount you would like to exchange:`
    );
    return;
  }

  // ── AMOUNT INPUT ──────────────────────────────────────────────────────────
  if (step === 'AMOUNT_INPUT') {
    const amount = parseFloat(textBody);
    if (!amount || isNaN(amount) || amount <= 0) {
      await wa.sendText(from, 'Please enter a valid amount (numbers only):');
      return;
    }

    const { rate, pairLabel, currencyPair, kycName } = sessionData;
    const settlementAmount = (amount * rate).toFixed(2);

    await db.setSession(from, 'PAYMENT_METHOD', { ...sessionData, amount, settlementAmount });

    await wa.sendButtons(
      from,
      `Thank you.\n\nYou have selected: ${pairLabel}\nAmount: ${amount}\nRate: ${rate}\nYou will receive: NGN ${Number(settlementAmount).toLocaleString()}\n\n⚠️ Rates are subject to change until payment is confirmed.\n\nPlease select your preferred payment method:`,
      [
        { id: 'BANK_TRANSFER', title: '🏦 Bank Transfer' },
        { id: 'CASH_DEPOSIT', title: '💵 Cash Deposit' },
        { id: 'MOBILE_WALLET', title: '📱 Mobile Wallet' },
      ]
    );
    return;
  }

  // ── PAYMENT METHOD ────────────────────────────────────────────────────────
  if (step === 'PAYMENT_METHOD') {
    if (!replyId || !['BANK_TRANSFER', 'CASH_DEPOSIT', 'MOBILE_WALLET'].includes(replyId)) {
      await wa.sendText(from, 'Please select a payment method from the options above.');
      return;
    }

    await db.setSession(from, 'BANK_SELECT', { ...sessionData, paymentMethod: replyId });

    const banks = await db.getBankAccounts();
    const bankRows = banks.map(b => ({ id: b.id, title: b.bank_name, description: b.country }));

    await wa.sendList(
      from,
      'Please select the bank account you would like to make your payment to:',
      'Select Bank',
      [{ title: 'Available Banks', rows: bankRows }]
    );
    return;
  }

  // ── BANK SELECT ───────────────────────────────────────────────────────────
  if (step === 'BANK_SELECT') {
    if (!replyId) {
      await wa.sendText(from, 'Please select a bank from the list.');
      return;
    }

    const bank = await db.getBankById(replyId);
    if (!bank) {
      await wa.sendText(from, 'Invalid selection. Please try again.');
      return;
    }

    await db.setSession(from, 'KYC_DISCLAIMER', { ...sessionData, selectedBankId: replyId, selectedBank: bank });

    await wa.sendButtons(
      from,
      `⚠️ IMPORTANT NOTICE\n\nDear Customer,\n\nJacerock/AfrikBerry ONLY ACCEPTS BANK TRANSFERS FROM AN ACCOUNT WITH THE SAME ACCOUNT NAME PROVIDED DURING KYC VERIFICATION.\n\nThird-party transfers may be rejected or placed on hold pending verification.\n\nDo you wish to proceed?`,
      [
        { id: 'DISCLAIMER_YES', title: '✅ Yes, Proceed' },
        { id: 'DISCLAIMER_NO', title: '❌ Cancel' },
      ]
    );
    return;
  }

  // ── KYC DISCLAIMER ────────────────────────────────────────────────────────
  if (step === 'KYC_DISCLAIMER') {
    if (replyId === 'DISCLAIMER_NO') {
      await db.clearSession(from);
      await wa.sendText(from, 'Your request has been cancelled. Thank you for contacting Jacerock Capital Limited.');
      return;
    }

    if (replyId === 'DISCLAIMER_YES') {
      const { selectedBank, kycName, currencyPair, rate, amount, settlementAmount, paymentMethod, customerId } = sessionData;

      const customer = await db.getOrCreateCustomer(from, senderName);
      const transaction = await db.createTransaction(from, customer.id, kycName, currencyPair, rate);

      await db.updateTransaction(transaction.id, {
        amount,
        settlement_amount_ngn: settlementAmount,
        payment_method: paymentMethod,
        selected_bank_id: selectedBank.id,
        status: 'PAYMENT_INSTRUCTIONS_ISSUED',
      });

      await db.setSession(from, 'AWAITING_RECEIPT', { ...sessionData, transactionId: transaction.id }, transaction.id);

      await wa.sendText(
        from,
        `🏦 PAYMENT ACCOUNT\n\nBank: ${selectedBank.bank_name}\nAccount Name: ${selectedBank.account_name}\nAccount Number: ${selectedBank.account_number}\n\nReference: ${transaction.reference}\n\nPlease make your payment only after confirming the account details above.\n\nOnce payment has been completed, please upload your payment receipt here.`
      );
    }
    return;
  }

  // ── AWAITING RECEIPT ──────────────────────────────────────────────────────
  if (step === 'AWAITING_RECEIPT') {
    const { transactionId, kycName } = sessionData;

    if (msgType === 'image' || msgType === 'document') {
      await db.updateTransaction(transactionId, {
        status: 'RECEIPT_UPLOADED',
        receipt_uploaded_at: new Date().toISOString(),
      });

      await db.setSession(from, 'AWAITING_SETTLEMENT', sessionData, transactionId);

      const transaction = await db.getTransactionById(transactionId);
      await wa.sendTemplate(from, 'payment_received', [kycName, transaction.reference]);

      await wa.sendText(
        from,
        `Please provide the Nigerian bank account details where you would like to receive your settlement.\n\nKindly reply with:\n\nAccount Name:\nBank Name:\nAccount Number:`
      );
    } else {
      await wa.sendText(from, 'Please upload your payment receipt as an image or document to proceed.');
    }
    return;
  }

  // ── AWAITING SETTLEMENT DETAILS ───────────────────────────────────────────
  if (step === 'AWAITING_SETTLEMENT') {
    if (!textBody) {
      await wa.sendText(from, 'Please provide your settlement account details as text.');
      return;
    }

    await db.setSession(from, 'SETTLEMENT_CONFIRM', { ...sessionData, settlementRaw: textBody }, sessionData.transactionId);

    await wa.sendButtons(
      from,
      `🔎 PLEASE CONFIRM YOUR SETTLEMENT DETAILS\n\n${textBody}\n\nPlease confirm that the above information is correct.`,
      [
        { id: 'SETTLE_PROCEED', title: '✅ Proceed' },
        { id: 'SETTLE_DECLINE', title: '❌ Decline' },
      ]
    );
    return;
  }

  // ── SETTLEMENT CONFIRM ────────────────────────────────────────────────────
  if (step === 'SETTLEMENT_CONFIRM') {
    const { transactionId, settlementRaw, kycName } = sessionData;

    if (replyId === 'SETTLE_DECLINE') {
      await db.setSession(from, 'AWAITING_SETTLEMENT', sessionData, transactionId);
      await wa.sendText(from, 'Your settlement details have not been confirmed.\n\nPlease re-enter your correct settlement account details:\n\nAccount Name:\nBank Name:\nAccount Number:');
      return;
    }

    if (replyId === 'SETTLE_PROCEED') {
      await db.updateTransaction(transactionId, {
        status: 'AWAITING_STAFF_APPROVAL',
        settlement_account_name: settlementRaw,
      });

      await db.logAudit(transactionId, null, 'SETTLEMENT_CONFIRMED', 'RECEIPT_UPLOADED', 'AWAITING_STAFF_APPROVAL');

      const transaction = await db.getTransactionById(transactionId);
      await db.setSession(from, 'PROCESSING', sessionData, transactionId);

      await wa.sendText(
        from,
        `✅ Settlement Details Confirmed\n\nThank you.\n\nYour transaction has been submitted for payment verification and settlement processing.\n\n⏳ Please remain patient for approximately 10–20 minutes while our team reviews and processes your transaction.\n\nTransaction Reference: ${transaction.reference}\n\nYou will receive an update once processing has been completed.`
      );
    }
    return;
  }

  // ── CUSTOMER CARE ─────────────────────────────────────────────────────────
  if (step === 'CUSTOMER_CARE') {
    if (replyId === 'CS_AGENT') {
      await db.clearSession(from);
      await wa.sendText(
        from,
        `Your request has been forwarded to our customer care team.\n\nA team member will attend to your request shortly.\n\nThank you for your patience.`
      );
    } else {
      await wa.sendText(
        from,
        `Thank you for reaching out. A member of our team will review your request and get back to you shortly.\n\nPlease have your transaction reference ready if applicable.`
      );
      await db.clearSession(from);
    }
    return;
  }

  // ── PROCESSING STATE ──────────────────────────────────────────────────────
  if (step === 'PROCESSING') {
    const transaction = await db.getTransactionById(sessionData.transactionId);
    await wa.sendText(
      from,
      `Your transaction reference ${transaction?.reference} is currently being processed by our team.\n\nPlease be patient. You will be notified once your transfer is complete.\n\nThank you for choosing Jacerock Capital Limited.`
    );
    return;
  }

  // ── FALLBACK ──────────────────────────────────────────────────────────────
  await db.clearSession(from);
  await wa.sendButtons(
    from,
    `Hello, welcome to Jacerock Capital Limited / AfrikBerry.\n\nHow can we assist you today?`,
    [
      { id: 'EXCHANGE_RATES', title: '📊 Exchange Rates' },
      { id: 'CUSTOMER_CARE', title: '👩🏾‍💼 Customer Care' },
    ]
  );
}

module.exports = { handleMessage };
