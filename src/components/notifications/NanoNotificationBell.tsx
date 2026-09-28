'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  BellRing,
  Check,
  CheckCheck,
  Clock,
  Sparkles,
  ExternalLink,
  Flame,
  Volume2,
  X,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useNanoNotifications } from '@/lib/notifications/useNanoNotifications';
import { InAppNotificationItem } from '@/lib/notifications/types';

interface NanoNotificationBellProps {
  accentColor?: string;
  className?: string;
}

export default function NanoNotificationBell({
  accentColor = '#10b981',
  className = '',
}: NanoNotificationBellProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    isSupported,
    isSubscribed,
    platform,
    notifications,
    unreadCount,
    loading,
    listLoading,
    togglePush,
    markAsRead,
    markAllAsRead,
    sendTestNotification,
  } = useNanoNotifications();

  // Cerrar al hacer clic afuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleNotificationClick = (n: InAppNotificationItem) => {
    if (!n.isRead) {
      markAsRead(n.id);
    }
    setIsOpen(false);
    if (n.linkUrl) {
      router.push(n.linkUrl);
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.isRead;
    return true;
  });

  const formatTimeAgo = (dateInput: string | Date) => {
    const d = new Date(dateInput);
    const diff = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diff < 60) return 'Hace instantes';
    if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `Hace ${Math.floor(diff / 3600)} h`;
    return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
  };

  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      {/* Botón Campana */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative p-2.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 hover:bg-slate-850 active:scale-95 transition-all shadow-lg shadow-black/20 flex items-center justify-center cursor-pointer"
        aria-label="Abrir centro de notificaciones"
      >
        {isSubscribed ? (
          <BellRing
            className={`w-5 h-5 transition-transform ${unreadCount > 0 ? 'animate-bounce' : ''}`}
            style={{ color: unreadCount > 0 ? accentColor : undefined }}
          />
        ) : (
          <Bell className="w-5 h-5" />
        )}

        {/* Badge contador */}
        {unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 min-w-[20px] h-[20px] px-1 text-[11px] font-black rounded-full text-slate-950 flex items-center justify-center shadow-lg shadow-black/40 animate-in zoom-in"
            style={{ backgroundColor: accentColor }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover / Drawer */}
      {isOpen && (
        <div className="absolute right-0 top-12 z-50 w-80 sm:w-96 rounded-3xl bg-slate-950/95 border border-slate-800 shadow-2xl shadow-black/80 backdrop-blur-xl overflow-hidden animate-in fade-in slide-in-from-top-2">
          {/* Header */}
          <div className="p-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/50">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-white"
                style={{ backgroundColor: `${accentColor}25` }}
              >
                <BellRing className="w-4 h-4" style={{ color: accentColor }} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight">Notificaciones</h3>
                <span className="text-[10px] text-slate-400">
                  {unreadCount > 0 ? `${unreadCount} sin leer` : 'Al día'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  title="Marcar todas como leídas"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-xs flex items-center gap-1"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-semibold">Leídas</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Banner de estado Push */}
          <div className="px-4 py-2.5 bg-slate-900/30 border-b border-slate-800/60 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  isSubscribed ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                }`}
              />
              <span className="text-slate-300 text-[11px] font-medium">
                {isSubscribed ? 'Alertas push activadas' : 'Alertas push inactivas'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={togglePush}
                disabled={loading}
                className="text-[11px] font-bold px-2.5 py-1 rounded-lg transition-colors border"
                style={{
                  backgroundColor: isSubscribed ? 'transparent' : `${accentColor}20`,
                  color: isSubscribed ? '#94a3b8' : accentColor,
                  borderColor: isSubscribed ? '#334155' : `${accentColor}50`,
                }}
              >
                {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : isSubscribed ? 'Desactivar' : 'Activar'}
              </button>
            </div>
          </div>

          {/* Filtros */}
          <div className="flex px-4 pt-2.5 pb-1 gap-2 border-b border-slate-800/40 text-xs">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`pb-1.5 font-bold transition-all border-b-2 text-[11px] ${
                filter === 'all'
                  ? 'text-white border-emerald-400'
                  : 'text-slate-500 border-transparent hover:text-slate-400'
              }`}
              style={{ borderColor: filter === 'all' ? accentColor : 'transparent' }}
            >
              Todas ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('unread')}
              className={`pb-1.5 font-bold transition-all border-b-2 text-[11px] ${
                filter === 'unread'
                  ? 'text-white border-emerald-400'
                  : 'text-slate-500 border-transparent hover:text-slate-400'
              }`}
              style={{ borderColor: filter === 'unread' ? accentColor : 'transparent' }}
            >
              Sin leer ({unreadCount})
            </button>
          </div>

          {/* Lista de Notificaciones */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/50 p-1">
            {listLoading && notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-xs">Cargando avisos...</span>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="p-8 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
                <Sparkles className="w-6 h-6 text-slate-600" />
                <p className="text-xs font-medium text-slate-400">No hay notificaciones por aquí</p>
                <p className="text-[11px] text-slate-600">
                  Te avisaremos al instante cuando se liberen turnos o haya novedades.
                </p>
              </div>
            ) : (
              filteredNotifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleNotificationClick(item)}
                  className={`p-3 rounded-2xl transition-all cursor-pointer flex items-start gap-3 text-left group ${
                    item.isRead
                      ? 'hover:bg-slate-900/60 opacity-80'
                      : 'bg-slate-900/40 hover:bg-slate-900 border border-slate-800/80 shadow-sm'
                  }`}
                >
                  <div
                    className="w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-xs mt-0.5"
                    style={{
                      backgroundColor: item.type === 'SLOT_LIBERATED' ? '#f59e0b20' : `${accentColor}20`,
                      color: item.type === 'SLOT_LIBERATED' ? '#f59e0b' : accentColor,
                    }}
                  >
                    {item.type === 'SLOT_LIBERATED' ? (
                      <Flame className="w-4 h-4 animate-pulse" />
                    ) : (
                      <Bell className="w-4 h-4" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <h4
                        className={`text-xs font-bold truncate ${
                          item.isRead ? 'text-slate-300' : 'text-white'
                        }`}
                      >
                        {item.title}
                      </h4>
                      {!item.isRead && (
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: accentColor }}
                        />
                      )}
                    </div>
                    {item.body && (
                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                        {item.body}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-1.5 text-[10px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTimeAgo(item.createdAt)}
                      </span>
                      {item.linkUrl && (
                        <span className="text-emerald-400 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity font-semibold">
                          Ver <ExternalLink className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer con botón de prueba */}
          <div className="p-3 bg-slate-900/80 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-[10px] text-slate-500">
              Plataforma: <span className="text-slate-400 font-mono">{platform}</span>
            </span>
            <button
              type="button"
              onClick={sendTestNotification}
              disabled={loading}
              className="text-[10px] font-bold text-slate-400 hover:text-white flex items-center gap-1 hover:underline"
            >
              <Volume2 className="w-3 h-3" /> Probar alerta
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
