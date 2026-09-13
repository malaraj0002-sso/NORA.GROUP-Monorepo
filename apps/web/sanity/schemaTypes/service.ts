import { defineField, defineType } from 'sanity';
import { CaseIcon } from '@sanity/icons';

export const service = defineType({
  name: 'service',
  title: 'الخدمات',
  type: 'document',
  icon: CaseIcon,
  fields: [
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title.he', maxLength: 64 },
      validation: (R) => R.required(),
      readOnly: ({ value }) => Boolean(value?.current),
    }),
    defineField({ name: 'title', title: 'العنوان', type: 'localeString', validation: (R) => R.required() }),
    defineField({ name: 'description', title: 'الوصف', type: 'localeText' }),
    defineField({ name: 'image', title: 'الصورة', type: 'image', options: { hotspot: true } }),
    defineField({
      name: 'imageAlt',
      title: 'النص البديل للصورة',
      type: 'localeString',
    }),
    defineField({
      name: 'features',
      title: 'المميزات',
      type: 'array',
      of: [{ type: 'localeString' }],
    }),
    defineField({
      name: 'order',
      title: 'ترتيب العرض',
      type: 'number',
      initialValue: 0,
    }),
    defineField({
      name: 'visible',
      title: 'ظاهر في الموقع',
      type: 'boolean',
      initialValue: true,
    }),
  ],
  orderings: [{ title: 'الترتيب', name: 'orderAsc', by: [{ field: 'order', direction: 'asc' }] }],
  preview: {
    select: { titleAr: 'title.ar', titleHe: 'title.he', media: 'image', visible: 'visible' },
    prepare: ({ titleAr, titleHe, media, visible }) => ({
      title: titleAr || titleHe || 'خدمة',
      subtitle: visible === false ? 'مخفي' : 'ظاهر',
      media,
    }),
  },
});
