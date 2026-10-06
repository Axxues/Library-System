-- db/migrate-condition-note.sql — free-text condition note per copy (NULL = none).
ALTER TABLE BookCopies ADD conditionNote NVARCHAR(500) NULL;
