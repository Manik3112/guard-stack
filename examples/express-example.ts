import express from "express";
import { expressMiddleware } from "guard-stack";

const app = express();
app.use(express.json());

app.use(
  expressMiddleware({
    currentService: "service-b",
    trustedIssuers: {
      "service-a": process.env.SERVICE_A_SECRET ?? "",
    },
  }),
);

app.post("/payments/create", (req, res) => {
  res.json({
    ok: true,
    caller: req.body,
  });
});
