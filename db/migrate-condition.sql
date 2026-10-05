-- db/migrate-condition.sql
ALTER TABLE BookCopies ADD condition NVARCHAR(10) NOT NULL DEFAULT 'Good' CHECK (condition IN ('Good','Worn','Damaged'));
