"use strict";

if (window.top !== window.self) {
    document.documentElement.replaceChildren();
    throw new Error("Framed portal access is not allowed.");
}

const LOGIN_ENDPOINT = "https://dsvjuvryxbjtbsaqjpoi.supabase.co/functions/v1/candidate-portal-login";

const loginView = document.getElementById("login-view");
const resultsView = document.getElementById("results-view");
const loginForm = document.getElementById("login-form");
const candidateIdInput = document.getElementById("candidate-id");
const passwordInput = document.getElementById("portal-password");
const togglePasswordButton = document.getElementById("toggle-password");
const loginButton = document.getElementById("login-button");
const loginMessage = document.getElementById("login-message");
const signOutButton = document.getElementById("sign-out-button");
const candidateReference = document.getElementById("candidate-reference");
const resultsSummary = document.getElementById("results-summary");
const applicationList = document.getElementById("application-list");

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kuwait"
});

function normalizeCandidateId(value) {
    return value.trim().toUpperCase();
}

function setMessage(message, type = "error") {
    loginMessage.textContent = message;
    loginMessage.className = `form-message is-visible is-${type}`;
}

function clearMessage() {
    loginMessage.textContent = "";
    loginMessage.className = "form-message";
}

function setLoading(isLoading) {
    loginButton.disabled = isLoading;
    loginButton.classList.toggle("is-loading", isLoading);
    candidateIdInput.disabled = isLoading;
    passwordInput.disabled = isLoading;
    togglePasswordButton.disabled = isLoading;
}

function formatDate(value) {
    if (!value) {
        return null;
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return null;
    }

    return dateFormatter.format(parsed);
}

function statusDetails(status) {
    const statuses = {
        under_review: { label: "Under review", className: "status-under-review" },
        passed: { label: "Passed", className: "status-passed" },
        not_selected: { label: "Not selected", className: "status-not-selected" }
    };

    return statuses[status] || { label: "Status unavailable", className: "status-not-selected" };
}

function makeElement(tagName, className, text) {
    const element = document.createElement(tagName);
    if (className) {
        element.className = className;
    }
    if (typeof text === "string") {
        element.textContent = text;
    }
    return element;
}

function createSummaryCard(value, label) {
    const card = makeElement("div", "summary-card");
    card.append(makeElement("strong", "", String(value)));
    card.append(makeElement("span", "", label));
    return card;
}

function createApplicationCard(application) {
    const card = makeElement("article", "application-card");
    const main = makeElement("div", "application-main");
    const details = makeElement("div", "application-details");
    const titleRow = makeElement("div", "application-title-row");
    const title = typeof application.position_title === "string" && application.position_title.trim()
        ? application.position_title.trim()
        : "Position title unavailable";

    titleRow.append(makeElement("h3", "", title));
    if (application.current === true) {
        titleRow.append(makeElement("span", "current-badge", "Current"));
    }

    const dates = makeElement("p", "application-dates");
    const submittedDate = formatDate(application.submitted_at);
    const processedDate = formatDate(application.processed_at);
    if (submittedDate) {
        dates.append(makeElement("span", "", `Submitted: ${submittedDate}`));
    }
    if (processedDate) {
        dates.append(makeElement("span", "", `Processed: ${processedDate}`));
    }

    details.append(titleRow, dates);

    const status = statusDetails(application.status);
    const badge = makeElement("span", `status-badge ${status.className}`, status.label);
    main.append(details, badge);
    card.append(main);

    const reportPanel = makeElement("div", "report-panel");
    if (application.report && typeof application.report.summary === "string") {
        reportPanel.append(makeElement("h4", "", "Public report"));
        reportPanel.append(makeElement("p", "", application.report.summary));

        const expiry = formatDate(application.report.expires_at);
        if (expiry) {
            reportPanel.append(makeElement("span", "report-expiry", `Report available until ${expiry}.`));
        }
    } else {
        reportPanel.append(makeElement("h4", "", "Public report"));
        reportPanel.append(makeElement(
            "span",
            "no-report",
            application.status === "under_review"
                ? "A report will appear here when processing is complete and a public summary is available."
                : "No active public report is available for this application."
        ));
    }

    card.append(reportPanel);
    return card;
}

function renderResults(candidateId, applications) {
    const safeApplications = Array.isArray(applications) ? applications : [];
    const completed = safeApplications.filter((application) => application.status !== "under_review").length;
    const underReview = safeApplications.filter((application) => application.status === "under_review").length;

    candidateReference.textContent = `Candidate ID: ${candidateId}`;
    resultsSummary.replaceChildren(
        createSummaryCard(safeApplications.length, "Total applications"),
        createSummaryCard(underReview, "Under review"),
        createSummaryCard(completed, "Completed")
    );

    applicationList.replaceChildren();
    if (safeApplications.length === 0) {
        applicationList.append(makeElement(
            "div",
            "empty-state",
            "No portal applications are currently linked to this Candidate ID."
        ));
    } else {
        const fragment = document.createDocumentFragment();
        safeApplications.forEach((application) => {
            if (application && typeof application === "object") {
                fragment.append(createApplicationCard(application));
            }
        });
        applicationList.append(fragment);
    }

    loginView.hidden = true;
    resultsView.hidden = false;
    resultsView.focus({ preventScroll: true });
    resultsView.scrollIntoView({ behavior: "smooth", block: "start" });
}

function signOut() {
    resultsView.hidden = true;
    loginView.hidden = false;
    candidateReference.textContent = "";
    resultsSummary.replaceChildren();
    applicationList.replaceChildren();
    passwordInput.value = "";
    passwordInput.type = "password";
    togglePasswordButton.textContent = "Show";
    togglePasswordButton.setAttribute("aria-pressed", "false");
    clearMessage();
    candidateIdInput.focus({ preventScroll: true });
    loginView.scrollIntoView({ behavior: "smooth", block: "start" });
}

togglePasswordButton.addEventListener("click", () => {
    const willShow = passwordInput.type === "password";
    passwordInput.type = willShow ? "text" : "password";
    togglePasswordButton.textContent = willShow ? "Hide" : "Show";
    togglePasswordButton.setAttribute("aria-pressed", String(willShow));
    passwordInput.focus();
});

candidateIdInput.addEventListener("input", () => {
    const selectionStart = candidateIdInput.selectionStart;
    candidateIdInput.value = candidateIdInput.value.toUpperCase();
    if (selectionStart !== null) {
        candidateIdInput.setSelectionRange(selectionStart, selectionStart);
    }
});

loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearMessage();

    const candidateId = normalizeCandidateId(candidateIdInput.value);
    const password = passwordInput.value;

    if (!/^KBM-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{8}$/.test(candidateId)) {
        setMessage("Enter a valid Candidate ID in the format KBM-XXXXXXXX.");
        candidateIdInput.focus();
        return;
    }

    if (!password) {
        setMessage("Enter the password provided with your Candidate ID.");
        passwordInput.focus();
        return;
    }

    setLoading(true);
    setMessage("Checking your credentials securely…", "info");

    try {
        const response = await fetch(LOGIN_ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            cache: "no-store",
            credentials: "omit",
            referrerPolicy: "no-referrer",
            body: JSON.stringify({
                candidate_id: candidateId,
                password
            })
        });

        let data = null;
        try {
            data = await response.json();
        } catch {
            data = null;
        }

        if (response.ok && data && data.ok === true) {
            passwordInput.value = "";
            clearMessage();
            renderResults(data.candidate_id || candidateId, data.applications);
            return;
        }

        if (response.status === 401) {
            setMessage("The Candidate ID or password is incorrect. Please check both and try again.");
            passwordInput.select();
            return;
        }

        if (response.status === 429) {
            const seconds = Number(data && data.retry_after_seconds);
            const minutes = Number.isFinite(seconds) ? Math.max(1, Math.ceil(seconds / 60)) : 15;
            setMessage(`Too many unsuccessful attempts. Please wait approximately ${minutes} minute${minutes === 1 ? "" : "s"} before trying again.`);
            return;
        }

        setMessage("The candidate portal is temporarily unavailable. Please try again shortly.");
    } catch {
        setMessage("The portal could not be reached. Check your internet connection and try again.");
    } finally {
        setLoading(false);
    }
});

signOutButton.addEventListener("click", signOut);
