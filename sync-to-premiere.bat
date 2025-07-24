@echo off
echo Syncing Team Ovistra plugin...

set SOURCE=G:\Ovis\OvisZero_proto
set TARGET=C:\Users\odj05\AppData\Roaming\Adobe\CEP\extensions\com.ovistra.panel

if exist "%TARGET%" (
    echo Removing existing folder...
    rmdir /S /Q "%TARGET%"
)

echo Creating target directory...
mkdir "%TARGET%"

echo Copying files...
xcopy "%SOURCE%\*.html" "%TARGET%\" /Y
xcopy "%SOURCE%\*.json" "%TARGET%\" /Y
xcopy "%SOURCE%\*.js" "%TARGET%\" /Y
xcopy "%SOURCE%\*.ts" "%TARGET%\" /Y
xcopy "%SOURCE%\*.tsx" "%TARGET%\" /Y
xcopy "%SOURCE%\*.css" "%TARGET%\" /Y
xcopy "%SOURCE%\*.md" "%TARGET%\" /Y
xcopy "%SOURCE%\*.bat" "%TARGET%\" /Y

echo Copying folders...
xcopy "%SOURCE%\components" "%TARGET%\components\" /E /I /Y
xcopy "%SOURCE%\CSXS" "%TARGET%\CSXS\" /E /I /Y
xcopy "%SOURCE%\host" "%TARGET%\host\" /E /I /Y
xcopy "%SOURCE%\js" "%TARGET%\js\" /E /I /Y
xcopy "%SOURCE%\lib" "%TARGET%\lib\" /E /I /Y
xcopy "%SOURCE%\scripts" "%TARGET%\scripts\" /E /I /Y
xcopy "%SOURCE%\stores" "%TARGET%\stores\" /E /I /Y
xcopy "%SOURCE%\styles" "%TARGET%\styles\" /E /I /Y
xcopy "%SOURCE%\types" "%TARGET%\types\" /E /I /Y

echo.
echo Done! Sync complete.
echo.
echo Please restart Premiere Pro or reload the extension.
echo.
pause