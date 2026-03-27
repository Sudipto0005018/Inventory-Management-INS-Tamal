@echo off
echo Cleaning ...
rd /s /q build
mkdir build
echo Building frontend...
cd frontend
call npm run build > nul
cd ..
echo Copying frontend...
xcopy frontend\dist build\build /e /i /y > nul
echo Building frontend...
cd backend
call npm run build > nul
cd ..
echo Copying files ...
copy backend\main.bundle.js build\main.js
copy backend\package.json build\package.json
copy backend\package-lock.json build\package-lock.json
copy backend\license.txt build\license.txt
del backend\main.bundle.js

echo Platform tools...
xcopy backend\platform_tools build\platform_tools /e /i /y > nul
xcopy backend\uploads build\uploads /e /i /y > nul
copy install.bat build\install.bat > nul
copy start.bat build\start.bat > nul
call mysqldump -u root -p2026StrongPassword@955 inventory_ins > ./build/dump.sql
echo\
echo\
echo Build Done 
echo\
echo Press any key to exit ...
pause > nul