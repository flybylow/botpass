# BotVerify

BotVerify is a standardized verification system for trading bots and automated agents. It provides a simple way for bot operators to verify their bots and for platforms to validate bot authenticity.

## Features

- User authentication with email/password
- Bot registration and management
- Verification badge system
- Public verification API
- Real-time verification status updates
- Embeddable verification badges

## Tech Stack

- React 18.x with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- Firebase for backend services
- React Router for navigation
- React Hook Form for form handling

## Getting Started

### Prerequisites

- Node.js 18.x or later
- npm 9.x or later
- Firebase project

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/botverify.git
   cd botverify
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Update the `.env` file with your Firebase configuration.

5. Start the development server:
   ```bash
   npm run dev
   ```

### Building for Production

```bash
npm run build
```

The build artifacts will be stored in the `dist/` directory.

## Project Structure

```
src/
├── assets/               # Static assets
├── components/           # Reusable UI components
│   ├── common/          # General UI components
│   ├── auth/            # Authentication related components
│   ├── bot/             # Bot management components
│   ├── dashboard/       # Dashboard components
│   └── verification/    # Verification badge components
├── contexts/            # React contexts
├── hooks/               # Custom React hooks
├── pages/               # Page components
├── services/            # API services
└── utils/               # Utility functions
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Run a production build locally (`npm run build`) to catch TypeScript errors and other build issues early
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

For more detailed information, please read:
- [Contributing Guidelines](.github/CONTRIBUTING.md)
- [Development Rules](.github/DEVELOPMENT_RULES.md)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Deployment

### Environment Variables for Vercel

To deploy this application to Vercel while keeping your Firebase configuration secure, follow these steps:

1. Log in to your [Vercel dashboard](https://vercel.com/dashboard)
2. Select your project "botpass"
3. Go to "Settings" tab
4. Click on "Environment Variables" in the left sidebar
5. Add each of the following environment variables from your .env file (make sure to add them to all environments: Production, Preview, and Development):

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_FIREBASE_MEASUREMENT_ID
```

6. Click "Save" to store these variables
7. Re-deploy your application by clicking "Deployments" and then "Redeploy" on your latest deployment

> **Note**: These environment variables are stored securely on Vercel and are not included in your GitHub repository. 