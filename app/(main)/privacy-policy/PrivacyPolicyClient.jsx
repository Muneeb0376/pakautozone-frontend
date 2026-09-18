'use client';

// frontend/app/(main)/privacy-policy/page.jsx
//
// ✅ NAYI JAGAH + POORI FILE — Issue 6
//
// ⚠️ AHEM — YE FILE JAGAH BADAL RAHI HAI:
//        purani:  frontend/app/privacy-policy/page.jsx
//        nayi:    frontend/app/(main)/privacy-policy/page.jsx
//
//    Wajah: purani file (main) group ke BAHAR thi, is liye us par Navbar aur
//    Footer render hi nahi hote thay — safha nanga khulta tha aur baqi site
//    se katta hua lagta tha. (main)/layout.jsx ke andar aate hi dono khud
//    lag jate hain, aur theme bhi baqi site jaisi ho jati hai.
//
//    ➜ Nayi file banane ke baad PURANA folder `app/privacy-policy/` DELETE
//      kar dein, warna Next.js do same routes par confuse hoga.
//
// Kya naya hai:
//   • 12 tafseeli sections (pehle 5 thay) — data retention, cookies, bachon
//     ki policy, security, third-party services, policy updates waghera
//   • Left side ek sticky \"On this page\" fehrist (desktop par) — lamba safha
//     scroll karna asaan
//   • Har section ka apna icon aur card — plain text ki deewar nahi
//   • Upar ek hero band jismein image lag sakti hai (details neeche)
//   • Neeche quick summary cards — jo log poora nahi parhte, unke liye
//   • Sab rang var(--*) tokens se — light/dark dono theek
//
// ── IMAGE LAGANE KA TAREEQA ──
// Hero band CSS `background-image` use karta hai. Aap ko sirf itna karna hai:
//     frontend/public/privacy-hero.jpg   ← koi bhi 1600x600 photo rakh dein
// File na ho to koi TOOTI HUI IMAGE ka icon nahi aata — neeche ka gradient
// hi dikhta rehta hai (yahi wajah hai ke <img> ki bajaye CSS background use
// kiya hai; server component mein onError handler nahi lag sakta).

import Link from 'next/link';
import {
  Shield, Database, Settings, Share2, Cookie, Lock, Clock, UserCheck,
  Baby, Globe, RefreshCw, Mail, ChevronRight, FileText, EyeOff, Trash2,
} from 'lucide-react';
import { useLang } from '@/lib/i18nContext';
import { SITE, mailto } from '@/lib/siteContact';

const LAST_UPDATED = '30 August 2026';

/*
 * The policy is deliberately kept as structured content (rather than putting
 * translated fragments in the JSX).  This also means the same language switch
 * used by the rest of the application updates the long-form policy in one
 * render.
 */
const COPY = {
  roman: {
    legal: 'Legal', title: 'Privacy Policy',
    description: 'Pak Auto Zone par aap ki maloomat kaise jama hoti hai, kis liye istemal hoti hai, kitni der rakhi jati hai aur aap ke kya huqooq hain — sab saaf lafzon mein, bina qanooni jargon ke.',
    updated: 'Last updated', toc: 'On this page',
    ctaTitle: 'Koi sawal reh gaya?', ctaText: 'Privacy se mutalliq kisi bhi cheez par baat karni ho — hum se seedha rabta karein.',
    email: 'Email karein', home: 'Home par wapis',
    highlightTitles: ['Number chhupa rehta hai', 'Data becha nahi jata', 'Kabhi bhi delete'],
    highlightTexts: ['Aap ka phone number tab tak masked hai jab tak visitor khud reveal na kare.', 'Hum kisi teesri party ko aap ki maloomat bechte nahi — na kabhi bechenge.', 'Account ya listing hataana ek request ki baat hai. Data 7 din mein mit jata hai.'],
  },
  en: {
    legal: 'Legal', title: 'Privacy Policy',
    description: 'This policy explains, in clear language, what information Pak Auto Zone collects, why we use it, how long we keep it, and the choices and rights you have.',
    updated: 'Last updated', toc: 'On this page',
    ctaTitle: 'Still have a question?', ctaText: 'If you would like to discuss anything about privacy, please contact us directly.',
    email: 'Email us', home: 'Back to home',
    highlightTitles: ['Your number stays private', 'We never sell data', 'Delete whenever you need'],
    highlightTexts: ['Your phone number stays masked until a visitor chooses to reveal it.', 'We do not sell your information to third parties, and never will.', 'Ask us to remove an account or listing; deletion is completed within 7 days.'],
  },
  ur: {
    legal: 'قانونی', title: 'رازداری کی پالیسی',
    description: 'اس پالیسی میں واضح الفاظ میں بتایا گیا ہے کہ پاک آٹو زون کون سی معلومات جمع کرتا ہے، کیوں استعمال کرتا ہے، کتنی دیر محفوظ رکھتا ہے اور آپ کے حقوق کیا ہیں۔',
    updated: 'آخری تازہ کاری', toc: 'اس صفحے پر',
    ctaTitle: 'کیا کوئی سوال باقی ہے؟', ctaText: 'رازداری کے بارے میں کسی بھی بات کے لیے ہم سے براہِ راست رابطہ کریں۔',
    email: 'ای میل کریں', home: 'ہوم پر واپس جائیں',
    highlightTitles: ['آپ کا نمبر پوشیدہ رہتا ہے', 'ڈیٹا فروخت نہیں کیا جاتا', 'جب چاہیں حذف کریں'],
    highlightTexts: ['آپ کا فون نمبر اس وقت تک پوشیدہ رہتا ہے جب تک وزٹر اسے ظاہر نہ کرے۔', 'ہم آپ کی معلومات کسی تیسرے فریق کو فروخت نہیں کرتے اور نہ کبھی کریں گے۔', 'اکاؤنٹ یا لسٹنگ حذف کرنے کی درخواست کریں؛ ڈیٹا ۷ دن میں مٹا دیا جاتا ہے۔'],
  },
};

const SECTION_COPY = {
  en: [
    { title: 'Information We Collect', intro: 'We only collect information genuinely needed to run the marketplace.', groups: [
      { head: 'Information you provide', items: ['When you create an account: your name, email or phone number, and city.', 'When you register a showroom: business name, address, WhatsApp number, business hours, and description.', 'When you create a listing: vehicle or part details (brand, model, year, price, mileage, condition), and uploaded photos.', 'When you submit a trade-in or price-check form: details about your current vehicle.', 'Messages sent to buyers or sellers through chat or inquiries.'] },
      { head: 'Information collected automatically', items: ['Technical device and browser details (browser name, screen size, and operating system).', 'IP address, used only for security, fraud prevention, and estimating your general city.', 'Your activity on the site: listings viewed, searches made, and items added to your wishlist.', 'Login sessions, so you do not have to enter your password repeatedly.'] },
      { head: 'Payment information', items: ['We never store your complete card or bank number in our database.', 'During payment, we retain only the transaction ID, amount, date, and status.', 'Proof of a bank transfer or Easypaisa payment is retained only until verification.'] },
    ] },
    { title: 'How We Use Information', intro: 'Every piece of information has a clear purpose. We do not use your data outside these purposes.', groups: [{ head: null, items: ['To operate your account and publish listings.', 'To connect buyers and sellers through chat, inquiries, and phone-number reveals.', 'To confirm payments and track showroom subscriptions or listing fees.', 'To detect fake listings, scams, and duplicate accounts.', 'To send essential notices about listing decisions, payments, and showroom expiry.', 'To improve the site by learning which features are useful.', 'When legally required by a valid request from a court or authority.'] }] },
    { title: 'When and With Whom Information Is Shared', intro: 'We never sell your data. We share it only in the situations described below.', groups: [
      { head: 'What is public', items: ['Your listing details, including vehicle or part information and photos, because they are the core of the marketplace.', 'Showroom name, city, address, and business hours when you register a showroom.', 'Your phone number remains masked until a visitor chooses “Show Number”.'] },
      { head: 'What is not public', items: ['Your email address.', 'Your password, which is securely hashed and cannot be read by us.', 'Payment details and transaction history.', 'Your wishlist and search history.'] },
      { head: 'Service partners', items: ['Cloudinary, to host and optimise photos.', 'Email and SMS providers, to send verification codes and essential notices.', 'Payment gateways or banks, only to verify transactions.', 'Each partner can access only the data needed for its service.'] },
    ] },
    { title: 'Cookies and Local Storage', intro: 'We do not use advertising cookies for tracking. The cookies we use keep the site working.', groups: [{ head: null, items: ['A login token, so you do not have to log in on every page.', 'Your light or dark theme choice, saved in your browser and not sent to our server.', 'Your language choice (English, Roman Urdu, or Urdu), stored under the key autopk_lang.', 'Wishlist and recent-search cache, stored only in your browser.', 'You can clear these through your browser settings; the site will still work, but you will be logged out.'] }] },
    { title: 'How We Protect Your Data', intro: 'No system can promise complete security, but we take these precautions.', groups: [{ head: null, items: ['Passwords are hashed and never stored as plain text.', 'Connections to the server use HTTPS.', 'Every dashboard route requires a login.', 'Uploaded photos are kept in separate secure storage, not on the application server.', 'Only a limited number of people can access the administration panel.', 'Please use a strong password and never share it with anyone.'] }] },
    { title: 'How Long We Keep Data', intro: null, groups: [{ head: null, items: ['Active-account data remains while you use your account.', 'A deleted listing remains recoverable for 30 days, then is permanently removed.', 'Chat messages are kept for 12 months and then archived.', 'Payment records may be retained longer for legal accounting requirements.', 'When you close your account, personal information is removed; only records required by law remain.'] }] },
    { title: 'Your Rights', intro: 'Your data belongs to you. Here is what you can do:', groups: [{ head: null, items: ['Update or delete your profile and listing details at any time.', 'Close your showroom and remove all linked listings.', 'Request a copy of your data.', 'Stop marketing emails; essential transactional notices will still arrive.', 'Request complete account deletion by emailing support; we act within seven business days.'] }] },
    { title: 'Children’s Policy', intro: null, groups: [{ head: null, items: ['This platform is not intended for anyone under 18.', 'We do not knowingly collect children’s data.', 'If we learn of such an account, we remove it.'] }] },
    { title: 'Links to Other Websites', intro: null, groups: [{ head: null, items: ['Some listings or blog posts may contain links to other websites.', 'Those websites have their own privacy policies, and we are not responsible for them.', 'Read their policy before sharing personal information through an external link.'] }] },
    { title: 'Responsibility for Listings and Content', intro: null, groups: [{ head: null, items: ['The person who creates a listing is responsible for the accuracy of its information.', 'We may remove fake or misleading listings without prior notice.', 'Uploaded photos must belong to you; using someone else’s photo is prohibited.', 'Use the Report button to flag a suspicious listing.'] }] },
    { title: 'Changes to This Policy', intro: null, groups: [{ head: null, items: ['We update this policy when necessary.', 'For major changes, we update the “Last updated” date and notify you by email or on the site.', 'Continuing to use the site after a change means you accept the new policy.'] }] },
    { title: 'Contact Us', intro: 'For a question, complaint, or request to delete your data, contact us:', groups: [{ head: null, items: [`Email: ${SITE.email}`, 'We usually reply within two to three business days.', 'Data-deletion requests are handled within seven business days.'] }] },
  ],
  ur: [
    { title: 'ہم کون سی معلومات جمع کرتے ہیں', intro: 'ہم صرف وہ معلومات جمع کرتے ہیں جو مارکیٹ پلیس چلانے کے لیے واقعی ضروری ہوں۔', groups: [
      { head: 'آپ کی فراہم کردہ معلومات', items: ['اکاؤنٹ بناتے وقت: نام، ای میل یا فون نمبر اور شہر۔', 'شوروم رجسٹر کرتے وقت: کاروبار کا نام، پتہ، واٹس ایپ نمبر، اوقاتِ کار اور تفصیل۔', 'لسٹنگ بناتے وقت: گاڑی یا پرزے کی تفصیل (برانڈ، ماڈل، سال، قیمت، مائلیج، حالت) اور اپ لوڈ کی گئی تصاویر۔', 'ٹریڈ اِن یا قیمت جانچنے کا فارم بھرتے وقت: آپ کی موجودہ گاڑی کی تفصیل۔', 'چیٹ یا استفسار کے ذریعے خریداروں یا فروخت کنندگان کو بھیجے گئے پیغامات۔'] },
      { head: 'خودکار طور پر جمع ہونے والی معلومات', items: ['ڈیوائس اور براؤزر کی تکنیکی تفصیل (براؤزر کا نام، اسکرین کا سائز اور آپریٹنگ سسٹم)۔', 'آئی پی ایڈریس، صرف سیکیورٹی، فراڈ روکنے اور عمومی شہر کا اندازہ لگانے کے لیے۔', 'سائٹ پر آپ کی سرگرمی: دیکھی گئی لسٹنگز، کی گئی تلاش اور وِش لسٹ میں شامل اشیا۔', 'لاگ اِن سیشنز، تاکہ آپ کو بار بار پاس ورڈ نہ لکھنا پڑے۔'] },
      { head: 'ادائیگی کی معلومات', items: ['ہم آپ کے کارڈ یا بینک کا مکمل نمبر اپنے ڈیٹا بیس میں کبھی محفوظ نہیں کرتے۔', 'ادائیگی کے دوران صرف ٹرانزیکشن آئی ڈی، رقم، تاریخ اور اسٹیٹس محفوظ ہوتا ہے۔', 'بینک ٹرانسفر یا ایزی پیسہ ادائیگی کا ثبوت صرف تصدیق تک رکھا جاتا ہے۔'] },
    ] },
    { title: 'معلومات کیسے استعمال ہوتی ہیں', intro: 'ہر معلومات کا واضح مقصد ہے۔ ہم آپ کا ڈیٹا ان مقاصد کے علاوہ استعمال نہیں کرتے۔', groups: [{ head: null, items: ['آپ کا اکاؤنٹ چلانے اور لسٹنگز شائع کرنے کے لیے۔', 'چیٹ، استفسار اور فون نمبر ظاہر کرنے کے ذریعے خریداروں اور فروخت کنندگان کو ملانے کے لیے۔', 'ادائیگیوں کی تصدیق اور شوروم سبسکرپشن یا لسٹنگ فیس کا ریکارڈ رکھنے کے لیے۔', 'جعلی لسٹنگز، فراڈ اور ایک جیسے اکاؤنٹس کا پتا لگانے کے لیے۔', 'لسٹنگ کے فیصلے، ادائیگی اور شوروم کی معیاد ختم ہونے جیسے ضروری نوٹس بھیجنے کے لیے۔', 'یہ جان کر سائٹ بہتر بنانے کے لیے کہ کون سی سہولت مفید ہے۔', 'قانونی ضرورت کے تحت عدالت یا مجاز ادارے کی درست درخواست پر۔'] }] },
    { title: 'معلومات کب اور کس کے ساتھ شیئر ہوتی ہیں', intro: 'ہم آپ کا ڈیٹا کبھی فروخت نہیں کرتے۔ اسے صرف درج ذیل صورتوں میں شیئر کیا جاتا ہے۔', groups: [
      { head: 'عوام کو کیا دکھائی دیتا ہے', items: ['آپ کی لسٹنگ کی تفصیل، جس میں گاڑی یا پرزے کی معلومات اور تصاویر شامل ہیں، کیونکہ یہی مارکیٹ پلیس کا بنیادی حصہ ہے۔', 'شوروم رجسٹر کرنے پر اس کا نام، شہر، پتہ اور اوقاتِ کار۔', 'آپ کا فون نمبر اس وقت تک پوشیدہ رہتا ہے جب تک وزٹر “Show Number” منتخب نہ کرے۔'] },
      { head: 'عوام کو کیا دکھائی نہیں دیتا', items: ['آپ کا ای میل پتہ۔', 'آپ کا پاس ورڈ، جو محفوظ انداز میں ہیش کیا جاتا ہے اور ہم اسے پڑھ نہیں سکتے۔', 'ادائیگی کی تفصیل اور ٹرانزیکشن کی تاریخ۔', 'آپ کی وِش لسٹ اور تلاش کی تاریخ۔'] },
      { head: 'سروس پارٹنرز', items: ['کلاؤڈنری، تصاویر ہوسٹ اور بہتر بنانے کے لیے۔', 'ای میل اور ایس ایم ایس فراہم کنندگان، تصدیقی کوڈ اور ضروری نوٹس بھیجنے کے لیے۔', 'ادائیگی کے گیٹ وے یا بینک، صرف ٹرانزیکشن کی تصدیق کے لیے۔', 'ہر پارٹنر صرف اپنے کام کے لیے ضروری ڈیٹا دیکھ سکتا ہے۔'] },
    ] },
    { title: 'کوکیز اور لوکل اسٹوریج', intro: 'ہم ٹریکنگ کے لیے تشہیری کوکیز استعمال نہیں کرتے۔ ہماری کوکیز سائٹ چلانے کے لیے ہیں۔', groups: [{ head: null, items: ['لاگ اِن ٹوکن، تاکہ ہر صفحے پر دوبارہ لاگ اِن نہ کرنا پڑے۔', 'لائٹ یا ڈارک تھیم کا انتخاب، جو آپ کے براؤزر میں محفوظ ہوتا ہے اور سرور کو نہیں بھیجا جاتا۔', 'زبان کا انتخاب (انگریزی، رومن اردو یا اردو)، جو autopk_lang کلید کے تحت محفوظ ہے۔', 'وِش لسٹ اور حالیہ تلاش کا کیش، صرف آپ کے براؤزر میں محفوظ ہوتا ہے۔', 'آپ براؤزر کی ترتیبات سے یہ سب صاف کر سکتے ہیں؛ سائٹ چلے گی لیکن آپ لاگ آؤٹ ہو جائیں گے۔'] }] },
    { title: 'آپ کا ڈیٹا کیسے محفوظ رکھا جاتا ہے', intro: 'کوئی نظام مکمل سیکیورٹی کی ضمانت نہیں دے سکتا، لیکن ہم یہ حفاظتی اقدامات کرتے ہیں۔', groups: [{ head: null, items: ['پاس ورڈز ہیش کیے جاتے ہیں اور سادہ متن میں کبھی محفوظ نہیں ہوتے۔', 'سرور سے رابطہ HTTPS کے ذریعے ہوتا ہے۔', 'ڈیش بورڈ کا ہر راستہ لاگ اِن کا تقاضا کرتا ہے۔', 'اپ لوڈ کی گئی تصاویر الگ محفوظ اسٹوریج میں رکھی جاتی ہیں، ایپلیکیشن سرور پر نہیں۔', 'ایڈمن پینل تک صرف محدود افراد کو رسائی حاصل ہے۔', 'مضبوط پاس ورڈ رکھیں اور اسے کسی کے ساتھ شیئر نہ کریں۔'] }] },
    { title: 'ڈیٹا کتنی دیر محفوظ رہتا ہے', intro: null, groups: [{ head: null, items: ['فعال اکاؤنٹ کا ڈیٹا اس وقت تک رہتا ہے جب تک آپ اکاؤنٹ استعمال کرتے ہیں۔', 'حذف کی گئی لسٹنگ ۳۰ دن تک بحال ہو سکتی ہے، پھر مستقل طور پر مٹا دی جاتی ہے۔', 'چیٹ پیغامات ۱۲ ماہ تک رکھے جاتے ہیں، پھر محفوظ کر دیے جاتے ہیں۔', 'قانونی حساب کتاب کی ضرورت کے لیے ادائیگی کے ریکارڈ زیادہ عرصے تک رکھے جا سکتے ہیں۔', 'اکاؤنٹ بند کرنے پر ذاتی معلومات حذف کر دی جاتی ہیں؛ صرف قانوناً ضروری ریکارڈ باقی رہتے ہیں۔'] }] },
    { title: 'آپ کے حقوق', intro: 'آپ کا ڈیٹا آپ کا ہے۔ آپ یہ اقدامات کر سکتے ہیں:', groups: [{ head: null, items: ['اپنی پروفائل اور لسٹنگ کی تفصیل کسی بھی وقت تبدیل یا حذف کریں۔', 'اپنا شوروم بند کروا کر تمام منسلک لسٹنگز حذف کروائیں۔', 'اپنے ڈیٹا کی نقل طلب کریں۔', 'مارکیٹنگ ای میلز بند کروائیں؛ ضروری لین دین کے نوٹس پھر بھی موصول ہوں گے۔', 'مکمل اکاؤنٹ حذف کروانے کے لیے سپورٹ کو ای میل کریں؛ ہم سات کاروباری دنوں میں کارروائی کرتے ہیں۔'] }] },
    { title: 'بچوں کی پالیسی', intro: null, groups: [{ head: null, items: ['یہ پلیٹ فارم ۱۸ سال سے کم عمر افراد کے لیے نہیں ہے۔', 'ہم جان بوجھ کر بچوں کا ڈیٹا جمع نہیں کرتے۔', 'ایسا اکاؤنٹ معلوم ہونے پر ہم اسے حذف کر دیتے ہیں۔'] }] },
    { title: 'دوسری ویب سائٹس کے لنکس', intro: null, groups: [{ head: null, items: ['کچھ لسٹنگز یا بلاگ پوسٹس میں دوسری ویب سائٹس کے لنکس ہو سکتے ہیں۔', 'ان ویب سائٹس کی اپنی رازداری کی پالیسیاں ہیں اور ہم ان کے ذمہ دار نہیں ہیں۔', 'بیرونی لنک کے ذریعے ذاتی معلومات دینے سے پہلے ان کی پالیسی پڑھ لیں۔'] }] },
    { title: 'لسٹنگز اور مواد کی ذمہ داری', intro: null, groups: [{ head: null, items: ['لسٹنگ بنانے والا شخص اس کی معلومات کی درستگی کا ذمہ دار ہے۔', 'ہم پیشگی اطلاع کے بغیر جعلی یا گمراہ کن لسٹنگ ہٹا سکتے ہیں۔', 'اپ لوڈ کی گئی تصاویر آپ کی ملکیت ہونی چاہئیں؛ کسی اور کی تصویر استعمال کرنا منع ہے۔', 'مشکوک لسٹنگ کی اطلاع دینے کے لیے رپورٹ بٹن استعمال کریں۔'] }] },
    { title: 'اس پالیسی میں تبدیلی', intro: null, groups: [{ head: null, items: ['ضرورت پڑنے پر ہم اس پالیسی کو اپ ڈیٹ کرتے ہیں۔', 'بڑی تبدیلی کی صورت میں “آخری تازہ کاری” کی تاریخ بدل کر آپ کو ای میل یا سائٹ پر اطلاع دی جائے گی۔', 'تبدیلی کے بعد سائٹ استعمال کرتے رہنے کا مطلب نئی پالیسی قبول کرنا ہے۔'] }] },
    { title: 'ہم سے رابطہ کریں', intro: 'سوال، شکایت یا ڈیٹا حذف کرنے کی درخواست کے لیے ہم سے رابطہ کریں:', groups: [{ head: null, items: [`ای میل: ${SITE.email}`, 'ہم عموماً دو سے تین کاروباری دنوں میں جواب دیتے ہیں۔', 'ڈیٹا حذف کرنے کی درخواست پر سات کاروباری دنوں میں کارروائی کی جاتی ہے۔'] }] },
  ],
};

/* ═══════════════════════════════════════════════════════════
   CONTENT — sab yahan ek jagah. Text badalna ho to sirf yahan.
   ═══════════════════════════════════════════════════════════ */
const SECTIONS = [
  {
    id: 'collect',
    icon: Database,
    title: 'Hum Kya Maloomat Jama Karte Hain',
    intro:
      'Hum sirf wo maloomat lete hain jo marketplace chalane ke liye asal mein darkar hoti hai. Neeche har qism alag alag likhi hai taake koi cheez chhupi na rahe.',
    groups: [
      {
        head: 'Aap khud jo dete hain',
        items: [
          'Account banate waqt: naam, email ya phone number, aur shehar.',
          'Showroom register karte waqt: business ka naam, address, WhatsApp number, business hours aur tafseel.',
          'Listing lagate waqt: gaari ya part ki details (brand, model, saal, price, mileage, condition) aur uploaded tasveerein.',
          'Trade-in ya price-check form bharte waqt: apni maujooda gaari ki maloomat.',
          'Chat ya inquiry ke zariye buyer/seller ko bheje gaye paighamat.',
        ],
      },
      {
        head: 'Khud ba khud jama hone wali maloomat',
        items: [
          'Device aur browser ki technical maloomat (browser ka naam, screen ka size, operating system).',
          'IP address — sirf security, fraud rokne aur approximate shehar ka andaza lagane ke liye.',
          'Site par activity: kaunsi listing dekhi, kya search kiya, kya wishlist mein daala.',
          'Login sessions taake aap ko baar baar password na dalna pare.',
        ],
      },
      {
        head: 'Payment ki maloomat',
        items: [
          'Hum aap ke card ya bank ka poora number KABHI apne database mein store nahi karte.',
          'Payment ke waqt sirf transaction ID, amount, tareekh aur status mehfooz hota hai.',
          'Bank transfer / easypaisa jaisi payment ka proof (screenshot) sirf verification tak rakha jata hai.',
        ],
      },
    ],
  },
  {
    id: 'use',
    icon: Settings,
    title: 'Maloomat Kis Liye Istemal Hoti Hai',
    intro: 'Har maloomat ka ek saaf maqsad hai. Is fehrist se bahar hum aap ka data use nahi karte.',
    groups: [
      {
        head: null,
        items: [
          'Aap ka account chalane aur listings publish karne ke liye.',
          'Buyers aur sellers ko aapas mein milane ke liye (chat, inquiry, phone reveal).',
          'Payments confirm karne aur showroom subscription ya listing fee track karne ke liye.',
          'Fake listings, scam aur duplicate accounts pakadne ke liye.',
          'Zaroori itlaa bhejne ke liye: listing approve/reject, payment confirm, showroom expiry warning.',
          'Site behtar banane ke liye — kaunsa feature kaam aa raha hai, kaunsa nahi.',
          'Qanooni zarurat par: agar kisi adalat ya idare ki jaanib se jaiz talab aaye.',
        ],
      },
    ],
  },
  {
    id: 'share',
    icon: Share2,
    title: 'Maloomat Kab Aur Kis Se Share Hoti Hai',
    intro:
      'Sab se pehle saaf baat: hum aap ka data kisi ko BECHTE nahi. Share sirf in soorton mein hota hai.',
    groups: [
      {
        head: 'Public par kya dikhta hai',
        items: [
          'Aap ki listing ki tafseel (gaari/part ki details aur tasveerein) — ye marketplace ka buniyadi hissa hai.',
          'Showroom ka naam, shehar, address aur business hours (agar aap ne showroom register kiya ho).',
          'Aap ka phone number chhupa hua (masked) rehta hai jab tak visitor khud "Show Number" na dabaye.',
        ],
      },
      {
        head: 'Public par kya NAHI dikhta',
        items: [
          'Aap ka email address.',
          'Aap ka password (wo hashed shakal mein mehfooz hai — hum bhi use parh nahi sakte).',
          'Payment ki tafseelat aur transaction history.',
          'Aap ki wishlist aur search history.',
        ],
      },
      {
        head: 'Service partners',
        items: [
          'Cloudinary — tasveerein host aur optimize karne ke liye.',
          'Email/SMS service — verification code aur zaroori itlaa bhejne ke liye.',
          'Payment gateway / bank — sirf transaction verify karne ke liye.',
          'Ye sab sirf utna hi data dekh sakte hain jitna apna kaam karne ke liye zaroori hai.',
        ],
      },
    ],
  },
  {
    id: 'cookies',
    icon: Cookie,
    title: 'Cookies Aur Local Storage',
    intro:
      'Hum tracking ke liye ishtehari cookies istemal nahi karte. Jo cookies hain wo site chalane ke liye hain.',
    groups: [
      {
        head: null,
        items: [
          'Login token — taake har page par dobara login na karna pare.',
          'Theme (light/dark) ka intekhab — browser mein mehfooz, server par nahi jata.',
          'Zaban (English / Roman Urdu / Urdu) ka intekhab — key: autopk_lang.',
          'Wishlist aur recent search ka local cache — sirf aap ke browser mein.',
          'Aap browser settings se ye sab kabhi bhi saaf kar sakte hain; site phir bhi chalegi, bas aap logout ho jayenge.',
        ],
      },
    ],
  },
  {
    id: 'security',
    icon: Lock,
    title: 'Aap Ka Data Kaise Mehfooz Rakha Jata Hai',
    intro: 'Koi bhi system 100% mehfooz honay ka dawa nahi kar sakta, lekin hum ye qadam uthate hain.',
    groups: [
      {
        head: null,
        items: [
          'Passwords hash karke rakhe jate hain (plain text mein kabhi nahi).',
          'Server se rabta HTTPS par hota hai.',
          'Dashboard ke andar ka har route login ke bagair khulta hi nahi.',
          'Uploaded tasveerein alag secure storage par hoti hain, application server par nahi.',
          'Admin panel tak sirf ginay chunay logon ki rasai hai.',
          'Aap se guzarish hai: mazboot password rakhein aur wo kisi ke sath share na karein.',
        ],
      },
    ],
  },
  {
    id: 'retention',
    icon: Clock,
    title: 'Data Kitni Der Rakha Jata Hai',
    intro: null,
    groups: [
      {
        head: null,
        items: [
          'Active account ka data tab tak rehta hai jab tak aap account chala rahe hain.',
          'Delete ki gayi listing 30 din tak recoverable rehti hai, phir hamesha ke liye mit jati hai.',
          'Chat messages 12 mahine tak, phir archive.',
          'Payment ke record qanooni hisaab kitaab ke liye zyada arse tak rakhe ja sakte hain.',
          'Account band karne par personal maloomat hata di jati hai; sirf wo record rehte hain jo qanoon ke tehat rakhna zaroori ho.',
        ],
      },
    ],
  },
  {
    id: 'rights',
    icon: UserCheck,
    title: 'Aap Ke Huqooq',
    intro: 'Aap ka data aap ka hai. Ye sab aap kar sakte hain:',
    groups: [
      {
        head: null,
        items: [
          'Apni profile aur listing details kabhi bhi update ya delete karna.',
          'Apna showroom band karwa ke saari linked listings hatwana.',
          'Apne data ki nakal (copy) mangwana.',
          'Marketing emails band karwana (zaroori transactional itlaa phir bhi aati rahegi).',
          'Poora account delete karwana — support ko email karein, 7 kaam ke dinon mein amal hota hai.',
        ],
      },
    ],
  },
  {
    id: 'children',
    icon: Baby,
    title: 'Bachon Ki Policy',
    intro: null,
    groups: [
      {
        head: null,
        items: [
          'Ye platform 18 saal se kam umar ke logon ke liye nahi hai.',
          'Hum jaan boojh kar bachon ka data jama nahi karte.',
          'Agar aisa koi account ilm mein aaye to wo hata diya jata hai.',
        ],
      },
    ],
  },
  {
    id: 'thirdparty',
    icon: Globe,
    title: 'Doosri Websites Ke Links',
    intro: null,
    groups: [
      {
        head: null,
        items: [
          'Kuch listings ya blog posts mein doosri websites ke links ho sakte hain.',
          'Un websites ki apni privacy policy hoti hai — hum us par zimmedar nahi.',
          'Kisi bhi bahar wale link par apni zaati maloomat dene se pehle un ki policy zaroor parh lein.',
        ],
      },
    ],
  },
  {
    id: 'listings',
    icon: FileText,
    title: 'Listings Aur Content Ki Zimmedari',
    intro: null,
    groups: [
      {
        head: null,
        items: [
          'Listing mein di gayi maloomat ki sehat ki zimmedari listing lagane wale ki hai.',
          'Hum fake ya misleading listing hataney ka haq rakhte hain, bagair pehle ittila diye.',
          'Aap ki uploaded tasveerein aap ki milkiyat honi chahiyein — kisi aur ki tasveer lagana mana hai.',
          'Report button se aap kisi bhi mashkook listing ki shikayat kar sakte hain.',
        ],
      },
    ],
  },
  {
    id: 'changes',
    icon: RefreshCw,
    title: 'Is Policy Mein Tabdeeli',
    intro: null,
    groups: [
      {
        head: null,
        items: [
          'Zarurat parne par ye policy update hoti rehti hai.',
          'Bari tabdeeli par upar ki "Last updated" tareekh badal jati hai aur aap ko email ya site par itlaa milti hai.',
          'Tabdeeli ke baad site istemal karte rehna nayi policy qubool karne ke barabar hai.',
        ],
      },
    ],
  },
  {
    id: 'contact',
    icon: Mail,
    title: 'Rabta',
    intro: 'Koi sawal, shikayat ya data delete karne ki request ho to bataiye:',
    groups: [
      {
        head: null,
        items: [
          'Email: pakautozone@gmail.com',
          'Jawab aam tor par 2 se 3 kaam ke dinon mein aa jata hai.',
          'Data delete karne ki request par 7 kaam ke dinon mein amal hota hai.',
        ],
      },
    ],
  },
];

/* Upar wale teen quick cards — jo poora safha nahi parhna chahte */
const HIGHLIGHTS = [
  { icon: EyeOff, title: 'Number chhupa rehta hai', text: 'Aap ka phone number tab tak masked hai jab tak visitor khud reveal na kare.' },
  { icon: Shield, title: 'Data becha nahi jata', text: 'Hum kisi teesri party ko aap ki maloomat bechte nahi — na kabhi bechenge.' },
  { icon: Trash2, title: 'Kabhi bhi delete', text: 'Account ya listing hataana ek request ki baat hai. Data 7 din mein mit jata hai.' },
];

/* ═══════════════════════════════════════════════════════════ */

export default function PrivacyPolicyPage() {
  const { lang, t } = useLang();
  const copy = COPY[lang] || COPY.roman;
  const label = (key, fallback) => t(`privacy.${key}`) || fallback;
  const sectionCopy = SECTION_COPY[lang];
  const sectionText = (section, index) => {
    const translated = sectionCopy?.[index];
    return lang === 'roman' || !translated ? section : { ...section, ...translated };
  };
  const sections = SECTIONS.map(sectionText);
  const highlights = HIGHLIGHTS.map((highlight, index) => ({
    ...highlight,
    title: copy.highlightTitles[index],
    text: copy.highlightTexts[index],
  }));

  return (
    <div className="pb-16">
      {/* ━━━━━━ HERO ━━━━━━ */}
      <div
        className="relative left-1/2 right-1/2 -mx-[50vw] w-screen overflow-hidden mb-10"
        style={{ background: 'var(--bg-hero)' }}
      >
        {/* Image layer — public/privacy-hero.jpg. File na ho to sirf gradient dikhta hai. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-20 bg-cover bg-center"
          style={{ backgroundImage: "url('/privacy-hero.jpg')" }}
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-24 right-1/4 w-96 h-96 rounded-full blur-3xl pointer-events-none"
          style={{ background: 'rgba(232,184,75,0.12)' }}
        />

        <div className="relative max-w-4xl mx-auto px-4 py-14 sm:py-20">
          <span
            className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] px-3 py-1.5 rounded-full mb-5"
            style={{
              background: 'rgba(232,184,75,0.12)',
              color: 'var(--accent)',
              border: '1px solid rgba(232,184,75,0.3)',
            }}
          >
            <Shield size={13} strokeWidth={2.5} />
            {label('legal', copy.legal)}
          </span>

          <h1
            className="text-3xl sm:text-5xl font-black tracking-tight leading-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            {label('title', copy.title)}
          </h1>

          <p
            className="mt-4 text-sm sm:text-base max-w-2xl leading-relaxed"
            style={{ color: 'var(--text-secondary)' }}
          >
            {copy.description}
          </p>

          <p className="mt-5 text-xs" style={{ color: 'var(--text-muted)' }}>
            {label('updated', copy.updated)}: {LAST_UPDATED}
          </p>
        </div>
      </div>

      {/* ━━━━━━ HIGHLIGHTS ━━━━━━ */}
      <div className="max-w-6xl mx-auto px-4 mb-12">
        <div className="grid sm:grid-cols-3 gap-4">
          {highlights.map(({ icon: Icon, title, text }) => (
            <div
              key={title}
              className="p-5 rounded-2xl"
              style={{
                background: 'var(--card-bg)',
                border: '1px solid var(--border-color)',
                boxShadow: 'var(--card-shadow)',
              }}
            >
              <span
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                style={{ background: 'rgba(232,184,75,0.10)' }}
              >
                <Icon size={19} strokeWidth={1.8} style={{ color: 'var(--accent)' }} />
              </span>
              <p className="font-bold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>
                {title}
              </p>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {text}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ━━━━━━ BODY: TOC + SECTIONS ━━━━━━ */}
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid lg:grid-cols-[240px_1fr] gap-10">
          {/* ── TOC (desktop) ── */}
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <p
                className="text-[11px] font-bold uppercase tracking-wider mb-3"
                style={{ color: 'var(--text-muted)' }}
              >
                {label('onThisPage', copy.toc)}
              </p>
              <nav className="space-y-0.5">
                {sections.map((s, i) => (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    className="paz-toc flex items-start gap-2 py-1.5 text-[13px] leading-snug transition-colors"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    <span className="tabular-nums shrink-0 opacity-50">{i + 1}.</span>
                    <span>{s.title}</span>
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          {/* ── Sections ── */}
          <div className="min-w-0 space-y-5">
            {sections.map((s, i) => {
              const Icon = s.icon;
              return (
                <section
                  key={s.id}
                  id={s.id}
                  className="scroll-mt-24 rounded-2xl p-6 sm:p-7"
                  style={{
                    background: 'var(--card-bg)',
                    border: '1px solid var(--border-color)',
                    boxShadow: 'var(--card-shadow)',
                  }}
                >
                  <div className="flex items-start gap-3.5 mb-4">
                    <span
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: 'rgba(232,184,75,0.10)' }}
                    >
                      <Icon size={19} strokeWidth={1.8} style={{ color: 'var(--accent)' }} />
                    </span>
                    <h2
                      className="text-lg sm:text-xl font-black leading-tight pt-1.5"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      <span className="tabular-nums mr-1.5" style={{ color: 'var(--text-muted)' }}>
                        {i + 1}.
                      </span>
                      {s.title}
                    </h2>
                  </div>

                  {s.intro && (
                    <p
                      className="text-sm leading-relaxed mb-5"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {s.intro}
                    </p>
                  )}

                  <div className="space-y-5">
                    {s.groups.map((g, gi) => (
                      <div key={gi}>
                        {g.head && (
                          <p
                            className="text-[11px] font-bold uppercase tracking-wider mb-2.5"
                            style={{ color: 'var(--accent)' }}
                          >
                            {g.head}
                          </p>
                        )}
                        <ul className="space-y-2">
                          {g.items.map((item, ii) => (
                            <li key={ii} className="flex items-start gap-2.5">
                              <ChevronRight
                                size={14}
                                className="shrink-0 mt-[3px]"
                                style={{ color: 'var(--accent)' }}
                              />
                              <span
                                className="text-sm leading-relaxed"
                                style={{ color: 'var(--text-secondary)' }}
                              >
                                {item}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}

            {/* ── CTA ── */}
            <div
              className="rounded-2xl p-6 sm:p-8 text-center"
              style={{
                background: 'var(--bg-dash-cta)',
                border: '1px solid var(--border-dash-cta)',
              }}
            >
              <h3 className="text-lg font-black mb-2" style={{ color: 'var(--text-primary)' }}>
                {label('ctaTitle', copy.ctaTitle)}
              </h3>
              <p className="text-sm mb-5 max-w-md mx-auto" style={{ color: 'var(--text-secondary)' }}>
                {copy.ctaText}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <a
                  href={mailto('Privacy Policy question')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-xl text-sm font-bold"
                  style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
                >
                  <Mail size={15} />
                  {label('email', copy.email)}
                </a>
                <Link
                  href="/"
                  className="inline-flex items-center justify-center h-11 px-6 rounded-xl text-sm font-bold"
                  style={{ border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                >
                  {label('home', copy.home)}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}