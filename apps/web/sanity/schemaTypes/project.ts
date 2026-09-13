import { defineField, defineType } from 'sanity';
import { ImagesIcon } from '@sanity/icons';

export const project = defineType({
  name: 'project',
  title: 'المشاريع',
  type: 'document',
  icon: ImagesIcon,
  fields: [
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title.he', maxLength: 80 },
      validation: (R) => R.required(),
      readOnly: ({ value }) => Boolean(value?.current),
    }),
    defineField({ name: 'title', title: 'العنوان', type: 'localeString', validation: (R) => R.required() }),
    defineField({ name: 'description', title: 'الوصف', type: 'localeText' }),
    defineField({
      name: 'category',
      title: 'التصنيف',
      type: 'string',
      options: {
        list: [
          { title: 'مطابخ', value: 'kitchens' },
          { title: 'غرف نوم', value: 'bedrooms' },
          { title: 'خزائن', value: 'wardrobes' },
          { title: 'أثاث', value: 'furniture' },
          { title: 'تجاري', value: 'commercial' },
        ],
        layout: 'radio',
      },
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'gallery',
      title: 'المعرض',
      type: 'array',
      of: [
        {
          type: 'image',
          options: { hotspot: true },
          fields: [{ name: 'alt', type: 'localeString', title: 'النص البديل' }],
        },
      ],
    }),
    defineField({
      name: 'materials',
      title: 'المواد',
      type: 'array',
      of: [{ type: 'string' }],
    }),
    defineField({ name: 'order', title: 'الترتيب', type: 'number', initialValue: 0 }),
    defineField({ name: 'visible', title: 'ظاهر في الموقع', type: 'boolean', initialValue: true }),
  ],
  preview: {
    select: { titleAr: 'title.ar', titleHe: 'title.he', media: 'gallery.0', category: 'category' },
    prepare: ({ titleAr, titleHe, media, category }) => ({
      title: titleAr || titleHe || 'مشروع',
      subtitle: category,
      media,
    }),
  },
});
