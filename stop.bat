title 强制停止Odoo
echo off
%CD%\runtime\bin\pv.exe -f -k python.exe -q
%CD%\runtime\bin\pv.exe -f -k python3.exe -q
%CD%\runtime\pgsql\bin\pg_ctl stop -D %CD%\runtime\pgsql\data -s -m fast
%CD%\runtime\bin\pv.exe -f -k postgres.exe -q
tskill postgres
tskill python
tskill nginx