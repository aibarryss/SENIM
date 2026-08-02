# SENIM

Главная миссия: полностью устранить человеческий фактор в благотворительности, сделав процесс помощи нуждающимся на 100% прозрачным, безопасным и целевым.

SENIM — это MVP благотворительной платформы для Казахстана, связывающая доноров, получателей помощи (СУСН) и бизнес-партнёров. Платформа построена на Supabase (Auth + Postgres + RLS + Edge Functions) и React + Vite + TailwindCSS.

---

## Содержание

- [Возможности](#возможности)
- [Технологии](#технологии)
- [Быстрый старт](#быстрый-старт)
- [Demo-аккаунты](#demo-аккаунты)
- [Demo-данные](#demo-данные)
- [Demo Flow для презентации](#demo-flow-для-презентации)
- [Настройка облачного Supabase](#настройка-облачного-supabase)
- [Деплой на Vercel](#деплой-на-vercel)
- [Deployment](#deployment)
- [Скрипты](#скрипты)
- [Архитектура](#архитектура)
- [REAL vs MOCK/DEMO](#real-vs-mockdemo)
- [Известные ограничения](#известные-ограничения)
- [Структура проекта](#структура-проекта)

---

## Возможности

### Для донора
- Просмотр актуальных запросов о помощи (офферов)
- Пожертвование через Mock Payment (демо)
- Раздел **«Мои пожертвования»** — история, прогресс финансирования, статусы
- Генерация QR-ваучера для получателя

### Для получателя (СУСН)
- Создание запросов о помощи (требуется верификация)
- Раздел **«Мои заявки»** — заявки, ваучеры, уведомления
- Генерация демо-ваучеров с QR-кодом (макс. 3 активных)
- Уведомления: «заявка профинансирована», «ваучер готов», «помощь получена»

### Для бизнес-партнёра
- **Панель партнёра** — статистика (активные ваучеры, погашено сегодня, всего помощи)
- Сканер/погашение ваучеров (ввод кода → проверка → Redeem)
- Защита от повторного погашения
- История погашений

### Для администратора
- **Admin Review** — список заявок на верификацию
- AI-результат как рекомендация (не окончательное решение)
- Approve / Reject с обновлением `profiles.verified`

---

## Технологии

- **Frontend:** React 18, Vite 5, TypeScript 5, TailwindCSS 3, React Router 6
- **Backend:** Supabase (PostgreSQL 15, Auth, RLS, Edge Functions)
- **QR:** `qrcode.react`
- **Иконки:** `lucide-react`
- **i18n:** kk / ru / en (строгая типизация через `TKey`)

---

## Быстрый старт

### 1. Установить зависимости

```bash
cd project
npm install
```

### 2. Настроить `.env`

Скопируйте `.env.example` в `.env` и заполните:

```env
# Frontend (Vite читает только VITE_ переменные)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Demo seed/reset (только server-side, НЕ попадает во frontend)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Применить миграции

```bash
# Локально:
supabase db push

# Облако (через Dashboard → SQL Editor):
# Вставить содержимое файлов из project/supabase/migrations/
```

### 4. Запустить dev-сервер

```bash
npm run dev
```

### 5. Создать demo-аккаунты

```bash
npm run demo:seed
```

---

## Demo-аккаунты

| Роль    | Email                          | Пароль    | Имя для отображения | Куда попадает после входа            |
| ------- | ------------------------------ | --------- | ------------------- | ------------------------------------ |
| Донор   | demo.donor@senim.test          | Demo1234! | Demo Donor          | «Мои пожертвования» (`/my-donations`) |
| СУСН    | demo.susn@senim.test           | Demo1234! | Demo Beneficiary    | «Мои заявки» (`/my-requests`)        |
| Партнёр | demo.partner@senim.test        | Demo1234! | Demo Partner        | «Панель партнёра» (`/partner-dashboard`) |
| Админ   | demo.admin@senim.test          | Demo1234! | Demo Admin          | «Админ» (`/admin`)                   |

> Пароль для всех аккаунтов: `Demo1234!`

### Как войти

1. На сайте нажмите **«Войти»** (не «Создать аккаунт»)
2. Введите email и пароль из таблицы выше
3. После входа в навбаре появятся пункты меню для вашей роли

> Роль `admin` нельзя выбрать при регистрации через UI — это защита от самовозвышения (миграция `20260802230000_secure_admin_and_ai_result.sql`). Demo-скрипт назначает `role='admin'` server-side через service role key.

---

## Demo-данные

### Офферы (campaigns)

| Название                   | Цель (₸) | Собрано (₸) | Статус  |
| -------------------------- | -------- | ----------- | ------- |
| Food Package for a Family  | 50 000   | 15 000      | active  |
| Medicine Support           | 30 000   | 25 000      | active  |
| Winter Coal Support        | 40 000   | 40 000      | funded  |

### Другие demo-данные

- **Demo Partner Store** — магазин-партнёр (Алматы, супермаркет)
- **Demo SUSN verification request** — pending-заявка с AI-результатом (для Admin Review)
- **Demo notifications** — 3 уведомления для СУСН (localStorage)

---

## Demo Flow для презентации

1. **Войти как Донор** (`demo.donor@senim.test`)
2. Открыть список офферов (`/browse`)
3. Открыть оффер → **Donate**
4. Выбрать сумму → **Mock Payment**
5. Завершить Mock Payment
6. Открыть **«Мои пожертвования»** → увидеть пожертвование, ID платежа, прогресс
7. **Войти как СУСН** (`demo.susn@senim.test`)
8. Открыть **«Мои заявки»** (`/my-requests`)
9. Показать уведомления (funded / voucher ready / help received)
10. Показать QR-ваучер (сгенерировать, если пусто)
11. **Войти как Партнёр** (`demo.partner@senim.test`)
12. Открыть **«Панель партнёра»** (`/partner-dashboard`)
13. Ввести код ваучера → **Scan** → Valid
14. **Redeem** → ваучер погашен
15. Попробовать погасить тот же код → «Already Redeemed»
16. **Войти как Админ** (`demo.admin@senim.test`)
17. Открыть **Admin Review** (`/admin`)
18. Показать pending-заявку + AI-результат
19. **Approve** (или **Reject**) → `verified` обновляется

---

## Настройка облачного Supabase

### 1. Создать проект на Supabase

1. Зайдите на [supabase.com](https://supabase.com)
2. Создайте новый проект
3. Дождитесь инициализации

### 2. Получить credentials

1. Dashboard → **Project Settings** → **API**
2. Скопируйте:
   - **Project URL** (вида `https://xxxxx.supabase.co`) → `SUPABASE_URL` и `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`
   - **service_role** secret key → `SUPABASE_SERVICE_ROLE_KEY`

> ⚠️ **Важно:** `service_role` key — это полный доступ к БД (обходит RLS). Никогда не коммитьте его в Git и не помещайте в `VITE_` переменные. Файл `.env` уже в `.gitignore`.

### 3. Применить миграции

**Вариант A — через CLI:**
```bash
supabase link --project-ref your-project-ref
supabase db push
```

**Вариант B — через Dashboard:**
1. Откройте Dashboard → **SQL Editor**
2. По очереди вставьте содержимое каждого файла из `project/supabase/migrations/`
3. Нажмите **Run** для каждого

> Особое внимание — миграция `20260803000000_demo_seed_helpers.sql` (создаёт RPC для demo seed/reset).

### 4. Заполнить `.env`

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...anon-key...

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...service-role-key...
```

### 5. Запустить demo:seed

```bash
npm run demo:seed
```

### 6. Запустить frontend

```bash
npm run dev
```

Откройте `http://localhost:5173` и войдите под любым demo-аккаунтом.

---

## Деплой на Vercel

### 1. Запушить проект на GitHub

```bash
git add .
git commit -m "SENIM MVP + demo accounts"
git push origin main
```

### 2. Импортировать в Vercel

1. Зайдите на [vercel.com](https://vercel.com)
2. **Add New** → **Project**
3. Выберите репозиторий SENIM
4. Настройки:
   - **Root Directory**: `project`
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### 3. Добавить переменные окружения

В Vercel → **Settings** → **Environment Variables** добавьте:

| Имя | Значение | Примечание |
|-----|----------|-----------|
| `VITE_SUPABASE_URL` | `https://your-project.supabase.co` | URL облачного Supabase |
| `VITE_SUPABASE_ANON_KEY` | `eyJ...anon-key...` | anon public key |

> ⚠️ **НЕ добавляйте** `SUPABASE_SERVICE_ROLE_KEY` в Vercel — он нужен только для локального `npm run demo:seed` и не должен попадать в frontend.

### 4. Деплой

Нажмите **Deploy**. Vercel соберёт проект и опубликует на `https://senim.vercel.app` (или подобный URL).

### 5. Создать demo-аккаунты (с локального компьютера)

Demo-аккаунты создаются локально через `npm run demo:seed` (нужен service_role key в `.env`). После этого они доступны и на Vercel — т.к. Supabase облачный.

```bash
# Локально:
npm run demo:seed
```

### 6. Проверить

Откройте URL Vercel → войдите под `demo.admin@senim.test` / `Demo1234!`

---

## Deployment

Раздел описывает конфигурацию деплоя frontend-части SENIM на Netlify / Cloudflare Pages (SPA). Конфигурационные файлы уже включены в репозиторий:

- `project/netlify.toml` — конфигурация сборки + SPA-redirects для Netlify
- `project/public/_redirects` — fallback SPA-redirects (Cloudflare Pages, а также резерв для Netlify)

### Frontend env vars

Обязательные переменные окружения для сборки frontend (уже описаны в `project/.env.example`):

| Имя | Значение | Примечание |
|-----|----------|-----------|
| `VITE_SUPABASE_URL` | `https://your-project.supabase.co` | URL облачного Supabase |
| `VITE_SUPABASE_ANON_KEY` | `eyJ...anon-key...` | anon public key |

> ⚠️ **НЕ добавляйте** `SUPABASE_SERVICE_ROLE_KEY` в переменные окружения хостинга — он нужен только для локальных скриптов `npm run demo:seed` / `demo:reset` и не должен попадать в frontend-бандл.

### Конфигурация сборки

| Параметр | Значение |
|----------|---------|
| Base directory | `project` |
| Build command | `npm run build` |
| Publish directory | `project/dist` |
| Framework preset | Vite |

### SPA routing (важно!)

Приложение использует client-side routing (React Router). Без SPA-fallback обновление страницы или прямой переход по URL (например, `/browse` или `/impact`) вернёт **404** на хостинге.

Решение включено в репозиторий:

- **Netlify** — `project/netlify.toml` содержит `[[redirects]]` с `from = "/*"` → `to = "/index.html"` (status 200)
- **Cloudflare Pages / fallback** — `project/public/_redirects` содержит `/*    /index.html   200` (Vite копирует `public/` в `dist/` при сборке)

> Проверка: после deploy preview откройте напрямую через адресную строку `/browse` или `/impact` (не кликом в приложении) — страница должна загрузиться без 404.

### Backend (Supabase)

- **Миграции** применяются через `supabase db push` против linked-проекта:

  ```bash
  supabase link --project-ref your-project-ref
  supabase db push
  ```

  Файлы миграций находятся в `project/supabase/migrations/`.

- **Edge Function `payment-webhook`** НЕ деплоится до выбора платёжного провайдера (задача TASK-013b). Сейчас единственный путь пожертвования — Mock Payment (симуляция без реальных денег). Функция `verify-susn-document` деплоится отдельно через `supabase functions deploy verify-susn-document`.

---

## Скрипты

| Команда              | Описание                                              |
| -------------------- | ----------------------------------------------------- |
| `npm run dev`        | Запуск dev-сервера (Vite)                             |
| `npm run build`      | Production-сборка                                     |
| `npm run preview`    | Предпросмотр production-сборки                        |
| `npm run typecheck`  | Проверка типов TypeScript                             |
| `npm run lint`       | ESLint                                                |
| `npm run demo:seed`  | Создать demo-аккаунты и данные (идемпотентно)         |
| `npm run demo:reset` | Удалить ТОЛЬКО demo-данные (не трогает реальные)       |

---

## Архитектура

### Таблицы БД

| Таблица                       | Назначение                                         |
| ----------------------------- | -------------------------------------------------- |
| `profiles`                    | Профили пользователей (role, verified, is_demo)   |
| `campaigns`                   | Офферы/запросы о помощи (goal, raised, status)     |
| `partners`                    | Магазины-партнёры                                  |
| `donation_intents`            | Записи о пожертвованиях (donor, amount, status)    |
| `susn_verification_requests`  | Заявки на верификацию СУСН (status, ai_result)     |
| `partner_applications`        | Заявки бизнес-партнёров                            |
| `transactions`                | Лента транзакций (публичная)                       |
| `platform_stats`              | Статистика платформы (одна строка)                 |

### Безопасность

- **RLS** включён на всех таблицах
- `profiles.role` и `profiles.verified` нельзя изменить с клиента (column-level GRANT)
- Триггер `handle_new_user` блокирует `role='admin'` из клиентских metadata
- `record_mock_donation` RPC — атомарно обновляет `raised_amount` и `status`
- `admin_review_application` RPC — единственный путь изменить `verified`
- Demo RPC (`upsert_demo_profile`, и т.д.) — SECURITY DEFINER, REVOKE от anon/authenticated

### Edge Functions

- `payment-webhook` — webhook для реальных платежей (вызывает `confirm_donation`)
- `verify-susn-document` — AI-верификация документов (записывает `ai_result`)

---

## REAL vs MOCK/DEMO

### REAL (на уровне БД + RLS)
- Auth (Supabase Auth — реальный вход, JWT-сессии)
- `profiles` (role, verified) — role/verified назначаются только server-side
- `campaigns` (офферы) — реальные строки в БД
- `donation_intents` — реальные строки, создаются через `record_mock_donation` RPC
- `record_mock_donation` RPC — атомарно увеличивает `raised_amount`, переводит `status` в `funded`
- Admin Review — реальные RPC (`admin_list_verification_requests`, `admin_review_application`)
- RLS на всех таблицах

### MOCK / DEMO (помечено в UI)
- **Mock Payment** (`MockPaymentModal`) — симулирует платёж, без реальных денег
- **QR-ваучеры** — хранятся в `localStorage` (`senim_demo_vouchers`), не в БД
- **Статистика панели партнёра** — вычисляется из localStorage demo-ваучеров
- **Уведомления СУСН** — хранятся в `localStorage` (`senim_demo_notifications_{userId}`)
- **Demo seed-данные** — 4 аккаунта, 3 оффера, 1 партнёр, 1 заявка на верификацию

---

## Известные ограничения

- **QR-ваучеры только в localStorage**: ваучеры существуют в рамках одного браузера. Донор/СУСН и партнёр должны использовать один браузер для demo скан/погашение.
- **Нет реального платёжного провайдера**: Mock Payment — единственный путь. `confirm_donation` (service-role webhook RPC) существует, но реальный webhook не подключён.
- **Нет таблицы `notifications`**: уведомления СУСН — только demo (localStorage).
- **Статистика панели партнёра — demo**: отражает localStorage-ваучеры, а не серверный агрегат.
- **Admin Review покрывает только верификацию СУСН**: `partner_applications` не показываются в Admin Review.
- **«Помощь доставлена» — приближение**: показывается, когда кампания `funded` и связанный demo-ваучер погашен в том же браузере.
- **Email-подтверждение**: demo-пользователи создаются с `email_confirm: true` через Admin API.
- **Не проверено в production**: тестировалось только локально.

---

## Структура проекта

```
SENIM/
├── DEMO_ACCOUNTS.md           # Demo-аккаунты и flow
├── README.md                  # Этот файл
└── project/
    ├── .env                   # Переменные окружения (не в Git)
    ├── .env.example           # Шаблон .env
    ├── package.json           # Скрипты и зависимости
    ├── index.html
    ├── vite.config.ts
    ├── tsconfig.json
    ├── eslint.config.js
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── scripts/
    │   ├── demo-seed.mjs      # Создание demo-данных
    │   └── demo-reset.mjs     # Удаление demo-данных
    ├── src/
    │   ├── main.tsx
    │   ├── App.tsx            # Маршруты
    │   ├── components/
    │   │   ├── Navbar.tsx
    │   │   ├── Footer.tsx
    │   │   ├── AuthModal.tsx
    │   │   ├── DonationModal.tsx
    │   │   ├── MockPaymentModal.tsx
    │   │   ├── VoucherQR.tsx
    │   │   ├── ProtectedRoute.tsx
    │   │   └── VerificationBadge.tsx
    │   ├── pages/
    │   │   ├── LandingPage.tsx
    │   │   ├── BrowseRequests.tsx
    │   │   ├── ImpactDashboard.tsx
    │   │   ├── CreateRequest.tsx
    │   │   ├── PartnerStores.tsx
    │   │   ├── PartnerDashboard.tsx
    │   │   ├── MyDonations.tsx
    │   │   ├── MyRequests.tsx
    │   │   ├── AdminReview.tsx
    │   │   ├── Terms.tsx
    │   │   └── Privacy.tsx
    │   └── lib/
    │       ├── supabase.ts
    │       ├── auth.tsx
    │       ├── i18n.tsx
    │       ├── types.ts
    │       ├── payment-provider.ts
    │       ├── voucher-demo.ts
    │       ├── demo-notifications.ts
    │       ├── i18n-text.ts
    │       ├── cities.ts
    │       └── i18n/
    │           ├── kk.json
    │           ├── ru.json
    │           └── en.json
    └── supabase/
        ├── config.toml
        ├── functions/
        │   ├── payment-webhook/
        │   └── verify-susn-document/
        └── migrations/
            ├── 20260731034324_create_senim_schema.sql
            ├── 20260731063554_harden_rls_and_donation_intents.sql
            ├── 20260801075240_susn_verification_review.sql
            ├── 20260801083054_partner_applications.sql
            ├── 20260801093050_susn_campaign_verified_rls.sql
            ├── 20260801112600_campaign_i18n_columns.sql
            ├── 20260801141200_atomic_profile_creation.sql
            ├── 20260802120000_admin_review_demo.sql
            ├── 20260802230000_secure_admin_and_ai_result.sql
            ├── 20260802233000_campaign_creator_id.sql
            ├── 20260802234000_fix_handle_new_user_metadata_column.sql
            ├── 20260802240000_payment_reconciliation.sql
            ├── 20260802250000_mock_donation_funding.sql
            └── 20260803000000_demo_seed_helpers.sql
```

---

## Лицензия

Проект SENIM. Все права защищены © 2026.