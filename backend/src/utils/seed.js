const mongoose =require ('mongoose');
const dotenv= require ('dotenv');
const User =require ('../models/User.js');
const Activity= require ('../models/Activity.js');
const Notification= require ('../models/Notification.js');

dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB for seeding...');

    // Clear existing data
    await User.deleteMany({});
    await Activity.deleteMany({});
    await Notification.deleteMany({});

    console.log('Cleared existing collections');

    // ==================== USERS ====================
    const users = await User.create([
      {
        name: "Priya Sharma",
        username: "priya_vibes",
        email: "priya@example.com",
        password: "$2a$10$dummyhash1234567890", // dummy hash
        avatar: "https://i.pravatar.cc/300?u=priya",
        bio: "Coffee lover | Weekend hiker | Always up for new adventures",
        interests: ["hiking", "coffee", "photography", "music"],
        mood: "social",
        location: { lat: 28.6139, lng: 77.2090 } // Delhi
      },
      {
        name: "Arjun Mehta",
        username: "arjun_runs",
        email: "arjun@example.com",
        password: "$2a$10$dummyhash1234567890",
        avatar: "https://i.pravatar.cc/300?u=arjun",
        bio: "Morning runner | Tech enthusiast | Looking for running buddies",
        interests: ["running", "fitness", "tech", "music"],
        mood: "exploring",
        location: { lat: 28.6353, lng: 77.2250 }
      },
      {
        name: "Ananya Kapoor",
        username: "ananya_art",
        email: "ananya@example.com",
        password: "$2a$10$dummyhash1234567890",
        avatar: "https://i.pravatar.cc/300?u=ananya",
        bio: "Artist | Bookworm | Love painting & deep conversations",
        interests: ["art", "books", "painting", "writing"],
        mood: "social",
        location: { lat: 28.5921, lng: 77.1854 }
      },
      {
        name: "Rohan Singh",
        username: "rohan_cook",
        email: "rohan@example.com",
        password: "$2a$10$dummyhash1234567890",
        avatar: "https://i.pravatar.cc/300?u=rohan",
        bio: "Home chef | Food explorer | Always hosting potlucks",
        interests: ["cooking", "food", "travel", "boardgames"],
        mood: "bored",
        location: { lat: 28.7041, lng: 77.1025 }
      }
    ]);

    console.log(`✅ Created ${users.length} users`);

    // ==================== ACTIVITIES ====================
    const activities = await Activity.create([
      {
        title: "Morning Trail Run at Ridge",
        description: "Easy 5km trail run followed by coffee. All levels welcome! Let's beat the heat.",
        creator: users[1]._id,
        participants: [users[1]._id, users[0]._id],
        location: { lat: 28.6200, lng: 77.1900 },
        time: new Date(Date.now() + 1000 * 60 * 60 * 18), // Tomorrow morning
        interests: ["running", "fitness"],
        likes: [users[0]._id]
      },
      {
        title: "Sunday Sunset Painting Session",
        description: "Bring your sketchbook or canvas. All materials provided. Perfect for beginners too!",
        creator: users[2]._id,
        participants: [users[2]._id],
        location: { lat: 28.5800, lng: 77.2200 },
        time: new Date(Date.now() + 1000 * 60 * 60 * 30),
        interests: ["art", "painting"],
        likes: []
      },
      {
        title: "Potluck Night @ My Terrace",
        description: "Everyone brings one dish. Great music, board games, and conversations guaranteed.",
        creator: users[3]._id,
        participants: [users[3]._id, users[0]._id, users[2]._id],
        location: { lat: 28.7100, lng: 77.1000 },
        time: new Date(Date.now() + 1000 * 60 * 60 * 50),
        interests: ["cooking", "food", "boardgames"],
        likes: [users[0]._id, users[2]._id]
      },
      {
        title: "Photography Walk - Old Delhi",
        description: "Capture the magic of Old Delhi streets. Golden hour photography + street food.",
        creator: users[0]._id,
        participants: [users[0]._id],
        location: { lat: 28.6560, lng: 77.2300 },
        time: new Date(Date.now() + 1000 * 60 * 60 * 12),
        interests: ["photography", "travel"],
        likes: [users[1]._id]
      }
    ]);

    console.log(`✅ Created ${activities.length} activities`);

    // ==================== NOTIFICATIONS ====================
    await Notification.create([
      {
        user: users[0]._id,
        type: "request_accepted",
        requireUser: users[1]._id,
        activity: activities[0]._id,
        message: "Your request to join Morning Trail Run was accepted!",
        read: false
      },
      {
        user: users[2]._id,
        type: "invite",
        requireUser: users[3]._id,
        activity: activities[2]._id,
        message: "Rohan invited you to Potluck Night @ My Terrace",
        read: false
      },
      {
        user: users[1]._id,
        type: "message",
        requireUser: users[0]._id,
        activity: activities[0]._id,
        message: "New message in Morning Trail Run group",
        read: true
      }
    ]);

    console.log('✅ Created sample notifications');

    console.log('\n🎉 SEEDING COMPLETED SUCCESSFULLY!');
    console.log('You can now login with any of these emails:');
    users.forEach(u => console.log(`→ ${u.email}`));

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedData();