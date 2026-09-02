# 从零重建指南

> 适用场景：所有文件丢失，只有这份文档和 GitHub 仓库。

## 1. 环境准备

- Python 3.11+
- Git
- 腾讯云服务器（或任何 Ubuntu 22.04 服务器）

## 2. 克隆代码

```bash
git clone https://github.com/lengxufan-project/lengxufan-api.git
cd lengxufan-api
```

## 3. 安装依赖

```bash
pip install -r requirements.txt
```

## 4. 设置 API Key

| 平台 | 环境变量名 | 获取方式 |
|------|------|------|
| 阿里云百炼 | `ALIBABA_API_KEY` | 阿里云百炼控制台 |
| 智谱 AI | `GLM_API_KEY` | 智谱开放平台 |
| DeepSeek | `DEEPSEEK_API_KEY` | DeepSeek 控制台 |

```powershell
[Environment]::SetEnvironmentVariable("ALIBABA_API_KEY", "你的Key", "User")
[Environment]::SetEnvironmentVariable("GLM_API_KEY", "你的Key", "User")
[Environment]::SetEnvironmentVariable("DEEPSEEK_API_KEY", "你的Key", "User")
```

设置后需重启终端。

## 5. 初始化数据库

首次运行时自动创建 `data/lengxufan.db`，无需手动操作。

## 6. 启动

```bash
python run.py          # Web 模式，访问 http://127.0.0.1:5000
python run.py --cli    # CLI 调试模式
```

## 7. 部署到服务器

```bash
# 上传代码
scp -r . ubuntu@你的服务器IP:/opt/lengxufan/

# 创建虚拟环境
ssh ubuntu@你的服务器IP
cd /opt/lengxufan
python3.11 -m venv venv
venv/bin/pip install -r requirements.txt

# 配置 Supervisor
sudo nano /etc/supervisor/conf.d/lengxufan.conf
```

Supervisor 配置：
```ini
[program:lengxufan]
command=/opt/lengxufan/venv/bin/python run.py
directory=/opt/lengxufan
user=ubuntu
autostart=true
autorestart=true
environment=ALIBABA_API_KEY="你的Key",GLM_API_KEY="你的Key"
```

```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start lengxufan
```

## 8. 验证

```bash
curl -X POST http://127.0.0.1:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"123456"}'
```

预期返回：`{"message":"注册成功","user_id":1,"username":"test"}`
