FROM node:alpine

# Installer pnpm via npm
RUN npm install -g pnpm

# Créer dossier app
WORKDIR /app

# Copier les manifests
COPY package*.json ./

# Installer les dépendances avec pnpm
RUN pnpm install

# Copier le reste du code
COPY . .

# Démarrer l'app
CMD ["pnpm", "start"]
