CREATE TABLE IF NOT EXISTS budgets (
  id INT NOT NULL AUTO_INCREMENT,
  user_id INT NOT NULL,
  category VARCHAR(100) NOT NULL,
  monthly_limit DECIMAL(12, 2) NOT NULL,
  month CHAR(7) NOT NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_budget_user_category_month (user_id, category, month),
  CONSTRAINT chk_budget_limit CHECK (monthly_limit > 0),
  CONSTRAINT fk_budget_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS recurring_transactions (
  id INT NOT NULL AUTO_INCREMENT,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  type VARCHAR(20) NOT NULL,
  category VARCHAR(100) NOT NULL,
  day_of_month TINYINT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT chk_recurring_amount CHECK (amount > 0),
  CONSTRAINT chk_recurring_type CHECK (type IN ('income', 'expense')),
  CONSTRAINT chk_recurring_day CHECK (day_of_month BETWEEN 1 AND 31),
  CONSTRAINT fk_recurring_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
