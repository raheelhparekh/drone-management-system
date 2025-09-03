import Drone from '../models/droneModel.js';
import Mission from '../models/missionModel.js';

// Get comprehensive dashboard analytics
export const getDashboardAnalytics = async (req, res) => {
  try {
    // Get all drones and missions for the user
    const drones = await Drone.find({ owner: req.user._id });
    const missions = await Mission.find({ createdBy: req.user._id });

    // Calculate fleet statistics
    const totalDrones = drones.length;
    const activeDrones = drones.filter(drone => drone.status === 'available' || drone.status === 'in-mission').length;
    const dronesInMission = drones.filter(drone => drone.status === 'in-mission').length;
    const dronesInMaintenance = drones.filter(drone => drone.status === 'maintenance').length;

    // Calculate average battery level
    const avgBattery = drones.length > 0 
      ? Math.round(drones.reduce((sum, drone) => sum + drone.battery, 0) / drones.length)
      : 0;

    // Calculate mission statistics
    const totalMissions = missions.length;
    const completedMissions = missions.filter(mission => mission.status === 'completed').length;
    const inProgressMissions = missions.filter(mission => mission.status === 'in-progress').length;
    const pendingMissions = missions.filter(mission => mission.status === 'pending').length;
    const failedMissions = missions.filter(mission => mission.status === 'failed' || mission.status === 'aborted').length;

    // Calculate mission completion rate
    const completionRate = totalMissions > 0 
      ? Math.round((completedMissions / totalMissions) * 100)
      : 0;

    // Recent activity (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const recentMissions = missions.filter(mission => 
      new Date(mission.createdAt) >= weekAgo
    ).length;

    // Fleet health score (based on battery levels and maintenance needs)
    const healthyDrones = drones.filter(drone => 
      drone.battery > 30 && drone.status !== 'maintenance' && drone.status !== 'error'
    ).length;
    const fleetHealthScore = totalDrones > 0 
      ? Math.round((healthyDrones / totalDrones) * 100)
      : 100;

    // Usage patterns
    const missionsByType = missions.reduce((acc, mission) => {
      acc[mission.type] = (acc[mission.type] || 0) + 1;
      return acc;
    }, {});

    // Daily activity for the last 7 days
    const dailyActivity = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const dayMissions = missions.filter(mission => {
        const missionDate = new Date(mission.createdAt);
        return missionDate >= date && missionDate < nextDate;
      }).length;
      
      dailyActivity.push({
        date: date.toISOString().split('T')[0],
        missions: dayMissions
      });
    }

    res.json({
      fleet: {
        totalDrones,
        activeDrones,
        dronesInMission,
        dronesInMaintenance,
        avgBattery,
        fleetHealthScore
      },
      missions: {
        totalMissions,
        completedMissions,
        inProgressMissions,
        pendingMissions,
        failedMissions,
        completionRate,
        recentMissions,
        missionsByType
      },
      activity: {
        dailyActivity
      }
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ message: 'Server error fetching analytics' });
  }
};

// Get detailed mission analytics
export const getMissionAnalytics = async (req, res) => {
  try {
    const missions = await Mission.find({ createdBy: req.user._id })
      .populate('assignedDrone')
      .sort({ createdAt: -1 });

    // Mission performance metrics
    const performanceData = missions.map(mission => {
      const duration = mission.completedAt && mission.startedAt
        ? Math.round((new Date(mission.completedAt) - new Date(mission.startedAt)) / (1000 * 60)) // minutes
        : null;

      return {
        id: mission._id,
        name: mission.name,
        type: mission.type,
        status: mission.status,
        duration,
        startedAt: mission.startedAt,
        completedAt: mission.completedAt,
        assignedDrone: mission.assignedDrone ? {
          name: mission.assignedDrone.name,
          model: mission.assignedDrone.model
        } : null,
        waypoints: mission.flightPath ? mission.flightPath.length : 0
      };
    });

    // Average mission duration by type
    const durationByType = missions.reduce((acc, mission) => {
      if (mission.completedAt && mission.startedAt && mission.type) {
        const duration = Math.round((new Date(mission.completedAt) - new Date(mission.startedAt)) / (1000 * 60));
        if (!acc[mission.type]) {
          acc[mission.type] = { total: 0, count: 0 };
        }
        acc[mission.type].total += duration;
        acc[mission.type].count += 1;
      }
      return acc;
    }, {});

    // Calculate averages
    const avgDurationByType = Object.keys(durationByType).reduce((acc, type) => {
      acc[type] = Math.round(durationByType[type].total / durationByType[type].count);
      return acc;
    }, {});

    // Success rate by drone
    const dronePerformance = missions.reduce((acc, mission) => {
      if (mission.assignedDrone) {
        const droneId = mission.assignedDrone._id.toString();
        if (!acc[droneId]) {
          acc[droneId] = {
            name: mission.assignedDrone.name,
            model: mission.assignedDrone.model,
            total: 0,
            completed: 0
          };
        }
        acc[droneId].total += 1;
        if (mission.status === 'completed') {
          acc[droneId].completed += 1;
        }
      }
      return acc;
    }, {});

    res.json({
      performanceData,
      avgDurationByType,
      dronePerformance
    });
  } catch (error) {
    console.error('Mission analytics error:', error);
    res.status(500).json({ message: 'Server error fetching mission analytics' });
  }
};

// Get fleet performance analytics
export const getFleetAnalytics = async (req, res) => {
  try {
    const drones = await Drone.find({ owner: req.user._id });

    // Battery analytics
    const batteryData = drones.map(drone => ({
      id: drone._id,
      name: drone.name,
      model: drone.model,
      battery: drone.battery,
      status: drone.status
    }));

    // Usage statistics
    const statusDistribution = drones.reduce((acc, drone) => {
      acc[drone.status] = (acc[drone.status] || 0) + 1;
      return acc;
    }, {});

    // Model popularity
    const modelDistribution = drones.reduce((acc, drone) => {
      acc[drone.model] = (acc[drone.model] || 0) + 1;
      return acc;
    }, {});

    res.json({
      batteryData,
      statusDistribution,
      modelDistribution
    });
  } catch (error) {
    console.error('Fleet analytics error:', error);
    res.status(500).json({ message: 'Server error fetching fleet analytics' });
  }
};
