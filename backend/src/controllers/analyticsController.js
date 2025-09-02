import Mission from '../models/missionModel.js';
import Drone from '../models/droneModel.js';

// Get comprehensive dashboard analytics
export const getDashboardAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all user missions and drones
    const [missions, drones] = await Promise.all([
      Mission.find({ user: userId }).populate('assignedDrone'),
      Drone.find({ user: userId })
    ]);

    // Calculate fleet statistics
    const fleetStats = {
      totalDrones: drones.length,
      activeDrones: drones.filter(drone => drone.status === 'in-mission').length,
      availableDrones: drones.filter(drone => drone.status === 'available').length,
      maintenanceDrones: drones.filter(drone => drone.status === 'maintenance').length,
      averageBattery: drones.length > 0 ? 
        Math.round(drones.reduce((sum, drone) => sum + drone.battery, 0) / drones.length) : 0
    };

    // Calculate mission statistics
    const missionStats = {
      totalMissions: missions.length,
      activeMissions: missions.filter(m => m.status === 'in-progress').length,
      completedMissions: missions.filter(m => m.status === 'completed').length,
      pendingMissions: missions.filter(m => m.status === 'pending').length,
      abortedMissions: missions.filter(m => m.status === 'aborted').length
    };

    // Calculate survey statistics
    const surveyMissions = missions.filter(m => m.type === 'survey');
    const completedSurveys = surveyMissions.filter(m => m.status === 'completed');
    
    const surveyStats = {
      totalSurveys: surveyMissions.length,
      completedSurveys: completedSurveys.length,
      totalAreaCovered: completedSurveys.reduce((sum, mission) => 
        sum + (mission.flightStats?.areaCovered || 0), 0),
      totalFlightTime: completedSurveys.reduce((sum, mission) => 
        sum + (mission.flightStats?.duration || 0), 0),
      totalDistance: completedSurveys.reduce((sum, mission) => 
        sum + (mission.flightStats?.distanceCovered || 0), 0),
      averageFlightTime: completedSurveys.length > 0 ?
        Math.round(completedSurveys.reduce((sum, mission) => 
          sum + (mission.flightStats?.duration || 0), 0) / completedSurveys.length) : 0
    };

    // Get recent missions for timeline
    const recentMissions = missions
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, 10)
      .map(mission => ({
        id: mission._id,
        name: mission.name,
        status: mission.status,
        type: mission.type,
        progress: mission.progress?.percentage || 0,
        drone: mission.assignedDrone?.name || 'Unassigned',
        updatedAt: mission.updatedAt
      }));

    // Battery levels for fleet monitoring
    const batteryLevels = drones.map(drone => ({
      id: drone._id,
      name: drone.name,
      battery: drone.battery,
      status: drone.status
    }));

    res.json({
      fleetStats,
      missionStats,
      surveyStats,
      recentMissions,
      batteryLevels
    });

  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ message: 'Server error fetching analytics' });
  }
};

// Get detailed mission analytics
export const getMissionAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;
    const { timeRange = '30' } = req.query; // days

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(timeRange));

    const missions = await Mission.find({
      user: userId,
      createdAt: { $gte: startDate }
    }).populate('assignedDrone');

    // Mission performance over time
    const dailyStats = {};
    missions.forEach(mission => {
      const date = mission.createdAt.toISOString().split('T')[0];
      if (!dailyStats[date]) {
        dailyStats[date] = {
          date,
          missions: 0,
          completed: 0,
          flightTime: 0,
          areaCovered: 0
        };
      }
      dailyStats[date].missions++;
      if (mission.status === 'completed') {
        dailyStats[date].completed++;
        dailyStats[date].flightTime += mission.flightStats?.duration || 0;
        dailyStats[date].areaCovered += mission.flightStats?.areaCovered || 0;
      }
    });

    const performanceData = Object.values(dailyStats).sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );

    // Mission types distribution
    const typeDistribution = missions.reduce((acc, mission) => {
      acc[mission.type] = (acc[mission.type] || 0) + 1;
      return acc;
    }, {});

    // Status distribution
    const statusDistribution = missions.reduce((acc, mission) => {
      acc[mission.status] = (acc[mission.status] || 0) + 1;
      return acc;
    }, {});

    res.json({
      performanceData,
      typeDistribution,
      statusDistribution,
      totalMissions: missions.length
    });

  } catch (error) {
    console.error('Mission analytics error:', error);
    res.status(500).json({ message: 'Server error fetching mission analytics' });
  }
};

// Get fleet performance analytics
export const getFleetAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;
    const drones = await Drone.find({ user: userId });

    // Fleet utilization
    const fleetUtilization = drones.map(drone => ({
      id: drone._id,
      name: drone.name,
      model: drone.model,
      totalFlightTime: drone.totalStats?.totalFlightTime || 0,
      totalMissions: drone.totalStats?.totalMissions || 0,
      utilization: drone.totalStats?.totalFlightTime ? 
        Math.min(100, (drone.totalStats.totalFlightTime / (30 * 24 * 60)) * 100) : 0, // 30 days
      status: drone.status,
      battery: drone.battery
    }));

    // Battery health trends
    const batteryTrends = drones.map(drone => ({
      name: drone.name,
      current: drone.battery,
      trend: Math.random() > 0.5 ? 'up' : 'down', // Would be calculated from historical data
      health: drone.battery > 80 ? 'good' : drone.battery > 50 ? 'fair' : 'poor'
    }));

    res.json({
      fleetUtilization,
      batteryTrends,
      totalDrones: drones.length
    });

  } catch (error) {
    console.error('Fleet analytics error:', error);
    res.status(500).json({ message: 'Server error fetching fleet analytics' });
  }
};

// Get live mission data for real-time monitoring
export const getLiveMissionData = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const activeMissions = await Mission.find({
      user: userId,
      status: 'in-progress'
    }).populate('assignedDrone');

    const liveMissions = activeMissions.map(mission => ({
      id: mission._id,
      name: mission.name,
      drone: {
        id: mission.assignedDrone?._id,
        name: mission.assignedDrone?.name,
        location: mission.assignedDrone?.location,
        battery: mission.assignedDrone?.battery,
        telemetry: mission.assignedDrone?.telemetry
      },
      progress: mission.progress,
      flightPath: mission.flightPath,
      waypoints: mission.waypoints,
      area: mission.area,
      estimatedTimeRemaining: mission.progress?.estimatedTimeRemaining || 0
    }));

    res.json(liveMissions);

  } catch (error) {
    console.error('Live mission data error:', error);
    res.status(500).json({ message: 'Server error fetching live mission data' });
  }
};
