module.exports = {
  apps: [{
    name: 'ai-sale',
    cwd: '/Users/douba/Projects/AI-Sale',
    script: '/opt/homebrew/bin/python3',
    interpreter: 'none',
    args: '-m http.server 45219',
    instances: 1,
    autorestart: true,
    watch: false,
    min_uptime: 10000,
    max_restarts: 10,
    exp_backoff_restart_delay: 1000,
    env: {
      NODE_ENV: 'production',
      PORT: 45219,
      PATH: process.env.PATH || '/usr/local/bin:/usr/bin:/bin:/opt/homebrew/bin',
      HOME: process.env.HOME || '',
    },
    error_file: '/Users/douba/Projects/AI-Sale/logs/ai-sale-error.log',
    out_file: '/Users/douba/Projects/AI-Sale/logs/ai-sale-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    merge_logs: true,
  }]
};
