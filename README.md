# projet_complet_archivage

Application de gestion des archives et des titres de perception de la DGRAD.

## Contenu du projet

- `backend/` : API Laravel 8 (archives, titres de perception, utilisateurs, rôles, permissions, OCR, audit).
- `Frontend/` : application React/Vite avec les espaces Archivage ordinaire, Titres de perception, Administration et Recherche OCR.
- `ocr/` : service Python Flask pour l'extraction de texte OCR.

## Fonctionnalités principales

- Gestion des archives ordinaires : références, classement, divisions, classeurs, emplacements et pièces jointes PDF.
- Gestion des titres de perception : catégories, assujettis, montants, centres d'ordonnancement et validation.
- Recherche OCR dans les documents numérisés, limitée au périmètre de divisions de l'utilisateur.
- Gestion multi-divisions : division principale, divisions supplémentaires et accès à toute une direction.
- Rôles, permissions, journal d'audit et tableaux de bord dédiés.

## Installation

### Backend

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan serve
```

### Frontend

```bash
cd Frontend
npm install
npm run dev
```

Configurer `VITE_API_URL` dans les fichiers `.env` du frontend selon l'environnement.

### Service OCR

Le backend utilise par défaut le service OCR local sur `http://127.0.0.1:5000`.

```bash
cd ocr
pip install -r requirements.txt
python app.py
```

Sous Windows, vous pouvez aussi double-cliquer sur `ocr/start_ocr.bat`.

Variables backend correspondantes :

```env
FLASK_OCR_URL=http://127.0.0.1:5000/api/ocr
FLASK_OCR_BATCH_URL=http://127.0.0.1:5000/api/ocr-batch
FLASK_OCR_TOKEN=ocr_secret_token_2026
```

## Remarque

Les fichiers `.env`, les dépendances (`vendor`, `node_modules`), les builds et les caches ne sont pas versionnés.
