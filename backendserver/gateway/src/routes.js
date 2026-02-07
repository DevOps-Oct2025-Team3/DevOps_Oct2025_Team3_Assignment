import { createProxyMiddleware } from "http-proxy-middleware";

export default function routes(app) {
  
  // Common error handler for proxies
  const onError = (err, req, res) => {
    console.error(`[Proxy Error] to ${req.path}:`, err.message);
    // Respond to the client so the request doesn't hang
    if (!res.headersSent) {
      res.status(502).json({ error: "Backend service unavailable or connection reset." });
    }
  };

  app.use("/users", createProxyMiddleware({
    target: process.env.USERS_SERVICE_URL || process.env.USER_SERVICE || "http://users:4001",
    changeOrigin: true,
    pathRewrite: { "^/users": "" },
    onError: onError // <--- Add this
  }));

  app.use("/files", createProxyMiddleware({
    target: process.env.FILES_SERVICE_URL || process.env.FILE_SERVICE || "http://files:4002",
    changeOrigin: true,
    pathRewrite: { "^/files": "" },
    onError: onError // <--- Add this
  }));
}