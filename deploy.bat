@echo off
echo Building frontend...
cd frontend
call npm run build
if %errorlevel% neq 0 (
    echo Build failed!
    exit /b 1
)
echo Build completed!
cd ..
echo Deploying to Firebase...
firebase deploy --only hosting
if %errorlevel% neq 0 (
    echo Deployment failed!
    exit /b 1
)
echo Deployment completed!

