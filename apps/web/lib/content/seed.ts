import { CONTACT_DEFAULTS } from '@/lib/constants';
import { images } from '@/lib/content/images';
import { legalContent } from '@/lib/content/legal';
import type { NavLabels, SiteContent } from '@/lib/content/types';
import { L } from '@/lib/i18n/locale';

const navHe: NavLabels = {
  home: 'דף הבית',
  about: 'אודות',
  services: 'שירותים',
  projects: 'העבודות שלנו',
  materials: 'חומרים',
  howWeWork: 'איך אנחנו עובדים',
  testimonials: 'המלצות',
  blog: 'בלוג',
  faq: 'שאלות נפוצות',
  contact: 'צור קשר',
  callUs: 'התקשרו אלינו',
  whatsapp: 'וואטסאפ',
  viewWork: 'צפו בעבודות שלנו',
  learnMore: 'למידע נוסף',
  viewAll: 'הצג הכול',
  viewProject: 'צפו בפרויקט',
  readMore: 'קראו עוד',
  backHome: 'חזרה לדף הבית',
  all: 'הכול',
};

const navAr: NavLabels = {
  home: 'الرئيسية',
  about: 'من نحن',
  services: 'خدماتنا',
  projects: 'أعمالنا',
  materials: 'الخامات',
  howWeWork: 'طريقة عملنا',
  testimonials: 'آراء العملاء',
  blog: 'المدونة',
  faq: 'الأسئلة الشائعة',
  contact: 'تواصل معنا',
  callUs: 'اتصلوا بنا',
  whatsapp: 'واتساب',
  viewWork: 'استعرضوا أعمالنا',
  learnMore: 'اعرفوا المزيد',
  viewAll: 'عرض الكل',
  viewProject: 'عرض المشروع',
  readMore: 'اقرأ المزيد',
  backHome: 'العودة إلى الرئيسية',
  all: 'الكل',
};

const navEn: NavLabels = {
  home: 'Home',
  about: 'About Us',
  services: 'Our Services',
  projects: 'Our Work',
  materials: 'Materials',
  howWeWork: 'How We Work',
  testimonials: 'Client Reviews',
  blog: 'Blog',
  faq: 'Frequently Asked Questions',
  contact: 'Contact Us',
  callUs: 'Call Us',
  whatsapp: 'WhatsApp',
  viewWork: 'View Our Work',
  learnMore: 'Learn More',
  viewAll: 'View All',
  viewProject: 'View Project',
  readMore: 'Read More',
  backHome: 'Back to Home',
  all: 'All',
};

const navRu: NavLabels = {
  home: 'Главная',
  about: 'О нас',
  services: 'Наши услуги',
  projects: 'Наши работы',
  materials: 'Материалы',
  howWeWork: 'Как мы работаем',
  testimonials: 'Отзывы клиентов',
  blog: 'Блог',
  faq: 'Часто задаваемые вопросы',
  contact: 'Связаться с нами',
  callUs: 'Позвонить нам',
  whatsapp: 'WhatsApp',
  viewWork: 'Наши работы',
  learnMore: 'Узнать больше',
  viewAll: 'Смотреть все',
  viewProject: 'Смотреть проект',
  readMore: 'Читать далее',
  backHome: 'Вернуться на главную',
  all: 'Все',
};

export const seedContent: SiteContent = {
  settings: {
    brandName: CONTACT_DEFAULTS.brandName,
    tagline: L(
      'נגרות ועיצוב פנים',
      'نجارة وتصميم داخلي',
      'Custom Carpentry & Interior Design',
      'Индивидуальная столярка и дизайн интерьера',
    ),
    pillars: L(
      'ברוכים הבאים לקבוצת נורה',
      'مرحبًا بكم في Nora Group',
      'Welcome to Nora Group',
      'Добро пожаловать в Nora Group',
    ),
    phoneDisplay: CONTACT_DEFAULTS.phoneDisplay,
    phoneTel: CONTACT_DEFAULTS.phoneTel,
    whatsappE164: CONTACT_DEFAULTS.whatsappE164,
    email: CONTACT_DEFAULTS.email,
    address: L(
      'מגדל עוז',
      'مجدال عوز',
      'Migdal Oz',
      'Мигдаль Оз',
    ),
    workingHours: L(
      'א׳–ה׳ 08:00–17:00',
      'الأحد–الخميس 08:00–17:00',
      'Sun–Thu, 8:00 AM–5:00 PM',
      'Вс–Чт, 08:00–17:00',
    ),
    whatsappMessage: L(
      'שלום Nora Group, אשמח לקבל פרטים על פרויקט.',
      'مرحبًا Nora Group، أود الحصول على تفاصيل حول مشروع.',
      'Hello Nora Group, I would like to get more information about a project.',
      'Здравствуйте, Nora Group! Я хотел бы получить информацию о проекте.',
    ),
    logoUrl: CONTACT_DEFAULTS.logoPath,
    logoDarkUrl: CONTACT_DEFAULTS.logoDarkPath,
    qrUrl: CONTACT_DEFAULTS.qrPath,
    seoTitle: L(
      'Nora Group | נגרות ועיצוב פנים',
      'Nora Group | نجارة وتصميم داخلي',
      'Nora Group | Custom Carpentry & Interior Design',
      'Nora Group | Индивидуальная столярка и дизайн интерьера',
    ),
    seoDescription: L(
      'נגרות ועיצוב פנים בהתאמה אישית במגדל עוז — תכנון, ביצוע ואיכות ללא פשרות.',
      'نجارة وتصميم داخلي حسب الطلب في مجدال عوز — تخطيط دقيق، تنفيذ احترافي وجودة لا تقبل التنازل.',
      'Custom carpentry and interior design in Migdal Oz — precise planning, professional execution, and uncompromising quality.',
      'Индивидуальная столярка и дизайн интерьера в Мигдаль-Озе — точное планирование, профессиональное исполнение и бескомпромиссное качество.',
    ),
  },

  nav: { he: navHe, ar: navAr, en: navEn, ru: navRu },

  home: {
    heroTitle: L(
      'חללי עץ המעוצבים בדיוק בשבילכם',
      'مساحات خشبية مصممة خصيصًا لكم',
      'Wooden Spaces Designed Just for You',
      'Деревянные пространства, созданные специально для вас',
    ),

    heroSubtitle: L(
      'תכנון וייצור בהתאמה אישית — מטבחים, ארונות, רהיטים ופרויקטים מסחריים. תכנון מדויק, ביצוע מקצועי ואיכות ללא פשרות.',
      'تصميم وتصنيع حسب الطلب — من المطابخ والخزائن إلى الأثاث والمشاريع التجارية. تخطيط دقيق، تنفيذ احترافي وجودة لا تقبل التنازل.',
      'Custom design and manufacturing — from kitchens and wardrobes to furniture and commercial projects. Precise planning, professional execution, and uncompromising quality.',
      'Индивидуальное проектирование и изготовление — от кухонь и шкафов до мебели и коммерческих проектов. Точное планирование, профессиональное исполнение и бескомпромиссное качество.',
    ),

    introEyebrow: L(
      'ברוכים הבאים',
      'مرحبًا بكم في Nora Group',
      'Welcome to Nora Group',
      'Добро пожаловать в Nora Group',
    ),

    introTitle: L(
      'פתרונות עץ בהתאמה אישית בסטנדרטים גבוהים',
      'حلول خشبية مخصصة بأعلى معايير الجودة',
      'Custom Wood Solutions to the Highest Standards',
      'Индивидуальные решения из дерева по высоким стандартам',
    ),

    introDescription: L(
      'Nora Group מתמחה בתכנון וייצור פתרונות עץ מותאמים אישית — מהמדידה הראשונה ועד ההתקנה.',
      'نتخصص في Nora Group في تصميم وتصنيع حلول خشبية مخصصة — من القياس الأول وحتى التركيب.',
      'Nora Group specializes in custom wood solutions — from the first measurement through installation.',
      'Nora Group специализируется на индивидуальных решениях из дерева — от первого замера до монтажа.',
    ),

    introFeatures: [
      {
        title: L(
          'תכנון מותאם אישית',
          'تصميم حسب الطلب',
          'Tailored Design',
          'Индивидуальный дизайн',
        ),
        desc: L(
          'כל פרויקט מתוכנן לפי המידות, הטעם ואופן השימוש שלכם',
          'كل مشروع يُصمم وفقًا للمقاسات وذوقكم وطريقة الاستخدام',
          'Every project is designed around your dimensions, taste, and needs',
          'Каждый проект разрабатывается с учетом ваших размеров, вкуса и потребностей',
        ),
      },
      {
        title: L(
          'ביצוע מדויק',
          'تنفيذ احترافي',
          'Professional Craftsmanship',
          'Профессиональное исполнение',
        ),
        desc: L(
          'צוות מקצועי ותשומת לב לכל פרט יוצרים תוצאה איכותית ומרשימה',
          'فريق متخصص واهتمام بكل تفصيلة يقدمان نتيجة عالية الجودة ومميزة',
          'A skilled team and attention to every detail deliver a high-quality, refined result',
          'Профессиональная команда и внимание к каждой детали обеспечивают высокое качество и безупречный результат',
        ),
      },
      {
        title: L(
          'חומרים איכותיים',
          'خامات عالية الجودة',
          'Quality Materials',
          'Качественные материалы',
        ),
        desc: L(
          'בחירת חומרים לעמידות, מראה ואיכות לאורך זמן',
          'نختار الخامات لضمان المتانة والمظهر والجودة على المدى الطويل',
          'Materials selected for durability, appearance, and lasting quality',
          'Материалы подбираются с учетом прочности, внешнего вида и долговечности',
        ),
      },
      {
        title: L(
          'ליווי מלא',
          'مرافقة كاملة',
          'Full Project Support',
          'Полное сопровождение проекта',
        ),
        desc: L(
          'מהתכנון ועד ההתקנה והמסירה, אנחנו מלווים אתכם בכל שלב',
          'من التصميم إلى التركيب والتسليم، نرافقكم في كل مرحلة',
          'From design to installation and handover, we support you at every stage',
          'От дизайна до монтажа и сдачи проекта мы сопровождаем вас на каждом этапе',
        ),
      },
    ],

    whyEyebrow: L(
      'למה Nora Group',
      'لماذا Nora Group',
      'Why Nora Group',
      'Почему Nora Group',
    ),

    whyTitle: L(
      'אנחנו נמדדים בפרטים',
      'نتميّز بالتفاصيل',
      'We Are Defined by the Details',
      'Наше качество — в деталях',
    ),

    whySubtitle: L(
      'אנחנו מקפידים על כל פרט כדי להעניק תוצאות שעולות על הציפיות שלכם',
      'نهتم بكل تفصيلة لنقدم لكم نتائج تتجاوز توقعاتكم',
      'We pay attention to every detail to deliver results that exceed your expectations',
      'Мы уделяем внимание каждой детали, чтобы результат превзошел ваши ожидания',
    ),

    whyItems: [
      {
        title: L(
          'עיצוב אישי',
          'تصميم مخصص',
          'Personalized Design',
          'Индивидуальный дизайн',
        ),
        desc: L(
          'מתחילים מהצרכים שלכם, לא מתבנית מוכנה',
          'نبدأ من احتياجاتكم، وليس من قالب جاهز',
          'We start with your needs, not a ready-made template',
          'Мы начинаем с ваших потребностей, а не с готового шаблона',
        ),
      },
      {
        title: L(
          'חומרים נבחרים',
          'خامات مختارة',
          'Selected Materials',
          'Отобранные материалы',
        ),
        desc: L(
          'חומרים שעומדים בשימוש יומיומי',
          'خامات تتحمل الاستخدام اليومي',
          'Materials selected to withstand everyday use',
          'Материалы, рассчитанные на ежедневное использование',
        ),
      },
      {
        title: L(
          'ייצור מדויק',
          'تصنيع دقيق',
          'Precision Manufacturing',
          'Точное производство',
        ),
        desc: L(
          'חיתוך והרכבה ברמת דיוק גבוהה',
          'قص وتركيب بدقة عالية',
          'Cutting and assembly with a high level of precision',
          'Раскрой и сборка с высокой точностью',
        ),
      },
      {
        title: L(
          'גימור נקי',
          'تشطيب متقن',
          'Refined Finishing',
          'Безупречная отделка',
        ),
        desc: L(
          'פרטים קטנים שעושים את ההבדל',
          'تفاصيل صغيرة تصنع الفرق',
          'Small details that make a difference',
          'Мелкие детали, которые создают разницу',
        ),
      },
      {
        title: L(
          'התקנה מקצועית',
          'تركيب احترافي',
          'Professional Installation',
          'Профессиональный монтаж',
        ),
        desc: L(
          'צוות מקצועי שמתקין אצלכם באתר',
          'فريق متخصص يتولى التركيب في موقعكم',
          'A professional team handles installation on site',
          'Профессиональная команда выполняет монтаж на объекте',
        ),
      },
      {
        title: L(
          'קשר ישיר',
          'تواصل مباشر',
          'Direct Contact',
          'Прямая связь',
        ),
        desc: L(
          'שיחה בוואטסאפ או בטלפון — בלי טפסים מיותרים',
          'تواصل معنا عبر واتساب أو الهاتف — بدون نماذج غير ضرورية',
          'Reach us by WhatsApp or phone — without unnecessary forms',
          'Свяжитесь с нами через WhatsApp или по телефону — без лишних форм',
        ),
      },
    ],

    processEyebrow: L(
      'תהליך העבודה',
      'طريقة العمل',
      'Our Process',
      'Наш процесс',
    ),

    processTitle: L(
      'מהרעיון ועד המסירה',
      'من الفكرة حتى التسليم',
      'From Idea to Handover',
      'От идеи до сдачи проекта',
    ),

    processSubtitle: L(
      'שבעה שלבים ברורים לשקט נפשי',
      'سبع خطوات واضحة لراحة البال',
      'Seven clear steps for peace of mind',
      'Семь понятных шагов для вашего спокойствия',
    ),

    ctaTitle: L(
      'מוכנים להתחיל פרויקט?',
      'هل أنتم مستعدون لبدء مشروعكم؟',
      'Ready to Start Your Project?',
      'Готовы начать свой проект?',
    ),

    ctaSubtitle: L(
      'דברו איתנו בוואטסאפ או בטלפון — נשמח לייעץ',
      'تواصلوا معنا عبر واتساب أو الهاتف — يسعدنا تقديم المشورة',
      'Message us on WhatsApp or call us — we’ll be happy to advise you',
      'Напишите нам в WhatsApp или позвоните — будем рады проконсультировать вас',
    ),

    heroImages: [
      images.hero1,
      images.hero2,
      images.hero3,
      images.kitchen2,
      images.wardrobe1,
    ],

    servicesEyebrow: L(
      'השירותים שלנו',
      'خدماتنا',
      'Our Services',
      'Наши услуги',
    ),

    servicesTitle: L(
      'אומנות בעץ ברמה גבוהה',
      'حرفية خشبية بمستوى عالٍ',
      'High-End Wood Craftsmanship',
      'Высококачественная работа по дереву',
    ),

    servicesSubtitle: L(
      'מטבחים, ארונות, ריהוט ועוד',
      'مطابخ، خزائن، أثاث وأكثر',
      'Kitchens, wardrobes, furniture, and more',
      'Кухни, шкафы, мебель и многое другое',
    ),

    projectsEyebrow: L(
      'העבודות שלנו',
      'أعمالنا',
      'Our Work',
      'Наши работы',
    ),

    projectsTitle: L(
      'מהרעיון ועד לתוצאה המושלמת בשטח',
      'من الفكرة إلى النتيجة المتقنة على أرض الواقع',
      'From Concept to a Refined Result',
      'От идеи до безупречного результата',
    ),

    projectsSubtitle: L(
      'מבחר פרויקטים שמשקף דיוק ואיכות',
      'مجموعة من المشاريع التي تعكس الدقة والجودة',
      'A selection of projects that reflects precision and quality',
      'Подборка проектов, отражающих точность и качество',
    ),

    materialsEyebrow: L(
      'חומרים',
      'الخامات',
      'Materials',
      'Материалы',
    ),

    materialsTitle: L(
      'חומרים שנבחרו בקפידה',
      'خامات مختارة بعناية',
      'Carefully Selected Materials',
      'Тщательно подобранные материалы',
    ),

    materialsSubtitle: L(
      'מגוון אפשרויות לכל סגנון ותקציב',
      'مجموعة متنوعة تناسب كل أسلوب وميزانية',
      'A range of options for every style and budget',
      'Разнообразие вариантов для любого стиля и бюджета',
    ),

    testimonialsEyebrow: L(
      'המלצות',
      'آراء العملاء',
      'Client Reviews',
      'Отзывы клиентов',
    ),

    testimonialsTitle: L(
      'המלצות לקוחות',
      'آراء عملائنا',
      'What Our Clients Say',
      'Что говорят наши клиенты',
    ),

    testimonialsSubtitle: L(
      'חוויות אמיתיות מהבית ומהעסק',
      'تجارب حقيقية من المنازل والأعمال',
      'Real experiences from homes and businesses',
      'Реальные впечатления клиентов из дома и бизнеса',
    ),
  },

  about: {
    eyebrow: L(
      'אודות',
      'من نحن',
      'About Us',
      'О нас',
    ),

    title: L(
      'Nora Group — נגרות ועיצוב פנים מקצועי',
      'Nora Group — نجارة وتصميم داخلي احترافي',
      'Nora Group — Professional Carpentry & Interior Design',
      'Nora Group — профессиональная столярка и дизайн интерьера',
    ),

    subtitle: L(
      'תכנון · ביצוע · איכות — ממגדל עוז',
      'تخطيط · تنفيذ · جودة — من مجدال عوز',
      'Planning · Execution · Quality — from Migdal Oz',
      'Планирование · Исполнение · Качество — Мигдаль Оз',
    ),

    image: images.craft1,

    body: L(
      'אנחנו סדנת נגרות ועיצוב פנים שמתמחה בפתרונות מותאמים אישית. כל פרויקט מתחיל בהקשבה ומסתיים בהתקנה מדויקת.',
      'نحن ورشة نجارة وتصميم داخلي متخصصة في الحلول المخصصة. يبدأ كل مشروع بالاستماع إلى احتياجاتكم وينتهي بتركيب دقيق.',
      'We are a carpentry and interior design studio specializing in custom solutions. Every project starts by understanding your needs and ends with precise installation.',
      'Мы — мастерская по столярным работам и дизайну интерьера, специализирующаяся на индивидуальных решениях. Каждый проект начинается с понимания ваших потребностей и завершается точным монтажом.',
    ),

    valuesTitle: L(
      'הערכים שלנו',
      'قيمنا',
      'Our Values',
      'Наши ценности',
    ),

    values: [
      {
        title: L(
          'יושרה',
          'النزاهة',
          'Integrity',
          'Честность',
        ),
        desc: L(
          'מחיר ברור ועבודה כמו שהבטחנו',
          'أسعار واضحة وتنفيذ كما وعدناكم',
          'Clear pricing and work delivered as promised',
          'Понятная стоимость и выполнение работы в соответствии с договоренностями',
        ),
      },
      {
        title: L(
          'מקצועיות',
          'الاحترافية',
          'Professionalism',
          'Профессионализм',
        ),
        desc: L(
          'ידע, כלים ותשומת לב לפרטים',
          'خبرة وأدوات واهتمام بكل التفاصيل',
          'Expertise, tools, and attention to detail',
          'Опыт, инструменты и внимание к каждой детали',
        ),
      },
      {
        title: L(
          'אחריות',
          'المسؤولية',
          'Responsibility',
          'Ответственность',
        ),
        desc: L(
          'אנחנו איתכם עד שהמרחב מוכן לשימוש',
          'نبقى معكم حتى يصبح المشروع جاهزًا للاستخدام',
          'We stay with you until the space is ready to use',
          'Мы сопровождаем вас до полной готовности пространства к использованию',
        ),
      },
    ],
  },

  howWeWork: {
    eyebrow: L(
      'תהליך',
      'العملية',
      'Process',
      'Процесс',
    ),

    title: L(
      'איך אנחנו עובדים',
      'كيف نعمل',
      'How We Work',
      'Как мы работаем',
    ),

    subtitle: L(
      'שקיפות בכל שלב',
      'وضوح في كل خطوة',
      'Clarity at Every Step',
      'Прозрачность на каждом этапе',
    ),

    image: images.office1,

    steps: [
      {
        number: '01',
        title: L(
          'ייעוץ',
          'استشارة',
          'Consultation',
          'Консультация',
        ),
        description: L(
          'מבינים את הצורך והחזון',
          'نفهم احتياجاتكم ورؤيتكم',
          'We understand your needs and vision',
          'Мы понимаем ваши потребности и видение',
        ),
      },
      {
        number: '02',
        title: L(
          'מדידות',
          'قياسات',
          'Measurements',
          'Замеры',
        ),
        description: L(
          'נגיע לאתר ונמדוד במדויק',
          'نصل إلى الموقع ونأخذ القياسات بدقة',
          'We visit the site and take precise measurements',
          'Мы приезжаем на объект и выполняем точные замеры',
        ),
      },
      {
        number: '03',
        title: L(
          'עיצוב',
          'تصميم',
          'Design',
          'Дизайн',
        ),
        description: L(
          'נגדיר כיוון עיצובי ותכנית עבודה',
          'نحدد اتجاه التصميم وخطة العمل',
          'We define the design direction and project plan',
          'Мы определяем направление дизайна и план проекта',
        ),
      },
      {
        number: '04',
        title: L(
          'אישור',
          'اعتماد',
          'Approval',
          'Согласование',
        ),
        description: L(
          'נשלים התאמות ונאשר יחד',
          'نجري التعديلات اللازمة ونعتمدها معًا',
          'We make the necessary adjustments and approve them together',
          'Вносим необходимые корректировки и утверждаем их вместе',
        ),
      },
      {
        number: '05',
        title: L(
          'ייצור',
          'تصنيع',
          'Manufacturing',
          'Производство',
        ),
        description: L(
          'נייצר בסדנה בסטנדרט גבוה',
          'نصنّع في الورشة وفق معايير عالية',
          'We manufacture in our workshop to a high standard',
          'Изготавливаем в мастерской по высоким стандартам',
        ),
      },
      {
        number: '06',
        title: L(
          'התקנה',
          'تركيب',
          'Installation',
          'Монтаж',
        ),
        description: L(
          'נתקין אצלכם במקצועיות',
          'نركّب في موقعكم باحترافية',
          'We install professionally on site',
          'Профессионально выполняем монтаж на объекте',
        ),
      },
      {
        number: '07',
        title: L(
          'מסירה',
          'تسليم',
          'Handover',
          'Сдача проекта',
        ),
        description: L(
          'נמסור פרויקט מוכן לשימוש',
          'نسلّم المشروع جاهزًا للاستخدام',
          'We hand over the project ready for use',
          'Передаём готовый к использованию проект',
        ),
      },
    ],
  },

  contactPage: {
    eyebrow: L(
      'צור קשר',
      'تواصل معنا',
      'Contact Us',
      'Связаться с нами',
    ),

    title: L(
      'בואו נדבר',
      'لنتحدث',
      "Let's Talk",
      'Давайте поговорим',
    ),

    subtitle: L(
      'טלפון, וואטסאפ או אימייל',
      'الهاتف أو واتساب أو البريد الإلكتروني',
      'Phone, WhatsApp, or Email',
      'Телефон, WhatsApp или электронная почта',
    ),

    image: images.livingRoom2,
  },

  categoryLabels: {
    he: {
      all: 'הכול',
      kitchens: 'מטבחים',
      bedrooms: 'חדרי שינה',
      wardrobes: 'ארונות',
      furniture: 'ריהוט',
      commercial: 'פרויקטים מסחריים',
    },

    ar: {
      all: 'الكل',
      kitchens: 'مطابخ',
      bedrooms: 'غرف نوم',
      wardrobes: 'خزائن',
      furniture: 'أثاث',
      commercial: 'مشاريع تجارية',
    },

    en: {
      all: 'All',
      kitchens: 'Kitchens',
      bedrooms: 'Bedrooms',
      wardrobes: 'Wardrobes',
      furniture: 'Furniture',
      commercial: 'Commercial Projects',
    },

    ru: {
      all: 'Все',
      kitchens: 'Кухни',
      bedrooms: 'Спальни',
      wardrobes: 'Шкафы',
      furniture: 'Мебель',
      commercial: 'Коммерческие проекты',
    },
  },

  services: [
    {
      slug: 'kitchens',
      title: L(
        'מטבחים',
        'مطابخ',
        'Kitchens',
        'Кухни',
      ),

      description: L(
        'מטבחים מותאמים שמשלבים יופי ופונקציה',
        'مطابخ مخصصة تجمع بين الجمال والوظيفة',
        'Custom kitchens that combine beauty and functionality',
        'Индивидуальные кухни, сочетающие красоту и функциональность',
      ),

      image: images.kitchen1,

      features: [
        L(
          'תכנון לפי החלל',
          'تخطيط حسب المساحة',
          'Planning for Your Space',
          'Планирование с учетом пространства',
        ),
        L(
          'בחירת חומרים',
          'اختيار الخامات',
          'Material Selection',
          'Подбор материалов',
        ),
        L(
          'התקנה מלאה',
          'تركيب كامل',
          'Full Installation',
          'Полный монтаж',
        ),
      ],

      visible: true,
    },

    {
      slug: 'bedrooms',
      title: L(
        'חדרי שינה',
        'غرف نوم',
        'Bedrooms',
        'Спальни',
      ),

      description: L(
        'חדרי שינה רגועים ומדויקים',
        'غرف نوم هادئة ومتقنة الصنع',
        'Calm, well-crafted bedrooms',
        'Спокойные спальни с безупречным исполнением',
      ),

      image: images.bedroom1,

      features: [
        L(
          'מיטות וארונות משולבים',
          'أسرة وخزائن مدمجة',
          'Integrated Beds and Wardrobes',
          'Кровати и встроенные шкафы',
        ),
        L(
          'פתרונות אחסון',
          'حلول تخزين',
          'Storage Solutions',
          'Решения для хранения',
        ),
        L(
          'גימור חם',
          'تشطيبات دافئة',
          'Warm Finishes',
          'Теплая отделка',
        ),
      ],

      visible: true,
    },

    {
      slug: 'wardrobes',
      title: L(
        'ארונות',
        'خزائن',
        'Wardrobes',
        'Шкафы',
      ),

      description: L(
        'ארונות חכמים שמנצלים כל סנטימטר',
        'خزائن ذكية تستغل كل سنتيمتر',
        'Smart wardrobes that make the most of every inch',
        'Умные шкафы, эффективно использующие каждый сантиметр',
      ),

      image: images.wardrobe1,

      features: [
        L(
          'חזיתות בהתאמה',
          'واجهات حسب الطلب',
          'Custom Fronts',
          'Фасады на заказ',
        ),
        L(
          'מנגנונים איכותיים',
          'إكسسوارات وآليات عالية الجودة',
          'Quality Hardware',
          'Качественная фурнитура',
        ),
        L(
          'ארגון פנימי',
          'تنظيم داخلي',
          'Interior Organization',
          'Внутренняя организация',
        ),
      ],

      visible: true,
    },

    {
      slug: 'walk-in-closets',
      title: L(
        'חדרי ארונות',
        'غرف ملابس',
        'Walk-in Closets',
        'Гардеробные',
      ),

      description: L(
        'חדרי ארונות מאורגנים ומעוצבים',
        'غرف ملابس منظمة ومصممة بما يناسب أسلوبكم',
        'Organized walk-in closets designed around your style',
        'Организованные гардеробные, созданные с учетом вашего стиля',
      ),

      image: images.wardrobe2,

      features: [
        L(
          'תאורה ותצוגה',
          'إضاءة وعرض',
          'Lighting and Display',
          'Освещение и витрины',
        ),
        L(
          'חלוקה לפי שימוש',
          'تقسيم حسب الاستخدام',
          'Zones by Use',
          'Зонирование по назначению',
        ),
        L(
          'חוויית יוקרה יומיומית',
          'تجربة فاخرة كل يوم',
          'Everyday Luxury',
          'Роскошь на каждый день',
        ),
      ],

      visible: true,
    },

    {
      slug: 'custom-furniture',
      title: L(
        'ריהוט מותאם',
        'أثاث مخصص',
        'Custom Furniture',
        'Мебель на заказ',
      ),

      description: L(
        'רהיטים ייחודיים לפי מידה וסגנון',
        'قطع أثاث فريدة حسب المقاس والأسلوب',
        'Unique furniture pieces tailored to your size and style',
        'Уникальная мебель по размеру и стилю',
      ),

      image: images.furniture1,

      features: [
        L(
          'שולחנות ומדפים',
          'طاولات ورفوف',
          'Tables and Shelves',
          'Столы и полки',
        ),
        L(
          'יחידות מדיה',
          'وحدات تلفاز',
          'Media Units',
          'ТВ-зоны',
        ),
        L(
          'עבודת יד מדויקת',
          'حرفية يدوية دقيقة',
          'Precise Craftsmanship',
          'Точная ручная работа',
        ),
      ],

      visible: true,
    },

    {
      slug: 'offices',
      title: L(
        'משרדים',
        'مكاتب',
        'Offices',
        'Офисы',
      ),

      description: L(
        'חללי עבודה פרקטיים ומכובדים',
        'مساحات عمل عملية وأنيقة',
        'Practical, polished workspaces',
        'Практичные и элегантные рабочие пространства',
      ),

      image: images.office1,

      features: [
        L(
          'שולחנות מנהלים',
          'مكاتب تنفيذية',
          'Executive Desks',
          'Рабочие столы руководителей',
        ),
        L(
          'אחסון משרדי',
          'حلول تخزين مكتبية',
          'Office Storage',
          'Офисные системы хранения',
        ),
        L(
          'זהות מותג בחלל',
          'هوية العلامة التجارية في المساحة',
          'Brand Identity in the Space',
          'Идентичность бренда в пространстве',
        ),
      ],

      visible: true,
    },

    {
      slug: 'commercial',
      title: L(
        'פרויקטים מסחריים',
        'مشاريع تجارية',
        'Commercial Projects',
        'Коммерческие проекты',
      ),

      description: L(
        'פתרונות לעסקים, מסעדות וחללים ציבוריים',
        'حلول للشركات والمطاعم والمساحات العامة',
        'Solutions for businesses, restaurants, and public spaces',
        'Решения для бизнеса, ресторанов и общественных пространств',
      ),

      image: images.commercial1,

      features: [
        L(
          'עמידות לשימוש אינטנסיבי',
          'متانة للاستخدام المكثف',
          'Built for Intensive Use',
          'Для интенсивного использования',
        ),
        L(
          'עיצוב בהתאם למותג',
          'تصميم متوافق مع هوية العلامة التجارية',
          'Design Aligned with Your Brand',
          'Дизайн в соответствии с брендом',
        ),
        L(
          'לוחות זמנים עסקיים',
          'جداول زمنية تراعي احتياجات العمل',
          'Business-Aware Timelines',
          'Сроки с учетом потребностей бизнеса',
        ),
      ],

      visible: true,
    },
  ],

  projects: [
    {
      slug: 'modern-wooden-kitchen-01',

      title: L(
        'מטבח עץ מודרני',
        'مطبخ خشبي عصري',
        'Modern Wooden Kitchen',
        'Современная деревянная кухня',
      ),

      description: L(
        'מטבח מותאם עם חזיתות עץ ומשטחים נקיים',
        'مطبخ مخصص بواجهات خشبية وأسطح بتصميم نظيف',
        'A custom kitchen with wood fronts and clean surfaces',
        'Индивидуальная кухня с деревянными фасадами и чистыми поверхностями',
      ),

      category: 'kitchens',
      images: [images.kitchen1, images.kitchen2, images.kitchen3],
      materials: ['MDF', 'Veneer', 'Natural Wood'],
      visible: true,
    },

    {
      slug: 'luxury-kitchen-island-02',

      title: L(
        'מטבח עם אי',
        'مطبخ فاخر مع جزيرة',
        'Luxury Kitchen with Island',
        'Роскошная кухня с островом',
      ),

      description: L(
        'מטבח יוקרתי עם אי מרכזי פונקציונלי',
        'مطبخ فاخر مع جزيرة مركزية عملية',
        'A luxury kitchen with a functional central island',
        'Роскошная кухня с функциональным центральным островом',
      ),

      category: 'kitchens',
      images: [images.kitchen2, images.kitchen3, images.kitchen1],
      materials: ['HPL', 'Acrylic'],
      visible: true,
    },

    {
      slug: 'serene-bedroom-03',

      title: L(
        'חדר שינה רגוע',
        'غرفة نوم هادئة',
        'Serene Bedroom',
        'Спокойная спальня',
      ),

      description: L(
        'חדר שינה בגוונים חמים עם ארונות משולבים',
        'غرفة نوم بألوان دافئة مع خزائن مدمجة',
        'A warm-toned bedroom with integrated wardrobes',
        'Спальня в теплых тонах со встроенными шкафами',
      ),

      category: 'bedrooms',
      images: [images.bedroom1, images.bedroom2],
      materials: ['MDF', 'Melamine'],
      visible: true,
    },

    {
      slug: 'master-bedroom-04',

      title: L(
        'חדר שינה ראשי',
        'غرفة نوم رئيسية',
        'Master Bedroom',
        'Главная спальня',
      ),

      description: L(
        'חדר שינה מלא עם תאורה ואחסון חכם',
        'غرفة نوم متكاملة مع إضاءة وحلول تخزين ذكية',
        'A complete bedroom with lighting and smart storage',
        'Полноценная спальня с освещением и продуманными решениями для хранения',
      ),

      category: 'bedrooms',
      images: [images.bedroom2, images.bedroom1],
      materials: ['Natural Wood', 'Veneer'],
      visible: true,
    },

    {
      slug: 'walk-in-closet-05',

      title: L(
        'חדר ארונות',
        'غرفة ملابس',
        'Walk-in Closet',
        'Гардеробная',
      ),

      description: L(
        'חדר ארונות מאורגן עם תאורה רכה',
        'غرفة ملابس منظمة مع إضاءة ناعمة',
        'An organized walk-in closet with soft lighting',
        'Организованная гардеробная с мягким освещением',
      ),

      category: 'wardrobes',
      images: [images.wardrobe1, images.wardrobe2, images.wardrobe3],
      materials: ['MDF', 'Acrylic', 'Glass'],
      visible: true,
    },

    {
      slug: 'built-in-wardrobe-06',

      title: L(
        'ארון מובנה',
        'خزانة مدمجة',
        'Built-in Wardrobe',
        'Встроенный шкаф',
      ),

      description: L(
        'חדר ארונות מקיר לקיר עם פתרונות אחסון המותאמים לצרכים שלכם',
        'غرفة ملابس من جدار إلى جدار مع حلول تخزين مصممة لتناسب احتياجاتكم',
        'A wall-to-wall walk-in closet with storage solutions tailored to your needs',
        'Гардеробная от стены до стены с решениями для хранения, адаптированными под ваши потребности',
      ),

      category: 'wardrobes',
      images: [images.wardrobe3, images.wardrobe1],
      materials: ['Melamine', 'MDF'],
      visible: true,
    },

    {
      slug: 'custom-furniture-07',

      title: L(
        'ריהוט מותאם',
        'أثاث مخصص',
        'Custom Furniture',
        'Мебель на заказ',
      ),

      description: L(
        'רהיטים ייחודיים בעבודת יד',
        'قطع أثاث فريدة مصنوعة بحرفية يدوية',
        'Unique handcrafted furniture pieces',
        'Уникальная мебель ручной работы',
      ),

      category: 'furniture',
      images: [images.furniture1, images.furniture2, images.livingRoom1],
      materials: ['Natural Wood', 'Metal'],
      visible: true,
    },

    {
      slug: 'commercial-space-08',

      title: L(
        'חלל מסחרי',
        'مساحة تجارية',
        'Commercial Space',
        'Коммерческое пространство',
      ),

      description: L(
        'עיצוב פנים מסחרי עם נגרות מותאמת',
        'تصميم داخلي تجاري مع نجارة مخصصة',
        'A commercial interior with custom carpentry',
        'Коммерческий интерьер с индивидуальными столярными решениями',
      ),

      category: 'commercial',
      images: [images.commercial1, images.office1, images.livingRoom2],
      materials: ['MDF', 'Veneer', 'Metal'],
      visible: true,
    },
  ],

  materials: [
    {
      slug: 'mdf',

      name: L(
        'MDF',
        'MDF',
        'MDF',
        'MDF',
      ),

      description: L(
        'לוח סיבים חלק לעיצובים מדויקים',
        'لوح ألياف ناعم لتصاميم دقيقة',
        'Smooth fiberboard for precise designs',
        'Гладкая древесноволокнистая плита для точных конструкций',
      ),

      characteristics: L(
        'יציב, קל לעיבוד, משטח אחיד',
        'ثابت، سهل المعالجة، وسطحه متجانس',
        'Stable, easy to machine, with a uniform surface',
        'Стабильный материал, удобный в обработке, с однородной поверхностью',
      ),

      applications: L(
        'ארונות, חזיתות, ריהוט',
        'خزائن، واجهات، أثاث',
        'Wardrobes, fronts, and furniture',
        'Шкафы, фасады и мебель',
      ),

      finishes: L(
        'פורניר, אקריל, צבע, מלמין',
        'قشرة خشبية، أكريليك، دهان، ميلامين',
        'Veneer, acrylic, paint, melamine',
        'Шпон, акрил, краска, меламин',
      ),

      image: images.wood1,
      visible: true,
    },

    {
      slug: 'hpl',

      name: L(
        'HPL',
        'HPL',
        'HPL',
        'HPL',
      ),

      description: L(
        'למינציה עמידה לחום ולחות',
        'لامينيت مقاوم للحرارة والرطوبة',
        'Laminate resistant to heat and moisture',
        'Ламинат, устойчивый к теплу и влаге',
      ),

      characteristics: L(
        'עמיד לשריטות וקל לניקוי',
        'مقاوم للخدوش وسهل التنظيف',
        'Scratch-resistant and easy to clean',
        'Устойчив к царапинам и прост в уходе',
      ),

      applications: L(
        'מטבחים ומשטחי עבודה',
        'مطابخ وأسطح عمل',
        'Kitchens and work surfaces',
        'Кухни и рабочие поверхности',
      ),

      finishes: L(
        'מט, מבריק, עץ',
        'مطفي، لامع، مظهر خشبي',
        'Matte, gloss, wood look',
        'Матовый, глянцевый, под дерево',
      ),

      image: images.wood2,
      visible: true,
    },

    {
      slug: 'acrylic',

      name: L(
        'אקריל',
        'أكريليك',
        'Acrylic',
        'Акрил',
      ),

      description: L(
        'משטח מבריק עם עומק יוקרתי',
        'سطح لامع بمظهر فاخر وعميق',
        'A high-gloss surface with a luxurious depth',
        'Глянцевая поверхность с роскошным визуальным эффектом',
      ),

      characteristics: L(
        'ברק גבוה וצבעים עשירים',
        'لمعان عالٍ وألوان غنية',
        'High gloss and rich colors',
        'Высокий глянец и насыщенные цвета',
      ),

      applications: L(
        'מטבחים וארונות מודרניים',
        'مطابخ وخزائن عصرية',
        'Modern kitchens and wardrobes',
        'Современные кухни и шкафы',
      ),

      finishes: L(
        'מבריק גבוה',
        'لامع عالي',
        'High Gloss',
        'Высокий глянец',
      ),

      image: images.wood3,
      visible: true,
    },

    {
      slug: 'veneer',

      name: L(
        'פורניר',
        'قشرة خشبية',
        'Veneer',
        'Шпон',
      ),

      description: L(
        'מראה עץ טבעי עם דפוסים ייחודיים',
        'مظهر خشبي طبيعي بعروق وأنماط فريدة',
        'A natural wood appearance with unique grain patterns',
        'Натуральный вид дерева с уникальным рисунком текстуры',
      ),

      characteristics: L(
        'חם, אותנטי, אלגנטי',
        'دافئ، أصيل، أنيق',
        'Warm, authentic, and elegant',
        'Тёплый, аутентичный и элегантный',
      ),

      applications: L(
        'ריהוט יוקרה ומשרדים',
        'أثاث فاخر ومكاتب',
        'Premium furniture and offices',
        'Премиальная мебель и офисы',
      ),

      finishes: L(
        'מט, שמן, לכה',
        'مطفي، زيت، ورنيش',
        'Matte, oil, varnish',
        'Матовый, масло, лак',
      ),

      image: images.wood1,
      visible: true,
    },

    {
      slug: 'melamine',

      name: L(
        'מלמין',
        'ميلامين',
        'Melamine',
        'Меламин',
      ),

      description: L(
        'פתרון עמיד ומשתלם',
        'حل متين واقتصادي',
        'A durable and cost-effective option',
        'Прочный и экономичный вариант',
      ),

      characteristics: L(
        'קל לתחזוקה ומגוון עיצובים',
        'سهل الصيانة ومتوفر بتشكيلة واسعة من التصاميم',
        'Easy to maintain and available in a wide range of designs',
        'Прост в уходе и доступен в широком разнообразии декоров',
      ),

      applications: L(
        'ארונות וחללים מסחריים',
        'خزائن ومساحات تجارية',
        'Wardrobes and commercial spaces',
        'Шкафы и коммерческие пространства',
      ),

      finishes: L(
        'מט, עץ, צבעוני',
        'مطفي، خشبي، ألوان سادة',
        'Matte, wood look, solid colors',
        'Матовый, под дерево, однотонный',
      ),

      image: images.wood2,
      visible: true,
    },

    {
      slug: 'natural-wood',

      name: L(
        'עץ טבעי',
        'خشب طبيعي',
        'Natural Wood',
        'Натуральное дерево',
      ),

      description: L(
        'עץ מלא עם אופי וחום',
        'خشب طبيعي صلب بطابع ودفء مميزين',
        'Solid wood with character and warmth',
        'Массив дерева с характером и теплом',
      ),

      characteristics: L(
        'עמיד וייחודי בכל לוח',
        'متين وفريد في كل لوح',
        'Durable, with a unique character in every board',
        'Прочный, с уникальным характером каждой доски',
      ),

      applications: L(
        'ריהוט ואזורי מוקד',
        'أثاث وعناصر مميزة في المساحات',
        'Furniture and feature areas',
        'Мебель и акцентные элементы',
      ),

      finishes: L(
        'שמן, שעווה, לכה',
        'زيت، شمع، ورنيش',
        'Oil, wax, varnish',
        'Масло, воск, лак',
      ),

      image: images.wood3,
      visible: true,
    },

    {
      slug: 'glass',

      name: L(
        'זכוכית',
        'زجاج',
        'Glass',
        'Стекло',
      ),

      description: L(
        'שקיפות וקלילות לחלל',
        'شفافية وخفة تضيفان إلى المساحة',
        'Transparency and lightness for the space',
        'Прозрачность и легкость в пространстве',
      ),

      characteristics: L(
        'מודרני ומרחיב ויזואלית',
        'عصري ويوسّع المساحة بصريًا',
        'Modern and visually expands the space',
        'Современный материал, визуально расширяющий пространство',
      ),

      applications: L(
        'חזיתות, מדפים ותצוגה',
        'واجهات، رفوف ووحدات عرض',
        'Fronts, shelves, and display',
        'Фасады, полки и витрины',
      ),

      finishes: L(
        'שקוף, מט, צבעוני',
        'شفاف، مطفي، ملون',
        'Clear, frosted, tinted',
        'Прозрачное, матовое, тонированное',
      ),

      image: images.wood1,
      visible: true,
    },

    {
      slug: 'metal',

      name: L(
        'מתכת',
        'معدن',
        'Metal',
        'Металл',
      ),

      description: L(
        'פרטי מתכת לעמידות וסגנון',
        'تفاصيل معدنية تضيف المتانة والأناقة',
        'Metal details for strength and style',
        'Металлические детали для прочности и стиля',
      ),

      characteristics: L(
        'חזק ומגוון בגימורים',
        'قوي ومتوفر بتشطيبات متنوعة',
        'Strong and available in a variety of finishes',
        'Прочный и доступный в различных вариантах отделки',
      ),

      applications: L(
        'ידיות, רגליים ומסגרות',
        'مقابض، أرجل وإطارات',
        'Handles, legs, and frames',
        'Ручки, ножки и каркасы',
      ),

      finishes: L(
        'שחור, זהב, מוברש',
        'أسود، ذهبي، مصقول بتشطيب فرشاة',
        'Black, gold, brushed',
        'Чёрный, золотой, брашированный',
      ),

      image: images.wood2,
      visible: true,
    },
  ],

  testimonials: [
    {
      id: '1',
      name: 'לקוח/ה א׳',
      rating: 5,

      review: L(
        'חוויה יוצאת דופן בכל פרט; ביצוע מדויק, איכות בלתי מתפשרת ומטבח שתוכנן לשלב בין יוקרה לפונקציונליות בכל יום.',
        'تجربة استثنائية بكل تفاصيلها؛ تنفيذ دقيق، جودة لا تقبل التنازل، ومطبخ صُمم ليجمع بين الفخامة والعملية في الحياة اليومية.',
        'An exceptional experience in every detail — precise craftsmanship, uncompromising quality, and a kitchen designed to combine luxury with everyday functionality.',
        'Исключительный опыт в каждой детали — точное исполнение, бескомпромиссное качество и кухня, созданная для сочетания роскоши с повседневной функциональностью.',
      ),

      project: L(
        'מטבח מותאם',
        'مطبخ مخصص',
        'Custom Kitchen',
        'Кухня на заказ',
      ),

      visible: true,
    },

    {
      id: '2',
      name: 'לקוח/ה ב׳',
      rating: 5,

      review: L(
        'חדר הארונות שינה לנו את הסדר בבית.',
        'غرفة الملابس غيّرت طريقة تنظيمنا للمنزل.',
        'The walk-in closet changed the way we organize our home.',
        'Гардеробная изменила то, как мы организуем пространство дома.',
      ),

      project: L(
        'חדר ארונות',
        'غرفة ملابس',
        'Walk-in Closet',
        'Гардеробная',
      ),

      visible: true,
    },

    {
      id: '3',
      name: 'לקוח/ה ג׳',
      rating: 5,

      review: L(
        'תשומת לב לפרטים ולוחות זמנים שעבדו.',
        'اهتمام بالتفاصيل والتزام دقيق بالمواعيد.',
        'Attention to detail and reliable timelines.',
        'Внимание к деталям и соблюдение согласованных сроков.',
      ),

      project: L(
        'חדר שינה',
        'غرفة نوم',
        'Bedroom',
        'Спальня',
      ),

      visible: true,
    },
  ],

  blogPosts: [
    {
      slug: 'choosing-kitchen-materials',

      title: L(
        'איך בוחרים חומרים למטבח',
        'كيف تختارون خامات المطبخ',
        'How to Choose Kitchen Materials',
        'Как выбрать материалы для кухни',
      ),

      excerpt: L(
        'מדריך קצר ל־MDF, HPL ועץ טבעי',
        'دليل مختصر حول MDF وHPL والخشب الطبيعي',
        'A short guide to MDF, HPL, and natural wood',
        'Краткое руководство по MDF, HPL и натуральному дереву',
      ),

      content: L(
        'בחירת החומרים משפיעה על עמידות, תחזוקה ומראה. נשמח לייעץ לפי השימוש שלכם.',
        'اختيار الخامات يؤثر في المتانة والصيانة والمظهر. يسعدنا أن نقدم لكم المشورة وفقًا لاستخدامكم واحتياجاتكم.',
        'Material choice affects durability, maintenance, and appearance. We are happy to advise you based on your needs and intended use.',
        'Выбор материалов влияет на долговечность, уход и внешний вид. Мы будем рады подобрать решение с учетом ваших потребностей и задач.',
      ),

      category: 'kitchens',
      author: 'Nora Group',
      date: '2025-01-15',
      image: images.kitchen1,
      visible: true,
    },

    {
      slug: 'wardrobe-trends',

      title: L(
        'מגמות בארונות ובחדרי ארונות',
        'اتجاهات الخزائن وغرف الملابس',
        'Wardrobe and Walk-in Closet Trends',
        'Тренды в дизайне шкафов и гардеробных',
      ),

      excerpt: L(
        'אחסון חכם וחזיתות נקיות',
        'تخزين ذكي وواجهات بتصميم نظيف',
        'Smart storage and clean fronts',
        'Умное хранение и лаконичные фасады',
      ),

      content: L(
        'המגמות מתמקדות בניצול שטח, תאורה ותנועה נוחה.',
        'تركّز الاتجاهات الحديثة على الاستفادة من المساحة، والإضاءة، وسهولة الحركة.',
        'Current trends focus on efficient use of space, lighting, and comfortable movement.',
        'Современные тенденции сосредоточены на эффективном использовании пространства, освещении и удобстве движения.',
      ),

      category: 'trends',
      author: 'Nora Group',
      date: '2025-02-20',
      image: images.wardrobe1,
      visible: true,
    },

    {
      slug: 'wood-care',

      title: L(
        'איך שומרים על ריהוט עץ',
        'كيف تحافظون على الأثاث الخشبي',
        'How to Care for Wood Furniture',
        'Как ухаживать за деревянной мебелью',
      ),

      excerpt: L(
        'טיפים פשוטים לאורך חיים ארוך',
        'نصائح بسيطة للحفاظ على الأثاث لفترة أطول',
        'Simple tips for a longer life',
        'Простые советы для долгой службы',
      ),

      content: L(
        'ניקוי עדין, הרחקה מלחות עודפת ובדיקת גימור מדי פעם.',
        'التنظيف بلطف، وتجنب الرطوبة الزائدة، وفحص التشطيب من وقت لآخر.',
        'Gentle cleaning, avoiding excess moisture, and checking the finish from time to time can help maintain the furniture.',
        'Бережная очистка, защита от избыточной влаги и периодическая проверка покрытия помогают сохранить мебель.',
      ),

      category: 'care',
      author: 'Nora Group',
      date: '2025-03-10',
      image: images.furniture1,
      visible: true,
    },
  ],

  faq: [
    {
      id: '1',
      category: 'general',

      question: L(
        'כמה זמן לוקח פרויקט?',
        'كم يستغرق المشروع؟',
        'How long does a project take?',
        'Сколько времени занимает проект?',
      ),

      answer: L(
        'תלוי בהיקף. אחרי שיחה ראשונה נותנים לוח זמנים ברור.',
        'يعتمد ذلك على حجم المشروع. بعد المحادثة الأولى نحدد لكم جدولًا زمنيًا واضحًا.',
        'It depends on the scope. After the initial consultation, we provide a clear timeline.',
        'Это зависит от объёма проекта. После первой консультации мы предоставляем понятный график.',
      ),

      visible: true,
    },

    {
      id: '2',
      category: 'general',

      question: L(
        'יש אחריות?',
        'هل يوجد ضمان؟',
        'Is There a Warranty?',
        'Есть ли гарантия?',
      ),

      answer: L(
        'כן — נפרט את תנאי האחריות בשיחה ובמסמך ההזמנה.',
        'نعم — نوضح شروط الضمان خلال المحادثة ونذكرها في مستند الطلب.',
        'Yes — we explain the warranty terms during the consultation and include them in the order document.',
        'Да — условия гарантии мы объясняем во время консультации и указываем в документе заказа.',
      ),

      visible: true,
    },

    {
      id: '3',
      category: 'services',

      question: L(
        'מה אתם מייצרים?',
        'ماذا تصنعون؟',
        'What Do You Make?',
        'Что вы производите?',
      ),

      answer: L(
        'מטבחים, חדרי שינה, ארונות, חדרי ארונות, ריהוט מותאם, משרדים ופרויקטים מסחריים.',
        'نصنع المطابخ، وغرف النوم، والخزائن، وغرف الملابس، والأثاث المخصص، وتجهيزات المكاتب، والمشاريع التجارية.',
        'We create kitchens, bedrooms, wardrobes, walk-in closets, custom furniture, offices, and commercial projects.',
        'Мы изготавливаем кухни, спальни, шкафы, гардеробные, мебель на заказ, офисные решения и коммерческие проекты.',
      ),

      visible: true,
    },

    {
      id: '4',
      category: 'services',

      question: L(
        'יש עיצוב תלת־ממד?',
        'هل تقدمون تصميمًا ثلاثي الأبعاد؟',
        'Do You Offer 3D Design?',
        'Предлагаете ли вы 3D-дизайн?',
      ),

      answer: L(
        'כן, כדי שתראו את הכיוון לפני הייצור.',
        'نعم، لتتمكنوا من رؤية التصميم واتجاه المشروع قبل التصنيع.',
        'Yes, so you can see the design direction before manufacturing.',
        'Да, чтобы вы могли увидеть направление дизайна до начала производства.',
      ),

      visible: true,
    },

    {
      id: '5',
      category: 'materials',

      question: L(
        'אילו חומרים יש?',
        'ما الخامات المتوفرة؟',
        'What Materials Are Available?',
        'Какие материалы доступны?',
      ),

      answer: L(
        'בין היתר MDF, HPL, אקריל, פורניר, מלמין, עץ טבעי, זכוכית ומתכת.',
        'من بينها MDF وHPL والأكريليك والقشرة الخشبية والميلامين والخشب الطبيعي والزجاج والمعدن.',
        'These include MDF, HPL, acrylic, veneer, melamine, natural wood, glass, and metal.',
        'В их числе MDF, HPL, акрил, шпон, меламин, натуральное дерево, стекло и металл.',
      ),

      visible: true,
    },

    {
      id: '6',
      category: 'pricing',

      question: L(
        'איך נקבע המחיר?',
        'كيف يتم تحديد السعر؟',
        'How Is the Price Determined?',
        'Как формируется стоимость?',
      ),

      answer: L(
        'לפי סוג הפרויקט, חומרים, מידות ועיצוב — אחרי ייעוץ.',
        'يتم تحديد السعر حسب نوع المشروع والخامات والمقاسات والتصميم، بعد الاستشارة.',
        'The price is based on the project type, materials, dimensions, and design, following a consultation.',
        'Стоимость определяется с учетом типа проекта, материалов, размеров и дизайна после консультации.',
      ),

      visible: true,
    },

    {
      id: '7',
      category: 'contact',

      question: L(
        'איך יוצרים קשר?',
        'كيف يمكنكم التواصل معنا؟',
        'How Can We Contact You?',
        'Как с вами связаться?',
      ),

      answer: L(
        'בטלפון או בוואטסאפ.',
        'عبر الهاتف أو واتساب.',
        'By phone or WhatsApp.',
        'По телефону или через WhatsApp.',
      ),

      visible: true,
    },

    {
      id: '8',
      category: 'installation',

      question: L(
        'אתם מתקינים?',
        'هل تتولون التركيب؟',
        'Do You Install?',
        'Вы выполняете монтаж?',
      ),

      answer: L(
        'כן, הצוות שלנו מתקין באתר.',
        'نعم، فريقنا يتولى التركيب في الموقع.',
        'Yes, our team handles installation on site.',
        'Да, наша команда выполняет монтаж на объекте.',
      ),

      visible: true,
    },
  ],

  legal: legalContent,

  ui: {
    he: {
      footerCta: 'בואו ניצור יחד את הפרויקט שלכם',
      footerTagline: 'נגרות ועיצוב פנים — תכנון, ביצוע ואיכות',
      servicesTitle: 'שירותים',
      navTitle: 'ניווט',
      contactTitle: 'יצירת קשר',
      languagesTitle: 'שפות',
      madeBy: 'פותח על ידי',
      allRightsReserved: 'כל הזכויות שמורות',
      notFoundTitle: 'העמוד לא נמצא',
      notFoundBody: 'ייתכן שהקישור שגוי או שהעמוד הוסר.',
      relatedProjects: 'פרויקטים קשורים',
      demoNotice: '',
      privacy: 'מדיניות פרטיות',
      cookies: 'עוגיות',
      terms: 'תנאי שימוש',
      cookieNotice: 'האתר משתמש באמצעים טכניים הכרחיים בלבד. אין מעקב פרסומי.',
      cookieAccept: 'הבנתי',
      legalTitle: 'מידע משפטי',
    },

    ar: {
      footerCta: 'لنصنع مشروعكم معًا',
      footerTagline: 'نجارة وتصميم داخلي — تخطيط، تنفيذ وجودة',
      servicesTitle: 'الخدمات',
      navTitle: 'التنقل',
      contactTitle: 'تواصل معنا',
      languagesTitle: 'اللغات',
      madeBy: 'تنفيذ',
      allRightsReserved: 'جميع الحقوق محفوظة',
      notFoundTitle: 'الصفحة غير موجودة',
      notFoundBody: 'قد يكون الرابط غير صحيح أو تمت إزالة الصفحة.',
      relatedProjects: 'مشاريع ذات صلة',
      demoNotice: '',
      privacy: 'سياسة الخصوصية',
      cookies: 'ملفات الارتباط',
      terms: 'شروط الاستخدام',
      cookieNotice: 'يستخدم الموقع وسائل تقنية ضرورية فقط. لا يوجد تتبع إعلاني.',
      cookieAccept: 'حسنًا',
      legalTitle: 'معلومات قانونية',
    },

    en: {
      footerCta: "Let's Create Your Project Together",
      footerTagline: 'Carpentry & Interior Design — Planning, Execution, and Quality',
      servicesTitle: 'Services',
      navTitle: 'Navigation',
      contactTitle: 'Contact Us',
      languagesTitle: 'Languages',
      madeBy: 'Developed by',
      allRightsReserved: 'All rights reserved',
      notFoundTitle: 'Page Not Found',
      notFoundBody: 'The link may be incorrect or the page may have been removed.',
      relatedProjects: 'Related Projects',
      demoNotice: '',
      privacy: 'Privacy Policy',
      cookies: 'Cookies',
      terms: 'Terms of Use',
      cookieNotice: 'This site uses necessary technical storage only. No advertising tracking.',
      cookieAccept: 'Got it',
      legalTitle: 'Legal',
    },

    ru: {
      footerCta: 'Давайте создадим ваш проект вместе',
      footerTagline: 'Столярка и дизайн интерьера — планирование, исполнение и качество',
      servicesTitle: 'Услуги',
      navTitle: 'Навигация',
      contactTitle: 'Связаться с нами',
      languagesTitle: 'Языки',
      madeBy: 'Разработано',
      allRightsReserved: 'Все права защищены',
      notFoundTitle: 'Страница не найдена',
      notFoundBody: 'Возможно, ссылка неверна или страница была удалена.',
      relatedProjects: 'Похожие проекты',
      demoNotice: '',
      privacy: 'Политика конфиденциальности',
      cookies: 'Cookie',
      terms: 'Условия использования',
      cookieNotice: 'Сайт использует только необходимые технические средства. Рекламного отслеживания нет.',
      cookieAccept: 'Понятно',
      legalTitle: 'Правовая информация',
    },
  },
};