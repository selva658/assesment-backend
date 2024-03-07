const express = require("express");

const bodyParser = require('body-parser');

const end_point = require("./crudop/routes");

const app = express();

app.use(express.json());

app.use(bodyParser.urlencoded({ extended: true }));

app.use(bodyParser.json());

app.use("/", end_point);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
