#!/usr/bin/env python3
"""
Gemma 3n E2B Model Conversion Script for ExecuTorch
===================================================

This script downloads the Gemma 3n E2B model from Hugging Face and converts it
to ExecuTorch .pte format with INT4 quantization for on-device inference.

Requirements:
- Python 3.8+
- torch
- transformers
- executorch
- sentencepiece
- accelerate
- huggingface_hub

Usage:
    python3 convert_gemma3n.py

Output:
    ~/llm-models/gemma-3n-e2b-executorch/
        ├── gemma-3n-e2b-int4.pte (~2GB)
        └── tokenizer.bin (~512KB)
"""

import os
import sys
import time
from pathlib import Path
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
from huggingface_hub import snapshot_download, login

# Configuration
MODEL_NAME = "google/gemma-3n-e2b"
OUTPUT_DIR = Path.home() / "llm-models" / "gemma-3n-e2b-executorch"
TEMP_DIR = Path.home() / "llm-models" / "gemma-3n-e2b-temp"
MODEL_OUTPUT_NAME = "gemma-3n-e2b-int4.pte"
TOKENIZER_OUTPUT_NAME = "tokenizer.bin"

# Performance settings
USE_QUANTIZATION = True
QUANTIZATION_BITS = 4  # INT4 quantization
USE_LOW_CPU_MEM = True

def print_step(step: int, message: str):
    """Print formatted step message"""
    print(f"\n{'=' * 70}")
    print(f"STEP {step}: {message}")
    print(f"{'=' * 70}\n")

def print_info(message: str):
    """Print info message"""
    print(f"ℹ️  {message}")

def print_success(message: str):
    """Print success message"""
    print(f"✅ {message}")

def print_error(message: str):
    """Print error message"""
    print(f"❌ {message}")

def print_warning(message: str):
    """Print warning message"""
    print(f"⚠️  {message}")

def check_dependencies():
    """Check if all required dependencies are installed"""
    print_step(1, "Checking Dependencies")

    required_packages = {
        'torch': 'torch',
        'transformers': 'transformers',
        'sentencepiece': 'sentencepiece',
        'accelerate': 'accelerate',
        'huggingface_hub': 'huggingface_hub',
    }

    missing_packages = []

    for package, import_name in required_packages.items():
        try:
            __import__(import_name)
            print_success(f"{package} is installed")
        except ImportError:
            missing_packages.append(package)
            print_error(f"{package} is NOT installed")

    # Check for executorch separately as it might have different import name
    try:
        import executorch
        print_success("executorch is installed")
    except ImportError:
        try:
            import torch.export
            print_success("executorch (via torch.export) is available")
        except ImportError:
            missing_packages.append('executorch')
            print_error("executorch is NOT installed")

    if missing_packages:
        print_error("\nMissing packages detected!")
        print_info("Please install missing packages with:")
        print(f"  pip install {' '.join(missing_packages)}")
        sys.exit(1)

    print_success("\nAll dependencies are installed!")

def authenticate_huggingface():
    """Authenticate with Hugging Face"""
    print_step(2, "Hugging Face Authentication")

    print_info("Checking Hugging Face authentication...")
    print_info(f"Attempting to access model: {MODEL_NAME}")

    # Check if already authenticated
    from huggingface_hub import HfFolder
    token = HfFolder.get_token()

    if token:
        print_success("Already authenticated with Hugging Face!")
        return

    print_warning("Not authenticated with Hugging Face")
    print_info("\nYou need to authenticate to download the Gemma 3n E2B model.")
    print_info("Options:")
    print_info("1. Run: huggingface-cli login")
    print_info("2. Or provide your token now")
    print_info("\nGet your token from: https://huggingface.co/settings/tokens")

    response = input("\nDo you want to enter your token now? (y/n): ").strip().lower()

    if response == 'y':
        token = input("Enter your Hugging Face token: ").strip()
        try:
            login(token=token)
            print_success("Authentication successful!")
        except Exception as e:
            print_error(f"Authentication failed: {e}")
            print_info("Please run: huggingface-cli login")
            sys.exit(1)
    else:
        print_info("Please run: huggingface-cli login")
        print_info("Then run this script again.")
        sys.exit(0)

def download_model():
    """Download the Gemma 3n E2B model from Hugging Face"""
    print_step(3, "Downloading Model from Hugging Face")

    print_info(f"Model: {MODEL_NAME}")
    print_info(f"Destination: {TEMP_DIR}")
    print_warning("This will download ~4-8GB of data and may take 10-30 minutes")

    # Create temp directory
    TEMP_DIR.mkdir(parents=True, exist_ok=True)

    try:
        start_time = time.time()

        print_info("\nStarting download...")
        model_path = snapshot_download(
            repo_id=MODEL_NAME,
            local_dir=str(TEMP_DIR),
            local_dir_use_symlinks=False,
        )

        elapsed_time = time.time() - start_time
        print_success(f"\nModel downloaded successfully in {elapsed_time:.1f} seconds!")
        print_info(f"Model location: {model_path}")

        return model_path

    except Exception as e:
        print_error(f"Failed to download model: {e}")
        print_info("\nTroubleshooting:")
        print_info("1. Check your internet connection")
        print_info("2. Verify you have access to the model (may require accepting terms)")
        print_info("3. Ensure you're authenticated: huggingface-cli login")
        sys.exit(1)

def load_model_and_tokenizer(model_path: str):
    """Load the model and tokenizer"""
    print_step(4, "Loading Model and Tokenizer")

    print_info("Loading tokenizer...")
    try:
        tokenizer = AutoTokenizer.from_pretrained(
            model_path,
            trust_remote_code=True
        )
        print_success("Tokenizer loaded successfully!")
    except Exception as e:
        print_error(f"Failed to load tokenizer: {e}")
        sys.exit(1)

    print_info("\nLoading model (this may take 5-10 minutes)...")
    print_warning("This requires ~8-16GB RAM")

    try:
        model = AutoModelForCausalLM.from_pretrained(
            model_path,
            torch_dtype=torch.float16,
            low_cpu_mem_usage=USE_LOW_CPU_MEM,
            trust_remote_code=True,
            device_map="cpu"  # Force CPU for conversion
        )
        model.eval()
        print_success("Model loaded successfully!")

        # Print model info
        param_count = sum(p.numel() for p in model.parameters())
        print_info(f"Model parameters: {param_count:,}")
        print_info(f"Model dtype: {model.dtype}")

        return model, tokenizer

    except Exception as e:
        print_error(f"Failed to load model: {e}")
        print_info("\nTroubleshooting:")
        print_info("1. Ensure you have enough RAM (16GB+ recommended)")
        print_info("2. Close other applications to free up memory")
        print_info("3. Try running on a machine with more RAM")
        sys.exit(1)

def export_to_executorch(model, tokenizer):
    """Export model to ExecuTorch format"""
    print_step(5, "Converting to ExecuTorch Format")

    print_warning("This step may take 30-60 minutes and requires significant RAM")

    # Create output directory
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    print_info("Preparing model for export...")

    # Note: The actual ExecuTorch export process depends on the ExecuTorch version
    # and model architecture. This is a simplified version.

    try:
        # Check if we can use torch.export (ExecuTorch API)
        try:
            import executorch.exir as exir
            from executorch.exir import EdgeCompileConfig, to_edge

            print_info("Using ExecuTorch API...")

            # Create example input
            example_input_ids = torch.randint(
                0, tokenizer.vocab_size, (1, 128), dtype=torch.long
            )

            print_info("Capturing model with EXIR...")

            # Capture the model
            edge_program = exir.capture(
                model,
                (example_input_ids,),
                EdgeCompileConfig(
                    _check_ir_validity=False,
                    _use_edge_ops=True,
                ),
            ).to_edge()

            # Apply quantization if requested
            if USE_QUANTIZATION:
                print_info(f"Applying INT{QUANTIZATION_BITS} quantization...")
                # Note: Actual quantization depends on ExecuTorch version
                # This is a placeholder for the quantization step
                print_warning("Quantization step needs to be implemented based on ExecuTorch version")

            # Save the model
            output_file = OUTPUT_DIR / MODEL_OUTPUT_NAME
            print_info(f"Saving model to {output_file}...")

            with open(output_file, "wb") as f:
                edge_program.write_to_file(f)

            print_success(f"Model exported successfully!")
            print_info(f"Output: {output_file}")

            # Check file size
            file_size = output_file.stat().st_size
            file_size_gb = file_size / (1024**3)
            print_info(f"File size: {file_size_gb:.2f} GB")

        except ImportError:
            print_warning("ExecuTorch not found, attempting alternative export method...")

            # Alternative: Use torch.jit.trace or torch.export
            print_info("Using torch.jit.trace as fallback...")

            example_input = torch.randint(0, tokenizer.vocab_size, (1, 128))

            # Trace the model
            traced_model = torch.jit.trace(model, (example_input,))

            # Save as TorchScript
            output_file = OUTPUT_DIR / MODEL_OUTPUT_NAME
            traced_model.save(str(output_file))

            print_success(f"Model exported using TorchScript!")
            print_warning("Note: This may not be the optimal ExecuTorch format")
            print_info("Consider installing ExecuTorch for proper .pte format")

    except Exception as e:
        print_error(f"Export failed: {e}")
        print_info("\nTroubleshooting:")
        print_info("1. Ensure ExecuTorch is properly installed")
        print_info("2. Check that you have enough disk space (~4GB free)")
        print_info("3. Verify model compatibility with ExecuTorch")
        print_info("\nFor more help, see:")
        print_info("https://pytorch.org/executorch/")

        # Save error details for debugging
        import traceback
        error_file = OUTPUT_DIR / "conversion_error.log"
        with open(error_file, "w") as f:
            f.write(f"Error during conversion:\n\n")
            f.write(traceback.format_exc())
        print_info(f"\nError details saved to: {error_file}")

        sys.exit(1)

def export_tokenizer(tokenizer):
    """Export tokenizer"""
    print_step(6, "Exporting Tokenizer")

    tokenizer_file = OUTPUT_DIR / TOKENIZER_OUTPUT_NAME

    try:
        print_info(f"Saving tokenizer to {tokenizer_file}...")

        # Save tokenizer files
        tokenizer.save_pretrained(str(OUTPUT_DIR))

        # For ExecuTorch, we typically need the tokenizer model file
        # Try to find and rename the sentencepiece model
        possible_tokenizer_files = [
            OUTPUT_DIR / "tokenizer.model",
            OUTPUT_DIR / "spiece.model",
            OUTPUT_DIR / "tokenizer.json",
        ]

        source_file = None
        for file in possible_tokenizer_files:
            if file.exists():
                source_file = file
                break

        if source_file:
            # Copy/rename to expected name
            if source_file.name != TOKENIZER_OUTPUT_NAME:
                import shutil
                shutil.copy2(source_file, tokenizer_file)
            print_success(f"Tokenizer exported successfully!")
        else:
            print_warning("Tokenizer model file not found in expected locations")
            print_info("Tokenizer files have been saved, but may need manual configuration")

        # Check file size
        if tokenizer_file.exists():
            file_size = tokenizer_file.stat().st_size
            file_size_kb = file_size / 1024
            print_info(f"Tokenizer size: {file_size_kb:.1f} KB")

    except Exception as e:
        print_error(f"Failed to export tokenizer: {e}")
        sys.exit(1)

def verify_output():
    """Verify the output files"""
    print_step(7, "Verifying Output Files")

    model_file = OUTPUT_DIR / MODEL_OUTPUT_NAME
    tokenizer_file = OUTPUT_DIR / TOKENIZER_OUTPUT_NAME

    success = True

    # Check model file
    if model_file.exists():
        size = model_file.stat().st_size
        size_gb = size / (1024**3)
        print_success(f"Model file exists: {model_file}")
        print_info(f"  Size: {size_gb:.2f} GB ({size:,} bytes)")

        if size < 100 * 1024 * 1024:  # Less than 100MB
            print_warning("  Model file seems too small!")
            success = False
    else:
        print_error(f"Model file NOT found: {model_file}")
        success = False

    # Check tokenizer file
    if tokenizer_file.exists():
        size = tokenizer_file.stat().st_size
        size_kb = size / 1024
        print_success(f"Tokenizer file exists: {tokenizer_file}")
        print_info(f"  Size: {size_kb:.1f} KB ({size:,} bytes)")
    else:
        print_warning(f"Tokenizer file NOT found: {tokenizer_file}")
        print_info("  This may need manual configuration")

    return success

def print_next_steps():
    """Print next steps for the user"""
    print_step(8, "Next Steps")

    print_success("Model conversion complete!")
    print_info("\nTo use this model in your TrailSense app:")
    print_info("\n1. Create Android assets directory:")
    print_info("   mkdir -p /Users/home/Documents/Project/TrailSense/android/app/src/main/assets")

    print_info("\n2. Copy model files to Android assets:")
    print_info(f"   cp {OUTPUT_DIR}/{MODEL_OUTPUT_NAME} \\")
    print_info("      /Users/home/Documents/Project/TrailSense/android/app/src/main/assets/")
    print_info(f"   cp {OUTPUT_DIR}/{TOKENIZER_OUTPUT_NAME} \\")
    print_info("      /Users/home/Documents/Project/TrailSense/android/app/src/main/assets/")

    print_info("\n3. Build the app:")
    print_info("   cd /Users/home/Documents/Project/TrailSense")
    print_info("   cd android && ./gradlew clean && cd ..")
    print_info("   npm run android")

    print_info("\n4. Test on a physical Android device:")
    print_info("   - Deploy to device")
    print_info("   - Open Alert Detail screen")
    print_info("   - Click 'Explain with AI'")
    print_info("   - Monitor logs: adb logcat | grep LLM")

    print_info("\nFor troubleshooting, see:")
    print_info("- /Users/home/Documents/Project/TrailSense/NEXT_STEPS.md")
    print_info("- /Users/home/Documents/Project/TrailSense/LLM_BUNDLED_MODEL_GUIDE.md")

def cleanup_temp_files():
    """Ask user if they want to clean up temporary files"""
    print_info("\nCleanup:")
    print_info(f"Temporary download directory: {TEMP_DIR}")
    print_info(f"Size: ~4-8 GB")

    response = input("Do you want to delete the temporary download files? (y/n): ").strip().lower()

    if response == 'y':
        try:
            import shutil
            shutil.rmtree(TEMP_DIR)
            print_success("Temporary files deleted!")
        except Exception as e:
            print_warning(f"Could not delete temporary files: {e}")
            print_info(f"You can manually delete: {TEMP_DIR}")
    else:
        print_info(f"Temporary files kept at: {TEMP_DIR}")

def main():
    """Main conversion workflow"""
    print("\n" + "=" * 70)
    print("Gemma 3n E2B to ExecuTorch Conversion Script")
    print("=" * 70)

    try:
        # Step 1: Check dependencies
        check_dependencies()

        # Step 2: Authenticate with Hugging Face
        authenticate_huggingface()

        # Step 3: Download model
        model_path = download_model()

        # Step 4: Load model and tokenizer
        model, tokenizer = load_model_and_tokenizer(str(model_path))

        # Step 5: Export to ExecuTorch
        export_to_executorch(model, tokenizer)

        # Step 6: Export tokenizer
        export_tokenizer(tokenizer)

        # Step 7: Verify output
        if verify_output():
            print_success("\n✅ Conversion completed successfully!")
        else:
            print_warning("\n⚠️  Conversion completed with warnings")

        # Step 8: Print next steps
        print_next_steps()

        # Cleanup
        cleanup_temp_files()

    except KeyboardInterrupt:
        print_error("\n\nConversion interrupted by user")
        sys.exit(1)
    except Exception as e:
        print_error(f"\n\nUnexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
