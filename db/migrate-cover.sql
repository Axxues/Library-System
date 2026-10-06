-- db/migrate-cover.sql — optional book cover image per title (base64 data URL, NULL = gradient initials).
ALTER TABLE Books ADD cover NVARCHAR(MAX) NULL;
