# StorySeed - AI-Powered Custom Writing Prompt App

An AI-driven creative companion for fiction writers that helps build story worlds, deepen characters, and develop story elements through personalized daily writing prompts.

## Features

### Core Functionality
- **User Authentication** - Secure email/password authentication with Supabase
- **Project Organization** - Organize your creative work into Series, Books, and Story Elements
- **Story Elements** - Track Characters, Locations, Plot Points, Items, and Themes
- **AI-Generated Prompts** - Context-aware writing prompts tailored to your story universe
- **Multiple Prompt Modes**:
  - General - Balanced prompts for overall development
  - Character Deep Dive - Explore motivations and relationships
  - Plot Development - Expand key events and turning points
  - Worldbuilding - Build locations, cultures, and systems
  - Dialogue Practice - Develop voice and tone through scenarios
  - Conflict & Theme - Examine moral choices and narrative tension
- **Writing Interface** - Clean, distraction-free editor with auto-save
- **Daily Streak Tracking** - Monitor consecutive days of writing to stay motivated
- **Prompt History** - Browse and search all past prompts and responses
- **Dashboard** - View progress, active projects, and recent activity

## Tech Stack

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Build Tool**: Vite
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth

## Prerequisites

Before running this project locally, ensure you have the following installed:

- **Node.js** (version 18 or higher)
- **npm** (comes with Node.js)
- **Git** (for cloning the repository)

## Getting Started

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd project
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

The project is pre-configured with Supabase connection details. The `.env` file already contains:

```
VITE_SUPABASE_URL=https://0ec90b57d6e95fcbda19832f.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
```

**Note**: These environment variables are already set up and connected to a working Supabase instance with the required database schema.

### 4. Database Schema

The database has been initialized with the following tables:

- **profiles** - User profile information and streak tracking
- **series** - Story series/universes
- **books** - Individual books/projects within series
- **story_elements** - Characters, locations, plot points, items, and themes
- **prompts** - Generated writing prompts
- **responses** - User responses to prompts
- **user_settings** - User preferences and settings

All tables include Row Level Security (RLS) policies to ensure users can only access their own data.

### 5. Run the Development Server

```bash
npm run dev
```

The application will start on `http://localhost:5173` (or another port if 5173 is in use).

### 6. Build for Production

To create a production build:

```bash
npm run build
```

The built files will be in the `dist/` directory.

### 7. Preview Production Build

To preview the production build locally:

```bash
npm run preview
```

## Project Structure

```
project/
├── src/
│   ├── components/
│   │   ├── Auth.tsx              # Authentication UI (login/register)
│   │   ├── Dashboard.tsx         # Main dashboard with stats and overview
│   │   ├── ProjectManager.tsx    # Project and story element management
│   │   └── PromptInterface.tsx   # Prompt generation and writing interface
│   ├── contexts/
│   │   └── AuthContext.tsx       # Authentication context and hooks
│   ├── lib/
│   │   ├── supabase.ts          # Supabase client configuration
│   │   └── database.types.ts    # TypeScript types for database schema
│   ├── App.tsx                   # Main application component
│   ├── main.tsx                  # Application entry point
│   └── index.css                 # Global styles and Tailwind imports
├── supabase/
│   └── migrations/
│       └── 20251017235241_create_initial_schema.sql
├── .env                          # Environment variables
├── package.json                  # Project dependencies
├── tsconfig.json                 # TypeScript configuration
├── vite.config.ts               # Vite configuration
└── tailwind.config.js           # Tailwind CSS configuration
```

## Usage Guide

### First Time Setup

1. **Sign Up**: Create an account with your email and password
2. **Create a Project**: Click "Create Project" from the dashboard or project manager
3. **Add Story Elements**: Add characters, locations, and other story elements to your project
4. **Generate Your First Prompt**: Click "Generate New Prompt" from the dashboard

### Daily Workflow

1. **Login** to your account
2. **View Dashboard** to see your current streak and recent activity
3. **Generate a Prompt** based on your selected mode and story elements
4. **Write Your Response** in the distraction-free editor (auto-saves as you type)
5. **Save & Finish** to complete the prompt and update your streak
6. **Review History** to browse past prompts and responses

### Managing Projects

- **Create Projects**: Organize your writing into separate books or stories
- **Add Elements**: Build your story database with characters, locations, plot points, items, and themes
- **Edit Elements**: Update descriptions and notes as your story evolves
- **Delete Elements**: Remove elements that are no longer needed

### Prompt Modes

Choose a prompt mode to focus your writing:

- **General**: Balanced prompts for overall story development
- **Character Deep Dive**: Explore character motivations, fears, and relationships
- **Plot Development**: Expand key events, conflicts, and turning points
- **Worldbuilding**: Develop locations, cultures, systems, and traditions
- **Dialogue Practice**: Practice character voice through conversational scenarios
- **Conflict & Theme**: Examine moral choices and thematic questions

### Streak Tracking

- Complete at least one prompt per day to maintain your streak
- View current and longest streaks on the dashboard
- Streaks reset if you miss a day (unless you wrote the previous day)

## Available Scripts

### `npm run dev`
Starts the development server with hot module replacement

### `npm run build`
Creates an optimized production build

### `npm run preview`
Previews the production build locally

### `npm run lint`
Runs ESLint to check code quality

### `npm run typecheck`
Runs TypeScript compiler to check for type errors

## Database Information

### Supabase Configuration

The application uses Supabase for:
- **Authentication**: Email/password authentication with automatic profile creation
- **Database**: PostgreSQL database with Row Level Security
- **Real-time**: Potential for real-time updates (not currently implemented)

### Key Database Features

- **Automatic Profile Creation**: Profiles are created automatically on user signup
- **Cascade Deletes**: Deleting a project removes all associated elements
- **Updated Timestamps**: Automatic `updated_at` timestamp updates
- **Streak Calculation**: Smart streak tracking based on consecutive days

## Security

- All database tables use Row Level Security (RLS)
- Users can only access their own data
- Authentication required for all database operations
- Passwords are securely hashed by Supabase Auth

## Troubleshooting

### Port Already in Use

If port 5173 is already in use, Vite will automatically try the next available port. Check the terminal output for the actual port number.

### Database Connection Issues

If you experience connection issues:
1. Check that the `.env` file contains the correct Supabase URL and anon key
2. Verify your internet connection
3. Check the browser console for specific error messages

### Build Errors

If you encounter build errors:
1. Delete `node_modules` and `package-lock.json`
2. Run `npm install` again
3. Run `npm run build`

### Authentication Issues

If authentication doesn't work:
1. Check browser console for error messages
2. Verify Supabase project is active
3. Clear browser cache and cookies
4. Try logging in again

## Browser Support

This application works best on modern browsers:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Future Enhancements

Planned features for future releases:
- AI summaries and relationship insights
- Visual relationship maps between story elements
- Export functionality (Markdown, JSON, PDF)
- Series management with multiple books
- Collaborative writing features
- Mobile app version
- Offline support with sync
- Custom prompt creation
- Theme customization
- Writing statistics and analytics

## Contributing

Contributions are welcome! Please follow these steps:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is available for personal and commercial use.

## Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Check existing issues for solutions
- Review the troubleshooting section above

## Acknowledgments

- Built with React and TypeScript
- Styled with Tailwind CSS
- Icons by Lucide
- Database and authentication by Supabase
- Bundled with Vite

---

**Happy Writing!** 🎨✍️

Start building your story universe one prompt at a time.