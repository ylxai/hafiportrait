# Neon Database Schema Report

**Project:** `hafiportrait`
**Branch:** `br-wispy-water-a4nh7tqg` (production)
**Generated:** 2025-12-17

## Tables Overview

The database contains the following tables in the `public` schema:

1.  `events`
2.  `photos`
3.  `users`
4.  `comments`
5.  `guest_sessions`
6.  `contact_messages`
7.  `form_submissions`
8.  `packages`
9.  `package_categories`
10. `pricing_packages`
11. `hero_slideshow`
12. `slideshow_settings`
13. `event_settings`
14. `additional_services`
15. `portfolio_photos`
16. `refresh_tokens`
17. `photo_likes`
18. `photo_views`
19. `photo_downloads`
20. `bottom_navigation_settings` (Not fully detailed below)
21. `guest_downloads` (Not fully detailed below)
22. `newsletter_subscribers` (Not fully detailed below)

---

## Detailed Table Schemas

### 1. `events`

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| `id` | text | NO | - |
| `name` | text | NO | - |
| `slug` | text | NO | - |
| `access_code` | text | NO | - |
| `qr_code_url` | text | YES | - |
| `storage_duration_days` | integer | NO | 30 |
| `status` | USER-DEFINED | NO | 'DRAFT' |
| `created_at` | timestamp | NO | now() |
| `updated_at` | timestamp | NO | - |
| `expires_at` | timestamp | YES | - |
| `client_id` | text | NO | - |
| `client_email` | text | YES | - |
| `client_phone` | text | YES | - |
| `description` | text | YES | - |
| `event_date` | timestamp | YES | - |
| `location` | text | YES | - |
| `cover_photo_id` | text | YES | - |

**Indexes:**
- `events_pkey` (id)
- `events_slug_key` (slug)
- `events_access_code_key` (access_code)

---

### 2. `photos`

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| `id` | text | NO | - |
| `filename` | text | NO | - |
| `original_url` | text | NO | - |
| `thumbnail_url` | text | YES | - |
| `display_order` | integer | NO | 0 |
| `likes_count` | integer | NO | 0 |
| `created_at` | timestamp | NO | now() |
| `updated_at` | timestamp | NO | - |
| `event_id` | text | NO | - |
| `caption` | text | YES | - |
| `deleted_at` | timestamp | YES | - |
| `download_count` | integer | NO | 0 |
| `file_size` | integer | YES | - |
| `height` | integer | YES | - |
| `is_featured` | boolean | NO | false |
| `mime_type` | text | YES | - |
| `thumbnail_large_url` | text | YES | - |
| `thumbnail_medium_url` | text | YES | - |
| `thumbnail_small_url` | text | YES | - |
| `uploaded_by_id` | text | YES | - |
| `views_count` | integer | NO | 0 |
| `width` | integer | YES | - |
| `exif_data` | jsonb | YES | - |
| `deleted_by_id` | text | YES | - |
| `deleted_by` | text | YES | - |

**Indexes:**
- `photos_pkey` (id)
- `photos_event_id_idx` (event_id)
- `photos_display_order_idx` (display_order)

---

### 3. `users`

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| `id` | text | NO | - |
| `email` | text | NO | - |
| `password_hash` | text | NO | - |
| `name` | text | NO | - |
| `role` | USER-DEFINED | NO | 'CLIENT' |
| `created_at` | timestamp | NO | now() |
| `updated_at` | timestamp | NO | - |
| `username` | text | YES | - |

**Indexes:**
- `users_pkey` (id)
- `users_email_key` (email)
- `users_username_key` (username)

---

### 4. `comments`

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| `id` | text | NO | - |
| `guest_name` | text | NO | - |
| `message` | text | NO | - |
| `created_at` | timestamp | NO | now() |
| `event_id` | text | NO | - |
| `photo_id` | text | YES | - |
| `email` | text | YES | - |
| `guest_id` | text | NO | - |
| `ip_address` | text | YES | - |
| `relationship` | text | YES | - |
| `status` | text | NO | 'approved' |
| `updated_at` | timestamp | NO | - |

**Indexes:**
- `comments_pkey` (id)
- `comments_event_id_idx` (event_id)

---

### 5. `guest_sessions`

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| `id` | text | NO | - |
| `session_id` | text | NO | - |
| `event_id` | text | NO | - |
| `guest_token` | text | NO | - |
| `ip_address` | text | YES | - |
| `user_agent` | text | YES | - |
| `created_at` | timestamp | NO | now() |
| `expires_at` | timestamp | NO | - |
| `last_access_at` | timestamp | NO | now() |

**Indexes:**
- `guest_sessions_pkey` (id)
- `guest_sessions_session_id_key` (session_id)

---

### 6. `contact_messages`

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| `id` | text | NO | - |
| `name` | text | NO | - |
| `email` | text | NO | - |
| `phone` | text | YES | - |
| `message` | text | NO | - |
| `status` | text | NO | 'new' |
| `created_at` | timestamp | NO | now() |
| `updated_at` | timestamp | NO | - |

---

### 7. `form_submissions`

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| `id` | text | NO | - |
| `name` | varchar | NO | - |
| `whatsapp` | varchar | NO | - |
| `email` | varchar | NO | - |
| `package_interest` | varchar | YES | - |
| `wedding_date` | varchar | YES | - |
| `message` | text | YES | - |
| `status` | varchar | NO | 'new' |
| `notes` | text | YES | - |
| `created_at` | timestamp | NO | now() |
| `updated_at` | timestamp | NO | - |

---

### 8. `packages`

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| `id` | text | NO | - |
| `name` | text | NO | - |
| `description` | text | YES | - |
| `price` | integer | NO | - |
| `features` | jsonb | NO | '[]' |
| `is_best_seller` | boolean | NO | false |
| `is_active` | boolean | NO | true |
| `display_order` | integer | NO | 0 |
| `category_id` | text | NO | - |
| `created_at` | timestamp | NO | now() |
| `updated_at` | timestamp | NO | - |

**Indexes:**
- `packages_category_id_idx` (category_id)

---

### 9. `package_categories`

> **Note:** This table uses camelCase for some columns.

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| `id` | text | NO | - |
| `name` | text | NO | - |
| `slug` | text | NO | - |
| `icon` | text | YES | - |
| `displayOrder` | integer | NO | 0 |
| `isActive` | boolean | NO | true |
| `created_at` | timestamp | NO | now() |
| `updated_at` | timestamp | NO | - |

**Indexes:**
- `package_categories_slug_key` (slug)

---

### 10. `pricing_packages`

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| `id` | text | NO | - |
| `name` | text | NO | - |
| `slug` | text | NO | - |
| `category` | text | NO | - |
| `price` | numeric | NO | - |
| `currency` | text | NO | 'IDR' |
| `description` | text | YES | - |
| `duration` | text | YES | - |
| `shot_count` | integer | YES | - |
| `features` | jsonb | NO | '[]' |
| `is_active` | boolean | NO | true |
| `display_order` | integer | NO | 0 |
| `created_at` | timestamp | NO | now() |
| `updated_at` | timestamp | NO | - |

---

### 11. `hero_slideshow`

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| `id` | text | NO | - |
| `image_url` | varchar | NO | - |
| `thumbnail_url` | varchar | YES | - |
| `display_order` | integer | NO | 0 |
| `title` | varchar | YES | - |
| `subtitle` | varchar | YES | - |
| `is_active` | boolean | NO | true |
| `created_at` | timestamp | NO | now() |
| `updated_at` | timestamp | NO | - |

---

### 12. `slideshow_settings`

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| `id` | text | NO | - |
| `timing_seconds` | integer | NO | 5 |
| `transition_effect` | varchar | NO | 'fade' |
| `autoplay` | boolean | NO | true |
| `created_at` | timestamp | NO | now() |
| `updated_at` | timestamp | NO | - |

---

### 13. `event_settings`

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| `id` | text | NO | - |
| `event_id` | text | NO | - |
| `allow_guest_downloads` | boolean | NO | true |
| `allow_guest_likes` | boolean | NO | true |
| `allow_guest_comments` | boolean | NO | false |
| `require_comment_moderation` | boolean | NO | false |
| `require_password_access` | boolean | NO | false |
| `access_password` | text | YES | - |
| `welcome_message` | text | YES | - |
| `show_photographer_credit` | boolean | NO | true |
| `created_at` | timestamp | NO | now() |
| `updated_at` | timestamp | NO | - |

---

### 14. `additional_services`

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| `id` | text | NO | - |
| `name` | text | NO | - |
| `description` | text | YES | - |
| `price` | integer | NO | - |
| `is_active` | boolean | NO | true |
| `display_order` | integer | NO | 0 |
| `created_at` | timestamp | NO | now() |
| `updated_at` | timestamp | NO | - |

---

### 15. `portfolio_photos`

| Column | Type | Nullable | Default |
| :--- | :--- | :--- | :--- |
| `id` | text | NO | - |
| `filename` | text | NO | - |
| `original_url` | text | NO | - |
| `thumbnail_url` | text | NO | - |
| `display_order` | integer | NO | 0 |
| `is_featured` | boolean | NO | false |
| `category` | text | YES | - |
| `description` | text | YES | - |
| `created_at` | timestamp | NO | now() |
| `updated_at` | timestamp | NO | - |
| `bento_priority` | integer | YES | 0 |
| `bento_size` | varchar | YES | - |
| `is_featured_bento` | boolean | NO | false |

