import { defineField, defineType } from 'sanity';
import { HomeIcon } from '@sanity/icons';

export const homePage = defineType({
  name: 'homePage',
  title: 'الصفحة الرئيسية',
  type: 'document',
  icon: HomeIcon,
  groups: [
    { name: 'hero', title: 'القسم الرئيسي', default: true },
    { name: 'intro', title: 'المقدمة' },
    { name: 'why', title: 'لماذا نحن' },
    { name: 'sections', title: 'أقسام الصفحة' },
    { name: 'cta', title: 'دعوة للتواصل' },
  ],
  fields: [
    defineField({ name: 'heroTitle', title: 'عنوان القسم الرئيسي', type: 'localeString', group: 'hero' }),
    defineField({ name: 'heroSubtitle', title: 'العنوان الفرعي للقسم الرئيسي', type: 'localeText', group: 'hero' }),
    defineField({
      name: 'heroImages',
      title: 'صور القسم الرئيسي',
      type: 'array',
      group: 'hero',
      of: [{ type: 'image', options: { hotspot: true } }],
    }),
    defineField({ name: 'introEyebrow', title: 'المقدمة — سطر علوي', type: 'localeString', group: 'intro' }),
    defineField({ name: 'introTitle', title: 'المقدمة — العنوان', type: 'localeString', group: 'intro' }),
    defineField({ name: 'introDescription', title: 'المقدمة — الوصف', type: 'localeText', group: 'intro' }),
    defineField({
      name: 'introFeatures',
      title: 'المقدمة — المميزات',
      type: 'array',
      group: 'intro',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'title', type: 'localeString', title: 'العنوان' },
            { name: 'desc', type: 'localeText', title: 'الوصف' },
          ],
          preview: { select: { title: 'title.ar' } },
        },
      ],
    }),
    defineField({ name: 'whyEyebrow', title: 'لماذا نحن — سطر علوي', type: 'localeString', group: 'why' }),
    defineField({ name: 'whyTitle', title: 'لماذا نحن — العنوان', type: 'localeString', group: 'why' }),
    defineField({ name: 'whySubtitle', title: 'لماذا نحن — العنوان الفرعي', type: 'localeText', group: 'why' }),
    defineField({
      name: 'whyItems',
      title: 'لماذا نحن — البنود',
      type: 'array',
      group: 'why',
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
    defineField({ name: 'processEyebrow', type: 'localeString', title: 'طريقة العمل — سطر علوي', group: 'sections' }),
    defineField({ name: 'processTitle', type: 'localeString', title: 'طريقة العمل — العنوان', group: 'sections' }),
    defineField({ name: 'processSubtitle', type: 'localeText', title: 'طريقة العمل — العنوان الفرعي', group: 'sections' }),
    defineField({ name: 'servicesEyebrow', type: 'localeString', title: 'الخدمات — سطر علوي', group: 'sections' }),
    defineField({ name: 'servicesTitle', type: 'localeString', title: 'الخدمات — العنوان', group: 'sections' }),
    defineField({ name: 'servicesSubtitle', type: 'localeText', title: 'الخدمات — العنوان الفرعي', group: 'sections' }),
    defineField({ name: 'projectsEyebrow', type: 'localeString', title: 'المشاريع — سطر علوي', group: 'sections' }),
    defineField({ name: 'projectsTitle', type: 'localeString', title: 'المشاريع — العنوان', group: 'sections' }),
    defineField({ name: 'projectsSubtitle', type: 'localeText', title: 'المشاريع — العنوان الفرعي', group: 'sections' }),
    defineField({ name: 'materialsEyebrow', type: 'localeString', title: 'المواد — سطر علوي', group: 'sections' }),
    defineField({ name: 'materialsTitle', type: 'localeString', title: 'المواد — العنوان', group: 'sections' }),
    defineField({ name: 'materialsSubtitle', type: 'localeText', title: 'المواد — العنوان الفرعي', group: 'sections' }),
    defineField({ name: 'testimonialsEyebrow', type: 'localeString', title: 'الآراء — سطر علوي', group: 'sections' }),
    defineField({ name: 'testimonialsTitle', type: 'localeString', title: 'الآراء — العنوان', group: 'sections' }),
    defineField({ name: 'testimonialsSubtitle', type: 'localeText', title: 'الآراء — العنوان الفرعي', group: 'sections' }),
    defineField({ name: 'ctaTitle', type: 'localeString', title: 'دعوة للتواصل — العنوان', group: 'cta' }),
    defineField({ name: 'ctaSubtitle', type: 'localeText', title: 'دعوة للتواصل — العنوان الفرعي', group: 'cta' }),
  ],
  preview: {
    prepare: () => ({ title: 'الصفحة الرئيسية' }),
  },
});
