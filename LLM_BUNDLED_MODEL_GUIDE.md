# Bundling LLM Model Directly with App

Since you want the model to live **locally on device** (bundled with the app), you don't need a CDN. This guide explains how to bundle the 2GB model directly with your React Native app.

---

## ✅ Configuration Already Updated

The code has been updated to support bundled models:
- `MODEL_STRATEGY` is set to `'bundled'` in `llmConfig.ts`
- `modelDownloader.ts` now checks for bundled files in the app bundle
- No download step is needed at runtime

---

## 📋 Step-by-Step: Bundle Model with App

### Step 1: Convert Model to ExecuTorch Format

First, you need to convert the Gemma 3n E2B model to `.pte` format:

```bash
# Create a Python environment
python3 -m venv ~/llm-conversion-env
source ~/llm-conversion-env/bin/activate

# Install dependencies
pip install torch transformers executorch sentencepiece accelerate

# Download model from Hugging Face
pip install huggingface_hub
huggingface-cli login  # Enter your HF token

# Download Gemma 3n E2B
huggingface-cli download google/gemma-3n-e2b \
  --local-dir ~/llm-models/gemma-3n-e2b \
  --local-dir-use-symlinks False
```

Create a conversion script `convert_gemma3n.py`:

```python
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
import executorch.exir as exir

MODEL_PATH = "~/llm-models/gemma-3n-e2b"
OUTPUT_PATH = "~/llm-models/gemma-3n-e2b-executorch"

print("Loading model...")
model = AutoModelForCausalLM.from_pretrained(
    MODEL_PATH,
    torch_dtype=torch.float16,
    low_cpu_mem_usage=True
)
model.eval()

print("Loading tokenizer...")
tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)

print("Exporting to ExecuTorch format...")
example_input = torch.randint(0, tokenizer.vocab_size, (1, 128))

edge_program = exir.capture(
    model,
    (example_input,),
    exir.EdgeCompileConfig(
        _check_ir_validity=False,
        _use_edge_ops=True,
    ),
).to_edge()

print("Saving .pte file...")
with open(f"{OUTPUT_PATH}/gemma-3n-e2b-int4.pte", "wb") as f:
    edge_program.write_to_file(f)

print("Saving tokenizer...")
tokenizer.save_pretrained(OUTPUT_PATH)

print("✅ Conversion complete!")
```

Run the conversion:
```bash
python3 convert_gemma3n.py
```

This will create:
- `gemma-3n-e2b-int4.pte` (~2GB)
- `tokenizer.bin` (~512KB)

---

### Step 2: Add Model Files to Android Assets

**For Android:**

1. Create the assets folder if it doesn't exist:
```bash
mkdir -p /Users/home/Documents/Project/TrailSense/android/app/src/main/assets
```

2. Copy your model files:
```bash
cp ~/llm-models/gemma-3n-e2b-executorch/gemma-3n-e2b-int4.pte \
   /Users/home/Documents/Project/TrailSense/android/app/src/main/assets/

cp ~/llm-models/gemma-3n-e2b-executorch/tokenizer.bin \
   /Users/home/Documents/Project/TrailSense/android/app/src/main/assets/
```

3. Verify files are there:
```bash
ls -lh /Users/home/Documents/Project/TrailSense/android/app/src/main/assets/
# Should show:
# gemma-3n-e2b-int4.pte (~2GB)
# tokenizer.bin (~512KB)
```

---

### Step 3: Configure Metro Bundler (Optional)

If you want Metro to handle the files, update `metro.config.js`:

```javascript
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add .pte and .bin as asset extensions
config.resolver.assetExts.push('pte', 'bin');

module.exports = config;
```

---

### Step 4: Update Gradle Configuration

To handle the large 2GB file, update `android/app/build.gradle`:

```gradle
android {
    // ... existing config

    // Allow large assets
    aaptOptions {
        noCompress 'pte', 'bin'
    }

    // Increase APK size limit if needed
    packagingOptions {
        exclude 'META-INF/DEPENDENCIES'
        exclude 'META-INF/LICENSE'
        exclude 'META-INF/LICENSE.txt'
        exclude 'META-INF/license.txt'
        exclude 'META-INF/NOTICE'
        exclude 'META-INF/NOTICE.txt'
        exclude 'META-INF/notice.txt'
        exclude 'META-INF/ASL2.0'
    }
}
```

---

### Step 5: Build and Test

```bash
cd /Users/home/Documents/Project/TrailSense

# Clean build
cd android && ./gradlew clean && cd ..

# Build Android APK
npm run android

# Or build release APK
cd android && ./gradlew assembleRelease && cd ..
```

**Note:** The APK/AAB will be ~2GB larger now.

---

## 🎯 App Store Considerations

### Google Play Store (Android)

**Option 1: Single APK with Bundled Model**
- ✅ Pros: Simple, works offline immediately
- ❌ Cons: 2GB APK size, may exceed Play Store limits (150MB for APK)

**Solution:** Use Android App Bundle (AAB) with on-demand delivery:

```gradle
// android/app/build.gradle
android {
    bundle {
        language {
            enableSplit = true
        }
        density {
            enableSplit = true
        }
        abi {
            enableSplit = true
        }
    }
}
```

This splits the app into smaller downloads. Users get only what they need.

**Option 2: Use Play Asset Delivery**

Create a separate asset pack for the model:

1. Create `android/app/src/main/assetpacks/llm_model/` directory
2. Move model files there
3. Configure asset pack delivery mode

```xml
<!-- android/app/src/main/assetpacks/llm_model/build.gradle -->
plugins {
    id 'com.android.asset-pack'
}

assetPack {
    packName = "llm_model"
    dynamicDelivery {
        deliveryType = "on-demand"
    }
}
```

Then update code to load from asset pack instead of main assets.

---

## 📊 Bundle Size Impact

**Before:** ~50-100MB APK
**After:** ~2.1GB APK (with bundled model)

**Mitigation Strategies:**

1. **Use AAB (Android App Bundle)** - Recommended
   - Splits app into smaller chunks
   - Users download only what they need
   - Google Play handles the complexity

2. **Use APK Expansion Files** (Legacy)
   - Main APK stays small (<100MB)
   - Model downloaded as expansion file
   - Requires extra code to manage

3. **Keep using on-demand download** (Current implementation supports both)
   - Change `MODEL_STRATEGY` back to `'download'`
   - Model downloads on first use
   - Keeps APK small

---

## 🧪 Testing Bundled Model

1. **Check if model files are accessible:**

```typescript
import RNFS from 'react-native-fs';

const checkBundledModel = async () => {
  const modelPath = RNFS.MainBundlePath + '/assets/gemma-3n-e2b-int4.pte';
  const tokenizerPath = RNFS.MainBundlePath + '/assets/tokenizer.bin';

  const modelExists = await RNFS.exists(modelPath);
  const tokenizerExists = await RNFS.exists(tokenizerPath);

  console.log('Model exists:', modelExists);
  console.log('Tokenizer exists:', tokenizerExists);

  if (modelExists) {
    const stat = await RNFS.stat(modelPath);
    console.log('Model size:', stat.size, 'bytes');
  }
};
```

2. **Test model loading:**

```typescript
import { llmService } from '@/services/llm';

const testModelLoading = async () => {
  try {
    console.log('Loading model...');
    await llmService.initialize();
    console.log('Model loaded successfully!');

    // Test inference
    const summary = await llmService.generateAlertSummary({
      alert: mockAlert
    });

    console.log('Summary:', summary);
  } catch (error) {
    console.error('Error:', error);
  }
};
```

---

## 🔄 Switching Between Strategies

You can easily switch between bundled and download strategies:

**Bundled (Local):**
```typescript
// src/config/llmConfig.ts
MODEL_STRATEGY: 'bundled' as 'bundled' | 'download',
```

**Download (On-demand):**
```typescript
// src/config/llmConfig.ts
MODEL_STRATEGY: 'download' as 'bundled' | 'download',
MODEL_DOWNLOAD_URL: 'https://your-cdn.com/models/gemma-3n-e2b-int4.pte',
TOKENIZER_DOWNLOAD_URL: 'https://your-cdn.com/models/tokenizer.bin',
```

The code automatically adapts to the strategy you choose!

---

## ✅ Summary

**With bundled model approach:**
- ✅ No CDN needed
- ✅ Works offline immediately
- ✅ Simpler user experience (no download step)
- ❌ Larger app size (~2GB)
- ⚠️ May require Android App Bundle for Play Store

**Recommended approach:**
1. Bundle model in assets for now
2. Use Android App Bundle (AAB) for Play Store
3. Consider on-demand delivery if bundle size is an issue

The implementation supports both strategies, so you can switch at any time!

---

## 🚀 Quick Commands

```bash
# 1. Convert model (one-time)
python3 convert_gemma3n.py

# 2. Copy to Android assets
cp ~/llm-models/gemma-3n-e2b-executorch/*.{pte,bin} \
   /Users/home/Documents/Project/TrailSense/android/app/src/main/assets/

# 3. Build app
npm run android

# 4. Test on device
# Model should load automatically without any download!
```

**That's it! No CDN needed.** 🎉
