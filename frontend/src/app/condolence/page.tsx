"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@apollo/client/react";
import { useForm } from "react-hook-form";
import { GET_PHOTO_LIMITS } from "@/graphql/queries";
import Navbar from "@/components/Navbar";
import PaperAirplaneAnimation from "@/components/PaperAirplaneAnimation";

interface FormData {
  relationship: string;
  howMet: string;
  message: string;
  isPublic: boolean;
}

interface PhotoLimits {
  minWidth: number;
  minHeight: number;
  maxWidth: number;
  maxHeight: number;
}

const revokeObjectUrl = (url: string | null) => {
  if (url?.startsWith("blob:")) {
    URL.revokeObjectURL(url);
  }
};

export default function CondolencePage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>();

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const [animationData, setAnimationData] = useState<{
    imageUrl: string;
    message: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);
  const animationBlobUrlRef = useRef<string | null>(null);

  const { data: limitsData } = useQuery<{ photoLimits: PhotoLimits }>(GET_PHOTO_LIMITS);
  const limits: PhotoLimits = limitsData?.photoLimits || {
    minWidth: 800,
    minHeight: 600,
    maxWidth: 4096,
    maxHeight: 4096,
  };

  const validateImage = useCallback(
    (file: File): Promise<boolean> => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          URL.revokeObjectURL(img.src);
          if (img.width < limits.minWidth || img.height < limits.minHeight) {
            setPhotoError(
              `圖片尺寸過小，最小要求 ${limits.minWidth}x${limits.minHeight}px，您的圖片為 ${img.width}x${img.height}px`
            );
            resolve(false);
          } else if (
            img.width > limits.maxWidth ||
            img.height > limits.maxHeight
          ) {
            setPhotoError(
              `圖片尺寸過大，最大限制 ${limits.maxWidth}x${limits.maxHeight}px，您的圖片為 ${img.width}x${img.height}px`
            );
            resolve(false);
          } else {
            setPhotoError(null);
            resolve(true);
          }
        };
        img.onerror = () => {
          setPhotoError("無法讀取圖片，請確認檔案格式正確");
          resolve(false);
        };
        img.src = URL.createObjectURL(file);
      });
    },
    [limits]
  );

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.type.startsWith("image/")) {
      setPhotoError("請上傳圖片檔案（JPG、PNG 等）");
      return;
    }

    const isValid = await validateImage(selectedFile);
    if (isValid) {
      revokeObjectUrl(previewUrlRef.current);
      const objectUrl = URL.createObjectURL(selectedFile);
      previewUrlRef.current = objectUrl;
      setFile(selectedFile);
      setPreview(objectUrl);
    } else {
      revokeObjectUrl(previewUrlRef.current);
      previewUrlRef.current = null;
      setFile(null);
      setPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const onSubmit = async (data: FormData) => {
    if (!file) {
      setPhotoError("請上傳一張照片");
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append(
        "operations",
        JSON.stringify({
          query: `mutation CreateCondolence($relationship: String!, $howMet: String!, $message: String!, $isPublic: Boolean!) {
            createCondolence(relationship: $relationship, howMet: $howMet, message: $message, isPublic: $isPublic) {
              id
              photoUrl
            }
          }`,
          variables: {
            relationship: data.relationship,
            howMet: data.howMet,
            message: data.message,
            isPublic: data.isPublic,
          },
        })
      );
      formData.append("map", JSON.stringify({ 0: ["variables.photo"] }));
      formData.append("photo", file);

      const graphqlUrl =
        process.env.NEXT_PUBLIC_GRAPHQL_URL || "http://localhost:4000/graphql";
      const res = await fetch(graphqlUrl, {
        method: "POST",
        headers: {
          "apollo-require-preflight": "true",
        },
        body: formData,
      });

      const result = await res.json();

      if (result.errors) {
        throw new Error(result.errors[0].message);
      }

      const createdPhotoUrl = result.data?.createCondolence?.photoUrl as
        | string
        | undefined;
      const currentPreviewUrl = previewUrlRef.current;
      const animationImageUrl = createdPhotoUrl || currentPreviewUrl || "";

      if (createdPhotoUrl) {
        revokeObjectUrl(currentPreviewUrl);
        previewUrlRef.current = null;
      } else if (currentPreviewUrl) {
        animationBlobUrlRef.current = currentPreviewUrl;
        previewUrlRef.current = null;
      }

      setAnimationData({
        imageUrl: animationImageUrl,
        message: data.message,
      });
      setShowAnimation(true);

      reset();
      setFile(null);
      setPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      alert(err instanceof Error ? err.message : "送出失敗，請稍後再試");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    return () => {
      revokeObjectUrl(previewUrlRef.current);
      previewUrlRef.current = null;
      revokeObjectUrl(animationBlobUrlRef.current);
      animationBlobUrlRef.current = null;
    };
  }, []);

  const handleAnimationComplete = () => {
    revokeObjectUrl(animationBlobUrlRef.current);
    animationBlobUrlRef.current = null;
    router.push("/");
  };

  if (showAnimation && animationData) {
    return (
      <PaperAirplaneAnimation
        imageUrl={animationData.imageUrl}
        message={animationData.message}
        onComplete={handleAnimationComplete}
      />
    );
  }

  return (
    <main className="min-h-screen bg-stone-50">
      <Navbar />

      <section className="pt-24 pb-16 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto">
          <h1 className="font-serif text-3xl md:text-4xl text-stone-800 text-center mb-4">
            留下您的祝福
          </h1>
          <p className="font-sans text-stone-500 text-center text-sm md:text-base mb-12">
            分享您與父親的故事，留下一段話和一張珍貴的照片
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Relationship */}
            <div>
              <label className="block font-sans text-sm text-stone-700 mb-2">
                與父親的關係 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="例如：兒子、同事、朋友、學生..."
                className="w-full px-4 py-3 border border-stone-300 rounded-lg font-sans text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-400 focus:border-transparent transition-all"
                {...register("relationship", {
                  required: "請填寫您與父親的關係",
                })}
              />
              {errors.relationship && (
                <p className="mt-1 text-red-500 text-xs font-sans">
                  {errors.relationship.message}
                </p>
              )}
            </div>

            {/* How Met */}
            <div>
              <label className="block font-sans text-sm text-stone-700 mb-2">
                你們是怎麼認識的 <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                placeholder="描述您與父親相識的經過..."
                className="w-full px-4 py-3 border border-stone-300 rounded-lg font-sans text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-400 focus:border-transparent transition-all resize-none"
                {...register("howMet", {
                  required: "請描述你們是怎麼認識的",
                })}
              />
              {errors.howMet && (
                <p className="mt-1 text-red-500 text-xs font-sans">
                  {errors.howMet.message}
                </p>
              )}
            </div>

            {/* Message */}
            <div>
              <label className="block font-sans text-sm text-stone-700 mb-2">
                想說的話 <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={5}
                placeholder="寫下您想對父親說的話..."
                className="w-full px-4 py-3 border border-stone-300 rounded-lg font-sans text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-400 focus:border-transparent transition-all resize-none"
                {...register("message", {
                  required: "請寫下您想說的話",
                })}
              />
              {errors.message && (
                <p className="mt-1 text-red-500 text-xs font-sans">
                  {errors.message.message}
                </p>
              )}
            </div>

            {/* Photo Upload */}
            <div>
              <label className="block font-sans text-sm text-stone-700 mb-2">
                上傳照片 <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-stone-400 mb-3 font-sans">
                照片尺寸要求：最小 {limits.minWidth}x{limits.minHeight}px，最大{" "}
                {limits.maxWidth}x{limits.maxHeight}px
              </p>

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-stone-300 rounded-lg p-8 text-center cursor-pointer hover:border-stone-400 hover:bg-stone-100/50 transition-all"
              >
                {preview ? (
                  <div className="space-y-4">
                    <img
                      src={preview}
                      alt="預覽"
                      className="max-h-64 mx-auto rounded-lg shadow-sm"
                    />
                    <p className="text-xs text-stone-500 font-sans">
                      點擊以更換照片
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <svg
                      className="w-10 h-10 text-stone-400 mx-auto"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <p className="text-sm text-stone-500 font-sans">
                      點擊上傳照片
                    </p>
                  </div>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              {photoError && (
                <p className="mt-2 text-red-500 text-xs font-sans">
                  {photoError}
                </p>
              )}
            </div>

            {/* Public consent */}
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="isPublic"
                defaultChecked={true}
                {...register("isPublic")}
                className="mt-0.5 w-4 h-4 rounded border-stone-300 text-stone-600 focus:ring-stone-400"
              />
              <label htmlFor="isPublic" className="font-sans text-sm text-stone-600 leading-relaxed cursor-pointer">
                同意公開內容（若未勾選將不呈現在首頁輪播及留言頁面）
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-stone-800 text-white font-sans text-sm py-4 rounded-lg hover:bg-stone-700 disabled:bg-stone-400 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? "送出中..." : "送出祝福"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
