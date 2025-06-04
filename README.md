# MoneyTalk - Voice-Powered Finance Tracker

MoneyTalk is a progressive web application (PWA) that allows users to track their finances using voice commands. Built with React, TypeScript, and modern web technologies, MoneyTalk provides a seamless experience for managing personal finances.

## Features

- **Voice-to-Text Transaction Recording**: Add transactions by simply speaking
- **Financial Dashboard**: View daily summaries and trends
- **Transaction Management**: Add, edit, and categorize all financial activities
- **Comprehensive Reports**: Visualize spending patterns with interactive charts
- **Offline Support**: Continue using the app even without an internet connection
- **PWA Capabilities**: Install on any device for a native-like experience

## Getting Started

### Prerequisites

- Node.js (v14.x or higher)
- npm (v7.x or higher)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/moneytalk.git
   cd moneytalk
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm run dev
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:5173
   ```

### Building for Production

To build the application for production:

```
npm run build
```

The built files will be in the `dist` directory.

## Testing

Run the test suite with:

```
npm run test
```

## Project Structure

```
/src
  /assets        - Images and static assets
  /components    - Reusable UI components
    /auth        - Authentication-related components
    /layout      - Layout components (header, sidebar, etc.)
    /ui          - Basic UI elements (buttons, cards, etc.)
  /hooks         - Custom React hooks
  /pages         - Main application pages
  /stores        - Zustand state stores
  /utils         - Utility functions and helpers
```

## Technology Stack

- **Frontend**: React.js with TypeScript
- **State Management**: Zustand
- **Styling**: Tailwind CSS with DaisyUI
- **Charts**: Chart.js with react-chartjs-2
- **Routing**: React Router
- **Form Management**: React Hook Form
- **Voice Recognition**: Web Speech API
- **HTTP Client**: Axios
- **PWA Support**: Vite PWA Plugin

## PWA Features

MoneyTalk is designed as a Progressive Web App, which means it can be installed on your device and used offline. To install:

1. Open the application in a supported browser
2. Look for the "Install" or "Add to Home Screen" option
3. Follow the prompts to install

The service worker handles caching of assets and API responses for offline use.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [React](https://reactjs.org/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [DaisyUI](https://daisyui.com/)
- [Chart.js](https://www.chartjs.org/)
- [Zustand](https://github.com/pmndrs/zustand)