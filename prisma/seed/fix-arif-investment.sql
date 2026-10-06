-- Fix Arif Arman's ACTIVE investment that was created before the PENDING flow was introduced.
-- 1. Find the investment, cancel it
-- 2. Reverse the ledger entry (refund wallet)
-- 3. Decrement project funded amount

DO $$
DECLARE
  v_user_id TEXT;
  v_wallet_id TEXT;
  v_investment_id TEXT;
  v_project_id TEXT;
  v_amount NUMERIC;
  v_ledger_tx_id TEXT;
  v_entry_credit_wallet TEXT;
  v_new_balance NUMERIC;
BEGIN
  -- Get Arif Arman's user id
  SELECT id INTO v_user_id FROM users WHERE name = 'Arif Arman' LIMIT 1;
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'User Arif Arman not found'; END IF;

  -- Get wallet
  SELECT id INTO v_wallet_id FROM wallets WHERE "userId" = v_user_id LIMIT 1;
  IF v_wallet_id IS NULL THEN RAISE EXCEPTION 'Wallet not found'; END IF;

  -- Get the ACTIVE investment
  SELECT i.id, i."projectId", i."amountBdt"
  INTO v_investment_id, v_project_id, v_amount
  FROM investments i
  JOIN investor_profiles ip ON i."investorProfileId" = ip.id
  WHERE ip."userId" = v_user_id AND i.status = 'ACTIVE'
  ORDER BY i."createdAt" DESC
  LIMIT 1;

  IF v_investment_id IS NULL THEN RAISE NOTICE 'No ACTIVE investment found for Arif Arman'; RETURN; END IF;

  RAISE NOTICE 'Found investment % for amount %', v_investment_id, v_amount;

  -- Cancel the investment
  UPDATE investments
  SET status = 'CANCELLED', "cancelledAt" = NOW(), "cancellationReason" = 'Reversed: investment created as ACTIVE before approval flow was introduced'
  WHERE id = v_investment_id;

  -- Decrement project funded amount
  UPDATE projects
  SET "fundedAmountBdt" = GREATEST(0, "fundedAmountBdt" - v_amount)
  WHERE id = v_project_id;

  -- Void any existing INVESTMENT_FUNDING ledger transaction for this investment
  UPDATE ledger_transactions
  SET status = 'VOIDED', "voidedAt" = NOW(), "voidReason" = 'Reversed: investment cancelled'
  WHERE "investmentId" = v_investment_id AND type = 'INVESTMENT_FUNDING' AND status = 'POSTED';

  -- Credit the investor wallet directly (refund)
  -- First get current cached balance
  SELECT "cachedBalance" INTO v_new_balance FROM wallets WHERE id = v_wallet_id;
  v_new_balance := v_new_balance + v_amount;

  -- Insert refund ledger transaction
  INSERT INTO ledger_transactions (id, type, status, description, "amountBdt", currency, "idempotencyKey", "referenceId", "referenceType", "investmentId", "postedAt", "createdAt")
  VALUES (gen_random_uuid()::text, 'REFUND', 'POSTED', 'Refund: investment cancelled (pre-approval flow fix)', v_amount, 'BDT',
    'fix-arif-' || v_investment_id, v_investment_id, 'Investment', v_investment_id, NOW(), NOW())
  RETURNING id INTO v_ledger_tx_id;

  -- Get escrow wallet id for debit entry
  SELECT id INTO v_entry_credit_wallet FROM wallets WHERE type = 'PLATFORM_ESCROW' LIMIT 1;
  IF v_entry_credit_wallet IS NULL THEN
    -- Use PLATFORM_REVENUE as fallback
    SELECT id INTO v_entry_credit_wallet FROM wallets WHERE type = 'PLATFORM_REVENUE' LIMIT 1;
  END IF;

  -- Insert ledger entries
  INSERT INTO ledger_entries (id, "ledgerTransactionId", "walletId", "entryType", "amountBdt", "balanceAfterBdt", "createdAt")
  VALUES
    (gen_random_uuid()::text, v_ledger_tx_id, v_entry_credit_wallet, 'DEBIT',  v_amount, 0, NOW()),
    (gen_random_uuid()::text, v_ledger_tx_id, v_wallet_id,           'CREDIT', v_amount, v_new_balance, NOW());

  -- Update wallet cached balance
  UPDATE wallets SET "cachedBalance" = v_new_balance WHERE id = v_wallet_id;

  RAISE NOTICE 'Done. Wallet % new balance: %', v_wallet_id, v_new_balance;
END $$;
