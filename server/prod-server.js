import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import { createServer as createExpressApp } from "./index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, "..", "dist");

const app = createExpressApp();

app.use(express.static(distDir));
app.get("*", (req, res) => {
  res.sendFile(path.join(distDir, "index.html"));
});

const port = Number(process.env.PORT) || 5000;
app.listen(port, "0.0.0.0", () => {
  console.log(`Servidor de produccion escuchando en el puerto ${port}`);
});
