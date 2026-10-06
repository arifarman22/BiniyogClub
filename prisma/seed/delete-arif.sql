DO $$
DECLARE
  v_user_id TEXT;
  v_wallet_id TEXT;
  v_profile_id TEXT;
BEGIN
  SELECT id INTO v_user_id FROM users WHERE name = 'Arif Arman' LIMIT 1;
  IF v_user_id IS NULL THEN RAISE NOTICE 'User not found'; RETURN; END IF;

  SELECT id INTO v_wallet_id FROM wallets WHERE "userId" = v_user_id LIMIT 1;
  SELECT id INTO v_profile_id FROM investor_profiles WHERE "userId" = v_user_id LIMIT 1;

  -- Investments and children
  IF v_profile_id IS NOT NULL THEN
    DELETE FROM investment_contracts WHERE "investmentId" IN (SELECT id FROM investments WHERE "investorProfileId" = v_profile_id);
    DELETE FROM profit_distributions WHERE "investmentId" IN (SELECT id FROM investments WHERE "investorProfileId" = v_profile_id);
    DELETE FROM distribution_line_items WHERE "investmentId" IN (SELECT id FROM investments WHERE "investorProfileId" = v_profile_id);
    DELETE FROM gateway_payments WHERE "investmentId" IN (SELECT id FROM investments WHERE "investorProfileId" = v_profile_id);
    DELETE FROM manual_payment_submissions WHERE "investmentId" IN (SELECT id FROM investments WHERE "investorProfileId" = v_profile_id);
    DELETE FROM ledger_transactions WHERE "investmentId" IN (SELECT id FROM investments WHERE "investorProfileId" = v_profile_id);
    DELETE FROM investments WHERE "investorProfileId" = v_profile_id;
    DELETE FROM investor_profiles WHERE id = v_profile_id;
  END IF;

  -- Wallet and related
  IF v_wallet_id IS NOT NULL THEN
    DELETE FROM ledger_entries WHERE "walletId" = v_wallet_id;
    DELETE FROM payments WHERE "walletId" = v_wallet_id;
    DELETE FROM withdrawals WHERE "walletId" = v_wallet_id;
    DELETE FROM wallet_snapshots WHERE "walletId" = v_wallet_id;
    DELETE FROM wallets WHERE id = v_wallet_id;
  END IF;

  -- User-level records
  DELETE FROM documents WHERE "uploadedBy" = v_user_id;
  DELETE FROM notifications WHERE "userId" = v_user_id;
  DELETE FROM audit_logs WHERE "actorId" = v_user_id;
  DELETE FROM kyc WHERE "userId" = v_user_id;
  DELETE FROM sessions WHERE "userId" = v_user_id;

  DELETE FROM users WHERE id = v_user_id;

  RAISE NOTICE 'Deleted user Arif Arman (%)', v_user_id;
END $$;
