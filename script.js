class NewsApp {
    constructor() {
        this.BASE_URL = "https://news-for-sample.onrender.com/api/news";

        this.state = {
            category: "general",
            page: 1,
            loading: false,
            query: "",
            articles: [],
            totalResults: 0
        };

        this.searchTimer = null;

        this.init();
    }

    init() {
        this.setupTheme();
        this.setupEvents();
        this.loadNews();
    }

    setupTheme() {
        const theme = localStorage.getItem("theme") || "light";

        document.documentElement.setAttribute("data-theme", theme);

        document.getElementById("themeIcon").textContent =
            theme === "dark" ? "☀️" : "🌙";

        document.getElementById("themeToggle").addEventListener("click", () => {

            const current =
                document.documentElement.getAttribute("data-theme");

            const newTheme =
                current === "dark" ? "light" : "dark";

            document.documentElement.setAttribute(
                "data-theme",
                newTheme
            );

            localStorage.setItem("theme", newTheme);

            document.getElementById("themeIcon").textContent =
                newTheme === "dark" ? "☀️" : "🌙";
        });
    }

    setupEvents() {

        document.querySelectorAll(".category-btn").forEach(btn => {

            btn.addEventListener("click", () => {

                this.changeCategory(btn.dataset.category);

            });

        });

        document
            .getElementById("searchInput")
            .addEventListener("input", e => {

                clearTimeout(this.searchTimer);

                this.searchTimer = setTimeout(() => {

                    this.search(e.target.value.trim());

                }, 500);

            });

        window.addEventListener("scroll", () => {

            if (
                window.innerHeight + window.scrollY >=
                document.body.offsetHeight - 1000 &&
                !this.state.loading
            ) {

                if (
                    this.state.articles.length <
                    this.state.totalResults
                ) {

                    this.loadMore();

                }

            }

        });

        document
            .getElementById("scrollTop")
            .addEventListener("click", () => {

                window.scrollTo({
                    top: 0,
                    behavior: "smooth"
                });

            });

    }

    changeCategory(category) {

        if (category === this.state.category) return;

        document
            .querySelectorAll(".category-btn")
            .forEach(btn =>
                btn.classList.remove("active")
            );

        document
            .querySelector(
                [data.category="${category}"]
            )
            .classList.add("active");

        this.resetState({
            category,
            query: ""
        });

        document.getElementById("searchInput").value = "";

        this.loadNews();
    }

    search(query) {

        this.resetState({
            query
        });

        this.loadNews();
    }

    resetState(updates) {

        this.state = {
            ...this.state,
            ...updates,
            page: 1,
            articles: [],
            totalResults: 0
        };

        document.getElementById("newsGrid").innerHTML = "";

    }

    buildUrl() {
        buildUrl()
        {
            const params = new URLSearchParams({
                page: this.state.page,
                pageSize: 20
            });
            if (this.state.query) {
                params.append("q", this.state.query);
            } else {
                params.append("category", this.state.category);
            }
            return `${this.BASE_URL}?${params.toString()}`;
        }
    }

    async loadNews() {

        if (this.state.loading) return;

        this.toggleLoading(true);
        this.hideError();
        this.hideEndMessage();

        try {

            const response = await fetch(this.buildUrl());

            if (!response.ok) {
                throw new Error("Network Error");
            }

            const data = await response.json();

            if (data.status !== "ok") {
                throw new Error(data.message);
            }

            this.state.articles = data.articles;
            this.state.totalResults = data.totalResults;

            this.renderNews(data.articles);

            if (data.articles.length === 0) {
                this.showError("No News Found");
            }

        } catch (error) {

            console.error(error);

            this.showError(
                "Failed to load news. Please try again."
            );

        } finally {

            this.toggleLoading(false);

        }

    }

    async loadMore() {

        if (
            this.state.loading ||
            this.state.articles.length >= this.state.totalResults
        ) {

            this.showEndMessage();
            return;

        }

        this.state.page++;

        this.toggleLoading(true);

        try {

            const response = await fetch(this.buildUrl());

            if (!response.ok) {
                throw new Error("Network Error");
            }

            const data = await response.json();

            if (data.status !== "ok") {
                throw new Error(data.message);
            }

            this.state.articles.push(...data.articles);

            this.renderNews(data.articles, true);

            if (
                this.state.articles.length >=
                this.state.totalResults
            ) {

                this.showEndMessage();

            }

        } catch (error) {

            console.error(error);

            this.state.page--;

        } finally {

            this.toggleLoading(false);
        }
    }
renderNews(articles, append = false) {

        const grid = document.getElementById("newsGrid");

        if (!append) {
            grid.innerHTML = "";
        }

        articles.forEach(article => {

            const card = document.createElement("div");
            card.className = "news-card";

            const image = article.urlToImage
                ? article.urlToImage
                : "images/default-news.jpg";

            const description =
                article.description
                ? article.description.substring(0, 120) + "..."
                : "No description available.";

            const date = new Intl.DateTimeFormat("en-US", {
                day: "numeric",
                month: "short",
                year: "numeric"
            }).format(new Date(article.publishedAt));

            card.innerHTML = `
                <img
                    src="${image}"
                    alt="${article.title}"
                    class="news-image"
                    loading="lazy"
                    onerror="this.src='images/default-news.jpg'"
                >

                <div class="news-content">

                    <h3 class="news-title">
                        ${article.title}
                    </h3>

                    <p class="news-description">
                        ${description}
                    </p>

                    <div class="news-meta">
                        <span>${article.source.name}</span>
                        <span>${date}</span>
                    </div>

                    <div class="news-actions">

                        <a
                            href="${article.url}"
                            target="_blank"
                            class="read-btn">
                            Read More
                        </a>

                        <button class="share-btn">
                            Share
                        </button>

                    </div>

                </div>
            `;

            card.addEventListener("click", (e) => {

                if (
                    e.target.classList.contains("share-btn") ||
                    e.target.classList.contains("read-btn")
                ) return;

                window.open(article.url, "_blank");

            });

            // Share button
            card.querySelector(".share-btn")
                .addEventListener("click", async (e) => {

                    e.stopPropagation();

                    if (navigator.share) {

                        try {

                            await navigator.share({
                                title: article.title,
                                text: article.description || "",
                                url: article.url
                            });

                        } catch (err) {}

                    } else {

                        navigator.clipboard.writeText(article.url);

                        alert("News link copied!");

                    }

                });

            grid.appendChild(card);

        });
    }
showError(message) {
        const error = document.getElementById("error");
        error.textContent = message;
        error.style.display = "block";
    }

    hideError() {
        document.getElementById("error").style.display = "none";
    }

    showEndMessage() {
        document.getElementById("endMessage").style.display = "block";
    }

    hideEndMessage() {
        document.getElementById("endMessage").style.display = "none";
    }

    toggleLoading(show) {
        this.state.loading = show;
        document.getElementById("loading").style.display =
            show ? "flex" : "none";
    }
}

document.addEventListener("DOMContentLoaded", () => {
    new NewsApp();
});
