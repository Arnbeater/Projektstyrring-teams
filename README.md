# Projektstyrring-teams

Projektstyringsværktøj til teams bygget i React + Firebase.

## Kom i gang

```bash
npm install
cp .env.example .env
npm run dev
```

Appen kører som Vite-devserver på den viste lokale URL (typisk `http://localhost:5173`).

## Miljøvariabler

Firebase-konfiguration læses fra `VITE_*` variabler i `.env`:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID`

Hvis `VITE_FIREBASE_API_KEY` mangler, kører appen i demo/offline mode.

## Scripts

- `npm run dev` – udviklingsserver
- `npm run build` – produktionsbuild
- `npm run preview` – preview af build

## Struktur

```text
src/
  App.jsx                # applikationsflow og views
  config/firebase.js     # Firebase init + runtime-konfiguration
  constants/project.js   # domænekonstanter
  utils/date.js          # dato- og tidslinjehelpers
  styles/appCss.js       # global stylestring brugt i appen
```

## Deploy

Projektet deployer automatisk via GitHub Actions på push til `main`.


## Hvis der er merge conflict

Kør disse kommandoer lokalt for at opdatere din branch med `main` og løse konflikter før merge:

```bash
git fetch origin
git checkout <din-branch>
git rebase origin/main
# løs konflikter i filer
git add <filer>
git rebase --continue
git push --force-with-lease
```

Alternativt kan du bruge merge i stedet for rebase:

```bash
git fetch origin
git checkout <din-branch>
git merge origin/main
git push
```
