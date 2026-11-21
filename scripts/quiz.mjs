// Test « Quel est mon type de peau ? » : mêmes questions, mêmes points et même
// calcul que dans l'app (lib/qst/widgets/skin_type_quiz.dart).
// Valeurs des produits (champ TypeDePeau dans Firebase) : Normal, Sèche, Grasse, Mixte.

const often = { fr: 'Souvent', ar: 'غالبًا', sens: 2 };
const sometimes = { fr: 'Parfois', ar: 'أحيانًا', sens: 1 };
const never = { fr: 'Rarement ou jamais', ar: 'نادرًا أو أبدًا' };

export const QUESTIONS = [
  {
    t: { fr: 'Le test du visage nu', ar: 'اختبار الوجه دون منتجات' },
    q: { fr: 'Lavez votre visage avec un nettoyant doux et n’appliquez rien. Une heure après, comment est votre peau ?', ar: 'اغسل وجهك بغسول لطيف ولا تضع أي شيء. بعد ساعة، كيف تكون بشرتك؟' },
    a: [
      { fr: 'Elle tire, elle est rugueuse ou pèle', ar: 'مشدودة، خشنة أو متقشرة', dry: 3 },
      { fr: 'Confortable : ni grasse ni tiraillée', ar: 'مريحة: لا دهنية ولا مشدودة', normal: 3 },
      { fr: 'Elle brille sur le front, le nez et le menton seulement', ar: 'تلمع في الجبهة والأنف والذقن فقط', combo: 3 },
      { fr: 'Elle brille sur tout le visage', ar: 'تلمع في كل الوجه', oily: 3 },
    ],
  },
  {
    t: { fr: 'Le test du mouchoir', ar: 'اختبار المنديل' },
    q: { fr: 'Tamponnez un mouchoir en papier sur le front, le nez, les joues et le menton. Qu’observez-vous ?', ar: 'اضغط بمنديل ورقي على الجبهة والأنف والخدين والذقن. ماذا تلاحظ؟' },
    a: [
      { fr: 'Aucune trace de sébum', ar: 'لا أثر للدهون', dry: 2 },
      { fr: 'Très peu, à peine visible', ar: 'أثر خفيف جدًا', normal: 2 },
      { fr: 'Des traces sur le front et le nez seulement', ar: 'آثار على الجبهة والأنف فقط', combo: 2 },
      { fr: 'Des traces sur tout le visage', ar: 'آثار على كل الوجه', oily: 2 },
      { fr: 'Je ne peux pas tester maintenant', ar: 'لا يمكنني التجربة الآن' },
    ],
  },
  {
    t: { fr: 'En milieu de journée', ar: 'في منتصف النهار' },
    q: { fr: 'Sans retouche, en milieu de journée, votre visage est…', ar: 'دون أي لمسة، في منتصف النهار، يكون وجهك…' },
    a: [
      { fr: 'Terne, avec des zones sèches', ar: 'باهتًا مع مناطق جافة', dry: 2 },
      { fr: 'Comme le matin', ar: 'كما في الصباح', normal: 2 },
      { fr: 'Brillant sur la zone T (front, nez, menton)', ar: 'لامعًا في المنطقة T (الجبهة، الأنف، الذقن)', combo: 2 },
      { fr: 'Brillant sur tout le visage', ar: 'لامعًا في كل الوجه', oily: 2 },
    ],
  },
  {
    t: { fr: 'Les pores', ar: 'المسام' },
    q: { fr: 'Dans un miroir, vos pores sont…', ar: 'في المرآة، تبدو مسامك…' },
    a: [
      { fr: 'Presque invisibles', ar: 'شبه غير مرئية', dry: 1, normal: 1 },
      { fr: 'Petits et peu visibles', ar: 'صغيرة وقليلة الظهور', normal: 2 },
      { fr: 'Visibles sur le nez et le front', ar: 'ظاهرة على الأنف والجبهة', combo: 2 },
      { fr: 'Dilatés sur une grande partie du visage', ar: 'واسعة على معظم الوجه', oily: 2 },
    ],
  },
  {
    t: { fr: 'Le toucher', ar: 'الملمس' },
    q: { fr: 'Avez-vous des petites peaux, des zones rugueuses ou des démangeaisons ?', ar: 'هل لديك قشور صغيرة أو مناطق خشنة أو حكة؟' },
    a: [
      { fr: 'Souvent', ar: 'غالبًا', dry: 2 },
      { fr: 'Parfois, surtout en hiver', ar: 'أحيانًا، خاصة في الشتاء', dry: 1, combo: 1 },
      { fr: 'Rarement ou jamais', ar: 'نادرًا أو أبدًا', normal: 1, oily: 1 },
    ],
  },
  {
    t: { fr: 'La tenue des soins', ar: 'ثبات المنتجات' },
    q: { fr: 'Après votre crème ou votre fond de teint, au fil de la journée…', ar: 'بعد الكريم أو كريم الأساس، خلال اليوم…' },
    a: [
      { fr: 'Ma peau a encore soif, elle « boit » la crème', ar: 'تبقى بشرتي عطشى وتمتص الكريم', dry: 2 },
      { fr: 'Tout tient bien', ar: 'يبقى كل شيء ثابتًا', normal: 2 },
      { fr: 'Ça brille ou ça file sur la zone T', ar: 'يلمع أو يذوب في المنطقة T', combo: 2 },
      { fr: 'Ça brille ou ça file partout', ar: 'يلمع أو يذوب في كل الوجه', oily: 2 },
      { fr: 'Je n’en utilise pas', ar: 'لا أستعمل' },
    ],
  },
  {
    t: { fr: 'Les nouveaux produits', ar: 'المنتجات الجديدة' },
    q: { fr: 'Quand vous essayez un nouveau produit, votre peau rougit, picote ou gratte…', ar: 'عندما تجرب منتجًا جديدًا، هل تحمرّ بشرتك أو تلسعك أو تسبب لك حكة؟' },
    a: [often, sometimes, never],
  },
  {
    t: { fr: 'Les rougeurs', ar: 'الاحمرار' },
    q: { fr: 'Votre visage rougit-il facilement (soleil, chaleur, plats épicés, émotion) ?', ar: 'هل يحمرّ وجهك بسهولة (الشمس، الحرارة، الأكل الحار، الانفعال)؟' },
    a: [often, sometimes, never],
  },
];

/** Résultats : clé = valeur TypeDePeau des produits. */
export const RESULTS = {
  Sèche: {
    label: { fr: 'Peau sèche', ar: 'بشرة جافة' },
    d: { fr: 'Elle manque de lipides : tiraillements, rugosité, teint terne. Privilégiez un nettoyant doux sans savon et une crème riche et nourrissante.', ar: 'تفتقر إلى الدهون: شد وخشونة وبشرة باهتة. اختر غسولًا لطيفًا بدون صابون وكريمًا غنيًا ومغذيًا.' },
  },
  Grasse: {
    label: { fr: 'Peau grasse', ar: 'بشرة دهنية' },
    d: { fr: 'Elle produit beaucoup de sébum : brillance, pores visibles, imperfections. Choisissez des textures légères et non comédogènes, sans oublier l’hydratation.', ar: 'تفرز الكثير من الدهون: لمعان ومسام ظاهرة وشوائب. اختر قوامًا خفيفًا لا يسد المسام، ولا تهمل الترطيب.' },
  },
  Mixte: {
    label: { fr: 'Peau mixte', ar: 'بشرة مختلطة' },
    d: { fr: 'Grasse sur la zone T (front, nez, menton), normale à sèche sur les joues. Adaptez vos soins par zone.', ar: 'دهنية في المنطقة T (الجبهة، الأنف، الذقن)، وعادية إلى جافة في الخدين. عدّل العناية حسب المنطقة.' },
  },
  Normal: {
    label: { fr: 'Peau normale', ar: 'بشرة عادية' },
    d: { fr: 'Équilibrée : ni trop grasse ni trop sèche. Gardez-la ainsi avec un nettoyage doux, une hydratation légère et une protection solaire chaque jour.', ar: 'متوازنة: لا دهنية جدًا ولا جافة جدًا. حافظ عليها بتنظيف لطيف وترطيب خفيف وواقٍ شمسي كل يوم.' },
  },
};

/** Libellé d'un type de peau produit (Normal → « Peau normale »). */
export const skinLabel = (value, lang) => RESULTS[value]?.label[lang] || value;

/** Version d'une langue, prête à être lue par le navigateur. */
export function quizData(lang) {
  return {
    questions: QUESTIONS.map((x) => ({
      t: x.t[lang], q: x.q[lang],
      a: x.a.map((a) => ({ l: a[lang], s: [a.dry || 0, a.normal || 0, a.combo || 0, a.oily || 0, a.sens || 0] })),
    })),
    results: Object.fromEntries(Object.entries(RESULTS).map(([k, v]) => [k, { label: v.label[lang], d: v.d[lang] }])),
  };
}
