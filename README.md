 Ghost Board - Anonymous Confessions Club
A cyberpunk-themed anonymous confession board built with React, TypeScript, and Supabase. Share your thoughts, vote on confessions, react with emojis, and engage with the community anonymously.

<img alt="License" src="https://img.shields.io/badge/license-MIT-blue.svg">
<img alt="React" src="https://img.shields.io/badge/React-18.x-blue.svg">
<img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.x-blue.svg">
<img alt="Supabase" src="https://img.shields.io/badge/Supabase-2.x-green.svg">
✨ Features
🎯 Core Functionality
Anonymous Confessions - Share thoughts without identity
Multi-Media Support - Text, images, audio recordings, and video uploads
Real-time Feed - Live updates with new confessions and interactions
Comments System - Engage with confessions through replies
Search & Filter - Find specific content with powerful search
🗳️ Engagement System
Voting - Upvote and downvote confessions and comments
Emoji Reactions - React with 16 different emojis (😂 😭 😱 🔥 💯 ❤️ 👏 😍 🤔 😬 🤯 👀 💀 🙄 😤 🥺)
Sorting Options - Sort by newest, most liked, or most controversial
User Fingerprinting - Prevent duplicate votes while maintaining anonymity
📊 Content Moderation
Advanced Reporting - 9 predefined report categories + custom reasons
Admin Dashboard - Comprehensive moderation tools
Content Management - Delete individual posts or bulk cleanup
User Analytics - Track engagement and activity metrics
🎨 Design & UX
Cyberpunk Aesthetic - Retro-futuristic neon design
Responsive Design - Works seamlessly on mobile and desktop
Dark Theme - Easy on the eyes with neon accents
Smooth Animations - Polished interactions and transitions
🛠️ Tech Stack
Frontend
React 18 with TypeScript
Vite for fast development and building
Tailwind CSS for styling
Lucide React for icons
React Router for navigation
Backend & Database
Supabase for database, authentication, and file storage
PostgreSQL with Row Level Security (RLS)
Real-time subscriptions for live updates
File upload with 50MB limit support
Key Libraries
@supabase/supabase-js - Database client
react-hot-toast - Notifications
Canvas Confetti - Celebration effects
🚀 Getting Started
Prerequisites
Node.js 18+ and npm
Supabase account and project
Installation
Clone the repository
Install dependencies
Set up Supabase
Create a new Supabase project
Copy your project URL and anon key
Run the database setup scripts (see Database Setup section)
Configure environment variables
Start development server
Access the application
Main app: http://localhost:8082
Admin panel: http://localhost:8082/admin-secure-access-2025
🗄️ Database Setup
Run these SQL scripts in your Supabase SQL Editor in order:

1. Core Tables
2. Storage Setup
3. Vote Policies
4. Reactions System
5. Admin Functions
📁 Project Structure
🎮 Usage
For Users
Posting Confessions
Click "Share Your Confession"
Choose content type: text, image, audio, or video
Write your confession (up to 1000 characters)
Add media if desired
Submit anonymously
Engaging with Content
Vote: Click ⬆️ or ⬇️ to upvote/downvote
React: Click ➕ to open emoji picker and react
Comment: Reply to confessions with your thoughts
Report: Flag inappropriate content with detailed reasons
Browsing & Discovery
Sort: By newest, most liked, or controversial
Search: Find specific confessions with keywords
Filter: Browse by content type or engagement level
For Administrators
Admin Panel Access
URL: /admin-secure-access-2025
Password: ghost2025!admin
Session: 24-hour automatic logout
Dashboard Features
Live Statistics: Real-time counts and metrics
Recent Activity: Latest confessions and engagement
Pending Reports: Content requiring moderation
User Analytics: Active users and engagement data
Content Management
Reports Tab: Review and act on user reports
Content Tab: Browse all confessions with moderation tools
Users Tab: View user activity and engagement metrics
Settings Tab: Database maintenance and cleanup tools
Moderation Actions
Individual Deletion: Remove specific confessions/comments
Bulk Cleanup: Remove old content (7+ days)
Nuclear Option: Complete database wipe (with double confirmation)
Report Management: Dismiss, resolve, or act on reports
🔧 Configuration
Environment Variables
Customization Options
File Upload Limits: Modify in fileUpload.ts (default: 50MB)
Available Emojis: Update in useReactions.ts
Report Categories: Modify in ReportModal.tsx
Admin Password: Change in AdminSecure.tsx
Styling: Customize colors in Tailwind config
🛡️ Security Features
Data Protection
Row Level Security (RLS) on all database tables
Anonymous user tracking via browser fingerprinting
Secure file uploads with type validation
SQL injection protection through parameterized queries
Content Moderation
Comprehensive reporting system with 9 categories
Custom report reasons for detailed feedback
Admin-only deletion with proper authorization
Cascade deletion to prevent orphaned data
Privacy
No user accounts required - completely anonymous
No personal data collection
Local session management for admin access
Automatic cleanup of old content
🎨 Theming
The project uses a cyberpunk aesthetic with custom Tailwind colors:

📱 Mobile Responsiveness
Responsive grid layout adapts to screen size
Touch-friendly interactions for mobile devices
Optimized emoji picker for small screens
Mobile-first design approach
🚀 Deployment
Build for Production
Deploy to Vercel
Deploy to Netlify
Environment Variables
Ensure all environment variables are set in your deployment platform.

🤝 Contributing
Fork the repository
Create a feature branch (git checkout -b feature/amazing-feature)
Commit your changes (git commit -m 'Add amazing feature')
Push to the branch (git push origin feature/amazing-feature)
Open a Pull Request
📄 License
This project is licensed under the MIT License - see the LICENSE file for details.

🙏 Acknowledgments
Supabase for the excellent backend-as-a-service platform
Tailwind CSS for the utility-first CSS framework
Lucide for the beautiful icon set
React Hot Toast for elegant notifications
📞 Support
For support, please open an issue on GitHub or contact the development team.

Built with ❤️ and lots of ☕ by the Ghost Board team

Share your thoughts, stay anonymous, stay authentic.
