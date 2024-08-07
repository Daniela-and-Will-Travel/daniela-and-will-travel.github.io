REM Run the Eleventy command
npx @11ty/eleventy

REM Empty the contents of the 'docs' folder
del /q docs\*
for /d %%x in (docs\*) do @rd /s /q "%%x"

REM Copy the contents of the 'dist' folder to the 'docs' folder
xcopy dist\* docs\ /s /e /y
