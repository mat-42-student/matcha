FROM nginx:alpine

RUN apk add --no-cache openssl wget && mkdir -p /etc/nginx/certs /run/nginx

RUN openssl req -x509 -nodes -days 365 \
    -subj "/C=FR/ST=IDF/L=Paris/O=42/OU=Dev/CN=localhost" \
    -newkey rsa:2048 \
    -keyout /etc/nginx/certs/selfsigned.key \
    -out /etc/nginx/certs/selfsigned.crt

# RUN chown -R nginx:nginx /etc/nginx/certs

COPY nginx.conf /etc/nginx/nginx.conf

# USER nginx

CMD ["sh", "-c", "until wget -q --spider http://matcha_server:3000/api/health; do sleep 2; done && nginx -g 'daemon off;'"]