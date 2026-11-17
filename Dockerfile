# Stage 1: Build Vite React Frontend SPA
FROM node:22-alpine AS frontend-builder
RUN corepack enable && corepack prepare pnpm@11.24.0 --activate
WORKDIR /app

# Install dependencies using root workspace
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/
COPY apps/api/package.json ./apps/api/
RUN pnpm install --no-frozen-lockfile

# Copy frontend source and build
COPY apps/web/ ./apps/web/
ENV VITE_API_URL=/api
RUN pnpm --filter web build

# Stage 2: Production PHP 8.2 + Apache Server
FROM php:8.2-apache

# Install PDO MySQL extension
RUN docker-php-ext-install pdo pdo_mysql

# Configure MPM to prevent conflicting MPMs error
RUN a2dismod -f mpm_event mpm_worker || true \
    && a2enmod mpm_prefork rewrite headers

# Allow .htaccess overrides in /var/www/
RUN sed -i '/<Directory \/var\/www\/>/,/<\/Directory>/ s/AllowOverride None/AllowOverride All/' /etc/apache2/apache2.conf

WORKDIR /var/www/html

# 1. Copy Frontend build output to document root
COPY --from=frontend-builder /app/apps/web/dist /var/www/html/

# 2. Copy Root SPA .htaccess for client-side routing fallback & API forwarding
COPY docker/spa.htaccess /var/www/html/.htaccess

# 3. Copy PHP backend to /var/www/html/api
COPY backend/ /var/www/html/api/

# 4. Entrypoint script
COPY docker/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Permissions
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html

EXPOSE 80

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
