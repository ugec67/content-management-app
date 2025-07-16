import React, { useState, useEffect, useRef } from 'react';
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, doc, getDoc, addDoc, setDoc, updateDoc, deleteDoc, onSnapshot, collection, query, where, serverTimestamp, Timestamp } from 'firebase/firestore';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
 apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

// Global variables provided by the Canvas environment.
// When running locally (outside Canvas), these variables will be undefined.
// We explicitly access them from the window object and provide local fallbacks
// to prevent 'no-undef' ESLint errors.
const canvasAppId = typeof window.__app_id !== 'undefined' ? window.__app_id : null;
const canvasInitialAuthToken = typeof window.__initial_auth_token !== 'undefined' ? window.__initial_auth_token : null;

// Determine the actual appId to use (Canvas provided or Firebase projectId as fallback)
const appId = canvasAppId || firebaseConfig.projectId;

// The authentication token to use (Canvas provided or null for anonymous sign-in)
const authToUse = canvasInitialAuthToken;


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app); // Initialize analytics
const db = getFirestore(app);
const auth = getAuth(app);

// Main App Component
const App = () => {
    const [user, setUser] = useState(null);
    const [loadingAuth, setLoadingAuth] = useState(true);
    const [currentPage, setCurrentPage] = useState('dashboard'); // 'dashboard', 'create-post', 'edit-post', 'view-post'
    const [selectedPost, setSelectedPost] = useState(null);
    const [showAuthModal, setShowAuthModal] = useState(false); // For custom alert/confirm
    const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light'); // 'light' or 'dark'

    useEffect(() => {
        // Apply theme class to the html element
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('theme', theme); // Persist theme preference
    }, [theme]);

    useEffect(() => {
        // Authenticate user on app load
        const authenticateUser = async () => {
            try {
                // Use authToUse (from canvas or null) for authentication
                if (authToUse) {
                    await signInWithCustomToken(auth, authToUse);
                } else {
                    await signInAnonymously(auth);
                }
            } catch (error) {
                console.error("Firebase authentication error:", error);
                // Fallback to anonymous if custom token fails
                try {
                    await signInAnonymously(auth);
                } catch (anonError) {
                    console.error("Anonymous sign-in failed:", anonError);
                }
            } finally {
                setLoadingAuth(false);
            }
        };

        // Listen for auth state changes
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            if (loadingAuth) { // Only set loadingAuth to false if it hasn't been set by initial auth attempt
                setLoadingAuth(false);
            }
        });

        authenticateUser();

        return () => unsubscribe(); // Clean up auth listener
    }, []); // Run only once on component mount

    if (loadingAuth) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
                <div className="text-center text-gray-700 dark:text-gray-300 text-lg">Loading CMS...</div>
            </div>
        );
    }

    // Function to show custom modal messages instead of alert/confirm
    const showMessageModal = (message, onConfirm = null) => {
        setSelectedPost({ message, onConfirm }); // Reusing selectedPost state for modal content
        setShowAuthModal(true);
    };

    const hideMessageModal = () => {
        setShowAuthModal(false);
        setSelectedPost(null);
    };

    const handleConfirmModal = () => {
        if (selectedPost && selectedPost.onConfirm) {
            selectedPost.onConfirm();
        }
        hideMessageModal();
    };

    const toggleTheme = () => {
        setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-100 via-purple-100 to-pink-100 dark:from-gray-800 dark:via-gray-900 dark:to-black font-sans text-gray-800 dark:text-gray-100 flex flex-col">
            {/* Custom Modal for messages */}
            {showAuthModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-sm w-full mx-auto">
                        <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">Notification</h3>
                        <p className="text-gray-700 dark:text-gray-300 mb-6">{selectedPost?.message}</p>
                        <div className="flex justify-end space-x-3">
                            {selectedPost?.onConfirm && (
                                <button
                                    onClick={handleConfirmModal}
                                    className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-opacity-50 transition duration-200"
                                >
                                    Confirm
                                </button>
                            )}
                            <button
                                onClick={hideMessageModal}
                                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 transition duration-200 dark:bg-gray-600 dark:text-gray-100 dark:hover:bg-gray-500"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <header className="bg-white dark:bg-gray-800 shadow-md p-4 flex justify-between items-center sticky top-0 z-40">
                <h1 className="text-2xl font-bold text-emerald-600">Creator CMS</h1>
                <nav className="space-x-4 flex items-center">
                    <button
                        onClick={() => { setCurrentPage('dashboard'); setSelectedPost(null); }}
                        className="text-gray-700 dark:text-gray-300 hover:text-emerald-600 font-medium transition duration-200"
                    >
                        Dashboard
                    </button>
                    <button
                        onClick={() => { setCurrentPage('create-post'); setSelectedPost(null); }}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition duration-200 shadow-sm"
                    >
                        New Post
                    </button>
                    <button
                        onClick={toggleTheme}
                        className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600 transition duration-200"
                        title="Toggle theme"
                    >
                        {theme === 'light' ? (
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path></svg>
                        ) : (
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.459 4.591A1 1 0 0115 15a1 1 0 01-1 1h-.001a1 1 0 01-.459-.091l-1.056-.423a1 1 0 01-.632-1.284l.358-1.08a1 1 0 011.284-.632l1.08.358zM3 10a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zm14 0a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM6.591 4.459A1 1 0 017 4a1 1 0 011 1v.001a1 1 0 01.091.459l.423 1.056a1 1 0 01-1.284.632l-1.08-.358a1 1 0 01-.632-1.284l.358-1.08zM10 15a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zm-4.591-.459A1 1 0 015 15a1 1 0 01-1 1h-.001a1 1 0 01-.459-.091l-1.056-.423a1 1 0 01-.632-1.284l.358-1.08a1 1 0 011.284-.632l1.08.358z"></path></svg>
                        )}
                    </button>
                    {user && (
                        <div className="flex items-center space-x-2">
                            <span className="text-gray-600 dark:text-gray-300 text-sm">User ID: {user.uid}</span>
                            <button
                                onClick={async () => {
                                    try {
                                        await signOut(auth);
                                        showMessageModal("You have been signed out.");
                                    } catch (error) {
                                        console.error("Error signing out:", error);
                                        showMessageModal("Error signing out. Please try again.");
                                    }
                                }}
                                className="px-3 py-1 bg-red-500 text-white rounded-md text-sm hover:bg-red-600 transition duration-200"
                            >
                                Sign Out
                            </button>
                        </div>
                    )}
                </nav>
            </header>

            {/* Main Content Area */}
            <main className="flex-grow p-6 container mx-auto max-w-4xl">
                {currentPage === 'dashboard' && user && (
                    <Dashboard
                        user={user}
                        setCurrentPage={setCurrentPage}
                        setSelectedPost={setSelectedPost}
                        showMessageModal={showMessageModal}
                    />
                )}
                {currentPage === 'create-post' && user && (
                    <PostEditor
                        user={user}
                        setCurrentPage={setCurrentPage}
                        showMessageModal={showMessageModal}
                    />
                )}
                {currentPage === 'edit-post' && user && selectedPost && (
                    <PostEditor
                        user={user}
                        setCurrentPage={setCurrentPage}
                        existingPost={selectedPost}
                        showMessageModal={showMessageModal}
                    />
                )}
                {currentPage === 'view-post' && selectedPost && (
                    <PostView
                        post={selectedPost}
                        setCurrentPage={setCurrentPage}
                    />
                )}
            </main>

            {/* Footer */}
            <footer className="bg-white dark:bg-gray-800 shadow-inner p-4 text-center text-gray-600 dark:text-gray-300 text-sm mt-auto">
                &copy; {new Date().getFullYear()} Creator CMS. All rights reserved.
            </footer>
        </div>
    );
};

// Dashboard Component
const Dashboard = ({ user, setCurrentPage, setSelectedPost, showMessageModal }) => {
    const [posts, setPosts] = useState([]);
    const [loadingPosts, setLoadingPosts] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!user) {
            setLoadingPosts(false);
            return;
        }

        const userPostsCollectionRef = collection(db, `artifacts/${appId}/users/${user.uid}/posts`);
        // Listen for real-time updates to the user's posts
        const unsubscribe = onSnapshot(userPostsCollectionRef,
            (snapshot) => {
                const fetchedPosts = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                // Sort posts by creation date, newest first
                fetchedPosts.sort((a, b) => (b.createdAt?.toDate() || 0) - (a.createdAt?.toDate() || 0));
                setPosts(fetchedPosts);
                setLoadingPosts(false);
                setError(null); // Clear any previous errors
            },
            (err) => {
                console.error("Error fetching posts:", err);
                setError("Failed to load posts. Please try again.");
                setLoadingPosts(false);
            }
        );

        return () => unsubscribe(); // Clean up listener on unmount
    }, [user]); // Re-run when user changes

    const getPostStatus = (post) => {
        if (!post.isPublished) {
            return 'Draft';
        }
        if (post.publishAt && post.publishAt.toDate() > new Date()) {
            return 'Scheduled';
        }
        return 'Published';
    };

    const handleDeletePost = async (postId) => {
        showMessageModal(
            "Are you sure you want to delete this post?",
            async () => {
                try {
                    const postDocRef = doc(db, `artifacts/${appId}/users/${user.uid}/posts`, postId);
                    await deleteDoc(postDocRef);
                    showMessageModal("Post deleted successfully!");
                } catch (error) {
                    console.error("Error deleting post:", error);
                    showMessageModal("Failed to delete post. Please try again.");
                }
            }
        );
    };

    if (loadingPosts) {
        return (
            <div className="text-center py-8 text-gray-600 dark:text-gray-300">
                <p className="text-lg">Loading your posts...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-8 text-red-600 dark:text-red-400">
                <p>{error}</p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-700 rounded-lg shadow-lg p-6">
            <h2 className="text-3xl font-semibold text-gray-800 dark:text-gray-100 mb-6">Your Posts</h2>
            {posts.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-300 text-lg">You haven't created any posts yet. Click "New Post" to get started!</p>
            ) : (
                <div className="space-y-4">
                    {posts.map((post) => {
                        const status = getPostStatus(post);
                        const statusColor = status === 'Published' ? 'text-green-600' : (status === 'Scheduled' ? 'text-blue-600' : 'text-yellow-600');
                        return (
                            <div key={post.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition duration-200">
                                <div className="flex-grow mb-3 sm:mb-0">
                                    <h3 className="text-xl font-bold text-emerald-700 dark:text-emerald-400">{post.title || 'Untitled Post'}</h3>
                                    <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">
                                        Status: <span className={`font-medium ${statusColor}`}>
                                            {status}
                                        </span>
                                    </p>
                                    {status === 'Scheduled' && post.publishAt && (
                                        <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                                            Scheduled: {post.publishAt.toDate().toLocaleString()}
                                        </p>
                                    )}
                                    <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">
                                        Platform: <span className="font-medium text-purple-600 dark:text-purple-400">{post.platform || 'Not specified'}</span>
                                    </p>
                                    <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                                        Last updated: {post.updatedAt ? new Date(post.updatedAt.toDate()).toLocaleString() : 'N/A'}
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={() => { setSelectedPost(post); setCurrentPage('view-post'); }}
                                        className="px-3 py-1 bg-emerald-500 text-white rounded-md text-sm hover:bg-emerald-600 transition duration-200"
                                    >
                                        View
                                    </button>
                                    <button
                                        onClick={() => { setSelectedPost(post); setCurrentPage('edit-post'); }}
                                        className="px-3 py-1 bg-yellow-500 text-white rounded-md text-sm hover:bg-yellow-600 transition duration-200"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDeletePost(post.id)}
                                        className="px-3 py-1 bg-red-500 text-white rounded-md text-sm hover:bg-red-600 transition duration-200"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

// PostEditor Component (for creating and editing posts)
const PostEditor = ({ user, setCurrentPage, existingPost, showMessageModal }) => {
    const [title, setTitle] = useState(existingPost?.title || '');
    const [isPublished, setIsPublished] = useState(existingPost?.isPublished || false);
    const [platform, setPlatform] = useState(existingPost?.platform || 'Website');
    const [saving, setSaving] = useState(false);

    // Scheduling states
    const initialPublishDate = existingPost?.publishAt ? existingPost.publishAt.toDate().toISOString().split('T')[0] : '';
    const initialPublishTime = existingPost?.publishAt ? existingPost.publishAt.toDate().toTimeString().split(' ')[0].substring(0, 5) : '';
    const [publishDate, setPublishDate] = useState(initialPublishDate);
    const [publishTime, setPublishTime] = useState(initialPublishTime);

    // Platform-specific content states
    const [bodyText, setBodyText] = useState(existingPost?.bodyText || '');
    const [caption, setCaption] = useState(existingPost?.caption || '');
    const [tweetText, setTweetText] = useState(existingPost?.tweetText || '');
    const [imageUrl, setImageUrl] = useState(existingPost?.imageUrl || '');
    const [videoUrl, setVideoUrl] = useState(existingPost?.videoUrl || '');
    const [linkUrl, setLinkUrl] = useState(existingPost?.linkUrl || '');
    const [hashtags, setHashtags] = useState(existingPost?.hashtags || '');
    const [youtubeTitle, setYoutubeTitle] = useState(existingPost?.youtubeTitle || '');
    const [description, setDescription] = useState(existingPost?.description || ''); // General description, used by YouTube
    const [postText, setPostText] = useState(existingPost?.postText || ''); // For LinkedIn
    const [genericContent, setGenericContent] = useState(existingPost?.content || ''); // Fallback for 'Other'

    // Reset content fields when platform changes or when editing a different post
    useEffect(() => {
        if (!existingPost || existingPost.platform !== platform) {
            setTitle(existingPost?.title || ''); // Keep title consistent across platform changes if editing
            setBodyText('');
            setCaption('');
            setTweetText('');
            setImageUrl('');
            setVideoUrl('');
            setLinkUrl('');
            setHashtags('');
            setYoutubeTitle('');
            setDescription('');
            setPostText('');
            setGenericContent('');
            // Also reset scheduling fields if it's a new post or platform changed
            setPublishDate('');
            setPublishTime('');
            setIsPublished(false); // Default to draft for new posts
        }
        // If editing an existing post and platform matches, populate existing content
        if (existingPost && existingPost.platform === platform) {
            setBodyText(existingPost.bodyText || '');
            setCaption(existingPost.caption || '');
            setTweetText(existingPost.tweetText || '');
            setImageUrl(existingPost.imageUrl || '');
            setVideoUrl(existingPost.videoUrl || '');
            setLinkUrl(existingPost.linkUrl || '');
            setHashtags(existingPost.hashtags || '');
            setYoutubeTitle(existingPost.youtubeTitle || '');
            setDescription(existingPost.description || '');
            setPostText(existingPost.postText || '');
            setGenericContent(existingPost.content || '');
            setIsPublished(existingPost.isPublished || false);
            if (existingPost.publishAt) {
                const date = existingPost.publishAt.toDate();
                setPublishDate(date.toISOString().split('T')[0]);
                setPublishTime(date.toTimeString().split(' ')[0].substring(0, 5));
            } else {
                setPublishDate('');
                setPublishTime('');
            }
        }
    }, [platform, existingPost]);


    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        if (!title.trim()) {
            showMessageModal("Post title cannot be empty.");
            setSaving(false);
            return;
        }

        let publishAtTimestamp = null;
        if (isPublished) {
            if (!publishDate || !publishTime) {
                showMessageModal("Please select a publish date and time if the post is to be published.");
                setSaving(false);
                return;
            }
            try {
                const dateTimeString = `${publishDate}T${publishTime}:00`;
                const dateObject = new Date(dateTimeString);
                if (isNaN(dateObject.getTime())) {
                    throw new Error("Invalid date or time.");
                }
                publishAtTimestamp = Timestamp.fromDate(dateObject);
            } catch (error) {
                showMessageModal(`Invalid publish date or time: ${error.message}`);
                setSaving(false);
                return;
            }
        }


        const postData = {
            title: title.trim(),
            authorId: user.uid,
            isPublished: isPublished,
            platform: platform,
            updatedAt: serverTimestamp(),
            publishAt: publishAtTimestamp, // Include the new publishAt field
            // Clear all previous specific content fields to avoid stale data
            bodyText: null, caption: null, tweetText: null, imageUrl: null, videoUrl: null,
            linkUrl: null, hashtags: null, youtubeTitle: null, description: null,
            postText: null, content: null, // Ensure 'content' is also cleared unless 'Other'
        };

        // Populate platform-specific content
        switch (platform) {
            case 'Website':
                postData.bodyText = bodyText;
                postData.imageUrl = imageUrl;
                postData.linkUrl = linkUrl;
                break;
            case 'Facebook':
                postData.caption = caption;
                postData.imageUrl = imageUrl;
                postData.videoUrl = videoUrl;
                postData.linkUrl = linkUrl;
                break;
            case 'Twitter':
                postData.tweetText = tweetText;
                postData.imageUrl = imageUrl;
                break;
            case 'Instagram':
                postData.caption = caption;
                postData.imageUrl = imageUrl;
                postData.hashtags = hashtags;
                break;
            case 'LinkedIn':
                postData.postText = postText;
                postData.imageUrl = imageUrl;
                postData.videoUrl = videoUrl;
                postData.linkUrl = linkUrl;
                break;
            case 'TikTok':
                postData.videoUrl = videoUrl;
                postData.caption = caption;
                break;
            case 'YouTube':
                postData.videoUrl = videoUrl;
                postData.youtubeTitle = youtubeTitle;
                postData.description = description;
                postData.hashtags = hashtags; // Using hashtags for YouTube tags
                break;
            case 'Other':
                postData.content = genericContent; // Use the original generic content field
                break;
            default:
                postData.content = genericContent;
                break;
        }

        try {
            if (existingPost) {
                const postDocRef = doc(db, `artifacts/${appId}/users/${user.uid}/posts`, existingPost.id);
                await updateDoc(postDocRef, postData);
                showMessageModal("Post updated successfully!");
            } else {
                postData.createdAt = serverTimestamp();
                const userPostsCollectionRef = collection(db, `artifacts/${appId}/users/${user.uid}/posts`);
                await addDoc(userPostsCollectionRef, postData);
                showMessageModal("Post created successfully!");
            }
            setCurrentPage('dashboard');
        } catch (error) {
            console.error("Error saving post:", error);
            showMessageModal(`Failed to save post: ${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    const renderPlatformFields = () => {
        switch (platform) {
            case 'Website':
                return (
                    <>
                        <div>
                            <label htmlFor="bodyText" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Body Content</label>
                            <textarea
                                id="bodyText"
                                value={bodyText}
                                onChange={(e) => setBodyText(e.target.value)}
                                rows="10"
                                className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-3 text-base focus:ring-emerald-500 focus:border-emerald-500 transition duration-200 resize-y bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
                                placeholder="Write your website article content here..."
                            ></textarea>
                        </div>
                        <div>
                            <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Featured Image URL</label>
                            <input
                                type="url"
                                id="imageUrl"
                                value={imageUrl}
                                onChange={(e) => setImageUrl(e.target.value)}
                                className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-3 text-base focus:ring-emerald-500 focus:border-emerald-500 transition duration-200 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
                                placeholder="e.g., https://example.com/image.jpg"
                            />
                        </div>
                        <div>
                            <label htmlFor="linkUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">External Link URL (Optional)</label>
                            <input
                                type="url"
                                id="linkUrl"
                                value={linkUrl}
                                onChange={(e) => setLinkUrl(e.target.value)}
                                className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-3 text-base focus:ring-emerald-500 focus:border-emerald-500 transition duration-200 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
                                placeholder="e.g., https://example.com/read-more"
                            />
                        </div>
                    </>
                );
            case 'Facebook':
                return (
                    <>
                        <div>
                            <label htmlFor="caption" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Caption</label>
                            <textarea
                                id="caption"
                                value={caption}
                                onChange={(e) => setCaption(e.target.value)}
                                rows="5"
                                className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-3 text-base focus:ring-emerald-500 focus:border-emerald-500 transition duration-200 resize-y bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
                                placeholder="Write your Facebook post caption..."
                            ></textarea>
                        </div>
                        <div>
                            <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Image URL (Optional)</label>
                            <input
                                type="url"
                                id="imageUrl"
                                value={imageUrl}
                                onChange={(e) => setImageUrl(e.target.value)}
                                className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-3 text-base focus:ring-emerald-500 focus:border-emerald-500 transition duration-200 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
                                placeholder="e.g., https://example.com/facebook-image.jpg"
                            />
                        </div>
                        <div>
                            <label htmlFor="videoUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Video URL (Optional)</label>
                            <input
                                type="url"
                                id="videoUrl"
                                value={videoUrl}
                                onChange={(e) => setVideoUrl(e.target.value)}
                                className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-3 text-base focus:ring-emerald-500 focus:border-emerald-500 transition duration-200 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
                                placeholder="e.g., https://example.com/facebook-video.mp4"
                            />
                        </div>
                        <div>
                            <label htmlFor="linkUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Link URL (Optional)</label>
                            <input
                                type="url"
                                id="linkUrl"
                                value={linkUrl}
                                onChange={(e) => setLinkUrl(e.target.value)}
                                className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-3 text-base focus:ring-emerald-500 focus:border-emerald-500 transition duration-200 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
                                placeholder="e.g., https://example.com/article"
                            />
                        </div>
                    </>
                );
            case 'Twitter':
                return (
                    <>
                        <div>
                            <label htmlFor="tweetText" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tweet Text (Max 280 characters)</label>
                            <textarea
                                id="tweetText"
                                value={tweetText}
                                onChange={(e) => setTweetText(e.target.value)}
                                rows="4"
                                maxLength="280"
                                className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-3 text-base focus:ring-emerald-500 focus:border-emerald-500 transition duration-200 resize-y bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
                                placeholder="What's happening?"
                            ></textarea>
                            <p className="text-right text-sm text-gray-500 dark:text-gray-400">{tweetText.length}/280</p>
                        </div>
                        <div>
                            <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Image URL (Optional)</label>
                            <input
                                type="url"
                                id="imageUrl"
                                value={imageUrl}
                                onChange={(e) => setImageUrl(e.target.value)}
                                className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-3 text-base focus:ring-emerald-500 focus:border-emerald-500 transition duration-200 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
                                placeholder="e.g., https://example.com/tweet-image.jpg"
                            />
                        </div>
                    </>
                );
            case 'Instagram':
                return (
                    <>
                        <div>
                            <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Image URL</label>
                            <input
                                type="url"
                                id="imageUrl"
                                value={imageUrl}
                                onChange={(e) => setImageUrl(e.target.value)}
                                className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-3 text-base focus:ring-emerald-500 focus:border-emerald-500 transition duration-200 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
                                placeholder="e.g., https://example.com/instagram-photo.jpg"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="caption" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Caption</label>
                            <textarea
                                id="caption"
                                value={caption}
                                onChange={(e) => setCaption(e.target.value)}
                                rows="5"
                                className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-3 text-base focus:ring-emerald-500 focus:border-emerald-500 transition duration-200 resize-y bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
                                placeholder="Write your Instagram caption..."
                            ></textarea>
                        </div>
                        <div>
                            <label htmlFor="hashtags" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hashtags (comma-separated)</label>
                            <input
                                type="text"
                                id="hashtags"
                                value={hashtags}
                                onChange={(e) => setHashtags(e.target.value)}
                                className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-3 text-base focus:ring-emerald-500 focus:border-emerald-500 transition duration-200 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
                                placeholder="e.g., #instadaily, #photooftheday"
                            />
                        </div>
                    </>
                );
            case 'LinkedIn':
                return (
                    <>
                        <div>
                            <label htmlFor="postText" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Post Text</label>
                            <textarea
                                id="postText"
                                value={postText}
                                onChange={(e) => setPostText(e.target.value)}
                                rows="8"
                                className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-3 text-base focus:ring-emerald-500 focus:border-emerald-500 transition duration-200 resize-y bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
                                placeholder="Share an update or an article..."
                            ></textarea>
                        </div>
                        <div>
                            <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Image URL (Optional)</label>
                            <input
                                type="url"
                                id="imageUrl"
                                value={imageUrl}
                                onChange={(e) => setImageUrl(e.target.value)}
                                className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-3 text-base focus:ring-emerald-500 focus:border-emerald-500 transition duration-200 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
                                placeholder="e.g., https://example.com/linkedin-image.jpg"
                            />
                        </div>
                        <div>
                            <label htmlFor="videoUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Video URL (Optional)</label>
                            <input
                                type="url"
                                id="videoUrl"
                                value={videoUrl}
                                onChange={(e) => setVideoUrl(e.target.value)}
                                className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-3 text-base focus:ring-emerald-500 focus:border-emerald-500 transition duration-200 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
                                placeholder="e.g., https://example.com/linkedin-video.mp4"
                            />
                        </div>
                        <div>
                            <label htmlFor="linkUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Article Link URL (Optional)</label>
                            <input
                                type="url"
                                id="linkUrl"
                                value={linkUrl}
                                onChange={(e) => setLinkUrl(e.target.value)}
                                className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-3 text-base focus:ring-emerald-500 focus:border-emerald-500 transition duration-200 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
                                placeholder="e.g., https://example.com/your-article"
                            />
                        </div>
                    </>
                );
            case 'TikTok':
                return (
                    <>
                        <div>
                            <label htmlFor="videoUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Video URL</label>
                            <input
                                type="url"
                                id="videoUrl"
                                value={videoUrl}
                                onChange={(e) => setVideoUrl(e.target.value)}
                                className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-3 text-base focus:ring-emerald-500 focus:border-emerald-500 transition duration-200 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
                                placeholder="e.g., https://tiktok.com/video123"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="caption" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Caption</label>
                            <textarea
                                id="caption"
                                value={caption}
                                onChange={(e) => setCaption(e.target.value)}
                                rows="4"
                                className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-3 text-base focus:ring-emerald-500 focus:border-emerald-500 transition duration-200 resize-y bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
                                placeholder="Add a catchy caption..."
                            ></textarea>
                        </div>
                    </>
                );
            case 'YouTube':
                return (
                    <>
                        <div>
                            <label htmlFor="videoUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Video URL</label>
                            <input
                                type="url"
                                id="videoUrl"
                                value={videoUrl}
                                onChange={(e) => setVideoUrl(e.target.value)}
                                className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-3 text-base focus:ring-emerald-500 focus:border-emerald-500 transition duration-200 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
                                placeholder="e.g., https://youtube.com/watch?v=xyz"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="youtubeTitle" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Video Title</label>
                            <input
                                type="text"
                                id="youtubeTitle"
                                value={youtubeTitle}
                                onChange={(e) => setYoutubeTitle(e.target.value)}
                                className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-3 text-lg focus:ring-emerald-500 focus:border-emerald-500 transition duration-200 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
                                placeholder="Enter your YouTube video title"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                            <textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows="10"
                                className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-3 text-base focus:ring-emerald-500 focus:border-emerald-500 transition duration-200 resize-y bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
                                placeholder="Add a detailed video description..."
                            ></textarea>
                        </div>
                        <div>
                            <label htmlFor="hashtags" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tags (comma-separated)</label>
                            <input
                                type="text"
                                id="hashtags"
                                value={hashtags}
                                onChange={(e) => setHashtags(e.target.value)}
                                className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-3 text-base focus:ring-emerald-500 focus:border-emerald-500 transition duration-200 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
                                placeholder="e.g., tutorial, vlogging, gaming"
                            />
                        </div>
                    </>
                );
            case 'Other':
            default:
                return (
                    <div>
                        <label htmlFor="genericContent" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Content</label>
                        <textarea
                            id="genericContent"
                            value={genericContent}
                            onChange={(e) => setGenericContent(e.target.value)}
                            rows="15"
                            className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-3 text-base focus:ring-emerald-500 focus:border-emerald-500 transition duration-200 resize-y bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
                            placeholder="Write your general post content here..."
                        ></textarea>
                    </div>
                );
        }
    };

    return (
        <div className="bg-white dark:bg-gray-700 rounded-lg shadow-lg p-6">
            <h2 className="text-3xl font-semibold text-gray-800 dark:text-gray-100 mb-6">{existingPost ? 'Edit Post' : 'Create New Post'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                    <input
                        type="text"
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-3 text-lg focus:ring-emerald-500 focus:border-emerald-500 transition duration-200 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
                        placeholder="Enter post title"
                        required
                    />
                </div>
                <div>
                    <label htmlFor="platform" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Social Media Platform</label>
                    <select
                        id="platform"
                        value={platform}
                        onChange={(e) => setPlatform(e.target.value)}
                        className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-3 text-lg focus:ring-emerald-500 focus:border-emerald-500 transition duration-200 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
                    >
                        <option value="Website">Website</option>
                        <option value="Facebook">Facebook</option>
                        <option value="Twitter">Twitter</option>
                        <option value="Instagram">Instagram</option>
                        <option value="LinkedIn">LinkedIn</option>
                        <option value="TikTok">TikTok</option>
                        <option value="YouTube">YouTube</option>
                        <option value="Other">Other</option>
                    </select>
                </div>

                {/* Render platform-specific fields */}
                {renderPlatformFields()}

                <div className="flex items-center mt-4">
                    <input
                        type="checkbox"
                        id="isPublished"
                        checked={isPublished}
                        onChange={(e) => setIsPublished(e.target.checked)}
                        className="h-5 w-5 text-emerald-600 border-gray-300 dark:border-gray-600 rounded focus:ring-emerald-500 transition duration-200 bg-white dark:bg-gray-800"
                    />
                    <label htmlFor="isPublished" className="ml-2 block text-sm text-gray-900 dark:text-gray-100">Schedule/Publish Post</label>
                </div>

                {isPublished && (
                    <div className="flex flex-col sm:flex-row gap-4 mt-2">
                        <div className="flex-1">
                            <label htmlFor="publishDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Publish Date</label>
                            <input
                                type="date"
                                id="publishDate"
                                value={publishDate}
                                onChange={(e) => setPublishDate(e.target.value)}
                                className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-3 text-base focus:ring-emerald-500 focus:border-emerald-500 transition duration-200 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
                                required={isPublished}
                            />
                        </div>
                        <div className="flex-1">
                            <label htmlFor="publishTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Publish Time</label>
                            <input
                                type="time"
                                id="publishTime"
                                value={publishTime}
                                onChange={(e) => setPublishTime(e.target.value)}
                                className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-3 text-base focus:ring-emerald-500 focus:border-emerald-500 transition duration-200 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
                                required={isPublished}
                            />
                        </div>
                    </div>
                )}

                <div className="flex flex-wrap gap-3 mt-6">
                    <button
                        type="submit"
                        disabled={saving}
                        className={`px-6 py-3 rounded-md text-white font-semibold shadow-md transition duration-200 ${saving ? 'bg-gray-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-opacity-50'}`}
                    >
                        {saving ? 'Saving...' : (existingPost ? 'Update Post' : 'Create Post')}
                    </button>
                    <button
                        type="button"
                        onClick={() => setCurrentPage('dashboard')}
                        className="px-6 py-3 bg-gray-300 text-gray-800 rounded-md font-semibold shadow-md hover:bg-gray-400 transition duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 dark:bg-gray-600 dark:text-gray-100 dark:hover:bg-gray-500"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
};

// PostView Component (for displaying a single post)
const PostView = ({ post, setCurrentPage }) => {
    if (!post) {
        return (
            <div className="text-center py-8 text-red-600 dark:text-red-400">
                <p>Post not found.</p>
                <button
                    onClick={() => setCurrentPage('dashboard')}
                    className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition duration-200"
                >
                    Back to Dashboard
                </button>
            </div>
        );
    }

    const getPostStatus = (post) => {
        if (!post.isPublished) {
            return 'Draft';
        }
        if (post.publishAt && post.publishAt.toDate() > new Date()) {
            return 'Scheduled';
        }
        return 'Published';
    };

    const status = getPostStatus(post);
    const statusColor = status === 'Published' ? 'text-green-600' : (status === 'Scheduled' ? 'text-blue-600' : 'text-yellow-600');

    const renderPostContent = () => {
        switch (post.platform) {
            case 'Website':
                return (
                    <>
                        {post.imageUrl && (
                            <div className="mb-4">
                                <img src={post.imageUrl} alt="Featured" className="w-full h-auto rounded-lg shadow-md max-w-lg mx-auto" onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/600x400/cccccc/333333?text=Image+Not+Found"; }} />
                            </div>
                        )}
                        {post.bodyText && <p className="whitespace-pre-wrap mb-4">{post.bodyText}</p>}
                        {post.linkUrl && (
                            <p className="text-emerald-600 dark:text-emerald-400 hover:underline">
                                <a href={post.linkUrl} target="_blank" rel="noopener noreferrer">Read More: {post.linkUrl}</a>
                            </p>
                        )}
                    </>
                );
            case 'Facebook':
                return (
                    <>
                        {post.caption && <p className="whitespace-pre-wrap mb-4">{post.caption}</p>}
                        {post.imageUrl && (
                            <div className="mb-4">
                                <img src={post.imageUrl} alt="Facebook Post" className="w-full h-auto rounded-lg shadow-md max-w-lg mx-auto" onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/600x400/cccccc/333333?text=Image+Not+Found"; }} />
                            </div>
                        )}
                        {post.videoUrl && (
                            <div className="mb-4">
                                <video controls src={post.videoUrl} className="w-full h-auto rounded-lg shadow-md max-w-lg mx-auto">
                                    Your browser does not support the video tag.
                                </video>
                            </div>
                        )}
                        {post.linkUrl && (
                            <p className="text-emerald-600 dark:text-emerald-400 hover:underline">
                                <a href={post.linkUrl} target="_blank" rel="noopener noreferrer">Link: {post.linkUrl}</a>
                            </p>
                        )}
                    </>
                );
            case 'Twitter':
                return (
                    <>
                        {post.tweetText && <p className="whitespace-pre-wrap mb-4">{post.tweetText}</p>}
                        {post.imageUrl && (
                            <div className="mb-4">
                                <img src={post.imageUrl} alt="Tweet" className="w-full h-auto rounded-lg shadow-md max-w-xs mx-auto" onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/400x300/cccccc/333333?text=Image+Not+Found"; }} />
                            </div>
                        )}
                    </>
                );
            case 'Instagram':
                return (
                    <>
                        {post.imageUrl && (
                            <div className="mb-4">
                                <img src={post.imageUrl} alt="Instagram Post" className="w-full h-auto rounded-lg shadow-md max-w-md mx-auto" onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/500x500/cccccc/333333?text=Image+Not+Found"; }} />
                            </div>
                        )}
                        {post.caption && <p className="whitespace-pre-wrap mb-2">{post.caption}</p>}
                        {post.hashtags && <p className="text-emerald-500 dark:text-emerald-400 text-sm">{post.hashtags.split(',').map(tag => `#${tag.trim()}`).join(' ')}</p>}
                    </>
                );
            case 'LinkedIn':
                return (
                    <>
                        {post.postText && <p className="whitespace-pre-wrap mb-4">{post.postText}</p>}
                        {post.imageUrl && (
                            <div className="mb-4">
                                <img src={post.imageUrl} alt="LinkedIn Post" className="w-full h-auto rounded-lg shadow-md max-w-lg mx-auto" onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/600x400/cccccc/333333?text=Image+Not+Found"; }} />
                            </div>
                        )}
                        {post.videoUrl && (
                            <div className="mb-4">
                                <video controls src={post.videoUrl} className="w-full h-auto rounded-lg shadow-md max-w-lg mx-auto">
                                    Your browser does not support the video tag.
                                </video>
                            </div>
                        )}
                        {post.linkUrl && (
                            <p className="text-emerald-600 dark:text-emerald-400 hover:underline">
                                <a href={post.linkUrl} target="_blank" rel="noopener noreferrer">Article: {post.linkUrl}</a>
                            </p>
                        )}
                    </>
                );
            case 'TikTok':
                return (
                    <>
                        {post.videoUrl && (
                            <div className="mb-4">
                                <video controls src={post.videoUrl} className="w-full h-auto rounded-lg shadow-md max-w-md mx-auto">
                                    Your browser does not support the video tag.
                                </video>
                            </div>
                        )}
                        {post.caption && <p className="whitespace-pre-wrap mb-4">{post.caption}</p>}
                    </>
                );
            case 'YouTube':
                return (
                    <>
                        {post.videoUrl && (
                            <div className="mb-4">
                                <video controls src={post.videoUrl} className="w-full h-auto rounded-lg shadow-md max-w-lg mx-auto">
                                    Your browser does not support the video tag.
                                </video>
                            </div>
                        )}
                        {post.youtubeTitle && <h3 className="text-2xl font-semibold text-gray-700 dark:text-gray-200 mb-2">{post.youtubeTitle}</h3>}
                        {post.description && <p className="whitespace-pre-wrap mb-4">{post.description}</p>}
                        {post.hashtags && <p className="text-gray-500 dark:text-gray-400 text-sm">Tags: {post.hashtags}</p>}
                    </>
                );
            case 'Other':
            default:
                return (
                    <p className="whitespace-pre-wrap">{post.content || 'No content provided for this post.'}</p>
                );
        }
    };

    return (
        <div className="bg-white dark:bg-gray-700 rounded-lg shadow-lg p-6">
            <h2 className="text-4xl font-bold text-gray-800 dark:text-gray-100 mb-4">{post.title}</h2>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                Status: <span className={`font-medium ${statusColor}`}>
                    {status}
                </span>
                {status === 'Scheduled' && post.publishAt && (
                    <span className="ml-2"> (on {post.publishAt.toDate().toLocaleString()})</span>
                )}
                {' | '}
                Platform: <span className="font-medium text-purple-600 dark:text-purple-400">{post.platform || 'Not specified'}</span>
                {' | '}
                Last updated: {post.updatedAt ? new Date(post.updatedAt.toDate()).toLocaleString() : 'N/A'}
            </p>
            <div className="prose max-w-none text-gray-800 dark:text-gray-100 leading-relaxed mb-8">
                {renderPostContent()}
            </div>
            <button
                onClick={() => setCurrentPage('dashboard')}
                className="px-6 py-3 bg-emerald-600 text-white rounded-md font-semibold shadow-md hover:bg-emerald-700 transition duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-opacity-50"
            >
                Back to Dashboard
            </button>
        </div>
    );
};

export default App;
