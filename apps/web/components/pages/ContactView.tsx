import Image from 'next/image';
import type { ReactNode } from 'react';
import { Clock, Mail, MapPin, MessageCircle, Phone, Sparkles } from 'lucide-react';
import { PageHero } from '@/components/ui/PageHero';
import { Reveal } from '@/components/ui/Reveal';
import type { AppLocale } from '@/lib/constants';
import { getMailtoLink, getTelLink, getWhatsAppLink } from '@/lib/contact';
import type { SiteContent } from '@/lib/content/types';
import { t } from '@/lib/i18n/locale';

export function ContactView({ locale, content }: { locale: AppLocale; content: SiteContent }) {
  const page = content.contactPage;
  const settings = content.settings;
  const nav = content.nav[locale];
  const whatsapp = getWhatsAppLink(settings.whatsappE164, t(settings.whatsappMessage, locale));
  const tel = getTelLink(settings.phoneTel);

  return (
    <>
      <PageHero
        eyebrow={t(page.eyebrow, locale)}
        title={t(page.title, locale)}
        subtitle={t(page.subtitle, locale)}
        image={page.image}
      />

      <section className="section-padding bg-warm-50/60 relative overflow-hidden">
        <div className="container-luxury grid grid-cols-1 items-start gap-12 lg:grid-cols-12">
          
          {/* قسم معلومات التواصل */}
          <div className="lg:col-span-7">
            <Reveal>
              <div className="group relative rounded-2xl border border-gold-200/60 bg-white p-8 shadow-sm transition-all duration-500 hover:border-gold-300 hover:shadow-xl hover:shadow-gold-500/5">
                
                {/* الشارة العلوية */}
                <div className="inline-flex items-center gap-2 rounded-full border border-gold-200 bg-gold-50/80 px-3.5 py-1 text-xs font-semibold text-gold-700 mb-8">
                  <Sparkles className="h-3.5 w-3.5 text-gold-500" />
                  <span>{locale === 'ar' ? 'معلومات الاتصال الفاخرة' : 'Direct Channels'}</span>
                </div>

                <div className="space-y-6">
                  <ContactRow icon={Phone} label={nav.callUs}>
                    <a
                      href={tel}
                      className="text-lg font-bold text-charcoal-900 transition-colors duration-300 hover:text-gold-600"
                      dir="ltr"
                    >
                      {settings.phoneDisplay}
                    </a>
                  </ContactRow>

                  <ContactRow icon={MessageCircle} label={nav.whatsapp}>
                    <a
                      href={whatsapp}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-lg font-bold text-charcoal-900 transition-colors duration-300 hover:text-gold-600"
                    >
                      WhatsApp
                    </a>
                  </ContactRow>

                  <ContactRow icon={Mail} label="Email">
                    <a
                      href={getMailtoLink(settings.email)}
                      className="break-all text-lg font-bold text-charcoal-900 transition-colors duration-300 hover:text-gold-600"
                    >
                      {settings.email}
                    </a>
                  </ContactRow>

                  <ContactRow icon={MapPin} label={locale === 'ar' ? 'العنوان' : 'Address'}>
                    <span className="text-base font-semibold text-charcoal-800 leading-snug">
                      {t(settings.address, locale)}
                    </span>
                  </ContactRow>

                  <ContactRow icon={Clock} label={locale === 'ar' ? 'ساعات العمل' : 'Working Hours'}>
                    <span className="text-base font-semibold text-charcoal-800 leading-snug">
                      {t(settings.workingHours, locale)}
                    </span>
                  </ContactRow>
                </div>

                {/* أزرار الاتصال التفاعلية */}
                <div className="flex flex-col gap-3 pt-8 mt-8 border-t border-gold-100 sm:flex-row">
                  <a
                    href={whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-whatsapp flex-1 justify-center shadow-md transition-transform duration-300 hover:-translate-y-0.5"
                  >
                    <MessageCircle className="h-5 w-5" />
                    <span>{nav.whatsapp}</span>
                  </a>
                  <a
                    href={tel}
                    className="btn-gold flex-1 justify-center shadow-md transition-transform duration-300 hover:-translate-y-0.5"
                    dir="ltr"
                  >
                    <Phone className="h-5 w-5" />
                    <span>{nav.callUs}</span>
                  </a>
                </div>

                {/* خط الإضاءة الذهبي السفلي */}
                <div className="absolute bottom-0 left-0 right-0 h-1 w-0 rounded-b-2xl bg-gradient-to-r from-gold-400 to-gold-600 transition-all duration-500 group-hover:w-full" />
              </div>
            </Reveal>
          </div>

          {/* بطاقة رمز الاستجابة السريعة (QR Code) */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <Reveal delay={120}>
              <div className="group relative flex flex-col items-center rounded-2xl border border-gold-200/60 bg-white p-8 shadow-sm transition-all duration-500 hover:border-gold-400 hover:shadow-xl hover:shadow-gold-500/10 text-center">
                
                <div className="relative mb-6 rounded-xl border border-gold-100 bg-warm-50/50 p-4 shadow-inner">
                  <Image
                    src={settings.qrUrl}
                    alt={`${settings.brandName} WhatsApp QR`}
                    width={220}
                    height={220}
                    className="h-44 w-44 object-contain transition-transform duration-500 group-hover:scale-105 sm:h-52 sm:w-52 md:h-56 md:w-56"
                  />
                </div>

                <h4 className="text-lg font-bold text-charcoal-900">
                  {locale === 'ar' ? 'مسح الرمز للتواصل المباشر' : 'Scan to Connect'}
                </h4>
                <p className="mt-2 text-xs text-charcoal-500 max-w-xs leading-relaxed">
                  {locale === 'ar'
                    ? 'امسح رمز QR بواسطة كاميرا جوالك لبدء محادثة واتساب مباشرة'
                    : 'Scan the QR code with your phone camera to start a instant WhatsApp chat'}
                </p>

                {/* شريط سفلي جمالي */}
                <div className="absolute bottom-0 left-0 right-0 h-1 w-0 rounded-b-2xl bg-gradient-to-r from-gold-400 to-gold-600 transition-all duration-500 group-hover:w-full" />
              </div>
            </Reveal>
          </div>

        </div>
      </section>
    </>
  );
}

function ContactRow({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Phone;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-gold-200/80 bg-warm-50 text-gold-600 shadow-sm transition-all duration-300 group-hover:bg-gold-50">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="mb-0.5 text-xs font-semibold tracking-wider text-charcoal-500 uppercase">{label}</p>
        {children}
      </div>
    </div>
  );
}