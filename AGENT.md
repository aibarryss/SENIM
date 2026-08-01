# AGENT.md — Руководство для ИИ-агентов по проекту SENIM

> Этот файл содержит всю ключевую информацию о проекте SENIM, необходимую ИИ-агентам для эффективной работы: обзор, стек, структуру, архитектуру, конвенции и чек-листы.

---

## 1. Обзор проекта

**SENIM** — благотворительная платформа (Казахстан), где пожертвования превращаются в реальные товары (продукты питания, лекарства), а не в «неотслеживаемые деньги». Платформа связывает три типа пользователей: доноров, нуждающихся (SUSN — социально уязвимые слои населения) и магазины-партнёры.

**Миссия** (из `README.md`):

> Негізгі миссиясы: Қайырымдылық саласындағы адам факторын толықтай жойып, мұқтаж жандарға көмек көрсету процесін 100% ашық, қауіпсіз және мақсатты ету.

Перевод: полностью устранить человеческий фактор в благотворительности, сделать процесс помощи нуждающимся на 100% прозрачным, безопасным и целевым.

**Ключевые принципы:**

- Пожертвования конвертируются в реальные товары (AI-проверенные продукты и лекарства)
- 100% прозрачность и отсутствие мошенничества
- Многоязычность: казахский (kk), русский (ru), английский (en)
- Казахский — язык по умолчанию и источник истины для переводов

---

## 2. Стек технологий

| Категория | Технология | Версия |
|-----------|-----------|--------|
| Сборщик | Vite | ^5.4.2 |
| Фреймворк | React | ^18.3.1 |
| Язык | TypeScript | ^5.5.3 |
| Backend/BaaS | Supabase (`@supabase/supabase-js`) | ^2.57.4 |
| Роутинг | React Router DOM | ^6.30.4 |
| Стилизация | Tailwind CSS + PostCSS + Autoprefixer | ^3.4.1 / ^8.4.35 / ^10.4.18 |
| Иконки | Lucide React | ^0.344.0 |
| Линтинг | ESLint 9 + typescript-eslint + react-hooks/react-refresh plugins | ^9.9.1 / ^8.3.0 |
| Типы | `@types/react` ^18.3.5, `@types/react-dom` ^18.3.0 |

**Тип проекта:** SPA (Single Page Application), ESM (`"type": "module"`).

---

## 3. Структура проекта

```
SENIM/
├── README.md                          # Миссия проекта (на казахском)
├── AGENT.md                           # Этот файл — руководство для ИИ-агентов
└── project/                           # Vite-проект фронтенда
    ├── package.json                   # Зависимости и npm-скрипты
    ├── package-lock.json
    ├── index.html                     # HTML-шаблон (lang="kk")
    ├── vite.config.ts                 # Конфигурация Vite + алиас @
    ├── tsconfig.json                  # Базовый TS-конфиг
    ├── tsconfig.app.json              # TS-конфиг для приложения
    ├── tsconfig.node.json             # TS-конфиг для Node-окружения
    ├── eslint.config.js               # Конфигурация ESLint 9 (flat config)
    ├── postcss.config.js              # PostCSS (tailwindcss + autoprefixer)
    ├── tailwind.config.js             # Конфигурация Tailwind
    ├── .gitignore
    ├── src/
    │   ├── App.tsx                    # Корневой компонент: провайдеры + роутинг + модалки
    │   ├── main.tsx                   # Точка входа: createRoot + I18nProvider
    │   ├── index.css                  # Tailwind директивы + глобальные стили
    │   ├── vite-env.d.ts              # Типы Vite (vite/client)
    │   ├── components/
    │   │   ├── AuthModal.tsx          # Модалка входа/регистрации (3 роли)
    │   │   ├── DonationModal.tsx      # Модалка пожертвования (3 типа платежа)
    │   │   ├── Footer.tsx             # Подвал: ссылки, соцсети, магазины приложений
    │   │   └── Navbar.tsx             # Шапка: навигация, переключатель языка, login/donate
    │   ├── lib/
    │   │   ├── auth.tsx               # AuthProvider/useAuth (Supabase auth + profiles)
    │   │   ├── i18n.tsx               # I18nProvider/useI18n (kk/ru/en, плюрализация)
    │   │   ├── supabase.ts            # Создание Supabase-клиента из env
    │   │   ├── types.ts               # Доменные типы (Campaign, Profile, DonationIntent…)
    │   │   └── i18n/
    │   │       ├── kk.json            # Казахский — источник истины
    │   │       ├── ru.json            # Русский перевод
    │   │       └── en.json            # Английский перевод
    │   └── pages/
    │       ├── LandingPage.tsx        # Главная (посадочная) страница
    │       ├── BrowseRequests.tsx     # Просмотр запросов помощи + фильтры
    │       └── ImpactDashboard.tsx    # Дашборд влияния/статистики
    └── supabase/
        ├── migrations/
        │   ├── 20260731034324_create_senim_schema.sql       # Начальная схема (5 таблиц)
        │   └── 20260731063554_harden_rls_and_donation_intents.sql  # RLS + donation_intents
        └── snippets/
            └── Untitled query 833.sql                        # Диагностический запрос
```

---

## 4. Команды разработки

> **Важно:** Все команды выполняются из директории `project/`.

```bash
cd project

# Установка зависимостей
npm install

# Запуск dev-сервера (Vite)
npm run dev

# Сборка production-версии
npm run build

# Проверка типов (без эмиссии файлов)
npm run typecheck

# Линтинг
npm run lint

# Локальный preview production-сборки
npm run preview
```

**Скрипты из `package.json`:**

| Скрипт | Команда | Назначение |
|--------|---------|-----------|
| `dev` | `vite` | Dev-сервер с HMR |
| `build` | `vite build` | Production-сборка |
| `lint` | `eslint .` | Проверка ESLint |
| `preview` | `vite preview` | Preview собранной версии |
| `typecheck` | `tsc --noEmit -p tsconfig.app.json` | Проверка типов TypeScript |

---

## 5. Переменные окружения

Supabase-клиент (`project/src/lib/supabase.ts`) читает две Vite-переменные:

```ts
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
```

| Переменная | Назначение |
|-----------|-----------|
| `VITE_SUPABASE_URL` | URL проекта Supabase |
| `VITE_SUPABASE_ANON_KEY` | Anon-ключ Supabase (доступ регулируется RLS) |

**Создайте файл `.env`** в директории `project/` (он в `.gitignore`):

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

> Используется только anon-key — весь доступ к данным регулируется RLS-политиками на стороне Supabase. Сервисная роль (service_role key) **не используется** на фронтенде.

---

## 6. Архитектура фронтенда

### 6.1. Точка входа и провайдеры

**`main.tsx`** — точка входа. Оборачивает `App` в `I18nProvider` и рендерит через `createRoot`.

**`App.tsx`** — корневой компонент. Структура провайдеров:

```
I18nProvider (в main.tsx)
  └── AuthProvider (в App.tsx)
      └── BrowserRouter
          └── Navbar + Routes + Footer + AuthModal + DonationModal
```

### 6.2. Роутинг

React Router DOM v6. Три маршрута:

| Путь | Компонент | Назначение |
|------|-----------|-----------|
| `/` | `LandingPage` | Главная страница (миссия, фичи, статистика, CTA) |
| `/browse` | `BrowseRequests` | Просмотр запросов помощи с фильтрами |
| `/impact` | `ImpactDashboard` | Дашборд статистики и влияния |

### 6.3. Глобальное состояние модалок

Модалки (`AuthModal`, `DonationModal`) управляются на уровне `App.tsx` через `useState`:

- `authOpen` — открыта ли модалка входа/регистрации
- `donationCampaign` — кампания для пожертвования (или `null`)

Функции `openAuth()` и `openDonate()` передаются вниз через props.

### 6.4. Компоненты

#### `Navbar.tsx`
- Шапка сайта с навигацией
- Переключатель языка (kk/ru/en) через `useI18n().setLocale`
- Кнопки "Login" и "Donate"
- Props: `onLoginClick`, `onDonateClick`

#### `Footer.tsx`
- Подвал: ссылки, соцсети, кнопки магазинов приложений
- Статичный компонент

#### `AuthModal.tsx`
- Модалка входа/регистрации
- Поддержка 3 ролей: `donor`, `susn`, `partner`
- Использует `useAuth().signUp` и `useAuth().signIn`
- Props: `open`, `onClose`

#### `DonationModal.tsx`
- Модалка пожертвования
- 3 типа платежа: `full`, `partial`, `subscription`
- Props: `campaign`, `open`, `onClose`, `onRequireAuth`

### 6.5. Страницы

#### `LandingPage.tsx`
- Hero-секция с CTA-кнопками
- Секция возможностей (3 карточки: "Запросить помощь", "Стать волонтёром", "Отслеживать влияние")
- Секция статистики (4 метрики — захардкоженные демо-данные)
- Финальная CTA-секция
- Props: `onLoginClick`

#### `BrowseRequests.tsx`
- Просмотр запросов помощи с фильтрацией
- Загружает данные из Supabase (таблица `campaigns`)
- Props: `onDonateClick`

#### `ImpactDashboard.tsx`
- Дашборд влияния/статистики
- Загружает данные из Supabase (таблица `platform_stats`, `transactions`)

---

## 7. Библиотеки и утилиты (`src/lib`)

### 7.1. Supabase-клиент (`supabase.ts`)

Минимальная обёртка над `@supabase/supabase-js`. Один экземпляр клиента на всё приложение:

```ts
import { createClient } from '@supabase/supabase-js';
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
```

### 7.2. Аутентификация (`auth.tsx`)

`AuthProvider` + хук `useAuth()`. Контекст:

```ts
interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email, password, role: UserRole, displayName?) => Promise<{ error: string | null }>;
  signIn: (email, password) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}
```

**Поток аутентификации:**

1. `signUp` — регистрация через `supabase.auth.signUp`, затем вставка записи в таблицу `profiles` с `id = user.id`, `role`, `display_name`, `verified: false`
2. `signIn` — вход через `supabase.auth.signInWithPassword`
3. `onAuthStateChange` — слушатель обновляет `session` и загружает `profile` из таблицы `profiles` (через `.maybeSingle()`)
4. `signOut` — выход + очистка `profile`

> **Важно:** `useAuth` выбрасывает ошибку, если вызван вне `AuthProvider`.

### 7.3. Интернационализация (`i18n.tsx`)

`I18nProvider` + хук `useI18n()`. Поддержка 3 языков: `kk` (по умолчанию), `ru`, `en`.

**Ключевые особенности:**

- **`kk.json` — источник истины.** Тип `Dict = typeof kk` гарантирует, что `ru.json` и `en.json` структурно совпадают (compile-time ошибка при расхождении).
- **Типобезопасные ключи:** `TKey` — union всех dot-путей к строковым листьям (например, `'nav.donate' | 'impact.time.minute.one'`).
- **Интерполяция:** `t('key', { param: 'value' })` — подстановка `{param}` в строку.
- **Плюрализация:** `tp('impact.time.minute', 5)` — русская система множественного числа (`one` / `few` / `many`), работает для всех 3 языков.
- **Хранение:** язык сохраняется в `localStorage` под ключом `senim-locale`.
- **Побочные эффекты:** при смене языка обновляются `document.documentElement.lang` и `document.title`.

```ts
interface I18nContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: TKey, params?: Record<string, string | number>) => string;
  tp: (base: TimeBase, n: number) => string;
}
```

> **Важно:** `useI18n` выбрасывает ошибку, если вызван вне `I18nProvider`.

### 7.4. Доменные типы (`types.ts`)

```ts
// Роли пользователей
type UserRole = 'donor' | 'susn' | 'partner';

// Категории кампаний
type CampaignCategory = 'grocery' | 'medicine' | 'winter' | 'education';

// Срочность кампании
type CampaignUrgency = 'urgent' | 'high_priority' | 'verified' | null;

// Статус кампании
type CampaignStatus = 'active' | 'funded' | 'completed';
```

| Интерфейс | Назначение | Ключевые поля |
|-----------|-----------|---------------|
| `Campaign` | Запрос помощи | `id, title, description, category, region, goal_amount, raised_amount, urgency, status, image_url, partner_id, created_at` |
| `Transaction` | Транзакция | `id, type ('voucher_redemption' \| 'medicine_purchase' \| 'utility_payment'), voucher_number, store_name, city, amount, created_at` |
| `PlatformStats` | Статистика платформы | `id, food_baskets_today, verified_aid_almaty, active_qr_vouchers, families_helped, partner_retailers` |
| `Partner` | Магазин-партнёр | `id, name, type, city, logo_letter, logo_color` |
| `Profile` | Профиль пользователя | `id, role, display_name, phone, verified, created_at` |
| `DonationIntent` | Намерение пожертвования | `id, donor_id, campaign_id, amount, payment_type ('full' \| 'partial' \| 'subscription'), status ('pending' \| 'confirmed' \| 'rejected'), created_at` |

---

## 8. База данных Supabase

### 8.1. Обзор

- Схема: `public`
- Всего таблиц: **6**
- RLS (Row Level Security): **включён на всех таблицах**
- Функций и триггеров в миграциях **не определено** — вся логика на стороне приложения/сервисной роли

### 8.2. Таблицы

#### `partners` — магазины-партнёры
| Колонка | Тип | Описание |
|---------|-----|----------|
| `id` | uuid (PK) | `gen_random_uuid()` |
| `name` | text | Название |
| `type` | text | Тип: `supermarket`, `pharmacy`, `clothing`, `education` |
| `city` | text | Город (по умолчанию `Almaty`) |
| `logo_letter` | text | Буква для логотипа |
| `logo_color` | text | Цвет логотипа |
| `created_at` | timestamptz | `now()` |

#### `profiles` — профили пользователей
| Колонка | Тип | Описание |
|---------|-----|----------|
| `id` | uuid (PK) | Совпадает с `auth.users.id` |
| `role` | text | `donor`, `susn`, `partner` |
| `display_name` | text | Отображаемое имя |
| `phone` | text | Телефон |
| `verified` | boolean | Верификация |
| `created_at` | timestamptz | `now()` |

#### `campaigns` — запросы помощи / кампании
| Колонка | Тип | Описание |
|---------|-----|----------|
| `id` | uuid (PK) | |
| `title` | text | Заголовок |
| `description` | text | Описание |
| `category` | text | `grocery`, `medicine`, `winter`, `education` |
| `region` | text | Регион |
| `goal_amount` | numeric | Целевая сумма |
| `raised_amount` | numeric | Собранная сумма |
| `urgency` | text | `urgent`, `high_priority`, `verified`, null |
| `status` | text | `active`, `funded`, `completed` |
| `image_url` | text | URL изображения |
| `partner_id` | uuid (FK → partners) | Связь с партнёром |
| `created_at` | timestamptz | `now()` |

#### `transactions` — транзакции
| Колонка | Тип | Описание |
|---------|-----|----------|
| `id` | uuid (PK) | |
| `type` | text | `voucher_redemption`, `medicine_purchase`, `utility_payment` |
| `voucher_number` | text | Номер ваучера |
| `store_name` | text | Название магазина |
| `city` | text | Город |
| `amount` | numeric | Сумма |
| `created_at` | timestamptz | `now()` |

#### `platform_stats` — статистика платформы
| Колонка | Тип | Описание |
|---------|-----|----------|
| `id` | int (PK) | |
| `food_baskets_today` | int | Продуктовых корзин сегодня |
| `verified_aid_almaty` | int | Проверенная помощь в Алматы |
| `active_qr_vouchers` | int | Активных QR-ваучеров |
| `families_helped` | int | Помогли семей |
| `partner_retailers` | int | Партнёров-ритейлеров |

#### `donation_intents` — намерения пожертвований (добавлена во 2-й миграции)
| Колонка | Тип | Описание |
|---------|-----|----------|
| `id` | uuid (PK) | |
| `donor_id` | uuid | ID донора |
| `campaign_id` | uuid | ID кампании |
| `amount` | numeric | Сумма |
| `payment_type` | text | `full`, `partial`, `subscription` |
| `status` | text | `pending`, `confirmed`, `rejected` |
| `created_at` | timestamptz | `now()` |

### 8.3. RLS-политики

RLS включён на всех таблицах. Ключевые политики (из второй миграции):

- **`profiles`**: пользователь может читать и обновлять только свою запись (`id = auth.uid()`)
- **`campaigns`**: публичное чтение (select for all), запись — только авторизованные / сервисная роль
- **`donation_intents`**: донор видит только свои намерения (`donor_id = auth.uid()`)
- **`partners`**, **`transactions`**, **`platform_stats`**: публичное чтение

> **Точные политики см. в файлах миграций.** При изменении схемы всегда проверяйте RLS.

### 8.4. Миграции

| Файл | Назначение |
|------|-----------|
| `20260731034324_create_senim_schema.sql` | Начальная схема: 5 таблиц (`partners`, `profiles`, `campaigns`, `transactions`, `platform_stats`) + RLS |
| `20260731063554_harden_rls_and_donation_intents.sql` | Усиление RLS-политик + добавление таблицы `donation_intents` |

---

## 9. Конфигурация

### 9.1. Vite (`vite.config.ts`)

- Плагин `@vitejs/plugin-react`
- Алиас пути: `@` → `./src` (используется во всех импортах: `@/lib/...`, `@/components/...`, `@/pages/...`)

### 9.2. TypeScript

- `tsconfig.json` — базовый, ссылается на `tsconfig.app.json` и `tsconfig.node.json`
- `tsconfig.app.json` — конфиг для приложения (строгий режим, target ES2020)
- `tsconfig.node.json` — конфиг для Node-окружения (vite.config.ts)
- Проверка типов: `npm run typecheck` (`tsc --noEmit -p tsconfig.app.json`)

### 9.3. ESLint (`eslint.config.js`)

- Flat config (ESLint 9)
- Плагины: `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`
- Запуск: `npm run lint` (`eslint .`)

### 9.4. Tailwind CSS (`tailwind.config.js`)

- Content: `./index.html`, `./src/**/*.{js,ts,jsx,tsx}`
- Используется во всех компонентах через className-утилиты

### 9.5. PostCSS (`postcss.config.js`)

- Плагины: `tailwindcss` + `autoprefixer`

---

## 10. Конвенции и правила

### 10.1. Импорты

- Использовать алиас `@` для всех импортов из `src/`:
  ```ts
  // ✅ Правильно
  import { supabase } from '@/lib/supabase';
  import type { Campaign } from '@/lib/types';

  // ❌ Неправильно
  import { supabase } from '../../lib/supabase';
  ```

### 10.2. i18n — правила переводов

- **`kk.json` — источник истины.** Все новые ключи сначала добавляются в `kk.json`.
- `ru.json` и `en.json` должны **структурно совпадать** с `kk.json` — TypeScript выдаст ошибку при расхождении.
- Использовать типобезопасные ключи через `t('nav.donate')` — автодополнение и проверка на этапе компиляции.
- Для плюрализации использовать `tp('impact.time.minute', n)` — не писать условную логику вручную.
- Все пользовательские строки должны быть переведены на 3 языка. **Никакого хардкода текста** в компонентах.

### 10.3. Аутентификация

- Всегда использовать хук `useAuth()` — никогда не вызывайте `supabase.auth` напрямую в компонентах.
- Проверять `loading` перед рендером зависимого от auth UI.
- Проверять `profile?.role` для role-based логики.
- При регистрации обязательно передавать `role` — это записывается в таблицу `profiles`.

### 10.4. Доступ к данным Supabase

- Использовать только anon-key на фронтенде — доступ регулируется RLS.
- Никогда не использовать service_role key на фронтенде.
- При добавлении новых таблиц — **обязательно включать RLS** и определять политики.
- Использовать `.maybeSingle()` для запросов, где ожидается 0 или 1 запись.

### 10.5. Стилизация

- Использовать Tailwind CSS utility-классы — **никакого кастомного CSS** кроме `index.css`.
- Следовать существующим паттернам стилизации в компонентах.
- Адаптивность через Tailwind-брейкпоинты (`sm:`, `md:`, `lg:`, `xl:`).

### 10.6. Типы

- Все доменные типы — в `src/lib/types.ts`.
- Использовать `type` для импорта типов: `import type { Campaign } from '@/lib/types'`.
- Строгая типизация — никаких `any` без веской причины.

### 10.7. Роутинг

- Все маршруты определены в `App.tsx`.
- При добавлении новой страницы — добавить маршрут в `App.tsx` и ссылку в `Navbar.tsx`.

---

## 11. Чек-лист для ИИ-агентов

Перед завершением работы над задачей проверьте:

### Код
- [ ] Импорты используют алиас `@/` (не относительные пути `../../`)
- [ ] Типы импортируются через `import type { ... }`
- [ ] Нет хардкода пользовательских строк — все тексты через `t('key')`
- [ ] Новые ключи i18n добавлены во все 3 файла: `kk.json`, `ru.json`, `en.json`
- [ ] Нет прямых вызовов `supabase.auth` в компонентах — только через `useAuth()`
- [ ] Нет `any` без веской причины
- [ ] Стилизация через Tailwind-классы (не кастомный CSS)

### Проверка
- [ ] `npm run typecheck` проходит без ошибок
- [ ] `npm run lint` проходит без ошибок
- [ ] `npm run build` проходит без ошибок

### База данных (если затронута)
- [ ] RLS включён на всех новых таблицах
- [ ] Определены RLS-политики для всех новых таблиц
- [ ] Миграция создана в `project/supabase/migrations/` с корректным timestamp-префиксом
- [ ] Доменные типы в `src/lib/types.ts` обновлены в соответствии со схемой

### Компоненты (если добавлены/изменены)
- [ ] Компонент использует `useI18n()` для переводов
- [ ] Компонент использует `useAuth()` для аутентификации (если нужен)
- [ ] Props типизированы через interface/type
- [ ] Следует существующим паттернам проекта (модалки, страницы, navbar)

---

## 12. Полезные ссылки

| Ресурс | Назначение |
|--------|-----------|
| [Vite docs](https://vitejs.dev/) | Документация Vite |
| [Supabase docs](https://supabase.com/docs) | Документация Supabase |
| [React Router v6](https://reactrouter.com/en/6.30.4) | Документация React Router |
| [Tailwind CSS](https://tailwindcss.com/docs) | Документация Tailwind |
| [TypeScript](https://www.typescriptlang.org/docs/) | Документация TypeScript |

---

*Этот файл поддерживается вручную. При значительных изменениях архитектуры обновляйте `AGENT.md`.*