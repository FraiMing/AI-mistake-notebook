#!/bin/sh
# MinIO bucket 初始化：确保 ai-notebook-images bucket 存在

mc alias set local http://minio:9000 minioadmin minioadmin 2>/dev/null
mc mb local/ai-notebook-images --ignore-existing 2>/dev/null
echo 'MinIO bucket 初始化完成'
