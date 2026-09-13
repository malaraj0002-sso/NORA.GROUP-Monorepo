import { CONTACT_DEFAULTS } from '@/lib/constants';
import type { LegalPage, SiteContent } from '@/lib/content/types';
import { L } from '@/lib/i18n/locale';

const UPDATED = L(
  'עודכן: 12 בספטמבר 2026',
  'آخر تحديث: 12 سبتمبر 2026',
  'Last updated: 12 September 2026',
  'Обновлено: 12 сентября 2026 г.',
);

const CONTACT_BLOCK = [
  CONTACT_DEFAULTS.brandName,
  'Migdal Oz',
  CONTACT_DEFAULTS.phoneDisplay,
  CONTACT_DEFAULTS.email,
  CONTACT_DEFAULTS.website,
].join('\n');

function page(
  title: LegalPage['title'],
  intro: LegalPage['intro'],
  sections: LegalPage['sections'],
): LegalPage {
  return { title, updated: UPDATED, intro, sections };
}

export const legalContent: SiteContent['legal'] = {
  privacy: page(
    L('מדיניות פרטיות', 'سياسة الخصوصية', 'Privacy Policy', 'Политика конфиденциальности'),
    L(
      'מדיניות זו מסבירה כיצד Nora Group מתייחסת למידע אישי בקשר לאתר officialnoragroup.com. זהו מידע כללי בלבד, ואינו ייעוץ משפטי.',
      'توضح هذه السياسة كيف تتعامل Nora Group مع المعلومات الشخصية المتعلقة بموقع officialnoragroup.com. هذا نص معلوماتي فقط وليس استشارة قانونية.',
      'This policy explains how Nora Group handles personal information in connection with officialnoragroup.com. It is informational only and is not legal advice.',
      'Эта политика объясняет, как Nora Group обрабатывает персональные данные в связи с сайтом officialnoragroup.com. Это общая информация, а не юридическая консультация.',
    ),
    [
      {
        heading: L('מי אנחנו', 'من نحن', 'Who we are', 'Кто мы'),
        body: L(
          `Nora Group היא סדנת נגרות ועיצוב פנים במגדל עוז. פרטי יצירת הקשר:\n\n${CONTACT_BLOCK}`,
          `Nora Group ورشة نجارة وتصميم داخلي في مجدال عوز. بيانات التواصل:\n\n${CONTACT_BLOCK}`,
          `Nora Group is a carpentry and interior-design workshop in Migdal Oz. Contact details:\n\n${CONTACT_BLOCK}`,
          `Nora Group — столярная мастерская и дизайн интерьера в Мигдаль-Оз. Контакты:\n\n${CONTACT_BLOCK}`,
        ),
      },
      {
        heading: L('מה האתר אוסף', 'ما الذي يجمعه الموقع', 'What this site collects', 'Какие данные собирает сайт'),
        body: L(
          'אין באתר טופס יצירת קשר ששומר פניות אצלנו. אם תתקשרו, תכתבו בוואטסאפ או תשלחו אימייל — נקבל את מה ששלחתם (למשל שם, מספר טלפון, הודעה ותמונות של הפרויקט) כדי להשיב ולבצע את העבודה.\n\nספק האירוח עשוי לרשום יומני שרת טכניים (כתובת IP, דפדפן, עמודים) לצורך הפעלה, אבטחה ותיקון תקלות. אין לנו מערכת פרסום או ניתוח צד־שלישי באתר זה נכון לתאריך העדכון.',
          'لا يوجد في الموقع نموذج تواصل يحفظ الطلبات لدينا. إذا اتصلتم أو كتبتم عبر واتساب أو أرسلتم بريدًا إلكترونيًا، نستلم ما ترسلونه (مثل الاسم ورقم الهاتف والرسالة وصور المشروع) للرد وتنفيذ العمل.\n\nقد يسجّل مزوّد الاستضافة سجلات تقنية (عنوان IP والمتصفح والصفحات) للتشغيل والأمان وإصلاح الأعطال. لا توجد لدينا أنظمة إعلانات أو تحليلات طرف ثالث على هذا الموقع حتى تاريخ التحديث.',
          'There is no on-site contact form that stores enquiries with us. If you call, message us on WhatsApp, or email us, we receive what you send (for example name, phone number, message, and project photos) so we can reply and do the work.\n\nThe hosting provider may keep technical server logs (IP address, browser, pages) to operate, secure, and debug the site. As of the update date we do not run advertising or third-party analytics on this website.',
          'На сайте нет формы обратной связи, которая хранит заявки у нас. Если вы звоните, пишете в WhatsApp или отправляете письмо, мы получаем то, что вы отправили (например имя, телефон, сообщение и фото проекта), чтобы ответить и выполнить работу.\n\nХостинг может вести технические журналы сервера (IP-адрес, браузер, страницы) для работы, безопасности и устранения сбоев. На дату обновления на сайте нет рекламы и сторонней аналитики.',
        ),
      },
      {
        heading: L('למה אנחנו משתמשים במידע', 'لماذا نستخدم المعلومات', 'Why we use information', 'Зачем мы используем данные'),
        body: L(
          'כדי להשיב לפניות, לתאם מדידות וביצוע, לנהל הזמנות ולשמור על האתר. איננו מוכרים מידע אישי.',
          'للرد على الاستفسارات، وتنسيق القياسات والتنفيذ، وإدارة الطلبات، وتشغيل الموقع. نحن لا نبيع المعلومات الشخصية.',
          'To answer enquiries, schedule measurements and installation, manage orders, and keep the site running. We do not sell personal information.',
          'Чтобы отвечать на обращения, согласовывать замеры и монтаж, вести заказы и поддерживать работу сайта. Мы не продаём персональные данные.',
        ),
      },
      {
        heading: L('צדדים שלישיים', 'أطراف ثالثة', 'Third parties', 'Третьи стороны'),
        body: L(
          'וואטסאפ (Meta) — כשלוחצים על קישור וואטסאפ עוברים לשירות של Meta; חלה מדיניות הפרטיות שלהם.\nדוא״ל — ההודעה עוברת דרך ספק הדואר שלכם ושלנו (כולל Gmail).\nVercel — מארח את האתר.\nSanity — מארח את מערכת התוכן (לעורכים בלבד).\n\nכל אחד מהם מעבד נתונים לפי התנאים שלו. כשאתם עוזבים את האתר שלנו, הכללים שלהם חלים.',
          'واتساب (Meta) — عند الضغط على رابط واتساب تنتقلون إلى خدمة Meta وتسري سياسة الخصوصية الخاصة بهم.\nالبريد الإلكتروني — تمر الرسالة عبر مزوّد البريد لديكم ولدينا (بما في ذلك Gmail).\nVercel — يستضيف الموقع.\nSanity — يستضيف نظام المحتوى (للمحررين فقط).\n\nيعالج كل طرف البيانات وفق شروطه. عند مغادرة موقعنا تسري قواعدهم.',
          'WhatsApp (Meta) — tapping a WhatsApp link takes you to Meta’s service; their privacy policy applies.\nEmail — your message travels through your mail provider and ours (including Gmail).\nVercel — hosts this website.\nSanity — hosts the content system (for editors only).\n\nEach of them processes data under their own terms. When you leave our site, their rules apply.',
          'WhatsApp (Meta) — переход по ссылке WhatsApp открывает сервис Meta; действует их политика конфиденциальности.\nЭлектронная почта — сообщение проходит через вашего и нашего почтового провайдера (включая Gmail).\nVercel — размещает сайт.\nSanity — размещает систему контента (только для редакторов).\n\nКаждый обрабатывает данные по своим правилам. Когда вы покидаете наш сайт, действуют их условия.',
        ),
      },
      {
        heading: L('עוגיות', 'ملفات تعريف الارتباط', 'Cookies', 'Файлы cookie'),
        body: L(
          'האתר משתמש באמצעים טכניים הכרחיים להפעלה. אין עוגיות פרסום או מעקב שיווקי נכון לתאריך זה. פירוט בעמוד העוגיות.',
          'يستخدم الموقع وسائل تقنية ضرورية للتشغيل. لا توجد ملفات إعلانية أو تتبع تسويقي حتى هذا التاريخ. التفاصيل في صفحة ملفات الارتباط.',
          'The site uses necessary technical storage to operate. There are no advertising or marketing-tracking cookies as of this date. Details are on the cookies page.',
          'Сайт использует только необходимые технические средства для работы. Рекламных и маркетинговых cookie на эту дату нет. Подробности — на странице cookie.',
        ),
      },
      {
        heading: L('שמירה', 'مدة الاحتفاظ', 'Retention', 'Срок хранения'),
        body: L(
          'פניות בטלפון, בוואטסאפ ובדוא״ל נשמרות כל עוד נדרש לטיפול בפרויקט, לאחריות או לחובה חוקית, ואחר כך נמחקות או מצטמצמות כשאין צורך בהן.',
          'تُحفظ الاستفسارات عبر الهاتف وواتساب والبريد طالما لزم الأمر لتنفيذ المشروع أو الضمان أو التزام قانوني، ثم تُحذف أو تُقلَّص عندما لا تعود هناك حاجة إليها.',
          'Phone, WhatsApp, and email enquiries are kept as long as needed for the project, warranty, or a legal duty, then deleted or reduced when they are no longer needed.',
          'Обращения по телефону, WhatsApp и почте хранятся столько, сколько нужно для проекта, гарантии или законной обязанности, затем удаляются или сокращаются, когда больше не нужны.',
        ),
      },
      {
        heading: L('הזכויות שלכם', 'حقوقكم', 'Your rights', 'Ваши права'),
        body: L(
          'לפי חוק הגנת הפרטיות בישראל ותיקון 13, אפשר לבקש עיון, תיקון או מחיקה של מידע אישי שבידינו, בכפוף לחריגים בחוק. פנו אלינו בטלפון או בדוא״ל. אפשר גם לפנות לרשות להגנת הפרטיות בישראל.\n\nמבקרים בשטחים הפלסטיניים: אין חוק מקביל מלא ל־GDPR. אנחנו מיישמים את אותה שקיפות, ומתייחסים לדין הישראלי כבסיס מחמיר יותר שפורסם לאתר זה. אין בכך כדי לגרוע מזכויות קוגנטיות במקום מגוריכם.',
          'وفق قانون حماية الخصوصية في إسرائيل والتعديل 13، يمكنكم طلب الاطلاع أو التصحيح أو الحذف للمعلومات الشخصية لدينا، مع الاستثناءات التي ينص عليها القانون. تواصلوا معنا عبر الهاتف أو البريد. يمكن أيضًا التواصل مع سلطة حماية الخصوصية في إسرائيل.\n\nزوّار الأراضي الفلسطينية: لا يوجد قانون موازٍ كامل للائحة GDPR. نطبّق الشفافية نفسها، ونعتمد الإطار الإسرائيلي كمعيار أشد منشور لهذا الموقع. لا ينتقص ذلك من أي حقوق إلزامية في مكان إقامتكم.',
          'Under Israel’s Privacy Protection Law and Amendment 13, you may ask to access, correct, or delete personal information we hold, subject to legal exceptions. Contact us by phone or email. You may also contact the Israeli Privacy Protection Authority.\n\nVisitors in the Palestinian territories: there is no full GDPR-equivalent statute. We apply the same transparency and treat Israeli privacy law as the stricter published baseline for this site. That does not limit any mandatory rights where you live.',
          'По Закону о защите частной жизни Израиля и Поправке 13 вы можете запросить доступ, исправление или удаление персональных данных, которые у нас есть, с учётом исключений в законе. Свяжитесь с нами по телефону или почте. Также можно обратиться в Управление по защите частной жизни Израиля.\n\nПосетители на палестинских территориях: полного аналога GDPR нет. Мы применяем ту же прозрачность и берём израильское право как более строгий опубликованный ориентир для этого сайта. Это не ограничивает обязательные права по месту вашего проживания.',
        ),
      },
      {
        heading: L('שינויים', 'التغييرات', 'Changes', 'Изменения'),
        body: L(
          'אם נשנה את אופן הטיפול במידע — למשל אם נוסיף ניתוח או עוגיות שאינן הכרחיות — נעדכן עמוד זה ונטפל בהסכמה כנדרש.',
          'إذا غيّرنا طريقة التعامل مع المعلومات — مثل إضافة تحليلات أو ملفات غير ضرورية — سنحدّث هذه الصفحة ونتعامل مع الموافقة كما يلزم.',
          'If we change how we handle information — for example by adding analytics or non-essential cookies — we will update this page and handle consent as required.',
          'Если мы изменим обработку данных — например добавим аналитику или необязательные cookie — мы обновим эту страницу и получим согласие, если это потребуется.',
        ),
      },
      {
        heading: L('הבהרה', 'تنويه', 'Disclaimer', 'Оговорка'),
        body: L(
          'העמוד נועד לשקיפות באתר שיווקי קטן. הוא אינו ייעוץ משפטי ואינו מבטיח שלא יוגשו תביעות. מומלץ שמשרד עורכי דין באזורי הפעילות יבדוק את הנוסח.',
          'هذه الصفحة للشفافية في موقع تسويقي صغير. ليست استشارة قانونية ولا تضمن عدم رفع دعاوى. يُفضَّل أن يراجع محامٍ في مناطق العمل هذا النص.',
          'This page is for transparency on a small marketing site. It is not legal advice and does not guarantee that no claims will be filed. Have counsel in your operating jurisdictions review the wording.',
          'Эта страница нужна для прозрачности небольшого маркетингового сайта. Это не юридическая консультация и не гарантия отсутствия исков. Текст стоит проверить у юриста в юрисдикциях, где вы работаете.',
        ),
      },
    ],
  ),

  cookies: page(
    L('מדיניות עוגיות', 'سياسة ملفات الارتباط', 'Cookie Policy', 'Политика cookie'),
    L(
      'האתר משתמש באמצעי אחסון טכניים הכרחיים בלבד. אין מעקב פרסומי או שיווקי נכון לתאריך זה.',
      'يستخدم الموقع وسائل تخزين تقنية ضرورية فقط. لا يوجد تتبع إعلاني أو تسويقي حتى هذا التاريخ.',
      'This site uses necessary technical storage only. There is no advertising or marketing tracking as of this date.',
      'Сайт использует только необходимые технические средства. Рекламного и маркетингового отслеживания на эту дату нет.',
    ),
    [
      {
        heading: L('מהן עוגיות', 'ما هي ملفات الارتباط', 'What cookies are', 'Что такое cookie'),
        body: L(
          'עוגיות הן קבצים קטנים שהדפדפן שומר. אחסון מקומי (localStorage) דומה: נשמר במכשיר שלכם לצורך תפקוד האתר.',
          'ملفات الارتباط ملفات صغيرة يحفظها المتصفح. التخزين المحلي (localStorage) مشابه: يُحفظ على جهازكم لتشغيل الموقع.',
          'Cookies are small files stored by the browser. Local storage is similar: it stays on your device so the site can function.',
          'Cookie — небольшие файлы в браузере. Локальное хранилище похоже: данные остаются на вашем устройстве для работы сайта.',
        ),
      },
      {
        heading: L('מה אנחנו משתמשים', 'ما الذي نستخدمه', 'What we use', 'Что мы используем'),
        body: L(
          'עוגיות או אחסון טכני שהדפדפן או ספק האירוח (Vercel) עשויים להגדיר כדי להגיש את האתר בצורה מאובטחת.\nשמירת בחירת באנר העוגיות ב־localStorage במכשיר שלכם — לא למעקב.\n\nnext-intl מוגדר בלי זיהוי שפה אוטומטי, כדי שלא תיווצר עוגיית שפה לצורך זה.\n\nאין Google Analytics, Meta Pixel או סקריפטי פרסום באתר זה נכון לעכשיו.',
          'ملفات أو تخزين تقني قد يضبطه المتصفح أو مزوّد الاستضافة (Vercel) لعرض الموقع بأمان.\nحفظ إغلاق شريط ملفات الارتباط في localStorage على جهازكم — وليس للتتبع.\n\nnext-intl مضبوط بدون اكتشاف لغة تلقائي حتى لا تُنشأ كعكة لغة لهذا الغرض.\n\nلا يوجد Google Analytics أو Meta Pixel أو سكربتات إعلانات على هذا الموقع حاليًا.',
          'Technical cookies or storage that the browser or host (Vercel) may set to serve the site securely.\nRemembering that you dismissed the cookie notice in localStorage on your device — not for tracking.\n\nnext-intl is configured without automatic locale detection, so it should not set a language cookie for that purpose.\n\nThere is no Google Analytics, Meta Pixel, or advertising script on this site at present.',
          'Технические cookie или хранилище, которые браузер или хостинг (Vercel) могут установить для безопасной выдачи сайта.\nЗапоминание закрытия уведомления о cookie в localStorage на вашем устройстве — не для слежки.\n\nnext-intl настроен без автоопределения языка, чтобы не создавать cookie языка для этой цели.\n\nСейчас на сайте нет Google Analytics, Meta Pixel и рекламных скриптов.',
        ),
      },
      {
        heading: L('כשעוזבים את האתר', 'عند مغادرة الموقع', 'When you leave the site', 'Когда вы покидаете сайт'),
        body: L(
          'לחיצה על וואטסאפ, שיחה או דוא״ל מעבירה אתכם לשירות חיצוני. אותם שירותים עשויים להשתמש בעוגיות ובמזהים משלהם.',
          'الضغط على واتساب أو الاتصال أو البريد ينقلكم إلى خدمة خارجية. قد تستخدم تلك الخدمات ملفات تعريف ومعرّفات خاصة بها.',
          'Tapping WhatsApp, calling, or emailing takes you to an external service. Those services may use their own cookies and identifiers.',
          'Переход в WhatsApp, звонок или письмо открывает внешний сервис. Эти сервисы могут использовать свои cookie и идентификаторы.',
        ),
      },
      {
        heading: L('שליטה בדפדפן', 'التحكم من المتصفح', 'Browser controls', 'Настройки браузера'),
        body: L(
          'אפשר לחסום או למחוק עוגיות ואחסון מקומי בהגדרות הדפדפן. חסימה מלאה עלולה לשבור חלקים באתר.',
          'يمكنكم حظر أو حذف ملفات الارتباط والتخزين المحلي من إعدادات المتصفح. الحظر الكامل قد يعطّل أجزاء من الموقع.',
          'You can block or delete cookies and local storage in your browser settings. Blocking everything may break parts of the site.',
          'Вы можете блокировать или удалять cookie и локальное хранилище в настройках браузера. Полная блокировка может сломать части сайта.',
        ),
      },
      {
        heading: L('אם נוסיף מעקב בעתיד', 'إذا أضفنا تتبعًا لاحقًا', 'If we add tracking later', 'Если позже добавим отслеживание'),
        body: L(
          'עוגיות שאינן הכרחיות (ניתוח, פרסום, שיווק) יופעלו רק אחרי הסכמה מפורשת — לא כברירת מחדל.',
          'لن تُشغَّل الملفات غير الضرورية (تحليلات، إعلانات، تسويق) إلا بعد موافقة صريحة — وليس تلقائيًا.',
          'Non-essential cookies (analytics, ads, marketing) would run only after explicit consent — not by default.',
          'Необязательные cookie (аналитика, реклама, маркетинг) будут включаться только после явного согласия — не по умолчанию.',
        ),
      },
      {
        heading: L('יצירת קשר', 'التواصل', 'Contact', 'Контакты'),
        body: L(
          `שאלות על עוגיות: ${CONTACT_DEFAULTS.email} או ${CONTACT_DEFAULTS.phoneDisplay}.`,
          `لأسئلة ملفات الارتباط: ${CONTACT_DEFAULTS.email} أو ${CONTACT_DEFAULTS.phoneDisplay}.`,
          `Questions about cookies: ${CONTACT_DEFAULTS.email} or ${CONTACT_DEFAULTS.phoneDisplay}.`,
          `Вопросы о cookie: ${CONTACT_DEFAULTS.email} или ${CONTACT_DEFAULTS.phoneDisplay}.`,
        ),
      },
    ],
  ),

  terms: page(
    L('תנאי שימוש', 'شروط الاستخدام', 'Terms of Use', 'Условия использования'),
    L(
      'תנאים אלה חלים על השימוש באתר officialnoragroup.com. הם אינם חוזה לביצוע עבודת נגרות — הצעת מחיר והזמנה נסגרות בשיחה או בוואטסאפ.',
      'تسري هذه الشروط على استخدام موقع officialnoragroup.com. ليست عقدًا لتنفيذ أعمال النجارة — العرض والطلب يُغلقان عبر الهاتف أو واتساب.',
      'These terms apply to use of officialnoragroup.com. They are not a contract for carpentry work — quotes and orders are agreed by phone or WhatsApp.',
      'Эти условия относятся к использованию сайта officialnoragroup.com. Это не договор на столярные работы — смета и заказ согласовываются по телефону или в WhatsApp.',
    ),
    [
      {
        heading: L('האתר', 'الموقع', 'The website', 'Сайт'),
        body: L(
          'האתר מציג את Nora Group, שירותי נגרות ועיצוב פנים, ודרכי יצירת קשר. התוכן מיועד למידע כללי.',
          'يعرض الموقع Nora Group وخدمات النجارة والتصميم الداخلي ووسائل التواصل. المحتوى لأغراض معلوماتية عامة.',
          'The site presents Nora Group, carpentry and interior-design services, and how to reach us. Content is for general information.',
          'Сайт представляет Nora Group, столярные услуги и дизайн интерьера, а также способы связи. Материалы носят общий информационный характер.',
        ),
      },
      {
        heading: L('אין הצעת מחיר באתר', 'لا يوجد عرض سعر على الموقع', 'No on-site quote', 'На сайте нет сметы'),
        body: L(
          'אין משפך הזמנות או טופס שמחייב צד כלשהו. מחיר, לוח זמנים ואחריות נקבעים בשיחה ונרשמים במסמך ההזמנה.',
          'لا توجد قناة طلبات أو نموذج يُلزم أي طرف. السعر والجدول والضمان يُحدَّدان في الاستشارة ويُوثَّقان في مستند الطلب.',
          'There is no order funnel or form that binds either party. Price, schedule, and warranty are set in consultation and written in the order document.',
          'Нет воронки заказов и формы, которая обязывает стороны. Цена, сроки и гарантия определяются на консультации и фиксируются в документе заказа.',
        ),
      },
      {
        heading: L('תוכן וזכויות', 'المحتوى والحقوق', 'Content and rights', 'Контент и права'),
        body: L(
          'הטקסטים, התמונות והסימנים באתר שייכים ל־Nora Group או לבעליהם. אין להעתיק לשימוש מסחרי בלי אישור.',
          'النصوص والصور والعلامات في الموقع تخص Nora Group أو أصحابها. لا يُنسخ للاستخدام التجاري دون إذن.',
          'Text, images, and marks on the site belong to Nora Group or their owners. Do not copy them for commercial use without permission.',
          'Тексты, изображения и обозначения на сайте принадлежат Nora Group или их владельцам. Не копируйте их в коммерческих целях без разрешения.',
        ),
      },
      {
        heading: L('דיוק', 'الدقة', 'Accuracy', 'Точность'),
        body: L(
          'משתדלים שהמידע יהיה עדכני, אך תיאורי פרויקטים, חומרים וזמנים עשויים להשתנות. התחייבות ללקוח היא רק במה שסוכם בכתב.',
          'نحرص على أن تكون المعلومات محدّثة، لكن أوصاف المشاريع والخامات والمواعيد قد تتغير. الالتزام تجاه العميل يكون فقط بما يُتفق عليه كتابةً.',
          'We try to keep information current, but project descriptions, materials, and timing can change. A commitment to a client is only what is agreed in writing.',
          'Мы стараемся держать информацию актуальной, но описания проектов, материалы и сроки могут меняться. Обязательство перед клиентом — только то, что согласовано письменно.',
        ),
      },
      {
        heading: L('קישורים חיצוניים', 'روابط خارجية', 'External links', 'Внешние ссылки'),
        body: L(
          'וואטסאפ, דוא״ל וקישורים אחרים מובילים לשירותים שאינם בשליטתנו.',
          'واتساب والبريد والروابط الأخرى تؤدي إلى خدمات خارجة عن سيطرتنا.',
          'WhatsApp, email, and other links lead to services we do not control.',
          'WhatsApp, почта и другие ссылки ведут на сервисы, которые мы не контролируем.',
        ),
      },
      {
        heading: L('אחריות', 'المسؤولية', 'Liability', 'Ответственность'),
        body: L(
          'האתר מסופק כפי שהוא. ככל שהדין מתיר, אין אחריות לנזק עקיף משימוש באתר. אין בכך כדי לגרוע מאחריות לפי דין קוגנטי או מאחריות לפי הזמנת עבודה חתומה.',
          'يُقدَّم الموقع كما هو. بقدر ما يسمح القانون، لا نتحمل ضررًا غير مباشر من استخدام الموقع. لا ينتقص ذلك من المسؤولية بموجب قانون إلزامي أو من التزام في طلب عمل موقّع.',
          'The site is provided as is. To the extent allowed by law, we are not liable for indirect loss from using the site. This does not limit mandatory legal duties or liability under a signed work order.',
          'Сайт предоставляется «как есть». В пределах, допускаемых законом, мы не отвечаем за косвенный ущерб от использования сайта. Это не ограничивает императивные нормы и ответственность по подписанному заказу.',
        ),
      },
      {
        heading: L('דין', 'القانون الواجب', 'Governing law', 'Применимое право'),
        body: L(
          'לשאלות על השימוש באתר נתייחס לדין הישראלי כמסגרת התפעולית, בלי לגרוע מזכויות קוגנטיות במקום מגורי המבקר.',
          'لأسئلة استخدام الموقع نعتمد القانون الإسرائيلي إطارًا تشغيليًا، دون الانتقاص من الحقوق الإلزامية في مكان إقامة الزائر.',
          'For questions about use of this website we treat Israeli law as the operational framework, without limiting mandatory rights where the visitor lives.',
          'По вопросам использования сайта мы рассматриваем право Израиля как рабочую рамку, не ограничивая обязательные права по месту жительства посетителя.',
        ),
      },
      {
        heading: L('יצירת קשר', 'التواصل', 'Contact', 'Контакты'),
        body: L(
          CONTACT_BLOCK,
          CONTACT_BLOCK,
          CONTACT_BLOCK,
          CONTACT_BLOCK,
        ),
      },
      {
        heading: L('הבהרה', 'تنويه', 'Disclaimer', 'Оговорка'),
        body: L(
          'תנאים אלה אינם ייעוץ משפטי. מומלץ בדיקת עורך דין לפני הסתמכות עליהם כמסמך מחייב.',
          'هذه الشروط ليست استشارة قانونية. يُفضَّل مراجعة محامٍ قبل الاعتماد عليها كمستند ملزم.',
          'These terms are not legal advice. Have a lawyer review them before treating them as a binding document.',
          'Эти условия не являются юридической консультацией. Перед тем как считать их обязывающим документом, их стоит проверить у юриста.',
        ),
      },
    ],
  ),
};
