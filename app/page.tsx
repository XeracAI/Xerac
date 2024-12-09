import Link from 'next/link'
import Image from 'next/image'

import {FeatureBlock3DCarousel} from '@/components/ui/feature-block-3d-carousel'
import {CardDescription} from '@/components/ui/cards'

import arrowDownIcon from '@/assets/icons/arrow-down.svg'

export default function Home() {
  return (
    <>
      <FeatureBlock3DCarousel />

      <Link
        href="/chat"
        className="absolute top-0 left-0 z-50 m-10 flex items-center justify-center px-5 py-3 rounded-md bg-neutral-300 text-black text-lg font-bold hover:shadow-[8px_8px_0px_0px_rgba(0,0,0)] transition duration-200"
      >
        شروع به استفاده
      </Link>

      {/*<div className="absolute top-20 left-1/2 -translate-x-1/2 w-max md:mt-10 text-2xl md:text-4xl z-50 font-normal text-gray-800 dark:text-white">زیرک:*/}
      {/*  هوش مصنوعی به سادگی*/}
      {/*</div>*/}

      <Image
        className="absolute bottom-8 left-1/2 -translate-x-1/2 size-12 animate-bounce text-gray-400 z-50"
        src={arrowDownIcon}
        alt="Arrow Down"
      />

      <div className="md:absolute md:bottom-24 md:left-1/2 md:-translate-x-1/2 w-full flex flex-col items-center gap-8 py-10 z-50">
        <div className="flex items-center gap-20">
          <CardDescription className="text-xl">زیرک رو برای کدوم گزینه بیشتر به کار می‌گیری؟</CardDescription>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 items-center gap-8">
          <Link
            href="/byte-knights"
            className="flex items-center w-40 px-5 py-3 rounded-md border border-solid border-neutral-300 bg-transparent text-neutral-300 text-lg hover:shadow-[6px_6px_0px_0px_rgba(242,240,232)] transition duration-200 justify-center"
          >
            برنامه نویسی
          </Link>
          <Link
            href="/byte-knights"
            className="flex items-center w-40 px-5 py-3 rounded-md border border-solid border-neutral-300 bg-transparent text-neutral-300 text-lg hover:shadow-[6px_6px_0px_0px_rgba(242,240,232)] transition duration-200 justify-center"
          >
            درس و دانشگاه
          </Link>
          <Link
            href="/byte-knights"
            className="flex items-center w-40 px-5 py-3 rounded-md border border-solid border-neutral-300 bg-transparent text-neutral-300 text-lg hover:shadow-[6px_6px_0px_0px_rgba(242,240,232)] transition duration-200 justify-center"
          >
            تولید محتوا
          </Link>
          <Link
            href="/byte-knights"
            className="flex items-center w-40 px-5 py-3 rounded-md border border-solid border-neutral-300 bg-transparent text-neutral-300 text-lg hover:shadow-[6px_6px_0px_0px_rgba(242,240,232)] transition duration-200 justify-center"
          >
            استفاده روزمره
          </Link>
        </div>
      </div>

      {/* Xerac introduction */}
      <section className="relative min-h-screen w-full bg-[#253447] flex flex-col items-center md:items-start justify-center px-6 md:px-16">
        <div className="max-w-xl text-right space-y-6">
          <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight">زیرک: هوش مصنوعی، به سادگی</h1>

          <p className="text-lg md:text-xl text-gray-300 leading-relaxed">
            زیرک، هاب ارتباطی شما با دنیای هوش مصنوعی است. زیرک دسترسی به قدرتمندترین مدل‌های هوش مصنوعی را بدون نیاز به
            فیلترشکن، شماره خارجی یا کارت اعتباری، در ایران آسان می‌کند. دیگر لازم نیست اکانت‌های جداگانه‌ای مانند Claude یا
            ChatGPT بخرید. با یک اکانت زیرک، به تمام این مدل‌ها دسترسی خواهید داشت، آسان‌تر، بهتر، و حتی با قیمتی منصفانه‌تر.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Link
              href="/byte-knights"
              className="flex items-center justify-center px-5 py-3 rounded-md bg-neutral-300 text-black text-lg font-bold hover:shadow-[8px_8px_0px_0px_rgba(0,0,0)] transition duration-200"
            >
              شروع کنید
            </Link>
            <Link
              href="/byte-knights"
              className="flex items-center px-5 py-3 rounded-md border border-solid border-neutral-300 bg-transparent text-neutral-300 text-lg hover:shadow-[6px_6px_0px_0px_rgba(242,240,232)] transition duration-200 justify-center"
            >
              استفاده رایگان از چت جی‌پی‌تی
            </Link>
          </div>
        </div>
      </section>

      {/* User categories */}
      <section className="relative min-h-screen w-full bg-[#1F2C3C] flex flex-col items-center px-6 md:px-16 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">زیرک: هوش مصنوعی در خدمت همه</h2>
          <p className="text-lg text-gray-300 max-w-3xl mx-auto">
            فرقی نمی‌کند چه شغلی دارید یا در چه مرحله‌ای از زندگی هستید. اگر ذهنی پویا و کنجکاو دارید، زیرک برای شماست. این
            دستیار هوشمند، همراه ایده‌آل برای افرادی است که به‌دنبال رشد، یادگیری و نوآوری هستند.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Programmers Card */}
          <div className="bg-[#1C2837] p-8 rounded-lg border border-gray-700 hover:border-gray-500 transition-all">
            <div className="text-4xl mb-4">💻</div>
            <h3 className="text-xl font-bold text-white mb-3">برنامه‌نویسان</h3>
            <p className="text-gray-300">دیباگ سریع کد، نوشتن مستندات فنی، و بهینه‌سازی الگوریتم‌ها</p>
          </div>

          {/* University Students Card */}
          <div className="bg-[#1C2837] p-8 rounded-lg border border-gray-700 hover:border-gray-500 transition-all">
            <div className="text-4xl mb-4">✈️</div>
            <h3 className="text-xl font-bold text-white mb-3">دانشگاهیان</h3>
            <p className="text-gray-300">کمک در نگارش پایان‌نامه و مقالات علمی، ترجمه متون تخصصی، و یافتن منابع پژوهشی معتبر</p>
          </div>

          {/* Students Card */}
          <div className="bg-[#1C2837] p-8 rounded-lg border border-gray-700 hover:border-gray-500 transition-all">
            <div className="text-4xl mb-4">😊</div>
            <h3 className="text-xl font-bold text-white mb-3">دانش‌آموزان</h3>
            <p className="text-gray-300">کمک در انجام تکالیف درسی، درک مفاهیم پیچیده دروس، و راهنمایی در پروژه‌های مدرسه</p>
          </div>

          {/* Business Owners Card */}
          <div className="bg-[#1C2837] p-8 rounded-lg border border-gray-700 hover:border-gray-500 transition-all">
            <div className="text-4xl mb-4">🛡️</div>
            <h3 className="text-xl font-bold text-white mb-3">صاحبان کسب‌وکار</h3>
            <p className="text-gray-300">تهیه گزارش‌های حرفه‌ای، طراحی استراتژی، نوشتن پروپوزال و نگارش ایمیل‌های تاثیرگذار</p>
          </div>

          {/* Content Creators Card */}
          <div className="bg-[#1C2837] p-8 rounded-lg border border-gray-700 hover:border-gray-500 transition-all">
            <div className="text-4xl mb-4">⏰</div>
            <h3 className="text-xl font-bold text-white mb-3">تولیدکنندگان محتوا</h3>
            <p className="text-gray-300">خلق کپشن جذاب، ایده‌پردازی برای پست‌های اینستاگرام، و نوشتن متون تبلیغاتی گیرا</p>
          </div>

          {/* For Everyone Card */}
          <div className="bg-[#1C2837] p-8 rounded-lg border border-gray-700 hover:border-gray-500 transition-all">
            <div className="text-4xl mb-4">💰</div>
            <h3 className="text-xl font-bold text-white mb-3">برای همه</h3>
            <p className="text-gray-300">
              پاسخ به سوالات روزمره، برنامه‌ریزی کارآمد، پیشنهاد دستور غذاهای خوشمزه، و حتی کمک در انجام تکالیف فرزندان
            </p>
          </div>
        </div>
      </section>

      {/* AI Models Comparison Section */}
      <section className="relative w-full bg-[#253447] flex flex-col items-center px-6 md:px-16 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">نگاهی به مدل‌های هوش مصنوعی موجود در زیرک</h2>
          <p className="text-lg text-gray-300 max-w-3xl mx-auto">
            بدون نیاز به VPN، شماره خارجی، یا کارت اعتباری خارجی، زیرک در حال حاضر دسترسی به ۱۰ مدل هوش مصنوعی از ۳ شرکت معتبر
            را فراهم می‌کند:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* OpenAI Card */}
          <div className="bg-[#1C2837] p-8 rounded-lg border border-gray-700 hover:border-gray-500 transition-all">
            <h3 className="text-2xl font-bold text-white mb-3 text-center">اوپن ای‌آی (OpenAI)</h3>
            <p className="text-gray-300 text-center">مدل‌های ChatGPT (چت‌جی‌پی‌تی) و DALL-E (دال-ای)</p>
          </div>

          {/* Anthropic Card */}
          <div className="bg-[#1C2837] p-8 rounded-lg border border-gray-700 hover:border-gray-500 transition-all">
            <h3 className="text-2xl font-bold text-white mb-3 text-center">آنتروپیک (Anthropic)</h3>
            <p className="text-gray-300 text-center">مدل‌های Claude (کلاود)</p>
          </div>

          {/* Google Card */}
          <div className="bg-[#1C2837] p-8 rounded-lg border border-gray-700 hover:border-gray-500 transition-all">
            <h3 className="text-2xl font-bold text-white mb-3 text-center">گوگل (Google)</h3>
            <p className="text-gray-300 text-center">مدل‌های Gemini (جمینای)</p>
          </div>
        </div>

        <div className="mt-12 text-center max-w-3xl">
          <p className="text-gray-300 mb-4">
            هر کدام از این مدل‌ها در نسخه‌های مختلف ارائه می‌شوند تا بتوانید مناسب‌ترین گزینه را برای نیاز خود انتخاب کنید.
          </p>
          <p className="text-gray-300 mb-4">
            علاوه بر این، زیرک یک دستیار هوشمند دارد که به شما امکان می‌دهد با اسناد و مدارک خود گفتگو کنید. این قابلیت می‌تواند
            در پیدا کردن سریع اطلاعات در فایل‌هایتان کمک کند.
          </p>
          <p className="text-gray-300">
            و این تازه شروع کار است! به زودی ویژگی‌ها و دستیاران هوشمند بیشتری به زیرک اضافه خواهند شد تا زندگی شما را آسان‌تر،
            وقت‌تان را آزادتر و بهره‌وری‌تان را پربارتر کنند.
          </p>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="relative w-full bg-[#1F2C3C] flex flex-col items-center px-6 md:px-16 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">مزایای زیرک</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Ease of Use Card */}
          <div className="bg-[#1C2837] p-8 rounded-lg border border-gray-700 hover:border-gray-500 transition-all">
            <h3 className="text-xl font-bold text-white mb-3 text-right">سادگی و سهولت استفاده</h3>
            <p className="text-gray-300 text-right leading-relaxed">
              رابط کاربری زیرک به گونه‌ای طراحی شده است که استفاده از آن برای هر کسی آسان و بدون نیاز به آموزش ویژه باشد.
            </p>
          </div>

          {/* Accessibility Card */}
          <div className="bg-[#1C2837] p-8 rounded-lg border border-gray-700 hover:border-gray-500 transition-all">
            <h3 className="text-xl font-bold text-white mb-3 text-right">قابل دسترس بودن</h3>
            <p className="text-gray-300 text-right leading-relaxed">
              شما می‌توانید به سادگی و بدون هیچ محدودیتی از زیرک استفاده کنید. نیازی به VPN یا شماره تلفن خارجی و یا گرفتن کارت
              نداریم.
            </p>
          </div>

          {/* Fair Payment Card */}
          <div className="bg-[#1C2837] p-8 rounded-lg border border-gray-700 hover:border-gray-500 transition-all">
            <h3 className="text-xl font-bold text-white mb-3 text-right">پرداخت منصفانه</h3>
            <p className="text-gray-300 text-right leading-relaxed">
              زیرک از سیستم پرداخت بر حسب مصرف استفاده می‌کند. این سیستم به شما اجازه می‌دهد برای آن چه که استفاده می‌کنید
              پرداخت کنید. با استفاده از هوش مصنوعی به طور بهینه و بدون نیاز به پرداخت های اضافی استفاده کنید.
            </p>
          </div>
        </div>
      </section>

      {/* Free ChatGPT Section */}
      <section className="relative w-full bg-[#253447] flex flex-col items-center px-6 md:px-16 py-20">
        <div className="text-center space-y-4 max-w-2xl">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">استفاده رایگان از چت جی‌پی‌تی - ۲۰ سوال در روز</h2>
          <p className="text-lg text-gray-300 mb-8">همین الان از چت جی پی تی رایگان استفاده کن</p>
          <Link
            href="/chat"
            className="inline-flex items-center px-8 py-4 rounded-md border border-solid border-neutral-300 bg-transparent text-neutral-300 text-lg hover:shadow-[6px_6px_0px_0px_rgba(242,240,232)] transition duration-200 justify-center"
          >
            شروع استفاده
          </Link>
        </div>
      </section>
    </>
  )
}
