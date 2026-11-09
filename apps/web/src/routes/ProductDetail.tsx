import { useEffect, useState } from "react";
import { Link, useRoute } from "wouter";
import {
  ArrowRight,
  Check,
  Heart,
  Minus,
  Plus,
  RotateCcw,
  Share2,
  ShieldCheck,
  Star,
  Truck,
  Wrench,
  Trees,
  Sparkles,
  ShoppingBag,
  Flame,
} from "lucide-react";
import { api, type Product, type Review } from "@/lib/api";
import { formatPriceToman, toPersianDigits, formatJalaliDate } from "@/lib/price";
import { useCart } from "@/components/cart-provider";
import { useAuth } from "@/components/auth-provider";
import { useToast } from "@/components/toast-provider";
import { useStoreDialogs } from "@/components/store-dialogs";
import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Chip } from "@/components/ui/chip";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export function ProductDetail() {
  const [, params] = useRoute("/products/:slug");
  const slug = params?.slug || "";

  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedWood, setSelectedWood] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("specs");

  // Review form state
  const [reviewName, setReviewName] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const { addItem, getItemQuantity } = useCart();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { openAuthDialog } = useStoreDialogs();

  useEffect(() => {
    let isMounted = true;
    async function loadProduct() {
      if (!slug) return;
      setLoading(true);
      try {
        const data = await api.getProductBySlug(slug);
        if (isMounted) {
          setProduct(data.product);
          setRelated(data.related || []);
          setSelectedWood(data.product.woodType || "گردو سیاه کوهستان");
          setSelectedImage(0);
          setQuantity(1);

          try {
            const revData = await api.getProductReviews(data.product.id);
            if (isMounted) {
              setReviews(revData.reviews || []);
            }
          } catch {
            // non-fatal
          }
        }
      } catch (err: unknown) {
        if (isMounted) {
          showToast(err instanceof Error ? err.message : "خطا در دریافت اطلاعات محصول", "error");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadProduct();
    return () => {
      isMounted = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-[#fcfbf9]">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-[#8c4f27]/20 border-t-[#8c4f27] rounded-full animate-spin mx-auto" />
          <p className="text-stone-600 text-sm font-medium">در حال فراخوانی مشخصات دست‌سازه...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center space-y-4">
        <h1 className="text-2xl font-bold font-serif text-stone-900">دست‌سازه مورد نظر یافت نشد</h1>
        <p className="text-stone-600 text-sm">ممکن است نام اثر تغییر کرده باشد یا موقتاً از کاتالوگ خارج شده باشد.</p>
        <Link href="/products">
          <Button variant="default" size="default" className="gap-2">
            <ArrowRight className="w-4 h-4" />
            <span>بازگشت به کاتالوگ آثار</span>
          </Button>
        </Link>
      </div>
    );
  }

  const images =
    product.images && product.images.length > 0
      ? product.images.map((img) => img.url)
      : [product.imageUrl || "/images/workshop.webp"];

  const handleAddToCart = () => {
    if (product.stock < quantity) {
      showToast("موجودی این اثر برای تعداد انتخابی کافی نیست", "error");
      return;
    }
    addItem(product, quantity);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.title,
          text: product.shortDescription,
          url: window.location.href,
        });
      } catch {
        // user cancelled
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast("پیوند محصول در حافظه کپی شد", "success");
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewComment.trim()) {
      showToast("لطفاً متن نظر خود را بنویسید", "error");
      return;
    }

    setSubmittingReview(true);
    try {
      const res = await api.submitReview(product.id, {
        authorName: reviewName.trim() || (user ? user.name : "کاربر مهمان"),
        rating: reviewRating,
        comment: reviewComment.trim(),
      });
      showToast(res.message || "دیدگاه شما ثبت شد و پس از بررسی منتشر می‌شود", "success");
      setReviewComment("");
      setReviewName("");
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "خطا در ثبت دیدگاه", "error");
    } finally {
      setSubmittingReview(false);
    }
  };

  const currentCartQty = getItemQuantity(product.id);
  const isOutOfStock = product.stock <= 0;
  const ratingVal =
    typeof product.rating === "number" ? product.rating : product.ratingObj?.average ?? 5;

  return (
    <div className="bg-[#fcfbf9] pb-24">
      {/* Breadcrumb Navigation */}
      <div className="border-b border-stone-200/80 bg-white/70 backdrop-blur-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <nav className="flex items-center gap-2 text-xs text-stone-500 overflow-x-auto">
            <Link href="/" className="hover:text-[#8c4f27] transition">خانه</Link>
            <span>/</span>
            <Link href="/products" className="hover:text-[#8c4f27] transition">کاتالوگ آثار</Link>
            {product.category && (
              <>
                <span>/</span>
                <Link
                  href={`/products?category=${product.category.slug}`}
                  className="hover:text-[#8c4f27] transition"
                >
                  {product.category.name}
                </Link>
              </>
            )}
            <span>/</span>
            <span className="text-stone-900 font-bold truncate">{product.title}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* ========================================================================= */}
          {/* GALLERY SECTION (7 cols)                                                  */}
          {/* ========================================================================= */}
          <div className="lg:col-span-7 space-y-4 sticky top-28">
            <div className="relative aspect-4/3 rounded-3xl overflow-hidden bg-stone-100 border border-stone-200/90 shadow-card">
              <img
                src={images[selectedImage] || "/images/workshop.webp"}
                alt={product.title}
                className="w-full h-full object-cover transition-all duration-300"
              />

              {/* Floating Badges */}
              <div className="absolute top-4 right-4 flex flex-col gap-2 items-end">
                {product.featured && (
                  <Badge variant="gold" className="shadow-xs backdrop-blur-xs gap-1.5 py-1 px-3">
                    <Flame className="w-3.5 h-3.5 text-amber-700 fill-current" />
                    <span>شاهکار برگزیده کارگاه</span>
                  </Badge>
                )}
                {product.originalPrice && product.originalPrice > product.price && (
                  <Badge variant="destructive" className="shadow-xs font-bold py-1 px-3">
                    تخفیف ویژه کارگاه
                  </Badge>
                )}
              </div>

              {/* Share button */}
              <button
                type="button"
                onClick={handleShare}
                aria-label="اشتراک‌گذاری این دست‌سازه"
                className="absolute top-4 left-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur-md text-stone-700 hover:text-[#8c4f27] flex items-center justify-center shadow-md hover:scale-105 transition"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>

            {/* Gallery Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImage(idx)}
                    className={`relative w-20 h-20 rounded-2xl overflow-hidden border-2 shrink-0 transition-all ${
                      selectedImage === idx
                        ? "border-[#8c4f27] ring-2 ring-[#8c4f27]/20 shadow-md scale-102"
                        : "border-stone-200 opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img src={img} alt={`تصویر ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* PRODUCT INFO & PURCHASE PANEL (5 cols)                                   */}
          {/* ========================================================================= */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200/90 shadow-card space-y-5">
              {/* Category + SKU */}
              <div className="flex items-center justify-between gap-2">
                <Badge variant="wood" className="text-xs">
                  {product.category?.name || "دست‌سازه‌های چوبی"}
                </Badge>
                <span className="text-[11px] font-mono text-stone-400">
                  کد اثر: {toPersianDigits(product.id.slice(0, 8))}
                </span>
              </div>

              {/* Title */}
              <h1 className="text-2xl sm:text-3xl font-extrabold font-serif text-stone-900 leading-tight">
                {product.title}
              </h1>

              {/* Rating & Reviews anchor */}
              <div className="flex items-center gap-3 text-xs sm:text-sm text-stone-600">
                <div className="flex items-center gap-1 text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.round(ratingVal) ? "fill-current" : "text-stone-200"
                      }`}
                    />
                  ))}
                </div>
                <span className="font-bold text-stone-900">
                  {toPersianDigits(ratingVal.toFixed(1))}
                </span>
                <span className="text-stone-300">•</span>
                <a href="#reviews" className="text-amber-900 hover:underline font-medium">
                  {toPersianDigits(product.reviewsCount)} دیدگاه ثبت‌شده
                </a>
              </div>

              {/* Price Block */}
              <div className="py-4 border-y border-stone-100 space-y-1">
                {product.originalPrice && product.originalPrice > product.price && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs line-through text-stone-400">
                      {formatPriceToman(product.originalPrice)}
                    </span>
                    <Badge variant="destructive" className="text-[10px]">
                      تخفیف هنری
                    </Badge>
                  </div>
                )}
                <div className="text-2xl sm:text-3xl font-black text-[#8c4f27] font-serif">
                  {formatPriceToman(product.price)}
                </div>
              </div>

              {/* Description */}
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-light">
                {product.shortDescription || product.description?.slice(0, 160)}
              </p>

              {/* Interactive Wood Species Selector */}
              <div className="space-y-2.5 pt-2">
                <label className="text-xs font-bold text-stone-800 uppercase tracking-wide block">
                  گونه چوب طبیعی این اثر:
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: "چوب گردو سیاه کوهستان", color: "#3b2216" },
                    { label: "چوب بلوط کهنسال جنگلی", color: "#c49a6c" },
                    { label: "چوب راش طبیعی گرجستان", color: "#d9b38c" },
                    { label: "چوب چنار خالدار کهن", color: "#b58763" },
                  ].map((wood) => {
                    const isSelected = selectedWood === wood.label || selectedWood.includes(wood.label.split(" ")[2]);
                    return (
                      <Chip
                        key={wood.label}
                        selected={isSelected}
                        size="sm"
                        dotColor={wood.color}
                        onClick={() => setSelectedWood(wood.label)}
                      >
                        {wood.label}
                      </Chip>
                    );
                  })}
                </div>
              </div>

              {/* Stock Status & Quantity Stepper */}
              <div className="pt-4 space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-stone-700">وضعیت در کارگاه:</span>
                  {product.stock > 0 ? (
                    <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      موجود در کارگاه ({toPersianDigits(product.stock)} عدد)
                    </span>
                  ) : (
                    <span className="text-red-700 font-bold">
                      سفارشی‌ساخت (آماده‌سازی به سفارش شما)
                    </span>
                  )}
                </div>

                <div className="flex gap-3 items-center">
                  {/* Stepper */}
                  <div className="flex items-center border border-stone-200/90 rounded-2xl bg-stone-50 p-1">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1 || isOutOfStock}
                      className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-white text-stone-700 disabled:opacity-30 transition"
                      aria-label="کاهش تعداد"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-10 text-center font-bold text-sm text-stone-900">
                      {toPersianDigits(quantity)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                      disabled={quantity >= product.stock || isOutOfStock}
                      className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-white text-stone-700 disabled:opacity-30 transition"
                      aria-label="افزایش تعداد"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Add to Cart Button */}
                  <Button
                    type="button"
                    variant="default"
                    size="lg"
                    onClick={handleAddToCart}
                    disabled={isOutOfStock}
                    className="flex-1 shadow-md gap-2"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    {isOutOfStock
                      ? "ناموجود"
                      : currentCartQty > 0
                      ? `افزودن مجدد (${toPersianDigits(currentCartQty)} در سبد)`
                      : "افزودن به سبد خرید"}
                  </Button>
                </div>
              </div>

              {/* Trust Features Strip */}
              <div className="pt-6 border-t border-stone-100 grid grid-cols-2 gap-3.5 text-xs text-stone-600">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-900 shrink-0" />
                  <span>ضمانت ۲ ساله اتصالات چوب</span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-amber-900 shrink-0" />
                  <span>بسته‌بندی مقاوم چوبی</span>
                </div>
                <div className="flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-amber-900 shrink-0" />
                  <span>۷ روز مهلت بازگشت</span>
                </div>
                <div className="flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-amber-900 shrink-0" />
                  <span>روغن گیاهی خالص بدون سرب</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TABS: SPECIFICATIONS, CARE GUIDE, REVIEWS                                 */}
        {/* ========================================================================= */}
        <div className="mt-16 bg-white rounded-3xl border border-stone-200/90 shadow-card p-6 sm:p-10 space-y-8">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full sm:w-auto grid grid-cols-3 sm:flex">
              <TabsTrigger value="specs">شناسنامه و داستان اثر</TabsTrigger>
              <TabsTrigger value="care">نگهداری چوب طبیعی</TabsTrigger>
              <TabsTrigger value="reviews">
                دیدگاه‌ها ({toPersianDigits(reviews.length)})
              </TabsTrigger>
            </TabsList>

            {/* Tab 1: Specs & Story */}
            <TabsContent value="specs" className="space-y-6 pt-4">
              <div className="text-stone-700 leading-relaxed text-sm sm:text-base whitespace-pre-line space-y-4">
                {product.description || product.shortDescription}
              </div>

              <div className="pt-6 border-t border-stone-100">
                <h3 className="text-base font-bold font-serif text-stone-900 mb-4">
                  جدول مشخصات فنی و فیزیکی
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
                  <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-100 flex justify-between">
                    <span className="text-stone-500 font-medium">گونه چوب اصلی:</span>
                    <span className="font-bold text-stone-900">{selectedWood || "چوب گردو کوهستان"}</span>
                  </div>
                  {product.dimensions && (
                    <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-100 flex justify-between">
                      <span className="text-stone-500 font-medium">ابعاد (طول × عرض × ارتفاع):</span>
                      <span className="font-bold text-stone-900">{product.dimensions}</span>
                    </div>
                  )}
                  {product.weightKg && (
                    <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-100 flex justify-between">
                      <span className="text-stone-500 font-medium">وزن تقریبی:</span>
                      <span className="font-bold text-stone-900">{toPersianDigits(product.weightKg)} کیلوگرم</span>
                    </div>
                  )}
                  <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-100 flex justify-between">
                    <span className="text-stone-500 font-medium">نوع پوشش و فینیش:</span>
                    <span className="font-bold text-stone-900">{product.finish || "روغن بزرک و موم طبیعی زنبور عسل"}</span>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Tab 2: Care Guide */}
            <TabsContent value="care" className="space-y-4 pt-4">
              <h3 className="text-base font-bold font-serif text-stone-900">
                راهنمای حفظ زیبایی و رگه‌های چوب طبیعی
              </h3>
              <ul className="text-xs sm:text-sm text-stone-600 space-y-3 leading-relaxed">
                <li className="flex gap-2">
                  <span className="text-amber-900 font-bold">•</span>
                  از تابش مستقیم و پیوسته آفتاب و نزدیکی به رادیاتور یا شومینه خودداری نمایید.
                </li>
                <li className="flex gap-2">
                  <span className="text-amber-900 font-bold">•</span>
                  گردگیری روزمره را تنها با یک دستمال پنبه‌ای نرم و کمی نم‌دار انجام دهید.
                </li>
                <li className="flex gap-2">
                  <span className="text-amber-900 font-bold">•</span>
                  هر ۶ ماه یک‌بار برای تغذیه و درخشش دوباره با واکس طبیعی یا روغن گردو سطح را چرب کنید.
                </li>
                <li className="flex gap-2">
                  <span className="text-amber-900 font-bold">•</span>
                  برای لیوان‌ها و ظروف داغ از زیرلیوانی‌های چوبی یا نمدی استفاده نمایید.
                </li>
              </ul>
            </TabsContent>

            {/* Tab 3: Reviews */}
            <TabsContent value="reviews" className="space-y-8 pt-4" id="reviews">
              {/* Form */}
              <form onSubmit={handleReviewSubmit} className="bg-stone-50 p-6 rounded-2xl border border-stone-200/80 space-y-4">
                <h4 className="text-sm font-bold font-serif text-stone-900">
                  دیدگاه خود را درباره کیفیت ساخت این اثر بنویسید
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-stone-700 block mb-1">نام شما</label>
                    <Input
                      type="text"
                      value={reviewName}
                      onChange={(e) => setReviewName(e.target.value)}
                      placeholder={user ? user.name : "مثال: علی احمدی"}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-stone-700 block mb-1">امتیاز به ظرافت و اتصالات</label>
                    <div className="flex items-center gap-2 pt-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          type="button"
                          key={star}
                          onClick={() => setReviewRating(star)}
                          className="focus:outline-none"
                        >
                          <Star
                            className={`w-6 h-6 transition-colors ${
                              star <= reviewRating
                                ? "text-amber-500 fill-amber-500"
                                : "text-stone-300"
                            }`}
                          />
                        </button>
                      ))}
                      <span className="text-xs text-stone-500 mr-2">
                        {toPersianDigits(reviewRating)} از ۵
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">متن دیدگاه</label>
                  <Textarea
                    rows={3}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="کیفیت سنباده‌کاری، بافت رگه‌ها، حس لمس چوب و تجربه بسته‌بندی..."
                    required
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-stone-500">
                    دیدگاه‌ها پس از بازبینی آتلیه منتشر می‌شوند.
                  </span>
                  <Button type="submit" size="sm" disabled={submittingReview}>
                    {submittingReview ? "در حال ارسال..." : "ثبت دیدگاه"}
                  </Button>
                </div>
              </form>

              {/* Reviews List */}
              <div className="space-y-4">
                {reviews.length === 0 ? (
                  <p className="text-xs sm:text-sm text-stone-500 text-center py-8">
                    هنوز دیدگاهی برای این دست‌سازه ثبت نشده است. اولین نفری باشید که تجربه خود را می‌نویسد.
                  </p>
                ) : (
                  reviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="p-4 sm:p-5 rounded-2xl border border-stone-100 bg-stone-50/60 space-y-2.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-stone-900">{rev.authorName}</span>
                          {rev.isVerifiedPurchase && (
                            <Badge variant="success" className="text-[10px]">
                              <Check className="w-3 h-3" />
                              <span>خریدار تاییدشده</span>
                            </Badge>
                          )}
                        </div>
                        <span className="text-stone-400">{formatJalaliDate(rev.createdAt)}</span>
                      </div>

                      <div className="flex text-amber-500">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < rev.rating ? "fill-current" : "text-stone-200"
                            }`}
                          />
                        ))}
                      </div>

                      <p className="text-xs sm:text-sm text-stone-700 leading-relaxed font-light">
                        {rev.comment}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Related Products */}
        {related.length > 0 && (
          <div className="mt-20 pt-12 border-t border-stone-200/80 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold font-serif text-stone-900">دست‌سازه‌های مرتبط</h3>
                <p className="text-xs text-stone-500 mt-1">آثار دیگری که با همین ظرافت و چوب اصیل خلق شده‌اند</p>
              </div>
              <Link
                href={`/products?category=${product.category?.slug || ""}`}
                className="text-xs font-bold text-amber-900 hover:underline"
              >
                مشاهده همه آثار این گروه ←
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
