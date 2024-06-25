/*
  Warnings:

  - Added the required column `imageLink` to the `Food` table without a default value. This is not possible if the table is not empty.
  - Added the required column `CollectionStatus` to the `Reservation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `CollectionTimeEnd` to the `Reservation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `CollectionTimeStart` to the `Reservation` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Food" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "imageLink" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "expiryDate" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "donationId" INTEGER NOT NULL,
    CONSTRAINT "Food_donationId_fkey" FOREIGN KEY ("donationId") REFERENCES "Donation" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Food" ("createdAt", "donationId", "expiryDate", "id", "quantity", "type") SELECT "createdAt", "donationId", "expiryDate", "id", "quantity", "type" FROM "Food";
DROP TABLE "Food";
ALTER TABLE "new_Food" RENAME TO "Food";
CREATE TABLE "new_Reservation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" INTEGER NOT NULL,
    "foodId" INTEGER NOT NULL,
    "CollectionTimeStart" DATETIME NOT NULL,
    "CollectionTimeEnd" DATETIME NOT NULL,
    "CollectionStatus" TEXT NOT NULL,
    CONSTRAINT "Reservation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Reservation_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "Food" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Reservation" ("createdAt", "foodId", "id", "updatedAt", "userId") SELECT "createdAt", "foodId", "id", "updatedAt", "userId" FROM "Reservation";
DROP TABLE "Reservation";
ALTER TABLE "new_Reservation" RENAME TO "Reservation";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
