const haversineDistance =require ('./haversine.js');

exports.calculateFeedScore = (activity, user, now = Date.now()) => {
  const distance = haversineDistance(
    user.location.lat, user.location.lng,
    activity.location.lat, activity.location.lng
  );

  const distanceScore = Math.max(0, (30 - distance) / 30); // 30km max
  const interestScore = user.interests.filter(i => 
    activity.interests?.includes(i)
  ).length / Math.max(user.interests.length, 1);

  const hoursOld = (now - new Date(activity.createdAt)) / 3600000;
  const recencyScore = Math.max(0, (48 - hoursOld) / 48);

  const popularityScore = Math.min(
    ((activity.participants?.length || 0) + (activity.likes?.length || 0)) / 20, 1
  );

  return (
    interestScore * 5 +
    distanceScore * 4 +
    recencyScore * 3 +
    popularityScore * 2
  );
};

exports.calculateExploreScore = (activity, user, now = Date.now()) => {
  const distance = haversineDistance(
    user.location.lat, user.location.lng,
    activity.location.lat, activity.location.lng
  );

  const interestScore = user.interests.filter(i => 
    activity.interests?.includes(i)
  ).length / Math.max(user.interests.length, 1);

  const hoursOld = (now - new Date(activity.createdAt)) / 3600000;
  const recencyScore = Math.max(0, (48 - hoursOld) / 48);

  const popularityScore = Math.min(
    ((activity.participants?.length || 0) + (activity.likes?.length || 0)) / 20, 1
  );

  return (
    (1 / (distance + 0.5)) * 5 +
    interestScore * 4 +
    recencyScore * 3 +
    popularityScore * 2
  );
};