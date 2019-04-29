title 绿色版启动初始化数据库
echo off
cls
cd runtime\pgsql\bin
rd /s/q ..\data
initdb.exe -D ..\data -E UTF8
pg_ctl -D ..\data -l logfile start
rem 创建用户，账户与密码均为Odoo，请输入Odoo
createuser --createdb --no-createrole --no-superuser --pwprompt odoo
exit