# 2FA Debt Clock

## What this is
A beautiful, highly interactive web dashboard that calculates and visualizes the hidden time and financial costs of Multi-Factor Authentication (MFA) friction across an organization in real-time. Features a 24/7 national-debt-style ticking clock, an integrated stopwatch for timing real logins, adjustable parameter sliders for company size, hourly wage, daily logins, and login duration, dynamic SVG bar charts comparing MFA overhead to vacation/sick leave, and an auto-generated management report ready to copy-paste.

## Status
active

## How to run it
Open `index.html` directly in any web browser, or serve it using a local development server (e.g. VS Code Live Server or Python's `http.server`):
```bash
python -m http.server 8000
```
Then navigate to `http://localhost:8000`.

## Important notes
- The ticker uses a smooth 24/7 continuous annual extrapolation rate, anchored to the current year's elapsed milliseconds. Refreshing the browser preserves the exact cumulative count.
- Custom stopwatch times and configuration state are automatically stored in the browser's `localStorage`.
- Calculations are based on a standard 250-working-day corporate calendar and a 2000-hour work year (8 hours/day).

## Delete rules
Can be safely deleted, regenerated, or extended as needed. All logic is contained in three main files: `index.html`, `style.css`, and `app.js`.
