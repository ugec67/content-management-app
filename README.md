Creator CMS App
Live Links:

https://creator-cms-73cc3.web.app/

https://creator-cms-73cc3.firebaseapp.com/

A simple and intuitive Content Management System (CMS) designed to help creators manage and schedule their content across various social media platforms and their own website.

✨ Features
Multi-Platform Content Creation: Create and manage content tailored for different platforms like Website, Facebook, Twitter, Instagram, LinkedIn, TikTok, and YouTube.

Post Scheduling: Schedule posts to be published at a specific date and time.

Draft & Published Status: Easily manage content as drafts or mark them as published/scheduled.

Real-time Updates: Dashboard updates in real-time as posts are created, edited, or deleted.

User-Specific Content: Each authenticated user (even anonymous ones) manages their own private content.

Dark/Light Mode Toggle: A user-friendly interface with a toggle for light and dark themes.

Responsive Design: Optimized for viewing and interaction on various screen sizes (mobile, tablet, desktop).

Custom Modals: User-friendly modal pop-ups for confirmations and messages, replacing native browser alerts.

🚀 Technologies Used
React: A JavaScript library for building user interfaces.

Firebase:

Firestore: NoSQL cloud database for storing content data.

Authentication: For user authentication (anonymous and custom token).

Hosting: For deploying the web application.

Tailwind CSS: A utility-first CSS framework for rapid UI development and responsive design.

🛠️ Getting Started
Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

Prerequisites
Before you begin, ensure you have the following installed:

Node.js & npm: Download and install from nodejs.org. npm comes with Node.js.

Git: Download and install from git-scm.com.

Firebase CLI: If you plan to deploy to Firebase, install the CLI globally:

npm install -g firebase-tools


1. Clone the Repository
First, clone this repository to your local machine:

git clone https://github.com/YOUR_GITHUB_USERNAME/creator-cms-app.git
cd creator-cms-app


(Remember to replace YOUR_GITHUB_USERNAME with your actual GitHub username and creator-cms-app with your repository name if it's different.)

2. Install Dependencies
Install all the required Node.js packages:

npm install


This command will install React, Firebase, Tailwind CSS, PostCSS, Autoprefixer, and all other dependencies listed in package.json.

3. Firebase Project Setup
To connect your app to Firebase:

Create a Firebase Project: Go to the Firebase Console and create a new project.

Register a Web App: In your Firebase project, add a new web app and copy its configuration.

Update src/App.js: Replace the firebaseConfig object in src/App.js with your project's configuration.

Enable Services:

Firestore Database: Go to "Build" > "Firestore Database" and create a new database (start in test mode for quick setup, but review security rules for production).

Authentication: Go to "Build" > "Authentication" > "Sign-in method" and enable "Anonymous" sign-in.

Firestore Security Rules: Ensure your Firestore rules allow authenticated users to read and write data. For private user data, the rules should look something like:

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /artifacts/{appId}/users/{userId}/{documents=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}


4. Tailwind CSS Configuration
Ensure your Tailwind CSS files are correctly set up:

src/tailwind.css: Make sure this file contains the Tailwind directives:

@tailwind base;
@tailwind components;
@tailwind utilities;


tailwind.config.js: This file should be in your project's root directory and configured for dark mode and content scanning:

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  darkMode: 'class', // Enable dark mode via class
  theme: {
    extend: {},
  },
  plugins: [],
}


If this file doesn't exist, create it by running npx tailwindcss init in your project root after npm install.

public/index.html: Ensure this file does NOT contain any Tailwind CSS CDN links or manual <script src="../src/index.js"></script> tags. Create React App handles these automatically. Refer to the public/index.html content provided in previous communications.

🏃 Running the Application Locally
Once all dependencies are installed and configurations are set, you can run the application in development mode:

npm start


This will open your application in your default web browser at http://localhost:3000. The page will reload if you make edits. You will also see any lint errors in the console.

📦 Deployment (Firebase Hosting)
To deploy your application to Firebase Hosting:

Build the project for production:

npm run build


This command creates an optimized build folder.

Deploy to Firebase Hosting:

firebase deploy --only hosting


Make sure you are logged into the Firebase CLI (firebase login) and have initialized Firebase Hosting in your project (firebase init hosting).

💡 Usage
Dashboard: View, edit, and delete your existing posts. Posts are sorted by creation date.

New Post: Create a new content piece, select the target platform, add platform-specific details, and choose whether to save as a draft or schedule for publication.

Edit Post: Modify existing posts.

View Post: See a detailed view of a single post.

Dark/Light Mode: Toggle the theme using the button in the header.

🤝 Contributing
Feel free to fork the repository, create a new branch, and submit pull requests for any improvements or bug fixes.

📄 License
This project is licensed under the MIT License.
