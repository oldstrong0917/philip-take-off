"use client";

import { useQuery } from "@apollo/client/react";
import { GET_PHOTOS } from "@/graphql/queries";
import Navbar from "@/components/Navbar";

interface Condolence {
  id: string;
  photoUrl: string;
  photoWidth: number;
  photoHeight: number;
  relationship: string;
  message: string;
  isPinned: boolean;
  createdAt: string;
}

export default function MessagesPage() {
  const { data, loading, error } = useQuery<{ photos: Condolence[] }>(
    GET_PHOTOS
  );

  const condolences = data?.photos || [];

  return (
    <main className="min-h-screen bg-stone-50">
      <Navbar />

      <section className="pt-24 pb-16 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <h1
            className="text-3xl md:text-4xl text-center mb-4"
            style={{
              fontFamily: "var(--font-heading)",
              color: "var(--color-primary)",
            }}
          >
            所有留言
          </h1>
          <p
            className="text-center text-sm md:text-base mb-12"
            style={{
              fontFamily: "var(--font-body)",
              color: "#6B5E50",
            }}
          >
            每一段文字，都是對父親深深的愛與想念
          </p>

          {loading && (
            <div className="flex items-center justify-center py-24">
              <div className="animate-pulse text-stone-400 font-serif text-lg">
                載入中...
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center py-24">
              <p className="text-stone-500 font-sans text-sm text-center px-4">
                暫時無法載入留言，請稍後再試
              </p>
            </div>
          )}

          {!loading && condolences.length === 0 && (
            <div className="flex items-center justify-center py-24">
              <p className="text-stone-400 font-serif text-lg">
                尚無公開留言
              </p>
            </div>
          )}

          <div className="space-y-8">
            {condolences.map((c) => (
              <div
                key={c.id}
                className={`bg-white rounded-2xl shadow-md overflow-hidden transition-all ${
                  c.isPinned ? "ring-2 ring-amber-300" : ""
                }`}
              >
                {c.isPinned && (
                  <div className="bg-amber-50 px-5 py-2 flex items-center gap-2 border-b border-amber-100">
                    <svg
                      className="w-4 h-4 text-amber-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                    </svg>
                    <span className="text-xs text-amber-700 font-sans font-medium">
                      置頂留言
                    </span>
                  </div>
                )}

                <div className="md:flex">
                  <div className="md:w-80 shrink-0 bg-stone-100">
                    <img
                      src={c.photoUrl}
                      alt={`來自${c.relationship}的照片`}
                      className="w-full h-64 md:h-full object-cover"
                      loading="lazy"
                    />
                  </div>

                  <div className="flex-1 px-6 py-5 flex flex-col justify-between">
                    <p
                      className="text-stone-700 text-sm md:text-base leading-relaxed whitespace-pre-wrap"
                      style={{ fontFamily: "var(--font-body)" }}
                    >
                      {c.message}
                    </p>

                    <div className="mt-6 flex items-end justify-between">
                      <span className="text-xs text-stone-400 font-sans">
                        {new Date(c.createdAt).toLocaleDateString("zh-TW", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                      <span
                        className="text-sm text-stone-600"
                        style={{ fontFamily: "var(--font-body)" }}
                      >
                        — {c.relationship}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer
        className="py-8 backdrop-blur-sm"
        style={{ backgroundColor: "rgba(51, 51, 51, 0.85)" }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <p
            className="text-xs"
            style={{
              fontFamily: "var(--font-body)",
              color: "var(--color-primary)",
              opacity: 0.8,
            }}
          >
            永恆的思念 — 紀念父親
          </p>
        </div>
      </footer>
    </main>
  );
}
