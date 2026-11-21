// Tous les textes du site, en français et en arabe.
// Pour modifier une phrase : changez-la ici, dans les deux langues.
// `h` donne les outils de mise en forme (prix, seuil de livraison…).

export const LANGS = ['fr', 'ar'];

export function textes(lang, h) {
  const free = h.da(h.freeShipping);
  return lang === 'ar' ? ar(h, free) : fr(h, free);
}

// ---------------------------------------------------------------------------
// Français
// ---------------------------------------------------------------------------
function fr(h, free) {
  return {
    lang: 'fr', dir: 'ltr', ogLocale: 'fr_DZ', otherLang: 'العربية', otherLangCode: 'ar',
    skip: 'Aller au contenu', menuOpen: 'Ouvrir le menu', menuClose: 'Fermer le menu', home: 'Bellea, accueil',
    nav: [['/produits/', 'Catalogue'], ['/test-peau/', 'Test de peau'], ['/pharmaciens/', 'Les pharmaciens'], ['/livraison/', 'Livraison']],
    ctaHeader: "Télécharger l'app",
    sticky: { title: 'Bellea', sub: 'Gratuit sur Google Play', btn: 'Installer' },

    footer: {
      tagline: "Dermo-cosmétique et parfums d'origine, choisis par des pharmaciens. Commandez dans l'application.",
      site: 'Le site', app: "L'application",
      links: [['/produits/', 'Catalogue des soins'], ['/produits/?type=parfum', 'Catalogue des parfums'], ['/test-peau/', 'Test de type de peau'], ['/pharmaciens/', 'Les pharmaciens'], ['/livraison/', 'Livraison et paiement'], ['/faq/', 'Questions fréquentes']],
      play: 'Bellea sur Google Play', cgu: 'CGU et confidentialité', del: 'Supprimer mon compte',
      bottom: 'Application Android, boutique 100 % en ligne',
    },

    home: {
      title: "Bellea : soins et parfums d'origine, conseillés par des pharmaciens",
      desc: "Dermo-cosmétique et parfums achetés en Europe, choisis par des pharmaciens. Satisfait ou remboursé, livraison dans toutes les wilayas, paiement à la livraison.",
      h1: 'Vos soins et parfums, choisis par des pharmaciens.',
      lead: "Produits d'origine européenne. Livraison dans toutes les wilayas, paiement à la livraison.",
      cta: "Télécharger l'app", ctaAlt: 'Voir les produits', note: 'Gratuit, sur Android',
      chips: ["Produits d'origine", 'Satisfait ou remboursé', 'Paiement à la livraison'],
      promo: { h: 'En promotion', sub: 'Les offres du moment, dans l’app' },
      soins: { h: 'Soins dermo-cosmétiques', link: 'Tout voir' },
      parfums: { h: 'Parfums', sub: 'En flacon entier ou au millilitre', link: 'Tout voir' },
      prev: 'Précédent', next: 'Suivant',
      app: {
        h: "Tout se passe dans l'app.",
        sub: 'Catalogue, conseil, commande et fidélité, au même endroit.',
        shots: [
          ['ecran-boutique', 'Filtrez par objectif et type de peau', "Écran Boutique de l'application : filtres par marque, objectif et type de peau"],
          ['ecran-fiche-soin', "Mode d'emploi, stock et points fidélité", "Fiche d'un soin dans l'application"],
          ['ecran-parfums', 'Les parfums par marque et version', "Écran Parfums de l'application"],
          ['ecran-fiche-parfum', 'En flacon entier ou au millilitre', "Fiche d'un parfum dans l'application, achat entier ou au millilitre"],
        ],
      },
      origin: {
        h: "Des produits d'origine, garantis.",
        items: [
          ['Choisis par des pharmaciens', 'Chaque produit est sélectionné par Dr. Soumia et Dr. Fodil.'],
          ['Achetés en Europe', 'En pharmacies et grandes surfaces européennes.'],
          ['Traçabilité garantie', 'Zéro risque de contrefaçon.'],
          ['Satisfait ou remboursé', 'Et un cadeau en plus.'],
        ],
      },
      conseil: {
        h: 'Votre routine, par un pharmacien.',
        steps: ['Décrivez votre peau, photos à l’appui.', 'Recevez une routine matin, soir et semaine.', 'Ajoutez-la au panier en un geste.'],
        cta: 'Demander ma routine',
        quiz: 'Faire le test de peau (1 min)',
        card: {
          label: "Exemple de réponse dans l'application : une routine matin, soir et chaque semaine",
          title: 'Votre routine personnalisée', by: 'Réponse de votre pharmacienne', initial: 'S',
          am: 'Matin', pm: 'Soir', week: 'Chaque semaine',
          amSteps: [['Nettoyant doux'], ['Sérum ciblé'], ['Écran solaire', 'SPF 50']],
          pmSteps: [['Démaquillant'], ['Crème de nuit']],
          weekSteps: [['Exfoliant', '1 à 2 fois']],
          cart: 'Ajouter toute ma routine au panier',
        },
      },
      team: { h: 'Vos pharmaciens' },
      order: [
        ['Toutes les wilayas', 'À domicile ou au bureau de livraison.'],
        ['Paiement à la livraison', 'Vous payez à la réception du colis.'],
        ['Livraison offerte', `Dès ${free} d'achat.`],
      ],
      faq: { h: 'Vos questions', link: 'Toutes les questions' },
      final: { h: 'Bellea est sur Google Play.', p: 'Téléchargez l’app et posez votre première question à un pharmacien.', btn: 'Télécharger sur Google Play', qr: 'Scannez avec votre téléphone' },
      phonesAlt: ["Écran Parfums de l'application Bellea", "Fiche produit dans l'application Bellea"],
    },

    team: [
      { name: 'Dr. Soumia', initial: 'S', role: 'Pharmacienne diplômée, spécialisée en dermocosmétique', bio: 'Elle vous conseille et vous accompagne dans le choix des soins adaptés à votre peau.' },
      { name: 'Dr. Fodil', initial: 'F', role: 'Pharmacien diplômé', bio: "« Passionné par le domaine médical et la dermocosmétique, je mets mes connaissances au service du conseil et de l'accompagnement en santé et soins de la peau. »" },
    ],

    faq: [
      ['Peut-on commander sur le site ?', "Non. Le site présente le catalogue. Les commandes se font dans l'application Bellea, gratuite sur Google Play."],
      ['Les produits sont-ils authentiques ?', 'Oui. Nos pharmaciens les achètent en Europe, en pharmacies et en grandes surfaces. La traçabilité est garantie : aucun risque de contrefaçon.'],
      ['Comment je paie ?', 'À la livraison : vous payez le livreur quand vous recevez votre colis.'],
      ['Et si je ne suis pas satisfait ?', "Vous êtes remboursé, avec un cadeau en plus. Écrivez-nous depuis l'application."],
      ['Comment se passe la livraison ?', `Bellea livre dans toutes les wilayas d'Algérie, à domicile ou au bureau de la société de livraison. Nous travaillons avec plusieurs sociétés : les frais dépendent de votre wilaya et de la société, et s'affichent avant de valider la commande. La livraison est offerte dès ${free} d'achat.`],
      ['Qui répond à mes questions sur ma peau ?', "Dr. Soumia et Dr. Fodil, pharmaciens. Dans l'onglet Conseils de l'application, vous décrivez votre peau, ajoutez des photos si vous le souhaitez, et recevez une réponse avec une routine adaptée."],
      ['Peut-on acheter un parfum au millilitre ?', "Oui, pour les parfums qui le proposent. Sur la fiche du parfum dans l'app, choisissez « Achat au ml »."],
      ['Comment marchent les points fidélité ?', "Chaque produit affiche les points qu'il rapporte. Ils sont ajoutés à votre compte à la livraison, et vous les échangez contre des produits dans la Boutique fidélité."],
      ["L'application existe-t-elle sur iPhone ?", 'Pas encore. Bellea est disponible sur Android, via Google Play.'],
      ['Avez-vous une boutique physique ?', "Pas pour le moment. Bellea est une boutique 100 % en ligne : tout se passe dans l'application."],
    ],
    faqHome: [0, 1, 2, 3],

    catalogue: {
      title: 'Catalogue : dermo-cosmétique et parfums | Bellea',
      desc: "Tous les soins de dermo-cosmétique et parfums de Bellea, avec leurs prix. Commande dans l'application, livraison dans toutes les wilayas.",
      h1: 'Le catalogue Bellea', sub: "Consultez les produits ici, commandez-les dans l'application.",
      tabsLabel: 'Type de produit', soins: 'Soins', parfums: 'Parfums',
      search: 'Rechercher un produit ou une marque', searchLabel: 'Rechercher un produit', brand: 'Marque', allBrands: 'Toutes les marques',
      one: '1 produit', many: '{n} produits',
      emptyT: 'Aucun produit ne correspond.', emptyD: 'Essayez un autre mot ou une autre marque.', reset: 'Effacer la recherche',
    },

    product: {
      soins: 'Soins', parfums: 'Parfums', crumbs: "Fil d'Ariane",
      cta: "Commander dans l'app", ctaShort: "Commander dans l'app",
      buy: ['Produit d’origine, acheté en Europe', 'Satisfait ou remboursé', `Livraison dans toutes les wilayas, offerte dès ${free}`, 'Paiement à la livraison'],
      askT: 'Une question sur ce produit ?', askD: "Est-il adapté à votre peau ? Comment l'utiliser ? Un pharmacien vous répond dans l'application.",
      points: (n) => `+${n} points fidélité`,
      sections: ['Description', "Mode d'emploi", 'Ingrédients'],
      related: (b) => `Aussi chez ${b}`, others: (k) => `D'autres ${k.toLowerCase()}`,
      auMl: 'Disponible au ml', unit: (u) => u || 'ml',
      metaFallback: "Produit d'origine, choisi par des pharmaciens. Commandez-le dans l'application Bellea : livraison dans toutes les wilayas, paiement à la livraison.",
    },

    pages: {
      pharmaciens: {
        title: 'Les pharmaciens de Bellea : Dr. Soumia et Dr. Fodil',
        desc: "Dr. Soumia, pharmacienne spécialisée en dermocosmétique, et Dr. Fodil, pharmacien, choisissent les produits et vous conseillent dans l'application Bellea.",
        h1: 'Les pharmaciens de Bellea',
        sub: "Ils choisissent chaque produit du catalogue et vous conseillent, dans l'application.",
        doH: "Ce qu'ils font pour vous",
        doList: [
          'Ils sélectionnent les produits, achetés en Europe en pharmacies et grandes surfaces.',
          'Ils répondent à vos questions sur un produit : adapté à votre peau, utilisation, compatibilité.',
          'Ils lisent vos consultations, avec vos photos, et vous proposent une routine matin, soir et semaine.',
          'Ils prennent de vos nouvelles à 14 et 30 jours pour ajuster la routine.',
        ],
        callout: "Posez votre première question dans l'application.",
      },
      livraison: {
        title: 'Livraison dans toutes les wilayas et paiement à la livraison | Bellea',
        desc: `Bellea livre dans toutes les wilayas d'Algérie, à domicile ou au bureau. Paiement à la livraison, satisfait ou remboursé, livraison offerte dès ${free}.`,
        h1: 'Livraison et paiement',
        sub: "Vous commandez dans l'application, nous livrons dans toutes les wilayas, vous payez à la réception.",
        blocks: [
          ['Où livrons-nous ?', ["Dans toutes les wilayas d'Algérie, au choix :", ['<strong>À domicile</strong> : le livreur vous apporte le colis.', '<strong>Au bureau</strong> : vous récupérez le colis au bureau de la société de livraison.']]],
          ['Combien coûte la livraison ?', ['Nous travaillons avec plusieurs sociétés de livraison : les frais dépendent de votre wilaya et de la société, et s’affichent dans l’application avant de valider.', `La livraison est <strong>offerte dès ${free} d'achat</strong>.`]],
          ['Comment payer ?', ['À la livraison, au livreur, quand vous recevez votre colis.']],
          ['Satisfait ou remboursé', ["Si un produit ne vous convient pas, vous êtes remboursé, avec un cadeau en plus. Écrivez-nous depuis l'application."]],
          ['Suivre sa commande', ['La rubrique « Mes commandes » de l’application montre où en est chaque commande.']],
        ],
        callout: "Le catalogue complet et la commande sont dans l'application.",
      },
      quiz: {
        title: 'Test : quel est mon type de peau ? | Bellea',
        desc: 'Découvrez votre type de peau en 8 questions et 1 minute, avec les soins adaptés choisis par des pharmaciens.',
        h1: 'Quel est mon type de peau ?',
        sub: '8 questions, 1 minute. Les mêmes que dans l’app Bellea.',
        progress: 'Question {i} sur {n}', back: 'Retour', restart: 'Refaire le test',
        resultH: 'Votre type de peau',
        sensitive: 'Tendance sensible : préférez des soins sans parfum et testez chaque nouveau produit sur une petite zone.',
        productsH: 'Des soins adaptés',
        ctaH: 'Recevez votre routine complète',
        ctaP: 'Un pharmacien la compose pour votre peau : matin, soir et chaque semaine. Gratuit dans l’app Bellea.',
        ctaBtn: 'Recevoir ma routine dans l’app',
        note: 'Résultat indicatif : le pharmacien l’affine avec vos photos dans l’application.',
        noscript: 'Activez JavaScript pour faire le test, ou faites-le directement dans l’application Bellea.',
      },
      faq: { title: 'Questions fréquentes | Bellea', desc: "Commande, authenticité, livraison, paiement, satisfait ou remboursé, conseils de pharmaciens : les réponses sur l'application Bellea.", h1: 'Questions fréquentes', sub: "L'essentiel en quelques lignes.", callout: "Une autre question ? Posez-la à un pharmacien dans l'application." },
      notFound: { title: 'Page introuvable | Bellea', h1: "Cette page n'existe pas ou plus.", p: 'Le produit a peut-être été retiré du catalogue.', btn: 'Voir le catalogue' },
    },
  };
}

// ---------------------------------------------------------------------------
// العربية
// ---------------------------------------------------------------------------
function ar(h, free) {
  return {
    lang: 'ar', dir: 'rtl', ogLocale: 'ar_DZ', otherLang: 'Français', otherLangCode: 'fr',
    skip: 'انتقل إلى المحتوى', menuOpen: 'فتح القائمة', menuClose: 'إغلاق القائمة', home: 'Bellea، الصفحة الرئيسية',
    nav: [['/produits/', 'الكتالوج'], ['/test-peau/', 'اختبار البشرة'], ['/pharmaciens/', 'الصيادلة'], ['/livraison/', 'التوصيل']],
    ctaHeader: 'حمّل التطبيق',
    sticky: { title: 'Bellea', sub: 'مجاني على Google Play', btn: 'تثبيت' },

    footer: {
      tagline: 'مستحضرات تجميل جلدية وعطور أصلية يختارها صيادلة. اطلب من التطبيق.',
      site: 'الموقع', app: 'التطبيق',
      links: [['/produits/', 'كتالوج العناية'], ['/produits/?type=parfum', 'كتالوج العطور'], ['/test-peau/', 'اختبار نوع البشرة'], ['/pharmaciens/', 'الصيادلة'], ['/livraison/', 'التوصيل والدفع'], ['/faq/', 'الأسئلة الشائعة']],
      play: 'Bellea على Google Play', cgu: 'الشروط وسياسة الخصوصية', del: 'حذف حسابي',
      bottom: 'تطبيق أندرويد، متجر إلكتروني 100%',
    },

    home: {
      title: 'Bellea: منتجات عناية وعطور أصلية بنصيحة صيادلة',
      desc: 'مستحضرات تجميل جلدية وعطور مشتراة من أوروبا يختارها صيادلة. راضٍ أو نُرجع أموالك، توصيل إلى جميع الولايات والدفع عند الاستلام.',
      h1: 'منتجات العناية والعطور، يختارها لك صيادلة.',
      lead: 'منتجات أصلية من أوروبا. توصيل إلى جميع الولايات والدفع عند الاستلام.',
      cta: 'حمّل التطبيق', ctaAlt: 'شاهد المنتجات', note: 'مجاني على أندرويد',
      chips: ['منتجات أصلية', 'راضٍ أو نُرجع أموالك', 'الدفع عند الاستلام'],
      promo: { h: 'تخفيضات', sub: 'عروض الوقت الحالي في التطبيق' },
      soins: { h: 'منتجات العناية بالبشرة', link: 'عرض الكل' },
      parfums: { h: 'العطور', sub: 'قارورة كاملة أو بالمليلتر', link: 'عرض الكل' },
      prev: 'السابق', next: 'التالي',
      app: {
        h: 'كل شيء يتم في التطبيق.',
        sub: 'الكتالوج والنصيحة والطلب والوفاء، في مكان واحد.',
        shots: [
          ['ecran-boutique', 'تصفية حسب الهدف ونوع البشرة', 'شاشة المتجر في التطبيق: تصفية حسب العلامة والهدف ونوع البشرة'],
          ['ecran-fiche-soin', 'طريقة الاستعمال والمخزون ونقاط الوفاء', 'صفحة منتج عناية في التطبيق'],
          ['ecran-parfums', 'العطور حسب العلامة والنوع', 'شاشة العطور في التطبيق'],
          ['ecran-fiche-parfum', 'قارورة كاملة أو بالمليلتر', 'صفحة عطر في التطبيق، شراء كامل أو بالمليلتر'],
        ],
      },
      origin: {
        h: 'منتجات أصلية ومضمونة.',
        items: [
          ['يختارها صيادلة', 'كل منتج تختاره الدكتورة سمية والدكتور فضيل.'],
          ['مشتراة من أوروبا', 'من صيدليات ومتاجر كبرى أوروبية.'],
          ['تتبّع مضمون', 'لا خطر للتقليد إطلاقًا.'],
          ['راضٍ أو نُرجع أموالك', 'مع هدية إضافية.'],
        ],
      },
      conseil: {
        h: 'روتينك، من صيدلي.',
        steps: ['صِف بشرتك وأرفق صورًا.', 'استلم روتينًا للصباح والمساء وكل أسبوع.', 'أضفه إلى السلة بلمسة واحدة.'],
        cta: 'اطلب روتيني',
        quiz: 'قم باختبار البشرة (دقيقة واحدة)',
        card: {
          label: 'مثال على رد في التطبيق: روتين للصباح والمساء وكل أسبوع',
          title: 'روتينك الشخصي', by: 'رد الصيدلانية', initial: 'س',
          am: 'الصباح', pm: 'المساء', week: 'كل أسبوع',
          amSteps: [['غسول لطيف'], ['سيروم مخصص'], ['واقي شمس', 'SPF 50']],
          pmSteps: [['مزيل مكياج'], ['كريم ليلي']],
          weekSteps: [['مقشّر', 'مرة أو مرتين']],
          cart: 'أضف روتيني كاملًا إلى السلة',
        },
      },
      team: { h: 'صيادلتك' },
      order: [
        ['جميع الولايات', 'إلى المنزل أو مكتب شركة التوصيل.'],
        ['الدفع عند الاستلام', 'تدفع عند استلام طردك.'],
        ['توصيل مجاني', `ابتداءً من ${free}.`],
      ],
      faq: { h: 'أسئلتكم', link: 'كل الأسئلة' },
      final: { h: 'Bellea على Google Play.', p: 'حمّل التطبيق واطرح سؤالك الأول على صيدلي.', btn: 'حمّل من Google Play', qr: 'امسح الرمز بهاتفك' },
      phonesAlt: ['شاشة العطور في تطبيق Bellea', 'صفحة منتج في تطبيق Bellea'],
    },

    team: [
      { name: 'الدكتورة سمية', initial: 'س', role: 'صيدلانية مختصة في مستحضرات التجميل الجلدية', bio: 'تنصحك وترافقك في اختيار العناية المناسبة لبشرتك.' },
      { name: 'الدكتور فضيل', initial: 'ف', role: 'صيدلي', bio: '«شغوف بالمجال الطبي ومستحضرات التجميل الجلدية، أضع معارفي في خدمة النصيحة والمرافقة في الصحة والعناية بالبشرة.»' },
    ],

    faq: [
      ['هل يمكن الطلب من الموقع؟', 'لا. الموقع يعرض الكتالوج، والطلب يتم من تطبيق Bellea المجاني على Google Play.'],
      ['هل المنتجات أصلية؟', 'نعم. يشتريها صيادلتنا من أوروبا، من الصيدليات والمتاجر الكبرى. التتبّع مضمون: لا خطر للتقليد.'],
      ['كيف يتم الدفع؟', 'عند الاستلام: تدفع للموزّع عندما تستلم طردك.'],
      ['وإن لم أكن راضيًا؟', 'نُرجع لك أموالك مع هدية إضافية. راسلنا من التطبيق.'],
      ['كيف يتم التوصيل؟', `نوصل إلى جميع ولايات الجزائر، إلى المنزل أو مكتب شركة التوصيل. نتعامل مع عدة شركات، لذا تختلف التكلفة حسب ولايتك والشركة، وتظهر قبل تأكيد الطلب. التوصيل مجاني ابتداءً من ${free}.`],
      ['من يجيب عن أسئلتي حول بشرتي؟', 'الدكتورة سمية والدكتور فضيل، صيادلة. في قسم «استشارات» بالتطبيق، تصف بشرتك وتضيف صورًا إن شئت، وتستلم ردًا مع روتين مناسب.'],
      ['هل يمكن شراء عطر بالمليلتر؟', 'نعم، للعطور التي توفر ذلك. اختر «الشراء بالمليلتر» في صفحة العطر بالتطبيق.'],
      ['كيف تعمل نقاط الوفاء؟', 'كل منتج يعرض النقاط التي يمنحها. تُضاف إلى حسابك عند التوصيل، وتستبدلها بمنتجات في متجر الوفاء.'],
      ['هل التطبيق متوفر على آيفون؟', 'ليس بعد. Bellea متوفر على أندرويد عبر Google Play.'],
      ['هل لديكم متجر فعلي؟', 'ليس حاليًا. Bellea متجر إلكتروني 100%: كل شيء يتم في التطبيق.'],
    ],
    faqHome: [0, 1, 2, 3],

    catalogue: {
      title: 'الكتالوج: مستحضرات التجميل الجلدية والعطور | Bellea',
      desc: 'كل منتجات العناية الجلدية والعطور في Bellea مع أسعارها. الطلب من التطبيق والتوصيل إلى جميع الولايات.',
      h1: 'كتالوج Bellea', sub: 'تصفّح المنتجات هنا واطلبها من التطبيق.',
      tabsLabel: 'نوع المنتج', soins: 'العناية', parfums: 'العطور',
      search: 'ابحث عن منتج أو علامة', searchLabel: 'ابحث عن منتج', brand: 'العلامة', allBrands: 'كل العلامات',
      one: 'منتج واحد', many: '{n} منتج',
      emptyT: 'لا يوجد منتج مطابق.', emptyD: 'جرّب كلمة أو علامة أخرى.', reset: 'مسح البحث',
    },

    product: {
      soins: 'العناية', parfums: 'العطور', crumbs: 'مسار التصفح',
      cta: 'اطلب من التطبيق', ctaShort: 'اطلب من التطبيق',
      buy: ['منتج أصلي مشترى من أوروبا', 'راضٍ أو نُرجع أموالك', `توصيل إلى جميع الولايات، مجاني ابتداءً من ${free}`, 'الدفع عند الاستلام'],
      askT: 'سؤال حول هذا المنتج؟', askD: 'هل يناسب بشرتك؟ كيف تستعمله؟ يجيبك صيدلي في التطبيق.',
      points: (n) => `+${n} نقطة وفاء`,
      sections: ['الوصف', 'طريقة الاستعمال', 'المكونات'],
      related: (b) => `أيضًا من ${b}`, others: () => 'منتجات أخرى',
      auMl: 'متوفر بالمليلتر', unit: (u) => (!u || u === 'ml' ? 'مل' : u),
      metaFallback: 'منتج أصلي يختاره صيادلة. اطلبه من تطبيق Bellea: توصيل إلى جميع الولايات والدفع عند الاستلام.',
    },

    pages: {
      pharmaciens: {
        title: 'صيادلة Bellea: الدكتورة سمية والدكتور فضيل',
        desc: 'الدكتورة سمية، صيدلانية مختصة في مستحضرات التجميل الجلدية، والدكتور فضيل، صيدلي، يختاران المنتجات وينصحانك في تطبيق Bellea.',
        h1: 'صيادلة Bellea',
        sub: 'يختارون كل منتج في الكتالوج وينصحونك داخل التطبيق.',
        doH: 'ماذا يقدّمون لك',
        doList: [
          'يختارون المنتجات، المشتراة من أوروبا من الصيدليات والمتاجر الكبرى.',
          'يجيبون عن أسئلتك حول منتج: هل يناسب بشرتك، طريقة استعماله، توافقه مع روتينك.',
          'يقرؤون استشاراتك مع صورك، ويقترحون روتينًا للصباح والمساء وكل أسبوع.',
          'يطمئنون عليك بعد 14 و30 يومًا لتعديل الروتين.',
        ],
        callout: 'اطرح سؤالك الأول في التطبيق.',
      },
      livraison: {
        title: 'التوصيل إلى جميع الولايات والدفع عند الاستلام | Bellea',
        desc: `Bellea يوصل إلى جميع ولايات الجزائر، إلى المنزل أو المكتب. الدفع عند الاستلام، راضٍ أو نُرجع أموالك، توصيل مجاني ابتداءً من ${free}.`,
        h1: 'التوصيل والدفع',
        sub: 'تطلب من التطبيق، نوصل إلى جميع الولايات، وتدفع عند الاستلام.',
        blocks: [
          ['إلى أين نوصل؟', ['إلى جميع ولايات الجزائر، حسب اختيارك:', ['<strong>إلى المنزل</strong>: يحضر الموزّع الطرد إليك.', '<strong>إلى المكتب</strong>: تستلم الطرد من مكتب شركة التوصيل.']]],
          ['كم تكلفة التوصيل؟', ['نتعامل مع عدة شركات توصيل: تختلف التكلفة حسب ولايتك والشركة، وتظهر في التطبيق قبل تأكيد الطلب.', `التوصيل <strong>مجاني ابتداءً من ${free}</strong>.`]],
          ['كيف أدفع؟', ['عند الاستلام، للموزّع، عندما تستلم طردك.']],
          ['راضٍ أو نُرجع أموالك', ['إذا لم يناسبك منتج، نُرجع لك أموالك مع هدية إضافية. راسلنا من التطبيق.']],
          ['متابعة الطلب', ['قسم «طلباتي» في التطبيق يبيّن حالة كل طلب.']],
        ],
        callout: 'الكتالوج الكامل والطلب في التطبيق.',
      },
      quiz: {
        title: 'اختبار: ما هو نوع بشرتي؟ | Bellea',
        desc: 'اكتشف نوع بشرتك في 8 أسئلة ودقيقة واحدة، مع منتجات العناية المناسبة التي يختارها صيادلة.',
        h1: 'ما هو نوع بشرتي؟',
        sub: '8 أسئلة، دقيقة واحدة. نفس أسئلة تطبيق Bellea.',
        progress: 'السؤال {i} من {n}', back: 'رجوع', restart: 'أعد الاختبار',
        resultH: 'نوع بشرتك',
        sensitive: 'ميل إلى الحساسية: اختر منتجات بدون عطر وجرّب كل منتج جديد على منطقة صغيرة.',
        productsH: 'منتجات عناية مناسبة',
        ctaH: 'استلم روتينك الكامل',
        ctaP: 'يعدّه لك صيدلي حسب بشرتك: الصباح والمساء وكل أسبوع. مجانًا في تطبيق Bellea.',
        ctaBtn: 'استلم روتيني في التطبيق',
        note: 'نتيجة تقريبية: يدقّقها الصيدلي بصورك في التطبيق.',
        noscript: 'فعّل JavaScript لإجراء الاختبار، أو قم به مباشرة في تطبيق Bellea.',
      },
      faq: { title: 'الأسئلة الشائعة | Bellea', desc: 'الطلب، أصالة المنتجات، التوصيل، الدفع، استرجاع المال، نصائح الصيادلة: كل الأجوبة حول تطبيق Bellea.', h1: 'الأسئلة الشائعة', sub: 'الأهم في بضعة أسطر.', callout: 'سؤال آخر؟ اطرحه على صيدلي في التطبيق.' },
      notFound: { title: 'الصفحة غير موجودة | Bellea', h1: 'هذه الصفحة غير موجودة.', p: 'ربما سُحب المنتج من الكتالوج.', btn: 'عرض الكتالوج' },
    },
  };
}
