import { startServer } from "./app.js";

const PORT = process.env.PORT || 4000;

const app = await startServer();

app.listen(PORT, () => {
  console.log(`DTMS API running at http://localhost:${PORT}`);
  console.log(`- Feedback API: http://localhost:${PORT}/api/feedback`);
  console.log(`- Auth API:     http://localhost:${PORT}/api/auth/login`);
  console.log(`- Uploads:      http://localhost:${PORT}/uploads`);
});
