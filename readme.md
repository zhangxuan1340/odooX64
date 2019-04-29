# Odoo绿色版本 64位

运行环境：
* Python3.68
* wkhtmltopdf
* PostgreSQL

测试环境：
* Windows10
* Windows7（需安装msvc2015）
  
请确保系统中已安装好组件：
* git
* msvc2015 x64

## 第一次运行
使用 <code>update.bat</code>更新Odoo源代码，后运行<code>init.bat</code>进行初始化数据库。

### Windows7下 终端会报错。

``` bash
ValueError：embedded null byte #python\Lib\_strptime.py 下，添加代码：
locale.setlocale(locale.LC_ALL, 'en')
```

> 配置文件中默认为80端口，如本机80端口未被占用，直接访问 127.0.0.1 即可访问，如果被占用请修改端口号。

## 第三方扩展

在文件夹根目录生成了 <code>myaddons</code>第三方扩展可直接放入到此目录。