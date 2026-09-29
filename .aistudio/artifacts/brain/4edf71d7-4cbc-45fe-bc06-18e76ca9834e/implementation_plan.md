# Деплой Deskovery на Ubuntu 24.04 LTS

## Статус: Готово к запуску на сервере ✅

1. **Брендинг обновлен**:
   - Название везде изменено на **Deskovery** (в заголовке, мета-тегах, логотипе в шапке, хранилище досок).
2. **Конфигурация Caddy + Docker готова**:
   - `Caddyfile` настроен на проксирование HTTP + WebSocket (WSS) с автоматическим выпуском SSL-сертификата Let's Encrypt.
   - `docker-compose.yml` содержит два легковесных сервиса: приложение `deskovery-app` и обратный прокси `deskovery-caddy`.
   - `.env.example` подготовлен с переменной `DOMAIN=deskovery.duckdns.org` (или вашей зоны).
3. **Руководство создано**:
   - Подробная инструкция в файле `DEPLOY.md`.

---

## 3 команды для запуска на вашем сервере:

```bash
# 1. Установить Docker на Ubuntu 24.04:
curl -fsSL https://get.docker.com | sh

# 2. Указать зарегистрированный сабдомен в .env:
echo "DOMAIN=deskovery.duckdns.org" > .env

# 3. Запустить контейнеры:
docker compose up -d --build
```
