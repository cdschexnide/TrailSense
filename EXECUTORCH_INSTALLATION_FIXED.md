# ExecuTorch Installation - Python Version Fix

## Issue Encountered

ExecuTorch requires Python 3.10-3.12, but the system has Python 3.13.5 by default.

```
ERROR: ExecuTorch does not support python version 3.13.5: must satisfy ">=3.10,<3.13"
```

## Solution: Use Python 3.11

Python 3.11.14 is available at `/opt/homebrew/bin/python3.11`

---

## Step-by-Step Installation (Fixed)

### Step 1: Remove Old Virtual Environment

```bash
# Deactivate current environment
deactivate

# Remove old environment
rm -rf ~/llm-env
```

### Step 2: Create New Virtual Environment with Python 3.11

```bash
# Create new environment with compatible Python
python3.11 -m venv ~/llm-env

# Activate it
source ~/llm-env/bin/activate

# Verify Python version
python --version
# Should show: Python 3.11.14
```

### Step 3: Install Core Dependencies

```bash
# Make sure you're in the virtual environment
source ~/llm-env/bin/activate

# Install core dependencies
pip install torch transformers sentencepiece accelerate huggingface_hub

# Verify installation
python -c "import torch; print(f'PyTorch {torch.__version__} installed')"
```

### Step 4: Install ExecuTorch

```bash
# Navigate to executorch directory
cd ~/executorch

# Run installation script (should work now!)
./install_requirements.sh

# Install ExecuTorch Python package
pip install -e .

# Verify installation
python -c "import executorch; print('ExecuTorch installed successfully!')"
```

### Step 5: (Optional) Build ExecuTorch

If you need the full build:

```bash
cd ~/executorch

# Configure build
cmake -S . -B cmake-out \
  -DCMAKE_INSTALL_PREFIX=cmake-out \
  -DEXECUTORCH_BUILD_EXTENSION_MODULE=ON \
  -DEXECUTORCH_BUILD_EXTENSION_DATA_LOADER=ON

# Build (this takes 30-60 minutes)
cmake --build cmake-out -j$(sysctl -n hw.ncpu) --target install --config Release
```

### Step 6: Test Installation

```bash
# Activate environment
source ~/llm-env/bin/activate

# Test imports
python -c "
import torch
import transformers
import executorch.exir as exir
print('✅ All packages imported successfully!')
print(f'PyTorch: {torch.__version__}')
print(f'Transformers: {transformers.__version__}')
print('ExecuTorch: Ready!')
"
```

---

## Quick Command Reference

### Fresh Start (All Steps)

```bash
# 1. Clean up
deactivate 2>/dev/null || true
rm -rf ~/llm-env

# 2. Create new environment with Python 3.11
python3.11 -m venv ~/llm-env
source ~/llm-env/bin/activate

# 3. Install dependencies
pip install torch transformers sentencepiece accelerate huggingface_hub

# 4. Install ExecuTorch
cd ~/executorch
./install_requirements.sh
pip install -e .

# 5. Verify
python -c "import executorch.exir; print('✅ ExecuTorch ready!')"
```

### Just Fix the Environment

If you've already cloned executorch:

```bash
# Remove old environment
deactivate 2>/dev/null || true
rm -rf ~/llm-env

# Create new with Python 3.11
python3.11 -m venv ~/llm-env
source ~/llm-env/bin/activate

# Install everything
pip install torch transformers sentencepiece accelerate huggingface_hub
cd ~/executorch
./install_requirements.sh
pip install -e .
```

---

## After Installation

Once ExecuTorch is installed, you can run the model conversion:

```bash
# Activate environment
source ~/llm-env/bin/activate

# Navigate to TrailSense
cd /Users/home/Documents/Project/TrailSense

# Run conversion script
python convert_gemma3n.py
```

---

## Verification Checklist

After running the installation:

- [ ] `python --version` shows Python 3.11.x
- [ ] `pip list | grep torch` shows PyTorch installed
- [ ] `pip list | grep transformers` shows transformers installed
- [ ] `pip list | grep executorch` shows executorch installed
- [ ] `python -c "import executorch.exir"` runs without error
- [ ] No more "python version 3.13.5" error

---

## Alternative: Use Conda (If Issues Persist)

If you continue to have issues, you can use conda:

```bash
# Create conda environment with Python 3.11
conda create -n llm-env python=3.11 -y
conda activate llm-env

# Install dependencies
pip install torch transformers sentencepiece accelerate huggingface_hub

# Install ExecuTorch
cd ~/executorch
./install_requirements.sh
pip install -e .
```

---

## Troubleshooting

### "python3.11: command not found"

Install Python 3.11 via Homebrew:

```bash
brew install python@3.11
```

Then create the environment:

```bash
/opt/homebrew/bin/python3.11 -m venv ~/llm-env
```

### "No module named 'venv'"

```bash
python3.11 -m ensurepip
python3.11 -m pip install --upgrade pip
python3.11 -m venv ~/llm-env
```

### "./install_requirements.sh still fails"

Check the actual Python version in your venv:

```bash
source ~/llm-env/bin/activate
python --version
which python
```

If it's still showing 3.13, recreate the environment:

```bash
deactivate
rm -rf ~/llm-env
/opt/homebrew/bin/python3.11 -m venv ~/llm-env
source ~/llm-env/bin/activate
python --version  # Should now show 3.11.x
```

---

## Next Steps

After successful installation:

1. ✅ Run model conversion: `python convert_gemma3n.py`
2. ✅ Copy model files: `./copy-model-files.sh`
3. ✅ Build app: `npm run android`
4. ✅ Test on device

See `TESTING_AND_DEPLOYMENT_GUIDE.md` for complete testing instructions.

---

## Summary

**The Fix:**
- Use Python 3.11 instead of 3.13
- Create new venv: `python3.11 -m venv ~/llm-env`
- Install ExecuTorch: `cd ~/executorch && ./install_requirements.sh`

**Time Required:**
- Environment setup: 5 minutes
- ExecuTorch installation: 10-15 minutes
- (Optional) Full build: 30-60 minutes

**Then proceed with model conversion!**
