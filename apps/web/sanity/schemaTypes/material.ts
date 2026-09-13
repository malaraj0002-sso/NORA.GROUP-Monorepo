import { defineField, defineType } from 'sanity';

export const material = defineType({
  name: 'material',
  title: 'المواد',
  type: 'document',
  fields: [
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'name.he' },
      validation: (R) => R.required(),
      readOnly: ({ value }) => Boolean(value?.current),
    }),
    defineField({ name: 'name', title: 'الاسم', type: 'localeString', validation: (R) => R.required() }),
    defineField({ name: 'description', title: 'الوصف', type: 'localeText' }),
    defineField({ name: 'characteristics', title: 'الخصائص', type: 'localeText' }),
    defineField({ name: 'applications', title: 'الاستخدامات', type: 'localeText' }),
    defineField({ name: 'finishes', title: 'التشطيبات', type: 'localeText' }),
    defineField({ name: 'image', title: 'الصورة', type: 'image', options: { hotspot: true } }),
    defineField({ name: 'order', title: 'الترتيب', type: 'number', initialValue: 0 }),
    defineField({ name: 'visible', title: 'ظاهر في الموقع', type: 'boolean', initialValue: true }),
  ],
  preview: {
    select: { titleAr: 'name.ar', titleHe: 'name.he', media: 'image' },
    prepare: ({ titleAr, titleHe, media }) => ({
      title: titleAr || titleHe || 'مادة',
      media,
    }),
  },
});
