-- db/migrate-profile.sql
USE LibraryDB;
GO
ALTER TABLE Users ADD firstName NVARCHAR(50), middleName NVARCHAR(50), lastName NVARCHAR(50), dob DATE, email NVARCHAR(100), phone NVARCHAR(30), addrStreet NVARCHAR(120), addrBarangay NVARCHAR(80), addrCity NVARCHAR(80), addrProvince NVARCHAR(80), addrPostal NVARCHAR(10), avatar NVARCHAR(MAX), totpSecret NVARCHAR(100), totpEnabled BIT NOT NULL DEFAULT 0, accent NVARCHAR(7);
GO
