-- Delete Abu Bokkir Siddik and Arif Arman and all their related data
DO $$
DECLARE
  uid TEXT;
  user_ids TEXT[] := ARRAY(
    SELECT id FROM users WHERE name IN ('Abu Bokkir Siddik', 'Arif Arman')
  );
BEGIN
  FOREACH uid IN ARRAY user_ids LOOP
    -- Documents
    DELETE FROM documents WHERE "uploadedBy" = uid;
    -- Notifications
    DELETE FROM notifications WHERE "userId" = uid;
    -- Audit logs
    DELETE FROM audit_logs WHERE "actorId" = uid;
    -- Sessions / tokens
    DELETE FROM sessions WHERE "userId" = uid;
    DELETE FROM password_reset_tokens WHERE "userId" = uid;
    DELETE FROM email_verification_tokens WHERE "userId" = uid;
    -- KYC
    DELETE FROM kyc WHERE "userId" = uid;
    -- Investments (via investor profile)
    DELETE FROM investment_contracts WHERE "investmentId" IN (
      SELECT i.id FROM investments i
      JOIN investor_profiles ip ON i."investorProfileId" = ip.id
      WHERE ip."userId" = uid
    );
    DELETE FROM investments WHERE "investorProfileId" IN (
      SELECT id FROM investor_profiles WHERE "userId" = uid
    );
    DELETE FROM investor_profiles WHERE "userId" = uid;
    -- Payments & ledger entries (via wallet)
    DELETE FROM ledger_entries WHERE "walletId" IN (
      SELECT id FROM wallets WHERE "userId" = uid
    );
    DELETE FROM ledger_transactions WHERE id NOT IN (
      SELECT DISTINCT "transactionId" FROM ledger_entries
    );
    DELETE FROM payments WHERE "walletId" IN (
      SELECT id FROM wallets WHERE "userId" = uid
    );
    DELETE FROM withdrawals WHERE "walletId" IN (
      SELECT id FROM wallets WHERE "userId" = uid
    );
    DELETE FROM wallets WHERE "userId" = uid;
    -- Finally the user
    DELETE FROM users WHERE id = uid;
  END LOOP;
END $$;
