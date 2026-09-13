import { defineField, defineType } from 'sanity';

export const testimonial = defineType({
  name: 'testimonial',
  title: 'آراء العملاء',
  type: 'document',
  fields: [
    defineField({ name: 'name', title: 'اسم العميل', type: 'string', validation: (R) => R.required() }),
    defineField({
      name: 'rating',
      title: 'التقييم',
      type: 'number',
      validation: (R) => R.min(1).max(5).required(),
      initialValue: 5,
    }),
    defineField({ name: 'review', title: 'الرأي', type: 'localeText', validation: (R) => R.required() }),
    defineField({ name: 'project', title: 'نوع المشروع', type: 'localeString' }),
    defineField({ name: 'order', title: 'الترتيب', type: 'number', initialValue: 0 }),
    defineField({ name: 'visible', title: 'ظاهر في الموقع', type: 'boolean', initialValue: true }),
  ],
  preview: {
    select: { title: 'name', subtitle: 'project.ar' },
  },
});
