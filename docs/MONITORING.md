# 监控和日志配置指南

本文档介绍如何配置和使用 Nexus Console 的监控和日志系统。

## 📋 目录

- [监控架构](#监控架构)
- [快速开始](#快速开始)
- [Prometheus 配置](#prometheus-配置)
- [Grafana 仪表板](#grafana-仪表板)
- [告警规则](#告警规则)
- [日志管理](#日志管理)
- [常用查询](#常用查询)

---

## 🏗️ 监控架构

### 组件说明

```
┌─────────────┐
│   应用层    │
│  API + Web  │
└──────┬──────┘
       │ 指标暴露
       ↓
┌─────────────┐     ┌──────────────┐
│ Prometheus  │────→│   Grafana    │
│  (指标收集)  │     │  (可视化)    │
└──────┬──────┘     └──────────────┘
       │
       ↓
┌─────────────┐
│ Exporters   │
│ - Postgres  │
│ - Redis     │
│ - Node      │
│ - cAdvisor  │
└─────────────┘
```

### 监控指标

**应用指标**：

- HTTP 请求速率
- 响应时间（P50, P95, P99）
- 错误率（4xx, 5xx）
- 活跃连接数

**系统指标**：

- CPU 使用率
- 内存使用率
- 磁盘 I/O
- 网络流量

**数据库指标**：

- 连接数
- 查询速率
- 慢查询
- 缓存命中率

---

## 🚀 快速开始

### 1. 启动监控服务

```bash
# 启动应用 + 监控服务
docker compose -f docker-compose.yml -f docker-compose.monitoring.yml up -d

# 查看服务状态
docker compose ps
```

### 2. 访问监控界面

**Prometheus**：

- URL: http://localhost:9090
- 用途: 查询指标、查看告警

**Grafana**：

- URL: http://localhost:3000
- 默认账号: admin / admin
- 用途: 可视化仪表板

**cAdvisor**：

- URL: http://localhost:8080
- 用途: 容器资源监控

### 3. 配置 Grafana

首次登录后：

1. **添加数据源**

   - 导航到 Configuration → Data Sources
   - 添加 Prometheus
   - URL: http://prometheus:9090
   - 点击 "Save & Test"

2. **导入仪表板**
   - 导航到 Dashboards → Import
   - 上传 `monitoring/grafana/dashboards/api-dashboard.json`
   - 选择 Prometheus 数据源
   - 点击 Import

---

## 📊 Prometheus 配置

### 配置文件位置

```
monitoring/
├── prometheus.yml          # 主配置文件
└── alerts/
    ├── api_alerts.yml      # API 告警规则
    └── database_alerts.yml # 数据库告警规则
```

### 抓取配置

```yaml
# monitoring/prometheus.yml
scrape_configs:
  # API 应用
  - job_name: "api"
    static_configs:
      - targets: ["api:8000"]
    metrics_path: "/metrics"
    scrape_interval: 15s

  # PostgreSQL
  - job_name: "postgres"
    static_configs:
      - targets: ["postgres-exporter:9187"]

  # Redis
  - job_name: "redis"
    static_configs:
      - targets: ["redis-exporter:9121"]
```

### 查看指标

访问 Prometheus UI (http://localhost:9090)：

```promql
# 查看所有指标
{job="api"}

# HTTP 请求速率
rate(http_requests_total[5m])

# 响应时间 P95
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# 错误率
rate(http_requests_total{status=~"5.."}[5m])
```

---

## 📈 Grafana 仪表板

### 预配置仪表板

**API Dashboard** (`api-dashboard.json`)：

- 请求速率趋势
- 响应时间分布
- 错误率监控
- 活跃连接数

### 创建自定义仪表板

1. **添加面板**

   - 点击 "Add panel"
   - 选择可视化类型（Graph, Stat, Gauge）

2. **配置查询**

   ```promql
   # 示例：API 请求速率
   sum(rate(http_requests_total[5m])) by (method, path)
   ```

3. **设置告警**
   - 在面板中点击 "Alert"
   - 配置告警条件
   - 设置通知渠道

### 推荐仪表板

从 Grafana 官方导入：

- **Node Exporter Full**: ID 1860
- **PostgreSQL Database**: ID 9628
- **Redis Dashboard**: ID 11835
- **Docker Container & Host Metrics**: ID 179

导入方式：

```
Dashboards → Import → 输入 ID → Load
```

---

## 🚨 告警规则

### API 告警

```yaml
# monitoring/alerts/api_alerts.yml
groups:
  - name: api_alerts
    rules:
      # API 宕机
      - alert: APIDown
        expr: up{job="api"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "API 服务宕机"

      # 高错误率
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "5xx 错误率超过 5%"

      # 高响应时间
      - alert: HighResponseTime
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "95% 请求响应时间超过 1 秒"
```

### 数据库告警

```yaml
# monitoring/alerts/database_alerts.yml
groups:
  - name: database_alerts
    rules:
      # PostgreSQL 宕机
      - alert: PostgreSQLDown
        expr: up{job="postgres"} == 0
        for: 1m
        labels:
          severity: critical

      # 连接数过高
      - alert: HighDatabaseConnections
        expr: pg_stat_database_numbackends > 80
        for: 5m
        labels:
          severity: warning
```

### 查看告警

访问 Prometheus UI → Alerts：

- 查看当前告警状态
- 查看告警历史
- 测试告警规则

---

## 📝 日志管理

### 应用日志

**查看日志**：

```bash
# 查看所有服务日志
docker compose logs -f

# 查看 API 日志
docker compose logs -f api

# 查看最近 100 行
docker compose logs --tail=100 api

# 导出日志
docker compose logs api > api_logs.txt
```

### 日志级别

在 `apps/api/.env` 中配置：

```bash
# 开发环境
LOG_LEVEL=DEBUG

# 生产环境
LOG_LEVEL=INFO

# 问题排查
LOG_LEVEL=DEBUG
```

### 结构化日志

应用使用 structlog 输出结构化日志：

```python
import structlog

logger = structlog.get_logger()

# 记录日志
logger.info("user_created", user_id=user.id, email=user.email)
logger.error("database_error", error=str(e), query=query)
```

日志格式：

```json
{
  "event": "user_created",
  "user_id": 123,
  "email": "user@example.com",
  "timestamp": "2025-12-23T10:30:00Z",
  "level": "info"
}
```

### 日志聚合（可选）

使用 ELK Stack 或 Loki 进行日志聚合：

**Loki + Promtail**：

```yaml
# docker-compose.logging.yml
services:
  loki:
    image: grafana/loki:latest
    ports:
      - "3100:3100"

  promtail:
    image: grafana/promtail:latest
    volumes:
      - /var/log:/var/log
      - ./promtail-config.yml:/etc/promtail/config.yml
```

---

## 🔍 常用查询

### Prometheus 查询

**请求相关**：

```promql
# 总请求速率
sum(rate(http_requests_total[5m]))

# 按路径分组的请求速率
sum(rate(http_requests_total[5m])) by (path)

# 按状态码分组
sum(rate(http_requests_total[5m])) by (status)

# 成功率
sum(rate(http_requests_total{status!~"5.."}[5m])) / sum(rate(http_requests_total[5m]))
```

**响应时间**：

```promql
# P50 响应时间
histogram_quantile(0.50, rate(http_request_duration_seconds_bucket[5m]))

# P95 响应时间
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# P99 响应时间
histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))

# 平均响应时间
rate(http_request_duration_seconds_sum[5m]) / rate(http_request_duration_seconds_count[5m])
```

**数据库**：

```promql
# 当前连接数
pg_stat_database_numbackends

# 查询速率
rate(pg_stat_database_xact_commit[5m])

# 缓存命中率
pg_stat_database_blks_hit / (pg_stat_database_blks_hit + pg_stat_database_blks_read)
```

**系统资源**：

```promql
# CPU 使用率
100 - (avg by (instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)

# 内存使用率
(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100

# 磁盘使用率
(1 - (node_filesystem_avail_bytes / node_filesystem_size_bytes)) * 100
```

### Grafana 查询示例

**请求速率面板**：

```promql
# Query A: 总请求
sum(rate(http_requests_total[5m]))

# Query B: 成功请求
sum(rate(http_requests_total{status!~"5.."}[5m]))

# Query C: 失败请求
sum(rate(http_requests_total{status=~"5.."}[5m]))
```

**响应时间热图**：

```promql
sum(rate(http_request_duration_seconds_bucket[5m])) by (le)
```

---

## 🛠️ 故障排查

### 监控服务无法启动

**检查端口占用**：

```bash
# 检查端口
lsof -i :9090  # Prometheus
lsof -i :3000  # Grafana

# 修改端口（在 docker-compose.monitoring.yml 中）
ports:
  - "19090:9090"  # 使用其他端口
```

### 指标未显示

**检查 Exporter 状态**：

```bash
# 查看 Exporter 日志
docker compose logs postgres-exporter
docker compose logs redis-exporter

# 测试 Exporter 端点
curl http://localhost:9187/metrics  # Postgres
curl http://localhost:9121/metrics  # Redis
```

**检查 Prometheus 配置**：

```bash
# 验证配置文件
docker compose exec prometheus promtool check config /etc/prometheus/prometheus.yml

# 重新加载配置
docker compose exec prometheus kill -HUP 1
```

### Grafana 无法连接 Prometheus

**检查网络**：

```bash
# 进入 Grafana 容器
docker compose exec grafana sh

# 测试连接
wget -O- http://prometheus:9090/api/v1/status/config
```

---

## 📚 相关文档

- [Prometheus 文档](https://prometheus.io/docs/)
- [Grafana 文档](https://grafana.com/docs/)
- [部署文档](DEPLOYMENT.md)
- [故障排查](DEPLOYMENT.md#故障排查)

---

**最后更新**：2025-12-23
