# Configuration de l’espace d’administration

Le site public présente des informations éducatives et des ressources officielles, avec des boutons WhatsApp et Telegram. L’espace admin sert à configurer leurs destinations. Seuls les comptes admin autorisés peuvent modifier les liens; les destinations enregistrées sont publiques afin que les visiteurs puissent utiliser les boutons.

1. Crée un projet Supabase, puis exécute [`supabase/schema.sql`](./supabase/schema.sql) dans le SQL Editor. Pour un projet déjà configuré, exécute le script mis à jour afin d’autoriser la lecture publique des destinations tout en réservant leur modification aux admins.
2. Dans Authentication, crée ton compte administrateur et désactive les inscriptions publiques.
   Choisis un mot de passe unique d’au moins 12 caractères. Active l’authentification multifacteur (MFA) dans Supabase si elle est disponible pour ton projet.
3. Récupère l’UUID de ton compte dans Authentication, puis ajoute-le comme admin dans le SQL Editor :

   ```sql
   insert into public.site_education_admins (user_id)
   values ('UUID-DE-TON-COMPTE');
   ```

4. Dans les paramètres API Supabase, copie l’URL du projet et la clé publique `anon`/publishable dans [`js/supabase-config.js`](./js/supabase-config.js). **Ne mets jamais la clé `service_role` dans le site.**
5. Héberge le dossier sur un domaine HTTPS. Pour Render, ajoute le dépôt Git contenant ces fichiers à GitHub, puis dans Render choisis **New > Blueprint** et connecte ce dépôt. Render lit le [`render.yaml`](./render.yaml) à la racine et publie ce site statique. Après le premier déploiement, note l’URL `onrender.com` affichée dans Render.
6. Clique trois fois rapidement sur le logo pour ouvrir `admin.html`, connecte-toi, puis saisis tes URLs WhatsApp (`wa.me` ou `whatsapp.com`) et Telegram (`t.me` ou `telegram.me`). Tous les boutons WhatsApp et Telegram du site utilisent les URLs enregistrées ici. Si un champ est vide, ses boutons restent visibles mais indiquent que le lien n’est pas encore configuré.

Dans l’administration, « Mot de passe oublié ? » envoie un lien de réinitialisation à l’adresse du compte. Le lien permet de choisir un nouveau mot de passe d’au moins 12 caractères. Configure une politique de mot de passe adaptée dans Supabase Authentication et utilise une phrase de passe longue, unique et conservée dans un gestionnaire de mots de passe.

Avant d’utiliser le formulaire d’administration sur Render, remplace les valeurs vides dans [`js/supabase-config.js`](./js/supabase-config.js) par l’URL du projet Supabase et sa clé publique `anon`/publishable. Dans Supabase Authentication > URL Configuration, définis l’URL du site Render comme **Site URL** et ajoute `https://URL-DU-SITE.onrender.com/admin.html` aux **Redirect URLs**. Ne copie pas littéralement l’exemple : utilise le nom d’hôte attribué à ton déploiement. Si tu ajoutes ensuite un domaine personnalisé, ajoute aussi son URL d’administration aux Redirect URLs.

Le triple-clic est un raccourci, pas une protection. Supabase Auth et les règles RLS réservent la modification des liens aux comptes explicitement autorisés. Les URLs enregistrées sont lisibles publiquement et ne doivent donc pas contenir d’informations privées.

Pour tester localement, sers le dossier par HTTP(S) plutôt que d’ouvrir les fichiers en `file://`, car les modules JavaScript et Supabase nécessitent une origine web.

## Référencement naturel (SEO)

La page publique inclut un titre et une description cohérents, des métadonnées Open Graph/Twitter, une langue déclarée et des données structurées pour le site et sa FAQ. La page d’administration est marquée `noindex, nofollow`.

Après le premier déploiement Render, ajoute l’URL de production à Google Search Console, vérifie sa propriété et demande l’indexation de la page publique. Un domaine public réel est nécessaire pour définir correctement une URL canonique, les URL de partage et un sitemap; ne remplace pas ces valeurs par des adresses fictives.
