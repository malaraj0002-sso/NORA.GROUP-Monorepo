import { defineField, defineType } from 'sanity';

export const blogPost = defineType({
  name: 'blogPost',
  title: 'المدونة',
  type: 'document',
  fields: [
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title.he' },
      validation: (R) => R.required(),
      readOnly: ({ value }) => Boolean(value?.current),
    }),
    defineField({ name: 'title', title: 'العنوان', type: 'localeString', validation: (R) => R.required() }),
    defineField({ name: 'excerpt', title: 'المقتطف', type: 'localeText' }),
    defineField({ name: 'content', title: 'المحتوى', type: 'localeText' }),
    defineField({ name: 'category', title: 'التصنيف', type: 'string' }),
    defineField({ name: 'author', title: 'الكاتب', type: 'string', initialValue: 'Nora Group' }),
    defineField({ name: 'date', title: 'التاريخ', type: 'date' }),
    defineField({ name: 'image', title: 'الصورة', type: 'image', options: { hotspot: true } }),
    defineField({ name: 'visible', title: 'ظاهر في الموقع', type: 'boolean', initialValue: true }),
  ],
  preview: {
    select: { titleAr: 'title.ar', titleHe: 'title.he', media: 'image', date: 'date' },
    prepare: ({ titleAr, titleHe, media, date }) => ({
      title: titleAr || titleHe || 'مقال',
      subtitle: date,
      media,
    }),
  },
});
