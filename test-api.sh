#!/bin/bash

echo "🧪 测试 API 接口和日志功能"
echo "================================"

# 等待服务器启动
sleep 3

echo "1. 测试 manifest 接口"
curl -s -o /dev/null -w "状态码: %{http_code}\n" http://localhost:8083/manifest

echo ""
echo "2. 测试安装回调接口"
curl -s -X POST http://localhost:8083/install_cb \
  -H "Content-Type: application/json" \
  -d '{
    "installation_id": "test-install-123",
    "org_id": "test-org-456",
    "ones_base_url": "https://test.ones.com",
    "shared_secret": "test-secret",
    "callback_type": "install",
    "time_stamp": 1234567890
  }' \
  -w "状态码: %{http_code}\n"

echo ""
echo "3. 测试获取所有安装信息"
curl -s -o /dev/null -w "状态码: %{http_code}\n" http://localhost:8083/all_installations

echo ""
echo "4. 测试设置页面条目"
curl -s -X POST http://localhost:8083/settingPage/entries \
  -H "Content-Type: application/json" \
  -d '{
    "user_uuid": "test-user",
    "language": "zh",
    "timezone": "Asia/Shanghai"
  }' \
  -w "状态码: %{http_code}\n"

echo ""
echo "✅ 测试完成！请查看服务器日志输出。"

