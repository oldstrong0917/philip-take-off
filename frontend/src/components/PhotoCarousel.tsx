"use client";

import { useQuery } from "@apollo/client/react";
import { useRef, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation, Pagination } from "swiper/modules";
import { GET_PHOTOS } from "@/graphql/queries";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

interface Photo {
  id: string;
  photoUrl: string | null;
  photoWidth: number | null;
  photoHeight: number | null;
  name: string;
  relationship: string | null;
  message: string;
  isPinned: boolean;
  createdAt: string;
}

const URL_REFRESH_INTERVAL = 45 * 60 * 1000;

export default function PhotoCarousel() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [stablePhotos, setStablePhotos] = useState<Photo[]>([]);
  const urlCacheRef = useRef<Map<string, string | null>>(new Map());
  const lastFullRefreshRef = useRef(0);
  const initialLoadDoneRef = useRef(false);

  useEffect(() => setMounted(true), []);

  const { data, loading, error } = useQuery<{ photos: Photo[] }>(GET_PHOTOS, {
    pollInterval: 15000,
    errorPolicy: "all",
  });

  useEffect(() => {
    if (!data?.photos) return;

    const incoming = data.photos;
    const now = Date.now();
    const needsFullRefresh =
      !initialLoadDoneRef.current ||
      now - lastFullRefreshRef.current > URL_REFRESH_INTERVAL;

    if (needsFullRefresh) {
      const cache = new Map<string, string | null>();
      incoming.forEach((p) => cache.set(p.id, p.photoUrl));
      urlCacheRef.current = cache;
      setStablePhotos(incoming);
      lastFullRefreshRef.current = now;
      initialLoadDoneRef.current = true;
      return;
    }

    const incomingIds = new Set(incoming.map((p) => p.id));

    for (const cachedId of Array.from(urlCacheRef.current.keys())) {
      if (!incomingIds.has(cachedId)) {
        urlCacheRef.current.delete(cachedId);
      }
    }

    const orderedWithStableUrls = incoming.map((photo) => {
      const cachedUrl = urlCacheRef.current.get(photo.id);
      if (cachedUrl === undefined) {
        urlCacheRef.current.set(photo.id, photo.photoUrl);
        return photo;
      }
      return { ...photo, photoUrl: cachedUrl };
    });

    setStablePhotos(orderedWithStableUrls);
  }, [data]);

  if (!mounted || (loading && !initialLoadDoneRef.current)) {
    return (
      <div className="w-full py-24 flex items-center justify-center">
        <div className="animate-pulse text-stone-400 font-serif text-lg">
          載入照片中...
        </div>
      </div>
    );
  }

  if (error && !initialLoadDoneRef.current) {
    return (
      <div className="w-full py-24 flex items-center justify-center">
        <p className="text-stone-500 font-sans text-sm text-center px-4">
          暫時無法載入照片（請確認後端已啟動於 port 4000）
        </p>
      </div>
    );
  }

  if (stablePhotos.length === 0) {
    return (
      <div className="w-full py-24 flex items-center justify-center">
        <p className="text-stone-400 font-serif text-lg">
          尚無照片，成為第一位留下回憶的人
        </p>
      </div>
    );
  }

  const count = stablePhotos.length;

  return (
    <div className="w-full py-10 md:py-16 overflow-hidden">
      <Swiper
        key={count}
        modules={[Autoplay, Navigation, Pagination]}
        autoplay={{ delay: 3000, disableOnInteraction: false, pauseOnMouseEnter: true }}
        navigation
        pagination={{ clickable: true }}
        centeredSlides
        slidesPerView={1.2}
        spaceBetween={20}
        rewind
        speed={600}
        grabCursor
        className="memorial-swiper"
      >
        {stablePhotos.map((photo) => {
          const displayName =
            photo.name?.trim() || photo.relationship?.trim() || "未具名";
          const hasPhoto = !!photo.photoUrl;

          return (
            <SwiperSlide key={photo.id}>
              <div
                className="carousel-card bg-white rounded-2xl shadow-xl overflow-hidden transition-all duration-500 mx-auto max-w-[600px] cursor-pointer hover:shadow-2xl"
                onClick={() => router.push("/messages")}
              >
                {hasPhoto ? (
                  <>
                    <div className="aspect-[4/3] overflow-hidden bg-stone-100">
                      <img
                        src={photo.photoUrl || ""}
                        alt={`來自${displayName}的照片`}
                        className="w-full h-full object-contain bg-stone-100"
                        loading="lazy"
                      />
                    </div>
                    <div className="px-5 pt-4 pb-5 min-h-[120px] flex flex-col justify-between">
                      <p className="text-stone-700 text-sm font-sans leading-relaxed line-clamp-3">
                        {photo.message}
                      </p>
                      <p className="text-stone-500 text-xs font-sans text-right mt-3">
                        — {displayName}
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="px-6 py-7 min-h-[360px] flex flex-col justify-between">
                    <p className="text-stone-700 text-base font-sans leading-relaxed whitespace-pre-wrap line-clamp-[9]">
                      {photo.message}
                    </p>
                    <p className="text-stone-500 text-sm font-sans text-right mt-6">
                      — {displayName}
                    </p>
                  </div>
                )}
              </div>
            </SwiperSlide>
          );
        })}
      </Swiper>
    </div>
  );
}
