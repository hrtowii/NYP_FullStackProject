-- CreateTable
CREATE TABLE "Event" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "dates" DATETIME NOT NULL,
    "donatorId" INTEGER NOT NULL,
    CONSTRAINT "Event_donatorId_fkey" FOREIGN KEY ("donatorId") REFERENCES "Donator" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
