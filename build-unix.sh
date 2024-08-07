#!/bin/bash

# Run the Eleventy command
npx @11ty/eleventy

# Empty the contents of the 'docs' folder
rm -rf docs/*
rm -rf docs/.??*

# Copy the contents of the 'dist' folder to the 'docs' folder
cp -r dist/* docs/
