import express from 'express';
import cors from 'cors';

// ======Creating express app=========
const app = express();

// ===========
app.use(cors());
app.use(express.json());

// ===============
app.get('/', (req, res) => {
  res.json({
    message: 'VIRUS-AI-CHATBOT running',
  });
});

// ============Initialising the server============
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Chatbot API running on http://localhost:${PORT}`);
});
