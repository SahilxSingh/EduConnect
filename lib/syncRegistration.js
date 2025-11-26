// Utility to sync local registration data with backend when available
import { authAPI } from "./api";

export async function syncLocalRegistration() {
  try {
    const localData = localStorage.getItem("userRegistration");
    if (!localData) {
      return false;
    }

    const userData = JSON.parse(localData);
    
    // Try to register with backend
    await authAPI.register(userData);
    
    // If successful, remove from local storage
    localStorage.removeItem("userRegistration");
    return true;
  } catch (error) {
    // Backend still not available, keep data in local storage
    console.log("Backend not available yet, keeping data in local storage");
    return false;
  }
}

// Call this function periodically or when backend becomes available
export function attemptSync() {
  // Try to sync every 30 seconds if there's local data
  const localData = localStorage.getItem("userRegistration");
  if (localData) {
    syncLocalRegistration().then((success) => {
      if (success) {
        console.log("Successfully synced registration data with backend");
      }
    });
  }
}

