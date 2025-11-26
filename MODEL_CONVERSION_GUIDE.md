# Model Conversion Guide - ExecuTorch Setup

## Current Status

✅ **Completed:**
- Python virtual environment created at `~/llm-env`
- Core dependencies installed (torch, transformers, sentencepiece, accelerate, huggingface_hub)
- Conversion script created at `convert_gemma3n.py`

⚠️ **Challenge:**
ExecuTorch is not available via pip and requires special installation from source.

---

## Options for Model Conversion

You have **3 options** to proceed:

### Option 1: Install ExecuTorch from Source (Recommended for Production)

This produces the optimal .pte format for mobile deployment.

#### Prerequisites
- Git installed
- CMake 3.19+ installed
- 16GB+ RAM recommended
- macOS with Xcode Command Line Tools

#### Installation Steps

```bash
# Activate your Python environment
source ~/llm-env/bin/activate

# Clone ExecuTorch repository
cd ~/
git clone https://github.com/pytorch/executorch.git
cd executorch

# Install ExecuTorch
git submodule sync
git submodule update --init

# Install build dependencies
./install_requirements.sh

# Install ExecuTorch Python package
pip install -e .

# Verify installation
python -c "import executorch; print('ExecuTorch installed successfully!')"
```

**Then run the conversion script:**
```bash
cd /Users/home/Documents/Project/TrailSense
python convert_gemma3n.py
```

**Time Required:** 1-2 hours (installation) + 30-60 minutes (conversion)

---

### Option 2: Use Pre-Converted Model (Fastest)

If the model is available in a pre-converted format, you can skip the conversion entirely.

#### Check for Pre-Converted Models

1. **Hugging Face Hub:** Search for "gemma-3n-e2b executorch" or "gemma-3n-e2b mobile"
   ```bash
   # Search Hugging Face
   source ~/llm-env/bin/activate
   huggingface-cli search "gemma-3n-e2b executorch"
   ```

2. **PyTorch Model Zoo:** Check https://pytorch.org/executorch/stable/model-zoo.html

3. **Community Models:** Search GitHub for "gemma executorch pte"

If you find a pre-converted model:
```bash
# Download directly
wget https://url-to-model/gemma-3n-e2b-int4.pte -O ~/llm-models/gemma-3n-e2b-executorch/gemma-3n-e2b-int4.pte
wget https://url-to-model/tokenizer.bin -O ~/llm-models/gemma-3n-e2b-executorch/tokenizer.bin
```

**Time Required:** 10-30 minutes (download only)

---

### Option 3: Use Alternative Export Method (TorchScript)

The conversion script has a fallback to use TorchScript, which works but may not be optimal for mobile.

```bash
cd /Users/home/Documents/Project/TrailSense
source ~/llm-env/bin/activate
python convert_gemma3n.py
```

The script will automatically fall back to TorchScript if ExecuTorch is not installed.

**Pros:**
- Works without ExecuTorch installation
- Produces a .pte file (actually TorchScript format)

**Cons:**
- May have slower inference on mobile
- Larger file size
- Not optimized for mobile deployment

**Time Required:** 30-60 minutes

---

### Option 4: Use Mock Mode (For Development Only)

If you just want to test the UI/UX flow, you can skip model conversion entirely:

```bash
cd /Users/home/Documents/Project/TrailSense

# Mock mode is already enabled in development
npm run android

# Test the app - it will use mock AI responses
```

**Pros:**
- Instant testing
- No model needed
- Perfect for UI/UX development

**Cons:**
- Not real AI (canned responses)
- Can't test actual model performance

**Time Required:** 5 minutes

---

## Recommended Path Forward

Based on your situation, I recommend:

### For Development/Testing (Start Here)
1. **Use Option 4 (Mock Mode)** to test the UI immediately
2. Verify that all the UI components work correctly
3. Test the user flow end-to-end

### For Production Deployment
Then choose one of:
- **Option 2 (Pre-Converted Model)** if available - fastest and easiest
- **Option 1 (ExecuTorch from Source)** - best quality, but most time-consuming
- **Option 3 (TorchScript Fallback)** - middle ground

---

## Installing ExecuTorch Properly (Option 1 Detailed)

If you choose Option 1, here are the detailed steps:

### Step 1: Check Prerequisites

```bash
# Check Git
git --version
# Should show: git version 2.x.x

# Check CMake
cmake --version
# Should show: cmake version 3.19 or higher

# Check Python
python --version
# Should show: Python 3.8+

# Check Xcode Command Line Tools (macOS)
xcode-select -p
# Should show: /Applications/Xcode.app/Contents/Developer
# or: /Library/Developer/CommandLineTools
```

If any are missing:
```bash
# Install Homebrew (if not installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install CMake
brew install cmake

# Install Xcode Command Line Tools
xcode-select --install
```

### Step 2: Clone and Install ExecuTorch

```bash
source ~/llm-env/bin/activate

cd ~/
git clone https://github.com/pytorch/executorch.git
cd executorch

# Initialize submodules
git submodule sync
git submodule update --init

# Install build requirements
./install_requirements.sh

# Build ExecuTorch (this takes 30-60 minutes)
cmake -S . -B cmake-out \
  -DCMAKE_INSTALL_PREFIX=cmake-out \
  -DEXECUTORCH_BUILD_EXTENSION_MODULE=ON \
  -DEXECUTORCH_BUILD_EXTENSION_DATA_LOADER=ON

cmake --build cmake-out -j$(nproc) --target install --config Release

# Install Python package
pip install -e .

# Verify
python -c "import executorch.exir as exir; print('ExecuTorch ready!')"
```

### Step 3: Run Conversion

```bash
cd /Users/home/Documents/Project/TrailSense
python convert_gemma3n.py
```

---

## Troubleshooting

### "CMake not found"
```bash
brew install cmake
```

### "Git submodule update fails"
```bash
cd ~/executorch
git submodule foreach --recursive git clean -xfd
git submodule update --init --recursive
```

### "Build fails with memory error"
```bash
# Reduce parallel jobs
cmake --build cmake-out -j2 --target install --config Release
```

### "Python import fails"
```bash
# Ensure virtual environment is activated
source ~/llm-env/bin/activate

# Reinstall ExecuTorch
cd ~/executorch
pip install -e . --force-reinstall
```

---

## Next Steps After Conversion

Once you have the model files (from any option), proceed with:

1. **Copy model files to Android assets**
2. **Build the app**
3. **Test on physical Android device**

See `NEXT_STEPS.md` for detailed instructions.

---

## Quick Decision Matrix

| Your Priority | Recommended Option | Time | Complexity |
|--------------|-------------------|------|-----------|
| Test UI now | Option 4 (Mock) | 5 min | Easy |
| Quick production | Option 2 (Pre-converted) | 30 min | Easy |
| Best quality | Option 1 (ExecuTorch) | 2-3 hrs | Hard |
| Middle ground | Option 3 (TorchScript) | 1 hr | Medium |

---

## What I Recommend Right Now

**Start with Mock Mode (Option 4):**
1. Test the app with mock mode immediately
2. Verify the UI/UX works as expected
3. Get feedback on the feature

**Then pursue real model:**
- Search for pre-converted models (Option 2) first
- If not found, decide between Option 1 or Option 3 based on your timeline

**Reasoning:**
- Mock mode lets you validate the integration immediately
- No need to block on model conversion for development
- Real model can be added later without code changes

---

## Current Environment Status

```
✅ Python 3.13.5 installed
✅ Virtual environment created: ~/llm-env
✅ Dependencies installed:
   - torch
   - transformers
   - sentencepiece
   - accelerate
   - huggingface_hub
⚠️ ExecuTorch: Not installed (requires source build)
📄 Conversion script ready: convert_gemma3n.py
```

---

## Need Help?

1. **ExecuTorch Installation:** https://pytorch.org/executorch/stable/getting-started-setup.html
2. **Model Conversion:** https://pytorch.org/executorch/stable/export-to-executorch-api-reference.html
3. **TrailSense LLM Docs:** See `LLM_BUNDLED_MODEL_GUIDE.md` and `NEXT_STEPS.md`

---

**Ready to proceed? Choose your option and let me know!**
