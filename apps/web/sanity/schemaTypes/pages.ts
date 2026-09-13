import { defineField, defineType } from 'sanity';

const pageHeroFields = [
  defineField({ name: 'eyebrow', title: 'سطر علوي', type: 'localeString' }),
  defineField({ name: 'title', title: 'العنوان', type: 'localeString' }),
  defineField({ name: 'subtitle', title: 'العنوان الفرعي', type: 'localeText' }),
  defineField({ name: 'image', title: 'صورة الخلفية', type: 'image', options: { hotspot: true } }),
];

export const aboutPage = defineType({
  name: 'aboutPage',
  title: 'من نحن',
  type: 'document',
  fields: [
    ...pageHeroFields,
    defineField({ name: 'body', title: 'المحتوى', type: 'localeText' }),
    defineField({ name: 'valuesTitle', title: 'عنوان القيم', type: 'localeString' }),
    defineField({
      name: 'values',
      title: 'القيم',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'title', type: 'localeString', title: 'العنوان' },
            { name: 'desc', type: 'localeText', title: 'الوصف' },
          ],
        },
      ],
    }),
  ],
  preview: { prepare: () => ({ title: 'من نحن' }) },
});

export const howWeWorkPage = defineType({
  name: 'howWeWorkPage',
  title: 'طريقة عملنا',
  type: 'document',
  fields: [
    ...pageHeroFields,
    defineField({
      name: 'steps',
      title: 'الخطوات',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'number', type: 'string', title: 'الرقم' },
            { name: 'title', type: 'localeString', title: 'العنوان' },
            { name: 'description', type: 'localeText', title: 'الوصف' },
          ],
          preview: { select: { title: 'title.ar', subtitle: 'number' } },
        },
      ],
    }),
  ],
  preview: { prepare: () => ({ title: 'طريقة عملنا' }) },
});

export const contactPage = defineType({
  name: 'contactPage',
  title: 'تواصل معنا',
  type: 'document',
  fields: pageHeroFields,
  preview: { prepare: () => ({ title: 'تواصل معنا' }) },
});

export const uiLabels = defineType({
  name: 'uiLabels',
  title: 'تسميات الواجهة',
  type: 'document',
  fields: [
    defineField({
      name: 'locale',
      title: 'اللغة',
      type: 'string',
      options: {
        list: [
          { title: 'العبرية', value: 'he' },
          { title: 'العربية', value: 'ar' },
          { title: 'English', value: 'en' },
          { title: 'Русский', value: 'ru' },
        ],
      },
      validation: (R) => R.required(),
    }),
    defineField({ name: 'home', type: 'string', title: 'الرئيسية' }),
    defineField({ name: 'about', type: 'string', title: 'من نحن' }),
    defineField({ name: 'services', type: 'string', title: 'الخدمات' }),
    defineField({ name: 'projects', type: 'string', title: 'الأعمال' }),
    defineField({ name: 'materials', type: 'string', title: 'المواد' }),
    defineField({ name: 'howWeWork', type: 'string', title: 'طريقة العمل' }),
    defineField({ name: 'testimonials', type: 'string', title: 'آراء العملاء' }),
    defineField({ name: 'blog', type: 'string', title: 'المدونة' }),
    defineField({ name: 'faq', type: 'string', title: 'الأسئلة' }),
    defineField({ name: 'contact', type: 'string', title: 'تواصل معنا' }),
    defineField({ name: 'callUs', type: 'string', title: 'اتصلوا بنا' }),
    defineField({ name: 'whatsapp', type: 'string', title: 'واتساب' }),
    defineField({ name: 'viewWork', type: 'string', title: 'استعرضوا أعمالنا' }),
    defineField({ name: 'learnMore', type: 'string', title: 'اعرفوا المزيد' }),
    defineField({ name: 'viewAll', type: 'string', title: 'عرض الكل' }),
    defineField({ name: 'viewProject', type: 'string', title: 'عرض المشروع' }),
    defineField({ name: 'readMore', type: 'string', title: 'اقرأ المزيد' }),
    defineField({ name: 'backHome', type: 'string', title: 'العودة للرئيسية' }),
    defineField({ name: 'all', type: 'string', title: 'الكل' }),
    defineField({ name: 'footerCta', type: 'string', title: 'دعوة التذييل' }),
    defineField({ name: 'footerTagline', type: 'text', title: 'سطر التذييل' }),
    defineField({ name: 'servicesTitle', type: 'string', title: 'عنوان الخدمات في التذييل' }),
    defineField({ name: 'navTitle', type: 'string', title: 'عنوان التنقل في التذييل' }),
    defineField({ name: 'contactTitle', type: 'string', title: 'عنوان التواصل في التذييل' }),
    defineField({ name: 'languagesTitle', type: 'string', title: 'عنوان اللغات' }),
    defineField({ name: 'notFoundTitle', type: 'string', title: 'عنوان 404' }),
    defineField({ name: 'notFoundBody', type: 'text', title: 'نص 404' }),
    defineField({ name: 'relatedProjects', type: 'string', title: 'مشاريع ذات صلة' }),
  ],
  preview: {
    select: { locale: 'locale' },
    prepare: ({ locale }) => ({ title: `تسميات — ${locale}` }),
  },
});
