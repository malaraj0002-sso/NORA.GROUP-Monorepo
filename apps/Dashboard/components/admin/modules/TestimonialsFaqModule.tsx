'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, HelpCircle, Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { useAdminData } from '@/lib/AdminDataContext';
import { GlassCard, SectionHeader, FieldLabel, AddButton, DeleteButton, ReorderButtons, ItemRow, PublishToggle, StatusBadge, StarRating, EmptyState } from '../shared';
import { LocalizedInput, LanguageTabs } from '../LanguageTabs';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { CmsNotice } from '@/components/admin/CmsNotice';
import { compactLocale, isLocalDraftId, postCms } from '@/lib/cms-client';
import { useUiI18n } from '@/lib/i18n/UiI18nProvider';

export function TestimonialsFaqModule() {
  const {
    data, addTestimonial, updateTestimonial, deleteTestimonial,
    addFAQ, updateFAQ, deleteFAQ, reorderFAQs,
  } = useAdminData();
  const { t } = useUiI18n();
  const [tab, setTab] = useState('testimonials');

  return (
    <div className="space-y-6">
      <SectionHeader title={t('testimonials.title')} subtitle={t('testimonials.subtitle')} icon={MessageSquare} />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-muted/50 border border-border/50">
          <TabsTrigger value="testimonials" className="data-[state=active]:bg-gold/10 data-[state=active]:text-gold">
            {t('nav.testimonials')} ({data.testimonials.length})
          </TabsTrigger>
          <TabsTrigger value="faq" className="data-[state=active]:bg-gold/10 data-[state=active]:text-gold">
            {t('faq.tab')} ({data.faqs.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="testimonials" className="space-y-4">
          <div className="flex justify-end">
            <AddButton onClick={addTestimonial} label={t('testimonials.add')} />
          </div>
          {data.testimonials.length === 0 ? (
            <EmptyState icon={MessageSquare} title={t('testimonials.empty')} description={t('testimonials.emptyHint')} action={<AddButton onClick={addTestimonial} label={t('testimonials.add')} />} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AnimatePresence>
                {data.testimonials.map((item) => (
                  <ItemRow key={item.id}>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/10 border border-gold/20 text-gold text-sm font-bold">
                            {item.clientName.charAt(0) || '?'}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground">{item.clientName || t('field.name')}</p>
                            <p className="text-xs text-muted-foreground">{item.clientTitle}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <PublishToggle published={item.published} onChange={(v) => updateTestimonial(item.id, { published: v })} />
                          <CmsNotice
                            onSave={async () => {
                              const result = await postCms(
                                isLocalDraftId(item.id)
                                  ? {
                                      resource: 'testimonial',
                                      op: 'create',
                                      data: {
                                        clientName: item.clientName,
                                        rating: item.rating,
                                        text: compactLocale(item.text),
                                        published: item.published,
                                      },
                                    }
                                  : {
                                      resource: 'testimonial',
                                      op: 'patch',
                                      id: item.id,
                                      data: {
                                        clientName: item.clientName,
                                        rating: item.rating,
                                        text: compactLocale(item.text),
                                        published: item.published,
                                      },
                                    },
                              );
                              if (!result.ok) throw new Error(result.error);
                            }}
                          />
                          <DeleteButton onClick={async () => {
                            if (!confirm(t('common.confirmDelete'))) return;
                            if (!isLocalDraftId(item.id)) {
                              const result = await postCms({ resource: 'testimonial', op: 'delete', id: item.id });
                              if (!result.ok) {
                                alert(result.error);
                                return;
                              }
                            }
                            deleteTestimonial(item.id);
                          }} />
                        </div>
                      </div>
                      <StarRating value={item.rating} onChange={(v) => updateTestimonial(item.id, { rating: v })} />
                      <div className="flex items-center justify-end">
                        <LanguageTabs />
                      </div>
                      <LocalizedInput
                        value={item.text}
                        onChange={(v) => updateTestimonial(item.id, { text: v })}
                        label={t('field.review')}
                        textarea
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <FieldLabel>{t('field.name')}</FieldLabel>
                          <Input
                            value={item.clientName}
                            onChange={(e) => updateTestimonial(item.id, { clientName: e.target.value })}
                            className="bg-background/50 h-9"
                          />
                        </div>
                        <div>
                          <FieldLabel>{t('field.subtitle')}</FieldLabel>
                          <Input
                            value={item.clientTitle}
                            onChange={(e) => updateTestimonial(item.id, { clientTitle: e.target.value })}
                            className="bg-background/50 h-9"
                          />
                        </div>
                      </div>
                    </div>
                  </ItemRow>
                ))}
              </AnimatePresence>
            </div>
          )}
        </TabsContent>

        <TabsContent value="faq" className="space-y-4">
          <div className="flex justify-end">
            <AddButton onClick={addFAQ} label={t('faq.add')} />
          </div>
          {data.faqs.length === 0 ? (
            <EmptyState icon={HelpCircle} title={t('faq.empty')} description={t('faq.emptyHint')} action={<AddButton onClick={addFAQ} label={t('faq.add')} />} />
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {[...data.faqs].sort((a, b) => a.order - b.order).map((faq) => (
                  <ItemRow key={faq.id}>
                    <div className="flex items-start gap-3">
                      <ReorderButtons onUp={() => reorderFAQs(faq.id, 'up')} onDown={() => reorderFAQs(faq.id, 'down')} className="mt-1" />
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <HelpCircle className="h-4 w-4 text-gold/50" />
                            <StatusBadge published={faq.published} />
                          </div>
                          <div className="flex items-center gap-2">
                            <PublishToggle
                              published={faq.published}
                              onChange={(v) => updateFAQ(faq.id, { published: v })}
                            />
                            <CmsNotice
                              onSave={async () => {
                                const result = await postCms(
                                  isLocalDraftId(faq.id)
                                    ? {
                                        resource: 'faq',
                                        op: 'create',
                                        data: {
                                          question: compactLocale(faq.question),
                                          answer: compactLocale(faq.answer),
                                          order: faq.order,
                                          published: faq.published,
                                        },
                                      }
                                    : {
                                        resource: 'faq',
                                        op: 'patch',
                                        id: faq.id,
                                        data: {
                                          question: compactLocale(faq.question),
                                          answer: compactLocale(faq.answer),
                                          order: faq.order,
                                          published: faq.published,
                                        },
                                      },
                                );
                                if (!result.ok) throw new Error(result.error);
                              }}
                            />
                            <DeleteButton onClick={async () => {
                              if (!confirm(t('common.confirmDelete'))) return;
                              if (!isLocalDraftId(faq.id)) {
                                const result = await postCms({ resource: 'faq', op: 'delete', id: faq.id });
                                if (!result.ok) {
                                  alert(result.error);
                                  return;
                                }
                              }
                              deleteFAQ(faq.id);
                            }} />
                          </div>
                        </div>
                        <div className="flex items-center justify-end">
                          <LanguageTabs />
                        </div>
                        <LocalizedInput
                          value={faq.question}
                          onChange={(v) => updateFAQ(faq.id, { question: v })}
                          label={t('field.question')}
                        />
                        <LocalizedInput
                          value={faq.answer}
                          onChange={(v) => updateFAQ(faq.id, { answer: v })}
                          label={t('field.answer')}
                          textarea
                        />
                      </div>
                    </div>
                  </ItemRow>
                ))}
              </AnimatePresence>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
