# Mister E AI V4 — Working Vision Build

V4 fixes the image-picker workflow and includes a server endpoint that sends the selected front and optional back image to a vision-capable OpenAI model.

## Run
1. Install Node.js 20+.
2. In this folder run `npm install`.
3. Copy `.env.example` to `.env`.
4. Add your OpenAI API key.
5. Run `npm start`.
6. Open `http://localhost:3000`.

The API key must stay server-side. The app accepts JPG, PNG, WEBP, and GIF images up to 15 MB each.
