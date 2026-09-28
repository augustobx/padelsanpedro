INSERT INTO hubsetting (id, settingKey, value, updatedAt) VALUES
(UUID(), 'splashEnabled', 'true', NOW(3)),
(UUID(), 'splashTitle', 'PADEL SAN PEDRO', NOW(3)),
(UUID(), 'splashTagline', 'La red oficial de canchas y partidos de San Pedro', NOW(3)),
(UUID(), 'splashBadge', 'APP HUB OFICIAL', NOW(3)),
(UUID(), 'splashLogoUrl', 'padel-racket', NOW(3)),
(UUID(), 'splashStyle', 'neon-glow', NOW(3)),
(UUID(), 'splashDuration', '2000', NOW(3)),
(UUID(), 'splashShowOnce', 'true', NOW(3)),
(UUID(), 'heroNoticeText', '¡Bienvenidos a la red oficial de complejos de Padel San Pedro!', NOW(3)),
(UUID(), 'heroNoticeActive', 'true', NOW(3)),
(UUID(), 'accentColor', '#10b981', NOW(3))
ON DUPLICATE KEY UPDATE value = VALUES(value), updatedAt = VALUES(updatedAt);
