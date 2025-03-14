@echo off
:: Run the npm command
echo Running npm command...
npx @11ty/eleventy

:: Check if the npm command was successful
if %errorlevel% neq 0 (
    echo npm command failed. Exiting script.
    exit /b %errorlevel%
)

:: Delete all files in the docs folder
echo Deleting all files in the docs folder...
del /q /f docs\*

:: Move all files from dist folder to docs folder
echo Moving files from dist folder to docs folder...
move /y dist\* docs\

echo Script completed successfully.
pause
