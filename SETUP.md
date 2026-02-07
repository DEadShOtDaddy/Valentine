# Valentine Week Website Setup

## What is implemented

1. Separate profiles:
- Admin profile
- User profile

2. Admin controls:
- Lock or unlock any day page
- Upload photos for each day
- New upload becomes that day's background image
- Reset all 7 seeded days and seeded photos

3. User experience:
- Home page shows all 7 Valentine week days
- Live counter from June 21, 2024 with the line:
  "We have been together this long"
- Users can open unlocked days
- Locked days are visible but blocked for non-admin users

4. Day pages:
- One page per day (`/day/[dayNumber]`)
- Per-day background image
- Photo gallery for each day

## Login credentials

- Admin profile password: `admin`
- User profile password: `iamchotu` (also accepts `user`)

## Routes

- `/` Home page
- `/account/signin` Profile selection and login
- `/account/logout` Logout
- `/admin` Admin dashboard
- `/day/[dayNumber]` Day details page

## Development

```bash
npm run dev
```

Default dev URL:

`http://localhost:4000`

## Validation commands

```bash
npm run typecheck
npx vite build
```

## Notes about data storage

- The website uses an in-memory seeded store for Valentine pages and photos.
- Data is available immediately without external database setup.
- Data resets when the server process restarts, or when admin clicks reset.
