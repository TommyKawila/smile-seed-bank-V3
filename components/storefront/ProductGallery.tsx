"use client"

import * as React from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import {
  buildDetailGalleryUrls,
  resolveDetailHeroUrl,
} from "@/lib/product-gallery-utils"
import { shouldOffloadImageOptimization } from "@/lib/vercel-image-offload"

type GalleryItem = { src: string; alt: string; badge?: string }

type ProductGalleryProduct = {
  image_urls?: unknown
  image_url?: string | null
  image_url_2?: string | null
  image_url_3?: string | null
  image_url_4?: string | null
  image_url_5?: string | null
  product_images?: unknown
  name: string
}

function distance(
  t0: { clientX: number; clientY: number },
  t1: { clientX: number; clientY: number }
) {
  const dx = t0.clientX - t1.clientX
  const dy = t0.clientY - t1.clientY
  return Math.hypot(dx, dy) || 1
}

function Lightbox({
  open,
  onOpenChange,
  images,
  startIndex,
  name,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  images: readonly GalleryItem[]
  startIndex: number
  name: string
}) {
  const [index, setIndex] = React.useState(startIndex)
  const [scale, setScale] = React.useState(1)
  const [translate, setTranslate] = React.useState({ x: 0, y: 0 })
  const pinch0 = React.useRef<{ d: number; s: number } | null>(null)
  const swipe0 = React.useRef<number | null>(null)
  const pan0 = React.useRef<{ x: number; y: number; tx: number; ty: number } | null>(null)

  React.useEffect(() => {
    if (open) {
      setIndex(startIndex)
      setScale(1)
      setTranslate({ x: 0, y: 0 })
    }
  }, [open, startIndex])

  const safeIndex = (i: number) => Math.max(0, Math.min(images.length - 1, i))

  const go = (d: -1 | 1) => {
    setIndex((i) => safeIndex(i + d))
    setScale(1)
    setTranslate({ x: 0, y: 0 })
  }

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      pinch0.current = {
        d: distance(
          e.touches[0] as unknown as { clientX: number; clientY: number },
          e.touches[1] as unknown as { clientX: number; clientY: number }
        ),
        s: scale,
      }
      swipe0.current = null
      pan0.current = null
    } else if (e.touches.length === 1) {
      pinch0.current = null
      const x = e.touches[0].clientX
      if (scale > 1) {
        pan0.current = { x, y: e.touches[0].clientY, tx: translate.x, ty: translate.y }
        swipe0.current = null
      } else {
        swipe0.current = x
        pan0.current = null
      }
    }
  }

  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinch0.current) {
      e.preventDefault()
      const d = distance(
        e.touches[0] as unknown as { clientX: number; clientY: number },
        e.touches[1] as unknown as { clientX: number; clientY: number }
      )
      const { d: d0, s: s0 } = pinch0.current
      setScale(Math.min(4, Math.max(1, (s0 * d) / d0)))
      return
    }
    if (e.touches.length === 1 && pan0.current && scale > 1) {
      e.preventDefault()
      const t = e.touches[0]
      setTranslate({
        x: pan0.current.tx + (t.clientX - pan0.current.x),
        y: pan0.current.ty + (t.clientY - pan0.current.y),
      })
    }
  }

  const onTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length < 2) pinch0.current = null
    if (e.touches.length > 0) return
    pan0.current = null
    if (scale === 1 && swipe0.current != null) {
      const x = e.changedTouches[0]?.clientX ?? 0
      const dx = x - swipe0.current
      if (Math.abs(dx) > 48) {
        if (dx < 0) go(1)
        else go(-1)
      }
    }
    swipe0.current = null
  }

  if (!images.length) return null
  const current = images[index]!

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="fixed left-0 top-0 z-[200] m-0 flex h-dvh w-full max-w-none translate-x-0 translate-y-0 flex-col border-0 bg-black p-0 data-[state=open]:zoom-in-100 data-[state=closed]:zoom-out-100 [&>button.absolute]:hidden"
        onOpenAutoFocus={(ev) => ev.preventDefault()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-white/10 bg-black/90 px-3 py-2">
          <p className="max-w-[70%] truncate text-sm text-white" title={name}>
            {name}
          </p>
          <div className="flex items-center gap-1">
            <span className="text-xs text-zinc-400">
              {index + 1}/{images.length}
            </span>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-10 w-10 text-white hover:bg-white/10"
              onClick={() => onOpenChange(false)}
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
        <div
          className="relative flex min-h-0 flex-1"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          style={{ touchAction: "none" }}
        >
          {images.length > 1 && (
            <button
              type="button"
              onClick={() => go(-1)}
              className="absolute left-1 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white md:left-2"
              aria-label="ก่อนหน้า"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}
          <div className="flex flex-1 items-center justify-center overflow-hidden">
            <div
              className="relative h-full w-full"
              style={{
                transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
                transformOrigin: "center center",
              }}
            >
              <Image
                key={index}
                src={current.src}
                alt={current.alt}
                fill
                className="object-contain"
                loading="lazy"
                sizes="100vw"
                quality={100}
                unoptimized={shouldOffloadImageOptimization(current.src)}
              />
            </div>
          </div>
          {images.length > 1 && (
            <button
              type="button"
              onClick={() => go(1)}
              className="absolute right-1 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white md:right-2"
              aria-label="ถัดไป"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          )}
        </div>
        {images.length > 1 && (
          <div className="shrink-0 border-t border-white/10 bg-black/90 p-2">
            <div className="no-scrollbar flex gap-2 overflow-x-auto px-1">
              {images.map((g, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setIndex(i)
                    setScale(1)
                    setTranslate({ x: 0, y: 0 })
                  }}
                  className={cn(
                    "relative h-16 w-16 shrink-0 overflow-hidden rounded-md border-2",
                    i === index ? "border-amber-400" : "border-transparent opacity-60"
                  )}
                >
                  <Image
                    src={g.src}
                    alt=""
                    width={64}
                    height={64}
                    className="h-full w-full object-cover"
                    unoptimized={shouldOffloadImageOptimization(g.src)}
                  />
                </button>
              ))}
            </div>
          </div>
        )}
        <p className="shrink-0 bg-black/90 px-3 pb-3 text-center text-xs text-zinc-500">
          ลากเพื่อเปลี่ยนรูป · นิ้วสองนิ้วเพื่อซูม
        </p>
      </DialogContent>
    </Dialog>
  )
}

export function ProductGallery({
  product,
  selectedVariantId,
  showAggregateSoldOut = false,
  soldOutLabel,
}: {
  product: ProductGalleryProduct
  selectedVariantId: number | null
  /** Same as catalog: `products.stock` aggregate ≤ 0 */
  showAggregateSoldOut?: boolean
  soldOutLabel?: string
}) {
  const images = React.useMemo(
    () => buildDetailGalleryUrls(product, selectedVariantId),
    [product, selectedVariantId]
  )
  const defaultHero = React.useMemo(
    () => resolveDetailHeroUrl(product, selectedVariantId),
    [product, selectedVariantId]
  )

  const gallery: GalleryItem[] = React.useMemo(
    () =>
      images.map((src, i) => ({
        src,
        alt: `${product.name} — ${i + 1}`,
      })),
    [images, product.name]
  )

  const [selected, setSelected] = React.useState(0)
  const [lightbox, setLightbox] = React.useState(false)

  React.useEffect(() => {
    const i = defaultHero ? images.indexOf(defaultHero) : 0
    setSelected(i >= 0 ? i : 0)
  }, [defaultHero, images, selectedVariantId])

  if (!gallery.length) {
    return (
      <div className="flex max-h-[min(60vw,250px)] min-h-[200px] items-center justify-center rounded-sm bg-zinc-50 aspect-square md:max-h-none">
        <div className="p-4 text-center text-sm text-zinc-400">No image</div>
      </div>
    )
  }

  const hasMultiple = gallery.length > 1
  const current = gallery[selected] ?? gallery[0]!

  return (
    <div>
      <div
        className="relative w-full max-h-[min(60vw,250px)] aspect-square cursor-zoom-in overflow-hidden rounded-sm bg-zinc-50 md:max-h-none"
        role="button"
        tabIndex={0}
        onClick={() => setLightbox(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            setLightbox(true)
          }
        }}
        aria-label="เปิดดูรูปเต็มหน้าจอ"
      >
        {hasMultiple && (
          <span className="absolute left-2 top-2 z-10 rounded-full bg-black/40 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur-sm">
            {selected + 1} / {gallery.length}
          </span>
        )}
        <div className="absolute inset-0 z-[1]">
          <Image
            src={current.src}
            alt={current.alt}
            fill
            priority={selected === 0}
            fetchPriority={selected === 0 ? "high" : "auto"}
            loading={selected === 0 ? "eager" : "lazy"}
            sizes="(max-width: 767px) 100vw, (max-width: 1024px) 50vw, 42vw"
            className={cn(
              "object-contain p-1 sm:p-2",
              showAggregateSoldOut && "brightness-75 grayscale"
            )}
            quality={100}
            unoptimized={shouldOffloadImageOptimization(current.src)}
          />
        </div>
        {showAggregateSoldOut && soldOutLabel ? (
          <div
            className="pointer-events-none absolute inset-0 z-[12] flex items-center justify-center bg-zinc-950/35 p-3 font-sans"
            aria-hidden
          >
            <div className="w-full max-w-[min(92%,15rem)] rounded-md border border-zinc-400/80 bg-zinc-900/95 px-3 py-2.5 text-center shadow-lg ring-1 ring-black/20">
              <p className="text-[11px] font-extrabold leading-tight text-white sm:text-xs">{soldOutLabel}</p>
            </div>
          </div>
        ) : null}
        {hasMultiple && (
          <div className="absolute bottom-1 right-1 z-20 flex h-6 items-center justify-center gap-0.5 rounded border border-amber-500/20 bg-amber-500/5 px-1 text-[0.5rem]">
            {gallery.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setSelected(i)
                }}
                className={cn(
                  "h-3 w-3 rounded border transition-all",
                  selected === i
                    ? "border-amber-500 ring-1 ring-amber-300"
                    : "border-amber-500/20 opacity-30 hover:opacity-60"
                )}
                aria-label={`รูปที่ ${i + 1}`}
              />
            ))}
          </div>
        )}
        <div
          className="pointer-events-none absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-[10px] text-white/90 md:text-xs"
          aria-hidden
        >
          <ZoomIn className="h-3 w-3" />
          แตะเพื่อขยาย
        </div>
      </div>

      {hasMultiple && (
        <div className="no-scrollbar mt-2 flex w-full max-w-sm gap-2 overflow-x-auto px-0 sm:pr-0 mx-auto">
          {gallery.map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setSelected(i)}
              className={cn(
                "group relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border-2",
                selected === i
                  ? "border-amber-500"
                  : "border-amber-500/20 opacity-30 hover:opacity-60"
              )}
            >
              <Image
                src={img.src}
                alt={img.alt}
                fill
                className="object-contain p-0.5"
                sizes="100px"
                loading="lazy"
                unoptimized={shouldOffloadImageOptimization(img.src)}
              />
            </button>
          ))}
        </div>
      )}

      <Lightbox
        open={lightbox}
        onOpenChange={setLightbox}
        images={gallery}
        startIndex={selected}
        name={product.name}
      />
    </div>
  )
}
