-- db/migrate-patron-intake.sql
ALTER TABLE Patrons ADD firstName NVARCHAR(100) NULL, middleName NVARCHAR(100) NULL, lastName NVARCHAR(100) NULL, email NVARCHAR(100) NULL, contact2 NVARCHAR(100) NULL, addrStreet NVARCHAR(100) NULL, addrBarangay NVARCHAR(100) NULL, addrCity NVARCHAR(100) NULL, addrProvince NVARCHAR(100) NULL, addrPostal NVARCHAR(20) NULL, avatar NVARCHAR(MAX) NULL;
