import { z } from 'zod';
import { isForbiddenDoorService } from '@/lib/db/services';

export const localePatchSchema = z.object({
  he: z.string().optional(),
  ar: z.string().optional(),
  en: z.string().optional(),
  ru: z.string().optional(),
});

export const PROJECT_CATEGORIES = [
  'kitchens',
  'bedrooms',
  'wardrobes',
  'furniture',
  'commercial',
] as const;

export const SERVICE_SLUGS = [
  'kitchens',
  'bedrooms',
  'wardrobes',
  'walk-in-closets',
  'custom-furniture',
  'offices',
  'commercial',
] as const;

const idSchema = z
  .string()
  .min(1)
  .max(200)
  .regex(/^[a-zA-Z0-9._-]+$/);

const mediaIdSchema = z.string().min(1).max(200).regex(/^[a-zA-Z0-9._-]+$/);

export const mutationSchema = z.discriminatedUnion('resource', [
  z.object({
    resource: z.literal('project'),
    op: z.enum(['patch', 'create', 'delete']),
    id: idSchema.optional(),
    data: z
      .object({
        title: localePatchSchema.optional(),
        description: localePatchSchema.optional(),
        category: z.enum(PROJECT_CATEGORIES).optional(),
        woodTypes: z.array(z.string().max(80)).optional(),
        published: z.boolean().optional(),
        assetIds: z.array(mediaIdSchema).max(20).optional(),
        slug: z
          .string()
          .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/i)
          .max(80)
          .optional(),
      })
      .optional(),
  }),
  z.object({
    resource: z.literal('service'),
    op: z.enum(['patch', 'create', 'delete']),
    id: idSchema.optional(),
    data: z
      .object({
        title: localePatchSchema.optional(),
        description: localePatchSchema.optional(),
        published: z.boolean().optional(),
        slug: z.enum(SERVICE_SLUGS).optional(),
        assetIds: z.array(mediaIdSchema).max(1).optional(),
        features: z.array(localePatchSchema).max(20).optional(),
      })
      .optional(),
  }),
  z.object({
    resource: z.literal('material'),
    op: z.enum(['patch', 'create', 'delete']),
    id: idSchema.optional(),
    data: z
      .object({
        nameHe: z.string().max(200).optional(),
        nameAr: z.string().max(200).optional(),
        nameEn: z.string().max(200).optional(),
        description: localePatchSchema.optional(),
        published: z.boolean().optional(),
        slug: z
          .string()
          .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/i)
          .max(80)
          .optional(),
        assetIds: z.array(mediaIdSchema).max(1).optional(),
        characteristics: localePatchSchema.optional(),
        applications: localePatchSchema.optional(),
        finishes: localePatchSchema.optional(),
      })
      .optional(),
  }),
  z.object({
    resource: z.literal('testimonial'),
    op: z.enum(['patch', 'create', 'delete']),
    id: idSchema.optional(),
    data: z
      .object({
        clientName: z.string().max(200).optional(),
        rating: z.number().min(1).max(5).optional(),
        text: localePatchSchema.optional(),
        published: z.boolean().optional(),
        project: localePatchSchema.optional(),
      })
      .optional(),
  }),
  z.object({
    resource: z.literal('faq'),
    op: z.enum(['patch', 'create', 'delete']),
    id: idSchema.optional(),
    data: z
      .object({
        question: localePatchSchema.optional(),
        answer: localePatchSchema.optional(),
        order: z.number().int().optional(),
        published: z.boolean().optional(),
        category: z.string().max(80).optional(),
      })
      .optional(),
  }),
  z.object({
    resource: z.literal('blog'),
    op: z.enum(['patch', 'create', 'delete']),
    id: idSchema.optional(),
    data: z
      .object({
        title: localePatchSchema.optional(),
        excerpt: localePatchSchema.optional(),
        content: localePatchSchema.optional(),
        author: z.string().max(120).optional(),
        publishedAt: z.string().max(32).optional(),
        published: z.boolean().optional(),
        slug: z
          .string()
          .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/i)
          .max(80)
          .optional(),
        assetIds: z.array(mediaIdSchema).max(1).optional(),
        category: z.string().max(80).optional(),
      })
      .optional(),
  }),
  z.object({
    resource: z.literal('site'),
    op: z.literal('patch'),
    data: z.object({
      siteName: z.string().max(120).optional(),
      tagline: localePatchSchema.optional(),
      contactEmail: z.string().email().optional(),
      contactAddress: localePatchSchema.optional(),
      contactPhone: z.string().max(40).optional(),
      phoneTel: z.string().max(24).optional(),
      whatsappE164: z.string().max(24).optional(),
      assetIds: z.array(mediaIdSchema).max(3).optional(),
    }),
  }),
  z.object({
    resource: z.literal('about'),
    op: z.literal('patch'),
    data: z.object({
      story: localePatchSchema.optional(),
    }),
  }),
  z.object({
    resource: z.literal('homepage'),
    op: z.literal('patch'),
    data: z.object({
      heroTitle: localePatchSchema.optional(),
      heroSubtitle: localePatchSchema.optional(),
      introTitle: localePatchSchema.optional(),
      introDescription: localePatchSchema.optional(),
      ctaTitle: localePatchSchema.optional(),
      ctaSubtitle: localePatchSchema.optional(),
    }),
  }),
  z.object({
    resource: z.literal('hero'),
    op: z.literal('patch'),
    data: z.object({
      assetIds: z.array(mediaIdSchema).max(20),
    }),
  }),
  z.object({
    resource: z.literal('howWeWork'),
    op: z.literal('patch'),
    data: z.object({
      steps: z
        .array(
          z.object({
            id: z.string().regex(/^[a-zA-Z0-9._-]+$/).max(80),
            number: z.string().max(8).optional(),
            title: localePatchSchema.optional(),
            description: localePatchSchema.optional(),
          }),
        )
        .max(20),
    }),
  }),
  z.object({
    resource: z.literal('contact'),
    op: z.literal('patch'),
    data: z.object({
      eyebrow: localePatchSchema.optional(),
      title: localePatchSchema.optional(),
      subtitle: localePatchSchema.optional(),
    }),
  }),
  z.object({
    resource: z.literal('uiCopy'),
    op: z.literal('patch'),
    data: z.object({
      locale: z.enum(['he', 'ar', 'en', 'ru']),
      namespace: z.enum(['nav', 'ui', 'category']),
      key: z.string().min(1).max(80).regex(/^[a-zA-Z0-9._-]+$/),
      value: z.string().max(2000),
    }),
  }),
  z.object({
    resource: z.literal('legal'),
    op: z.literal('patch'),
    data: z.object({
      slug: z.enum(['privacy', 'cookies', 'terms']),
      title: localePatchSchema.optional(),
      updated: localePatchSchema.optional(),
      intro: localePatchSchema.optional(),
      sections: z
        .array(
          z.object({
            heading: localePatchSchema.optional(),
            body: localePatchSchema.optional(),
          }),
        )
        .max(40)
        .optional(),
    }),
  }),
]);

export type MutationInput = z.infer<typeof mutationSchema>;

export function rejectDoorMutation(input: MutationInput): string | null {
  if (input.resource !== 'service') return null;
  const title = input.data?.title;
  if (
    isForbiddenDoorService({
      id: input.id,
      slug: input.data?.slug,
      title: title
        ? { he: title.he || '', ar: title.ar || '', en: title.en || '', ru: title.ru || '' }
        : undefined,
    })
  ) {
    return 'Door services are not permitted';
  }
  return null;
}
