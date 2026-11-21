# Site bellea.store

Site vitrine de l'application Bellea. Il ne vend rien : chaque page mène vers
l'application sur Google Play.

## Pages

| Adresse | Contenu |
|---|---|
| `/` | Page d'accueil (landing page) |
| `/produits/` | Catalogue soins et parfums, avec recherche et filtre par marque |
| `/produit/<id>/` | Fiche d'un soin (id = document de la collection `produit`) |
| `/parfum/<id>/` | Fiche d'un parfum (id = document de la collection `Parfum`) |
| `/test-peau/` | Test « Quel est mon type de peau ? » (8 questions, mêmes calculs que l'app) avec les soins adaptés du catalogue |
| `/pharmaciens/` | Dr. Soumia et Dr. Fodil |
| `/livraison/` | Livraison et paiement |
| `/faq/` | Questions fréquentes |
| `/ar/…` | Les mêmes pages en arabe (de droite à gauche) |

Les fiches produit sont générées à partir de Firebase **au moment de la
construction**. Les visiteurs ne déclenchent donc aucune lecture Firestore.

## Commandes

```bash
npm install
npm run build           # lit le catalogue dans Firebase et génère dist/
npm run build:exemple   # version d'exemple (5 produits tirés des captures), sans réseau
npm run preview         # aperçu local sur http://localhost:4173
npm run deploy          # build + mise en ligne sur Firebase Hosting
```

Relancez `npm run deploy` après chaque changement de prix ou de produits.
Une fois par semaine suffit en général.

## Mise en ligne avec GitHub Pages (recommandé)

Le fichier `.github/workflows/deploy.yml` met le site en ligne tout seul :
à chaque envoi sur `main`, chaque lundi pour mettre à jour les prix, et à la
demande depuis l'onglet Actions. Les étapes sont détaillées dans la
conversation. En résumé : un dépôt public, Settings > Pages > Source
« GitHub Actions », domaine `bellea.store`, puis les DNS chez le registraire.

## Mise en ligne avec Firebase Hosting (autre option)

1. Dans la console Firebase du projet `dercomia-c300b` : Hosting, puis
   « Ajouter un site », avec le nom `bellea-store`.
2. Hosting, puis « Ajouter un domaine personnalisé » : `bellea.store` et
   `www.bellea.store`. Recopiez chez votre registraire de domaine les
   enregistrements DNS indiqués.
3. Depuis ce dossier : `firebase login`, puis `npm run deploy`.

## Liens qui ouvrent l'application (App Links)

Le fichier `/.well-known/assetlinks.json` est déjà publié par le site. Il reste
deux choses à faire :

1. **Empreinte de signature.** Dans la Play Console : Test et publication, puis
   Intégrité de l'application, puis Signature d'application. Copiez l'empreinte
   SHA-256 de la clé de signature et collez-la dans `scripts/build.mjs`, à la
   place de `REMPLACER_PAR_EMPREINTE_SHA256_PLAY_CONSOLE`.
2. **Application.** Voir `MODIFICATIONS-APP.md`.

En attendant, les boutons « Commander dans l'app » ouvrent la fiche Google Play.
Rien n'est cassé.

## À compléter

- **Photos des pharmaciens** : déposez `dr-soumia.webp` et `dr-fodil.webp` dans
  `src/img/`. Dans `scripts/build.mjs`, fonction `teamHtml`, remplacez la lettre
  par la balise `<img>` indiquée en commentaire.
- **Contacts** (WhatsApp, Instagram, Facebook, TikTok, e-mail) : l'emplacement
  est marqué dans le pied de page de `scripts/build.mjs`.
- **CGU** : elles pointent encore vers belleaapp.github.io. Vous pouvez les
  ajouter comme page du site.
- **Mesure** : le lien Google Play contient la page d'origine (`utm_medium`),
  visible dans la Play Console, rubrique Acquisition.

## Fichiers

- `scripts/textes.mjs` : **tous les textes du site, en français et en arabe**. Pour changer une phrase, modifiez-la ici dans les deux langues.
- `scripts/quiz.mjs` : questions et résultats du test de peau (copie de `lib/qst/widgets/skin_type_quiz.dart` de l'app : modifier les deux ensemble).
- `scripts/build.mjs` : génération des pages (mise en page commune, carrousels, fiches produit, réglages).
- `src/site.css`, `src/site.js` : styles et comportements.
- `src/img`, `src/fonts` : images, logos, polices PT Serif et Inter (hébergées sur le site).
- `firebase.json` : configuration de l'hébergement.
