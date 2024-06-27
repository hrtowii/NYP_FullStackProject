/*
  Warnings:

  - You are about to drop the column `dates` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `summary` on the `Event` table. All the data in the column will be lost.
  - Added the required column `briefSummary` to the `Event` table without a default value. This is not possible if the table is not empty.
  - Added the required column `emailAddress` to the `Event` table without a default value. This is not possible if the table is not empty.
  - Added the required column `endDate` to the `Event` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fullSummary` to the `Event` table without a default value. This is not possible if the table is not empty.
  - Added the required column `phoneNumber` to the `Event` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startDate` to the `Event` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Event" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "briefSummary" TEXT NOT NULL,
    "fullSummary" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "emailAddress" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "donatorId" INTEGER NOT NULL,
    CONSTRAINT "Event_donatorId_fkey" FOREIGN KEY ("donatorId") REFERENCES "Donator" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Event" ("donatorId", "id", "title") SELECT "donatorId", "id", "title" FROM "Event";
DROP TABLE "Event";
ALTER TABLE "new_Event" RENAME TO "Event";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
