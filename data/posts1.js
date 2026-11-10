/* ==========================================================================
   TechNotes · 全站数据
   --------------------------------------------------------------------------
   这个文件就是整个博客的"数据库"。所有内容都写在这里，改完 push 就生效。

   1) SITE       —— 站点信息（标题、作者、仓库地址）
   2) CATEGORIES —— 版块列表。想加新版块，往数组里加一项即可，导航和卡片会自动出现
   3) POSTS      —— 日志列表。想加新日志，往数组里加一个对象即可

   正文 content 使用 Markdown 语法：
     ## 标题   **加粗**   - 列表   > 引用   | 表格 |   [链接](url)   ![图](路径)
     代码块用三个反引号或三个波浪号包裹（~~~bash ... ~~~）

   不想手写？直接打开 editor.html 用可视化编辑器生成。
   ========================================================================== */

window.SITE = {
  title: "TechNotes",
  subtitle: "网络 · 运维",
  description: "把踩过的坑写成可复用的文档。这里存放网络与运维方向的技术笔记、配置实录和排障过程。",
  author: "你的名字",
  email: "",
  repo: "",            // 例如 "yourname/technotes"，填了之后页脚会显示 GitHub 入口
  startYear: 2026,
  icp: ""              // 备案号（如需）
};

/* --------------------------------------------------------------------------
   版块配置
   id 用英文小写（会出现在 URL 里），color 决定该版块的强调色
   -------------------------------------------------------------------------- */
window.CATEGORIES = [
  {
    id: "network",
    name: "网络",
    icon: "network",
    color: "#3b82f6",
    desc: "交换路由、协议分析、抓包排障、防火墙与 VPN 的配置实录。"
  },
  {
    id: "ops",
    name: "运维",
    icon: "server",
    color: "#10b981",
    desc: "Linux、容器、监控告警、自动化脚本与线上故障复盘。"
  }
];

/* --------------------------------------------------------------------------
   日志数据
   -------------------------------------------------------------------------- */
window.POSTS = [
  {
    id: "vlan-inter-routing",
    title: "VLAN 间路由：三层交换还是单臂路由？",
    category: "network",
    date: "2026-11-02",
    pinned: true,
    cover: "assets/img/sample-topology.svg",
    tags: ["VLAN", "三层交换", "组网"],
    excerpt: "接入层做完 VLAN 隔离，跨网段通信就必须有网关。两种常见落地方式各有取舍，这篇把选型依据、配置片段和踩过的坑一次说清。",
    content: `## 背景

接入层做完 VLAN 隔离之后，跨 VLAN 通信必须经过网关。工程上有两种常见落地方式：

- **单臂路由**：路由器用一个物理口跑多个子接口，靠 802.1Q 封装充当各 VLAN 的网关
- **三层交换（SVI）**：在核心/汇聚交换机上直接起 VLAN 虚接口，网关落在交换机上

> 一句话结论：东西向流量占主导时选 SVI；规模很小、或者必须让流量经过防火墙时，才考虑单臂路由。

## 组网示意

![VLAN 三层交换组网示意](assets/img/sample-topology.svg)

## 两者对比

| 维度 | 单臂路由 | 三层交换（SVI） |
| --- | --- | --- |
| 转发路径 | 全部绕行上联链路 | 交换机内部本地转发 |
| 带宽瓶颈 | 明显，上联口是单点 | 基本不存在 |
| 配置复杂度 | 低，几行搞定 | 中，需要规划 VLAN 与 SVI |
| 适用规模 | 50 台终端以内 | 任意规模 |
| 故障域 | 路由器单点 | 影响面分散 |

## 三层交换配置（华为 / H3C 风格）

~~~bash
vlan batch 10 20

interface Vlanif10
 ip address 192.168.10.1 255.255.255.0
interface Vlanif20
 ip address 192.168.20.1 255.255.255.0

interface GigabitEthernet0/0/1
 port link-type trunk
 port trunk allow-pass vlan 10 20

# 终端侧接入口
interface GigabitEthernet0/0/2
 port link-type access
 port default vlan 10
~~~

## 单臂路由配置（Cisco 风格）

~~~bash
interface GigabitEthernet0/0
 no shutdown

interface GigabitEthernet0/0.10
 encapsulation dot1Q 10
 ip address 192.168.10.1 255.255.255.0

interface GigabitEthernet0/0.20
 encapsulation dot1Q 20
 ip address 192.168.20.1 255.255.255.0
~~~

## 踩过的坑

1. **子接口必须先 up 父接口**。父接口是 shutdown 状态时，子接口永远起不来，日志里也不会有明显报错。
2. **trunk 两端 native vlan 不一致**，管理地址会时通时断，看起来像"网络抖动"，实际是二层错配。
3. **SVI up 了但 ping 不通网关**，先看 \`display arp\` 有没有学到终端条目，再看终端的掩码和网关是否配错。
4. 单臂路由场景下，路由器上联口建议手工限速并观察队列丢包，高峰期很容易被单点带宽吃掉。

## 小结

新项目直接上三层交换，别给自己留债。单臂路由留给临时联调、实验室和小办公室——它能用，但不要当生产主力。
`
  },
  {
    id: "tcpdump-retrans",
    title: "用 tcpdump 定位一次 TCP 重传风暴",
    category: "network",
    date: "2026-10-28",
    cover: "",
    tags: ["tcpdump", "抓包", "TCP"],
    excerpt: "接口 P99 从 120ms 涨到 2.4s，服务端资源却一切正常。从一次抓包开始，用重传率和 RTT 抖动把问题锁死在链路上。",
    content: `## 现象

业务方反馈某 HTTPS 接口在高峰期偶发超时。监控显示：

- 服务端 CPU 稳定在 30% 以下
- 连接数正常，没有堆积
- 但客户端侧 P99 从 120ms 涨到 2.4s，且集中在少数节点

## 抓包

在服务端抓 60 秒全量包，量级可控（约 400MB）：

~~~bash
tcpdump -i eth0 -w /tmp/cap.pcap -s 0 -n 'tcp port 8443' &
PID=$!
sleep 60
kill $PID
~~~

用 tshark 做统计，先看每秒重传数：

~~~bash
tshark -r /tmp/cap.pcap -q \\
  -z io,stat,1,"COUNT(tcp.analysis.retransmission)tcp.analysis.retransmission"
~~~

再看重传与总包的比例：

~~~bash
tshark -r /tmp/cap.pcap -Y "tcp.analysis.retransmission" | wc -l
tshark -r /tmp/cap.pcap -Y "tcp" | wc -l
~~~

## 结论

| 指标 | 实测 | 健康区间 | 判断 |
| --- | --- | --- | --- |
| 重传率 | 3.8% | < 1% | 偏高 |
| 平均 RTT | 42ms | 5ms | 异常 |
| RTT 抖动 | 5ms 到 480ms | < 20ms | 链路拥塞 |
| 零窗口 | 0 次 | 0 | 排除应用层 |

RTT 出现规律性锯齿，说明中间链路存在队列积压。最终定位到两台核心之间的聚合链路只有一条成员口在工作，另一条因为光模块收光功率过低被踢出——带宽直接掉一半。

## 可复用的排查顺序

1. 先确认是**应用慢**还是**传输慢**：看零窗口、看服务端处理耗时
2. 再看**重传率**：超过 1% 就该查链路
3. 再看**RTT 抖动**：抖动大基本等于队列拥塞
4. 最后看**物理层**：光功率、CRC 错包、双工模式

~~~bash
# 物理层自查
ethtool eth0
ethtool -S eth0 | grep -Ei 'err|drop|crc'
~~~

> 经验：重传率高但 RTT 平稳 → 大概率丢包（链路/网卡）；重传率高且 RTT 抖动 → 拥塞（带宽/队列）。
`
  },
  {
    id: "prometheus-alert",
    title: "从 0 搭一条 Prometheus 告警链路",
    category: "ops",
    date: "2026-10-20",
    cover: "",
    tags: ["Prometheus", "监控", "告警"],
    excerpt: "采集、规则、路由、静默，四段拼成一条能用的告警链路。附上几条真正能减少半夜被叫醒的告警规则。",
    content: `## 链路全貌

一条告警从产生到送达，要经过四个环节，任何一环缺失都会让告警变成噪音：

1. **采集**：node_exporter / mysqld_exporter 暴露指标
2. **规则**：Prometheus 按 interval 计算 recording rule 与 alerting rule
3. **路由**：Alertmanager 按 label 分组、抑制、静默
4. **送达**：企微机器人 / 邮件 / 短信

## 采集配置

~~~yaml
scrape_configs:
  - job_name: node
    scrape_interval: 15s
    static_configs:
      - targets:
          - 10.0.0.11:9100
          - 10.0.0.12:9100
        labels:
          env: prod
          role: web
~~~

## 告警规则

只写"业务会痛"的规则，别把 CPU 80% 当故障：

~~~yaml
groups:
  - name: node-basic
    rules:
      - alert: NodeDiskWillFull
        expr: |
          (node_filesystem_avail_bytes{fstype!~"tmpfs|overlay"}
           / node_filesystem_size_bytes{fstype!~"tmpfs|overlay"}) < 0.12
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "{{ $labels.instance }} 磁盘剩余不足 12%"
          description: "挂载点 {{ $labels.mountpoint }}，当前剩余 {{ $value | humanizePercentage }}"

      - alert: InstanceDown
        expr: up == 0
        for: 3m
        labels:
          severity: critical
        annotations:
          summary: "{{ $labels.instance }} 采集失败超过 3 分钟"
~~~

## 路由与分组

~~~yaml
route:
  receiver: wecom
  group_by: [alertname, env]
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 4h

inhibit_rules:
  - source_matchers: [severity="critical"]
    target_matchers: [severity="warning"]
    equal: [instance]
~~~

**group_wait 30s** 是关键：给同一批告警一个聚合窗口，避免"机房掉电"时手机被 200 条通知打爆。

## 三条经验

- \`for\` 一定要写。瞬时尖刺不该唤醒任何人。
- 抑制规则比静默更可靠。静默靠人记得解除，抑制靠 label 自动生效。
- 告警必须可执行。收到通知后 5 分钟内不知道该做什么的告警，删掉。
`
  },
  {
    id: "nginx-502",
    title: "Nginx 502 排查清单（按命中率排序）",
    category: "ops",
    date: "2026-10-11",
    cover: "",
    tags: ["Nginx", "排障", "故障复盘"],
    excerpt: "502 只说明上游没给出合法响应，原因可能在上游、在连接、也在超时配置。这份清单按命中率从高到低排，照着走一遍基本能收敛。",
    content: `## 先明确一件事

502 = Nginx 收到上游的**非法响应**或**连接被重置**。它不告诉你原因，只看得到"上游有问题"。

第一个动作永远是看 error.log，而不是重启：

~~~bash
tail -n 200 /var/log/nginx/error.log
~~~

日志里出现的措辞直接对应不同方向：

| error.log 关键字 | 大致方向 |
| --- | --- |
| connect() failed (111: Connection refused) | 上游进程没起来 / 端口错 |
| upstream prematurely closed connection | 上游主动断开，多半是超时或崩溃 |
| no live upstreams | 健康检查全挂 |
| recv() failed (104: Connection reset by peer) | 上游处理中断，常见 OOM |
| upstream timed out | 处理时间超过 proxy_read_timeout |

## 排查顺序

1. **上游进程是否存活**：\`systemctl status\`、\`ss -lntp | grep 8080\`
2. **上游是否 OOM**：\`dmesg -T | grep -i 'killed process'\`
3. **超时是否够**：默认 \`proxy_read_timeout 60s\`，慢接口很容易踩线
4. **backlog 是否溢出**：\`netstat -s | grep -i listen\`，有 overflow 就调 \`net.core.somaxconn\`
5. **keepalive 是否配了对**：Nginx 侧 \`proxy_http_version 1.1\` + \`proxy_set_header Connection ""\`，上游也要开 keepalive

## 一份稳妥的代理配置

~~~bash
upstream app {
    server 127.0.0.1:8080 max_fails=3 fail_timeout=10s;
    keepalive 32;
}

location / {
    proxy_pass http://app;
    proxy_http_version 1.1;
    proxy_set_header Connection "";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;

    proxy_connect_timeout 3s;
    proxy_send_timeout 30s;
    proxy_read_timeout 60s;
    proxy_next_upstream error timeout http_502;
}
~~~

> 注意：\`proxy_next_upstream\` 只对**幂等**请求安全。POST 接口打开重试前先确认业务能否接受重复提交。

## 复盘

那次故障的根因是上游 JVM 堆太小，Full GC 期间线程挂起超过 60 秒，Nginx 判定超时后断开，用户看到 502。修复动作不是调大超时，而是把堆从 2G 调到 4G，并把一个全表扫描的定时任务挪到低峰期。

**调超时是止痛药，不是解药。**
`
  },
  {
    id: "systemd-timer",
    title: "用 systemd timer 替代 crontab 的五个理由",
    category: "ops",
    date: "2026-09-29",
    cover: "",
    tags: ["systemd", "自动化", "Linux"],
    excerpt: "crontab 能跑，但跑得糊。日志去哪了、失败了谁知道、机器关机期间错过的任务怎么办——systemd timer 把这些都答了。",
    content: `## 为什么不满足于 crontab

crontab 的问题不是语法，而是**可观测性**：

- 输出默认发本地邮件，大多数机器上根本没人看
- 没有失败重试，没有超时保护
- 机器关机期间错过的任务，开机后不会补跑
- 排错只能靠自己在脚本里加日志

## 五个理由

1. **日志进 journal**：\`journalctl -u backup.service\` 直接看，不用自己重定向
2. **失败可视**：\`systemctl --failed\` 一眼看到谁挂了
3. **错过补跑**：\`Persistent=true\`，关机期间错过的会在开机后执行一次
4. **资源与超时约束**：\`RuntimeMaxSec\`、\`Nice\`、\`MemoryMax\` 都能声明
5. **依赖明确**：\`After=network-online.target\` 比 \`sleep 30\` 靠谱得多

## 示例：每天 3:10 备份

**/etc/systemd/system/backup.service**

~~~bash
[Unit]
Description=Nightly database backup
After=network-online.target
Wants=network-online.target

[Service]
Type=oneshot
ExecStart=/usr/local/bin/backup.sh
User=ops
Nice=10
RuntimeMaxSec=3600
StandardOutput=journal
StandardError=journal
~~~

**/etc/systemd/system/backup.timer**

~~~bash
[Unit]
Description=Run backup daily at 03:10

[Timer]
OnCalendar=*-*-* 03:10:00
Persistent=true
RandomizedDelaySec=300
Unit=backup.service

[Install]
WantedBy=timers.target
~~~

启用与验证：

~~~bash
systemctl daemon-reload
systemctl enable --now backup.timer
systemctl list-timers --all
systemctl start backup.service   # 先手动跑一次验证
journalctl -u backup.service -n 50 --no-pager
~~~

## 迁移建议

不必一次性全量迁移。先把**重要且曾经悄悄失败过**的定时任务搬过来，跑稳定之后再处理剩下的。

> \`RandomizedDelaySec\` 很值得加：避免几十台机器在同一秒集体打数据库。
`
  }
];
