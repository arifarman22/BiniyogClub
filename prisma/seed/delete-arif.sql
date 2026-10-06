-- Delete Arif Arman and all related data
DO $$
DECLARE
  v_uid TEXT;
  v_wallet_id TEXT;
  v_profile_id TEXT;
BEGIN
  SELECT id INTO v_uid FROM users WHERE name = 'Arif Arman' LIMIT 1;
  IF v_uid IS NULL THEN
    RAISE NOTICE 'User Arif Arman not found — nothing to delete.';
    RETURN;
  END IF;

  SELECT id INTO v_wallet_id FROM wallets WHERE "userId" = v_uid;
  SELECT id INTO v_profile_id FROM investor_profiles WHERE "userId" = v_uid;

  -- 1. Wallet snapshots
  IF v_wallet_id IS NOT NULL THEN
    DELETE FROM wallet_snapshots WHERE "walletId" = v_wallet_id;
  END IF;

  -- 2. Ledger entries + orphaned ledger transactions (via wallet)
  IF v_wallet_id IS NOT NULL THEN
    DELETE FROM ledger_entries WHERE "walletId" = v_wallet_id;
  END IF;

  -- 3. Ledger entries linked to investments (via investmentId on ledger_transactions)
  IF v_profile_id IS NOT NULL THEN
    DELETE FROM ledger_entries
    WHERE "ledgerTransactionId" IN (
      SELECT lt.id FROM ledger_transactions lt
      JOIN investments i ON lt."investmentId" = i.id
      WHERE i."investorProfileId" = v_profile_id
    );
  END IF;

  -- 4. Void/delete ledger transactions tied to investments
  IF v_profile_id IS NOT NULL THEN
    DELETE FROM ledger_transactions
    WHERE "investmentId" IN (
      SELECT id FROM investments WHERE "investorProfileId" = v_profile_id
    );
  END IF;

  -- 5. Orphaned ledger transactions (no entries left referencing them)
  DELETE FROM ledger_transactions
  WHERE id NOT IN (SELECT DISTINCT "ledgerTransactionId" FROM ledger_entries);

  -- 6. Distribution line items
  IF v_profile_id IS NOT NULL THEN
    DELETE FROM distribution_line_items
    WHERE "investmentId" IN (
      SELECT id FROM investments WHERE "investorProfileId" = v_profile_id
    );
  END IF;

  -- 7. Profit distributions
  IF v_profile_id IS NOT NULL THEN
    DELETE FROM profit_distributions
    WHERE "investmentId" IN (
      SELECT id FROM investments WHERE "investorProfileId" = v_profile_id
    );
  END IF;

  -- 8. Investment contracts
  IF v_profile_id IS NOT NULL THEN
    DELETE FROM investment_contracts
    WHERE "investmentId" IN (
      SELECT id FROM investments WHERE "investorProfileId" = v_profile_id
    );
  END IF;

  -- 9. Manual payment submissions
  IF v_profile_id IS NOT NULL THEN
    DELETE FROM manual_payment_submissions
    WHERE "investmentId" IN (
      SELECT id FROM investments WHERE "investorProfileId" = v_profile_id
    );
  END IF;

  -- 10. Gateway payments
  IF v_profile_id IS NOT NULL THEN
    DELETE FROM gateway_payments
    WHERE "investmentId" IN (
      SELECT id FROM investments WHERE "investorProfileId" = v_profile_id
    );
  END IF;

  -- 11. Investments
  IF v_profile_id IS NOT NULL THEN
    DELETE FROM investments WHERE "investorProfileId" = v_profile_id;
  END IF;

  -- 12. Investor profile
  IF v_profile_id IS NOT NULL THEN
    DELETE FROM investor_profiles WHERE id = v_profile_id;
  END IF;

  -- 13. Payments & withdrawals (via wallet)
  IF v_wallet_id IS NOT NULL THEN
    DELETE FROM payments WHERE "walletId" = v_wallet_id;
    DELETE FROM withdrawals WHERE "walletId" = v_wallet_id;
    DELETE FROM wallets WHERE id = v_wallet_id;
  END IF;

  -- 14. Group investments
  DELETE FROM group_investments WHERE "investorUserId" = v_uid;

  -- 15. KYC documents + KYC
  DELETE FROM kyc_documents WHERE "kycId" IN (SELECT id FROM kyc WHERE "userId" = v_uid);
  DELETE FROM kyc WHERE "userId" = v_uid;

  -- 16. Documents uploaded by user
  DELETE FROM document_audit_logs
  WHERE "documentId" IN (SELECT id FROM documents WHERE "uploadedBy" = v_uid);
  DELETE FROM documents WHERE "uploadedBy" = v_uid;

  -- 17. Notifications, sessions, verification tokens, audit logs
  DELETE FROM notifications WHERE "userId" = v_uid;
  DELETE FROM sessions WHERE "userId" = v_uid;
  DELETE FROM verification_tokens WHERE "userId" = v_uid;
  DELETE FROM audit_logs WHERE "actorId" = v_uid;

  -- 18. User
  DELETE FROM users WHERE id = v_uid;

  RAISE NOTICE 'Arif Arman (id: %) deleted successfully.', v_uid;
END $$;
