SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
   WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'budgets' AND CONSTRAINT_NAME = 'chk_budget_limit') = 0,
  'ALTER TABLE budgets ADD CONSTRAINT chk_budget_limit CHECK (monthly_limit > 0)',
  'SELECT 1'
);
PREPARE planning_stmt FROM @sql;
EXECUTE planning_stmt;
DEALLOCATE PREPARE planning_stmt;

SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
   WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'budgets' AND CONSTRAINT_NAME = 'fk_budget_user') = 0,
  'ALTER TABLE budgets ADD CONSTRAINT fk_budget_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE',
  'SELECT 1'
);
PREPARE planning_stmt FROM @sql;
EXECUTE planning_stmt;
DEALLOCATE PREPARE planning_stmt;

SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
   WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'recurring_transactions' AND CONSTRAINT_NAME = 'chk_recurring_amount') = 0,
  'ALTER TABLE recurring_transactions ADD CONSTRAINT chk_recurring_amount CHECK (amount > 0)',
  'SELECT 1'
);
PREPARE planning_stmt FROM @sql;
EXECUTE planning_stmt;
DEALLOCATE PREPARE planning_stmt;

SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
   WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'recurring_transactions' AND CONSTRAINT_NAME = 'chk_recurring_type') = 0,
  'ALTER TABLE recurring_transactions ADD CONSTRAINT chk_recurring_type CHECK (type IN (''income'', ''expense''))',
  'SELECT 1'
);
PREPARE planning_stmt FROM @sql;
EXECUTE planning_stmt;
DEALLOCATE PREPARE planning_stmt;

SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
   WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'recurring_transactions' AND CONSTRAINT_NAME = 'chk_recurring_day') = 0,
  'ALTER TABLE recurring_transactions ADD CONSTRAINT chk_recurring_day CHECK (day_of_month BETWEEN 1 AND 31)',
  'SELECT 1'
);
PREPARE planning_stmt FROM @sql;
EXECUTE planning_stmt;
DEALLOCATE PREPARE planning_stmt;

SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
   WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'recurring_transactions' AND CONSTRAINT_NAME = 'fk_recurring_user') = 0,
  'ALTER TABLE recurring_transactions ADD CONSTRAINT fk_recurring_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE',
  'SELECT 1'
);
PREPARE planning_stmt FROM @sql;
EXECUTE planning_stmt;
DEALLOCATE PREPARE planning_stmt;