# CommuniFridge Fullstack Project
## Stack / Technologies used:
* Vite / React on frontend 
* Prisma ORM + SQLite on backend / database
## Running
1. npm i
2. npx prisma migrate dev
3. npm run backend -> this runs on port 3000
4. in another terminal: npm run dev

## Project structure
### src/*
* src/user directory: all the frontend pages for User (reservation, frontpage, making comments) are stored here
* src/donator directory: all the frontend pages for Donator (donation, frontpage, profile reviews) are stored here
* src/components: Make components here that you think are useful. for example Button, Navbar, Comment, Profile. -> Basically ANYTHING THAT CAN BE REUSED
* src/Landing/Login/Signup/About: Pages that are displayed when in the signed out state.

### prisma
* schema.prisma: models for our backend data is stored here. our data is all in dev.db as we are using SQLite.

## DBML visualisation
* Just paste the generated dbml file in prisma/dbml/ into dbdiagrams.io