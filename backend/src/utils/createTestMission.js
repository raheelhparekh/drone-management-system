import Drone from '../models/droneModel.js';
import Mission from '../models/missionModel.js';

// Function to create a test mission with interesting waypoints
export const createTestMission = async (userId) => {
  try {
    // Find an available drone
    const availableDrone = await Drone.findOne({ 
      user: userId, 
      status: { $in: ['available', 'charging'] } 
    });

    if (!availableDrone) {
      throw new Error('No available drone found. Please create a drone first.');
    }

    // Create a mission with waypoints that form an interesting path
    // These coordinates will create a path around Manhattan, NYC
    const missionData = {
      user: userId,
      drone: availableDrone._id,
      name: 'Manhattan Survey Demo',
      description: 'Demo mission to show real-time coordinate tracking across Manhattan landmarks',
      status: 'planned',
      flightPath: [
        // Start at Central Park
        { latitude: 40.785091, longitude: -73.968285, altitude: 50 },
        // Move to Times Square area
        { latitude: 40.758895, longitude: -73.985131, altitude: 50 },
        // Head to Brooklyn Bridge
        { latitude: 40.706086, longitude: -73.996864, altitude: 50 },
        // Go to Statue of Liberty area
        { latitude: 40.689247, longitude: -74.044502, altitude: 50 },
        // Move to Hudson River Park
        { latitude: 40.729030, longitude: -74.005333, altitude: 50 },
        // Return to Empire State Building area
        { latitude: 40.748817, longitude: -73.985428, altitude: 50 },
        // End at Central Park (complete the circuit)
        { latitude: 40.785091, longitude: -73.968285, altitude: 50 }
      ],
      config: {
        flightAltitude: 50,
        overlapPercentage: 70
      },
      progress: 0
    };

    // Create the mission
    const mission = await Mission.create(missionData);
    
    // Update drone status to available (in case it was charging)
    await Drone.findByIdAndUpdate(availableDrone._id, { 
      status: 'available',
      // Set initial position to first waypoint
      location: {
        latitude: missionData.flightPath[0].latitude,
        longitude: missionData.flightPath[0].longitude
      }
    });

    console.log(`✅ Test mission created successfully: ${mission.name}`);
    console.log(`🚁 Assigned to drone: ${availableDrone.serialNumber}`);
    console.log(`📍 Flight path with ${missionData.flightPath.length} waypoints created`);
    console.log(`🗺️  Path covers major NYC landmarks for visible coordinate changes`);

    return {
      success: true,
      mission,
      drone: availableDrone,
      message: `Test mission "${mission.name}" created with ${missionData.flightPath.length} waypoints`
    };

  } catch (error) {
    console.error('❌ Error creating test mission:', error.message);
    return {
      success: false,
      message: error.message
    };
  }
};

// Function to start the test mission automatically
export const startTestMission = async (userId) => {
  try {
    // Find the most recent planned mission
    const mission = await Mission.findOne({
      user: userId,
      status: 'planned'
    }).sort({ createdAt: -1 }).populate('drone');

    if (!mission) {
      throw new Error('No planned mission found to start');
    }

    // Update mission status to in-progress
    const updatedMission = await Mission.findByIdAndUpdate(
      mission._id,
      {
        status: 'in-progress',
        startTime: new Date()
      },
      { new: true }
    ).populate('drone');

    // Update drone status to in-mission
    await Drone.findByIdAndUpdate(mission.drone._id, {
      status: 'in-mission'
    });

    console.log(`🚀 Test mission started: ${mission.name}`);
    console.log(`🚁 Drone ${mission.drone.serialNumber} is now in-mission`);
    console.log(`📊 Ready for coordinate tracking simulation!`);

    return {
      success: true,
      mission: updatedMission,
      message: `Mission "${mission.name}" started successfully`
    };

  } catch (error) {
    console.error('❌ Error starting test mission:', error.message);
    return {
      success: false,
      message: error.message
    };
  }
};
