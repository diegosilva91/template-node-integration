#!/bin/bash
echo "App Build And Serve Script Starting..."
echo "Frontend building..."
pwd
cd web/frontend
pwd
ls -lthra
npm run build
echo "Frontend Build Complete."
echo "Backend Preparing to Serve Requests..."
cd /app/web
pwd
ls -lthra
npm run serve
echo "Backend Now Serving Requests."
echo "App Build And Serve Script Complete."