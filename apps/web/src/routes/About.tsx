import { Link } from "wouter";
import { Award, Compass, HeartHandshake, Leaf, ShieldCheck, Sparkles, Trees } from "lucide-react";

export function About() {
  return (
    <div className="bg-stone-50/50 pb-24">
      {/* Hero section */}
      <div className="relative bg-stone-900 text-stone-100 py-20 px-4 sm:px-6 lg:px-8 border-b border-stone-800 overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#b45309_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="relative max-w-4xl mx-auto text-center space-y-4">
          <span className="text-xs font-bold text-amber-400 tracking-widest uppercase">
            داستان آتلیه و کارگاه روت‌وود
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold font-serif leading-tight">
            دمیدن روح هنر در تپش چوب‌های کهنسال
          </h1>
          <p className="text-stone-300 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
            ما در روت‌وود بر این باوریم که هر تکه چوب، راوی داستانی از باران‌ها، آفتاب‌ها و دهه‌ها زندگی است. ما این داستان را به دست‌سازه‌ای ماندگار برای خانه شما پیوند می‌زنیم.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 space-y-16">
        {/* Story Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-4 text-stone-700 leading-relaxed">
            <span className="text-xs font-bold text-amber-900 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
              از سال ۱۳۹۴ تاکنون
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 font-serif">
              آغازی از عشق به لمس رگه‌های گردو و بلوط
            </h2>
            <p className="text-sm sm:text-base">
              کارگاه روت‌وود در ابتدا به عنوان یک استودیوی کوچک نجاری سنتی آغاز به کار کرد. هدف ما از روز نخست، فاصله گرفتن از مبلمان ماشینی و موادی چون نئوپان و MDF بود. ما به دنبال بازآفرینی اصالت میزها و صندلی‌هایی بودیم که از نسلی به نسل دیگر به ارث می‌رسند.
            </p>
            <p className="text-sm sm:text-base">
              در گذر سال‌ها، با بهره‌گیری از استادکاران چیره‌دست منبت و نجاری و ترکیب آن با هندسه مدرن، توانسته‌ایم مجموعه‌ای منحصر‌به‌فرد از میزهای اسلب، تخت‌خواب‌های روستیک، ظروف خراطی و آکسسوارهای نفیس را خلق کنیم.
            </p>
          </div>

          <div className="rounded-3xl overflow-hidden aspect-4/3 border border-stone-200 shadow-md">
            <img
              src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=900&auto=format&fit=crop&q=80"
              alt="کارگاه نجاری روت‌وود"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Pillars / Values */}
        <div className="space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 font-serif">
              ارکان خلق هر دست‌سازه در روت‌وود
            </h2>
            <p className="text-xs sm:text-sm text-stone-500">
              چهار اصل تزلزل‌ناپذیر که در ساخت هر قطعه چوب به آن متعهدیم
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-stone-200/90 shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-900 flex items-center justify-center">
                <Trees className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-stone-900 font-serif">چوب پایدار و بازیافتی</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                تنها از تنه درختان خشکیده، هرس‌شده باغات قدیمی و الوارهای با شناسنامه قانونی حفاظت از جنگل استفاده می‌کنیم.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-stone-200/90 shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
                <Leaf className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-stone-900 font-serif">پوشش گیاهی بدون سم</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                رنگ‌ها و فینیش‌های ما از روغن‌های خالص بزرک، موم زنبور عسل و صمغ طبیعی بدون ترکیبات فرار آروماتیک (VOC) هستند.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-stone-200/90 shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-900 flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-stone-900 font-serif">اتصالات چوبی اصیل</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                استفاده از اتصالات سنتی فاق و زبانه و دم‌چلچله‌ای که در طول دهه‌ها بدون تغییر شکل و لق‌شدن استوار می‌مانند.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-stone-200/90 shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-xl bg-stone-100 text-stone-800 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-stone-900 font-serif">تضمین مادام‌العمر کیفیت</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                هر دست‌سازه همراه با شناسنامه اصالت چوب و خدمات پس از فروش و بازپرداخت روغن‌کاری دوره‌ای ارائه می‌گردد.
              </p>
            </div>
          </div>
        </div>

        {/* Call to action */}
        <div className="bg-gradient-to-br from-[#78401d] via-[#8c4f27] to-[#633316] text-[#fcfaf7] rounded-3xl p-8 sm:p-12 text-center space-y-5 shadow-lg">
          <h2 className="text-2xl sm:text-3xl font-extrabold font-serif text-white">
            دست‌سازه‌ای خاص برای معماری خانه شما
          </h2>
          <p className="text-xs sm:text-sm text-[#fbf4ec]/90 max-w-xl mx-auto leading-relaxed">
            آیا ابعاد خاص، گونه چوب مشخص یا طراحی متفاوتی در ذهن دارید؟ ما در آتلیه آماده طراحی سه‌بعدی و ساخت اختصاصی آن برای شما هستیم.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Link
              href="/contact"
              className="bg-white hover:bg-[#fbf4ec] text-[#78401d] text-xs sm:text-sm font-bold px-6 py-3 rounded-xl transition shadow-xs"
            >
              ثبت سفارش اختصاصی و مشاوره
            </Link>
            <Link
              href="/products"
              className="bg-black/20 hover:bg-black/30 text-white text-xs sm:text-sm font-semibold px-6 py-3 rounded-xl border border-white/20 transition"
            >
              مشاهده محصولات کارگاه
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
