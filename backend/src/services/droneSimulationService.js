import { io } from '../server.js';

class DroneSimulationService {
  constructor() {
    this.activeDrones = new Map(); // Store active drone simulations
    this.simulationInterval = null;
    this.updateInterval = 2000; // 2 seconds
    this.isRunning = false;
    this.manualUpdatePauses = new Map(); // Track drones with recent manual updates
    this.pauseDuration = 10000; // Pause simulation for 10 seconds after manual update
  }

  // Start the simulation
  async startSimulation() {
    if (this.isRunning) {
      console.log('⚠️  Simulation is already running');
      return { success: false, message: 'Simulation is already running' };
    }

    try {
      const Drone = (await import('../models/droneModel.js')).default;
      const drones = await Drone.find({ status: { $in: ['available', 'in-mission'] } });
      
      console.log(`🚀 Starting simulation with ${drones.length} drones`);
      
      // Initialize active drones
      this.activeDrones.clear();
      drones.forEach(drone => {
        this.activeDrones.set(drone._id.toString(), {
          ...drone.toObject(),
          currentWaypointIndex: 0,
          targetWaypoint: null,
          isMoving: false
        });
      });

      // Start the simulation loop
      this.simulationInterval = setInterval(() => {
        this.updateDrones();
      }, this.updateInterval);

      this.isRunning = true;
      console.log('✅ Simulation started successfully');
      
      return { success: true, message: 'Simulation started successfully' };
    } catch (error) {
      console.error('❌ Error starting simulation:', error);
      return { success: false, message: error.message };
    }
  }

  // Stop the simulation
  stopSimulation() {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
    this.isRunning = false;
    this.activeDrones.clear();
    this.manualUpdatePauses.clear(); // Clear all pauses
    console.log('🛑 Simulation stopped');
    return { success: true, message: 'Simulation stopped successfully' };
  }

  // Get simulation status
  getStatus() {
    return {
      isRunning: this.isRunning,
      activeDrones: this.activeDrones.size,
      updateInterval: this.updateInterval,
      pausedDrones: this.manualUpdatePauses.size,
      timestamp: new Date()
    };
  }

  // Handle manual drone updates - pause simulation for this drone temporarily
  handleManualUpdate(droneId) {
    const pauseUntil = Date.now() + this.pauseDuration;
    this.manualUpdatePauses.set(droneId, pauseUntil);
    console.log(`⏸️  Pausing simulation for drone ${droneId} for ${this.pauseDuration/1000} seconds due to manual update`);
    
    // Refresh drone data from database
    this.refreshDroneFromDatabase(droneId);
  }

  // Refresh drone data from database
  async refreshDroneFromDatabase(droneId) {
    try {
      const Drone = (await import('../models/droneModel.js')).default;
      const freshDrone = await Drone.findById(droneId);
      
      if (freshDrone && this.activeDrones.has(droneId)) {
        const activeDrone = this.activeDrones.get(droneId);
        // Update with fresh data while preserving simulation state
        this.activeDrones.set(droneId, {
          ...freshDrone.toObject(),
          currentWaypointIndex: activeDrone.currentWaypointIndex || 0,
          targetWaypoint: activeDrone.targetWaypoint,
          isMoving: activeDrone.isMoving
        });
        console.log(`🔄 Refreshed drone ${droneId} data from database`);
      }
    } catch (error) {
      console.error(`❌ Error refreshing drone ${droneId}:`, error.message);
    }
  }

  // Check if drone simulation should be paused due to recent manual update
  isDronePaused(droneId) {
    const pauseUntil = this.manualUpdatePauses.get(droneId);
    if (pauseUntil && Date.now() < pauseUntil) {
      return true;
    } else if (pauseUntil) {
      // Pause period expired, remove it
      this.manualUpdatePauses.delete(droneId);
      console.log(`▶️  Resuming simulation for drone ${droneId}`);
    }
    return false;
  }

  // Update all active drones
  async updateDrones() {
    if (this.activeDrones.size === 0) {
      return;
    }

    console.log(`🔄 Updating ${this.activeDrones.size} drones...`);

    for (const [droneId, drone] of this.activeDrones) {
      try {
        await this.updateSingleDrone(droneId, drone);
      } catch (error) {
        console.error(`❌ Error updating drone ${droneId}:`, error.message);
      }
    }

    // Log current positions for visibility
    console.log('📍 Current drone positions:');
    for (const [droneId, drone] of this.activeDrones) {
      console.log(`  - ${drone.serialNumber}: ${drone.location.latitude.toFixed(6)}, ${drone.location.longitude.toFixed(6)} | Battery: ${drone.batteryLevel.toFixed(1)}%`);
    }
  }

  // Update a single drone
  async updateSingleDrone(droneId, drone) {
    // Check if this drone is paused due to recent manual update
    if (this.isDronePaused(droneId)) {
      console.log(`⏸️  Skipping simulation update for drone ${droneId} - recently manually updated`);
      return;
    }

    // Import models dynamically to avoid circular imports
    const Drone = (await import('../models/droneModel.js')).default;
    const Mission = (await import('../models/missionModel.js')).default;

    // Find active mission for this drone
    const activeMission = await Mission.findOne({
      drone: droneId,
      status: 'in-progress'
    });

    if (!activeMission || !activeMission.flightPath || activeMission.flightPath.length === 0) {
      // No active mission, just drain battery slowly
      await this.simulateIdleBatteryDrain(droneId, drone);
      return;
    }

    // Get current and target waypoints
    const waypoints = activeMission.flightPath;
    const currentWaypointIndex = drone.currentWaypointIndex || 0;

    if (currentWaypointIndex >= waypoints.length) {
      // Mission completed
      await this.completeMission(activeMission, droneId);
      return;
    }

    const targetWaypoint = waypoints[currentWaypointIndex];
    await this.moveTowardsWaypoint(droneId, drone, targetWaypoint, activeMission);
  }

  // Move drone towards a waypoint
  async moveTowardsWaypoint(droneId, drone, targetWaypoint, mission) {
    const Drone = (await import('../models/droneModel.js')).default;
    
    const currentLat = drone.location.latitude;
    const currentLon = drone.location.longitude;
    const targetLat = targetWaypoint.latitude;
    const targetLon = targetWaypoint.longitude;

    // Calculate distance to target
    const distance = this.calculateDistance(currentLat, currentLon, targetLat, targetLon);
    
    console.log(`🚁 Drone ${drone.serialNumber}: Distance to waypoint = ${distance.toFixed(2)}m`);

    // Check if drone has reached the waypoint (within 10 meters)
    if (distance < 10) {
      console.log(`🎯 Drone ${drone.serialNumber} reached waypoint ${drone.currentWaypointIndex + 1}`);
      
      // Update to next waypoint
      const updatedDrone = this.activeDrones.get(droneId);
      updatedDrone.currentWaypointIndex = (updatedDrone.currentWaypointIndex || 0) + 1;
      this.activeDrones.set(droneId, updatedDrone);
      
      // Drain battery for reaching waypoint
      drone.batteryLevel = Math.max(0, drone.batteryLevel - 0.5); // Reduced from 2%
      
      await this.updateDroneInDatabase(droneId, drone);
      return;
    }

    // Calculate movement (move 200 meters per update towards target)
    const moveDistance = 200; // meters per update (increased for more visible movement)
    const bearing = this.calculateBearing(currentLat, currentLon, targetLat, targetLon);
    const newPosition = this.moveAlongBearing(currentLat, currentLon, bearing, moveDistance);

    // Update drone position
    drone.location.latitude = newPosition.latitude;
    drone.location.longitude = newPosition.longitude;

    // Drain battery based on movement
    const batteryDrain = this.calculateBatteryDrain(drone, moveDistance);
    drone.batteryLevel = Math.max(0, drone.batteryLevel - batteryDrain);

    console.log(`📍 Drone ${drone.serialNumber} moved to ${newPosition.latitude.toFixed(6)}, ${newPosition.longitude.toFixed(6)} | Battery: ${drone.batteryLevel.toFixed(1)}%`);

    // Update in memory
    this.activeDrones.set(droneId, drone);

    // Update in database
    await this.updateDroneInDatabase(droneId, drone);
  }

  // Calculate distance between two points using Haversine formula
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  }

  // Calculate bearing between two points
  calculateBearing(lat1, lon1, lat2, lon2) {
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

    return Math.atan2(y, x);
  }

  // Move along a bearing for a given distance
  moveAlongBearing(lat, lon, bearing, distance) {
    const R = 6371000; // Earth's radius in meters
    const δ = distance / R; // Angular distance
    
    const φ1 = lat * Math.PI / 180;
    const λ1 = lon * Math.PI / 180;

    const φ2 = Math.asin(Math.sin(φ1) * Math.cos(δ) + Math.cos(φ1) * Math.sin(δ) * Math.cos(bearing));
    const λ2 = λ1 + Math.atan2(Math.sin(bearing) * Math.sin(δ) * Math.cos(φ1), Math.cos(δ) - Math.sin(φ1) * Math.sin(φ2));

    return {
      latitude: φ2 * 180 / Math.PI,
      longitude: λ2 * 180 / Math.PI
    };
  }

  // Calculate battery drain based on movement and drone characteristics
  calculateBatteryDrain(drone, distanceMoved) {
    let baseDrain = 0.1; // Base drain per update (much smaller)
    
    // Increase drain based on movement
    baseDrain += (distanceMoved / 1000) * 0.2; // Much less aggressive
    
    // Increase drain based on drone model (heavier drones use more battery)
    if (drone.model && drone.model.toLowerCase().includes('heavy')) {
      baseDrain *= 1.3;
    }
    
    // Weather factor (random) - more stable
    const weatherFactor = 0.9 + (Math.random() * 0.2); // 0.9 to 1.1
    baseDrain *= weatherFactor;
    
    return Math.min(baseDrain, 1); // Cap at 1% per update (was 5%)
  }

  // Simulate battery drain for idle drones
  async simulateIdleBatteryDrain(droneId, drone) {
    const Drone = (await import('../models/droneModel.js')).default;
    
    // Idle drones drain battery much slower
    const idleDrain = 0.05 + (Math.random() * 0.05); // 0.05-0.1% per update (reduced)
    drone.batteryLevel = Math.max(0, drone.batteryLevel - idleDrain);
    
    console.log(`😴 Drone ${drone.serialNumber} idle | Battery: ${drone.batteryLevel.toFixed(1)}%`);
    
    // Update in memory and database
    this.activeDrones.set(droneId, drone);
    await this.updateDroneInDatabase(droneId, drone);
  }

  // Update drone in database
  async updateDroneInDatabase(droneId, drone) {
    try {
      const Drone = (await import('../models/droneModel.js')).default;
      
      // Generate telemetry data
      const telemetry = {
        altitude: 50 + (Math.random() * 100), // 50-150m
        speed: drone.isMoving ? 10 + (Math.random() * 15) : 0, // 10-25 m/s when moving
        heading: Math.random() * 360,
        temperature: 20 + (Math.random() * 20), // 20-40°C
        timestamp: new Date()
      };

      // Check if battery is critically low
      if (drone.batteryLevel <= 15 && drone.status !== 'charging') {
        drone.status = 'charging';
        console.log(`🔌 Drone ${drone.serialNumber} forced to land for charging`);
      }
      
      // Update drone in database
      const updatedDrone = await Drone.findByIdAndUpdate(
        droneId,
        {
          batteryLevel: drone.batteryLevel,
          status: drone.status,
          location: drone.location,
          telemetry: telemetry
        },
        { new: true }
      );
      
      // Emit real-time update via WebSocket
      if (io) {
        io.emit('droneUpdate', {
          droneId: droneId,
          batteryLevel: drone.batteryLevel,
          status: drone.status,
          location: drone.location,
          telemetry: telemetry,
          timestamp: new Date()
        });
      }
      
      console.log(`[DATABASE] ✅ Drone ${drone.serialNumber} updated successfully`);
      
      return updatedDrone;
    } catch (dbError) {
      console.log(`⚠️  Database error for drone ${droneId}, continuing simulation in memory:`, dbError.message);
      
      // Continue simulation in memory even if database update fails
      return drone;
    }
  }

  // Complete a mission
  async completeMission(mission, droneId) {
    try {
      const Mission = (await import('../models/missionModel.js')).default;
      const Drone = (await import('../models/droneModel.js')).default;
      
      console.log(`🏁 Mission ${mission.name} completed for drone ${droneId}`);
      
      // Update mission status
      await Mission.findByIdAndUpdate(mission._id, {
        status: 'completed',
        completedAt: new Date()
      });
      
      // Update drone status
      await Drone.findByIdAndUpdate(droneId, {
        status: 'available'
      });
      
      // Remove from active drones or reset waypoint
      const drone = this.activeDrones.get(droneId);
      if (drone) {
        drone.currentWaypointIndex = 0;
        drone.status = 'available';
        this.activeDrones.set(droneId, drone);
      }
      
      // Emit mission completion via WebSocket
      if (io) {
        io.emit('missionUpdate', {
          missionId: mission._id,
          status: 'completed',
          completedAt: new Date(),
          timestamp: new Date()
        });
      }
      
    } catch (error) {
      console.error(`❌ Error completing mission:`, error.message);
    }
  }
}

// Export singleton instance
const simulationServiceInstance = new DroneSimulationService();
export default simulationServiceInstance;
