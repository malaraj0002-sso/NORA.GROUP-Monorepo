import { defineField, defineType } from 'sanity';

/**
 * Field-level i18n: Arabic first for this Studio, Hebrew for the default site locale,
 * EN/RU collapsed so editors are not staring at four boxes on every line.
 */
export const localeString = defineType({
  name: 'localeString',
  title: 'نص متعدد اللغات',
  type: 'object',
  fieldsets: [
    {
      name: 'moreLangs',
      title: 'English / Русский',
      options: { collapsible: true, collapsed: true },
    },
  ],
  fields: [
    defineField({ name: 'ar', title: 'العربية', type: 'string', validation: (R) => R.max(200) }),
    defineField({
      name: 'he',
      title: 'العبرية (الموقع الافتراضي)',
      type: 'string',
      validation: (Rule) => Rule.required().max(200),
    }),
    defineField({
      name: 'en',
      title: 'English',
      type: 'string',
      fieldset: 'moreLangs',
      validation: (R) => R.max(200),
    }),
    defineField({
      name: 'ru',
      title: 'Русский',
      type: 'string',
      fieldset: 'moreLangs',
      validation: (R) => R.max(200),
    }),
  ],
});

export const localeText = defineType({
  name: 'localeText',
  title: 'فقرة متعددة اللغات',
  type: 'object',
  fieldsets: [
    {
      name: 'moreLangs',
      title: 'English / Русский',
      options: { collapsible: true, collapsed: true },
    },
  ],
  fields: [
    defineField({ name: 'ar', title: 'العربية', type: 'text', rows: 4 }),
    defineField({
      name: 'he',
      title: 'العبرية (الموقع الافتراضي)',
      type: 'text',
      rows: 4,
      validation: (Rule) => Rule.required().max(2000),
    }),
    defineField({ name: 'en', title: 'English', type: 'text', rows: 4, fieldset: 'moreLangs' }),
    defineField({ name: 'ru', title: 'Русский', type: 'text', rows: 4, fieldset: 'moreLangs' }),
  ],
});
