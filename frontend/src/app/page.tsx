"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import PhotoCarousel from "@/components/PhotoCarousel";

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navbar />

      {/* Hero / Carousel */}
      <section className="pt-16">
        <PhotoCarousel />
      </section>

      {/* Memorial Text */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-16 md:py-24 text-center">
        <h1 className="text-3xl md:text-5xl mb-8 leading-relaxed"
            style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-primary)' }}>
          In Loving Memory of Philip J.K. Lau / 永遠的老爸
        </h1>
        <div className="w-16 h-px mx-auto mb-8" style={{ backgroundColor: 'var(--color-primary)', opacity: 0.4 }} />
        <p className="text-base md:text-lg leading-loose mb-6"
           style={{ fontFamily: 'var(--font-body)', color: 'var(--color-text-dark)' }}>
          大家的老哥、老爸：<br />
          你爽朗的笑容，如日中的太陽，照耀並溫暖了我們。<br />
          你無私分享走遍世界的足跡，使我們嚮往出世界的美好，<br />
          你在信仰中的堅守，使我們知道人生的本質，<br />
          你對每個人的關愛，使我們知道如何付出愛。<br />
          與你的回憶歷歷在目，然而卻也只剩下回憶，<br />
          謝謝你，陪伴過我們的那些春夏秋冬，<br />
          謝謝你，遮蔽過我們的那些風吹雨打，<br />
          謝謝你，謝謝你......<br />
          如今你已啟航而去，我們亦將繼續前行，<br />
          盼望，使我們知道終將再見，<br />
          再見，再見，永遠愛你、思念你。<br />
        </p>
        <p className="text-base md:text-lg leading-loose mb-6"
           style={{ fontFamily: 'var(--font-body)', color: 'var(--color-text-dark)' }}>
          這個空間留給所有認識你、愛你的人，
          能夠一同追思與紀念。每一張照片、每一段文字，
          都是我們對你深深的愛與想念。
        </p>
        <blockquote className="mt-12 text-xl md:text-2xl italic leading-relaxed"
                    style={{ fontFamily: 'var(--font-accent)', color: '#8B6F4E' }}>
          「如今常存的有信，有望，有愛，其中最大的是愛。」
        </blockquote>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-20 backdrop-blur-sm"
               style={{ backgroundColor: 'rgba(169, 201, 156, 0.12)' }}>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl md:text-3xl mb-4"
              style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-primary)' }}>
            留下您的祝福
          </h2>
          <p className="mb-8 text-sm md:text-base"
             style={{ fontFamily: 'var(--font-body)', color: '#6B5E50' }}>
            分享您與父親的故事，留下一張珍貴的照片，讓思念化作紙飛機飛向天際。
          </p>
          <Link
            href="/condolence"
            className="inline-block text-white text-sm px-8 py-3 rounded-full transition-all duration-300 hover:shadow-lg hover:scale-105"
            style={{
              fontFamily: 'var(--font-body)',
              backgroundColor: 'var(--color-primary)',
            }}
          >
            前往留言
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 backdrop-blur-sm"
              style={{ backgroundColor: 'rgba(51, 51, 51, 0.85)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-xs" style={{ fontFamily: 'var(--font-body)', color: 'var(--color-primary)', opacity: 0.8 }}>
            永恆的思念 — 紀念父親
          </p>
        </div>
      </footer>
    </main>
  );
}
