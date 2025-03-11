import os
import sys

# Function to remove files that start with "compressed"
def remove_compressed_files(directory):
    # Walk through all files in the directory
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.lower().startswith("compressed"):
                file_path = os.path.join(root, file)
                try:
                    os.remove(file_path)
                    print(f"Removed {file_path}")
                except Exception as e:
                    print(f"Error removing {file_path}: {e}")

if __name__ == "__main__":
    # Directory where the files are located
    directory = sys.argv[1] if len(sys.argv) > 1 else "."
    
    remove_compressed_files(directory)
