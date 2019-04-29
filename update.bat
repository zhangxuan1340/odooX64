title Odoo更新
echo off
cls

rd /s/q .\source-git

git clone -b 12.0 https://github.com/odoo/odoo.git .\source-git

rd /s/q .\source-git\.git

rd /s/q .\source-git\.github

rd /s/q .\source-git\.tx