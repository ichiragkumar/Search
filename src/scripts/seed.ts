import { PrismaClient } from "@prisma/client";
import { faker } from "@faker-js/faker";

const prisma = new PrismaClient();

const TENANT_ID = 1;
const RECORDS_PER_TABLE = 10000;

async function seed() {
  console.log("🌱 Starting database seeding...");
  console.log(`📊 Target: ${RECORDS_PER_TABLE} records per table`);

  // Seed Users
  console.log("👥 Seeding Users...");
  const users = [];
  for (let i = 0; i < RECORDS_PER_TABLE; i++) {
    users.push({
      tenantId: TENANT_ID,
      username: `user_${i}_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      email: `user${i}@example.com`,
      fullName: faker.person.fullName(),
      bio: faker.person.bio(),
      profilePicUrl: faker.image.avatar(),
      isVerified: Math.random() > 0.9,
      isPrivate: Math.random() > 0.7,
      isBusiness: Math.random() > 0.8,
      followerCount: Math.floor(Math.random() * 100000),
      followingCount: Math.floor(Math.random() * 5000),
      postCount: Math.floor(Math.random() * 1000),
    });
  }
  await prisma.user.createMany({ data: users });
  const createdUsers = await prisma.user.findMany({ take: RECORDS_PER_TABLE });
  console.log(`✅ Created ${createdUsers.length} users`);

  // Seed Hashtags
  console.log("🏷️  Seeding Hashtags...");
  const hashtags = [];
  for (let i = 0; i < RECORDS_PER_TABLE; i++) {
    hashtags.push({
      tenantId: TENANT_ID,
      name: `hashtag_${faker.word.noun()}_${i}`,
      postCount: Math.floor(Math.random() * 50000),
    });
  }
  await prisma.hashtag.createMany({ data: hashtags });
  const createdHashtags = await prisma.hashtag.findMany({ take: RECORDS_PER_TABLE });
  console.log(`✅ Created ${createdHashtags.length} hashtags`);

  // Seed Locations
  console.log("📍 Seeding Locations...");
  const locations = [];
  for (let i = 0; i < RECORDS_PER_TABLE; i++) {
    locations.push({
      tenantId: TENANT_ID,
      name: faker.location.city(),
      address: faker.location.streetAddress(),
      city: faker.location.city(),
      country: faker.location.country(),
      latitude: parseFloat(faker.location.latitude()),
      longitude: parseFloat(faker.location.longitude()),
      postCount: Math.floor(Math.random() * 10000),
    });
  }
  await prisma.location.createMany({ data: locations });
  const createdLocations = await prisma.location.findMany({ take: RECORDS_PER_TABLE });
  console.log(`✅ Created ${createdLocations.length} locations`);

  // Seed Music
  console.log("🎵 Seeding Music...");
  const music = [];
  for (let i = 0; i < RECORDS_PER_TABLE; i++) {
    music.push({
      tenantId: TENANT_ID,
      title: faker.music.songName(),
      artist: faker.person.fullName(),
      duration: Math.floor(Math.random() * 300) + 30,
      audioUrl: faker.internet.url(),
      coverUrl: faker.image.url(),
      usageCount: Math.floor(Math.random() * 100000),
    });
  }
  await prisma.music.createMany({ data: music });
  const createdMusic = await prisma.music.findMany({ take: RECORDS_PER_TABLE });
  console.log(`✅ Created ${createdMusic.length} music tracks`);

  // Seed Posts
  console.log("📸 Seeding Posts...");
  const posts = [];
  for (let i = 0; i < RECORDS_PER_TABLE; i++) {
    const userId = createdUsers[Math.floor(Math.random() * createdUsers.length)].id;
    const locationId = Math.random() > 0.5 ? createdLocations[Math.floor(Math.random() * createdLocations.length)].id : null;
    posts.push({
      tenantId: TENANT_ID,
      userId,
      caption: faker.lorem.sentence(),
      locationId,
      likeCount: Math.floor(Math.random() * 100000),
      commentCount: Math.floor(Math.random() * 10000),
      viewCount: Math.floor(Math.random() * 1000000),
      isArchived: Math.random() > 0.95,
    });
  }
  await prisma.post.createMany({ data: posts });
  const createdPosts = await prisma.post.findMany({ take: RECORDS_PER_TABLE });
  console.log(`✅ Created ${createdPosts.length} posts`);

  // Seed PostMedia
  console.log("🖼️  Seeding PostMedia...");
  const postMedia = [];
  for (let i = 0; i < RECORDS_PER_TABLE; i++) {
    const postId = createdPosts[Math.floor(Math.random() * createdPosts.length)].id;
    const mediaCount = Math.floor(Math.random() * 5) + 1;
    for (let j = 0; j < mediaCount; j++) {
      postMedia.push({
        tenantId: TENANT_ID,
        postId,
        mediaUrl: faker.image.url(),
        mediaType: Math.random() > 0.5 ? "image" : "video",
        orderIndex: j,
      });
    }
  }
  await prisma.postMedia.createMany({ data: postMedia });
  console.log(`✅ Created ${postMedia.length} post media items`);

  // Seed Stories
  console.log("📱 Seeding Stories...");
  const stories = [];
  for (let i = 0; i < RECORDS_PER_TABLE; i++) {
    const userId = createdUsers[Math.floor(Math.random() * createdUsers.length)].id;
    const locationId = Math.random() > 0.7 ? createdLocations[Math.floor(Math.random() * createdLocations.length)].id : null;
    const musicId = Math.random() > 0.5 ? createdMusic[Math.floor(Math.random() * createdMusic.length)].id : null;
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);
    stories.push({
      tenantId: TENANT_ID,
      userId,
      mediaUrl: faker.image.url(),
      caption: faker.lorem.sentence(),
      locationId,
      musicId,
      viewCount: Math.floor(Math.random() * 10000),
      expiresAt,
    });
  }
  await prisma.story.createMany({ data: stories });
  const createdStories = await prisma.story.findMany({ take: RECORDS_PER_TABLE });
  console.log(`✅ Created ${createdStories.length} stories`);

  // Seed Reels
  console.log("🎬 Seeding Reels...");
  const reels = [];
  for (let i = 0; i < RECORDS_PER_TABLE; i++) {
    const userId = createdUsers[Math.floor(Math.random() * createdUsers.length)].id;
    const locationId = Math.random() > 0.6 ? createdLocations[Math.floor(Math.random() * createdLocations.length)].id : null;
    const musicId = Math.random() > 0.4 ? createdMusic[Math.floor(Math.random() * createdMusic.length)].id : null;
    reels.push({
      tenantId: TENANT_ID,
      userId,
      videoUrl: faker.internet.url(),
      thumbnailUrl: faker.image.url(),
      caption: faker.lorem.sentence(),
      locationId,
      musicId,
      likeCount: Math.floor(Math.random() * 500000),
      commentCount: Math.floor(Math.random() * 50000),
      viewCount: Math.floor(Math.random() * 10000000),
      shareCount: Math.floor(Math.random() * 100000),
    });
  }
  await prisma.reel.createMany({ data: reels });
  const createdReels = await prisma.reel.findMany({ take: RECORDS_PER_TABLE });
  console.log(`✅ Created ${createdReels.length} reels`);

  // Seed IGTV
  console.log("📺 Seeding IGTV...");
  const igtv = [];
  for (let i = 0; i < RECORDS_PER_TABLE; i++) {
    const userId = createdUsers[Math.floor(Math.random() * createdUsers.length)].id;
    igtv.push({
      tenantId: TENANT_ID,
      userId,
      videoUrl: faker.internet.url(),
      thumbnailUrl: faker.image.url(),
      title: faker.lorem.sentence(),
      description: faker.lorem.paragraph(),
      duration: Math.floor(Math.random() * 3600) + 60,
      likeCount: Math.floor(Math.random() * 200000),
      commentCount: Math.floor(Math.random() * 20000),
      viewCount: Math.floor(Math.random() * 5000000),
    });
  }
  await prisma.iGTV.createMany({ data: igtv });
  const createdIGTV = await prisma.iGTV.findMany({ take: RECORDS_PER_TABLE });
  console.log(`✅ Created ${createdIGTV.length} IGTV videos`);

  // Seed Comments
  console.log("💬 Seeding Comments...");
  const comments = [];
  for (let i = 0; i < RECORDS_PER_TABLE; i++) {
    const postId = createdPosts[Math.floor(Math.random() * createdPosts.length)].id;
    const userId = createdUsers[Math.floor(Math.random() * createdUsers.length)].id;
    comments.push({
      tenantId: TENANT_ID,
      postId,
      userId,
      content: faker.lorem.sentence(),
      likeCount: Math.floor(Math.random() * 1000),
    });
  }
  await prisma.comment.createMany({ data: comments });
  const createdComments = await prisma.comment.findMany({ take: RECORDS_PER_TABLE });
  console.log(`✅ Created ${createdComments.length} comments`);

  // Seed Likes
  console.log("❤️  Seeding Likes...");
  const likes = [];
  const likeSet = new Set<string>();
  for (let i = 0; i < RECORDS_PER_TABLE; i++) {
    const postId = createdPosts[Math.floor(Math.random() * createdPosts.length)].id;
    const userId = createdUsers[Math.floor(Math.random() * createdUsers.length)].id;
    const key = `${postId}_${userId}`;
    if (!likeSet.has(key)) {
      likeSet.add(key);
      likes.push({
        tenantId: TENANT_ID,
        postId,
        userId,
      });
    }
  }
  await prisma.like.createMany({ data: likes });
  console.log(`✅ Created ${likes.length} likes`);

  // Seed Followers
  console.log("👫 Seeding Followers...");
  const followers = [];
  const followerSet = new Set<string>();
  for (let i = 0; i < RECORDS_PER_TABLE; i++) {
    const followerId = createdUsers[Math.floor(Math.random() * createdUsers.length)].id;
    const followingId = createdUsers[Math.floor(Math.random() * createdUsers.length)].id;
    if (followerId !== followingId) {
      const key = `${followerId}_${followingId}`;
      if (!followerSet.has(key)) {
        followerSet.add(key);
        followers.push({
          tenantId: TENANT_ID,
          followerId,
          followingId,
        });
      }
    }
  }
  await prisma.follower.createMany({ data: followers });
  console.log(`✅ Created ${followers.length} follower relationships`);

  // Seed SavedPosts
  console.log("💾 Seeding SavedPosts...");
  const savedPosts = [];
  const savedSet = new Set<string>();
  for (let i = 0; i < RECORDS_PER_TABLE; i++) {
    const userId = createdUsers[Math.floor(Math.random() * createdUsers.length)].id;
    const postId = createdPosts[Math.floor(Math.random() * createdPosts.length)].id;
    const key = `${userId}_${postId}`;
    if (!savedSet.has(key)) {
      savedSet.add(key);
      savedPosts.push({
        tenantId: TENANT_ID,
        userId,
        postId,
      });
    }
  }
  await prisma.savedPost.createMany({ data: savedPosts });
  console.log(`✅ Created ${savedPosts.length} saved posts`);

  // Seed Collections
  console.log("📚 Seeding Collections...");
  const collections = [];
  for (let i = 0; i < RECORDS_PER_TABLE; i++) {
    const userId = createdUsers[Math.floor(Math.random() * createdUsers.length)].id;
    collections.push({
      tenantId: TENANT_ID,
      userId,
      name: faker.lorem.words(3),
      description: faker.lorem.sentence(),
      isPrivate: Math.random() > 0.5,
    });
  }
  await prisma.collection.createMany({ data: collections });
  const createdCollections = await prisma.collection.findMany({ take: RECORDS_PER_TABLE });
  console.log(`✅ Created ${createdCollections.length} collections`);

  // Seed CollectionPosts
  console.log("📑 Seeding CollectionPosts...");
  const collectionPosts = [];
  const collectionPostSet = new Set<string>();
  for (let i = 0; i < RECORDS_PER_TABLE; i++) {
    const collectionId = createdCollections[Math.floor(Math.random() * createdCollections.length)].id;
    const postId = createdPosts[Math.floor(Math.random() * createdPosts.length)].id;
    const key = `${collectionId}_${postId}`;
    if (!collectionPostSet.has(key)) {
      collectionPostSet.add(key);
      collectionPosts.push({
        tenantId: TENANT_ID,
        collectionId,
        postId,
      });
    }
  }
  await prisma.collectionPost.createMany({ data: collectionPosts });
  console.log(`✅ Created ${collectionPosts.length} collection posts`);

  // Seed Messages
  console.log("📨 Seeding Messages...");
  const messages = [];
  for (let i = 0; i < RECORDS_PER_TABLE; i++) {
    const senderId = createdUsers[Math.floor(Math.random() * createdUsers.length)].id;
    let receiverId = createdUsers[Math.floor(Math.random() * createdUsers.length)].id;
    while (receiverId === senderId) {
      receiverId = createdUsers[Math.floor(Math.random() * createdUsers.length)].id;
    }
    messages.push({
      tenantId: TENANT_ID,
      senderId,
      receiverId,
      content: faker.lorem.sentence(),
      mediaUrl: Math.random() > 0.7 ? faker.image.url() : null,
      isRead: Math.random() > 0.3,
    });
  }
  await prisma.message.createMany({ data: messages });
  console.log(`✅ Created ${messages.length} messages`);

  // Seed Notifications
  console.log("🔔 Seeding Notifications...");
  const notifications = [];
  for (let i = 0; i < RECORDS_PER_TABLE; i++) {
    const userId = createdUsers[Math.floor(Math.random() * createdUsers.length)].id;
    const types = ["like", "comment", "follow", "mention", "message"];
    notifications.push({
      tenantId: TENANT_ID,
      userId,
      type: types[Math.floor(Math.random() * types.length)],
      content: faker.lorem.sentence(),
      isRead: Math.random() > 0.4,
    });
  }
  await prisma.notification.createMany({ data: notifications });
  console.log(`✅ Created ${notifications.length} notifications`);

  // Seed Highlights
  console.log("⭐ Seeding Highlights...");
  const highlights = [];
  for (let i = 0; i < RECORDS_PER_TABLE; i++) {
    const userId = createdUsers[Math.floor(Math.random() * createdUsers.length)].id;
    highlights.push({
      tenantId: TENANT_ID,
      userId,
      name: faker.lorem.words(2),
      coverUrl: faker.image.url(),
    });
  }
  await prisma.highlight.createMany({ data: highlights });
  const createdHighlights = await prisma.highlight.findMany({ take: RECORDS_PER_TABLE });
  console.log(`✅ Created ${createdHighlights.length} highlights`);

  // Seed HighlightStories
  console.log("📌 Seeding HighlightStories...");
  const highlightStories = [];
  const highlightStorySet = new Set<string>();
  for (let i = 0; i < RECORDS_PER_TABLE; i++) {
    const highlightId = createdHighlights[Math.floor(Math.random() * createdHighlights.length)].id;
    const storyId = createdStories[Math.floor(Math.random() * createdStories.length)].id;
    const key = `${highlightId}_${storyId}`;
    if (!highlightStorySet.has(key)) {
      highlightStorySet.add(key);
      highlightStories.push({
        tenantId: TENANT_ID,
        highlightId,
        storyId,
      });
    }
  }
  await prisma.highlightStory.createMany({ data: highlightStories });
  console.log(`✅ Created ${highlightStories.length} highlight stories`);

  // Seed LiveStreams
  console.log("📹 Seeding LiveStreams...");
  const liveStreams = [];
  for (let i = 0; i < RECORDS_PER_TABLE; i++) {
    const userId = createdUsers[Math.floor(Math.random() * createdUsers.length)].id;
    liveStreams.push({
      tenantId: TENANT_ID,
      userId,
      streamUrl: faker.internet.url(),
      title: faker.lorem.sentence(),
      viewerCount: Math.floor(Math.random() * 10000),
      isActive: Math.random() > 0.8,
      endedAt: Math.random() > 0.7 ? faker.date.past() : null,
    });
  }
  await prisma.liveStream.createMany({ data: liveStreams });
  const createdLiveStreams = await prisma.liveStream.findMany({ take: RECORDS_PER_TABLE });
  console.log(`✅ Created ${createdLiveStreams.length} live streams`);

  // Seed ShoppingProducts
  console.log("🛍️  Seeding ShoppingProducts...");
  const shoppingProducts = [];
  for (let i = 0; i < RECORDS_PER_TABLE; i++) {
    const userId = createdUsers[Math.floor(Math.random() * createdUsers.length)].id;
    shoppingProducts.push({
      tenantId: TENANT_ID,
      userId,
      name: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
      price: parseFloat(faker.commerce.price()),
      currency: "USD",
      imageUrl: faker.image.url(),
      productUrl: faker.internet.url(),
      isAvailable: Math.random() > 0.1,
    });
  }
  await prisma.shoppingProduct.createMany({ data: shoppingProducts });
  console.log(`✅ Created ${shoppingProducts.length} shopping products`);

  // Seed BusinessProfiles
  console.log("🏢 Seeding BusinessProfiles...");
  const businessProfiles = [];
  const businessUsers = createdUsers.filter((_, i) => i % 10 === 0).slice(0, RECORDS_PER_TABLE);
  for (const user of businessUsers) {
    businessProfiles.push({
      tenantId: TENANT_ID,
      userId: user.id,
      businessName: faker.company.name(),
      category: faker.commerce.department(),
      website: faker.internet.url(),
      phone: faker.phone.number(),
      email: faker.internet.email(),
      address: faker.location.streetAddress(),
    });
  }
  await prisma.businessProfile.createMany({ data: businessProfiles });
  console.log(`✅ Created ${businessProfiles.length} business profiles`);

  // Seed CreatorProfiles
  console.log("🎨 Seeding CreatorProfiles...");
  const creatorProfiles = [];
  const creatorUsers = createdUsers.filter((_, i) => i % 5 === 0).slice(0, RECORDS_PER_TABLE);
  for (const user of creatorUsers) {
    creatorProfiles.push({
      tenantId: TENANT_ID,
      userId: user.id,
      category: faker.commerce.department(),
      niche: faker.word.noun(),
      brandDeals: Math.floor(Math.random() * 100),
    });
  }
  await prisma.creatorProfile.createMany({ data: creatorProfiles });
  console.log(`✅ Created ${creatorProfiles.length} creator profiles`);

  // Seed PostTags
  console.log("🏷️  Seeding PostTags...");
  const postTags = [];
  const postTagSet = new Set<string>();
  for (let i = 0; i < RECORDS_PER_TABLE; i++) {
    const postId = createdPosts[Math.floor(Math.random() * createdPosts.length)].id;
    const userId = createdUsers[Math.floor(Math.random() * createdUsers.length)].id;
    const key = `${postId}_${userId}`;
    if (!postTagSet.has(key)) {
      postTagSet.add(key);
      postTags.push({
        tenantId: TENANT_ID,
        postId,
        userId,
        x: Math.random(),
        y: Math.random(),
      });
    }
  }
  await prisma.postTag.createMany({ data: postTags });
  console.log(`✅ Created ${postTags.length} post tags`);

  // Seed PostMentions
  console.log("📝 Seeding PostMentions...");
  const postMentions = [];
  const postMentionSet = new Set<string>();
  for (let i = 0; i < RECORDS_PER_TABLE; i++) {
    const postId = createdPosts[Math.floor(Math.random() * createdPosts.length)].id;
    const userId = createdUsers[Math.floor(Math.random() * createdUsers.length)].id;
    const key = `${postId}_${userId}`;
    if (!postMentionSet.has(key)) {
      postMentionSet.add(key);
      postMentions.push({
        tenantId: TENANT_ID,
        postId,
        userId,
      });
    }
  }
  await prisma.postMention.createMany({ data: postMentions });
  console.log(`✅ Created ${postMentions.length} post mentions`);

  // Seed PostHashtags
  console.log("🔖 Seeding PostHashtags...");
  const postHashtags = [];
  const postHashtagSet = new Set<string>();
  for (let i = 0; i < RECORDS_PER_TABLE; i++) {
    const postId = createdPosts[Math.floor(Math.random() * createdPosts.length)].id;
    const hashtagId = createdHashtags[Math.floor(Math.random() * createdHashtags.length)].id;
    const key = `${postId}_${hashtagId}`;
    if (!postHashtagSet.has(key)) {
      postHashtagSet.add(key);
      postHashtags.push({
        tenantId: TENANT_ID,
        postId,
        hashtagId,
      });
    }
  }
  await prisma.postHashtag.createMany({ data: postHashtags });
  console.log(`✅ Created ${postHashtags.length} post hashtags`);

  // Seed StoryViews
  console.log("👁️  Seeding StoryViews...");
  const storyViews = [];
  const storyViewSet = new Set<string>();
  for (let i = 0; i < RECORDS_PER_TABLE; i++) {
    const storyId = createdStories[Math.floor(Math.random() * createdStories.length)].id;
    const userId = createdUsers[Math.floor(Math.random() * createdUsers.length)].id;
    const key = `${storyId}_${userId}`;
    if (!storyViewSet.has(key)) {
      storyViewSet.add(key);
      storyViews.push({
        tenantId: TENANT_ID,
        storyId,
        userId,
      });
    }
  }
  await prisma.storyView.createMany({ data: storyViews });
  console.log(`✅ Created ${storyViews.length} story views`);

  // Seed StoryReactions
  console.log("😍 Seeding StoryReactions...");
  const storyReactions = [];
  const storyReactionSet = new Set<string>();
  for (let i = 0; i < RECORDS_PER_TABLE; i++) {
    const storyId = createdStories[Math.floor(Math.random() * createdStories.length)].id;
    const userId = createdUsers[Math.floor(Math.random() * createdUsers.length)].id;
    const key = `${storyId}_${userId}`;
    if (!storyReactionSet.has(key)) {
      storyReactionSet.add(key);
      storyReactions.push({
        tenantId: TENANT_ID,
        storyId,
        userId,
        reactionType: ["like", "love", "laugh", "wow"][Math.floor(Math.random() * 4)],
      });
    }
  }
  await prisma.storyReaction.createMany({ data: storyReactions });
  console.log(`✅ Created ${storyReactions.length} story reactions`);

  // Seed StoryReplies
  console.log("💭 Seeding StoryReplies...");
  const storyReplies = [];
  for (let i = 0; i < RECORDS_PER_TABLE; i++) {
    const storyId = createdStories[Math.floor(Math.random() * createdStories.length)].id;
    const userId = createdUsers[Math.floor(Math.random() * createdUsers.length)].id;
    storyReplies.push({
      tenantId: TENANT_ID,
      storyId,
      userId,
      content: faker.lorem.sentence(),
    });
  }
  await prisma.storyReply.createMany({ data: storyReplies });
  console.log(`✅ Created ${storyReplies.length} story replies`);

  // Seed StoryMentions
  console.log("📌 Seeding StoryMentions...");
  const storyMentions = [];
  const storyMentionSet = new Set<string>();
  for (let i = 0; i < RECORDS_PER_TABLE; i++) {
    const storyId = createdStories[Math.floor(Math.random() * createdStories.length)].id;
    const userId = createdUsers[Math.floor(Math.random() * createdUsers.length)].id;
    const key = `${storyId}_${userId}`;
    if (!storyMentionSet.has(key)) {
      storyMentionSet.add(key);
      storyMentions.push({
        tenantId: TENANT_ID,
        storyId,
        userId,
      });
    }
  }
  await prisma.storyMention.createMany({ data: storyMentions });
  console.log(`✅ Created ${storyMentions.length} story mentions`);

  // Seed StoryTags
  console.log("🏷️  Seeding StoryTags...");
  const storyTags = [];
  const storyTagSet = new Set<string>();
  for (let i = 0; i < RECORDS_PER_TABLE; i++) {
    const storyId = createdStories[Math.floor(Math.random() * createdStories.length)].id;
    const userId = createdUsers[Math.floor(Math.random() * createdUsers.length)].id;
    const key = `${storyId}_${userId}`;
    if (!storyTagSet.has(key)) {
      storyTagSet.add(key);
      storyTags.push({
        tenantId: TENANT_ID,
        storyId,
        userId,
        x: Math.random(),
        y: Math.random(),
      });
    }
  }
  await prisma.storyTag.createMany({ data: storyTags });
  console.log(`✅ Created ${storyTags.length} story tags`);

  // Seed ReelComments
  console.log("💬 Seeding ReelComments...");
  const reelComments = [];
  for (let i = 0; i < RECORDS_PER_TABLE; i++) {
    const reelId = createdReels[Math.floor(Math.random() * createdReels.length)].id;
    const userId = createdUsers[Math.floor(Math.random() * createdUsers.length)].id;
    reelComments.push({
      tenantId: TENANT_ID,
      reelId,
      userId,
      content: faker.lorem.sentence(),
      likeCount: Math.floor(Math.random() * 5000),
    });
  }
  await prisma.reelComment.createMany({ data: reelComments });
  console.log(`✅ Created ${reelComments.length} reel comments`);

  // Seed ReelLikes
  console.log("❤️  Seeding ReelLikes...");
  const reelLikes = [];
  const reelLikeSet = new Set<string>();
  for (let i = 0; i < RECORDS_PER_TABLE; i++) {
    const reelId = createdReels[Math.floor(Math.random() * createdReels.length)].id;
    const userId = createdUsers[Math.floor(Math.random() * createdUsers.length)].id;
    const key = `${reelId}_${userId}`;
    if (!reelLikeSet.has(key)) {
      reelLikeSet.add(key);
      reelLikes.push({
        tenantId: TENANT_ID,
        reelId,
        userId,
      });
    }
  }
  await prisma.reelLike.createMany({ data: reelLikes });
  console.log(`✅ Created ${reelLikes.length} reel likes`);

  // Seed ReelTags
  console.log("🏷️  Seeding ReelTags...");
  const reelTags = [];
  const reelTagSet = new Set<string>();
  for (let i = 0; i < RECORDS_PER_TABLE; i++) {
    const reelId = createdReels[Math.floor(Math.random() * createdReels.length)].id;
    const userId = createdUsers[Math.floor(Math.random() * createdUsers.length)].id;
    const key = `${reelId}_${userId}`;
    if (!reelTagSet.has(key)) {
      reelTagSet.add(key);
      reelTags.push({
        tenantId: TENANT_ID,
        reelId,
        userId,
      });
    }
  }
  await prisma.reelTag.createMany({ data: reelTags });
  console.log(`✅ Created ${reelTags.length} reel tags`);

  // Seed ReelMentions
  console.log("📝 Seeding ReelMentions...");
  const reelMentions = [];
  const reelMentionSet = new Set<string>();
  for (let i = 0; i < RECORDS_PER_TABLE; i++) {
    const reelId = createdReels[Math.floor(Math.random() * createdReels.length)].id;
    const userId = createdUsers[Math.floor(Math.random() * createdUsers.length)].id;
    const key = `${reelId}_${userId}`;
    if (!reelMentionSet.has(key)) {
      reelMentionSet.add(key);
      reelMentions.push({
        tenantId: TENANT_ID,
        reelId,
        userId,
      });
    }
  }
  await prisma.reelMention.createMany({ data: reelMentions });
  console.log(`✅ Created ${reelMentions.length} reel mentions`);

  // Seed ReelHashtags
  console.log("🔖 Seeding ReelHashtags...");
  const reelHashtags = [];
  const reelHashtagSet = new Set<string>();
  for (let i = 0; i < RECORDS_PER_TABLE; i++) {
    const reelId = createdReels[Math.floor(Math.random() * createdReels.length)].id;
    const hashtagId = createdHashtags[Math.floor(Math.random() * createdHashtags.length)].id;
    const key = `${reelId}_${hashtagId}`;
    if (!reelHashtagSet.has(key)) {
      reelHashtagSet.add(key);
      reelHashtags.push({
        tenantId: TENANT_ID,
        reelId,
        hashtagId,
      });
    }
  }
  await prisma.reelHashtag.createMany({ data: reelHashtags });
  console.log(`✅ Created ${reelHashtags.length} reel hashtags`);

  // Seed IGTVComments
  console.log("💬 Seeding IGTVComments...");
  const igtvComments = [];
  for (let i = 0; i < RECORDS_PER_TABLE; i++) {
    const igtvId = createdIGTV[Math.floor(Math.random() * createdIGTV.length)].id;
    const userId = createdUsers[Math.floor(Math.random() * createdUsers.length)].id;
    igtvComments.push({
      tenantId: TENANT_ID,
      igtvId,
      userId,
      content: faker.lorem.sentence(),
      likeCount: Math.floor(Math.random() * 2000),
    });
  }
  await prisma.iGTVComment.createMany({ data: igtvComments });
  console.log(`✅ Created ${igtvComments.length} IGTV comments`);

  // Seed IGTVLikes
  console.log("❤️  Seeding IGTVLikes...");
  const igtvLikes = [];
  const igtvLikeSet = new Set<string>();
  for (let i = 0; i < RECORDS_PER_TABLE; i++) {
    const igtvId = createdIGTV[Math.floor(Math.random() * createdIGTV.length)].id;
    const userId = createdUsers[Math.floor(Math.random() * createdUsers.length)].id;
    const key = `${igtvId}_${userId}`;
    if (!igtvLikeSet.has(key)) {
      igtvLikeSet.add(key);
      igtvLikes.push({
        tenantId: TENANT_ID,
        igtvId,
        userId,
      });
    }
  }
  await prisma.iGTVLike.createMany({ data: igtvLikes });
  console.log(`✅ Created ${igtvLikes.length} IGTV likes`);

  // Seed IGTVTags
  console.log("🏷️  Seeding IGTVTags...");
  const igtvTags = [];
  const igtvTagSet = new Set<string>();
  for (let i = 0; i < RECORDS_PER_TABLE; i++) {
    const igtvId = createdIGTV[Math.floor(Math.random() * createdIGTV.length)].id;
    const userId = createdUsers[Math.floor(Math.random() * createdUsers.length)].id;
    const key = `${igtvId}_${userId}`;
    if (!igtvTagSet.has(key)) {
      igtvTagSet.add(key);
      igtvTags.push({
        tenantId: TENANT_ID,
        igtvId,
        userId,
      });
    }
  }
  await prisma.iGTVTag.createMany({ data: igtvTags });
  console.log(`✅ Created ${igtvTags.length} IGTV tags`);

  // Seed IGTVMentions
  console.log("📝 Seeding IGTVMentions...");
  const igtvMentions = [];
  const igtvMentionSet = new Set<string>();
  for (let i = 0; i < RECORDS_PER_TABLE; i++) {
    const igtvId = createdIGTV[Math.floor(Math.random() * createdIGTV.length)].id;
    const userId = createdUsers[Math.floor(Math.random() * createdUsers.length)].id;
    const key = `${igtvId}_${userId}`;
    if (!igtvMentionSet.has(key)) {
      igtvMentionSet.add(key);
      igtvMentions.push({
        tenantId: TENANT_ID,
        igtvId,
        userId,
      });
    }
  }
  await prisma.iGTVMention.createMany({ data: igtvMentions });
  console.log(`✅ Created ${igtvMentions.length} IGTV mentions`);

  // Seed IGTVHashtags
  console.log("🔖 Seeding IGTVHashtags...");
  const igtvHashtags = [];
  const igtvHashtagSet = new Set<string>();
  for (let i = 0; i < RECORDS_PER_TABLE; i++) {
    const igtvId = createdIGTV[Math.floor(Math.random() * createdIGTV.length)].id;
    const hashtagId = createdHashtags[Math.floor(Math.random() * createdHashtags.length)].id;
    const key = `${igtvId}_${hashtagId}`;
    if (!igtvHashtagSet.has(key)) {
      igtvHashtagSet.add(key);
      igtvHashtags.push({
        tenantId: TENANT_ID,
        igtvId,
        hashtagId,
      });
    }
  }
  await prisma.iGTVHashtag.createMany({ data: igtvHashtags });
  console.log(`✅ Created ${igtvHashtags.length} IGTV hashtags`);

  // Seed CommentLikes
  console.log("❤️  Seeding CommentLikes...");
  const commentLikes = [];
  const commentLikeSet = new Set<string>();
  for (let i = 0; i < RECORDS_PER_TABLE; i++) {
    const commentId = createdComments[Math.floor(Math.random() * createdComments.length)].id;
    const userId = createdUsers[Math.floor(Math.random() * createdUsers.length)].id;
    const key = `${commentId}_${userId}`;
    if (!commentLikeSet.has(key)) {
      commentLikeSet.add(key);
      commentLikes.push({
        tenantId: TENANT_ID,
        commentId,
        userId,
      });
    }
  }
  await prisma.commentLike.createMany({ data: commentLikes });
  console.log(`✅ Created ${commentLikes.length} comment likes`);

  // Seed CommentReplies
  console.log("💭 Seeding CommentReplies...");
  const commentReplies = [];
  for (let i = 0; i < RECORDS_PER_TABLE; i++) {
    const commentId = createdComments[Math.floor(Math.random() * createdComments.length)].id;
    const userId = createdUsers[Math.floor(Math.random() * createdUsers.length)].id;
    commentReplies.push({
      tenantId: TENANT_ID,
      commentId,
      userId,
      content: faker.lorem.sentence(),
      likeCount: Math.floor(Math.random() * 500),
    });
  }
  await prisma.commentReply.createMany({ data: commentReplies });
  console.log(`✅ Created ${commentReplies.length} comment replies`);

  // Seed CommentMentions
  console.log("📝 Seeding CommentMentions...");
  const commentMentions = [];
  const commentMentionSet = new Set<string>();
  for (let i = 0; i < RECORDS_PER_TABLE; i++) {
    const commentId = createdComments[Math.floor(Math.random() * createdComments.length)].id;
    const userId = createdUsers[Math.floor(Math.random() * createdUsers.length)].id;
    const key = `${commentId}_${userId}`;
    if (!commentMentionSet.has(key)) {
      commentMentionSet.add(key);
      commentMentions.push({
        tenantId: TENANT_ID,
        commentId,
        userId,
      });
    }
  }
  await prisma.commentMention.createMany({ data: commentMentions });
  console.log(`✅ Created ${commentMentions.length} comment mentions`);

  // Seed LiveStreamComments
  console.log("💬 Seeding LiveStreamComments...");
  const liveStreamComments = [];
  for (let i = 0; i < RECORDS_PER_TABLE; i++) {
    const liveStreamId = createdLiveStreams[Math.floor(Math.random() * createdLiveStreams.length)].id;
    const userId = createdUsers[Math.floor(Math.random() * createdUsers.length)].id;
    liveStreamComments.push({
      tenantId: TENANT_ID,
      liveStreamId,
      userId,
      content: faker.lorem.sentence(),
    });
  }
  await prisma.liveStreamComment.createMany({ data: liveStreamComments });
  console.log(`✅ Created ${liveStreamComments.length} live stream comments`);

  // Seed LiveStreamViewers
  console.log("👁️  Seeding LiveStreamViewers...");
  const liveStreamViewers = [];
  const liveStreamViewerSet = new Set<string>();
  for (let i = 0; i < RECORDS_PER_TABLE; i++) {
    const liveStreamId = createdLiveStreams[Math.floor(Math.random() * createdLiveStreams.length)].id;
    const userId = createdUsers[Math.floor(Math.random() * createdUsers.length)].id;
    const key = `${liveStreamId}_${userId}`;
    if (!liveStreamViewerSet.has(key)) {
      liveStreamViewerSet.add(key);
      liveStreamViewers.push({
        tenantId: TENANT_ID,
        liveStreamId,
        userId,
      });
    }
  }
  await prisma.liveStreamViewer.createMany({ data: liveStreamViewers });
  console.log(`✅ Created ${liveStreamViewers.length} live stream viewers`);

  console.log("🎉 Seeding completed successfully!");
}

seed()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
