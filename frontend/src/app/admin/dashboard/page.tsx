"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import { useRouter } from "next/navigation";
import { GET_CONDOLENCES } from "@/graphql/queries";
import {
  DELETE_CONDOLENCE,
  BATCH_DELETE_CONDOLENCES,
  BATCH_DOWNLOAD_PHOTOS,
  UPDATE_CONDOLENCE,
  TOGGLE_PIN_CONDOLENCE,
} from "@/graphql/mutations";

interface Condolence {
  id: string;
  name: string;
  relationship: string | null;
  howMet: string;
  message: string;
  photoUrl: string | null;
  photoWidth: number | null;
  photoHeight: number | null;
  isPublic: boolean;
  isPinned: boolean;
  createdAt: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    relationship: "",
    howMet: "",
    message: "",
  });
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);

  const { data, loading, refetch } = useQuery<{
    condolences: Condolence[];
  }>(GET_CONDOLENCES, {
    variables: { limit: 100, offset: 0 },
    skip: !isAuthorized,
  });

  const [deleteSingle] = useMutation<{
    deleteCondolence: { success: boolean; deletedCount: number };
  }>(DELETE_CONDOLENCE);
  const [batchDelete] = useMutation<{
    batchDeleteCondolences: { success: boolean; deletedCount: number };
  }>(BATCH_DELETE_CONDOLENCES);
  const [batchDownload] = useMutation<{
    batchDownloadPhotos: { id: string; url: string }[];
  }>(BATCH_DOWNLOAD_PHOTOS);
  const [updateCondolence] = useMutation<{
    updateCondolence: Condolence;
  }>(UPDATE_CONDOLENCE);
  const [togglePin] = useMutation<{
    togglePinCondolence: Condolence;
  }>(TOGGLE_PIN_CONDOLENCE);

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      router.replace("/admin/login");
      setIsAuthorized(false);
      setIsAuthChecked(true);
      return;
    }
    setIsAuthorized(true);
    setIsAuthChecked(true);
  }, [router]);

  const condolences: Condolence[] = data?.condolences || [];
  const selectedPhotoIds = condolences
    .filter((c) => selectedIds.has(c.id) && !!c.photoUrl)
    .map((c) => c.id);

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    router.push("/admin/login");
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === condolences.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(condolences.map((c) => c.id)));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("確定要刪除這筆資料嗎？")) return;
    try {
      await deleteSingle({ variables: { id } });
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      refetch();
    } catch (err) {
      alert(err instanceof Error ? err.message : "刪除失敗");
    }
  };

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`確定要刪除選取的 ${selectedIds.size} 筆資料嗎？`)) return;
    try {
      await batchDelete({ variables: { ids: Array.from(selectedIds) } });
      setSelectedIds(new Set());
      refetch();
    } catch (err) {
      alert(err instanceof Error ? err.message : "批次刪除失敗");
    }
  };

  const handleDownloadSingle = useCallback(
    async (id: string) => {
      try {
        const { data } = await batchDownload({ variables: { ids: [id] } });
        if (data?.batchDownloadPhotos?.[0]?.url) {
          window.open(data.batchDownloadPhotos[0].url, "_blank");
        }
      } catch (err) {
        alert(err instanceof Error ? err.message : "下載失敗");
      }
    },
    [batchDownload]
  );

  const handleBatchDownload = async () => {
    if (selectedIds.size === 0) return;
    if (selectedPhotoIds.length === 0) {
      alert("目前選取的資料都沒有照片可下載");
      return;
    }
    try {
      const { data } = await batchDownload({
        variables: { ids: selectedPhotoIds },
      });
      if (data?.batchDownloadPhotos) {
        if (selectedPhotoIds.length < selectedIds.size) {
          alert(
            `已略過 ${selectedIds.size - selectedPhotoIds.length} 筆無照片資料，開始下載 ${selectedPhotoIds.length} 張照片`
          );
        }
        for (const item of data.batchDownloadPhotos) {
          window.open(item.url, "_blank");
        }
      } else {
        alert("目前沒有可下載的照片");
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "批次下載失敗");
    }
  };

  const startEdit = (c: Condolence) => {
    setEditingId(c.id);
    setEditForm({
      name: c.name,
      relationship: c.relationship || "",
      howMet: c.howMet,
      message: c.message,
    });
  };

  const handleTogglePin = async (id: string) => {
    try {
      await togglePin({ variables: { id } });
      refetch();
    } catch (err) {
      alert(err instanceof Error ? err.message : "操作失敗");
    }
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    try {
      await updateCondolence({
        variables: {
          id: editingId,
          name: editForm.name,
          relationship: editForm.relationship,
          howMet: editForm.howMet,
          message: editForm.message,
        },
      });
      setEditingId(null);
      refetch();
    } catch (err) {
      alert(err instanceof Error ? err.message : "更新失敗");
    }
  };

  if (!isAuthChecked || !isAuthorized || loading) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center">
        <p className="text-stone-500 font-sans">載入中...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-stone-100">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <h1 className="font-serif text-xl text-stone-800">後台管理</h1>
          <button
            onClick={handleLogout}
            className="text-sm text-stone-500 hover:text-stone-700 font-sans transition-colors"
          >
            登出
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Actions bar */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="text-sm text-stone-600 font-sans">
              共 {condolences.length} 筆資料
              {selectedIds.size > 0 && `，已選取 ${selectedIds.size} 筆`}
              {selectedIds.size > 0 && `（可下載照片 ${selectedPhotoIds.length} 筆）`}
            </span>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={toggleSelectAll}
              className="text-xs px-4 py-2 border border-stone-300 rounded-lg text-stone-600 hover:bg-stone-50 transition-colors font-sans"
            >
              {selectedIds.size === condolences.length ? "取消全選" : "全選"}
            </button>
            <button
              onClick={handleBatchDownload}
              disabled={selectedPhotoIds.length === 0}
              className="text-xs px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-stone-300 disabled:cursor-not-allowed transition-colors font-sans"
            >
              批次下載照片
            </button>
            <button
              onClick={handleBatchDelete}
              disabled={selectedIds.size === 0}
              className="text-xs px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-stone-300 disabled:cursor-not-allowed transition-colors font-sans"
            >
              批次刪除
            </button>
          </div>
        </div>

        {/* Data table / cards */}
        {condolences.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <p className="text-stone-400 font-sans">尚無弔唁資料</p>
          </div>
        ) : (
          <div className="space-y-4">
            {condolences.map((c) => (
              <div
                key={c.id}
                className={`bg-white rounded-xl shadow-sm overflow-hidden transition-all ${
                  selectedIds.has(c.id) ? "ring-2 ring-stone-400" : ""
                } ${c.isPinned ? "ring-2 ring-amber-300 bg-amber-50/30" : ""}`}
              >
                <div className="flex flex-col md:flex-row">
                  {/* Checkbox + Photo */}
                  <div className="flex items-start p-4 md:w-48 shrink-0">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(c.id)}
                      onChange={() => toggleSelect(c.id)}
                      className="mt-1 mr-3 w-4 h-4 rounded border-stone-300 text-stone-600 focus:ring-stone-400"
                    />
                    {c.photoUrl ? (
                      <img
                        src={c.photoUrl}
                        alt="uploaded"
                        className="w-32 h-32 object-contain bg-stone-100 rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => setViewingPhoto(c.photoUrl)}
                      />
                    ) : (
                      <div className="w-32 h-32 rounded-lg bg-stone-200 text-stone-500 text-xs font-sans flex items-center justify-center">
                        無照片
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-4 md:border-l border-stone-100">
                    {editingId === c.id ? (
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs text-stone-500 font-sans">
                            姓名（如何稱呼）
                          </label>
                          <input
                            type="text"
                            value={editForm.name}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                name: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm font-sans"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-stone-500 font-sans">
                            與老爸的關係（選填）
                          </label>
                          <input
                            type="text"
                            value={editForm.relationship}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                relationship: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm font-sans"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-stone-500 font-sans">
                            如何認識
                          </label>
                          <textarea
                            rows={2}
                            value={editForm.howMet}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                howMet: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm font-sans resize-none"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-stone-500 font-sans">
                            想說的話
                          </label>
                          <textarea
                            rows={3}
                            value={editForm.message}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                message: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm font-sans resize-none"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={handleUpdate}
                            className="text-xs px-4 py-2 bg-stone-800 text-white rounded-lg hover:bg-stone-700 transition-colors font-sans"
                          >
                            儲存
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="text-xs px-4 py-2 border border-stone-300 text-stone-600 rounded-lg hover:bg-stone-50 transition-colors font-sans"
                          >
                            取消
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 mb-3 flex-wrap">
                          {c.isPinned && (
                            <span className="inline-flex items-center gap-1 text-xs font-sans font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                              📌 置頂
                            </span>
                          )}
                          <span className={`inline-flex items-center text-xs font-sans px-2 py-0.5 rounded-full ${
                            c.isPublic
                              ? "text-green-700 bg-green-100"
                              : "text-stone-500 bg-stone-100"
                          }`}>
                            {c.isPublic ? "公開" : "未公開"}
                          </span>
                        </div>
                        <div className="mb-2">
                          <span className="text-xs text-stone-400 font-sans block">
                            姓名
                          </span>
                          <span className="text-base text-stone-800 font-sans font-medium">
                            {c.name || "未具名"}
                          </span>
                        </div>
                        <div className="mb-4">
                          <span className="text-xs text-stone-400 font-sans block">
                            想說的話
                          </span>
                          <p className="text-sm text-stone-700 font-sans leading-relaxed">
                            {c.message}
                          </p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                          <div>
                            <span className="text-xs text-stone-400 font-sans block">
                              與老爸的關係
                            </span>
                            <span className="text-sm text-stone-700 font-sans">
                              {c.relationship || "未填寫"}
                            </span>
                          </div>
                          <div>
                            <span className="text-xs text-stone-400 font-sans block">
                              如何認識
                            </span>
                            <span className="text-sm text-stone-700 font-sans line-clamp-2">
                              {c.howMet}
                            </span>
                          </div>
                          <div>
                            <span className="text-xs text-stone-400 font-sans block">
                              照片尺寸
                            </span>
                            <span className="text-sm text-stone-500 font-sans">
                              {c.photoWidth && c.photoHeight
                                ? `${c.photoWidth}x${c.photoHeight}px`
                                : "未附照片"}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-stone-400 font-sans">
                            {new Date(c.createdAt).toLocaleString("zh-TW")}
                          </span>
                          <div className="flex gap-2 flex-wrap">
                            <button
                              onClick={() => handleTogglePin(c.id)}
                              className={`text-xs px-3 py-1.5 border rounded-lg transition-colors font-sans ${
                                c.isPinned
                                  ? "border-amber-400 text-amber-700 bg-amber-50 hover:bg-amber-100"
                                  : "border-amber-300 text-amber-600 hover:bg-amber-50"
                              }`}
                            >
                              {c.isPinned ? "取消置頂" : "置頂"}
                            </button>
                            <button
                              onClick={() => handleDownloadSingle(c.id)}
                              disabled={!c.photoUrl}
                              className="text-xs px-3 py-1.5 border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 disabled:bg-stone-100 disabled:text-stone-400 disabled:border-stone-200 disabled:cursor-not-allowed transition-colors font-sans"
                            >
                              下載照片
                            </button>
                            <button
                              onClick={() => startEdit(c)}
                              className="text-xs px-3 py-1.5 border border-stone-300 text-stone-600 rounded-lg hover:bg-stone-50 transition-colors font-sans"
                            >
                              編輯
                            </button>
                            <button
                              onClick={() => handleDelete(c.id)}
                              className="text-xs px-3 py-1.5 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-sans"
                            >
                              刪除
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Photo lightbox */}
      {viewingPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setViewingPhoto(null)}
        >
          <img
            src={viewingPhoto}
            alt="full size"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setViewingPhoto(null)}
            className="absolute top-4 right-4 text-white/70 hover:text-white text-2xl"
          >
            ✕
          </button>
        </div>
      )}
    </main>
  );
}
