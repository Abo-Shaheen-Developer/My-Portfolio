/* ==========================================================================
   Abo Shaheen Platform - ملف السكريبت الوحيد (للصفحة الرئيسية وصفحة التواصل)
   كل الأكواد هنا، ومفيش أي سكريبت داخل ملفات الـ HTML.

   الفهرس:
   0) الإعدادات (الروابط + سرعات الحركة)   -> عدّل هنا بس
   1) أدوات مساعدة
   2) الخلفية التقنية (أرقام 0 و 1)
   3) الهيرو + السكرول الناعم
   4) التنقل والروابط
   5) الثيم + الأزرار العائمة
   6) ظهور العناصر عند السكرول + صور الكورسات
   7) سلايدر الكورسات | 7-ب) سهم "انزل لتحت"
   8) التشغيل
   ========================================================================== */
(() => {
    "use strict";

    /* ======================================================================
       0) الإعدادات
       ====================================================================== */
    const CONFIG = {
        // مفتاح حفظ الثيم في المتصفح (نفس مفتاح الموقع المرجعي)
        themeStorageKey: "bashmobarmeg-theme",

        // مفتاح حفظ حالة "إيقاف التأثيرات" في المتصفح (بيتشارك بين الرئيسية والتواصل)
        effectsStorageKey: "bashmobarmeg-effects-off",

        // الروابط: ضع الرابط بين علامتي الاقتباس (الفاضي = الزر مش بيعمل حاجة)
        urls: {
            courses: "",                                     // رابط/صفحة الكورسات (لسه فاضي)
            social: {
                youtube: "https://youtube.com/@abo.shaheen.developer", // رابط YouTube
                tiktok: "https://www.tiktok.com/@abo.shaheen.developer?lang=ar", // رابط TikTok
                instagram: "https://www.instagram.com/abo.shaheen.developer/", // رابط Instagram
                github: "https://github.com/Abo-Shaheen-Developer", // رابط GitHub
                linkedin: ""                 // رابط LinkedIn
            }
        },

        // الخلفية التقنية (الأرقام النازلة)
        techBackground: {
            digits: {
                speed: [16, 38],             // سرعة نزول الأعمدة (بكسل/ثانية): أقل = أبطأ
                length: [9, 20],             // طول الذيل (عدد الأرقام)
                density: 0.62,               // نسبة الأعمدة الشغالة من إجمالي الأعمدة
                alpha: 0.42,                 // وضوح الذيل (0..1)
                headAlpha: 0.78,             // وضوح رأس العمود
                flipRate: 0.22               // سرعة تبدّل 0 و 1 (أقل = أهدى)
            }
        },

        // السكرول الناعم + اختفاء الهيرو
        scroll: {
            heroFade: true,                  // الهيرو يصغر ويتبلور مع السكرول لما المحتوى يطلع فوقه
            scrollSmoothness: 9,             // أعلى = أسرع وأحدّ | أقل = أنعم وأطول قصورًا
            heroSmoothness: 7,               // نعومة حركة تصغير/اختفاء العناصر
            wheelMultiplier: 1,              // حساسية عجلة الماوس
            heroDistance: 0.9                // مسافة السكرول لاختفاء الهيرو (نسبة من ارتفاعه)
        }
    };


    /* ======================================================================
       1) أدوات مساعدة
       ====================================================================== */

    // هل المستخدم يفضّل تقليل الحركة؟
    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    // تقييد رقم بين حد أدنى وأقصى
    const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

    // منحنى ناعم للبداية والنهاية (0 → 1)
    const smoothstep = (t) => t * t * (3 - 2 * t);

    // تحويل تقدّم عام (0..1) لتقدّم عنصر معين بين نقطتين
    const mapRange = (progress, from, to) => smoothstep(clamp((progress - from) / (to - from)));

    // أقصى مسافة سكرول ممكنة في الصفحة
    const getMaxScroll = () => document.documentElement.scrollHeight - window.innerHeight;

    // هل التأثيرات متوقفة دلوقتي؟ (الكلاس no-effects على <html>)
    const effectsAreOff = () => document.documentElement.classList.contains("no-effects");

    // فتح رابط خارجي في تبويب جديد (يتجاهل الروابط الفاضية)
    const openExternalLink = (url) => {
        if (!url || url === "#") return;
        window.open(url, "_blank", "noopener,noreferrer");
    };


    /* ======================================================================
       2) الخلفية التقنية: أرقام 0 و 1 نازلة ببطء على canvas
       - كل عمود له سرعة وطول وبداية مختلفة، ورأس العمود هو الأسطع والباقي بيخفت
       - قيمة كل رقم ثابتة وهو نازل، وبتتبدل ببطء شديد (مش وميض)
       - بتقف لما التأثيرات تتوقف أو التبويب يتخبى، وبترسم إطار ثابت مع تقليل الحركة
       ====================================================================== */
    function initTechBackground() {
        const root = document.documentElement;
        const wrapper = document.querySelector(".tech-bg");
        const canvas = wrapper?.querySelector(".tech-bg__digits");
        const context = canvas?.getContext("2d");
        if (!wrapper || !canvas || !context) return;

        const { digits } = CONFIG.techBackground;
        const fontFamily = '"JetBrains Mono", ui-monospace, "Cascadia Code", Consolas, monospace';

        let width = 0, height = 0, dpr = 1;
        let fontSize = 16, lineHeight = 20, columnWidth = 22;
        let columns = [];
        let frameId = 0;
        let lastTime = 0;
        let clock = 0;                          // وقت داخلي بالثواني (بيتوقف مع الإيقاف)

        // ألوان الرقم والرأس (بتتحرك بنعومة عند تبديل الثيم)
        const parseRgb = (value, fallback) => {
            const parts = String(value).split(",").map((part) => parseFloat(part));
            return parts.length === 3 && parts.every(Number.isFinite) ? parts : fallback;
        };
        const readColors = () => {
            const style = getComputedStyle(wrapper);
            return {
                body: parseRgb(style.getPropertyValue("--digit-rgb"), [120, 196, 255]),
                head: parseRgb(style.getPropertyValue("--digit-head-rgb"), [214, 240, 255])
            };
        };
        let target = readColors();
        let current = { body: [...target.body], head: [...target.head] };

        // هاش بسيط ثابت: (عمود، صف، دفعة) -> 0..1
        const hash = (a, b, c) => {
            let h = (a * 374761393 + b * 668265263 + c * 2147483647) | 0;
            h = Math.imul(h ^ (h >>> 13), 1274126177);
            return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
        };
        const random = (min, max) => min + Math.random() * (max - min);

        // إنشاء الأعمدة حسب عرض الشاشة
        const build = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            dpr = Math.min(window.devicePixelRatio || 1, 1.5);
            canvas.width = Math.round(width * dpr);
            canvas.height = Math.round(height * dpr);

            const narrow = width < 700;
            fontSize = narrow ? 14 : 16;
            lineHeight = Math.round(fontSize * 1.35);
            columnWidth = narrow ? 20 : 26;

            const count = Math.ceil(width / columnWidth);
            columns = Array.from({ length: count }, (_, index) => ({
                index,
                active: Math.random() < digits.density,                 // بعض الأعمدة فاضية عشان الشكل مايبقاش مزدحم
                speed: random(digits.speed[0], digits.speed[1]),        // بكسل/ثانية
                length: Math.round(random(digits.length[0], digits.length[1])),
                head: random(-height * 0.4, height * 1.1),              // بداية موزعة على الشاشة كلها
                alpha: random(0.55, 1)                                  // شدة العمود
            }));

            context.setTransform(dpr, 0, 0, dpr, 0, 0);
            context.font = `500 ${fontSize}px ${fontFamily}`;
            context.textAlign = "center";
            context.textBaseline = "middle";
        };

        const rgba = (rgb, alpha) => `rgba(${rgb[0] | 0}, ${rgb[1] | 0}, ${rgb[2] | 0}, ${alpha.toFixed(3)})`;

        const draw = () => {
            context.clearRect(0, 0, width, height);
            context.font = `500 ${fontSize}px ${fontFamily}`;

            for (const column of columns) {
                if (!column.active) continue;
                const x = column.index * columnWidth + columnWidth / 2;
                const headRow = Math.floor(column.head / lineHeight);

                for (let i = 0; i < column.length; i++) {
                    const y = column.head - i * lineHeight;
                    if (y < -lineHeight || y > height + lineHeight) continue;

                    const row = headRow - i;
                    const flipBatch = Math.floor(clock * digits.flipRate + hash(column.index, row, 7) * 10);
                    const value = hash(column.index, row, flipBatch) < 0.5 ? "0" : "1";

                    // الرأس أسطع، وبعده الذيل بيخفت بالتدريج
                    const fade = 1 - i / column.length;
                    if (i === 0) {
                        context.fillStyle = rgba(current.head, digits.headAlpha * column.alpha);
                    } else {
                        context.fillStyle = rgba(current.body, digits.alpha * column.alpha * fade * fade);
                    }
                    context.fillText(value, x, y);
                }
            }
        };

        // تحريك الأعمدة (الزمن بالثواني)
        const step = (deltaTime) => {
            clock += deltaTime;
            for (const column of columns) {
                column.head += column.speed * deltaTime;
                if (column.head - column.length * lineHeight > height) {
                    // العمود خرج من تحت: يرجع من فوق بسرعة وطول جداد
                    column.head = random(-height * 0.25, 0);
                    column.speed = random(digits.speed[0], digits.speed[1]);
                    column.length = Math.round(random(digits.length[0], digits.length[1]));
                    column.active = Math.random() < digits.density;
                    column.alpha = random(0.55, 1);
                }
            }
        };

        // تقريب لون لهدفه (بنعومة)
        const easeColors = (deltaTime) => {
            const amount = 1 - Math.exp(-deltaTime * 3.2);
            let moving = false;
            for (const key of ["body", "head"]) {
                for (let i = 0; i < 3; i++) {
                    const difference = target[key][i] - current[key][i];
                    if (Math.abs(difference) > 0.4) {
                        current[key][i] += difference * amount;
                        moving = true;
                    } else {
                        current[key][i] = target[key][i];
                    }
                }
            }
            return moving;
        };

        const tick = (now) => {
            frameId = 0;
            if (effectsAreOff() || document.hidden) {
                lastTime = 0;
                return;
            }
            const deltaTime = Math.min((now - (lastTime || now)) / 1000, 0.05);
            lastTime = now;
            easeColors(deltaTime);
            step(deltaTime);
            draw();
            frameId = requestAnimationFrame(tick);
        };

        const start = () => {
            if (reducedMotionQuery.matches) {
                draw();                                  // تقليل الحركة: إطار ثابت
                return;
            }
            if (!frameId && !effectsAreOff() && !document.hidden) frameId = requestAnimationFrame(tick);
        };

        const stop = () => {
            if (frameId) cancelAnimationFrame(frameId);
            frameId = 0;
            lastTime = 0;
        };

        // تغيير الثيم: نقرأ ألوان الثيم الجديد ونتحرك ليها
        new MutationObserver(() => {
            target = readColors();
            if (reducedMotionQuery.matches) {
                current = { body: [...target.body], head: [...target.head] };
                draw();
            } else {
                start();
            }
        }).observe(root, { attributes: true, attributeFilter: ["class"] });

        window.addEventListener("effectschange", () => {
            if (effectsAreOff()) {
                stop();
                context.clearRect(0, 0, width, height); // نمسح آخر إطار من الأرقام
            } else {
                start();
            }
        });
        document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));

        let resizeTimer = 0;
        window.addEventListener("resize", () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                build();
                if (reducedMotionQuery.matches) draw();
            }, 150);
        });

        build();
        // نستنى الخط البرمجي لو اتحمّل (لو فشل بنكمل بالخط الاحتياطي)
        const begin = () => { build(); start(); };
        if (document.fonts?.load) {
            document.fonts.load(`500 ${fontSize}px "JetBrains Mono"`).then(begin, begin);
        } else {
            start();
        }
    }


    /* ======================================================================
       3) الهيرو + السكرول الناعم
       - سكرول ناعم بقصور ذاتي (للماوس / التراك باد)
       - الهيرو (العنوان + الوصف + الدائرة + الصورة) يفضل في مكانه ويصغر ويتبلور
         لحد ما يختفي، والأيقونات ترجع جوه الدائرة. والعكس لما نطلع لفوق.
       ====================================================================== */
    function initHeroScroll() {
        const hero = document.querySelector(".hero");
        if (!hero) return;                      // صفحة التواصل مفيهاش هيرو
        if (reducedMotionQuery.matches) return; // تقليل الحركة: سكرول عادي بدون تأثيرات

        const { heroFade, scrollSmoothness, heroSmoothness, wheelMultiplier, heroDistance: heroDistanceRatio } = CONFIG.scroll;

        // تقدّم الهيرو من مكان السكرول (0 دايمًا لو الاختفاء مقفول)
        // مسافة الاختفاء الفعلية: متتعداش أقصى سكرول متاح دلوقتي (بتتحسب لحظيًا لأن طول الصفحة بيتغير مع أنيميشن ظهور الكروت)
        // فلو الصفحة قصيرة، الصورة بتتبلور وتصغر وتختفي تمامًا عند آخر سكرول بدل ما تفضل ظاهرة
        // (بنحسبها من طول الـ layout الفعلي مش scrollHeight، لأن حركات الـ transform بتزوّد scrollHeight مؤقتًا)
        const getLayoutMaxScroll = () => document.body.offsetHeight - window.innerHeight;
        const getHeroDistance = () => Math.max(1, Math.min(heroDistance, getLayoutMaxScroll()));
        const getHeroTarget = () => (heroFade ? clamp(window.scrollY / getHeroDistance()) : 0);

        /* ---------- الحالة ---------- */
        let heroDistance = 1;               // مسافة السكرول اللي الهيرو بيختفي فيها (بالبكسل)
        let heroCurrent = 0;                // تقدّم الهيرو المعروض (بعد القصور الذاتي)
        let wheelActive = false;            // هل السكرول الناعم شغال دلوقتي؟
        let scrollTarget = window.scrollY;  // المكان المطلوب الوصول له
        let scrollCurrent = window.scrollY; // المكان الحالي أثناء الحركة
        let lastSet = window.scrollY;       // آخر مكان ضبطناه بالكود (عشان نفرّق عن سكرول المستخدم)
        let frameId = 0;
        let lastTime = 0;
        let lastApplied = -1;

        // حساب مسافة الاختفاء من ارتفاع الهيرو
        const measure = () => {
            heroDistance = Math.max(1, hero.offsetHeight * heroDistanceRatio);
            wake();
        };

        // تطبيق التقدّم على عناصر الهيرو عن طريق متغيرات CSS
        const apply = (progress) => {
            if (Math.abs(progress - lastApplied) < 0.00005) return;
            lastApplied = progress;

            // الأقرب للمحتوى القادم من تحت يختفي أول: الوصف ← العنوان ← الدائرة والصورة
            const subtitle = mapRange(progress, 0.00, 0.62);
            const title = mapRange(progress, 0.08, 0.72);
            const portrait = mapRange(progress, 0.16, 1.00);

            // الأيقونات ترجع للدائرة بدري، وبعدين تتلاشى (بالشفافية فقط) وهي جوه
            const iconsRetract = mapRange(progress, 0.00, 0.50);
            const iconsFade = mapRange(progress, 0.20, 0.40);

            const style = hero.style;
            style.setProperty("--subtitle-progress", subtitle.toFixed(4));
            style.setProperty("--title-progress", title.toFixed(4));
            style.setProperty("--portrait-progress", portrait.toFixed(4));
            style.setProperty("--icons-retract", iconsRetract.toFixed(4));
            style.setProperty("--icons-fade", iconsFade.toFixed(4));
            hero.classList.toggle("is-gone", progress >= 0.999);
        };

        /* ---------- حلقة الحركة (تشتغل بس لما يكون فيه حركة) ---------- */
        const tick = (now) => {
            frameId = 0;
            const deltaTime = Math.min((now - (lastTime || now)) / 1000, 0.05);
            lastTime = now;

            // التأثيرات اتوقفت: نوقف السكرول الناعم وحركة الهيرو فورًا
            if (effectsAreOff()) {
                wheelActive = false;
                lastTime = 0;
                return;
            }

            // 1) سكرول ناعم بقصور ذاتي
            if (wheelActive) {
                const difference = scrollTarget - scrollCurrent;
                if (Math.abs(difference) < 0.4) {
                    scrollCurrent = scrollTarget;
                    wheelActive = false;
                } else {
                    scrollCurrent += difference * (1 - Math.exp(-deltaTime * scrollSmoothness));
                }
                lastSet = scrollCurrent;
                window.scrollTo({ top: scrollCurrent, left: 0, behavior: "instant" });
            }

            // 2) تقدّم الهيرو بقصور ذاتي (شغال مع الماوس واللمس والكيبورد)
            const heroTarget = getHeroTarget();
            const heroDifference = heroTarget - heroCurrent;
            if (Math.abs(heroDifference) < 0.0004) {
                heroCurrent = heroTarget;
            } else {
                heroCurrent += heroDifference * (1 - Math.exp(-deltaTime * heroSmoothness));
            }
            apply(heroCurrent);

            // نكمل الحلقة طالما لسه فيه حركة، ونوقفها لتوفير الأداء
            if (wheelActive || heroCurrent !== heroTarget) {
                frameId = requestAnimationFrame(tick);
            } else {
                lastTime = 0;
            }
        };

        function wake() {
            if (!frameId) frameId = requestAnimationFrame(tick);
        }

        /* ---------- الأحداث ---------- */
        window.addEventListener("wheel", (event) => {
            if (effectsAreOff()) return;                                          // التأثيرات متوقفة: سكرول عادي
            if (event.ctrlKey || event.defaultPrevented) return;                  // زووم
            if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;          // سكرول أفقي (مثلًا سلايدر المشاريع)

            let delta = event.deltaY;
            if (event.deltaMode === 1) delta *= 40;                               // وحدة السطور
            else if (event.deltaMode === 2) delta *= window.innerHeight;          // وحدة الصفحات

            event.preventDefault();

            if (!wheelActive) {
                scrollCurrent = window.scrollY;
                scrollTarget = window.scrollY;
            }
            scrollTarget = clamp(scrollTarget + delta * wheelMultiplier, 0, getMaxScroll());
            wheelActive = true;
            wake();
        }, { passive: false });

        // أي سكرول من برا السكرول الناعم (لمس، كيبورد، شريط التمرير، روابط): نزامن ونكمل
        window.addEventListener("scroll", () => {
            if (wheelActive && Math.abs(window.scrollY - lastSet) > 3) {
                wheelActive = false;
            }
            if (!wheelActive) {
                scrollTarget = scrollCurrent = lastSet = window.scrollY;
            }
            wake();
        }, { passive: true });

        // تشغيل التأثيرات تاني: نزامن المكان الحالي ونكمل
        window.addEventListener("effectschange", () => {
            scrollTarget = scrollCurrent = lastSet = window.scrollY;
            wheelActive = false;
            heroCurrent = getHeroTarget();
            apply(heroCurrent);
            wake();
        });

        window.addEventListener("resize", measure);
        window.addEventListener("load", measure);
        if ("ResizeObserver" in window) {
            const observer = new ResizeObserver(measure);
            observer.observe(hero);
            observer.observe(document.body);        // تغيّر طول الصفحة (تحميل صور الكورسات مثلًا)
        }

        measure();
        heroCurrent = getHeroTarget();
        apply(heroCurrent);
    }


    /* ======================================================================
       4) التنقل والروابط (الأزرار بتتعرف عليها من data-nav / data-project / data-social)
       ====================================================================== */
    function initNavigation() {
        // أزرار الهيدر
        const navigationActions = {
            home: () => { window.location.href = "index.html"; },
            contact: () => { window.location.href = "contact.html"; },
            courses: () => openExternalLink(CONFIG.urls.courses),
            author: () => { window.location.href = "../index.html"; } // البورتفوليو = الصفحة الرئيسية للموقع (مسار داخل المشروع)
        };

        document.querySelectorAll("[data-nav]").forEach((button) => {
            button.addEventListener("click", navigationActions[button.dataset.nav] || (() => {}));
        });

        // أزرار التواصل في الفوتر
        document.querySelectorAll("[data-social]").forEach((button) => {
            button.addEventListener("click", () => {
                openExternalLink(CONFIG.urls.social[button.dataset.social]);
            });
        });
    }


    /* ======================================================================
       5) الثيم + الأزرار العائمة
       ====================================================================== */
    function initThemeAndToolbar() {
        const root = document.documentElement;
        const themeButton = document.querySelector("[data-action='toggle-theme']");

        // تفعيل الثيم الداكن أو الفاتح وتحديث الزر وحفظ الاختيار
        const setTheme = (isDark) => {
            root.classList.toggle("theme-dark", isDark);

            if (themeButton) {
                const icon = themeButton.querySelector("i");
                if (icon) icon.className = isDark ? "fa-solid fa-sun" : "fa-solid fa-moon";
                themeButton.setAttribute("aria-label", isDark ? "تفعيل الوضع الفاتح" : "تفعيل الوضع الداكن");
                themeButton.title = isDark ? "الوضع الفاتح" : "الوضع الداكن";
            }

            try {
                localStorage.setItem(CONFIG.themeStorageKey, isDark ? "dark" : "light");
            } catch (_) { /* التخزين غير متاح: نكمل بدون حفظ */ }
        };

        // استرجاع الثيم المحفوظ (الافتراضي: فاتح)
        let savedTheme = "light";
        try {
            savedTheme = localStorage.getItem(CONFIG.themeStorageKey) || "light";
        } catch (_) { /* التخزين غير متاح */ }
        setTheme(savedTheme === "dark");

        // تبديل الثيم عند الضغط
        themeButton?.addEventListener("click", () => {
            setTheme(!root.classList.contains("theme-dark"));
        });

        // زر إيقاف/تشغيل التأثيرات
        initEffectsToggle();
    }

    /* إيقاف/تشغيل كل التأثيرات: السكرول الناعم + الحركات + التدرجات (الشكل في style.css تحت .no-effects) */
    function initEffectsToggle() {
        const root = document.documentElement;
        const button = document.querySelector("[data-action='toggle-effects']");

        const setEffectsOff = (isOff) => {
            root.classList.toggle("no-effects", isOff);

            if (button) {
                const icon = button.querySelector("i");
                if (icon) icon.className = isOff ? "fa-solid fa-circle-play" : "fa-solid fa-circle-pause";
                button.setAttribute("aria-pressed", String(isOff));
                button.setAttribute("aria-label", isOff ? "تشغيل التأثيرات" : "إيقاف التأثيرات");
                button.title = isOff ? "تشغيل التأثيرات" : "إيقاف التأثيرات";
            }

            // نبلّغ باقي الأكواد (الهيرو) عشان ترجع/توقف حسب الحالة
            window.dispatchEvent(new Event("effectschange"));

            try {
                if (isOff) localStorage.setItem(CONFIG.effectsStorageKey, "1");
                else localStorage.removeItem(CONFIG.effectsStorageKey);
            } catch (_) { /* التخزين غير متاح: نكمل بدون حفظ */ }
        };

        // استرجاع الحالة المحفوظة
        let savedOff = false;
        try {
            savedOff = localStorage.getItem(CONFIG.effectsStorageKey) === "1";
        } catch (_) { /* التخزين غير متاح */ }
        if (savedOff) setEffectsOff(true);

        button?.addEventListener("click", () => {
            setEffectsOff(!effectsAreOff());
        });
    }


    /* ======================================================================
       6) ظهور العناصر عند الوصول إليها بالسكرول (بيضيف الكلاس is-visible)
       ====================================================================== */
    function initScrollReveal() {
        const slider = document.querySelector(".projects-slider");
        const footer = document.querySelector(".site-footer:not(.site-footer--fixed)"); // فوتر صفحة التواصل ثابت وليه أنيميشن دخول خاص

        const getCards = () => slider
            ? [
                ...slider.querySelectorAll(".project-card"),
                ...(slider.closest(".section")?.querySelectorAll(".section__button") || []) // زر "اشترك الآن" الواحد
            ]
            : [];
        const showAll = (elements) => elements.forEach((element) => element.classList.add("is-visible"));

        // متصفح قديم بدون IntersectionObserver: نظهر كل حاجة فورًا
        if (!("IntersectionObserver" in window)) {
            showAll(getCards());
            footer?.classList.add("is-visible");
            return;
        }

        // الكورسات كلها بتظهر مرة واحدة (حتى المخفية جوه السلايدر) عشان تفضل بنفس الشكل بعد التمرير
        if (slider) {
            const sliderObserver = new IntersectionObserver((entries) => {
                if (!entries.some((entry) => entry.isIntersecting)) return;
                showAll(getCards());
                sliderObserver.disconnect();
            }, { threshold: 0.12, rootMargin: "0px 0px -35px 0px" });
            sliderObserver.observe(slider);
        }

        // مراقب الفوتر
        if (footer) {
            const footerObserver = new IntersectionObserver((entries) => {
                if (entries.some((entry) => entry.isIntersecting)) {
                    footer.classList.add("is-visible");
                    footerObserver.disconnect();
                }
            }, { threshold: 0.15 });
            footerObserver.observe(footer);
        }
    }


    /* ======================================================================
       7) سلايدر الكورسات
       - الكورسات جنب بعض بنفس الحجم (العدد الظاهر بيتحدد من CSS)
       - أي كورس جديد بيتحط في .projects-slider__track بياخد نفس الحجم والمكان
       - الأسهم بتظهر لوحدها لما يكون فيه مشاريع مخفية، وبتتعطل عند أول/آخر كورس
       ====================================================================== */
    function initProjectsSlider() {
        const slider = document.querySelector(".projects-slider");
        if (!slider) return;

        const viewport = slider.querySelector(".projects-slider__viewport");
        const track = slider.querySelector(".projects-slider__track");
        // الأسهم موجودة في القسم نفسه (ورا البطاقة الزجاجية) مش جوه السلايدر
        const host = slider.closest(".section") || slider;
        const previousButton = host.querySelector(".projects-slider__arrow--previous");
        const nextButton = host.querySelector(".projects-slider__arrow--next");
        if (!viewport || !track || !previousButton || !nextButton) return;

        const EDGE_TOLERANCE = 2; // هامش بالبكسل لاعتبار إن الوصول للحافة تم

        // مسافة التمرير من البداية (موجبة دايمًا حتى في RTL)
        const getPosition = () => Math.abs(viewport.scrollLeft);

        // أقصى مسافة تمرير
        const getMaxPosition = () => Math.max(0, viewport.scrollWidth - viewport.clientWidth);

        // خطوة الكارت الواحد = عرضه + المسافة بينه وبين اللي بعده
        const getCardStep = () => {
            const cards = track.children;
            if (cards.length < 2) return viewport.clientWidth;
            return Math.abs(cards[1].offsetLeft - cards[0].offsetLeft) || viewport.clientWidth;
        };

        // عدد الكورسات الظاهرة حاليًا في الشاشة
        const getVisibleCount = () => {
            const cards = track.children;
            if (!cards.length) return 1;
            const step = getCardStep();
            const gap = Math.max(0, step - cards[0].offsetWidth);
            return Math.max(1, Math.round((viewport.clientWidth + gap) / step));
        };

        // التمرير لكورس معين بحركة جانبية ناعمة
        const goToIndex = (index) => {
            const position = clamp(index * getCardStep(), 0, getMaxPosition());
            const isRtl = getComputedStyle(viewport).direction === "rtl";
            viewport.scrollTo({
                left: isRtl ? -position : position,
                behavior: (reducedMotionQuery.matches || effectsAreOff()) ? "auto" : "smooth"
            });
        };

        // رقم أول كورس ظاهر حاليًا
        const getCurrentIndex = () => Math.round(getPosition() / getCardStep());

        // تحديث حالة الأسهم (إظهار / تعطيل)
        const updateArrows = () => {
            const max = getMaxPosition();
            const position = getPosition();
            host.classList.toggle("is-scrollable", max > EDGE_TOLERANCE);
            previousButton.disabled = position <= EDGE_TOLERANCE;
            nextButton.disabled = position >= max - EDGE_TOLERANCE;
        };

        // تحديث واحد في كل فريم أثناء التمرير
        let frameId = 0;
        const scheduleUpdate = () => {
            if (frameId) return;
            frameId = requestAnimationFrame(() => {
                frameId = 0;
                updateArrows();
            });
        };

        // الضغط على الأسهم: نتحرك بمقدار الصفحة الظاهرة كلها
        nextButton.addEventListener("click", () => goToIndex(getCurrentIndex() + getVisibleCount()));
        previousButton.addEventListener("click", () => goToIndex(getCurrentIndex() - getVisibleCount()));

        // أحداث التحديث: تمرير / تغيير المقاس / إضافة كورس جديد
        viewport.addEventListener("scroll", scheduleUpdate, { passive: true });
        window.addEventListener("resize", scheduleUpdate);
        if ("ResizeObserver" in window) new ResizeObserver(scheduleUpdate).observe(viewport);
        if ("MutationObserver" in window) new MutationObserver(scheduleUpdate).observe(track, { childList: true });

        updateArrows();
    }


    /* ======================================================================
       6-ب) صور الكورسات: بتدوّر على img/courses/course-N بأي امتداد (webp / png / jpg / jpeg)
       - لو مفيش صورة بأي امتداد: بتفضل مكانها الفاضي باسم الملف المطلوب
       ====================================================================== */
    function initCourseImages() {
        const extensions = ["webp", "png", "jpg", "jpeg"];

        document.querySelectorAll("[data-course-image]").forEach((image) => {
            const base = image.dataset.courseImage;
            let attempt = 0;

            const tryNext = () => {
                attempt += 1;
                if (attempt < extensions.length) image.src = `${base}.${extensions[attempt]}`;
                else image.classList.add("is-missing");
            };

            image.addEventListener("error", tryNext);
            // الخطأ ممكن يكون حصل قبل ما السكريبت يشتغل
            if (image.complete && image.naturalWidth === 0 && image.currentSrc) tryNext();
        });
    }


    /* ======================================================================
       7-ب) سهم "انزل لتحت": بيظهر أول الصفحة وبيختفي أول ما المستخدم ينزل
       ====================================================================== */
    function initScrollHint() {
        const hint = document.querySelector(".scroll-hint");
        if (!hint) return;

        const update = () => hint.classList.toggle("is-hidden", window.scrollY > 40);
        window.addEventListener("scroll", update, { passive: true });
        update();
    }


    /* ======================================================================
       8) التشغيل
       ====================================================================== */
    initThemeAndToolbar();
    initNavigation();
    initScrollReveal();
    initCourseImages();
    initProjectsSlider();
    initScrollHint();
    initTechBackground();
    initHeroScroll();
})();
