# Modifications à faire dans l'app client

Objectif : un lien `https://bellea.store/produit/<id>/` partagé sur WhatsApp
ou Facebook doit **ouvrir l'app sur la fiche du produit** si elle est
installée. Sinon, il affiche la page du site, avec le bouton de téléchargement.

## 1. `android/app/src/main/AndroidManifest.xml`

Le filtre actuel (`bellea://bellea.com`) ne peut pas être vérifié par Android.
Ajoutez ce filtre à côté :

```xml
<intent-filter android:autoVerify="true">
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="https" android:host="bellea.store" />
    <data android:pathPrefix="/produit/" />
    <data android:pathPrefix="/parfum/" />
</intent-filter>
```

## 2. `lib/flutter_flow/nav/nav.dart`

Ajoutez deux routes qui redirigent vers les fiches existantes :

```dart
GoRoute(
  path: '/produit/:id',
  redirect: (context, state) =>
      '${ProduitDetailWidget.routePath}?productRef=${Uri.encodeComponent('produit/${state.pathParameters['id']}')}',
),
GoRoute(
  path: '/parfum/:id',
  redirect: (context, state) =>
      '${ParfumDetailWidget.routePath}?productRef=${Uri.encodeComponent('Parfum/${state.pathParameters['id']}')}',
),
```

Vérifiez que le format de `productRef` correspond à ce qu'attend
`params.getParam(..., ParamType.DocumentReference)` (dans FlutterFlow, c'est
le chemin du document).

**Attention :** ces fiches ont `requireAuth: true`. Un visiteur non connecté
sera envoyé vers la connexion. Si vous voulez qu'il voie la fiche d'abord,
passez `requireAuth` à `false` pour ces deux routes.

## 3. `lib/services/share_service.dart`

Aujourd'hui, le message de partage d'un produit contient seulement le lien
Google Play. Remplacez-le par le lien de la fiche sur le site :

```dart
'https://bellea.store/produit/${p.reference.id}/'   // soins
'https://bellea.store/parfum/${p.reference.id}/'    // parfums
```

Résultat : la personne qui reçoit le lien voit le produit, avec son prix et sa
photo dans l'aperçu WhatsApp. Elle arrive directement sur la fiche si elle a
l'app, sinon sur le site.

## 4. Test

```bash
adb shell am start -a android.intent.action.VIEW -d "https://bellea.store/produit/<id>/"
adb shell pm get-app-links com.pharmalium.bellea   # doit afficher "verified"
```

## Remarques vues en passant

- Sur la fiche soin, la marque apparaît deux fois (« THE ORDINARY · THE
  ORDINARY ») quand la gamme porte le même nom que la marque. Il suffit de
  masquer la gamme quand elle est identique.
- `android/key.properties` contient les mots de passe de signature et se
  trouvait dans l'archive envoyée. Ne le partagez pas et ne le versionnez pas.
- Le seuil de livraison offerte dans le code est de 15 000 DA, et non de
  10 000 DA comme l'indique l'ancienne note du projet. Le site affiche 15 000 DA.
