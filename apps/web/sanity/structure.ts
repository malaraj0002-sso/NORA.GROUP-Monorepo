import {
  CaseIcon,
  CogIcon,
  CommentIcon,
  ControlsIcon,
  DashboardIcon,
  DocumentIcon,
  EarthGlobeIcon,
  HomeIcon,
  ImagesIcon,
  InfoOutlineIcon,
  MasterDetailIcon,
  UsersIcon,
} from '@sanity/icons';
import type { StructureBuilder, StructureResolver } from 'sanity/structure';
import { Overview } from '@/sanity/overview/Overview';

function singleton(S: StructureBuilder, id: string, title: string, icon: typeof HomeIcon) {
  return S.listItem()
    .title(title)
    .id(id)
    .icon(icon)
    .child(S.document().schemaType(id).documentId(id).title(title));
}

/** Arabic desk: overview first, then job-based groups. */
export const structure: StructureResolver = (S) =>
  S.list()
    .id('root')
    .title('محتوى الموقع')
    .items([
      S.listItem()
        .title('نظرة عامة')
        .id('overview')
        .icon(DashboardIcon)
        .child(S.component(Overview).id('overviewPane').title('نظرة عامة')),
      S.divider(),
      S.listItem()
        .title('ابدأ من هنا')
        .id('start')
        .icon(CogIcon)
        .child(
          S.list()
            .title('ابدأ من هنا')
            .items([
              singleton(S, 'siteSettings', 'إعدادات الموقع', CogIcon),
              singleton(S, 'contactPage', 'تواصل معنا', UsersIcon),
            ]),
        ),
      S.listItem()
        .title('صفحات الموقع')
        .id('pages')
        .icon(MasterDetailIcon)
        .child(
          S.list()
            .title('صفحات الموقع')
            .items([
              singleton(S, 'homePage', 'الرئيسية والهيرو', HomeIcon),
              singleton(S, 'aboutPage', 'من نحن', InfoOutlineIcon),
              singleton(S, 'howWeWorkPage', 'طريقة عملنا', ControlsIcon),
            ]),
        ),
      S.listItem()
        .title('المعرض والعمل')
        .id('gallery')
        .icon(ImagesIcon)
        .child(
          S.list()
            .title('المعرض والعمل')
            .items([
              S.documentTypeListItem('project').title('المشاريع').icon(ImagesIcon),
              S.documentTypeListItem('service').title('الخدمات').icon(CaseIcon),
              S.documentTypeListItem('material').title('المواد').icon(EarthGlobeIcon),
            ]),
        ),
      S.listItem()
        .title('آراء ومحتوى')
        .id('voices')
        .icon(CommentIcon)
        .child(
          S.list()
            .title('آراء ومحتوى')
            .items([
              S.documentTypeListItem('testimonial').title('آراء العملاء').icon(CommentIcon),
              S.documentTypeListItem('faqItem').title('الأسئلة الشائعة').icon(DocumentIcon),
              S.documentTypeListItem('blogPost').title('المدونة').icon(DocumentIcon),
            ]),
        ),
      S.divider(),
      S.listItem()
        .title('إعدادات متقدمة')
        .id('advanced')
        .icon(ControlsIcon)
        .child(
          S.list()
            .title('إعدادات متقدمة')
            .items([S.documentTypeListItem('uiLabels').title('تسميات الواجهة').icon(ControlsIcon)]),
        ),
    ]);
