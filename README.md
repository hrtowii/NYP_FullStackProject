# CommuniFridge Fullstack Project
## Stack / Technologies used:
* Vite / React on frontend 
* Prisma ORM + SQLite on backend / database
* Docker
* KeyDB (Redis Fork) used for OTP email verification (temporary storage of codes)

## Running
npm i
0. Create a .env file with JWT_SECRET, RESEND_URL, and DATABASE_URL, and ANTHROPIC_API_KEY
1. Download Docker Desktop
2. docker compose up --build express # only runs backend
3. npm run dev # frontend

Else:
docker compose up --build #both

1. docker compose up --build redis
2. npm run backend
3. npm run dev


## Project structure
### src/*
* src/user directory: all the frontend pages for User (reservation, frontpage, making comments) are stored here
* src/donator directory: all the frontend pages for Donator (donation, frontpage, profile reviews) are stored here
* src/components: Make components here that you think are useful. for example Button, Navbar, Comment, Profile. -> Basically ANYTHING THAT CAN BE REUSED
* src/Landing/Login/Signup/About: Pages that are displayed when in the signed out state.

### prisma
* schema.prisma: models for our backend data is stored here. 
* Our data is all in dev.db as we are using SQLite.

## DBML visualisation
* Just paste the generated dbml file in prisma/dbml/ into dbdiagrams.io

## Todo:
-[x] Get a docker compose file to run everything in one shot so that it's easier to run
-[x] Set up Redis (or a fork of it) to set up email OTP storage.

## Iruss Eng Notes:
- when update prisma db must enter 'npx prisma migrate' cmd