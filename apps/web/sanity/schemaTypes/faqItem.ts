import { defineField, defineType } from 'sanity';

export const faqItem = defineType({
  name: 'faqItem',
  title: 'الأسئلة الشائعة',
  type: 'document',
  fields: [
    defineField({ name: 'category', title: 'التصنيف', type: 'string' }),
    defineField({ name: 'question', title: 'السؤال', type: 'localeString', validation: (R) => R.required() }),
    defineField({ name: 'answer', title: 'الجواب', type: 'localeText', validation: (R) => R.required() }),
    defineField({ name: 'order', title: 'الترتيب', type: 'number', initialValue: 0 }),
    defineField({ name: 'visible', title: 'ظاهر في الموقع', type: 'boolean', initialValue: true }),
  ],
  preview: {
    select: { titleAr: 'question.ar', titleHe: 'question.he', subtitle: 'category' },
    prepare: ({ titleAr, titleHe, subtitle }) => ({
      title: titleAr || titleHe || 'سؤال',
      subtitle,
    }),
  },
});
