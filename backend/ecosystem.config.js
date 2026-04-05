module.exports = {
  apps: [
    {
      name: "crm-api",
      script: "index.js",
      instances: "max",       // Use all CPU cores
      exec_mode: "cluster",
      watch: false,           // Never watch files in production
      max_memory_restart: "2G", // Restart if API nodes exceed 2GB
      env: {
        NODE_ENV: "production",
        DISABLE_CLUSTER: "true",  // PM2 handles clustering
        OUTREACH_WORKER: "false"  // API-only nodes
      },
      // Log management
      out_file: "./logs/api-out.log",
      error_file: "./logs/api-error.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true
    },
    {
      name: "crm-whatsapp-worker",
      script: "index.js",
      instances: 1,           // MUST be 1 — Baileys sessions are not cluster-safe
      exec_mode: "fork",
      watch: false,
      max_memory_restart: "1500M", // 🛡️ Restart if WhatsApp worker leaks RAM past 1.5GB
      env: {
        NODE_ENV: "production",
        DISABLE_CLUSTER: "true",
        OUTREACH_WORKER: "true",  // Enables BullMQ + Baileys
        PORT: 5002
      },
      // Log management
      out_file: "./logs/whatsapp-out.log",
      error_file: "./logs/whatsapp-error.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true
    }
  ]
};
