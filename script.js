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

        const themeIcon = document.getElementById("themeIcon");
        const themeToggle = document.getElementById("themeToggle");

        if (themeIcon) {
            themeIcon.textContent =
                theme === "dark" ? "☀️" : "🌙";
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

        const searchInput =
            document.getElementById("searchInput");

        if (searchInput) {

            searchInput.addEventListener("input", e => {

                clearTimeout(this.searchTimer);

                this.searchTimer = setTimeout(() => {

                    this.search(
                        e.target.value.trim()
                    );

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

        const scrollTop =
            document.getElementById("scrollTop");

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

        if (category === this.state.category) {
            return;
        }

        document
            .querySelectorAll(".category-btn")
            .forEach(btn => {
                btn.classList.remove("active");
            });

        const selectedButton =
            document.querySelector(
                `[data-category="${category}"]`
            );

        if (selectedButton) {
            selectedButton.classList.add("active");
        }

        this.resetState({
            category: category,
            query: ""
        });

        const searchInput =
            document.getElementById("searchInput");

        if (searchInput) {
            searchInput.value = "";
        }

        this.loadNews();
    }

    search(query) {

        this.resetState({
            query: query
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

        const grid =
            document.getElementById("newsGrid");

        if (grid) {
            grid.innerHTML = "";
        }
    }

    buildUrl() {

        const params = new URLSearchParams({
            category: this.state.category,
            page: this.state.page,
            pageSize: 20
        });

        if (this.state.query) {
            params.append(
                "q",
                this.state.query
            );
        }

        return `${this.BASE_URL}?${params.toString()}`;
    }

    async loadNews() {

        if (this.state.loading) {
            return;
        }

        this.toggleLoading(true);
        this.hideError();
        this.hideEndMessage();

        try {

            const response =
                await fetch(this.buildUrl());

            if (!response.ok) {
                throw new Error(
                    `HTTP Error: ${response.status}`
                );
            }

            const data =
                await response.json();

            if (data.status !== "ok") {
                throw new Error(
                    data.message || "Failed to load news"
                );
            }

            this.state.articles =
                data.articles || [];

            this.state.totalResults =
                data.totalResults || 0;

            this.renderNews(
                this.state.articles
            );

            if (this.state.articles.length === 0) {
                this.showError("No News Found");
            }

        } catch (error) {

            console.error(
                "News loading error:",
                error
            );

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
            this.state.articles.length >=
            this.state.totalResults
        ) {

            this.showEndMessage();
            return;
        }

        this.state.page++;

        this.toggleLoading(true);

        try {

            const response =
                await fetch(this.buildUrl());

            if (!response.ok) {
                throw new Error(
                    `HTTP Error: ${response.status}`
                );
            }

            const data =
                await response.json();

            if (data.status !== "ok") {
                throw new Error(
                    data.message || "Failed to load more news"
                );
            }

            const newArticles =
                data.articles || [];

            this.state.articles.push(
                ...newArticles
            );

            this.renderNews(
                newArticles,
                true
            );

            if (
                this.state.articles.length >=
                this.state.totalResults
            ) {
                this.showEndMessage();
            }

        } catch (error) {

            console.error(
                "Load more error:",
                error
            );

            this.state.page--;

        } finally {

            this.toggleLoading(false);
        }
    }

    renderNews(articles, append = false) {

        const grid =
            document.getElementById("newsGrid");

        if (!grid) {
            return;
        }

        if (!append) {
            grid.innerHTML = "";
        }

        articles.forEach(article => {

            const card =
                document.createElement("div");

            card.className =
                "news-card";

            const image =
                article.urlToImage
                    ? article.urlToImage
                    : "images/default-news.jpg";

            const description =
                article.description
                    ? article.description.substring(0, 120) + "..."
                    : "No description available.";

            let date = "Unknown date";

            if (article.publishedAt) {

                date =
                    new Intl.DateTimeFormat(
                        "en-US",
                        {
                            day: "numeric",
                            month: "short",
                            year: "numeric"
                        }
                    ).format(
                        new Date(article.publishedAt)
                    );
            }

            const sourceName =
                article.source &&
                article.source.name
                    ? article.source.name
                    : "Unknown Source";

            card.innerHTML = `
                <img
                    src="${image}"
                    alt="${article.title || "News"}"
                    class="news-image"
                    loading="lazy"
                    onerror="this.src='images/default-news.jpg'"
                >

                <div class="news-content">

                    <h3 class="news-title">
                        ${article.title || "Untitled News"}
                    </h3>

                    <p class="news-description">
                        ${description}
                    </p>

                    <div class="news-meta">
                        <span>
                            ${sourceName}
                        </span>

                        <span>
                            ${date}
                        </span>
                    </div>

                    <div class="news-actions">

                        <a
                            href="${article.url || "#"}"
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

                if (article.url) {
                    window.open(
                        article.url,
                        "_blank"
                    );
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
                                    title:
                                        article.title || "News",
                                    text:
                                        article.description || "",
                                    url:
                                        article.url || ""
                                });

                            } catch (error) {
                                // Sharing cancelled
                            }

                        } else {

                            try {

                                await navigator.clipboard.writeText(
                                    article.url || ""
                                );

                                alert(
                                    "News link copied!"
                                );

                            } catch (error) {

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

    showError(message) {

        const error =
            document.getElementById("error");

        if (!error) {
            return;
        }

        error.textContent =
            message;

        error.style.display =
            "block";
    }

    hideError() {

        const error =
            document.getElementById("error");

        if (error) {
            error.style.display =
                "none";
        }
    }

    showEndMessage() {

        const message =
            document.getElementById("endMessage");

        if (message) {
            message.style.display =
                "block";
        }
    }

    hideEndMessage() {

        const message =
            document.getElementById("endMessage");

        if (message) {
            message.style.display =
                "none";
        }
    }

    toggleLoading(show) {

        this.state.loading =
            show;

        const loading =
            document.getElementById("loading");

        if (loading) {

            loading.style.display =
                show ? "flex" : "none";
        }
    }
}

document.addEventListener(
    "DOMContentLoaded",
    () => {
        new NewsApp();
    }
);
