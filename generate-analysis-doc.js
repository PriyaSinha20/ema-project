const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, HeadingLevel, BorderStyle, ImageRun, ShadingType, VerticalAlign } = require('docx');
const fs = require('fs');
const path = require('path');

const ORANGE = 'F26522';
const DARK_GRAY = '333333';
const LIGHT_GRAY = 'F5F5F5';
const WHITE = 'FFFFFF';

function createHeaderCell(text) {
  return new TableCell({
    children: [new Paragraph({ children: [new TextRun({ text, bold: true, color: WHITE, size: 20, font: 'Arial' })] })],
    shading: { fill: ORANGE, type: ShadingType.SOLID },
    verticalAlign: VerticalAlign.CENTER,
  });
}

function createCell(text, opts = {}) {
  return new TableCell({
    children: [new Paragraph({ children: [new TextRun({ text, size: 20, font: 'Arial', ...opts })] })],
    verticalAlign: VerticalAlign.CENTER,
    shading: opts.shading ? { fill: opts.shading, type: ShadingType.SOLID } : undefined,
  });
}

function createMultiLineCell(lines) {
  return new TableCell({
    children: lines.map(line => new Paragraph({ children: [new TextRun({ text: line, size: 20, font: 'Arial' })] })),
    verticalAlign: VerticalAlign.TOP,
  });
}

function loadImage(filename) {
  const filepath = path.join('/tmp/playwright/screenshots', filename);
  if (fs.existsSync(filepath)) {
    return fs.readFileSync(filepath);
  }
  return null;
}

async function generateDocument() {
  const homepageImg = loadImage('homepage.png');
  const categoryImg = loadImage('category-landing-kidney.png');
  const productImg = loadImage('product-list.png');
  const seminarImg = loadImage('seminar-calendar.png');

  const doc = new Document({
    styles: {
      default: {
        document: { run: { font: 'Arial', size: 22 } },
      },
    },
    sections: [
      {
        properties: {},
        children: [
          // Title Page
          new Paragraph({ spacing: { after: 600 } }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [new TextRun({ text: 'Website Analysis Report', bold: true, size: 56, color: ORANGE, font: 'Arial' })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [new TextRun({ text: 'Kyowa Kirin Medical Site', bold: true, size: 40, color: DARK_GRAY, font: 'Arial' })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [new TextRun({ text: 'https://medical.kyowakirin.co.jp/', size: 24, color: '666666', font: 'Arial' })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 600 },
            children: [new TextRun({ text: 'Templates Inventory & Blocks/Components Catalog', size: 28, color: DARK_GRAY, font: 'Arial' })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [new TextRun({ text: `Date: June 2, 2026`, size: 22, color: '666666', font: 'Arial' })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: 'Prepared for: AEM Edge Delivery Services Migration', size: 22, color: '666666', font: 'Arial' })],
          }),

          // Section: Executive Summary
          new Paragraph({ spacing: { before: 600 }, children: [] }),
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            spacing: { after: 200 },
            children: [new TextRun({ text: '1. Executive Summary', bold: true, size: 32, color: ORANGE, font: 'Arial' })],
          }),
          new Paragraph({
            spacing: { after: 200 },
            children: [new TextRun({ text: 'This document provides a comprehensive analysis of the Kyowa Kirin Medical Site (medical.kyowakirin.co.jp), a healthcare professional portal operated by Kyowa Kirin Co., Ltd. The site serves medical professionals in Japan with pharmaceutical product information, therapeutic area resources, web seminars, and clinical support materials.', size: 22, font: 'Arial' })],
          }),
          new Paragraph({
            spacing: { after: 200 },
            children: [new TextRun({ text: 'Key Statistics:', bold: true, size: 22, font: 'Arial' })],
          }),
          new Paragraph({ children: [new TextRun({ text: '• Total unique content pages: ~180+ (excluding PDF viewer wrappers)', size: 22, font: 'Arial' })] }),
          new Paragraph({ children: [new TextRun({ text: '• Unique page templates identified: 10', size: 22, font: 'Arial' })] }),
          new Paragraph({ children: [new TextRun({ text: '• Reusable blocks/components identified: 20', size: 22, font: 'Arial' })] }),
          new Paragraph({ children: [new TextRun({ text: '• Therapeutic areas: 5 (Kidney, Oncology/Hematology, Immunology/Allergy, Neurology, Rare Diseases)', size: 22, font: 'Arial' })] }),
          new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: '• Technology stack: Vue.js SPA, responsive design, authentication-gated content', size: 22, font: 'Arial' })] }),

          // Section: Templates Inventory
          new Paragraph({ spacing: { before: 400 } }),
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            spacing: { after: 300 },
            children: [new TextRun({ text: '2. Templates Inventory', bold: true, size: 32, color: ORANGE, font: 'Arial' })],
          }),
          new Paragraph({
            spacing: { after: 200 },
            children: [new TextRun({ text: 'The following table lists all unique page templates identified across the site. Each template represents a distinct layout pattern and content structure.', size: 22, font: 'Arial' })],
          }),

          // Templates Table
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  createHeaderCell('Template Name'),
                  createHeaderCell('Complexity'),
                  createHeaderCell('Reasoning'),
                  createHeaderCell('Reference URL(s)'),
                ],
              }),
              new TableRow({
                children: [
                  createCell('Homepage'),
                  createCell('High'),
                  createMultiLineCell(['Multiple dynamic sections: hero carousel, product search with alphabetical filtering, tabbed seminar calendar, tabbed latest news feed, recommended content carousel, contact block, promotional cards. Vue.js-powered interactions.']),
                  createMultiLineCell(['https://medical.kyowakirin.co.jp/']),
                ],
              }),
              new TableRow({
                children: [
                  createCell('Therapeutic Area Landing Page'),
                  createCell('Medium'),
                  createMultiLineCell(['Category cards with featured content links, promotional banner carousel, product logo grid, facility/literature card grid. Consistent across 5 therapeutic areas.']),
                  createMultiLineCell(['https://medical.kyowakirin.co.jp/kidney/', 'https://medical.kyowakirin.co.jp/allergy/', 'https://medical.kyowakirin.co.jp/hematonco/', 'https://medical.kyowakirin.co.jp/neuro/', 'https://medical.kyowakirin.co.jp/raredisease/']),
                ],
              }),
              new TableRow({
                children: [
                  createCell('Product List Page'),
                  createCell('High'),
                  createMultiLineCell(['Complex data table with multi-column layout, alphabetical tab filtering, search input, batch PDF download with checkboxes, sidebar with recommendations. Dynamic Vue.js rendering.']),
                  createMultiLineCell(['https://medical.kyowakirin.co.jp/druginfo/detail/']),
                ],
              }),
              new TableRow({
                children: [
                  createCell('Seminar Calendar Page'),
                  createCell('High'),
                  createMultiLineCell(['Interactive calendar view and list view toggle, multi-faceted filtering (area, type, time), calendar grid with event popups, dynamic count display, system requirements section.']),
                  createMultiLineCell(['https://medical.kyowakirin.co.jp/webseminar/index.html']),
                ],
              }),
              new TableRow({
                children: [
                  createCell('Medical Article / Content Page'),
                  createCell('Medium'),
                  createMultiLineCell(['Long-form article with structured headings, images, figures, author/expert info, printable PDF link, related articles navigation, series listing, breadcrumb.']),
                  createMultiLineCell(['https://medical.kyowakirin.co.jp/kidney/disease/toseki_s/056/index.html', 'https://medical.kyowakirin.co.jp/neuro/pd-cds-care/index.html']),
                ],
              }),
              new TableRow({
                children: [
                  createCell('Video/Movie Content Page'),
                  createCell('Medium'),
                  createMultiLineCell(['Video player embed (member-gated), title/description, speaker information, related videos list, supplementary content links. Requires authentication.']),
                  createMultiLineCell(['https://medical.kyowakirin.co.jp/kidney/dialysis-patient-initial-treatment-approach-movie.html', 'https://medical.kyowakirin.co.jp/kidney/orkedia-dose-adjustment-movie.html']),
                ],
              }),
              new TableRow({
                children: [
                  createCell('News/Updates Listing Page'),
                  createCell('Low'),
                  createMultiLineCell(['Chronological list with category badges, date stamps, year-based tabs for filtering. Simple repeating pattern.']),
                  createMultiLineCell(['https://medical.kyowakirin.co.jp/druginfo/newslist/']),
                ],
              }),
              new TableRow({
                children: [
                  createCell('FAQ / Q&A Page'),
                  createCell('Low'),
                  createMultiLineCell(['Accordion-style expandable questions grouped by category, breadcrumb navigation, linked product references. Two variants: site FAQ and drug-specific Q&A.']),
                  createMultiLineCell(['https://medical.kyowakirin.co.jp/faq.html', 'https://medical.kyowakirin.co.jp/druginfo/qa/hys/index.html']),
                ],
              }),
              new TableRow({
                children: [
                  createCell('Calculator / Tool Page'),
                  createCell('High'),
                  createMultiLineCell(['Interactive form inputs (weight, radio buttons, dropdowns), real-time calculation output, step-by-step instruction diagrams, result tables. Requires JavaScript computation logic.']),
                  createMultiLineCell(['https://medical.kyowakirin.co.jp/hematonco/rpt-calc.html', 'https://medical.kyowakirin.co.jp/allergy/disease/bsa/index.html', 'https://medical.kyowakirin.co.jp/allergy/disease/pasi/index.html']),
                ],
              }),
              new TableRow({
                children: [
                  createCell('Materials/Brochures Listing Page'),
                  createCell('Medium'),
                  createMultiLineCell(['Filterable card listing with therapeutic area and material type dropdowns, keyword search, dynamic result counter, PDF download links.']),
                  createMultiLineCell(['https://medical.kyowakirin.co.jp/leaf/index.html']),
                ],
              }),
              new TableRow({
                children: [
                  createCell('Contact / Utility Page'),
                  createCell('Low'),
                  createMultiLineCell(['Static layout with multiple contact form links, phone support information, FAQ reference link. Minimal interactivity.']),
                  createMultiLineCell(['https://medical.kyowakirin.co.jp/contact.html', 'https://medical.kyowakirin.co.jp/terms.html', 'https://medical.kyowakirin.co.jp/sitemap.html']),
                ],
              }),
            ],
          }),

          // Homepage Screenshot
          new Paragraph({ spacing: { before: 400 } }),
          new Paragraph({
            spacing: { after: 200 },
            children: [new TextRun({ text: 'Screenshot: Homepage Template', bold: true, size: 24, color: DARK_GRAY, font: 'Arial' })],
          }),
          ...(homepageImg ? [new Paragraph({
            children: [new ImageRun({ data: homepageImg, transformation: { width: 500, height: 900 }, type: 'png' })],
          })] : []),

          // Category Landing Screenshot
          new Paragraph({ spacing: { before: 400 } }),
          new Paragraph({
            spacing: { after: 200 },
            children: [new TextRun({ text: 'Screenshot: Therapeutic Area Landing Page Template (Kidney)', bold: true, size: 24, color: DARK_GRAY, font: 'Arial' })],
          }),
          ...(categoryImg ? [new Paragraph({
            children: [new ImageRun({ data: categoryImg, transformation: { width: 500, height: 900 }, type: 'png' })],
          })] : []),

          // Product List Screenshot
          new Paragraph({ spacing: { before: 400 } }),
          new Paragraph({
            spacing: { after: 200 },
            children: [new TextRun({ text: 'Screenshot: Product List Page Template', bold: true, size: 24, color: DARK_GRAY, font: 'Arial' })],
          }),
          ...(productImg ? [new Paragraph({
            children: [new ImageRun({ data: productImg, transformation: { width: 500, height: 700 }, type: 'png' })],
          })] : []),

          // Section: Blocks/Components Catalog
          new Paragraph({ spacing: { before: 600 } }),
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            spacing: { after: 300 },
            children: [new TextRun({ text: '3. Blocks / Components Catalog', bold: true, size: 32, color: ORANGE, font: 'Arial' })],
          }),
          new Paragraph({
            spacing: { after: 200 },
            children: [new TextRun({ text: 'The following table catalogs all reusable blocks and components identified across the site. Design variations of the same content model are noted as variants rather than separate blocks.', size: 22, font: 'Arial' })],
          }),

          // Blocks Table
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  createHeaderCell('Block Name'),
                  createHeaderCell('Complexity'),
                  createHeaderCell('Behaviour & Functionality'),
                  createHeaderCell('Reference URL(s)'),
                ],
              }),
              new TableRow({
                children: [
                  createCell('Header / Global Navigation'),
                  createCell('High'),
                  createMultiLineCell(['Dual-logo header (KK Medical Site + Kyowa Kirin corporate). Icon-based primary navigation with 5 main categories. Utility links (contact, search, login, register). Responsive hamburger menu on mobile. Sticky positioning. Expandable mega-menu sub-navigation for Drug Info and Therapeutic Areas.']),
                  createMultiLineCell(['All pages', 'https://medical.kyowakirin.co.jp/']),
                ],
              }),
              new TableRow({
                children: [
                  createCell('Footer'),
                  createCell('Medium'),
                  createMultiLineCell(['Multi-column footer with categorized links (Drug Info, Therapeutic Areas, Seminars, Materials, Clinical Support). Legal/policy links row. Copyright notice. Fixed floating seminar CTA button overlaid on bottom-right corner.']),
                  createMultiLineCell(['All pages', 'https://medical.kyowakirin.co.jp/']),
                ],
              }),
              new TableRow({
                children: [
                  createCell('Login/Authentication Modal'),
                  createCell('High'),
                  createMultiLineCell(['Full-screen overlay modal dialog triggered on page load for gated content. Two-column layout: non-member path (profession selection buttons, registration CTA) and member path (login form with email/password, remember me, alternative auth via medPass/DLink). Intercepts navigation site-wide.']),
                  createMultiLineCell(['All pages (modal)', 'https://medical.kyowakirin.co.jp/login.html']),
                ],
              }),
              new TableRow({
                children: [
                  createCell('Hero Carousel / Banner Slider'),
                  createCell('Medium'),
                  createMultiLineCell(['Auto-rotating image carousel with 6 slides, prev/next arrow buttons, dot indicators (tablist). Each slide is a linked banner image promoting featured content. Responsive image sizing. Used on homepage only.']),
                  createMultiLineCell(['https://medical.kyowakirin.co.jp/']),
                ],
              }),
              new TableRow({
                children: [
                  createCell('Product Search Block'),
                  createCell('High'),
                  createMultiLineCell(['Search input with keyword lookup, alphabetical Japanese syllabary (ア-ヤラワ) tab filters, medical narcotics category tab. Links to product detail page with filter parameters. Compact version on homepage, full version on product list page.']),
                  createMultiLineCell(['https://medical.kyowakirin.co.jp/', 'https://medical.kyowakirin.co.jp/druginfo/detail/']),
                ],
              }),
              new TableRow({
                children: [
                  createCell('Tabbed Content Filter'),
                  createCell('Medium'),
                  createMultiLineCell(['Horizontal tab bar for filtering content by therapeutic area (All, Kidney, Oncology, Immunology, Neurology, Rare Diseases). Dynamically shows/hides content below. Used for seminar listings and latest news. Two design variants: pill-style buttons and underline-style tabs.']),
                  createMultiLineCell(['https://medical.kyowakirin.co.jp/ (seminars section)', 'https://medical.kyowakirin.co.jp/ (latest news section)']),
                ],
              }),
              new TableRow({
                children: [
                  createCell('Seminar Event Card'),
                  createCell('Medium'),
                  createMultiLineCell(['Card component displaying: category badge (colored by therapeutic area), event title (h3), date/time string, and link to reservation. Used in homepage listing and calendar popup. Variant: compact (homepage) vs expanded (calendar popup with speaker details and PDF flyer image).']),
                  createMultiLineCell(['https://medical.kyowakirin.co.jp/', 'https://medical.kyowakirin.co.jp/webseminar/index.html']),
                ],
              }),
              new TableRow({
                children: [
                  createCell('News/Content Card'),
                  createCell('Low'),
                  createMultiLineCell(['Thumbnail image + title + description + date layout. Linked card format. Used for latest information feed on homepage. Consistent pattern: image left, text stack right, date at bottom.']),
                  createMultiLineCell(['https://medical.kyowakirin.co.jp/ (latest news section)']),
                ],
              }),
              new TableRow({
                children: [
                  createCell('Recommended Content Carousel'),
                  createCell('Medium'),
                  createMultiLineCell(['Horizontal scrolling carousel of content cards with figure (image + caption). Dot pagination indicators. Auto-rotates. Includes disclaimer about personalization algorithm. Used on homepage and sidebar.']),
                  createMultiLineCell(['https://medical.kyowakirin.co.jp/', 'https://medical.kyowakirin.co.jp/druginfo/detail/ (sidebar)']),
                ],
              }),
              new TableRow({
                children: [
                  createCell('Category Navigation Card'),
                  createCell('Low'),
                  createMultiLineCell(['Thumbnail image card with category title, 2-3 featured content links below, and "View all" link. Used on therapeutic area landing pages to navigate to subcategories (Disease Info, Product Info, Materials, Facility Cases, Literature).']),
                  createMultiLineCell(['https://medical.kyowakirin.co.jp/kidney/', 'https://medical.kyowakirin.co.jp/allergy/']),
                ],
              }),
              new TableRow({
                children: [
                  createCell('Product Logo Grid'),
                  createCell('Low'),
                  createMultiLineCell(['Horizontal grid of product brand logos/images, each linked to the respective drug information page. Responsive wrapping. Displays 8-12 logos per therapeutic area.']),
                  createMultiLineCell(['https://medical.kyowakirin.co.jp/kidney/', 'https://medical.kyowakirin.co.jp/allergy/']),
                ],
              }),
              new TableRow({
                children: [
                  createCell('Facility/Content Series Card'),
                  createCell('Low'),
                  createMultiLineCell(['Card with thumbnail image, category badge, series title, subtitle, and description paragraph. Used for facility case studies and journal/literature listings. Three cards in a row layout.']),
                  createMultiLineCell(['https://medical.kyowakirin.co.jp/kidney/ (bottom section)']),
                ],
              }),
              new TableRow({
                children: [
                  createCell('Product Data Table'),
                  createCell('High'),
                  createMultiLineCell(['Multi-column data table listing all pharmaceutical products. Columns: product name, prescribing info, interview form, RMP, professional materials, patient materials, photos, usage notes, instructions, notifications, drug guide, Q&A. Checkbox selection for batch PDF download. Responsive scroll.']),
                  createMultiLineCell(['https://medical.kyowakirin.co.jp/druginfo/detail/']),
                ],
              }),
              new TableRow({
                children: [
                  createCell('Seminar Calendar'),
                  createCell('High'),
                  createMultiLineCell(['Monthly calendar grid (Sun-Sat) with month tabs showing event counts. Calendar cells contain mini event previews; clicking expands popup with full details (title, time, speaker, flyer image, reservation button). Toggle to list view. Multi-filter panel above.']),
                  createMultiLineCell(['https://medical.kyowakirin.co.jp/webseminar/index.html']),
                ],
              }),
              new TableRow({
                children: [
                  createCell('Contact / Inquiry Block'),
                  createCell('Low'),
                  createMultiLineCell(['Displays "Medicine Consultation Desk" with free-call phone number (0120-850-150), operating hours, recording notice, and link to contact form. Table layout for phone info. Used on homepage and product list page.']),
                  createMultiLineCell(['https://medical.kyowakirin.co.jp/', 'https://medical.kyowakirin.co.jp/druginfo/detail/']),
                ],
              }),
              new TableRow({
                children: [
                  createCell('Promotional Banner'),
                  createCell('Low'),
                  createMultiLineCell(['Full-width or half-width linked image banner for promotional content (e-learning, newsletter opt-in, corporate pages). Simple image + link pattern. Used in sidebar and content areas.']),
                  createMultiLineCell(['https://medical.kyowakirin.co.jp/ (bottom cards)', 'https://medical.kyowakirin.co.jp/druginfo/detail/ (sidebar)']),
                ],
              }),
              new TableRow({
                children: [
                  createCell('Breadcrumb Navigation'),
                  createCell('Low'),
                  createMultiLineCell(['Horizontal breadcrumb trail showing page hierarchy (HOME > Section > Subsection > Page). Used on all internal pages except homepage. Standard separator styling.']),
                  createMultiLineCell(['https://medical.kyowakirin.co.jp/kidney/', 'https://medical.kyowakirin.co.jp/druginfo/detail/']),
                ],
              }),
              new TableRow({
                children: [
                  createCell('Accordion / Expandable Q&A'),
                  createCell('Low'),
                  createMultiLineCell(['Clickable question headers that expand to reveal answer text. Grouped by category with section anchors. Includes update date stamps and reference citations. Used for both site FAQ and drug-specific Q&A.']),
                  createMultiLineCell(['https://medical.kyowakirin.co.jp/faq.html', 'https://medical.kyowakirin.co.jp/druginfo/qa/hys/index.html']),
                ],
              }),
              new TableRow({
                children: [
                  createCell('Cookie Consent Banner'),
                  createCell('Low'),
                  createMultiLineCell(['Bottom-positioned overlay banner with consent text, "More information" link, "Accept All Cookies" and "Cookie Settings" buttons. Standard OneTrust-style implementation. Appears on all pages.']),
                  createMultiLineCell(['All pages']),
                ],
              }),
              new TableRow({
                children: [
                  createCell('Dosage Calculator'),
                  createCell('High'),
                  createMultiLineCell(['Interactive form with patient weight input, condition radio buttons, dose range slider/dropdown. Calculates required liquid volume, drug weight, and number of vials. Displays step-by-step preparation diagrams. Condition-specific ranges (ITP vs AA).']),
                  createMultiLineCell(['https://medical.kyowakirin.co.jp/hematonco/rpt-calc.html']),
                ],
              }),
              new TableRow({
                children: [
                  createCell('Expiration Date Search'),
                  createCell('Medium'),
                  createMultiLineCell(['Two-field lookup form: product name dropdown (with alphabetical filter) and lot number text input. Displays results in 3-column table (Product, Lot, Expiration Date). Includes reset/search buttons and required field indicators.']),
                  createMultiLineCell(['https://medical.kyowakirin.co.jp/druginfo/lot/']),
                ],
              }),
              new TableRow({
                children: [
                  createCell('News List with Category Badges'),
                  createCell('Low'),
                  createMultiLineCell(['Chronological list of news items. Each item: colored category badge (Prescribing Info Revision, Safety Info, Packaging Change, Other) + date (YYYY.MM.DD) + linked title. Year-based tab navigation. Category filter tabs above list.']),
                  createMultiLineCell(['https://medical.kyowakirin.co.jp/druginfo/newslist/']),
                ],
              }),
              new TableRow({
                children: [
                  createCell('Video Library Grid'),
                  createCell('Low'),
                  createMultiLineCell(['Grid of video thumbnail cards organized by therapeutic area section anchors. Each card: thumbnail image + clickable title. Minimal metadata (occasional duration). Category section headers for navigation.']),
                  createMultiLineCell(['https://medical.kyowakirin.co.jp/support/movie_library/']),
                ],
              }),
              new TableRow({
                children: [
                  createCell('Article Body with Related Content'),
                  createCell('Medium'),
                  createMultiLineCell(['Long-form article layout with structured headings (h2-h4), inline images/figures, hospital photos, author portraits, clinical diagrams. Includes printable PDF link, related articles sidebar/bottom section, series navigation. Breadcrumb at top.']),
                  createMultiLineCell(['https://medical.kyowakirin.co.jp/kidney/disease/toseki_s/056/index.html']),
                ],
              }),
            ],
          }),

          // Section: Design Variations
          new Paragraph({ spacing: { before: 600 } }),
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            spacing: { after: 300 },
            children: [new TextRun({ text: '4. Design Variations & Shared Content Models', bold: true, size: 32, color: ORANGE, font: 'Arial' })],
          }),
          new Paragraph({
            spacing: { after: 200 },
            children: [new TextRun({ text: 'Several blocks share the same content model but differ in visual layout. These should be implemented as design variants of a single block rather than separate blocks:', size: 22, font: 'Arial' })],
          }),

          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  createHeaderCell('Base Block'),
                  createHeaderCell('Variant'),
                  createHeaderCell('Visual Difference'),
                ],
              }),
              new TableRow({
                children: [
                  createCell('Tabbed Content Filter'),
                  createCell('Pill-style (seminars)'),
                  createMultiLineCell(['Rounded pill buttons with fill color on active state']),
                ],
              }),
              new TableRow({
                children: [
                  createCell('Tabbed Content Filter'),
                  createCell('Underline-style (news)'),
                  createMultiLineCell(['Text tabs with bottom border highlight on active state']),
                ],
              }),
              new TableRow({
                children: [
                  createCell('Seminar Event Card'),
                  createCell('Compact (homepage)'),
                  createMultiLineCell(['Badge + title + date only, stacked vertically']),
                ],
              }),
              new TableRow({
                children: [
                  createCell('Seminar Event Card'),
                  createCell('Expanded (calendar popup)'),
                  createMultiLineCell(['Full details: badge, title, date, speaker info, flyer image, reservation button']),
                ],
              }),
              new TableRow({
                children: [
                  createCell('Recommended Content Carousel'),
                  createCell('Full-width (homepage)'),
                  createMultiLineCell(['5 visible cards, larger thumbnails, centered layout']),
                ],
              }),
              new TableRow({
                children: [
                  createCell('Recommended Content Carousel'),
                  createCell('Sidebar (inner pages)'),
                  createMultiLineCell(['Narrower width, smaller thumbnails, vertical scroll']),
                ],
              }),
              new TableRow({
                children: [
                  createCell('Product Search Block'),
                  createCell('Compact (homepage)'),
                  createMultiLineCell(['Search bar + alphabetical links only']),
                ],
              }),
              new TableRow({
                children: [
                  createCell('Product Search Block'),
                  createCell('Full (product list)'),
                  createMultiLineCell(['Search bar + alphabetical tabs + data table with checkboxes']),
                ],
              }),
              new TableRow({
                children: [
                  createCell('Promotional Banner'),
                  createCell('Full-width'),
                  createMultiLineCell(['Spans full content width']),
                ],
              }),
              new TableRow({
                children: [
                  createCell('Promotional Banner'),
                  createCell('Card (3-column)'),
                  createMultiLineCell(['Smaller card with image + title + description, 3 per row']),
                ],
              }),
            ],
          }),

          // Section: Technical Notes
          new Paragraph({ spacing: { before: 600 } }),
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            spacing: { after: 300 },
            children: [new TextRun({ text: '5. Technical Observations', bold: true, size: 32, color: ORANGE, font: 'Arial' })],
          }),
          new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: '• Framework: Vue.js (development build detected) - SPA architecture with client-side rendering', size: 22, font: 'Arial' })] }),
          new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: '• Authentication: Multi-method login (email/password, medPass, DLink) with profession-based access tiers', size: 22, font: 'Arial' })] }),
          new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: '• Content gating: Full-screen login modal intercepts on most pages; non-members see limited product info only', size: 22, font: 'Arial' })] }),
          new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: '• Cookie consent: OneTrust-style banner on all pages', size: 22, font: 'Arial' })] }),
          new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: '• PDF viewer: Custom embedded PDF viewer at /pdfview/web/viewer.html (~300+ wrapper pages)', size: 22, font: 'Arial' })] }),
          new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: '• Responsive design: Mobile-first with icon-based navigation on smaller screens', size: 22, font: 'Arial' })] }),
          new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: '• Personalization: Recommended content based on browsing history (explicit privacy notice)', size: 22, font: 'Arial' })] }),
          new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: '• Chatbot: Q&A chatbot integration for drug information queries', size: 22, font: 'Arial' })] }),

          // Section: Migration Complexity Summary
          new Paragraph({ spacing: { before: 600 } }),
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            spacing: { after: 300 },
            children: [new TextRun({ text: '6. Migration Complexity Summary', bold: true, size: 32, color: ORANGE, font: 'Arial' })],
          }),

          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  createHeaderCell('Complexity Level'),
                  createHeaderCell('Templates'),
                  createHeaderCell('Blocks'),
                  createHeaderCell('Key Challenges'),
                ],
              }),
              new TableRow({
                children: [
                  createCell('High', { bold: true }),
                  createCell('3 (Homepage, Product List, Seminar Calendar)'),
                  createCell('5 (Header, Auth Modal, Product Search, Product Table, Seminar Calendar, Calculator)'),
                  createMultiLineCell(['Vue.js interactive components, complex filtering, real-time calculations, calendar logic, authentication flow']),
                ],
              }),
              new TableRow({
                children: [
                  createCell('Medium', { bold: true }),
                  createCell('4 (Area Landing, Article, Video, Materials)'),
                  createCell('6 (Hero Carousel, Tab Filter, Event Card, Recommended Carousel, Expiration Search, Article Body)'),
                  createMultiLineCell(['Carousel interactions, dynamic filtering, video player integration, responsive grid layouts']),
                ],
              }),
              new TableRow({
                children: [
                  createCell('Low', { bold: true }),
                  createCell('3 (News Listing, FAQ, Contact)'),
                  createCell('9 (News Card, Category Card, Logo Grid, Series Card, Contact Block, Breadcrumb, Accordion, Cookie Banner, Video Grid, News List)'),
                  createMultiLineCell(['Mostly static content, standard patterns, minimal JavaScript']),
                ],
              }),
            ],
          }),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const outputPath = '/backups/PriyaSinha20/ema-project/repo/KyowaKirin-Medical-Site-Analysis.docx';
  fs.writeFileSync(outputPath, buffer);
  console.log(`Document generated: ${outputPath}`);
}

generateDocument().catch(err => {
  console.error('Error generating document:', err);
  process.exit(1);
});
