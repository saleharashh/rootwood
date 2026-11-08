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
} from "lucide-react";
import { api, type Product, type Review } from "@/lib/api";
import { formatPriceToman, toPersianDigits, formatJalaliDate } from "@/lib/price";
import { useCart } from "@/components/cart-provider";
import { useAuth } from "@/components/auth-provider";
import { useToast } from "@/components/toast-provider";
import { useStoreDialogs } from "@/components/store-dialogs";
import { ProductCard } from "@/components/product-card";

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

  // Review form state
  const [reviewName, setReviewName] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const { addItem, isItemInCart, getItemQuantity } = useCart();
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
          setSelectedWood(data.product.woodType || "گردو");
          setSelectedImage(0);
          setQuantity(1);

          // Fetch reviews
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
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-amber-800/20 border-t-amber-800 rounded-full animate-spin mx-auto" />
          <p className="text-stone-600 text-sm">در حال بارگذاری جزئیات دست‌سازه...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-stone-900 mb-3">محصول یافت نشد</h1>
        <p className="text-stone-600 mb-6">دست‌سازه چوبی مورد نظر شما یافت نشد یا ممکن است نام آن تغییر کرده باشد.</p>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 bg-amber-900 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-amber-800 transition"
        >
          <ArrowRight className="w-4 h-4" />
          بازگشت به فروشگاه
        </Link>
      </div>
    );
  }

  const images = product.images && product.images.length > 0
    ? product.images.map((img) => img.url)
    : [product.imageUrl || "/images/placeholder.jpg"];

  const handleAddToCart = () => {
    if (product.stock < quantity) {
      showToast("موجودی این اثر برای تعداد درخواستی کافی نیست", "error");
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
        // user aborted
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
      showToast(res.message || "دیدگاه شما ثبت شد و پس از بازبینی منتشر می‌شود", "success");
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

  return (
    <div className="bg-stone-50/50 pb-20">
      {/* Breadcrumb */}
      <div className="border-b border-stone-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <nav className="flex items-center gap-2 text-xs sm:text-sm text-stone-500 overflow-x-auto">
            <Link href="/" className="hover:text-amber-900 transition shrink-0">خانه</Link>
            <span>/</span>
            <Link href="/products" className="hover:text-amber-900 transition shrink-0">محصولات</Link>
            {product.category && (
              <>
                <span>/</span>
                <Link
                  href={`/products?category=${product.category.slug}`}
                  className="hover:text-amber-900 transition shrink-0"
                >
                  {product.category.name}
                </Link>
              </>
            )}
            <span>/</span>
            <span className="text-stone-900 font-medium truncate">{product.title}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Gallery - 7 cols */}
          <div className="lg:col-span-7 space-y-4">
            <div className="relative aspect-4/3 rounded-2xl overflow-hidden bg-stone-100 border border-stone-200/80 shadow-sm">
              <img
                src={images[selectedImage] || "/images/placeholder.jpg"}
                alt={product.title}
                className="w-full h-full object-cover transition-all duration-300"
              />
              {product.originalPrice && product.originalPrice > product.price && (
                <div className="absolute top-4 right-4 bg-amber-900 text-amber-50 text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
                  پیشنهاد ویژه کارگاه
                </div>
              )}
              <div className="absolute top-4 left-4 flex gap-2">
                <button
                  onClick={handleShare}
                  aria-label="اشتراک‌گذاری"
                  className="w-9 h-9 rounded-full bg-white/90 backdrop-blur text-stone-700 hover:text-amber-900 flex items-center justify-center shadow-sm hover:scale-105 transition"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 shrink-0 transition ${
                      selectedImage === idx
                        ? "border-amber-900 ring-2 ring-amber-900/20"
                        : "border-stone-200 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img src={img} alt={`${product.title} - تصویر ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info - 5 cols */}
          <div className="lg:col-span-5 flex flex-col">
            <div className="space-y-4 bg-white p-6 sm:p-8 rounded-2xl border border-stone-200/80 shadow-sm">
              {/* Category & Badge */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-amber-900 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200/60">
                  {product.category?.name || "دست‌سازه‌های چوبی"}
                </span>
                <span className="text-xs font-medium text-stone-500">
                  کد اثر: {toPersianDigits(product.id.slice(0, 8))}
                </span>
              </div>

              {/* Title */}
              <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 font-serif leading-tight">
                {product.title}
              </h1>

              {/* Rating & reviews counter */}
              <div className="flex items-center gap-3 text-sm text-stone-600">
                <div className="flex items-center gap-1 text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${i < Math.round(product.rating) ? "fill-current" : "text-stone-300"}`}
                    />
                  ))}
                </div>
                <span className="font-semibold text-stone-800">{toPersianDigits(product.rating.toFixed(1))}</span>
                <span className="text-stone-400">•</span>
                <a href="#reviews" className="text-amber-900 hover:underline">
                  {toPersianDigits(product.reviewsCount)} دیدگاه ثبت‌شده
                </a>
              </div>

              {/* Price block */}
              <div className="py-4 border-y border-stone-100 space-y-1">
                {product.originalPrice && product.originalPrice > product.price && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm line-through text-stone-400">
                      {formatPriceToman(product.originalPrice)}
                    </span>
                    <span className="text-xs font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded">
                      تخفیف هنری
                    </span>
                  </div>
                )}
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-amber-950 font-serif">
                    {formatPriceToman(product.price)}
                  </span>
                </div>
              </div>

              {/* Short description */}
              <p className="text-stone-600 text-sm leading-relaxed">
                {product.shortDescription || product.description?.slice(0, 160)}
              </p>

              {/* Wood selection info */}
              <div className="space-y-2 pt-2">
                <label className="text-xs font-semibold text-stone-700 block">
                  گونه چوب طبیعی این اثر:
                </label>
                <div className="flex flex-wrap gap-2">
                  {["چوب گردو سیاه", "چوب راش گرجستان", "چوب بلوط جنگلی", "چوب چنار کهنسال"].map((wood) => {
                    const isSelected = selectedWood.includes(wood.split(" ")[1]) || selectedWood === wood;
                    return (
                      <button
                        type="button"
                        key={wood}
                        onClick={() => setSelectedWood(wood)}
                        className={`text-xs px-3 py-2 rounded-xl border transition ${
                          isSelected
                            ? "border-amber-900 bg-amber-900/10 text-amber-950 font-semibold ring-1 ring-amber-900"
                            : "border-stone-200 text-stone-700 hover:bg-stone-50"
                        }`}
                      >
                        {wood}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Stock status & Add to cart */}
              <div className="pt-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-stone-700">وضعیت موجودی در کارگاه:</span>
                  {product.stock > 0 ? (
                    <span className="text-emerald-700 font-medium flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      موجود در انبار ({toPersianDigits(product.stock)} عدد)
                    </span>
                  ) : (
                    <span className="text-red-600 font-medium">سفارشی‌ساخت (عدم موجودی آماده)</span>
                  )}
                </div>

                <div className="flex gap-3 items-center">
                  {/* Quantity selector */}
                  <div className="flex items-center border border-stone-200 rounded-xl bg-stone-50 p-1">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1 || isOutOfStock}
                      aria-label="کاهش تعداد"
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white text-stone-600 disabled:opacity-40 transition"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-10 text-center font-bold text-sm text-stone-800">
                      {toPersianDigits(quantity)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                      disabled={quantity >= product.stock || isOutOfStock}
                      aria-label="افزایش تعداد"
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white text-stone-600 disabled:opacity-40 transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Add to Cart Button */}
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    disabled={isOutOfStock}
                    className="flex-1 bg-amber-900 hover:bg-amber-800 text-white font-semibold py-3 px-6 rounded-xl shadow-sm hover:shadow transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
                  >
                    {isOutOfStock
                      ? "ناموجود"
                      : currentCartQty > 0
                      ? `افزودن مجدد (${toPersianDigits(currentCartQty)} در سبد)`
                      : "افزودن به سبد خرید"}
                  </button>
                </div>
              </div>

              {/* Atelier Trust Badges */}
              <div className="pt-6 border-t border-stone-100 grid grid-cols-2 gap-3 text-xs text-stone-600">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-800 shrink-0" />
                  <span>ضمانت ۲ ساله اتصالات چوبی</span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-amber-800 shrink-0" />
                  <span>ارسال ایمن با بسته‌بندی مقاوم</span>
                </div>
                <div className="flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-amber-800 shrink-0" />
                  <span>۷ روز مهلت بازگشت بی قید و شرط</span>
                </div>
                <div className="flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-amber-800 shrink-0" />
                  <span>فینیش روغن گیاهی طبیعی بدون سرب</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Specifications & Craft Details */}
        <div className="mt-14 grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-8">
            {/* Story / Full description */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-stone-200/80 shadow-sm space-y-4">
              <h2 className="text-xl font-bold text-stone-900 font-serif">داستان و مشخصات اثر</h2>
              <div className="text-stone-700 leading-relaxed space-y-4 whitespace-pre-line text-sm sm:text-base">
                {product.description || product.shortDescription}
              </div>
            </div>

            {/* Specifications table */}
            {product.specs && Object.keys(product.specs).length > 0 && (
              <div className="bg-white p-6 sm:p-8 rounded-2xl border border-stone-200/80 shadow-sm space-y-4">
                <h3 className="text-lg font-bold text-stone-900 font-serif">شناسنامه فنی</h3>
                <div className="divide-y divide-stone-100 text-sm">
                  {Object.entries(product.specs).map(([k, v]) => (
                    <div key={k} className="py-2.5 flex justify-between items-center">
                      <span className="text-stone-500 font-medium">{k}</span>
                      <span className="text-stone-900 font-semibold">{String(v)}</span>
                    </div>
                  ))}
                  {product.dimensions && (
                    <div className="py-2.5 flex justify-between items-center">
                      <span className="text-stone-500 font-medium">ابعاد (طول × عرض × ارتفاع)</span>
                      <span className="text-stone-900 font-semibold">{product.dimensions}</span>
                    </div>
                  )}
                  {product.weight && (
                    <div className="py-2.5 flex justify-between items-center">
                      <span className="text-stone-500 font-medium">وزن تقریبی</span>
                      <span className="text-stone-900 font-semibold">{product.weight}</span>
                    </div>
                  )}
                  <div className="py-2.5 flex justify-between items-center">
                    <span className="text-stone-500 font-medium">گونه چوب پایه</span>
                    <span className="text-stone-900 font-semibold">{product.woodType || "گردو طبیعی"}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Reviews Section */}
            <div id="reviews" className="bg-white p-6 sm:p-8 rounded-2xl border border-stone-200/80 shadow-sm space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-stone-900 font-serif">دیدگاه خریداران و علاقه‌مندان</h3>
                  <p className="text-xs text-stone-500 mt-0.5">تجربه واقعی مشتریان از لمس و نگهداری این اثر</p>
                </div>
                <div className="flex items-center gap-1.5 text-amber-500 font-bold text-lg">
                  <Star className="w-5 h-5 fill-current" />
                  <span>{toPersianDigits(product.rating.toFixed(1))}</span>
                  <span className="text-xs text-stone-400 font-normal">از ۵</span>
                </div>
              </div>

              {/* Review Form */}
              <form onSubmit={handleReviewSubmit} className="bg-stone-50 p-5 rounded-xl border border-stone-200/80 space-y-4">
                <h4 className="text-sm font-bold text-stone-800">دیدگاه خود را درباره این دست‌سازه بنویسید</h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-stone-700 block mb-1">نام شما</label>
                    <input
                      type="text"
                      value={reviewName}
                      onChange={(e) => setReviewName(e.target.value)}
                      placeholder={user ? user.name : "مثال: علی احمدی"}
                      className="w-full text-sm px-3 py-2 bg-white rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-900/20 focus:border-amber-900"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-stone-700 block mb-1">امتیاز به کیفیت ساخت</label>
                    <div className="flex items-center gap-2 pt-1.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          type="button"
                          key={star}
                          onClick={() => setReviewRating(star)}
                          className="focus:outline-none"
                        >
                          <Star
                            className={`w-6 h-6 transition ${
                              star <= reviewRating ? "text-amber-500 fill-amber-500" : "text-stone-300"
                            }`}
                          />
                        </button>
                      ))}
                      <span className="text-xs text-stone-500 mr-2">
                        {toPersianDigits(reviewRating)} ستاره
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-stone-700 block mb-1">متن دیدگاه</label>
                  <textarea
                    rows={3}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="کیفیت سمباده‌کاری، رگه‌های چوب، نحوه بسته‌بندی یا تجربه شما از این اثر..."
                    required
                    className="w-full text-sm px-3 py-2 bg-white rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-900/20 focus:border-amber-900"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <p className="text-xs text-stone-500">
                    دیدگاه‌ها پس از تأیید تیم کارگاه برای عموم نمایش داده می‌شوند.
                  </p>
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="bg-amber-900 text-white text-xs font-semibold px-5 py-2.5 rounded-lg hover:bg-amber-800 transition disabled:opacity-50"
                  >
                    {submittingReview ? "در حال ارسال..." : "ثبت دیدگاه"}
                  </button>
                </div>
              </form>

              {/* Reviews List */}
              <div className="space-y-4">
                {reviews.length === 0 ? (
                  <p className="text-sm text-stone-500 text-center py-6">
                    هنوز دیدگاهی برای این اثر ثبت نشده است. اولین نفری باشید که تجربه خود را می‌نویسد.
                  </p>
                ) : (
                  reviews.map((rev) => (
                    <div key={rev.id} className="p-4 rounded-xl border border-stone-100 bg-stone-50/50 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-stone-800">{rev.authorName}</span>
                          {rev.isVerifiedPurchase && (
                            <span className="inline-flex items-center gap-0.5 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px] font-medium border border-emerald-200">
                              <Check className="w-3 h-3" /> خریدار تایید شده
                            </span>
                          )}
                        </div>
                        <span className="text-stone-400">{formatJalaliDate(rev.createdAt)}</span>
                      </div>
                      <div className="flex text-amber-500">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${i < rev.rating ? "fill-current" : "text-stone-200"}`}
                          />
                        ))}
                      </div>
                      <p className="text-sm text-stone-700 leading-relaxed">{rev.comment}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Sidebar / Care guide - 4 cols */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-amber-950 text-amber-50 p-6 rounded-2xl space-y-4 shadow-sm">
              <h3 className="text-lg font-bold font-serif text-amber-100">راهنمای نگهداری چوب طبیعی</h3>
              <ul className="text-xs sm:text-sm text-amber-200/90 space-y-2.5 leading-relaxed">
                <li className="flex gap-2">
                  <span className="text-amber-400 font-bold">•</span>
                  از تابش مستقیم و طولانی‌مدت آفتاب بر سطح چوب پرهیز نمایید.
                </li>
                <li className="flex gap-2">
                  <span className="text-amber-400 font-bold">•</span>
                  برای گردگیری تنها از پارچه پنبه‌ای نرم و نیمه‌مرطوب استفاده کنید.
                </li>
                <li className="flex gap-2">
                  <span className="text-amber-400 font-bold">•</span>
                  هر ۶ ماه یک‌بار سطح چوب را با روغن مخصوص گردو یا واکس طبیعی تغذیه کنید.
                </li>
                <li className="flex gap-2">
                  <span className="text-amber-400 font-bold">•</span>
                  از قرار دادن ظروف داغ بدون زیرلیوانی چوبی روی سطح خودداری کنید.
                </li>
              </ul>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-sm space-y-3">
              <h4 className="text-sm font-bold text-stone-800">سفارش ابعاد اختصاصی</h4>
              <p className="text-xs text-stone-600 leading-relaxed">
                آیا این مدل را با گونه چوب دیگر یا ابعاد منطبق بر فضای خانه خود می‌خواهید؟ ما آماده ساخت سفارش‌های اختصاصی شما در کارگاه هستیم.
              </p>
              <Link
                href="/contact"
                className="inline-block text-xs font-semibold text-amber-900 hover:text-amber-700 underline"
              >
                ثبت درخواست سفارش اختصاصی ←
              </Link>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {related.length > 0 && (
          <div className="mt-16 pt-12 border-t border-stone-200 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-stone-900 font-serif">دست‌سازه‌های مرتبط</h3>
                <p className="text-xs text-stone-500 mt-1">آثار دیگری که با همین دقت و ظرافت خلق شده‌اند</p>
              </div>
              <Link
                href={`/products?category=${product.category?.slug || ""}`}
                className="text-xs font-semibold text-amber-900 hover:underline"
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
