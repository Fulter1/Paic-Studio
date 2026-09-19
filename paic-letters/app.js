/* ============================================================
   PAIC LETTERS
   APPLICATION
============================================================ */

(() => {

    "use strict";


    /* =========================================================
       CONSTANTS
    ========================================================== */

    const STORAGE_KEY = "paic_letters_saved_v3";

    const DRAFT_KEY = "paic_letters_draft_v3";


    /* =========================================================
       STATE
    ========================================================== */

    const state = {

        template: "sponsorship",

        paperSize: "a4",

        savedLetters: [],

        currentEditingId: null,

        renderTimer: null

    };


    /* =========================================================
       DOM
    ========================================================== */

    const $ = (selector, parent = document) =>
        parent.querySelector(selector);


    const $$ = (selector, parent = document) =>
        Array.from(parent.querySelectorAll(selector));


    const elements = {

        body: document.body,

        themeToggle: $("#themeToggle"),

        demoButton: $("#demoButton"),

        clearButton: $("#clearButton"),

        copyButton: $("#copyButton"),

        saveButton: $("#saveButton"),

        pngButton: $("#pngButton"),

        pdfButton: $("#pdfButton"),

        fitButton: $("#fitButton"),

        letterPaper: $("#letterPaper"),

        paperContent: $("#paperContent"),

        previewArea: $("#previewArea"),

        previewTemplateName: $("#previewTemplateName"),

        previewSizeLabel: $("#previewSizeLabel"),

        savedLetters: $("#savedLetters"),

        savedCount: $("#savedCount"),

        toast: $("#toast"),

        fields: {

            recipient: $("#recipient"),

            recipientName: $("#recipientName"),

            date: $("#date"),

            eventName: $("#eventName"),

            eventDate: $("#eventDate"),

            eventLocation: $("#eventLocation"),

            support: $("#support"),

            amount: $("#amount"),

            message: $("#message"),

            prName: $("#prName"),

            prPhone: $("#prPhone"),

            prEmail: $("#prEmail")

        }

    };


    /* =========================================================
       INITIALIZATION
    ========================================================== */

    function init() {

        loadSavedLetters();

        loadDraft();

        setupLogoFallbacks();

        setupEvents();

        setupTheme();

        setDefaultDate();

        render();

    }


    /* =========================================================
       EVENTS
    ========================================================== */

    function setupEvents() {

        document.addEventListener("click", handleDocumentClick);


        Object.values(elements.fields).forEach(field => {

            if (!field) {
                return;
            }

            field.addEventListener("input", () => {

                scheduleRender();

                saveDraft();

            });

            field.addEventListener("change", () => {

                scheduleRender();

                saveDraft();

            });

        });


        window.addEventListener("resize", debounce(() => {

            scalePaper();

        }, 100));


        window.addEventListener("afterprint", () => {

            document.body.classList.remove("print-mode");

        });


        if (elements.themeToggle) {

            elements.themeToggle.addEventListener(
                "click",
                toggleTheme
            );

        }


        if (elements.fitButton) {

            elements.fitButton.addEventListener(
                "click",
                scalePaper
            );

        }


        if (elements.demoButton) {

            elements.demoButton.addEventListener(
                "click",
                fillDemo
            );

        }


        if (elements.clearButton) {

            elements.clearButton.addEventListener(
                "click",
                clearForm
            );

        }


        if (elements.copyButton) {

            elements.copyButton.addEventListener(
                "click",
                copyLetterText
            );

        }


        if (elements.saveButton) {

            elements.saveButton.addEventListener(
                "click",
                saveCurrentLetter
            );

        }


        if (elements.pngButton) {

            elements.pngButton.addEventListener(
                "click",
                exportPNG
            );

        }


        if (elements.pdfButton) {

            elements.pdfButton.addEventListener(
                "click",
                printLetter
            );

        }

    }


    function handleDocumentClick(event) {

        const templateButton =
            event.target.closest("[data-template]");


        if (templateButton) {

            const template =
                templateButton.dataset.template;

            if (PAIC_CONTENT.templates[template]) {

                state.template = template;

                state.currentEditingId = null;

                updateTemplateButtons();

                render();

                saveDraft();

                return;

            }

        }


        const sizeButton =
            event.target.closest("[data-paper-size]");


        if (sizeButton) {

            const size =
                sizeButton.dataset.paperSize;

            if (
                size === "a4" ||
                size === "square"
            ) {

                state.paperSize = size;

                updateSizeButtons();

                render();

                saveDraft();

                return;

            }

        }


        const savedLoad =
            event.target.closest("[data-saved-load]");


        if (savedLoad) {

            loadSavedLetter(savedLoad.dataset.savedLoad);

            return;

        }


        const savedDelete =
            event.target.closest("[data-saved-delete]");


        if (savedDelete) {

            deleteSavedLetter(savedDelete.dataset.savedDelete);

            return;

        }

    }


    /* =========================================================
       LOGOS
    ========================================================== */

    function setupLogoFallbacks() {

        $$("img").forEach(img => {

            img.addEventListener(
                "error",
                () => handleImageError(img),
                { once: true }
            );

        });

    }


    function handleImageError(img) {

        img.dataset.failed = "true";

        img.classList.add("paper-image-failed");


        const parent =
            img.closest(
                ".brand-logo, .club-logo-holder, .university-logo-holder"
            );


        if (parent) {

            parent.classList.add("image-failed");

        }

    }


    function attachGeneratedImageFallbacks() {

        $$("#paperContent img").forEach(img => {

            img.addEventListener(
                "error",
                () => handleImageError(img),
                { once: true }
            );

        });

    }


    /* =========================================================
       DEFAULT DATE
    ========================================================== */

    function setDefaultDate() {

        const dateField =
            elements.fields.date;


        if (!dateField.value) {

            const now = new Date();

            const localDate =
                new Date(
                    now.getTime() -
                    now.getTimezoneOffset() * 60000
                )
                .toISOString()
                .split("T")[0];

            dateField.value = localDate;

        }

    }


    /* =========================================================
       THEME
    ========================================================== */

    function setupTheme() {

        const savedTheme =
            localStorage.getItem("paic_theme");


        if (savedTheme === "light") {

            document.body.classList.add("light");

        }


        updateThemeIcon();

    }


    function toggleTheme() {

        document.body.classList.toggle("light");

        const isLight =
            document.body.classList.contains("light");


        localStorage.setItem(
            "paic_theme",
            isLight ? "light" : "dark"
        );


        updateThemeIcon();

    }


    function updateThemeIcon() {

        if (!elements.themeToggle) {
            return;
        }


        const icon =
            elements.themeToggle.querySelector("i");


        if (!icon) {
            return;
        }


        const isLight =
            document.body.classList.contains("light");


        icon.className =
            isLight
                ? "fa-solid fa-sun"
                : "fa-solid fa-moon";

    }


    /* =========================================================
       GET DATA
    ========================================================== */

    function getFormData() {

        return {

            recipient:
                getValue("recipient"),

            recipientName:
                getValue("recipientName"),

            date:
                getValue("date"),

            eventName:
                getValue("eventName"),

            eventDate:
                getValue("eventDate"),

            eventLocation:
                getValue("eventLocation"),

            support:
                getValue("support"),

            amount:
                getValue("amount"),

            message:
                getValue("message"),

            prName:
                getValue("prName"),

            prPhone:
                getValue("prPhone"),

            prEmail:
                getValue("prEmail")

        };

    }


    function getValue(key) {

        const field =
            elements.fields[key];


        if (!field) {
            return "";
        }


        return String(field.value || "").trim();

    }


    /* =========================================================
       HELPERS
    ========================================================== */

    function escapeHTML(value) {

        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");

    }


    function safeText(value, fallback = "—") {

        const clean =
            String(value || "").trim();


        return clean || fallback;

    }


    function formatDate(value) {

        if (!value) {
            return "—";
        }


        const date =
            new Date(`${value}T00:00:00`);


        if (Number.isNaN(date.getTime())) {
            return value;
        }


        return new Intl.DateTimeFormat(
            "ar-SA-u-ca-gregory",
            {
                day: "numeric",
                month: "long",
                year: "numeric"
            }
        ).format(date);

    }


    function replaceTokens(text, data) {

        return String(text || "")
            .replaceAll(
                "{{recipient}}",
                safeText(data.recipient, "الجهة الكريمة")
            )
            .replaceAll(
                "{{recipientName}}",
                safeText(data.recipientName, "المحترم")
            )
            .replaceAll(
                "{{eventName}}",
                safeText(data.eventName, "المبادرة")
            )
            .replaceAll(
                "{{support}}",
                safeText(data.support, "الدعم المناسب")
            )
            .replaceAll(
                "{{eventDate}}",
                safeText(data.eventDate, "الموعد المحدد")
            )
            .replaceAll(
                "{{eventLocation}}",
                safeText(data.eventLocation, "الموقع المحدد")
            );

    }


    function formatPhone(phone) {

        return escapeHTML(
            safeText(phone, "05XXXXXXXX")
        );

    }


    /* =========================================================
       RENDER
    ========================================================== */

    function render() {

        const templateData =
            PAIC_CONTENT.templates[state.template];


        if (!templateData) {
            return;
        }


        elements.letterPaper.className =
            [
                "letter-paper",
                state.paperSize === "a4"
                    ? "paper-a4"
                    : "paper-square",
                `template-${state.template}`
            ].join(" ");


        elements.previewTemplateName.textContent =
            templateData.uiTitle;


        elements.previewSizeLabel.textContent =
            state.paperSize === "a4"
                ? "A4"
                : "مربع";


        if (state.paperSize === "a4") {

            elements.paperContent.innerHTML =
                renderA4(
                    state.template,
                    templateData.a4,
                    getFormData()
                );

        } else {

            elements.paperContent.innerHTML =
                renderSquare(
                    state.template,
                    templateData.square,
                    getFormData()
                );

        }


        attachGeneratedImageFallbacks();

        requestAnimationFrame(() => {

            scalePaper();

        });

    }


    function scheduleRender() {

        clearTimeout(state.renderTimer);


        state.renderTimer =
            setTimeout(() => {

                render();

            }, 90);

    }


    /* =========================================================
       PAPER HEADER
    ========================================================== */

    function renderPaperHeader() {

        return `

            <div class="paper-header">

                <div class="club-identity">

                    <div class="club-logo-holder">

                        <img
                            class="paper-logo-club"
                            src="assets/logo-club.png"
                            alt="شعار نادي البرمجة والذكاء الاصطناعي"
                        >

                    </div>

                    <div class="club-identity-text">

                        <strong>
                            ${escapeHTML(PAIC_CONTENT.clubName)}
                        </strong>

                        <span>
                            ${escapeHTML(PAIC_CONTENT.collegeName)}
                        </span>

                    </div>

                </div>


                <div class="university-identity">

                    <div class="university-identity-text">

                        <strong>
                            ${escapeHTML(PAIC_CONTENT.universityName)}
                        </strong>

                        <span>
                            ${escapeHTML(PAIC_CONTENT.collegeName)}
                        </span>

                    </div>

                    <div class="university-logo-holder">

                        <img
                            class="paper-logo-university"
                            src="assets/logo-university.png"
                            alt="شعار جامعة الطائف"
                        >

                    </div>

                </div>

            </div>

        `;

    }


    /* =========================================================
       A4
    ========================================================== */

    function renderA4(type, content, data) {

        const recipient =
            safeText(
                data.recipient,
                "الجهة الكريمة"
            );


        const recipientName =
            data.recipientName
                ? replaceTokens(
                    content.greetingPerson,
                    data
                )
                : replaceTokens(
                    content.greeting,
                    data
                );


        const extraMessage =
            data.message
                ? `
                    <div class="a4-extra">

                        <div class="a4-extra-title">
                            ${escapeHTML(content.extraLabel)}
                        </div>

                        <div class="a4-extra-text">
                            ${escapeHTML(data.message)}
                        </div>

                    </div>
                `
                : "";


        if (type === "sponsorship") {

            return renderSponsorshipA4(
                content,
                data,
                recipient,
                recipientName,
                extraMessage
            );

        }


        if (type === "partnership") {

            return renderPartnershipA4(
                content,
                data,
                recipient,
                recipientName,
                extraMessage
            );

        }


        if (type === "thanks") {

            return renderThanksA4(
                content,
                data,
                recipient,
                recipientName,
                extraMessage
            );

        }


        if (type === "invitation") {

            return renderInvitationA4(
                content,
                data,
                recipient,
                recipientName,
                extraMessage
            );

        }


        return "";

    }


    /* =========================================================
       SPONSORSHIP A4
    ========================================================== */

    function renderSponsorshipA4(
        content,
        data,
        recipient,
        recipientName,
        extraMessage
    ) {

        return `

            <div class="paper-inner">

                ${renderPaperHeader()}


                <div class="a4-rule"></div>


                <div class="a4-date">
                    ${escapeHTML(formatDate(data.date))}
                </div>


                <div class="sponsorship-hero">

                    <div class="sponsorship-accent"></div>

                    <div>

                        <div class="sponsorship-kicker">
                            ${escapeHTML(content.kicker)}
                        </div>

                        <h2 class="sponsorship-title">
                            ${escapeHTML(content.title)}
                        </h2>

                    </div>

                </div>


                <div class="a4-recipient">

                    <strong>
                        ${escapeHTML(recipient)}
                    </strong>

                    <span>
                        ${escapeHTML(recipientName)}
                    </span>

                </div>


                <div class="sponsorship-highlight">

                    <div class="sponsorship-highlight-box main">

                        <span>
                            ${escapeHTML(content.supportLabel)}
                        </span>

                        <strong>
                            ${escapeHTML(
                                safeText(
                                    data.support,
                                    "دعم المبادرة"
                                )
                            )}
                        </strong>

                    </div>


                    <div class="sponsorship-highlight-box">

                        <span>
                            ${escapeHTML(content.amountLabel)}
                        </span>

                        <strong>
                            ${escapeHTML(
                                safeText(
                                    data.amount,
                                    "حسب الاتفاق"
                                )
                            )}
                        </strong>

                    </div>

                </div>


                <div class="a4-body">

                    <p>
                        ${escapeHTML(
                            replaceTokens(
                                content.intro,
                                data
                            )
                        )}
                    </p>

                    <p>
                        ${escapeHTML(
                            replaceTokens(
                                content.request,
                                data
                            )
                        )}
                    </p>

                    <p>
                        ${escapeHTML(
                            content.closing
                        )}
                    </p>


                    ${extraMessage}

                </div>


                <div class="paper-footer">

                    <div class="pr-signature">

                        ${renderStamp()}

                        ${renderPRSignature(data)}

                    </div>

                    ${renderPRContact(data)}

                </div>


                ${renderDisclaimer()}

            </div>

        `;

    }


    /* =========================================================
       PARTNERSHIP A4
    ========================================================== */

    function renderPartnershipA4(
        content,
        data,
        recipient,
        recipientName,
        extraMessage
    ) {

        return `

            <div class="paper-inner">

                ${renderPaperHeader()}


                <div class="partnership-hero">

                    <div class="partnership-side club">

                        <strong>
                            ${escapeHTML(PAIC_CONTENT.clubName)}
                        </strong>

                        <span>
                            جهة المبادرة
                        </span>

                    </div>


                    <div class="partnership-center">

                        <i class="fa-solid fa-link"></i>

                    </div>


                    <div class="partnership-side partner">

                        <strong>
                            ${escapeHTML(recipient)}
                        </strong>

                        <span>
                            الجهة الشريكة
                        </span>

                    </div>

                </div>


                <div class="partnership-title-kicker">
                    ${escapeHTML(content.kicker)}
                </div>


                <h2 class="partnership-title">
                    ${escapeHTML(content.title)}
                </h2>


                <div class="a4-date">
                    ${escapeHTML(formatDate(data.date))}
                </div>


                <div class="a4-recipient">

                    <strong>
                        ${escapeHTML(recipient)}
                    </strong>

                    <span>
                        ${escapeHTML(recipientName)}
                    </span>

                </div>


                <div class="a4-body">

                    <p>
                        ${escapeHTML(
                            replaceTokens(
                                content.intro,
                                data
                            )
                        )}
                    </p>

                    <p>
                        ${escapeHTML(
                            replaceTokens(
                                content.request,
                                data
                            )
                        )}
                    </p>

                    <div class="a4-info-row">

                        <div class="a4-info">

                            <span>
                                ${escapeHTML(content.extraLabel)}
                            </span>

                            <strong>
                                ${escapeHTML(
                                    safeText(
                                        data.support,
                                        "تعاون معرفي وتقني"
                                    )
                                )}
                            </strong>

                        </div>


                        <div class="a4-info">

                            <span>
                                المبادرة
                            </span>

                            <strong>
                                ${escapeHTML(
                                    safeText(
                                        data.eventName,
                                        "مبادرة النادي"
                                    )
                                )}
                            </strong>

                        </div>

                    </div>


                    <p>
                        ${escapeHTML(content.closing)}
                    </p>


                    ${extraMessage}

                </div>


                <div class="paper-footer">

                    <div class="pr-signature">

                        ${renderStamp()}

                        ${renderPRSignature(data)}

                    </div>

                    ${renderPRContact(data)}

                </div>


                ${renderDisclaimer()}

            </div>

        `;

    }


    /* =========================================================
       THANKS A4
    ========================================================== */

    function renderThanksA4(
        content,
        data,
        recipient,
        recipientName,
        extraMessage
    ) {

        return `

            <div class="paper-inner">

                ${renderPaperHeader()}


                <div class="thanks-layout">

                    <div class="thanks-mark">

                        <img
                            src="assets/logo-club.png"
                            alt="شعار النادي"
                        >

                    </div>


                    <div class="template-kicker">
                        ${escapeHTML(content.kicker)}
                    </div>


                    <h2 class="template-title">
                        ${escapeHTML(content.title)}
                    </h2>


                    <div class="thanks-line"></div>


                    <div class="thanks-recipient">

                        ${escapeHTML(
                            data.recipientName
                                ? data.recipientName
                                : recipient
                        )}

                    </div>


                    <div class="thanks-text">

                        ${escapeHTML(
                            replaceTokens(
                                content.intro,
                                data
                            )
                        )}

                        <br><br>

                        ${escapeHTML(
                            replaceTokens(
                                content.request,
                                data
                            )
                        )}

                    </div>


                    <div class="thanks-event">

                        المناسبة:
                        <strong>
                            ${escapeHTML(
                                safeText(
                                    data.eventName,
                                    "مبادرة النادي"
                                )
                            )}
                        </strong>

                        &nbsp;&nbsp;•&nbsp;&nbsp;

                        ${escapeHTML(formatDate(data.date))}

                    </div>


                    ${
                        extraMessage
                            ? `
                                <div style="width:100%; margin-top:8mm;">
                                    ${extraMessage}
                                </div>
                            `
                            : ""
                    }


                    <div style="margin-top:auto; width:100%;">

                        <div class="paper-footer">

                            <div class="pr-signature">

                                ${renderStamp()}

                                ${renderPRSignature(data)}

                            </div>

                            ${renderPRContact(data)}

                        </div>

                    </div>

                </div>


                ${renderDisclaimer()}

            </div>

        `;

    }


    /* =========================================================
       INVITATION A4
    ========================================================== */

    function renderInvitationA4(
        content,
        data,
        recipient,
        recipientName,
        extraMessage
    ) {

        return `

            <div class="paper-inner">

                ${renderPaperHeader()}


                <div class="invitation-banner">

                    <div class="invitation-banner-content">

                        <div class="invitation-kicker">
                            ${escapeHTML(content.kicker)}
                        </div>

                        <h2 class="invitation-title">
                            ${escapeHTML(content.title)}
                        </h2>

                        <div class="invitation-event">
                            ${escapeHTML(
                                safeText(
                                    data.eventName,
                                    "فعالية نادي البرمجة والذكاء الاصطناعي"
                                )
                            )}
                        </div>

                    </div>

                </div>


                <div class="a4-recipient">

                    <strong>
                        ${escapeHTML(recipient)}
                    </strong>

                    <span>
                        ${escapeHTML(recipientName)}
                    </span>

                </div>


                <div class="a4-body">

                    <p>
                        ${escapeHTML(
                            replaceTokens(
                                content.intro,
                                data
                            )
                        )}
                    </p>

                    <p>
                        ${escapeHTML(
                            replaceTokens(
                                content.request,
                                data
                            )
                        )}
                    </p>


                    <div class="invitation-info">

                        <div class="invitation-info-box">

                            <span>
                                ${escapeHTML(content.supportLabel)}
                            </span>

                            <strong>
                                ${escapeHTML(
                                    safeText(
                                        data.eventDate,
                                        "يحدد لاحقًا"
                                    )
                                )}
                            </strong>

                        </div>


                        <div class="invitation-info-box">

                            <span>
                                ${escapeHTML(content.amountLabel)}
                            </span>

                            <strong>
                                ${escapeHTML(
                                    safeText(
                                        data.eventLocation,
                                        "يحدد لاحقًا"
                                    )
                                )}
                            </strong>

                        </div>

                    </div>


                    ${extraMessage}

                </div>


                <div class="paper-footer">

                    <div class="pr-signature">

                        ${renderStamp()}

                        ${renderPRSignature(data)}

                    </div>

                    ${renderPRContact(data)}

                </div>


                ${renderDisclaimer()}

            </div>

        `;

    }


    /* =========================================================
       SQUARE
    ========================================================== */

    function renderSquare(type, content, data) {

        if (type === "sponsorship") {

            return renderSponsorshipSquare(
                content,
                data
            );

        }


        if (type === "partnership") {

            return renderPartnershipSquare(
                content,
                data
            );

        }


        if (type === "thanks") {

            return renderThanksSquare(
                content,
                data
            );

        }


        if (type === "invitation") {

            return renderInvitationSquare(
                content,
                data
            );

        }


        return "";

    }


    /* =========================================================
       SQUARE SPONSORSHIP
    ========================================================== */

    function renderSponsorshipSquare(
        content,
        data
    ) {

        return `

            <div class="paper-inner">

                ${renderPaperHeader()}


                <div class="square-content">

                    <div class="square-kicker">
                        ${escapeHTML(content.kicker)}
                    </div>


                    <h2 class="square-title">
                        ${escapeHTML(content.title)}
                    </h2>


                    <div class="square-recipient">

                        إلى:
                        <strong>
                            ${escapeHTML(
                                safeText(
                                    data.recipient,
                                    "الجهة الكريمة"
                                )
                            )}
                        </strong>

                    </div>


                    <div class="square-summary">

                        ${escapeHTML(
                            replaceTokens(
                                content.summary,
                                data
                            )
                        )}

                    </div>


                    <div class="square-request">

                        ${escapeHTML(
                            replaceTokens(
                                content.request,
                                data
                            )
                        )}

                    </div>


                    <div class="sponsor-value">

                        <span>
                            قيمة الرعاية
                        </span>

                        <strong>
                            ${escapeHTML(
                                safeText(
                                    data.amount,
                                    "حسب الاتفاق"
                                )
                            )}
                        </strong>

                    </div>


                    <div class="square-event">

                        <div class="square-event-item">

                            <i class="fa-regular fa-calendar"></i>

                            <span>
                                ${escapeHTML(
                                    formatDate(data.date)
                                )}
                            </span>

                        </div>


                        ${
                            data.eventName
                                ? `
                                    <div class="square-event-item">

                                        <i class="fa-solid fa-sparkles"></i>

                                        <span>
                                            ${escapeHTML(
                                                data.eventName
                                            )}
                                        </span>

                                    </div>
                                `
                                : ""
                        }

                    </div>

                </div>


                <div class="square-footer">

                    <div class="pr-signature">

                        ${renderStamp()}

                        ${renderPRSignature(data)}

                    </div>

                    ${renderPRContact(data)}

                </div>


                ${renderDisclaimer()}

            </div>

        `;

    }


    /* =========================================================
       SQUARE PARTNERSHIP
    ========================================================== */

    function renderPartnershipSquare(
        content,
        data
    ) {

        return `

            <div class="paper-inner">

                ${renderPaperHeader()}


                <div class="square-content">

                    <div class="square-kicker">
                        ${escapeHTML(content.kicker)}
                    </div>


                    <h2 class="square-title">
                        ${escapeHTML(content.title)}
                    </h2>


                    <div class="square-recipient">

                        مع:
                        <strong>
                            ${escapeHTML(
                                safeText(
                                    data.recipient,
                                    "الجهة الشريكة"
                                )
                            )}
                        </strong>

                    </div>


                    <div class="square-summary">

                        ${escapeHTML(
                            replaceTokens(
                                content.summary,
                                data
                            )
                        )}

                    </div>


                    <div class="square-request">

                        ${escapeHTML(
                            replaceTokens(
                                content.request,
                                data
                            )
                        )}

                    </div>


                    <div class="partnership-mini">

                        <div>

                            <strong>
                                ${escapeHTML(
                                    PAIC_CONTENT.clubName
                                )}
                            </strong>

                            <span>
                                الجهة المبادرة
                            </span>

                        </div>


                        <i class="fa-solid fa-arrow-left"></i>


                        <div>

                            <strong>
                                ${escapeHTML(
                                    safeText(
                                        data.recipient,
                                        "الجهة الشريكة"
                                    )
                                )}
                            </strong>

                            <span>
                                شريك التعاون
                            </span>

                        </div>

                    </div>


                    <div class="square-event">

                        <div class="square-event-item">

                            <i class="fa-solid fa-handshake"></i>

                            <span>
                                ${escapeHTML(
                                    safeText(
                                        data.support,
                                        "تعاون مشترك"
                                    )
                                )}
                            </span>

                        </div>

                    </div>

                </div>


                <div class="square-footer">

                    <div class="pr-signature">

                        ${renderStamp()}

                        ${renderPRSignature(data)}

                    </div>

                    ${renderPRContact(data)}

                </div>


                ${renderDisclaimer()}

            </div>

        `;

    }


    /* =========================================================
       SQUARE THANKS
    ========================================================== */

    function renderThanksSquare(
        content,
        data
    ) {

        return `

            <div class="paper-inner">

                ${renderPaperHeader()}


                <div class="square-content">

                    <div class="square-kicker">
                        ${escapeHTML(content.kicker)}
                    </div>


                    <h2 class="square-title">
                        ${escapeHTML(content.title)}
                    </h2>


                    <div class="thanks-square-recipient">

                        ${escapeHTML(
                            safeText(
                                data.recipientName ||
                                data.recipient,
                                "الجهة الكريمة"
                            )
                        )}

                    </div>


                    <div class="thanks-square-line"></div>


                    <div class="thanks-square-text">

                        ${escapeHTML(
                            replaceTokens(
                                content.summary,
                                data
                            )
                        )}

                        <br><br>

                        ${escapeHTML(
                            replaceTokens(
                                content.request,
                                data
                            )
                        )}

                    </div>


                    <div class="square-event">

                        <div class="square-event-item">

                            <i class="fa-regular fa-calendar"></i>

                            <span>
                                ${escapeHTML(
                                    formatDate(data.date)
                                )}
                            </span>

                        </div>


                        ${
                            data.eventName
                                ? `
                                    <div class="square-event-item">

                                        <i class="fa-solid fa-sparkles"></i>

                                        <span>
                                            ${escapeHTML(
                                                data.eventName
                                            )}
                                        </span>

                                    </div>
                                `
                                : ""
                        }

                    </div>

                </div>


                <div class="square-footer">

                    <div class="pr-signature">

                        ${renderStamp()}

                        ${renderPRSignature(data)}

                    </div>

                    ${renderPRContact(data)}

                </div>


                ${renderDisclaimer()}

            </div>

        `;

    }


    /* =========================================================
       SQUARE INVITATION
    ========================================================== */

    function renderInvitationSquare(
        content,
        data
    ) {

        return `

            <div class="paper-inner">

                ${renderPaperHeader()}


                <div class="square-content">

                    <div class="square-kicker">
                        ${escapeHTML(content.kicker)}
                    </div>


                    <h2 class="square-title">
                        ${escapeHTML(content.title)}
                    </h2>


                    <div class="invitation-square-event">

                        ${escapeHTML(
                            safeText(
                                data.eventName,
                                "فعالية النادي"
                            )
                        )}

                    </div>


                    <div class="invitation-square-details">

                        <div class="invitation-square-detail">

                            <i class="fa-regular fa-calendar"></i>

                            <span>
                                ${escapeHTML(
                                    safeText(
                                        data.eventDate,
                                        "يحدد لاحقًا"
                                    )
                                )}
                            </span>

                        </div>


                        <div class="invitation-square-detail">

                            <i class="fa-solid fa-location-dot"></i>

                            <span>
                                ${escapeHTML(
                                    safeText(
                                        data.eventLocation,
                                        "يحدد لاحقًا"
                                    )
                                )}
                            </span>

                        </div>

                    </div>


                    <div class="invitation-square-message">

                        ${escapeHTML(
                            replaceTokens(
                                content.summary,
                                data
                            )
                        )}

                        <br>

                        ${escapeHTML(
                            replaceTokens(
                                content.request,
                                data
                            )
                        )}

                    </div>


                    <div class="square-recipient">

                        إلى:
                        <strong>
                            ${escapeHTML(
                                safeText(
                                    data.recipient,
                                    "الجهة الكريمة"
                                )
                            )}
                        </strong>

                    </div>

                </div>


                <div class="square-footer">

                    <div class="pr-signature">

                        ${renderStamp()}

                        ${renderPRSignature(data)}

                    </div>

                    ${renderPRContact(data)}

                </div>


                ${renderDisclaimer()}

            </div>

        `;

    }


    /* =========================================================
       PR SIGNATURE
    ========================================================== */

    function renderPRSignature(data) {

        return `

            <div class="signature-line">

                <strong>
                    ${escapeHTML(
                        safeText(
                            data.prName,
                            "أحمد خالد"
                        )
                    )}
                </strong>

                <span>
                    ${escapeHTML(
                        PAIC_CONTENT.publicRelations
                    )}
                </span>

            </div>

        `;

    }


    /* =========================================================
       PR CONTACT
    ========================================================== */

    function renderPRContact(data) {

        return `

            <div class="pr-contact">

                <strong>
                    ${escapeHTML(
                        PAIC_CONTENT.publicRelations
                    )}
                </strong>

                <span>
                    ${formatPhone(data.prPhone)}
                </span>

                <span>
                    ${escapeHTML(
                        safeText(
                            data.prEmail,
                            "club@example.com"
                        )
                    )}
                </span>

            </div>

        `;

    }


    /* =========================================================
       ELECTRONIC STAMP
    ========================================================== */

    function renderStamp() {

        return `

            <div
                class="electronic-stamp"
                title="ختم إلكتروني صادر عن النادي - العلاقات العامة"
            >

                <div class="stamp-top">
                    ${escapeHTML(PAIC_CONTENT.clubName)}
                </div>

                <div class="stamp-main">
                    صادر عن النادي
                </div>

                <div class="stamp-bottom">
                    ${escapeHTML(PAIC_CONTENT.publicRelations)}
                </div>

            </div>

        `;

    }


    /* =========================================================
       DISCLAIMER
    ========================================================== */

    function renderDisclaimer() {

        return `

            <div class="disclaimer">

                ${escapeHTML(
                    PAIC_CONTENT.disclaimer
                )}

            </div>

        `;

    }


    /* =========================================================
       TEMPLATE BUTTONS
    ========================================================== */

    function updateTemplateButtons() {

        $$("[data-template]").forEach(button => {

            button.classList.toggle(
                "active",
                button.dataset.template === state.template
            );

        });

    }


    /* =========================================================
       SIZE BUTTONS
    ========================================================== */

    function updateSizeButtons() {

        $$("[data-paper-size]").forEach(button => {

            button.classList.toggle(
                "active",
                button.dataset.paperSize === state.paperSize
            );

        });

    }


    /* =========================================================
       SCALE PAPER
    ========================================================== */

    function scalePaper() {

        const paper =
            elements.letterPaper;


        const area =
            elements.previewArea;


        if (!paper || !area) {
            return;
        }


        paper.style.transform = "none";


        const paperWidth =
            paper.offsetWidth;


        const paperHeight =
            paper.offsetHeight;


        if (!paperWidth || !paperHeight) {
            return;
        }


        const availableWidth =
            Math.max(
                area.clientWidth - 40,
                280
            );


        const availableHeight =
            Math.max(
                area.clientHeight - 40,
                400
            );


        const scaleByWidth =
            availableWidth / paperWidth;


        const scaleByHeight =
            availableHeight / paperHeight;


        let scale =
            Math.min(
                scaleByWidth,
                scaleByHeight,
                1
            );


        if (
            window.innerWidth <= 640 &&
            state.paperSize === "a4"
        ) {

            scale =
                Math.min(
                    scaleByWidth,
                    1
                );

        }


        paper.style.transform =
            `scale(${scale})`;


        area.style.minHeight =
            `${paperHeight * scale + 70}px`;

    }


    /* =========================================================
       DEMO
    ========================================================== */

    function fillDemo() {

        const demo = {

            recipient:
                "شركة حلول التقنية",

            recipientName:
                "الأستاذ / أحمد خالد",

            date:
                "2026-09-19",

            eventName:
                "ملتقى التقنية والابتكار",

            eventDate:
                "15 أكتوبر 2026",

            eventLocation:
                "جامعة الطائف",

            support:
                "دعم لوجستي وتقني",

            amount:
                "5,000 ريال",

            message:
                "نرحب بأي مقترحات إضافية يمكن أن تسهم في إنجاح المبادرة وتحقيق أهدافها.",

            prName:
                "أحمد خالد",

            prPhone:
                "0500000000",

            prEmail:
                "pr@paic.example"

        };


        Object.entries(demo).forEach(
            ([key, value]) => {

                if (elements.fields[key]) {

                    elements.fields[key].value =
                        value;

                }

            }
        );


        state.currentEditingId = null;

        saveDraft();

        render();

        showToast(
            "تم تعبئة بيانات تجربة"
        );

    }


    /* =========================================================
       CLEAR
    ========================================================== */

    function clearForm() {

        Object.values(elements.fields)
            .forEach(field => {

                if (field) {
                    field.value = "";
                }

            });


        state.currentEditingId = null;

        setDefaultDate();

        saveDraft();

        render();

        showToast(
            "تم مسح البيانات"
        );

    }


    /* =========================================================
       COPY
    ========================================================== */

    function getPlainText() {

        const data =
            getFormData();

        const template =
            PAIC_CONTENT.templates[state.template];


        const parts = [];


        parts.push(
            PAIC_CONTENT.clubName
        );


        parts.push(
            PAIC_CONTENT.collegeName
        );


        parts.push(
            PAIC_CONTENT.universityName
        );


        parts.push("");


        parts.push(
            template.a4.title
        );


        parts.push("");


        parts.push(
            data.recipient ||
            "الجهة الكريمة"
        );


        if (data.recipientName) {

            parts.push(
                data.recipientName
            );

        }


        parts.push("");


        const paragraphs = [

            template.a4.intro,

            template.a4.request,

            template.a4.closing

        ];


        paragraphs.forEach(text => {

            parts.push(
                replaceTokens(
                    text,
                    data
                )
            );

            parts.push("");

        });


        if (data.message) {

            parts.push(
                "تفاصيل إضافية:"
            );

            parts.push(
                data.message
            );

            parts.push("");

        }


        parts.push(
            `${PAIC_CONTENT.publicRelations}: ${safeText(data.prName, "أحمد خالد")}`
        );

        parts.push(
            `التواصل: ${safeText(data.prPhone, "05XXXXXXXX")}`
        );

        parts.push(
            `البريد: ${safeText(data.prEmail, "club@example.com")}`
        );


        return parts.join("\n");

    }


    async function copyLetterText() {

        const text =
            getPlainText();


        try {

            await copyToClipboard(text);

            showToast(
                "تم نسخ نص الخطاب"
            );

        } catch {

            showToast(
                "تعذر نسخ النص"
            );

        }

    }


    async function copyToClipboard(text) {

        if (
            navigator.clipboard &&
            window.isSecureContext
        ) {

            await navigator.clipboard.writeText(
                text
            );

            return;

        }


        const textarea =
            document.createElement("textarea");


        textarea.value = text;

        textarea.style.position = "fixed";
        textarea.style.left = "-9999px";
        textarea.style.top = "0";


        document.body.appendChild(textarea);


        textarea.focus();
        textarea.select();


        const success =
            document.execCommand("copy");


        textarea.remove();


        if (!success) {
            throw new Error("Copy failed");
        }

    }


    /* =========================================================
       SAVE
    ========================================================== */

    function saveCurrentLetter() {

        const data =
            getFormData();


        if (!data.recipient) {

            showToast(
                "اكتب اسم الجهة المستلمة أولًا"
            );

            elements.fields.recipient.focus();

            return;

        }


        const existing =
            state.currentEditingId
                ? state.savedLetters.find(
                    item =>
                        item.id ===
                        state.currentEditingId
                )
                : null;


        const letter = {

            id:
                state.currentEditingId ||
                createId(),

            title:
                data.eventName ||
                data.recipient ||
                PAIC_CONTENT.templates[
                    state.template
                ].uiTitle,

            template:
                state.template,

            paperSize:
                state.paperSize,

            data:
                { ...data },

            updatedAt:
                new Date().toISOString()

        };


        if (existing) {

            const index =
                state.savedLetters.findIndex(
                    item =>
                        item.id ===
                        existing.id
                );


            if (index !== -1) {

                state.savedLetters[index] =
                    letter;

            }

        } else {

            state.savedLetters.unshift(
                letter
            );

        }


        state.currentEditingId =
            letter.id;


        persistSavedLetters();

        renderSavedLetters();

        showToast(
            "تم حفظ الخطاب"
        );

    }


    function createId() {

        return (
            Date.now().toString(36) +
            Math.random()
                .toString(36)
                .slice(2, 8)
        );

    }


    /* =========================================================
       SAVED STORAGE
    ========================================================== */

    function loadSavedLetters() {

        try {

            const raw =
                localStorage.getItem(
                    STORAGE_KEY
                );


            if (!raw) {
                state.savedLetters = [];
                return;
            }


            const parsed =
                JSON.parse(raw);


            state.savedLetters =
                Array.isArray(parsed)
                    ? parsed
                    : [];

        } catch {

            state.savedLetters = [];

        }


        renderSavedLetters();

    }


    function persistSavedLetters() {

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(
                state.savedLetters
            )
        );

    }


    /* =========================================================
       RENDER SAVED
    ========================================================== */

    function renderSavedLetters() {

        elements.savedCount.textContent =
            String(
                state.savedLetters.length
            );


        if (!state.savedLetters.length) {

            elements.savedLetters.innerHTML = `

                <div class="empty-saved">

                    <i class="fa-regular fa-folder-open"></i>

                    <br>

                    لا توجد خطابات محفوظة حتى الآن

                </div>

            `;

            return;

        }


        elements.savedLetters.innerHTML =
            state.savedLetters
                .slice(0, 15)
                .map(item => {

                    const template =
                        PAIC_CONTENT.templates[
                            item.template
                        ];


                    return `

                        <div class="saved-item">

                            <div class="saved-item-main">

                                <strong>
                                    ${escapeHTML(
                                        item.title
                                    )}
                                </strong>

                                <span>
                                    ${
                                        template
                                            ? escapeHTML(
                                                template.uiTitle
                                            )
                                            : ""
                                    }
                                    •
                                    ${
                                        item.paperSize === "square"
                                            ? "مربع"
                                            : "A4"
                                    }
                                </span>

                            </div>


                            <div class="saved-item-actions">

                                <button
                                    type="button"
                                    title="فتح"
                                    data-saved-load="${escapeHTML(item.id)}"
                                >
                                    <i class="fa-solid fa-arrow-up-right-from-square"></i>
                                </button>


                                <button
                                    type="button"
                                    title="حذف"
                                    data-saved-delete="${escapeHTML(item.id)}"
                                >
                                    <i class="fa-regular fa-trash-can"></i>
                                </button>

                            </div>

                        </div>

                    `;

                })
                .join("");

    }


    /* =========================================================
       LOAD SAVED
    ========================================================== */

    function loadSavedLetter(id) {

        const item =
            state.savedLetters.find(
                saved =>
                    saved.id === id
            );


        if (!item) {
            return;
        }


        state.template =
            item.template ||
            "sponsorship";


        state.paperSize =
            item.paperSize ||
            "a4";


        state.currentEditingId =
            item.id;


        Object.entries(item.data || {})
            .forEach(([key, value]) => {

                if (elements.fields[key]) {

                    elements.fields[key].value =
                        value || "";

                }

            });


        updateTemplateButtons();

        updateSizeButtons();

        saveDraft();

        render();

        showToast(
            "تم فتح الخطاب المحفوظ"
        );

    }


    /* =========================================================
       DELETE SAVED
    ========================================================== */

    function deleteSavedLetter(id) {

        const before =
            state.savedLetters.length;


        state.savedLetters =
            state.savedLetters.filter(
                item =>
                    item.id !== id
            );


        if (
            state.savedLetters.length ===
            before
        ) {
            return;
        }


        if (
            state.currentEditingId === id
        ) {

            state.currentEditingId = null;

        }


        persistSavedLetters();

        renderSavedLetters();

        showToast(
            "تم حذف الخطاب"
        );

    }


    /* =========================================================
       DRAFT
    ========================================================== */

    function saveDraft() {

        const draft = {

            template:
                state.template,

            paperSize:
                state.paperSize,

            data:
                getFormData()

        };


        try {

            localStorage.setItem(
                DRAFT_KEY,
                JSON.stringify(draft)
            );

        } catch {

            // Ignore storage errors.

        }

    }


    function loadDraft() {

        try {

            const raw =
                localStorage.getItem(
                    DRAFT_KEY
                );


            if (!raw) {
                return;
            }


            const draft =
                JSON.parse(raw);


            if (
                draft.template &&
                PAIC_CONTENT.templates[
                    draft.template
                ]
            ) {

                state.template =
                    draft.template;

            }


            if (
                draft.paperSize === "a4" ||
                draft.paperSize === "square"
            ) {

                state.paperSize =
                    draft.paperSize;

            }


            Object.entries(
                draft.data || {}
            ).forEach(
                ([key, value]) => {

                    if (
                        elements.fields[key]
                    ) {

                        elements.fields[key].value =
                            value || "";

                    }

                }
            );

        } catch {

            // Ignore malformed draft.

        }


        updateTemplateButtons();

        updateSizeButtons();

    }


    /* =========================================================
       PNG EXPORT
    ========================================================== */

    async function exportPNG() {

        if (
            typeof window.html2canvas !==
            "function"
        ) {

            showToast(
                "أداة حفظ الصور غير متاحة حاليًا"
            );

            return;

        }


        const button =
            elements.pngButton;


        const oldText =
            button.innerHTML;


        button.disabled = true;


        button.innerHTML = `

            <i class="fa-solid fa-spinner fa-spin"></i>

            جاري التصوير...

        `;


        try {

            await waitForFonts();

            await waitForImages(
                elements.letterPaper
            );


            const previousTransform =
                elements.letterPaper.style.transform;


            elements.letterPaper.style.transform =
                "none";


            const canvas =
                await html2canvas(
                    elements.letterPaper,
                    {

                        backgroundColor:
                            "#ffffff",

                        scale:
                            Math.min(
                                2,
                                window.devicePixelRatio ||
                                2
                            ),

                        useCORS:
                            true,

                        allowTaint:
                            false,

                        logging:
                            false,

                        imageTimeout:
                            15000,

                        removeContainer:
                            true,

                        foreignObjectRendering:
                            false

                    }
                );


            elements.letterPaper.style.transform =
                previousTransform;


            const link =
                document.createElement("a");


            const datePart =
                new Date()
                    .toISOString()
                    .slice(0, 10);


            link.download =
                `خطاب-${state.template}-${datePart}.png`;


            link.href =
                canvas.toDataURL(
                    "image/png"
                );


            link.click();


            showToast(
                "تم حفظ الخطاب كصورة PNG"
            );

        } catch (error) {

            console.error(
                "PNG export error:",
                error
            );


            try {

                elements.letterPaper.style.transform =
                    "";

            } catch {}


            showToast(
                "تعذر تصوير الخطاب حاول مرة ثانية"
            );

        } finally {

            button.disabled = false;

            button.innerHTML =
                oldText;

        }

    }


    /* =========================================================
       IMAGE WAIT
    ========================================================== */

    async function waitForImages(container) {

        const images =
            Array.from(
                container.querySelectorAll(
                    "img"
                )
            );


        if (!images.length) {
            return;
        }


        await Promise.all(
            images.map(img => {

                if (img.complete) {

                    return Promise.resolve();

                }


                return new Promise(resolve => {

                    let finished = false;


                    const finish = () => {

                        if (finished) {
                            return;
                        }

                        finished = true;

                        resolve();

                    };


                    img.addEventListener(
                        "load",
                        finish,
                        { once: true }
                    );


                    img.addEventListener(
                        "error",
                        finish,
                        { once: true }
                    );


                    setTimeout(
                        finish,
                        12000
                    );

                });

            })
        );

    }


    async function waitForFonts() {

        if (
            document.fonts &&
            document.fonts.ready
        ) {

            try {

                await document.fonts.ready;

            } catch {

                // Continue anyway.

            }

        }

    }


    /* =========================================================
       PRINT / PDF
    ========================================================== */

    function printLetter() {

        document.body.classList.add(
            "print-mode"
        );


        requestAnimationFrame(() => {

            window.print();

        });

    }


    /* =========================================================
       TOAST
    ========================================================== */

    let toastTimer = null;


    function showToast(message) {

        if (!elements.toast) {
            return;
        }


        const text =
            elements.toast.querySelector(
                "span"
            );


        if (text) {

            text.textContent =
                message;

        }


        elements.toast.classList.add(
            "show"
        );


        clearTimeout(toastTimer);


        toastTimer =
            setTimeout(() => {

                elements.toast.classList.remove(
                    "show"
                );

            }, 2500);

    }


    /* =========================================================
       DEBOUNCE
    ========================================================== */

    function debounce(fn, delay) {

        let timer = null;


        return (...args) => {

            clearTimeout(timer);


            timer =
                setTimeout(
                    () => fn(...args),
                    delay
                );

        };

    }


    /* =========================================================
       START
    ========================================================== */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            init,
            { once: true }
        );

    } else {

        init();

    }

})();