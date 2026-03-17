"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

interface Props {
  imageUrl: string;
  message: string;
  onComplete: () => void;
}

export default function PaperAirplaneAnimation({
  imageUrl,
  message,
  onComplete,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const frontRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLDivElement>(null);
  const textOverlayRef = useRef<HTMLDivElement>(null);
  const airplaneRef = useRef<HTMLDivElement>(null);
  const finalTextRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<
    "writing" | "folding" | "flying" | "fadeout" | "final"
  >("writing");

  useEffect(() => {
    if (!containerRef.current) return;

    const tl = gsap.timeline({
      onComplete: () => {
        setTimeout(onComplete, 4000);
      },
    });

    // Phase 1: Show photo, then flip to reveal text being written on the back
    tl.fromTo(
      cardRef.current,
      { opacity: 0, scale: 0.8 },
      { opacity: 1, scale: 1, duration: 0.8, ease: "power2.out" }
    );

    // Flip the card to show the back
    tl.to(cardRef.current, {
      rotateY: 180,
      duration: 1,
      ease: "power2.inOut",
      delay: 1,
    });

    // Typewriter effect on the text
    tl.call(() => setPhase("writing"));
    tl.fromTo(
      textOverlayRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.3 }
    );

    // Animate each character appearing
    tl.to(textOverlayRef.current, {
      duration: 2,
      ease: "none",
      onUpdate: function () {
        if (!textOverlayRef.current) return;
        const progress = this.progress();
        const visibleChars = Math.floor(progress * message.length);
        textOverlayRef.current.textContent = message.substring(
          0,
          visibleChars
        );
      },
    });

    tl.addLabel("textComplete");

    // Phase 2: Fold into paper airplane
    tl.call(() => setPhase("folding"), [], "textComplete+=1");

    // Fold animation - simulate paper airplane folding with CSS transforms
    // Step 1: Fold in half horizontally
    tl.to(cardRef.current, {
      scaleX: 0.7,
      scaleY: 0.9,
      duration: 0.5,
      ease: "power2.in",
    });

    // Step 2: Create triangular fold effect
    tl.to(cardRef.current, {
      rotateX: 15,
      rotateZ: -5,
      scaleX: 0.5,
      scaleY: 0.8,
      duration: 0.5,
      ease: "power2.inOut",
    });

    // Step 3: Further narrow to airplane shape
    tl.to(cardRef.current, {
      scaleX: 0.3,
      scaleY: 0.6,
      rotateZ: -15,
      duration: 0.4,
      ease: "power2.inOut",
    });

    // Replace card with airplane shape
    tl.call(() => setPhase("flying"));

    // Hide card, show airplane
    tl.set(cardRef.current, { opacity: 0 });
    tl.fromTo(
      airplaneRef.current,
      { opacity: 0, scale: 0.5 },
      { opacity: 1, scale: 1, duration: 0.3, ease: "power2.out" }
    );

    // Phase 3: Fly away animation
    tl.to(airplaneRef.current, {
      y: -window.innerHeight * 1.5,
      x: window.innerWidth * 0.3,
      rotation: -30,
      scale: 0.2,
      opacity: 0,
      duration: 2,
      ease: "power2.in",
    });

    // Phase 4: Fade to white
    tl.call(() => setPhase("fadeout"));
    tl.to(containerRef.current, {
      backgroundColor: "rgba(255, 255, 255, 1)",
      duration: 1,
      ease: "power2.inOut",
    });

    // Phase 5: Final text
    tl.call(() => setPhase("final"));
    tl.fromTo(
      finalTextRef.current,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 1.5, ease: "power2.out" }
    );

    return () => {
      tl.kill();
    };
  }, [message, onComplete]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-900/95 overflow-hidden"
    >
      {/* Photo card with flip effect */}
      {(phase === "writing" || phase === "folding") && (
        <div
          ref={cardRef}
          className="animation-container relative"
          style={{
            width: "min(80vw, 400px)",
            height: "min(80vw, 400px)",
            transformStyle: "preserve-3d",
          }}
        >
          {/* Front - Photo */}
          <div
            ref={frontRef}
            className="absolute inset-0 rounded-lg overflow-hidden shadow-2xl"
            style={{ backfaceVisibility: "hidden" }}
          >
            <img
              src={imageUrl}
              alt="uploaded photo"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Back - Text */}
          <div
            ref={backRef}
            className="absolute inset-0 bg-amber-50 rounded-lg shadow-2xl flex items-center justify-center p-8"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            {/* Lined paper effect */}
            <div className="absolute inset-0 opacity-20">
              {Array.from({ length: 15 }).map((_, i) => (
                <div
                  key={i}
                  className="border-b border-blue-300"
                  style={{ marginTop: i === 0 ? "40px" : "24px" }}
                />
              ))}
            </div>

            <div
              ref={textOverlayRef}
              className="relative z-10 font-serif text-stone-700 text-base md:text-lg leading-relaxed whitespace-pre-wrap break-words"
              style={{ fontFamily: "'Noto Serif TC', serif" }}
            />
          </div>
        </div>
      )}

      {/* Paper airplane SVG */}
      <div
        ref={airplaneRef}
        className="absolute"
        style={{ opacity: phase === "flying" ? 1 : 0 }}
      >
        <svg
          width="120"
          height="120"
          viewBox="0 0 100 100"
          className="drop-shadow-2xl"
        >
          <polygon
            points="10,50 90,50 50,10"
            fill="#fef3c7"
            stroke="#d4a574"
            strokeWidth="1"
          />
          <polygon
            points="10,50 90,50 50,90"
            fill="#fde68a"
            stroke="#d4a574"
            strokeWidth="1"
          />
          <line
            x1="10"
            y1="50"
            x2="50"
            y2="10"
            stroke="#d4a574"
            strokeWidth="0.5"
          />
          <line
            x1="90"
            y1="50"
            x2="50"
            y2="10"
            stroke="#d4a574"
            strokeWidth="0.5"
          />
          <line
            x1="50"
            y1="10"
            x2="50"
            y2="90"
            stroke="#d4a574"
            strokeWidth="0.5"
            strokeDasharray="2,2"
          />
        </svg>
      </div>

      {/* Final text */}
      <div
        ref={finalTextRef}
        className="absolute inset-0 flex items-center justify-center"
        style={{ opacity: phase === "final" ? 1 : 0 }}
      >
        <div className="text-center px-8">
          <div className="w-16 h-px bg-stone-300 mx-auto mb-8" />
          <p className="font-serif text-2xl md:text-4xl text-stone-700 leading-relaxed">
            當跑的路已跑盡
          </p>
          <p className="font-serif text-2xl md:text-4xl text-stone-700 leading-relaxed mt-2">
            如今有冠冕為我們存留
          </p>
          <div className="w-16 h-px bg-stone-300 mx-auto mt-8" />
          <button
            onClick={onComplete}
            className="mt-12 text-stone-400 hover:text-stone-600 text-sm font-sans transition-colors"
          >
            返回
          </button>
        </div>
      </div>
    </div>
  );
}
