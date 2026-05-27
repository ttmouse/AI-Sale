with open('scenes/scene-12-workbench/index.html') as f:
    c = f.read()

old_start = '    /* Agent 执行日志 - 清晰层次 */'
old_end = '    .tl-agent-confirm { background: #FEF3C7; border-color: #FDE68A; color: #92400E; }'

idx_s = c.find(old_start)
idx_e = c.find(old_end) + len(old_end)

if idx_s < 0 or idx_e <= idx_s:
    # Try alternate start
    old_start = '    /* Agent 执行日志 - 卡片样式 */'
    idx_s = c.find(old_start)
    if idx_s >= 0:
        old_end_search = c.find('.tl-agent-confirm', idx_s)
        if old_end_search > idx_s:
            idx_e = c.find(';', old_end_search) + 1

if idx_s >= 0 and idx_e > idx_s:
    new_block = '''    /* Agent 执行日志 - 卡片样式 */
    .tl-scard { margin: 0.1875rem 0; border-radius: 0.25rem; overflow: hidden; }
    .tl-scard-hd { display: flex; align-items: center; gap: 0.3125rem; padding: 0.25rem 0.5rem; font-size: 0.5625rem; font-weight: 600; background: var(--bg-subtle); }
    .tl-scard-bd { padding: 0.1875rem 0.5rem 0.3125rem 0.5rem; font-size: 0.5625rem; line-height: 1.6; }
    .tl-scard-observe { border-left: 2px solid #3B82F6; }
    .tl-scard-observe .tl-scard-hd { color: #3B82F6; }
    .tl-scard-reason { border-left: 2px solid #8B5CF6; }
    .tl-scard-reason .tl-scard-hd { color: #8B5CF6; }
    .tl-scard-execute { border-left: 2px solid #10B981; }
    .tl-scard-execute .tl-scard-hd { color: #10B981; }
    .tl-agent-icon { display: inline-flex; align-items: center; vertical-align: middle; width: 1rem; height: 1rem; }
    .tl-agent-icon svg { width: 12px; height: 12px; }
    .tl-dur { font-size: 0.4375rem; color: var(--text-muted); opacity: 0.5; margin-left: auto; font-family: "Geist Mono", monospace; white-space: nowrap; }
    .tl-agent-tool { font-family: "SF Mono", "Geist Mono", monospace; font-size: 0.4375rem; color: var(--text-muted); opacity: 0.4; margin-right: 0.25rem; }
    .tl-agent-result { color: var(--text-secondary); word-break: break-word; }
    .tl-prompt { color: var(--text-muted); opacity: 0.6; display: block; font-size: 0.5rem; }
    .tl-running { display: inline-block; animation: tl-pulse 0.8s ease-in-out infinite; font-size: 0.5rem; color: var(--brand); margin-left: 0.25rem; }
    @keyframes tl-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
    .tl-agent-tag { display: inline-block; padding: 0.0625rem 0.3125rem; background: var(--bg-subtle); border: 1px solid var(--border); border-radius: 0.125rem; font-size: 0.5625rem; color: var(--text-secondary); margin: 0.0625rem 0.125rem; }
    .tl-agent-confirm { background: #FEF3C7; border-color: #FDE68A; color: #92400E; }'''
    c = c[:idx_s] + new_block + c[idx_e:]
    with open('scenes/scene-12-workbench/index.html', 'w') as f:
        f.write(c)
    print('Replaced agent log CSS')
else:
    print(f'Not found: s={idx_s}, e={idx_e}')
