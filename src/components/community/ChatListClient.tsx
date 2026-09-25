"use client";

import Link from "next/link";
import { MessageCircle, Users, Plus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

type Conversation = {
  id: string;
  type: string;
  name: string | null;
  imageUrl: string | null;
  participants: {
    id: string;
    name: string | null;
    lastName: string | null;
    avatarUrl: string | null;
  }[];
  lastMessage: {
    content: string;
    senderName: string | null;
    createdAt: Date;
    isMe: boolean;
  } | null;
  unreadCount: number;
  updatedAt: Date;
};

export default function ChatListClient({
  conversations,
}: {
  conversations: Conversation[];
}) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-emerald-400" />
          Mensajes y Chat
        </h2>
      </div>

      {/* Conversation list */}
      {conversations.length === 0 ? (
        <div className="text-center py-16 bg-slate-900 rounded-3xl border border-slate-800 p-8 shadow-sm">
          <div className="text-5xl mb-4">💬</div>
          <h3 className="text-lg font-bold text-white mb-1">
            Sin mensajes aún
          </h3>
          <p className="text-sm text-slate-400 max-w-sm mx-auto">
            Buscá jugadores y enviales un mensaje para empezar a coordinar partidos.
          </p>
          <Link
            href="/comunidad/jugadores"
            className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-sm font-black shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
          >
            <Users className="w-4 h-4" />
            Buscar jugadores
          </Link>
        </div>
      ) : (
        <div className="space-y-2.5">
          {conversations.map((conv) => (
            <ConversationCard key={conv.id} conversation={conv} />
          ))}
        </div>
      )}
    </div>
  );
}

function ConversationCard({ conversation }: { conversation: Conversation }) {
  const isGroup = conversation.type === "GROUP";
  const initial = (conversation.name || "?")[0].toUpperCase();

  return (
    <Link
      href={`/comunidad/chat/${conversation.id}`}
      className="block bg-slate-900 rounded-2xl border border-slate-800 shadow-sm p-4 transition-all hover:shadow-md hover:border-emerald-500/50 hover:bg-slate-850 active:scale-[0.99]"
    >
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div
          className={`w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center text-slate-950 font-black shadow-md bg-gradient-to-br from-emerald-400 to-teal-500`}
        >
          {isGroup ? (
            <Users className="w-5 h-5 text-slate-950" />
          ) : (
            initial
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5">
            <span className="font-bold text-sm text-white truncate">
              {conversation.name || "Chat"}
            </span>
            {conversation.lastMessage && (
              <span className="text-[10px] text-slate-400 flex-shrink-0 ml-2">
                {formatDistanceToNow(new Date(conversation.lastMessage.createdAt), {
                  addSuffix: false,
                  locale: es,
                })}
              </span>
            )}
          </div>

          {conversation.lastMessage ? (
            <p className="text-xs text-slate-300 truncate">
              {conversation.lastMessage.isMe ? (
                <span className="text-slate-400">Vos: </span>
              ) : isGroup && conversation.lastMessage.senderName ? (
                <span className="text-slate-400">
                  {conversation.lastMessage.senderName}:{" "}
                </span>
              ) : null}
              {conversation.lastMessage.content}
            </p>
          ) : (
            <p className="text-xs text-slate-500 italic">
              Sin mensajes
            </p>
          )}
        </div>

        {/* Unread badge */}
        {conversation.unreadCount > 0 && (
          <div className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 font-black flex items-center justify-center flex-shrink-0 shadow-sm">
            <span className="text-[9px]">
              {conversation.unreadCount > 9 ? "9+" : conversation.unreadCount}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}
