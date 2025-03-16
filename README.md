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
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 