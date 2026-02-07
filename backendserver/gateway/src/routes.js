  import { createProxyMiddleware } from "http-proxy-middleware";

  export default function routes(app) {
  app.use("/users", createProxyMiddleware({
    target: process.env.USER_SERVICE || "http://users:4001",
    changeOrigin: true,
    pathRewrite: { "^/users": "" }
  }));

  app.use("/files", createProxyMiddleware({
    target: process.env.FILE_SERVICE || "http://files:4002",
    changeOrigin: true,
    pathRewrite: { "^/files": "" }
  }));
}
