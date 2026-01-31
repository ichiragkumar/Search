import express from "express";
import { withTenant, releasePg } from "./middleware/tenant";
import { searchRoute } from "./search/searchRoute";

const app = express();

app.use(withTenant);
app.use(releasePg);

app.use("/search", searchRoute);

app.listen(3000, () => console.log("Listening on :3000"));
