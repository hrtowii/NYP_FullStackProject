/*
  Warnings:

  - You are about to drop the `Food` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `foodReserved` on the `Donation` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `Donation` table. All the data in the column will be lost.
  - You are about to drop the column `CollectionStatus` on the `Reservation` table. All the data in the column will be lost.
  - You are about to drop the column `CollectionTimeEnd` on the `Reservation` table. All the data in the column will be lost.
  - You are about to drop the column `CollectionTimeStart` on the `Reservation` table. All the data in the column will be lost.
  - You are about to drop the column `foodId` on the `Reservation` table. All the data in the column will be lost.
  - Added the required column `category` to the `Donation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `deliveryDate` to the `Donation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `expiryDate` to the `Donation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `food` to the `Donation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `location` to the `Donation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `quantity` to the `Donation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Donation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `collectionDate` to the `Reservation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `collectionStatus` to the `Reservation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `collectionTimeSlot` to the `Reservation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `donationId` to the `Reservation` table without a default value. This is not possible if the table is not empty.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Food";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Donation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "food" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "category" TEXT NOT NULL,
    "expiryDate" DATETIME NOT NULL,
    "deliveryDate" DATETIME NOT NULL,
    "location" TEXT NOT NULL,
    "remarks" TEXT,
    "imageUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "donatorId" INTEGER NOT NULL,
    CONSTRAINT "Donation_donatorId_fkey" FOREIGN KEY ("donatorId") REFERENCES "Donator" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Donation" ("donatorId", "id") SELECT "donatorId", "id" FROM "Donation";
DROP TABLE "Donation";
ALTER TABLE "new_Donation" RENAME TO "Donation";
CREATE TABLE "new_Reservation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" INTEGER NOT NULL,
    "donationId" INTEGER NOT NULL,
    "collectionDate" DATETIME NOT NULL,
    "collectionTimeSlot" TEXT NOT NULL,
    "collectionStatus" TEXT NOT NULL,
    "remarks" TEXT,
    CONSTRAINT "Reservation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Reservation_donationId_fkey" FOREIGN KEY ("donationId") REFERENCES "Donation" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Reservation" ("createdAt", "id", "updatedAt", "userId") SELECT "createdAt", "id", "updatedAt", "userId" FROM "Reservation";
DROP TABLE "Reservation";
ALTER TABLE "new_Reservation" RENAME TO "Reservation";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
