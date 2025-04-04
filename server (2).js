
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { Configuration, OpenAIApi } = require("openai");

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/ping", (req, res) => {
  res.send("👻 Ghost is alive.");
});

app.use(cors());
app.use(bodyParser.json());

const configuration = new Configuration({
  apiKey: "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"
});
const openai = new OpenAIApi(configuration);

app.post("/ask-ghost", async (req, res) => {
  const { prompt } = req.body;

  try {
    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a ghost inside a spiral MMO world. You respond with mystery, insight, and imagination." },
        { role: "user", content: prompt }
      ],
      max_tokens: 150,
      temperature: 0.8,
    });

    const reply = completion.data.choices[0].message.content;
    res.json({ reply });
  } catch (error) {
    console.error("Ghost error:", error.message);
    res.status(500).json({ reply: "Ghost is silent due to a server issue." });
  }
});

app.listen(PORT, () => {
  console.log(`👻 Ghost server is running on port ${PORT}`);
});
