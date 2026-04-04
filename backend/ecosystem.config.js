module.exports = {
  apps: [
    {
      name: "crm-api",
      script: "index.js",
      instances: "max", // Let PM2 handle the cluster horizontally across all cores
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
        DISABLE_CLUSTER: "true", // Disable our manual internal cluster since PM2 is handling it
        OUTREACH_WORKER: "false" // Disable WhatsApp/Puppeteer on these nodes
      }
    },
    {
      name: "crm-whatsapp-worker",
      script: "index.js",
      instances: 1, // EXACTLY 1 instance to avoid WhatsApp session logic breaking
      exec_mode: "fork", // Run as a standalone background worker
      env: {
        NODE_ENV: "production",
        DISABLE_CLUSTER: "true", // Run as a standalone script
        OUTREACH_WORKER: "true", // Enable Puppeteer and BullMQ processing
        PORT: 5002 // Run on a dummy port so it doesn't conflict with API nodes
      }
    }
  ]
};
