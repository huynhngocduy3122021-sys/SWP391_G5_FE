# VinParking Frontend React

VinParking Frontend is the user interface for the VinParking smart parking management system. It is built using React and Vite, featuring a responsive, modern glassmorphism design.

## Features
- **User Dashboard:** Profile, vehicle management, and wallet tracking.
- **Manager Dashboard:** System metrics, zone management, revenue reports, and staff management.
- **Staff Portals:** Dedicated entry and exit gate management interfaces.
- **Search & Booking:** Search parking locations dynamically and book slots.
- **Authentication:** Secure login and registration with context-based role routing.

## Setup & Installation

### Prerequisites
- Node.js 18+ installed.

### Installation
1. Clone the repository and navigate to the project directory:
   ```bash
   cd SWP391_G5_FE
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   Create a `.env` file based on the provided configuration (ensure `VITE_API_BASE_URL` is set).

4. Run the development server:
   ```bash
   npm run dev
   ```

## Folder Structure
```
src/
├── api/          # Axios instance and API config
├── components/   # Reusable UI components (Auth, Layout, etc.)
├── context/      # React Context (AuthContext)
├── hooks/        # Custom React Hooks (useAuth)
├── pages/        # Route pages (Home, Auth, Dashboards)
├── utils/        # Utilities (format, roleGuard)
└── index.css     # Global styles and design tokens
```

