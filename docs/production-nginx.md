# Production Nginx Reverse Proxy

This guide fixes the case where `https://payonarc.xyz` shows the default Nginx welcome page while Pay On Arc works on `:3000`.

Target behavior:

- `payonarc.xyz` proxies to `http://127.0.0.1:3000`
- `www.payonarc.xyz` proxies to `http://127.0.0.1:3000`
- Nginx preserves `Host`, `X-Real-IP`, `X-Forwarded-For`, and `X-Forwarded-Proto`
- WebSocket upgrade headers are supported
- request bodies up to `10M` are allowed
- Certbot manages SSL certificates
- the default Nginx site is disabled or removed

## Example Nginx Site

Create a site file such as `/etc/nginx/sites-available/payonarc.xyz`:

```nginx
map $http_upgrade $connection_upgrade {
    default upgrade;
    "" close;
}

server {
    listen 80;
    listen [::]:80;
    server_name payonarc.xyz www.payonarc.xyz;

    client_max_body_size 10M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;

        proxy_read_timeout 60s;
        proxy_send_timeout 60s;
    }
}
```

Enable it and disable the default site:

```bash
sudo ln -s /etc/nginx/sites-available/payonarc.xyz /etc/nginx/sites-enabled/payonarc.xyz
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

If the domain still shows `Welcome to nginx`, Nginx is still serving the default virtual host. Check for another enabled site that has `default_server` or a matching `server_name`.

## Certbot SSL

After the HTTP proxy works, issue certificates:

```bash
sudo certbot --nginx -d payonarc.xyz -d www.payonarc.xyz
```

Certbot will add the SSL `server` blocks and renewal configuration. Re-test afterwards:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## Pay On Arc Environment

Set the public origin used by generated checkout links:

```bash
NEXT_PUBLIC_APP_URL="https://payonarc.xyz"
```

Then rebuild and restart Pay On Arc:

```bash
pnpm build
pm2 restart arcpay-ai
```
