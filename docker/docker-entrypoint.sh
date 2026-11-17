#!/bin/bash
set -e

PORT="${PORT:-80}"
echo "[entrypoint] Configuring Apache on port ${PORT}..."
sed -i "s/Listen 80/Listen ${PORT}/" /etc/apache2/ports.conf
sed -i "s/:80/:${PORT}/" /etc/apache2/sites-available/000-default.conf

# Ensure single MPM is enabled
a2dismod -f mpm_event mpm_worker 2>/dev/null || true
a2enmod mpm_prefork 2>/dev/null || true

# Run database auto-init
echo "[entrypoint] Checking database auto-init..."
php /var/www/html/api/auto-init.php || true

echo "[entrypoint] Starting Apache on port ${PORT}..."
exec apache2-foreground
