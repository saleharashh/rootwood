FROM php:8.2-apache

# Install PDO MySQL
RUN docker-php-ext-install pdo pdo_mysql

# Configure MPM to prevent conflicting MPMs error
RUN a2dismod -f mpm_event mpm_worker || true \
    && a2enmod mpm_prefork rewrite headers

# Allow .htaccess overrides in /var/www/
RUN sed -i '/<Directory \/var\/www\/>/,/<\/Directory>/ s/AllowOverride None/AllowOverride All/' /etc/apache2/apache2.conf

# Set working directory
WORKDIR /var/www/html

# Copy backend source
COPY . /var/www/html/

# Permissions
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html \
    && chmod +x /var/www/html/docker-entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/var/www/html/docker-entrypoint.sh"]
