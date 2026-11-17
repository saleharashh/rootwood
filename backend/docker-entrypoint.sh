#!/bin/bash
set -e

PORT="${PORT:-80}"
echo "[entrypoint] Configuring Apache on port ${PORT}..."
sed -i "s/Listen 80/Listen ${PORT}/" /etc/apache2/ports.conf
sed -i "s/:80/:${PORT}/" /etc/apache2/sites-available/000-default.conf

echo "[entrypoint] Running database auto-init..."
php /var/www/html/auto-init.php || true

echo "[entrypoint] Starting Apache..."
exec apache2-foreground
