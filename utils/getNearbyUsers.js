const User = require('../Models/user');

/**
 * Calculate the distance between two geographical points using the Haversine formula.
 * @param {Object} loc1 - Location 1 with latitude and longitude.
 * @param {Object} loc2 - Location 2 with latitude and longitude.
 * @returns {number} - Distance in kilometers.
 */
const calculateDistance = (loc1, loc2) => {
  const toRadians = (degrees) => (degrees * Math.PI) / 180;

  const earthRadiusKm = 6371; // Radius of the Earth in km
  const dLat = toRadians(loc2.lat - loc1.lat);
  const dLng = toRadians(loc2.lng - loc1.lng);

  const lat1 = toRadians(loc1.lat);
  const lat2 = toRadians(loc2.lat);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusKm * c;
};

/**
 * Get users close to a given user's location within a specified distance.
 * @param {Object} currentUser - The user object for the current user.
 * @param {number} distance - The distance in kilometers.
 * @returns {Promise<Array>} - List of nearby users.
 */
const getNearbyUsers = async (currentUser, distance) => {
  const { location } = currentUser;

  if (!location || location.lat == null || location.lng == null) {
    throw new Error("Current user's location is invalid or not set.");
  }
  // Fetch all users except the current user
  const allUsers = await User.findAll({
    where: { id: { [require('sequelize').Op.ne]: currentUser.id } },
  });
  
  // Filter users based on distance
  const nearbyUsers = allUsers.filter((user) => {
    if (!user.location || !user.location.lat || !user.location.lng) {
      return false; // Skip users without valid locations
    }
    const userDistance = calculateDistance(location, user.location);
    return userDistance <= distance;
  });

  return nearbyUsers;
};

module.exports = getNearbyUsers; 
