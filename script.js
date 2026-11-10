/* ==========================================================================
   BashMobarmeg - ملف السكريبت الوحيد (للصفحة الرئيسية وصفحة التواصل)
   كل الأكواد هنا، ومفيش أي سكريبت داخل ملفات الـ HTML.

   الفهرس:
   0) الإعدادات (الروابط + سرعات الحركة)   -> عدّل هنا بس
   1) أدوات مساعدة
   2) النجوم  (2-ب: خلفية الفضاء)
   3) الهيرو + السكرول الناعم
   4) التنقل والروابط
   5) الثيم + الأزرار العائمة
   6) ظهور العناصر عند السكرول
   7) سلايدر المشاريع
   8) التشغيل
   ========================================================================== */
(() => {
    "use strict";

    /* ======================================================================
       0) الإعدادات
       ====================================================================== */
    const CONFIG = {
        // مفتاح حفظ الثيم في المتصفح
        themeStorageKey: "bashmobarmeg-theme",

        // مفتاح حفظ حالة "إيقاف التأثيرات" في المتصفح (بيتشارك بين الرئيسية والتواصل)
        effectsStorageKey: "bashmobarmeg-effects-off",

        // الروابط: ضع الرابط بين علامتي الاقتباس (الفاضي = الزر مش بيعمل حاجة)
        urls: {
            store: "",                       // رابط المتجر
            platform: "",                    // رابط المنصة
            projects: {
                1: "https://abo-shaheen-developer.github.io/Himma/",        // رابط مشروع "همّه"
                2: "https://abo-shaheen-developer.github.io/calculator/",   // رابط مشروع "الآلة الحاسبة"
                3: "https://abo-shaheen-developer.github.io/Puzzle-game/"   // رابط مشروع "لعبة الألغاز"
            },
            social: {
                youtube: "https://youtube.com/@abo.shaheen.developer", // رابط YouTube
                tiktok: "", // رابط TikTok
                instagram: "https://www.instagram.com/abo.shaheen.developer/", // رابط Instagram
                github: "https://github.com/Abo-Shaheen-Developer", // رابط GitHub
                linkedin: ""                 // رابط LinkedIn
            }
        },

        // النجوم: range = مسافة الحركة (بالبكسل) على طول الصفحة كلها. زوّدها = النجوم أسرع مع السكرول
        stars: {
            smoothing: 0.1,                  // نعومة اللحاق بالسكرول (أعلى = أسرع استجابة)
            layers: [
                { count: 10, range: 60,  size: [1, 1.4] },     // طبقة بعيدة: أبطأ وأصغر
                { count: 9,  range: 110, size: [1.2, 1.8] },   // طبقة متوسطة
                { count: 7,  range: 170, size: [1.6, 2.2] }    // طبقة قريبة: أسرع وأكبر
            ]
        },

        // خلفية الفضاء: درب التبانة (يمين) + سُدم + غبار نجوم
        cosmos: {
            smoothing: 0.08,                 // نعومة اللحاق بالسكرول (أقل = أنعم)
            galaxy: { size: [0.36, 0.48], speed: 0.16, spin: 260, opacity: 0.75, blur: 2.2 },
            saturn: { size: [0.30, 0.38], speed: 0.12, sway: 46, opacity: 0.75, blur: 2.2 },  // زحل (شمال) | sway = ثواني التمايل
            // size = نسبة من عرض الشاشة (أدنى، أقصى) | speed = سرعة الطلوع مع السكرول (1 = نفس سرعة الصفحة)
            // spin = ثواني اللفة الكاملة | opacity = الوضوح | blur = الضبابية بالبكسل
            nebulae: { count: 4, speed: 0.05 },                                         // عدد السُدم وسرعة طلوعها مع السكرول
            dust: { count: 260, speed: 0.03 }                                           // عدد نجوم الغبار وسرعة طلوعها
        },

        // السكرول الناعم + اختفاء الهيرو
        scroll: {
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
       2) النجوم: قليلة وصغيرة ومتفرقة، بتلمع، وبتطلع لفوق مع السكرول
       ====================================================================== */
    function initStars() {
        const host = document.querySelector(".stars");
        if (!host) return;

        // مولّد أرقام عشوائية ثابت: النجوم في نفس أماكنها كل مرة
        let seed = 20240611;
        const random = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
        const between = (min, max) => min + random() * (max - min);

        const layerConfigs = CONFIG.stars.layers;

        // إنشاء الطبقات والنجوم
        const layerElements = layerConfigs.map((config) => {
            const layer = document.createElement("div");
            layer.className = "stars__layer";

            // شبكة بسيطة + انحراف عشوائي = توزيع متفرق بدون تكتل
            const columns = 4;
            const rows = Math.ceil(config.count / columns);

            for (let i = 0; i < config.count; i++) {
                const column = i % columns;
                const row = Math.floor(i / columns);
                const size = between(config.size[0], config.size[1]);
                const star = document.createElement("span");

                star.className = "stars__star";
                star.style.cssText =
                    `left:${(((column + between(.1, .9)) / columns) * 100).toFixed(2)}%;` +
                    `top:${(((row + between(.1, .9)) / rows) * 100).toFixed(2)}%;` +
                    `width:${size.toFixed(2)}px;height:${size.toFixed(2)}px;` +
                    `--lo:${between(.1, .3).toFixed(2)};--hi:${between(.7, 1).toFixed(2)};` +
                    `--twinkle-duration:${between(2.8, 6).toFixed(2)}s;--twinkle-delay:${(-between(0, 6)).toFixed(2)}s;` +
                    `--drift-duration:${between(10, 20).toFixed(2)}s;--drift-delay:${(-between(0, 10)).toFixed(2)}s;` +
                    `--drift-x:${between(-4, 4).toFixed(2)}px;--drift-y:${between(-5, 5).toFixed(2)}px`;

                layer.appendChild(star);
            }

            host.appendChild(layer);
            return layer;
        });

        // من يفضّل تقليل الحركة: نجوم ثابتة بدون حركة سكرول
        if (reducedMotionQuery.matches) return;

        let current = 0;     // التقدّم المعروض (بعد النعومة)
        let target = 0;      // التقدّم المطلوب (من السكرول الفعلي)
        let frameId = 0;

        // تقدّم السكرول من 0 لـ 1
        const getProgress = () => {
            const max = getMaxScroll();
            return max > 0 ? clamp(window.scrollY / max) : 0;
        };

        // رسم الطبقات: كل طبقة بتتحرك بمدى مختلف لعمق وهمي
        const render = () => {
            frameId = 0;
            current += (target - current) * CONFIG.stars.smoothing;
            if (Math.abs(target - current) < 0.0005) current = target;

            layerElements.forEach((layer, index) => {
                const y = -(current - 0.5) * layerConfigs[index].range;
                layer.style.transform = `translate3d(0, ${y.toFixed(2)}px, 0)`;
            });

            if (current !== target) frameId = requestAnimationFrame(render);
        };

        const onScroll = () => {
            target = getProgress();
            if (!frameId) frameId = requestAnimationFrame(render);
        };

        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onScroll);
        target = current = getProgress();
        render();
    }


    /* ======================================================================
       2-ب) خلفية الفضاء: درب التبانة (يمين) + سُدم + غبار نجوم
       الجرمين بيترسموا مرة واحدة على canvas في أماكن وأحجام وميلان عشوائي،
       ويطلعوا لفوق مع السكرول (الأبعد = الأبطأ)
       ====================================================================== */
    function initCosmos() {
        const host = document.querySelector(".cosmos");
        if (!host) return;

        const settings = CONFIG.cosmos;
        const rand = (min, max) => min + Math.random() * (max - min);
        const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5; // توزيع جرسي تقريبي (-1..1)
        const pick = (list) => list[Math.floor(Math.random() * list.length)];

        // رسم درب التبانة: نواة صفراء + قضيب مركزي + 4 أذرع حلزونية + سحب غبار داكنة
        const drawGalaxy = (canvas) => {
            const size = canvas.width = canvas.height = 760;
            const ctx = canvas.getContext("2d");
            const center = size / 2;
            const radius = size * 0.46;
            ctx.globalCompositeOperation = "lighter";

            // هالة النواة
            const halo = ctx.createRadialGradient(center, center, 0, center, center, size / 2);
            halo.addColorStop(0, "rgba(255,238,200,.9)");
            halo.addColorStop(0.12, "rgba(255,205,140,.45)");
            halo.addColorStop(0.35, "rgba(190,150,255,.16)");
            halo.addColorStop(0.7, "rgba(80,110,255,.07)");
            halo.addColorStop(1, "rgba(0,0,0,0)");
            ctx.fillStyle = halo;
            ctx.fillRect(0, 0, size, size);

            const arms = 4;
            const twist = rand(4.2, 5.4);                    // قد إيه الذراع بيلف
            const barAngle = rand(0, Math.PI);               // اتجاه القضيب المركزي
            const armColor = (t) => {                        // لون حسب البعد عن النواة
                if (Math.random() < 0.06) return "255,130,190";   // مناطق تكوّن نجوم وردي
                if (t < 0.3) return "255,226,180";
                if (t < 0.6) return "190,200,255";
                return "140,185,255";
            };

            // سحب ضوء ناعمة على الأذرع
            for (let i = 0; i < 300; i++) {
                const arm = Math.floor(Math.random() * arms);
                const t = Math.pow(Math.random(), 0.85);
                const angle = barAngle + arm * (Math.PI / 2) + t * twist + gauss() * 0.2;
                const r = (0.18 + 0.82 * t) * radius;
                const x = center + Math.cos(angle) * r;
                const y = center + Math.sin(angle) * r;
                const blob = rand(22, 58);
                const g = ctx.createRadialGradient(x, y, 0, x, y, blob);
                g.addColorStop(0, `rgba(${armColor(t)},${arm % 2 ? 0.07 : 0.12})`);
                g.addColorStop(1, "rgba(0,0,0,0)");
                ctx.fillStyle = g;
                ctx.fillRect(x - blob, y - blob, blob * 2, blob * 2);
            }

            // نجوم الأذرع (الذراعين الرئيسيين أكثف)
            for (let i = 0; i < 22000; i++) {
                const arm = Math.floor(Math.random() * arms);
                if (arm % 2 && Math.random() < 0.5) continue;
                const t = Math.pow(Math.random(), 0.8);
                const spread = (0.035 + 0.12 * t) * radius;
                const angle = barAngle + arm * (Math.PI / 2) + t * twist;
                const r = (0.18 + 0.82 * t) * radius;
                const x = center + Math.cos(angle) * r + gauss() * spread;
                const y = center + Math.sin(angle) * r + gauss() * spread;
                ctx.fillStyle = `rgba(${armColor(t)},${rand(0.25, 0.75).toFixed(2)})`;
                const dot = rand(0.8, 2.2);
                ctx.fillRect(x, y, dot, dot);
            }

            // القضيب المركزي (نجوم ذهبية ممدودة) + انتفاخ النواة
            for (let i = 0; i < 6000; i++) {
                const along = gauss() * radius * 0.2;
                const across = gauss() * radius * 0.045;
                const bulge = gauss() * radius * 0.09;
                const useBar = Math.random() < 0.65;
                const x = center + (useBar ? Math.cos(barAngle) * along - Math.sin(barAngle) * across : bulge);
                const y = center + (useBar ? Math.sin(barAngle) * along + Math.cos(barAngle) * across : gauss() * radius * 0.09);
                ctx.fillStyle = `rgba(255,${Math.floor(rand(190, 235))},${Math.floor(rand(120, 180))},${rand(0.3, 0.8).toFixed(2)})`;
                const dot = rand(0.8, 2);
                ctx.fillRect(x, y, dot, dot);
            }

            // ممرات الغبار الداكنة: بتقطع النور على حافة الأذرع
            ctx.globalCompositeOperation = "destination-out";
            for (let i = 0; i < 90; i++) {
                const arm = Math.floor(Math.random() * arms);
                const t = rand(0.12, 0.85);
                const angle = barAngle + arm * (Math.PI / 2) + t * twist - 0.12;
                const r = (0.18 + 0.82 * t) * radius;
                const x = center + Math.cos(angle) * r;
                const y = center + Math.sin(angle) * r;
                const blob = rand(12, 30);
                const g = ctx.createRadialGradient(x, y, 0, x, y, blob);
                g.addColorStop(0, "rgba(0,0,0,.28)");
                g.addColorStop(1, "rgba(0,0,0,0)");
                ctx.fillStyle = g;
                ctx.fillRect(x - blob, y - blob, blob * 2, blob * 2);
            }

            // تنعيم الحواف: ما يبقاش فيه قص حاد
            const mask = ctx.createRadialGradient(center, center, size * 0.28, center, center, size / 2);
            mask.addColorStop(0, "rgba(0,0,0,1)");
            mask.addColorStop(1, "rgba(0,0,0,0)");
            ctx.globalCompositeOperation = "destination-in";
            ctx.fillStyle = mask;
            ctx.fillRect(0, 0, size, size);
        };

        // رسم زحل: توهج + حلقات خلفية + كوكب بأحزمة وظل + حلقات أمامية
        const drawSaturn = (canvas) => {
            const size = canvas.width = canvas.height = 760;
            const ctx = canvas.getContext("2d");
            const c = size / 2;
            const R = size * 0.17;                           // نصف قطر الكوكب
            const squash = 0.26;                             // تفلطح الحلقات (ميلها عن الشاشة)
            const ringIn = R * 1.28;
            const ringOut = R * 2.2;

            // هالة ناعمة حوالين الكوكب
            const halo = ctx.createRadialGradient(c, c, R * 0.8, c, c, size / 2);
            halo.addColorStop(0, "rgba(255,215,150,.22)");
            halo.addColorStop(0.45, "rgba(190,150,255,.08)");
            halo.addColorStop(1, "rgba(0,0,0,0)");
            ctx.fillStyle = halo;
            ctx.fillRect(0, 0, size, size);

            // الحلقات: خطوط بيضاوية رفيعة كتير (فيها فجوة كاسيني)، نصف خلفي ونصف أمامي
            const drawRings = (from, to) => {
                const steps = 90;
                for (let i = 0; i < steps; i++) {
                    const t = i / (steps - 1);
                    const r = ringIn + (ringOut - ringIn) * t;
                    if (t > 0.56 && t < 0.64) continue;      // فجوة كاسيني
                    const band = 0.5 + 0.5 * Math.sin(t * 38) * Math.sin(t * 11 + 1.3);
                    const edgeFade = Math.min(1, t * 9, (1 - t) * 6);
                    const alpha = (0.16 + 0.38 * band) * edgeFade * (t > 0.64 ? 0.8 : 1);
                    ctx.strokeStyle = `rgba(${Math.round(222 - 30 * t)},${Math.round(196 - 36 * t)},${Math.round(150 - 20 * t)},${alpha.toFixed(3)})`;
                    ctx.lineWidth = (ringOut - ringIn) / steps * 1.9;
                    ctx.beginPath();
                    ctx.ellipse(c, c, r, r * squash, 0, from, to);
                    ctx.stroke();
                }
            };
            drawRings(Math.PI, Math.PI * 2);                 // النص الخلفي (فوق الكوكب من ورا)

            // جسم الكوكب: أحزمة أفقية + ظل ناحية اليمين
            ctx.save();
            ctx.beginPath();
            ctx.arc(c, c, R, 0, Math.PI * 2);
            ctx.clip();
            const bands = ctx.createLinearGradient(0, c - R, 0, c + R);
            const stops = [[0, "#8a6a3c"], [0.14, "#d9b878"], [0.26, "#c19a5b"], [0.4, "#ecd29a"], [0.52, "#c9a566"],
                [0.64, "#e6c98c"], [0.78, "#b48a4e"], [0.9, "#d3b072"], [1, "#7a5a32"]];
            stops.forEach(([p, col]) => bands.addColorStop(p, col));
            ctx.fillStyle = bands;
            ctx.fillRect(c - R, c - R, R * 2, R * 2);
            for (let i = 0; i < 26; i++) {                   // تفاصيل رفيعة داخل الأحزمة
                const y = c - R + Math.random() * R * 2;
                ctx.fillStyle = `rgba(${Math.random() < 0.5 ? "255,235,190" : "90,60,30"},${rand(0.05, 0.14).toFixed(2)})`;
                ctx.fillRect(c - R, y, R * 2, rand(1.5, 5));
            }
            const shade = ctx.createRadialGradient(c - R * 0.45, c - R * 0.4, R * 0.1, c, c, R * 1.08);
            shade.addColorStop(0, "rgba(0,0,0,0)");
            shade.addColorStop(0.6, "rgba(10,6,20,.35)");
            shade.addColorStop(1, "rgba(5,3,15,.88)");
            ctx.fillStyle = shade;
            ctx.fillRect(c - R, c - R, R * 2, R * 2);
            ctx.restore();

            drawRings(0, Math.PI);                           // النص الأمامي (قدام الكوكب)
        };

        // جرم: رسمه + حجمه ومكانه وميلانه العشوائي
        const setup = (selector, config, draw, placement) => {
            const body = host.querySelector(selector);
            const canvas = body?.querySelector("canvas");
            if (!body || !canvas) return null;

            draw(canvas);

            const size = Math.round(window.innerWidth * rand(config.size[0], config.size[1]));
            body.style.setProperty("--size", `${Math.max(size, 150)}px`);
            body.style.setProperty("--tilt", `${(placement.tilt ?? rand(-35, 35)).toFixed(1)}deg`);
            body.style.setProperty("--flat", placement.flat.toFixed(2));
            if (config.spin) body.style.setProperty("--spin", `${config.spin}s`);
            if (config.sway) body.style.setProperty("--sway", `${config.sway}s`);
            body.style.setProperty("--opacity", config.opacity);
            body.style.setProperty("--blur", `${config.blur}px`);
            body.style.top = `${placement.top.toFixed(1)}vh`;
            body.style[placement.side] = `${placement.edge.toFixed(1)}vw`;
            return { body, speed: config.speed };
        };

        const parallax = [
            // درب التبانة: على اليمين، ارتفاع عشوائي، جزء منها بيطلع برا الحافة
            setup(".cosmos__body--galaxy", settings.galaxy, drawGalaxy,
                { side: "right", edge: rand(-6, 4), top: rand(2, 34), flat: rand(0.55, 0.8) }),
            // زحل: فوق اسم ابو شاهين مباشرة (المكان الحقيقي بيتحسب بعد الرسم)
            setup(".cosmos__body--saturn", settings.saturn, drawSaturn,
                { side: "left", edge: 0, top: 10, flat: 1, tilt: rand(-12, 12) })
        ].filter(Boolean);

        // ---------- تثبيت زحل فوق اسم الهيرو (h1) ----------
        const saturnBody = host.querySelector(".cosmos__body--saturn");
        const placeSaturn = () => {
            const title = document.querySelector(".hero__title");
            if (!saturnBody || !title) return;
            const box = saturnBody.getBoundingClientRect();
            const size = saturnBody.offsetWidth;
            const radius = size * 0.17;                      // نفس نصف قطر الكوكب في drawSaturn
            const rect = title.getBoundingClientRect();
            const range = document.createRange();            // عرض النص الفعلي (الـ h1 نفسه أعرض من الاسم)
            range.selectNodeContents(title);
            const text = range.getBoundingClientRect();
            const narrow = window.innerWidth < 900;          // موبايل: الاسم تحت الصورة، فزحل بيقعد جنبه مش فوقه
            const centerX = narrow ? Math.max(radius * 1.2, text.left - radius * 1.1) : text.left + text.width / 2;
            const centerY = narrow ? text.top + window.scrollY + text.height / 2
                                   : rect.top + window.scrollY - radius * 1.7; // فوق الاسم بمسافة تسع الحلقات
            saturnBody.style.right = "auto";
            saturnBody.style.left = `${(centerX - size / 2).toFixed(1)}px`;
            saturnBody.style.top = `${(centerY - size / 2).toFixed(1)}px`;
        };
        placeSaturn();
        window.addEventListener("load", placeSaturn);
        window.addEventListener("resize", placeSaturn);
        document.querySelector(".hero__title")?.addEventListener("animationend", placeSaturn); // بعد ما الاسم يخلّص حركة دخوله

        // ---------- السُدم: سحب ملونة ناعمة في أماكن عشوائية ----------
        const nebulaeHost = host.querySelector(".cosmos__nebulae");
        if (nebulaeHost) {
            const colors = ["rgba(140,70,255,.30)", "rgba(255,70,170,.18)", "rgba(40,190,220,.16)", "rgba(70,100,255,.28)"];
            for (let i = 0; i < settings.nebulae.count; i++) {
                const nebula = document.createElement("div");
                nebula.className = "cosmos__nebula";
                nebula.style.cssText =
                    `left:${rand(-15, 75).toFixed(1)}%;top:${rand(-10, 80).toFixed(1)}%;` +
                    `--size:${rand(38, 66).toFixed(0)}vw;--color:${colors[i % colors.length]};` +
                    `--drift:${rand(45, 90).toFixed(0)}s;animation-delay:${(-rand(0, 40)).toFixed(0)}s`;
                nebulaeHost.appendChild(nebula);
            }
            parallax.push({ body: nebulaeHost, speed: settings.nebulae.speed });
        }

        // ---------- غبار النجوم: نجوم دقيقة كتير ملونة قليلًا ----------
        const dust = host.querySelector(".cosmos__dust");
        if (dust) {
            const drawDust = () => {
                const width = dust.width = window.innerWidth;
                const height = dust.height = window.innerHeight + 240;
                const ctx = dust.getContext("2d");
                ctx.clearRect(0, 0, width, height);
                for (let i = 0; i < settings.dust.count; i++) {
                    const tint = pick(["255,255,255", "200,215,255", "255,235,210", "220,200,255"]);
                    ctx.fillStyle = `rgba(${tint},${rand(0.2, 0.75).toFixed(2)})`;
                    const dot = rand(0.5, 1.4);
                    ctx.fillRect(Math.random() * width, Math.random() * height, dot, dot);
                }
            };
            drawDust();
            let resizeTimer = 0;
            window.addEventListener("resize", () => {
                clearTimeout(resizeTimer);
                resizeTimer = setTimeout(drawDust, 250);
            });
            parallax.push({ body: dust, speed: settings.dust.speed });
        }

        // من يفضّل تقليل الحركة: ثابتين في أماكنهم 
        if (reducedMotionQuery.matches) return;

        // ---------- الحركة مع السكرول ----------
        let current = window.scrollY;
        let target = window.scrollY;
        let frameId = 0;

        // كل طبقة بتطلع لفوق بنسبة من سكرول الصفحة (أبطأ منها) عشان تبان بعيدة
        const render = () => {
            frameId = 0;
            current += (target - current) * settings.smoothing;
            if (Math.abs(target - current) < 0.2) current = target;

            parallax.forEach(({ body, speed }) => {
                body.style.setProperty("--y", `${(-current * speed).toFixed(2)}px`);
            });

            if (current !== target) frameId = requestAnimationFrame(render);
        };

        const onScroll = () => {
            target = window.scrollY;
            if (!frameId) frameId = requestAnimationFrame(render);
        };

        window.addEventListener("scroll", onScroll, { passive: true });
        render();
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

        const { scrollSmoothness, heroSmoothness, wheelMultiplier, heroDistance: heroDistanceRatio } = CONFIG.scroll;

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
            const heroTarget = clamp(window.scrollY / heroDistance);
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
            heroCurrent = clamp(window.scrollY / heroDistance);
            apply(heroCurrent);
            wake();
        });

        window.addEventListener("resize", measure);
        window.addEventListener("load", measure);
        if ("ResizeObserver" in window) new ResizeObserver(measure).observe(hero);

        measure();
        heroCurrent = clamp(window.scrollY / heroDistance);
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
            store: () => openExternalLink(CONFIG.urls.store),
            platform: () => openExternalLink(CONFIG.urls.platform)
        };

        document.querySelectorAll("[data-nav]").forEach((button) => {
            button.addEventListener("click", navigationActions[button.dataset.nav] || (() => {}));
        });

        // أزرار "زيارة" في المشاريع
        document.querySelectorAll("[data-project]").forEach((button) => {
            button.addEventListener("click", () => {
                openExternalLink(CONFIG.urls.projects[button.dataset.project]);
            });
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
        const panelsAndServices = document.querySelectorAll(".skills-panel, .service-card");
        const projectsSlider = document.querySelector(".projects-slider");
        const footer = document.querySelector(".site-footer:not(.site-footer--fixed)"); // فوتر صفحة التواصل ثابت وليه أنيميشن دخول خاص

        // دالة تظهر مجموعة عناصر
        const showAll = (elements) => elements.forEach((element) => element.classList.add("is-visible"));

        // المشاريع كلها بتظهر مرة واحدة (حتى المخفية جوه السلايدر) عشان تفضل بنفس الشكل بعد التمرير
        const getProjectCards = () => projectsSlider ? [...projectsSlider.querySelectorAll(".project-card")] : [];

        // متصفح قديم بدون IntersectionObserver: نظهر كل حاجة فورًا
        if (!("IntersectionObserver" in window)) {
            showAll(panelsAndServices);
            showAll(getProjectCards());
            footer?.classList.add("is-visible");
            return;
        }

        // مراقب الأقسام
        const sectionObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                if (entry.target === projectsSlider) showAll(getProjectCards());
                else entry.target.classList.add("is-visible");
                sectionObserver.unobserve(entry.target);
            });
        }, { threshold: 0.12, rootMargin: "0px 0px -35px 0px" });

        panelsAndServices.forEach((element) => sectionObserver.observe(element));
        if (projectsSlider) sectionObserver.observe(projectsSlider);

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
       7) سلايدر المشاريع
       - المشاريع جنب بعض بنفس الحجم (العدد الظاهر بيتحدد من CSS)
       - أي مشروع جديد بيتحط في .projects-slider__track بياخد نفس الحجم والمكان
       - الأسهم بتظهر لوحدها لما يكون فيه مشاريع مخفية، وبتتعطل عند أول/آخر مشروع
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

        // عدد المشاريع الظاهرة حاليًا في الشاشة
        const getVisibleCount = () => {
            const cards = track.children;
            if (!cards.length) return 1;
            const step = getCardStep();
            const gap = Math.max(0, step - cards[0].offsetWidth);
            return Math.max(1, Math.round((viewport.clientWidth + gap) / step));
        };

        // التمرير لمشروع معين بحركة جانبية ناعمة
        const goToIndex = (index) => {
            const position = clamp(index * getCardStep(), 0, getMaxPosition());
            const isRtl = getComputedStyle(viewport).direction === "rtl";
            viewport.scrollTo({
                left: isRtl ? -position : position,
                behavior: (reducedMotionQuery.matches || effectsAreOff()) ? "auto" : "smooth"
            });
        };

        // رقم أول مشروع ظاهر حاليًا
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

        // أحداث التحديث: تمرير / تغيير المقاس / إضافة مشروع جديد
        viewport.addEventListener("scroll", scheduleUpdate, { passive: true });
        window.addEventListener("resize", scheduleUpdate);
        if ("ResizeObserver" in window) new ResizeObserver(scheduleUpdate).observe(viewport);
        if ("MutationObserver" in window) new MutationObserver(scheduleUpdate).observe(track, { childList: true });

        updateArrows();
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
    initProjectsSlider();
    initScrollHint();
    initCosmos();
    initStars();
    initHeroScroll();
})();