"use client";

import { useState, useTransition } from "react";
import { Heart, MessageCircle, Trash2, Pin, Megaphone, Loader2 } from "lucide-react";
import { toggleLike, deletePost } from "@/actions/community-feed";
import PostComments from "@/components/community/PostComments";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

type PostData = {
  id: string;
  content: string;
  imageUrl: string | null;
  type: string;
  isPinned: boolean;
  createdAt: Date;
  author: {
    id: string;
    name: string | null;
    lastName: string | null;
    avatarUrl: string | null;
    category: string | null;
  };
  likesCount: number;
  commentsCount: number;
  isLikedByMe: boolean;
};

export default function PostCard({
  post,
  currentUserId,
}: {
  post: PostData;
  currentUserId: string | null;
}) {
  const [liked, setLiked] = useState(post.isLikedByMe);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [showComments, setShowComments] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [deleted, setDeleted] = useState(false);

  const isAnnouncement = post.type === "CLUB_ANNOUNCEMENT";
  const isOwner = currentUserId === post.author.id;
  const authorName = `${post.author.name || ""} ${post.author.lastName || ""}`.trim();
  const initial = (post.author.name || "?")[0].toUpperCase();

  const timeAgo = formatDistanceToNow(new Date(post.createdAt), {
    addSuffix: true,
    locale: es,
  });

  const handleLike = () => {
    if (isPending || !currentUserId) return;
    // Optimistic update
    setLiked(!liked);
    setLikesCount((prev) => prev + (liked ? -1 : 1));

    startTransition(async () => {
      const result = await toggleLike(post.id);
      if (!result.success) {
        // Revert
        setLiked(liked);
        setLikesCount(likesCount);
      }
    });
  };

  const handleDelete = () => {
    if (isPending) return;
    if (!confirm("¿Estás seguro de eliminar esta publicación?")) return;
    startTransition(async () => {
      const result = await deletePost(post.id);
      if (result.success) setDeleted(true);
    });
  };

  if (deleted) return null;

  return (
    <article
      className={`
        bg-slate-900 rounded-2xl border shadow-md overflow-hidden transition-all
        ${
          isAnnouncement
            ? "border-emerald-500/40 ring-1 ring-emerald-500/20"
            : "border-slate-800"
        }
        ${post.isPinned ? "ring-1 ring-amber-500/40" : ""}
      `}
    >
      {/* Pinned / Announcement badge */}
      {(post.isPinned || isAnnouncement) && (
        <div
          className={`px-4 py-1.5 text-[11px] font-bold flex items-center gap-1.5 border-b ${
            isAnnouncement
              ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20"
              : "bg-amber-500/15 text-amber-400 border-amber-500/20"
          }`}
        >
          {isAnnouncement ? (
            <><Megaphone className="w-3 h-3 text-emerald-400" /> Anuncio Oficial</>
          ) : (
            <><Pin className="w-3 h-3 text-amber-400" /> Fijado</>
          )}
        </div>
      )}

      <div className="p-4">
        {/* Author header */}
        <div className="flex items-center gap-3 mb-3">
          <div
            className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold text-sm shadow-md ${
              isAnnouncement
                ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-slate-950 font-black"
                : "bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-700 text-slate-200"
            }`}
          >
            {post.author.avatarUrl ? (
              <img
                src={post.author.avatarUrl}
                alt={authorName}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              initial
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-white truncate">
                {isAnnouncement ? "📢 Oficial" : authorName}
              </span>
              {post.author.category && !isAnnouncement && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  {post.author.category}
                </span>
              )}
            </div>
            <span className="text-[11px] text-slate-400">
              {timeAgo}
            </span>
          </div>

          {/* Delete button for owner */}
          {isOwner && (
            <button
              onClick={handleDelete}
              className="p-1.5 rounded-full hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 transition-colors"
              title="Eliminar"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Content */}
        <p className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
          {post.content}
        </p>

        {/* Image */}
        {post.imageUrl && (
          <div className="mt-3 rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
            <img
              src={post.imageUrl}
              alt="Imagen adjunta"
              className="w-full max-h-96 object-cover"
            />
          </div>
        )}
      </div>

      {/* Actions bar */}
      <div className="px-4 py-2.5 border-t border-slate-800/80 flex items-center gap-1.5 bg-slate-900/60">
        {/* Like button */}
        <button
          onClick={handleLike}
          disabled={!currentUserId}
          className={`
            flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95
            ${
              liked
                ? "bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }
          `}
        >
          <Heart
            className={`w-4 h-4 transition-all ${
              liked ? "fill-rose-500 text-rose-500 scale-110" : ""
            }`}
          />
          {likesCount > 0 && <span>{likesCount}</span>}
        </button>

        {/* Comment button */}
        <button
          onClick={() => setShowComments(!showComments)}
          className={`
            flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95
            ${
              showComments
                ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-bold"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }
          `}
        >
          <MessageCircle className="w-4 h-4" />
          {post.commentsCount > 0 && <span>{post.commentsCount}</span>}
        </button>
      </div>

      {/* Comments section */}
      {showComments && (
        <PostComments
          postId={post.id}
          currentUserId={currentUserId}
        />
      )}
    </article>
  );
}
