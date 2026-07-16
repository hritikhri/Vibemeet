// backend/src/utils/seed.js
const mongoose= require ( 'mongoose');
const bcrypt = require( 'bcryptjs');
const dotenv = require( 'dotenv');

dotenv.config();

const User= require ( '../models/User.js');
const Activity = require( '../models/Activity.js');
const PrivateMessage = require( '../models/PrivateMessage.js');
const Notification = require( '../models/Notification.js');

export const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('🟢 Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Activity.deleteMany({});
    await PrivateMessage.deleteMany({});
    await Notification.deleteMany({});
    console.log('🗑️  Cleared previous data');

    // ==================== 20 REALISTIC USERS ====================
    const userData = [
      { name: "Priya Sharma", username: "priya_sharma", email: "priya@example.com", avatar: "https://i.pravatar.cc/150?u=priya", bio: "Love hiking and meeting new people ✨", interests: ["hiking", "travel", "music"], mood: "social" },
      { name: "Arjun Rao", username: "arjun_rao", email: "arjun@example.com", avatar: "https://i.pravatar.cc/150?u=arjun", bio: "Tech enthusiast | Startup founder", interests: ["tech", "coding", "startup"], mood: "exploring" },
      { name: "Ananya Gupta", username: "ananya_g", email: "ananya@example.com", avatar: "https://i.pravatar.cc/150?u=ananya", bio: "Foodie | Photographer 📸", interests: ["food", "photography", "art"], mood: "social" },
      { name: "Rohan Mehra", username: "rohan_m", email: "rohan@example.com", avatar: "https://i.pravatar.cc/150?u=rohan", bio: "Fitness freak | Marathon runner", interests: ["fitness", "running", "yoga"], mood: "bored" },
      { name: "Sneha Kapoor", username: "sneha_k", email: "sneha@example.com", avatar: "https://i.pravatar.cc/150?u=sneha", bio: "Book lover | Writer", interests: ["reading", "writing", "literature"], mood: "lonely" },
      { name: "Vikram Singh", username: "vikram_s", email: "vikram@example.com", avatar: "https://i.pravatar.cc/150?u=vikram", bio: "Music producer | Guitarist", interests: ["music", "guitar", "production"], mood: "social" },
      { name: "Ishita Verma", username: "ishita_v", email: "ishita@example.com", avatar: "https://i.pravatar.cc/150?u=ishita", bio: "Travel blogger | Digital nomad", interests: ["travel", "blogging", "photography"], mood: "exploring" },
      { name: "Karan Malhotra", username: "karan_m", email: "karan@example.com", avatar: "https://i.pravatar.cc/150?u=karan", bio: "Entrepreneur | Coffee addict", interests: ["business", "coffee", "startup"], mood: "bored" },
      { name: "Mehak Jain", username: "mehak_j", email: "mehak@example.com", avatar: "https://i.pravatar.cc/150?u=mehak", bio: "Dancer | Choreographer", interests: ["dance", "music", "fitness"], mood: "social" },
      { name: "Aryan Khanna", username: "aryan_k", email: "aryan@example.com", avatar: "https://i.pravatar.cc/150?u=aryan", bio: "Photographer | Filmmaker", interests: ["photography", "cinema", "art"], mood: "exploring" },
      { name: "Riya Patel", username: "riya_p", email: "riya@example.com", avatar: "https://i.pravatar.cc/150?u=riya", bio: "Yoga teacher | Wellness coach", interests: ["yoga", "wellness", "meditation"], mood: "social" },
      { name: "Devansh Sharma", username: "devansh_s", email: "devansh@example.com", avatar: "https://i.pravatar.cc/150?u=devansh", bio: "Gamer | Streamer", interests: ["gaming", "tech", "esports"], mood: "bored" },
      { name: "Nisha Reddy", username: "nisha_r", email: "nisha@example.com", avatar: "https://i.pravatar.cc/150?u=nisha", bio: "Fashion designer | Stylist", interests: ["fashion", "design", "art"], mood: "social" },
      { name: "Saanvi Gupta", username: "saanvi_g", email: "saanvi@example.com", avatar: "https://i.pravatar.cc/150?u=saanvi", bio: "Animal lover | Volunteer", interests: ["animals", "nature", "volunteering"], mood: "lonely" },
      { name: "Yash Malhotra", username: "yash_m", email: "yash@example.com", avatar: "https://i.pravatar.cc/150?u=yash", bio: "Cricket player | Sports lover", interests: ["cricket", "sports", "fitness"], mood: "social" },
      { name: "Tara Singh", username: "tara_s", email: "tara@example.com", avatar: "https://i.pravatar.cc/150?u=tara", bio: "Chef | Food content creator", interests: ["cooking", "food", "travel"], mood: "exploring" },
      { name: "Aarav Rao", username: "aarav_r", email: "aarav@example.com", avatar: "https://i.pravatar.cc/150?u=aarav", bio: "AI engineer | Tech geek", interests: ["ai", "tech", "coding"], mood: "bored" },
      { name: "Kiara Mehra", username: "kiara_m", email: "kiara@example.com", avatar: "https://i.pravatar.cc/150?u=kiara", bio: "Content creator | Influencer", interests: ["content", "socialmedia", "fashion"], mood: "social" },
      { name: "Reyansh Kapoor", username: "reyansh_k", email: "reyansh@example.com", avatar: "https://i.pravatar.cc/150?u=reyansh", bio: "Musician | Singer", interests: ["music", "singing", "guitar"], mood: "social" },
      { name: "Aadhya Verma", username: "aadhya_v", email: "aadhya@example.com", avatar: "https://i.pravatar.cc/150?u=aadhya", bio: "Psychology student | Writer", interests: ["psychology", "writing", "reading"], mood: "lonely" }
    ];

    const createdUsers = [];
    for (const u of userData) {
      const hashedPassword = await bcrypt.hash('123456', 10);
      const user = await User.create({
        ...u,
        password: hashedPassword,
        location: { lat: 28.6139 + (Math.random() * 0.1 - 0.05), lng: 77.2090 + (Math.random() * 0.1 - 0.05) }
      });
      createdUsers.push(user);
    }

    console.log(`✅ Created ${createdUsers.length} users`);

// ==================== 100 ACTIVITIES ====================
const activityTitles = [
  "Morning Hike at Aravalli Hills", "Sunday Music Jam Session", "Street Food Crawl in Old Delhi",
  "Tech Talk & Networking", "Yoga in the Park", "Photography Walk", "Board Game Night",
  "Startup Pitch Meetup", "Dance Workshop", "Book Club Discussion", "Cycling Adventure",
  "Cooking Masterclass", "Standup Comedy Open Mic", "Basketball Pickup Game", "Art & Craft Workshop"
];

// Expanded image pool (more variety)
const activityImages = [
  "https://picsum.photos/id/1015/800/600", // hike
  "https://picsum.photos/id/106/800/600",  // music
  "https://picsum.photos/id/292/800/600",  // food
  "https://picsum.photos/id/367/800/600",  // tech
  "https://picsum.photos/id/1018/800/600", // yoga
  "https://picsum.photos/id/133/800/600",  // photography
  "https://picsum.photos/id/201/800/600",  // games
  "https://picsum.photos/id/669/800/600",  // startup
  "https://picsum.photos/id/870/800/600",  // dance
  "https://picsum.photos/id/1016/800/600", // book
  "https://picsum.photos/id/145/800/600",  // nature
  "https://picsum.photos/id/201/800/600",  // city
  "https://picsum.photos/id/251/800/600",  // food 2
  "https://picsum.photos/id/870/800/600",  // people
  "https://picsum.photos/id/1005/800/600", // landscape
];

for (let i = 1; i <= 100; i++) {
  const creator = createdUsers[Math.floor(Math.random() * createdUsers.length)];

  // Randomly decide number of images: 1, 2, or 3
  const numImages = Math.floor(Math.random() * 3) + 1; // 1 to 3

  // Pick unique random images
  const shuffled = [...activityImages].sort(() => 0.5 - Math.random());
  const selectedImages = shuffled.slice(0, numImages);

  const activity = await Activity.create({
    title: `${activityTitles[Math.floor(Math.random() * activityTitles.length)]} #${i}`,
    description: `A fun activity to meet like-minded people and create great memories! Join us for an amazing time.`,
    creator: creator._id,
    images: selectedImages,                    // ← Now an array
    location: {
      lat: 28.6139 + (Math.random() * 0.15 - 0.075),
      lng: 77.2090 + (Math.random() * 0.15 - 0.075)
    },
    time: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000),
    interests: ["hiking", "music", "food", "tech", "fitness", "art"][Math.floor(Math.random() * 6)],
    likes: createdUsers.slice(0, Math.floor(Math.random() * 12)).map(u => u._id),
    messages: Array.from({ length: Math.floor(Math.random() * 12) + 4 }, () => ({
      sender: createdUsers[Math.floor(Math.random() * createdUsers.length)]._id,
      text: `This is an awesome activity! ${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date(Date.now() - Math.random() * 86400000 * 5)
    }))
  });
}

console.log(`✅ Created 100 activities with 1-3 random images each`);
    console.log(`✅ Created 100 activities with messages, likes, etc.`);

    // ==================== PRIVATE MESSAGES ====================
    for (let i = 0; i < 80; i++) {
      const from = createdUsers[Math.floor(Math.random() * createdUsers.length)];
      const to = createdUsers[Math.floor(Math.random() * createdUsers.length)];
      if (from._id.toString() === to._id.toString()) continue;

      await PrivateMessage.create({
        from: from._id,
        to: to._id,
        text: `Hey! How are you doing? ${i}`,
        createdAt: new Date(Date.now() - Math.random() * 86400000 * 10)
      });
    }

    console.log(`✅ Created private messages`);

    // ==================== NOTIFICATIONS ====================
    for (let i = 0; i < 120; i++) {
      const user = createdUsers[Math.floor(Math.random() * createdUsers.length)];
      await Notification.create({
        user: user._id,
        type: ['like', 'comment', 'friend_request', 'message'][Math.floor(Math.random() * 4)],
        from: createdUsers[Math.floor(Math.random() * createdUsers.length)]._id,
        message: 'Someone interacted with your activity!',
        read: Math.random() > 0.5
      });
    }

    console.log(`✅ Created notifications`);

    console.log('\n🎉 SEEDING COMPLETED SUCCESSFULLY!');
    console.log('20 Users + 100 Activities + Messages + Likes + Comments + Notifications + Private Chats');
    console.log('You can now login with any email (password: 123456)');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
};

// seedData();