# jacksquire.com

Personal website and blog built with Astro, Sanity CMS, and deployed on Vercel.

## Tech Stack

- **Framework**: [Astro](https://astro.build) - Static site generation with excellent performance
- **CMS**: [Sanity](https://sanity.io) - Headless CMS for blog posts and projects
- **Styling**: [Tailwind CSS](https://tailwindcss.com) - Utility-first CSS framework
- **Hosting**: [Vercel](https://vercel.com) - Edge deployment with automatic builds

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/jacksquire/jacksquire.com.git
cd jacksquire.com
```

2. Install dependencies:
```bash
npm install
```

3. Copy the environment variables:
```bash
cp .env.example .env
```

4. Add your Sanity project credentials to `.env`

### Development

Start the Astro development server:
```bash
npm run dev
```

The site will be available at `http://localhost:4321`

### Sanity Studio

To run the Sanity Studio locally:

```bash
cd sanity
npm install
npm run dev
```

The studio will be available at `http://localhost:3333`

## Project Structure

```
jacksquire.com/
├── src/
│   ├── components/     # Astro components
│   ├── layouts/        # Page layouts
│   ├── pages/          # Routes and pages
│   ├── lib/            # Utilities and Sanity client
│   └── styles/         # Global CSS
├── public/             # Static assets
├── sanity/             # Sanity Studio
│   └── schemas/        # Content schemas
└── vercel.json         # Vercel configuration
```

## Deployment

### Vercel

1. Connect your GitHub repository to Vercel
2. Add environment variables in the Vercel dashboard
3. Deploy!

### Sanity

Deploy the Sanity Studio:
```bash
cd sanity
npm run deploy
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `PUBLIC_SANITY_PROJECT_ID` | Your Sanity project ID |
| `PUBLIC_SANITY_DATASET` | Sanity dataset (usually `production`) |
| `SANITY_API_TOKEN` | API token for preview mode (optional) |

## License

MIT
