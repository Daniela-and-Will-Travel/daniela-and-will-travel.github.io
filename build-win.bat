npx @11ty/eleventy

del /q docs\*
for /d %%x in (docs\*) do @rd /s /q "%%x"

xcopy dist\* docs\ /s /e /y
