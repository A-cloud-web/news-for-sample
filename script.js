class NewsApp 
{
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

        const themeIcon = document.getElementById("themeIcon");
        const themeToggle = document.getElementById("themeToggle");

        if (themeIcon) {
            themeIcon.textContent = theme === "dark" ? "☀️" : "🌙";
        }

        if (themeToggle) {
            themeToggle.addEventListener("click", () => {
                const current =
                    document.documentElement.getAttribute("data-theme");

                const newTheme =
                    current === "dark" ? "light" : "dark";

                document.documentElement.setAttribute(
                    "data-theme",
                    newTheme
                );

                localStorage.setItem("theme", newTheme);

                if (themeIcon) {
                    themeIcon.textContent =
                        newTheme === "dark" ? "☀️" : "🌙";
                }
            });
        }
    }

    setupEvents() {
        document.querySelectorAll(".category-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                this.changeCategory(btn.dataset.category);
            });
        });

        const searchInput = document.getElementById("searchInput");

        if (searchInput) {
            searchInput.addEventListener("input", e => {
                clearTimeout(this.searchTimer);

                this.searchTimer = setTimeout(() => {
                    this.search(e.target.value.trim());
                }, 500);
            });
        }

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

        const scrollTop = document.getElementById("scrollTop");

        if (scrollTop) {
            scrollTop.addEventListener("click", () => {
                window.scrollTo({
                    top: 0,
                    behavior: "smooth"
                });
            });
        }
    }

    changeCategory(category) {
        if (category === this.state.category) return;

        document
            .querySelectorAll(".category-btn")
            .forEach(btn => btn.classList.remove("active"));

        const selectedButton = document.querySelector(
            `[data-category="${category}"]`
        );

        if (selectedButton) {
            selectedButton.classList.add("active");
        }

        this.resetState({
            category,
            query: ""
        });

        const searchInput = document.getElementById("searchInput");

        if (searchInput) {
            searchInput.value = "";
        }

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

        const grid = document.getElementById("newsGrid");

        if (grid) {
            grid.innerHTML = "";
        }
    }

    buildUrl() {
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

    async loadNews() {
        if (this.state.loading) return;

        this.toggleLoading(true);
        this.hideError();
        this.hideEndMessage();

        try {
            const url = this.buildUrl();

            console.log("Fetching news from:", url);

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(
                    `HTTP Error: ${response.status}`
                );
            }

            const data = await response.json();

            console.log("News API response:", data);

            if (!data || !Array.isArray(data.articles)) {
                throw new Error("Invalid news data");
            }

            this.state.articles = data.articles;

            this.state.totalResults =
                data.totalResults || data.articles.length;

            this.renderNews(data.articles);

            if (data.articles.length === 0) {
                this.showError("No News Found");
            }

        } catch (error) {
            console.error("News API Error:", error);

            this.showError(
             "Failed to load news. Please try again."
            );
        } finally {
    this.toggleLoading(false);
    }

    asyncloadMore()
    {
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
                throw new Error(
                    `HTTP Error: ${response.status}`
                );
            }

            const data = await response.json();

            if (!data || !Array.isArray(data.articles)) {
                throw new Error("Invalid news data");
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
            console.error("Load More Error:", error);

            this.state.page--;
        } finally {
            this.toggleLoading(false);
        }
    }

    renderNews(articles, append = false) 
    {
        const grid = document.getElementById("newsGrid");

        if (!grid) return;

        if (!append) {
            grid.innerHTML = "";
        }

        articles.forEach(article => {
            const card = document.createElement("div");

            card.className = "news-card";

            const image = article.urlToImage
                ? article.urlToImage
                : "images/default-news.jpg";

            const description = article.description
                ? article.description.substring(0, 120) + "..."
                : "No description available.";

            const date = article.publishedAt
                ? new Intl.DateTimeFormat("en-US", {
                      day: "numeric",
                      month: "short",
                      year: "numeric"
                  }).format(new Date(article.publishedAt))
                : "Unknown date";

            const title = article.title || "Untitled News";

            const source =
                article.source && article.source.name
                    ? article.source.name
                    : "Unknown Source";

            const articleUrl = article.url || "#";

            card.innerHTML = `
                <img
                    src="${image}"
                    alt="${title}"
                    class="news-image"
                    loading="lazy"
                    onerror="this.src='images/default-news.jpg'"
                >

                <div class="news-content">

                    <h3 class="news-title">
                        ${title}
                    </h3>

                    <p class="news-description">
                        ${description}
                    </p>

                    <div class="news-meta">
                        <span>${source}</span>
                        <span>${date}</span>
                    </div>

                    <div class="news-actions">

                        <a
                            href="${articleUrl}"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="read-btn">
                            Read More
                        </a>

                        <button class="share-btn">
                            Share
                        </button>

                    </div>

                </div>
            `;

            card.addEventListener("click", e => {
                if (
                    e.target.classList.contains("share-btn") ||
                    e.target.classList.contains("read-btn")
                ) {
                    return;
                }

                if (articleUrl !== "#") {
                    window.open(articleUrl, "_blank");
                }
            });

            const shareButton =
                card.querySelector(".share-btn");

            if (shareButton) {
                shareButton.addEventListener(
                    "click",
                    async e => {
                        e.stopPropagation();

                        if (navigator.share) {
                            try {
                                await navigator.share({
                                    title: title,
                                    text:
                                        article.description || "",
                                    url: articleUrl
                                });
                            } catch (err) {
                                console.log(
                                    "Share cancelled"
                                );
                            }
                        } else {
                            try {
                                await navigator.clipboard.writeText(
                                    articleUrl
                                );

                                alert(
                                    "News link copied!"
                                );
                            } catch (err) {
                                alert(
                                    "Unable to copy link."
                                );
                            }
                        }
                    }
                );
            }

            grid.appendChild(card);
        });
    }

    showError(message) 
    {
        const error = document.getElementById("error");

        if (!error) return;

        error.textContent = message;
        error.style.display = "block";
    }

    hideError() 
    {
        const error = document.getElementById("error");

        if (error) {
            error.style.display = "none";
        }
    }

    showEndMessage() 
    {
        const endMessage =
            document.getElementById("endMessage");

        if (endMessage) {
            endMessage.style.display = "block";
        }
    }

    hideEndMessage() 
    {
        const endMessage =
            document.getElementById("endMessage");

        if (endMessage) {
            endMessage.style.display = "none";
        }
    }

    toggleLoading(show) 
    {
        this.state.loading = show;

        const loading =
            document.getElementById("loading");

        if (loading) {
            loading.style.display =
                show ? "flex" : "none";
        }
    }
}
}
document.addEventListener("DOMContentLoaded", () => {
    new NewsApp();
});
