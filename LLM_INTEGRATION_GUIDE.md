# TrailSense LLM Integration Guide

This guide explains how to integrate the completed LLM services into the TrailSense application.

## ✅ Completed Implementation

All core LLM infrastructure has been implemented:

### Configuration & Feature Flags
- ✅ `src/config/llmConfig.ts` - Centralized LLM configuration
- ✅ `src/config/featureFlags.ts` - Feature flag management with A/B testing support

### Core Services
- ✅ `src/services/llm/modelDownloader.ts` - Model download with progress tracking
- ✅ `src/services/llm/modelManager.ts` - Model loading/unloading management
- ✅ `src/services/llm/inferenceEngine.ts` - Text generation engine
- ✅ `src/services/llm/LLMService.ts` - Unified service API

### Templates & Caching
- ✅ `src/services/llm/templates/` - Prompt template system
  - AlertSummaryTemplate
  - PatternAnalysisTemplate
  - ConversationalTemplate
- ✅ `src/services/llm/cache/ResponseCache.ts` - Response caching

### UI Components & Hooks
- ✅ `src/components/organisms/AlertSummaryCard/` - Alert summary UI component
- ✅ `src/hooks/useAlertSummary.ts` - React hook for alert summaries

### Type Definitions
- ✅ `src/types/llm.ts` - All LLM-related TypeScript types

---

## 📋 Integration Steps

### Step 1: Update AlertDetailScreen

To integrate the LLM features into your AlertDetailScreen, follow these steps:

#### 1.1 Add Imports

```typescript
// Add to the top of src/screens/alerts/AlertDetailScreen.tsx
import { useAlertSummary } from '@hooks/useAlertSummary';
import { AlertSummaryCard } from '@components/organisms/AlertSummaryCard';
import { FEATURE_FLAGS } from '@/config/featureFlags';
import { useAnalytics } from '@hooks/useAnalytics'; // If you have analytics
```

#### 1.2 Use the Hook

```typescript
export const AlertDetailScreen = ({ route, navigation }: Props) => {
  const { alertId } = route.params;
  const alert = useSelector((state) => selectAlertById(state, alertId));

  // Add the LLM hook
  const {
    summary,
    isLoading: isGeneratingSummary,
    error: summaryError,
    generate: generateSummary,
    regenerate: regenerateSummary,
  } = useAlertSummary(alert);

  // ... rest of component
};
```

#### 1.3 Add Feedback Handler

```typescript
// Add analytics tracking for feedback
const handleFeedback = (positive: boolean) => {
  // Track feedback in analytics
  analytics.track('llm_alert_summary_feedback', {
    alertId: alert.id,
    feedback: positive ? 'positive' : 'negative',
    threatLevel: alert.threat_level,
  });

  // Show confirmation
  Alert.alert(
    'Thank you!',
    'Your feedback helps us improve AI summaries.'
  );
};
```

#### 1.4 Add to Render

```typescript
return (
  <ScrollView>
    {/* Existing alert card */}
    <AlertCard alert={alert} />

    {/* AI Summary Section - Add this */}
    {FEATURE_FLAGS.LLM_ALERT_SUMMARIES && (
      <View style={styles.aiSummarySection}>
        {/* Show "Explain with AI" button if no summary yet */}
        {!summary && !isGeneratingSummary && !summaryError && (
          <TouchableOpacity
            onPress={generateSummary}
            style={styles.explainButton}
            accessibilityLabel="Explain alert with AI"
            accessibilityRole="button"
          >
            <Icon name="sparkles" size={18} color={colors.systemBlue} />
            <Text style={[styles.explainButtonText, { color: colors.systemBlue }]}>
              Explain with AI
            </Text>
          </TouchableOpacity>
        )}

        {/* Alert Summary Card */}
        <AlertSummaryCard
          summary={summary}
          isLoading={isGeneratingSummary}
          error={summaryError}
          onRegenerate={regenerateSummary}
          onFeedback={handleFeedback}
          testID="alert-summary-card"
        />
      </View>
    )}

    {/* Rest of your screen content */}
    {/* ... device details, timeline, etc. */}
  </ScrollView>
);
```

#### 1.5 Add Styles

```typescript
const styles = StyleSheet.create({
  // ... existing styles

  aiSummarySection: {
    marginVertical: 12,
    paddingHorizontal: 16,
  },
  explainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  explainButtonText: {
    marginLeft: 8,
    fontSize: 15,
    fontWeight: '600',
  },
});
```

---

### Step 2: Enable Feature Flags

#### For Development
```typescript
// In your app initialization or dev menu
import { featureFlagsManager } from '@/config/featureFlags';

// Enable LLM features for development
featureFlagsManager.enableLLMForDev();

// OR enable mock mode for testing without model
featureFlagsManager.enableMockMode();
```

#### For Production
```typescript
// Gradual rollout
import { setLLMRolloutPercentage } from '@/config/featureFlags';

// Start with 10% of users
setLLMRolloutPercentage(0.1);

// Increase as you validate
setLLMRolloutPercentage(0.5);  // 50%
setLLMRolloutPercentage(1.0);  // 100%
```

---

### Step 3: Model Setup

**Two Options Available:**

#### Option A: Bundle Model with App (Recommended for your use case)
Since you want the model local on device, see `LLM_BUNDLED_MODEL_GUIDE.md` for complete instructions.

**Summary:**
1. Convert model to .pte format
2. Copy files to `android/app/src/main/assets/`
3. Set `MODEL_STRATEGY: 'bundled'` in `llmConfig.ts` (already set)
4. Build app - model works immediately, no download needed!

**No CDN or download UI needed!**

---

#### Option B: Download on First Launch (Alternative)
If you prefer smaller app bundle, create a model download screen that users can access from Settings:

```typescript
// src/screens/settings/ModelDownloadScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, Button, ProgressBar } from 'react-native';
import { modelDownloader } from '@/services/llm';

export const ModelDownloadScreen = () => {
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    checkModelStatus();
  }, []);

  const checkModelStatus = async () => {
    const downloaded = await modelDownloader.isModelDownloaded();
    setIsDownloaded(downloaded);
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await modelDownloader.downloadModel((prog) => {
        setProgress(prog.percentage);
      });
      setIsDownloaded(true);
      Alert.alert('Success', 'AI model downloaded successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to download AI model');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>AI Features</Text>
      <Text style={styles.description}>
        Download the AI model (~2GB) to enable natural language alert summaries.
      </Text>

      {isDownloaded ? (
        <View>
          <Text style={styles.statusText}>✅ Model Ready</Text>
          <Button title="Delete Model" onPress={handleDelete} />
        </View>
      ) : (
        <View>
          {isDownloading ? (
            <View>
              <Text>Downloading: {progress.toFixed(0)}%</Text>
              <ProgressBar progress={progress / 100} />
            </View>
          ) : (
            <Button title="Download Model" onPress={handleDownload} />
          )}
        </View>
      )}
    </View>
  );
};
```

---

### Step 4: Analytics Integration

Track LLM usage and performance:

```typescript
// src/services/analytics/llmAnalytics.ts
import { analytics } from '@/services/analytics';

export const trackLLMEvent = {
  summaryRequested: (alertId: string, threatLevel: string) => {
    analytics.track('llm_alert_summary_requested', {
      alertId,
      threatLevel,
      timestamp: Date.now(),
    });
  },

  summaryGenerated: (alertId: string, latencyMs: number, cached: boolean) => {
    analytics.track('llm_alert_summary_generated', {
      alertId,
      latencyMs,
      cached,
      success: true,
    });
  },

  summaryFailed: (alertId: string, error: string) => {
    analytics.track('llm_alert_summary_failed', {
      alertId,
      error,
      success: false,
    });
  },

  feedback: (alertId: string, positive: boolean) => {
    analytics.track('llm_alert_summary_feedback', {
      alertId,
      feedback: positive ? 'positive' : 'negative',
    });
  },
};
```

---

## 🧪 Testing

### Mock Mode Testing

Enable mock mode to test without downloading the model:

```typescript
import { featureFlagsManager } from '@/config/featureFlags';

// Enable mock mode
featureFlagsManager.updateFlags({
  LLM_MOCK_MODE: true,
  LLM_ENABLED: true,
  LLM_ALERT_SUMMARIES: true,
});
```

### Manual Testing Checklist

- [ ] Test alert summary generation for HIGH threat
- [ ] Test alert summary generation for CRITICAL threat
- [ ] Test "Explain with AI" button for LOW threat
- [ ] Test feedback buttons (thumbs up/down)
- [ ] Test regenerate functionality
- [ ] Test loading states
- [ ] Test error states
- [ ] Test with model not downloaded
- [ ] Test with network offline
- [ ] Test on low battery (<20%)

---

## 🚀 Production Deployment Checklist

### Before Launch
- [ ] Model is converted to .pte format
- [ ] Model is uploaded to CDN
- [ ] Update MODEL_DOWNLOAD_URL in llmConfig.ts
- [ ] Test model download on physical devices
- [ ] Verify model load time (<15s)
- [ ] Verify inference time (<3s for 50 tokens)
- [ ] Set up analytics dashboards
- [ ] Enable A/B testing with 10% rollout
- [ ] Prepare emergency kill switch

### Launch
- [ ] Enable LLM_ENABLED feature flag
- [ ] Monitor error rates
- [ ] Monitor performance metrics
- [ ] Monitor user feedback
- [ ] Watch for crash reports

### Post-Launch
- [ ] Increase rollout percentage gradually
- [ ] Analyze A/B test results
- [ ] Iterate on prompt templates based on feedback
- [ ] Optimize cache hit rates
- [ ] Consider model updates

---

## 🐛 Troubleshooting

### Model Won't Load
- Check if model files exist on device
- Verify file sizes are correct (model ~2GB, tokenizer ~512KB)
- Check device has ARM64 processor (Android only)
- Verify ExecuTorch module is linked correctly

### Inference Timeout
- Check device performance (may need stronger device)
- Verify prompt is not too long (max 2048 tokens)
- Try reducing maxTokens in generation options

### High Memory Usage
- Implement idle timeout (already configured)
- Unload model when app goes to background
- Monitor memory usage in development

### Poor Summary Quality
- Adjust temperature in prompt templates
- Improve system prompts
- Collect user feedback and iterate
- Consider fine-tuning model (Phase 2)

---

## 📚 API Reference

### LLMService

```typescript
// Initialize service (loads model)
await llmService.initialize();

// Generate alert summary
const summary = await llmService.generateAlertSummary({
  alert: alertObject,
  relatedAlerts: [],
  deviceHistory: {}
});

// Analyze device pattern
const analysis = await llmService.analyzeDevicePattern({
  device: deviceObject,
  detectionHistory: []
});

// Chat
const response = await llmService.chat({
  messages: chatMessages,
  securityContext: {}
});

// Shutdown (unloads model)
await llmService.shutdown();

// Check status
const isReady = llmService.isReady();
```

### Feature Flags

```typescript
// Get current flags
const flags = featureFlagsManager.getFlags();

// Check specific flag
const isEnabled = featureFlagsManager.isEnabled('LLM_ALERT_SUMMARIES');

// Update flags
featureFlagsManager.updateFlags({
  LLM_ENABLED: true,
  LLM_ALERT_SUMMARIES: true,
});

// Subscribe to changes
const unsubscribe = featureFlagsManager.subscribe((flags) => {
  console.log('Flags updated:', flags);
});
```

---

## 🎯 Next Steps

1. **Complete Model Conversion** - Convert Gemma 3n E2B to .pte format
2. **Upload to CDN** - Host model files on CDN
3. **Test on Devices** - Test on physical Android devices
4. **Phase 2 Features**:
   - Pattern Analysis for whitelist suggestions
   - Conversational Assistant
   - Model fine-tuning

---

## 📞 Support

For issues or questions:
1. Check implementation plan documents in `llmImplementationPlan/`
2. Review troubleshooting section above
3. Check react-native-executorch GitHub issues
4. Test on physical device before debugging further

---

**Status:** Core implementation complete. Ready for model integration and testing.
