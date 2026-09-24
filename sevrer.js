const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.NEWS_API_KEY;

app.get("/api/news", async (req, res) => {
    try {
        const {
            category = "general",
            page = 1,
            pageSize = 20,
            q = ""
        } = req.query;

        let url;

        if (q) {
            url =
                `https://newsapi.org/v2/everything` +
                `?q=${encodeURIComponent(q)}` +
                `&sortBy=publishedAt` +
                `&page=${page}` +
                `&pageSize=${pageSize}` +
                `&apiKey=${API_KEY}`;
        } else {
            url =
                `https://newsapi.org/v2/top-headlines` +
                `?country=us` +
                `&category=${category}` +
                `&page=${page}` +
                `&pageSize=${pageSize}` +
                `&apiKey=${API_KEY}`;
        }

        const response = await fetch(url);
        const data = await response.json();

        res.json(data);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            status: "error",
            message: "Failed to fetch news"
        });
    }
});

app.listen(PORT, () => {
    console.log(`Backend running on port ${PORT}`);
});