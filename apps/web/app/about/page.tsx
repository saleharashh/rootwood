import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Hammer, Leaf, Palette, Truck, BookOpen } from "lucide-react";

export const metadata = {
  title: "کارگاه ما",
  description:
    "کرفتدرات چگونه مبلمان دست‌ساز از بلوط ایرانی، گردو، گیلاس و توت می‌سازد — کارگاه، اتصالات و فلسفه پشت هر قطعه.",
};

const values = [
  {
    icon: <Leaf className="h-5 w-5" />,
    title: "موادی که به این خانه تعلق دارند",
    body:
      "با چوب‌های سخت همین منطقه کار می‌کنیم — بلوط ایرانی، گردوی آمریکایی، گیلاس آمریکایی و توت ایرانی — چون زیبا، بادوام و انتخاب درستی برای خانه‌هایی هستند که برایشان مبلمان می‌سازیم. الوار را با دقت انتخاب می‌کنیم و چوبی را برمی‌گزینیم که شخصیت داشته باشد: رگه‌های چشم‌نواز، درخشش موجی و تفاوت‌های رنگی که هر قطعه را بی‌همتا می‌کند.",
  },
  {
    icon: <Hammer className="h-5 w-5" />,
    title: "اتصال، نه پیچ و بست",
    body:
      "یک قطعه باید ده سال بعد هم همچون روز اول محکم باشد. با کام و زبانه، اتصالات بدنه چسب‌خورده و پانل‌های جا‌خورده می‌سازیم تا استحکام در اتصال باشد، نه در پیچ و براکت. نتیجه، مبلمانی است که با خانه حرکت می‌کند نه اینکه با آن کشتی بگیرد.",
  },
  {
    icon: <Palette className="h-5 w-5" />,
    title: "پرداخت سطحی که لمس می‌شود",
    body:
      "بیشتر مبلمان ما با روغن موم مات یا ساتن پرداخت می‌شود — سطحی که هنوز حس چوب می‌دهد. برای میزکار و سطح‌های پرکاربرد، گاهی لایه نازکی پلی‌اورتان ساتن می‌زنیم. درباره تفاوت‌ها صادقیم و با خوشحالی می‌گوییم کدام برای خانه و عادت‌های شما مناسب‌تر است.",
  },
  {
    icon: <Truck className="h-5 w-5" />,
    title: "تیراژ کوچک، بسته‌بندی دقیق",
    body:
      "در تیراژ کوچک کار می‌کنیم تا به جزئیاتی برسیم که بیشتر کارگاه‌ها از آن می‌گذرند. هر قطعه طوری بسته‌بندی می‌شود که سفر تا در خانه شما را سالم طی کند و هر سفارش را همان دست‌هایی بررسی می‌کنند که آن را ساخته‌اند. چیزی را نمی‌فرستیم که خودمان نخواهیم در خانه‌مان باشد.",
  },
  {
    icon: <BookOpen className="h-5 w-5" />,
    title: "ساخته‌شده برای زندگی",
    body:
      "مبلمانی که جای خودش را باز می‌کند، با استفاده بهتر می‌شود. لب‌پریدگی‌ها، نرم‌شدن لبه‌ها و تغییر پرداخت در جاهایی که دست می‌خورند نقص نیستند؛ بخشی از قصه‌اند. قطعه‌هایی می‌سازیم که می‌توانند در یک خانه واقعی، زندگی واقعی داشته باشند.",
  },
];

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="mx-auto w-full max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-[var(--color-border)] bg-white px-6 py-12 sm:px-12 sm:py-16 shadow-xs">
          <div className="relative grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-14">
            <div className="space-y-5">
              <span className="inline-block rounded-full bg-[var(--color-surface-2)] border border-[var(--color-border)] px-3 py-1 text-xs font-bold text-[var(--color-accent-strong)]">
                فلسفه کارگاه ما
              </span>
              <h1 className="text-3xl font-bold leading-[1.3] text-[var(--color-wood)] sm:text-4xl lg:text-5xl tracking-tight">
                مبلمان دست‌ساز، در تیراژ محدود، برای زندگی واقعی.
              </h1>
              <p className="max-w-xl text-base leading-relaxed text-[var(--color-ink-soft)] sm:text-lg">
                کرفتدرات یک کارگاه نجاری تخصصی در شیراز است که مبلمان را از چوب‌های سخت و ریشه‌دار می‌سازد — بلوط ایرانی، گردوی آمریکایی، گیلاس و توت ایرانی. ما میز، نشیمن، ذخیره‌سازی و دکور می‌سازیم؛ صادق با ذات چوب، متعهد به پایداری اتصالات، و خلق‌شده برای خانه‌هایی که به اصالت عشق می‌ورزند.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <Link href="/products" className="btn btn-primary px-5 py-2.5 text-sm">
                  مشاهده مجموعه محصولات
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link href="/contact" className="btn btn-ghost px-5 py-2.5 text-sm">
                  گفت‌وگو با کارگاه
                </Link>
              </div>
            </div>
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-2.5 shadow-xs">
              <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-[#eee7dd] lg:aspect-[5/4]">
                <Image
                  src="/images/workshop.webp"
                  alt="فضای داخل کارگاه نجاری کرفتدرات"
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                <span className="absolute bottom-3 start-3 rounded-lg border border-white/20 bg-white/90 px-3 py-1.5 text-xs font-bold text-[var(--color-wood)] backdrop-blur-md shadow-xs">
                  کارگاه کرفتدرات · شیراز، ایران
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="mb-12 text-center">
          <span className="mb-2 inline-block text-xs font-bold uppercase tracking-wider text-[var(--color-accent)]">
            ارزش‌های پایدار
          </span>
          <h2 className="text-2xl font-bold text-[var(--color-wood)] sm:text-3xl">
            اصول نانوشته کارگاه ما
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-[var(--color-ink-soft)]">
            مبلمان باکیفیت یک تصمیم واحد نیست؛ حاصل صدها انتخاب متعهدانه است، از انتخاب گرده‌بینه تا ساعت‌ها سنباده‌کاری و پرداخت دست‌ساز.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-6">
          {values.map((v, index) => (
            <div
              key={v.title}
              className={`card-lift rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-xs ${
                index >= 3 ? "lg:col-span-3" : "lg:col-span-2"
              }`}
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--color-surface-2)] text-[var(--color-accent)]">
                {v.icon}
              </div>
              <h3 className="mb-2 text-base font-bold text-[var(--color-wood)]">
                {v.title}
              </h3>
              <p className="text-xs sm:text-sm leading-relaxed text-[var(--color-ink-soft)]">
                {v.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Materials */}
      <section className="mx-auto max-w-7xl px-4 pb-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-[var(--color-border)] bg-white px-6 py-10 sm:px-10 sm:py-14 shadow-xs">
          <div className="mb-10 text-center">
            <span className="mb-2 inline-block text-xs font-bold uppercase tracking-wider text-[var(--color-accent)]">
              شناخت متریال
            </span>
            <h2 className="text-2xl font-bold text-[var(--color-wood)] sm:text-3xl">
              گونه‌های چوب سخت در کارگاه
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-[var(--color-ink-soft)]">
              هر چوب شناسنامه، وزن مخصوص، تراکم و ویژگی‌های انحصاری خود را دارد.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                name: "بلوط ایرانی",
                note: "بسیار متراکم، راست‌دانه و با مقاومت استثنایی. از کرم گرم تا عسلی تیره. ستون فقرات میزها و صندلی‌های ما.",
                color: "bg-[#8a5a2b]",
              },
              {
                name: "گردوی سیاه آمریکایی",
                note: "تیره، اشرافی، غنی و گرم. با گذر سال‌ها روغن‌پذیری‌اش بیشتر و زیباتر می‌شود. انتخابی بی‌نظیر برای میز قهوه و کنسول.",
                color: "bg-[#3a2a1a]",
              },
              {
                name: "گیلاس آمریکایی",
                note: "بافت ریز و لطیف با بازتابی سرخ‌فام و نجیب در برابر تابش نور. پرداخت روغن روی این چوب به نرمی ابریشم می‌نشیند.",
                color: "bg-[#7a4a24]",
              },
              {
                name: "توت ایرانی",
                note: "متراکم، ریزدانه با رگه‌های متغیر از طلایی تا زیتونی تیره. انعطاف بالا و مقاومتی کم‌نظیر در برابر رطوبت خانگی.",
                color: "bg-[#5a3a1a]",
              },
            ].map((wood) => (
              <div
                key={wood.name}
                className="card-lift overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-2.5 transition-all"
              >
                <div
                  className={`relative flex h-24 items-end overflow-hidden rounded-xl p-4 ${wood.color}`}
                >
                  <div
                    aria-hidden
                    className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"
                  />
                  <span className="relative text-sm font-bold text-white">
                    {wood.name}
                  </span>
                </div>
                <div className="p-3">
                  <p className="text-xs leading-relaxed text-[var(--color-ink-soft)]">
                    {wood.note}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="mb-12 text-center">
          <span className="mb-2 inline-block text-xs font-bold uppercase tracking-wider text-[var(--color-accent)]">
            مراحل آفرینش
          </span>
          <h2 className="text-2xl font-bold text-[var(--color-wood)] sm:text-3xl">
            از انتخاب الوار تا اتاق شما
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-[var(--color-ink-soft)]">
            یک مسیر شفاف و دقیق برای تضمین ماندگاری نسلی قطعات.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              step: "۰۱",
              title: "طراحی فرم و تناسب",
              body: "طراحی متناسب با ارگونومی و فضاهای واقعی ایرانی، نه فقط جلوه‌های ژورنالی ناپایدار.",
            },
            {
              step: "۰۲",
              title: "گزینش تخته‌های چوب",
              body: "انتخاب دستی الوارها بر مبنای جهت رگه، خشکی استاندارد و تقارن طرح چوب در سطح میز.",
            },
            {
              step: "۰۳",
              title: "اتصالات سنتی و پرداخت",
              body: "اجرای کام و زبانه، سنباده‌کاری چندمرحله‌ای تا گرید ۴۰۰ و چنددست اشباع روغن گیاهی.",
            },
            {
              step: "۰۴",
              title: "بسته‌بندی ایمن و تحویل",
              body: "بسته‌بندی چندلایه با محافظ لبه، ارسال با باربری تخصصی مبلمان و پیگیری تا استقرار در منزل.",
            },
          ].map((s) => (
            <div key={s.step} className="rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-xs">
              <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-lg bg-[var(--color-surface-2)] px-2 font-mono text-xs font-bold text-[var(--color-accent-strong)]">
                {s.step}
              </span>
              <h3 className="mb-2 mt-4 text-base font-bold text-[var(--color-wood)]">
                {s.title}
              </h3>
              <p className="text-xs sm:text-sm leading-relaxed text-[var(--color-ink-soft)]">
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-[#2e251e] bg-[#1c1612] px-6 py-12 sm:px-14 sm:py-16 text-[#f7f2ea]">
          <div className="relative mx-auto max-w-3xl text-center">
            <h2 className="text-2xl font-bold text-[#faf7f2] sm:text-3xl">
              سفارش اختصاصی یا سوالی درباره ابعاد دارید؟
            </h2>
            <p className="mt-3 text-sm sm:text-base leading-relaxed text-[#b8ab9a]">
              کارشناسان کارگاه آماده‌اند تا در زمینه انتخاب چوب، ابعاد سفارشی مناسب فضای شما و نحوه نگهداری مشورت دهند.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href="/contact"
                className="btn bg-[#faf7f2] text-[#1c1612] hover:bg-white text-sm font-bold px-6 py-3"
              >
                ارتباط با کارگاه
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href="/products"
                className="btn border border-[#44382d] bg-transparent text-[#d4c9b9] hover:bg-white/5 hover:text-white text-sm font-semibold px-6 py-3"
              >
                مشاهده محصولات
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
