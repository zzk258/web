/* 由编辑器生成 · 2026-11-06 03:32:58 */

window.SITE = {
  "title": "TechNotes",
  "subtitle": "网络 · 运维",
  "description": "把踩过的坑写成可复用的文档。这里存放网络与运维方向的技术笔记、配置实录和排障过程。",
  "author": "你的名字",
  "email": "",
  "repo": "",
  "startYear": 2026,
  "icp": ""
};

window.CATEGORIES = [
  {
    "id": "network",
    "name": "网络",
    "icon": "network",
    "color": "#3b82f6",
    "desc": "交换路由、协议分析、抓包排障、防火墙与 VPN 的配置实录。"
  },
  {
    "id": "ops",
    "name": "运维",
    "icon": "server",
    "color": "#10b981",
    "desc": "Linux、容器、监控告警、自动化脚本与线上故障复盘。"
  }
];

window.POSTS = [
  {
    "title": "新建test",
    "category": "network",
    "date": "2026-11-03",
    "tags": [
      "网络安全"
    ],
    "excerpt": "网络安全基础诊断",
    "cover": "https://ts3.tc.mm.bing.net/th/id/BSKFP5.4715dcaf0tdh6086951381986043982_AA2gz7Gf_webp?roil=0.0710&roit=0.0213&roir=0.8323&roib=0.4176&pid=wdpv2&w=268&h=140&qlt=90&c=1&rs=1&dpr=1&p=0",
    "id": "note-20261103-fj1r",
    "pinned": false,
    "content": "影响的因素\n查查什么内容\n1\n2\n3\n4\n\n"
  },
  {
    "id": "vlan-inter-routing",
    "title": "VLAN 间路由：三层交换还是单臂路由？",
    "category": "network",
    "date": "2026-11-02",
    "pinned": true,
    "cover": "assets/img/sample-topology.svg",
    "tags": [
      "VLAN",
      "三层交换",
      "组网"
    ],
    "excerpt": "接入层做完 VLAN 隔离，跨网段通信就必须有网关。两种常见落地方式各有取舍，这篇把选型依据、配置片段和踩过的坑一次说清。",
    "content": "## 背景\n\n接入层做完 VLAN 隔离之后，跨 VLAN 通信必须经过网关。工程上有两种常见落地方式：\n\n- **单臂路由**：路由器用一个物理口跑多个子接口，靠 802.1Q 封装充当各 VLAN 的网关\n- **三层交换（SVI）**：在核心/汇聚交换机上直接起 VLAN 虚接口，网关落在交换机上\n\n> 一句话结论：东西向流量占主导时选 SVI；规模很小、或者必须让流量经过防火墙时，才考虑单臂路由。\n\n## 组网示意\n\n![VLAN 三层交换组网示意](assets/img/sample-topology.svg)\n\n## 两者对比\n\n| 维度 | 单臂路由 | 三层交换（SVI） |\n| --- | --- | --- |\n| 转发路径 | 全部绕行上联链路 | 交换机内部本地转发 |\n| 带宽瓶颈 | 明显，上联口是单点 | 基本不存在 |\n| 配置复杂度 | 低，几行搞定 | 中，需要规划 VLAN 与 SVI |\n| 适用规模 | 50 台终端以内 | 任意规模 |\n| 故障域 | 路由器单点 | 影响面分散 |\n\n## 三层交换配置（华为 / H3C 风格）\n\n~~~bash\nvlan batch 10 20\n\ninterface Vlanif10\n ip address 192.168.10.1 255.255.255.0\ninterface Vlanif20\n ip address 192.168.20.1 255.255.255.0\n\ninterface GigabitEthernet0/0/1\n port link-type trunk\n port trunk allow-pass vlan 10 20\n\n# 终端侧接入口\ninterface GigabitEthernet0/0/2\n port link-type access\n port default vlan 10\n~~~\n\n## 单臂路由配置（Cisco 风格）\n\n~~~bash\ninterface GigabitEthernet0/0\n no shutdown\n\ninterface GigabitEthernet0/0.10\n encapsulation dot1Q 10\n ip address 192.168.10.1 255.255.255.0\n\ninterface GigabitEthernet0/0.20\n encapsulation dot1Q 20\n ip address 192.168.20.1 255.255.255.0\n~~~\n\n## 踩过的坑\n\n1. **子接口必须先 up 父接口**。父接口是 shutdown 状态时，子接口永远起不来，日志里也不会有明显报错。\n2. **trunk 两端 native vlan 不一致**，管理地址会时通时断，看起来像\"网络抖动\"，实际是二层错配。\n3. **SVI up 了但 ping 不通网关**，先看 `display arp` 有没有学到终端条目，再看终端的掩码和网关是否配错。\n4. 单臂路由场景下，路由器上联口建议手工限速并观察队列丢包，高峰期很容易被单点带宽吃掉。\n\n## 小结\n\n新项目直接上三层交换，别给自己留债。单臂路由留给临时联调、实验室和小办公室——它能用，但不要当生产主力。\n"
  },
  {
    "id": "tcpdump-retrans",
    "title": "用 tcpdump 定位一次 TCP 重传风暴",
    "category": "network",
    "date": "2026-10-28",
    "cover": "",
    "tags": [
      "tcpdump",
      "抓包",
      "TCP"
    ],
    "excerpt": "接口 P99 从 120ms 涨到 2.4s，服务端资源却一切正常。从一次抓包开始，用重传率和 RTT 抖动把问题锁死在链路上。",
    "content": "## 现象\n\n业务方反馈某 HTTPS 接口在高峰期偶发超时。监控显示：\n\n- 服务端 CPU 稳定在 30% 以下\n- 连接数正常，没有堆积\n- 但客户端侧 P99 从 120ms 涨到 2.4s，且集中在少数节点\n\n## 抓包\n\n在服务端抓 60 秒全量包，量级可控（约 400MB）：\n\n~~~bash\ntcpdump -i eth0 -w /tmp/cap.pcap -s 0 -n 'tcp port 8443' &\nPID=$!\nsleep 60\nkill $PID\n~~~\n\n用 tshark 做统计，先看每秒重传数：\n\n~~~bash\ntshark -r /tmp/cap.pcap -q \\\n  -z io,stat,1,\"COUNT(tcp.analysis.retransmission)tcp.analysis.retransmission\"\n~~~\n\n再看重传与总包的比例：\n\n~~~bash\ntshark -r /tmp/cap.pcap -Y \"tcp.analysis.retransmission\" | wc -l\ntshark -r /tmp/cap.pcap -Y \"tcp\" | wc -l\n~~~\n\n## 结论\n\n| 指标 | 实测 | 健康区间 | 判断 |\n| --- | --- | --- | --- |\n| 重传率 | 3.8% | < 1% | 偏高 |\n| 平均 RTT | 42ms | 5ms | 异常 |\n| RTT 抖动 | 5ms 到 480ms | < 20ms | 链路拥塞 |\n| 零窗口 | 0 次 | 0 | 排除应用层 |\n\nRTT 出现规律性锯齿，说明中间链路存在队列积压。最终定位到两台核心之间的聚合链路只有一条成员口在工作，另一条因为光模块收光功率过低被踢出——带宽直接掉一半。\n\n## 可复用的排查顺序\n\n1. 先确认是**应用慢**还是**传输慢**：看零窗口、看服务端处理耗时\n2. 再看**重传率**：超过 1% 就该查链路\n3. 再看**RTT 抖动**：抖动大基本等于队列拥塞\n4. 最后看**物理层**：光功率、CRC 错包、双工模式\n\n~~~bash\n# 物理层自查\nethtool eth0\nethtool -S eth0 | grep -Ei 'err|drop|crc'\n~~~\n\n> 经验：重传率高但 RTT 平稳 → 大概率丢包（链路/网卡）；重传率高且 RTT 抖动 → 拥塞（带宽/队列）。\n"
  },
  {
    "id": "prometheus-alert",
    "title": "从 0 搭一条 Prometheus 告警链路",
    "category": "ops",
    "date": "2026-10-20",
    "cover": "",
    "tags": [
      "Prometheus",
      "监控",
      "告警"
    ],
    "excerpt": "采集、规则、路由、静默，四段拼成一条能用的告警链路。附上几条真正能减少半夜被叫醒的告警规则。",
    "content": "## 链路全貌\n\n一条告警从产生到送达，要经过四个环节，任何一环缺失都会让告警变成噪音：\n\n1. **采集**：node_exporter / mysqld_exporter 暴露指标\n2. **规则**：Prometheus 按 interval 计算 recording rule 与 alerting rule\n3. **路由**：Alertmanager 按 label 分组、抑制、静默\n4. **送达**：企微机器人 / 邮件 / 短信\n\n## 采集配置\n\n~~~yaml\nscrape_configs:\n  - job_name: node\n    scrape_interval: 15s\n    static_configs:\n      - targets:\n          - 10.0.0.11:9100\n          - 10.0.0.12:9100\n        labels:\n          env: prod\n          role: web\n~~~\n\n## 告警规则\n\n只写\"业务会痛\"的规则，别把 CPU 80% 当故障：\n\n~~~yaml\ngroups:\n  - name: node-basic\n    rules:\n      - alert: NodeDiskWillFull\n        expr: |\n          (node_filesystem_avail_bytes{fstype!~\"tmpfs|overlay\"}\n           / node_filesystem_size_bytes{fstype!~\"tmpfs|overlay\"}) < 0.12\n        for: 10m\n        labels:\n          severity: warning\n        annotations:\n          summary: \"{{ $labels.instance }} 磁盘剩余不足 12%\"\n          description: \"挂载点 {{ $labels.mountpoint }}，当前剩余 {{ $value | humanizePercentage }}\"\n\n      - alert: InstanceDown\n        expr: up == 0\n        for: 3m\n        labels:\n          severity: critical\n        annotations:\n          summary: \"{{ $labels.instance }} 采集失败超过 3 分钟\"\n~~~\n\n## 路由与分组\n\n~~~yaml\nroute:\n  receiver: wecom\n  group_by: [alertname, env]\n  group_wait: 30s\n  group_interval: 5m\n  repeat_interval: 4h\n\ninhibit_rules:\n  - source_matchers: [severity=\"critical\"]\n    target_matchers: [severity=\"warning\"]\n    equal: [instance]\n~~~\n\n**group_wait 30s** 是关键：给同一批告警一个聚合窗口，避免\"机房掉电\"时手机被 200 条通知打爆。\n\n## 三条经验\n\n- `for` 一定要写。瞬时尖刺不该唤醒任何人。\n- 抑制规则比静默更可靠。静默靠人记得解除，抑制靠 label 自动生效。\n- 告警必须可执行。收到通知后 5 分钟内不知道该做什么的告警，删掉。\n"
  },
  {
    "id": "nginx-502",
    "title": "Nginx 502 排查清单（按命中率排序）",
    "category": "ops",
    "date": "2026-10-11",
    "cover": "",
    "tags": [
      "Nginx",
      "排障",
      "故障复盘"
    ],
    "excerpt": "502 只说明上游没给出合法响应，原因可能在上游、在连接、也在超时配置。这份清单按命中率从高到低排，照着走一遍基本能收敛。",
    "content": "## 先明确一件事\n\n502 = Nginx 收到上游的**非法响应**或**连接被重置**。它不告诉你原因，只看得到\"上游有问题\"。\n\n第一个动作永远是看 error.log，而不是重启：\n\n~~~bash\ntail -n 200 /var/log/nginx/error.log\n~~~\n\n日志里出现的措辞直接对应不同方向：\n\n| error.log 关键字 | 大致方向 |\n| --- | --- |\n| connect() failed (111: Connection refused) | 上游进程没起来 / 端口错 |\n| upstream prematurely closed connection | 上游主动断开，多半是超时或崩溃 |\n| no live upstreams | 健康检查全挂 |\n| recv() failed (104: Connection reset by peer) | 上游处理中断，常见 OOM |\n| upstream timed out | 处理时间超过 proxy_read_timeout |\n\n## 排查顺序\n\n1. **上游进程是否存活**：`systemctl status`、`ss -lntp | grep 8080`\n2. **上游是否 OOM**：`dmesg -T | grep -i 'killed process'`\n3. **超时是否够**：默认 `proxy_read_timeout 60s`，慢接口很容易踩线\n4. **backlog 是否溢出**：`netstat -s | grep -i listen`，有 overflow 就调 `net.core.somaxconn`\n5. **keepalive 是否配了对**：Nginx 侧 `proxy_http_version 1.1` + `proxy_set_header Connection \"\"`，上游也要开 keepalive\n\n## 一份稳妥的代理配置\n\n~~~bash\nupstream app {\n    server 127.0.0.1:8080 max_fails=3 fail_timeout=10s;\n    keepalive 32;\n}\n\nlocation / {\n    proxy_pass http://app;\n    proxy_http_version 1.1;\n    proxy_set_header Connection \"\";\n    proxy_set_header Host $host;\n    proxy_set_header X-Real-IP $remote_addr;\n\n    proxy_connect_timeout 3s;\n    proxy_send_timeout 30s;\n    proxy_read_timeout 60s;\n    proxy_next_upstream error timeout http_502;\n}\n~~~\n\n> 注意：`proxy_next_upstream` 只对**幂等**请求安全。POST 接口打开重试前先确认业务能否接受重复提交。\n\n## 复盘\n\n那次故障的根因是上游 JVM 堆太小，Full GC 期间线程挂起超过 60 秒，Nginx 判定超时后断开，用户看到 502。修复动作不是调大超时，而是把堆从 2G 调到 4G，并把一个全表扫描的定时任务挪到低峰期。\n\n**调超时是止痛药，不是解药。**\n"
  },
  {
    "id": "systemd-timer",
    "title": "用 systemd timer 替代 crontab 的五个理由",
    "category": "ops",
    "date": "2026-09-29",
    "cover": "",
    "tags": [
      "systemd",
      "自动化",
      "Linux"
    ],
    "excerpt": "crontab 能跑，但跑得糊。日志去哪了、失败了谁知道、机器关机期间错过的任务怎么办——systemd timer 把这些都答了。",
    "content": "## 为什么不满足于 crontab\n\ncrontab 的问题不是语法，而是**可观测性**：\n\n- 输出默认发本地邮件，大多数机器上根本没人看\n- 没有失败重试，没有超时保护\n- 机器关机期间错过的任务，开机后不会补跑\n- 排错只能靠自己在脚本里加日志\n\n## 五个理由\n\n1. **日志进 journal**：`journalctl -u backup.service` 直接看，不用自己重定向\n2. **失败可视**：`systemctl --failed` 一眼看到谁挂了\n3. **错过补跑**：`Persistent=true`，关机期间错过的会在开机后执行一次\n4. **资源与超时约束**：`RuntimeMaxSec`、`Nice`、`MemoryMax` 都能声明\n5. **依赖明确**：`After=network-online.target` 比 `sleep 30` 靠谱得多\n\n## 示例：每天 3:10 备份\n\n**/etc/systemd/system/backup.service**\n\n~~~bash\n[Unit]\nDescription=Nightly database backup\nAfter=network-online.target\nWants=network-online.target\n\n[Service]\nType=oneshot\nExecStart=/usr/local/bin/backup.sh\nUser=ops\nNice=10\nRuntimeMaxSec=3600\nStandardOutput=journal\nStandardError=journal\n~~~\n\n**/etc/systemd/system/backup.timer**\n\n~~~bash\n[Unit]\nDescription=Run backup daily at 03:10\n\n[Timer]\nOnCalendar=*-*-* 03:10:00\nPersistent=true\nRandomizedDelaySec=300\nUnit=backup.service\n\n[Install]\nWantedBy=timers.target\n~~~\n\n启用与验证：\n\n~~~bash\nsystemctl daemon-reload\nsystemctl enable --now backup.timer\nsystemctl list-timers --all\nsystemctl start backup.service   # 先手动跑一次验证\njournalctl -u backup.service -n 50 --no-pager\n~~~\n\n## 迁移建议\n\n不必一次性全量迁移。先把**重要且曾经悄悄失败过**的定时任务搬过来，跑稳定之后再处理剩下的。\n\n> `RandomizedDelaySec` 很值得加：避免几十台机器在同一秒集体打数据库。\n"
  },
{
  "title": "新建test",
  "category": "network",
  "date": "2026-11-03",
  "tags": [
    "网络安全"
  ],
  "excerpt": "网络安全基础诊断",
  "cover": "https://ts3.tc.mm.bing.net/th/id/BSKFP5.4715dcaf0tdh6086951381986043982_AA2gz7Gf_webp?roil=0.0710&roit=0.0213&roir=0.8323&roib=0.4176&pid=wdpv2&w=268&h=140&qlt=90&c=1&rs=1&dpr=1&p=0",
  "id": "note-20261103-fj1r",
  "pinned": false,
  "content": "影响的因素\n查查什么内容\n1\n2\n3\n4\n\n"
}
];


