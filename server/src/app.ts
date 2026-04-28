import express, { Application, Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import router from "./app/routes/routes";
import errorHandler from "./app/midddlewares/errorHandler";

dotenv.config();

const app: Application = express();

app.set('trust proxy', 1);

const corsOptions = {
  origin: [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://lost-and-found-liart-seven.vercel.app",
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "authorization",
    "Cache-Control",
    "Pragma",
  ],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // ✅ preflight uses same options

// Increase body size limit to 10mb to support base64 image uploads
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.get("/", (req: Request, res: Response) => {
  res.send({ message: "Welcome to Lost and found services!" });
});

app.use("/api", router);
app.use(errorHandler);

app.use((req: Request, res: Response) => {
  res.status(404).send({
    statusCode: 404,
    success: false,
    message: "Sorry, We can't find that!",
  });
});

export default app;