import { Platform } from 'react-native';

/**
 * Feature Flags Configuration
 * Centralized feature flag management for TrailSense
 */

export interface FeatureFlags {
  // LLM Features
  LLM_ENABLED: boolean;
  LLM_ALERT_SUMMARIES: boolean;
  LLM_PATTERN_ANALYSIS: boolean;
  LLM_CONVERSATIONAL_ASSISTANT: boolean;

  // LLM A/B Testing
  LLM_AB_TEST_ENABLED: boolean;
  LLM_AB_TEST_PERCENTAGE: number; // 0.0 to 1.0

  // LLM Performance Features
  LLM_ENABLE_CACHING: boolean;
  LLM_ENABLE_PRELOADING: boolean;
  LLM_ENABLE_STREAMING: boolean; // Stream tokens as they're generated

  // LLM Developer Features
  LLM_MOCK_MODE: boolean; // Use mock responses instead of real inference
  LLM_DEBUG_MODE: boolean; // Show debug info in UI
  LLM_PERFORMANCE_OVERLAY: boolean; // Show performance metrics overlay
}

/**
 * Default feature flags
 * These can be overridden by remote config, local storage, or A/B testing
 */
const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  // LLM Features - Start with Android only, disabled by default for safety
  LLM_ENABLED: __DEV__ && Platform.OS === 'android',
  LLM_ALERT_SUMMARIES: __DEV__ && Platform.OS === 'android',
  LLM_PATTERN_ANALYSIS: false, // Phase 2 feature
  LLM_CONVERSATIONAL_ASSISTANT: false, // Phase 2 feature

  // A/B Testing - Start with 50% rollout
  LLM_AB_TEST_ENABLED: false, // Disable until ready for production
  LLM_AB_TEST_PERCENTAGE: 0.5,

  // Performance Features
  LLM_ENABLE_CACHING: true,
  LLM_ENABLE_PRELOADING: true,
  LLM_ENABLE_STREAMING: false, // Not yet implemented

  // Developer Features
  LLM_MOCK_MODE: false, // Mock mode disabled - using real Llama 3.2 1B model
  LLM_DEBUG_MODE: __DEV__,
  LLM_PERFORMANCE_OVERLAY: __DEV__,
};

/**
 * Feature Flags Manager
 * Handles feature flag state with support for remote updates and A/B testing
 */
class FeatureFlagsManager {
  private flags: FeatureFlags = { ...DEFAULT_FEATURE_FLAGS };
  private listeners: Array<(flags: FeatureFlags) => void> = [];

  /**
   * Get current feature flags
   */
  getFlags(): FeatureFlags {
    return { ...this.flags };
  }

  /**
   * Get a specific feature flag
   */
  isEnabled(flagName: keyof FeatureFlags): boolean {
    return this.flags[flagName] as boolean;
  }

  /**
   * Update feature flags (useful for remote config updates)
   */
  updateFlags(updates: Partial<FeatureFlags>): void {
    this.flags = {
      ...this.flags,
      ...updates,
    };

    // Notify listeners
    this.notifyListeners();
  }

  /**
   * Reset to default flags
   */
  resetToDefaults(): void {
    this.flags = { ...DEFAULT_FEATURE_FLAGS };
    this.notifyListeners();
  }

  /**
   * Subscribe to flag changes
   */
  subscribe(listener: (flags: FeatureFlags) => void): () => void {
    this.listeners.push(listener);

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Check if user is in A/B test group
   */
  isInABTestGroup(userId: string): boolean {
    if (!this.flags.LLM_AB_TEST_ENABLED) {
      return this.flags.LLM_ENABLED; // If A/B test disabled, use default flag
    }

    // Simple hash-based bucketing
    const hash = this.simpleHash(userId);
    const bucket = (hash % 100) / 100;

    return bucket < this.flags.LLM_AB_TEST_PERCENTAGE;
  }

  /**
   * Enable LLM features for testing/development
   */
  enableLLMForDev(): void {
    if (__DEV__) {
      this.updateFlags({
        LLM_ENABLED: true,
        LLM_ALERT_SUMMARIES: true,
        LLM_DEBUG_MODE: true,
        LLM_PERFORMANCE_OVERLAY: true,
      });
    }
  }

  /**
   * Disable all LLM features (emergency kill switch)
   */
  disableAllLLM(): void {
    this.updateFlags({
      LLM_ENABLED: false,
      LLM_ALERT_SUMMARIES: false,
      LLM_PATTERN_ANALYSIS: false,
      LLM_CONVERSATIONAL_ASSISTANT: false,
    });
  }

  /**
   * Enable mock mode for testing without model
   */
  enableMockMode(): void {
    this.updateFlags({
      LLM_MOCK_MODE: true,
      LLM_ENABLED: true,
      LLM_ALERT_SUMMARIES: true,
    });
  }

  /**
   * Load flags from storage (for persistence across app launches)
   */
  async loadFromStorage(): Promise<void> {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const stored = await AsyncStorage.getItem('@feature_flags');

      if (stored) {
        const storedFlags = JSON.parse(stored);
        this.updateFlags(storedFlags);
      }
    } catch (error) {
      console.warn('Failed to load feature flags from storage:', error);
    }
  }

  /**
   * Save flags to storage
   */
  async saveToStorage(): Promise<void> {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.setItem('@feature_flags', JSON.stringify(this.flags));
    } catch (error) {
      console.warn('Failed to save feature flags to storage:', error);
    }
  }

  /**
   * Fetch flags from remote config (placeholder for future implementation)
   */
  async fetchRemoteFlags(): Promise<void> {
    // TODO: Implement remote config fetching
    // This would integrate with Firebase Remote Config, LaunchDarkly, etc.
    console.log('Remote flag fetching not yet implemented');
  }

  /**
   * Private helper to notify all listeners
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.getFlags());
      } catch (error) {
        console.error('Error in feature flag listener:', error);
      }
    });
  }

  /**
   * Simple hash function for A/B testing bucketing
   */
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}

// Export singleton instance
export const featureFlagsManager = new FeatureFlagsManager();

// Export convenience object that reads from manager
export const FEATURE_FLAGS = new Proxy({} as FeatureFlags, {
  get(target, prop: string) {
    return featureFlagsManager.getFlags()[prop as keyof FeatureFlags];
  },
});

/**
 * React Hook for using feature flags (for future use)
 * Usage: const flags = useFeatureFlags();
 */
export function useFeatureFlags(): FeatureFlags {
  // This would use React hooks to subscribe to flag changes
  // For now, just return current flags
  return featureFlagsManager.getFlags();
}

/**
 * Helper function to check if LLM features should be shown to user
 */
export function shouldShowLLMFeatures(userId?: string): boolean {
  if (!FEATURE_FLAGS.LLM_ENABLED) {
    return false;
  }

  if (Platform.OS !== 'android') {
    return false; // iOS not supported yet
  }

  if (FEATURE_FLAGS.LLM_AB_TEST_ENABLED && userId) {
    return featureFlagsManager.isInABTestGroup(userId);
  }

  return true;
}

/**
 * Helper function for gradual rollout percentage
 */
export function setLLMRolloutPercentage(percentage: number): void {
  if (percentage < 0 || percentage > 1) {
    throw new Error('Rollout percentage must be between 0 and 1');
  }

  featureFlagsManager.updateFlags({
    LLM_AB_TEST_ENABLED: true,
    LLM_AB_TEST_PERCENTAGE: percentage,
  });
}
