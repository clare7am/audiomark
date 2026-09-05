@echo off
cd /d "%~dp0"
start "" http://localhost:8766
node server.js
