import { createServer as createViteServer } from "vite";
import { createServer as createExpressApp } from "./index.js";

async function start() {
  const app = createExpressApp();

  const vite = await createViteServer({
    server: { middlewareMode: true, host: "0.0.0.0", allowedHosts: true },
    appType: "spa",
  });

  app.use(vite.middlewares);

  const port = 5000;
  app.listen(port, "0.0.0.0", () => {
    console.log(`Servidor de desarrollo escuchando en el puerto ${port}`);
  });
}

start().catch((error) => {
  console.error("No fue posible iniciar el servidor de desarrollo:", error);
  process.exit(1);
});
