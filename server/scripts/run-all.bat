@echo off
echo Running all database population and test scripts...
echo.

echo 1. Populating users...
call npm run populate-users
echo.

echo 2. Populating shop...
call npm run populate-shop
echo.

echo 3. Testing users...
call npm run test-users
echo.

echo 4. Testing leaderboard...
call npm run test-leaderboard
echo.

echo All scripts completed!
pause
