@echo off
echo Starting Team Ovistra live sync...
echo.
echo Keep this window open for automatic sync.
echo Press Ctrl+C to stop.
echo.

set SOURCE=G:\Ovis\OvisZero_proto
set TARGET=C:\Users\odj05\AppData\Roaming\Adobe\CEP\extensions\com.ovistra.panel

:loop
xcopy "%SOURCE%" "%TARGET%" /E /I /Y /Q /D > nul
timeout /t 5 /nobreak > nul
goto loop