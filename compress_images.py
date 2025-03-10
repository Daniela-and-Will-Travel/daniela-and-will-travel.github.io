import os
from PIL import Image
import sys

# Function to compress the image
def compress_image(file_path, quality=85):
    try:
        with Image.open(file_path) as img:
            # If it's a PNG, use 'PNG' format, else for other formats use 'JPEG' or 'WEBP'
            if img.format == 'PNG':
                img.save(file_path, format='PNG', optimize=True)
            else:
                img.save(file_path, format='JPEG', quality=quality, optimize=True)
        print(f"Compressed and overwrote {file_path}")
    except Exception as e:
        print(f"Error compressing {file_path}: {e}")

# Function to walk through the directory and compress the images
def compress_images_in_directory(directory, file_extensions, quality=85):
    # Walk through all files in the directory
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.lower().endswith(tuple(file_extensions)):
                file_path = os.path.join(root, file)
                compress_image(file_path, quality)

if __name__ == "__main__":
    # Directory where images are located
    directory = sys.argv[1] if len(sys.argv) > 1 else "."
    # File extensions to look for
    file_extensions = sys.argv[2].split(",") if len(sys.argv) > 2 else ["jpg", "jpeg", "png"]
    # Compression quality
    quality = int(sys.argv[3]) if len(sys.argv) > 3 else 85

    compress_images_in_directory(directory, file_extensions, quality)
