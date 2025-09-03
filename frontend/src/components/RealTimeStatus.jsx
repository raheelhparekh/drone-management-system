import { useEffect, useState } from 'react';
import { useDroneStore } from '../stores/droneStore';
import { useMissionStore } from '../stores/missionStore';

const RealTimeStatus = () => {
  const { realTimeStatus: droneStatus } = useDroneStore();
  const { realTimeStatus: missionStatus } = useMissionStore();
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Auto-hide after 5 seconds of no activity
    const timeout = setTimeout(() => {
      setIsVisible(false);
    }, 5000);

    return () => clearTimeout(timeout);
  }, [droneStatus.lastUpdate, missionStatus.lastUpdate]);

  if (!isVisible) return null;

  const isConnected = droneStatus.isConnected || missionStatus.isConnected;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={`alert ${isConnected ? 'alert-success' : 'alert-warning'} shadow-lg max-w-sm`}>
        <div>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                  d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <div>
            <h3 className="font-bold">Real-time Status</h3>
            <div className="text-xs">
              <div>Connection: {isConnected ? 'Connected' : 'Disconnected'}</div>
              <div>Drone Updates: {droneStatus.activeUpdates}</div>
              <div>Mission Updates: {missionStatus.activeUpdates}</div>
            </div>
          </div>
        </div>
        <button 
          className="btn btn-sm btn-ghost"
          onClick={() => setIsVisible(false)}
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default RealTimeStatus;
