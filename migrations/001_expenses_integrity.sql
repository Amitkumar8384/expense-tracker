-- Run this on Aiven only after reviewing the first query's results.
-- user_id values that are NULL cannot be assigned safely without knowing the owner.
SELECT id, title, amount, date
FROM expenses
WHERE user_id IS NULL;

-- After every orphan above has been deliberately assigned to an owner or removed,
-- run the following statements once:
--
-- ALTER TABLE expenses
--   MODIFY user_id INT NOT NULL,
--   ADD INDEX idx_expenses_user_date (user_id, date),
--   ADD CONSTRAINT fk_expenses_user
--     FOREIGN KEY (user_id) REFERENCES users(id)
--     ON DELETE CASCADE,
--   ADD CONSTRAINT chk_expenses_amount CHECK (amount > 0),
--   ADD CONSTRAINT chk_expenses_type CHECK (type IN ('income', 'expense'));
