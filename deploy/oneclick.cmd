@echo off
REM روغن‌لند — نصب یک‌کلیک. روی این فایل دابل‌کلیک کن.
REM این فایل، اسکریپت PowerShell کنارش (oneclick.ps1) را اجرا می‌کند.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0oneclick.ps1"
