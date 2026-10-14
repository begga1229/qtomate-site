# Pricing and privacy pages. Each text: (English, Russian, Uzbek, Turkish)

PRICING = {
    "slug": "pricing",
    "title": (
        "Pricing and pilot | QtoMate",
        "Цены и пилотная программа | QtoMate",
        "Narxlar va pilot dastur | QtoMate",
        "Fiyatlar ve pilot program | QtoMate",
    ),
    "desc": (
        "QtoMate is free while it is in beta. What the free workspace includes, what AI draft costs, and how teams can join the pilot.",
        "QtoMate бесплатен, пока идёт бета. Что входит в бесплатную рабочую область, сколько стоит ИИ-черновик и как командам присоединиться к пилоту.",
        "QtoMate beta davomida bepul. Bepul ish maydoniga nimalar kiradi, AI qoralama qancha turadi va jamoalar pilotga qanday qo‘shiladi.",
        "QtoMate beta süresince ücretsiz. Ücretsiz çalışma alanında neler var, yapay zekâ taslağının maliyeti ne ve ekipler pilota nasıl katılır.",
    ),
    "h1": (
        "Free while in beta. No catch.",
        "Бесплатно, пока идёт бета. Без подвоха.",
        "Beta davomida bepul. Hech qanday hiylasiz.",
        "Beta boyunca ücretsiz. Hiçbir püf noktası yok.",
    ),
    "lede": (
        "There is no paid plan yet. When there is one, it will be announced here before anything changes, and the drawings and exports you already have will stay yours.",
        "Платного тарифа пока нет. Когда он появится, мы объявим об этом здесь заранее, а ваши чертежи и выгрузки останутся вашими.",
        "Hozircha pullik tarif yo‘q. U paydo bo‘lganda, bu yerda oldindan e’lon qilamiz, mavjud chizmalaringiz va eksportlaringiz esa o‘zingizniki bo‘lib qoladi.",
        "Henüz ücretli bir plan yok. Olduğunda, herhangi bir şey değişmeden önce burada duyurulacak; elinizdeki çizimler ve dışa aktarımlar sizin kalacak.",
    ),
    "plans": [
        {
            "name": ("Workspace", "Рабочая область", "Ish maydoni", "Çalışma alanı"),
            "price": ("Free", "Бесплатно", "Bepul", "Ücretsiz"),
            "note": ("during the beta", "на время беты", "beta davomida", "beta süresince"),
            "cta": "app",
            "items": [
                ("Unlimited PDFs and sheets", "PDF и листы без ограничений", "Cheklanmagan PDF va varaqlar", "Sınırsız PDF ve pafta"),
                ("Snapping, scale and calibration", "Привязка, масштаб и калибровка", "Bog‘lash, masshtab va kalibrlash", "Yakalama, ölçek ve kalibrasyon"),
                ("Length, area, count, height and depth", "Длина, площадь, количество, высота и толщина", "Uzunlik, maydon, son, balandlik va qalinlik", "Uzunluk, alan, adet, yükseklik ve kalınlık"),
                ("Layers, groups and subtotals", "Слои, группы и итоги", "Qatlamlar, guruhlar va jamlar", "Katmanlar, gruplar ve ara toplamlar"),
                ("Excel and CSV export", "Экспорт в Excel и CSV", "Excel va CSV eksport", "Excel ve CSV'ye aktarım"),
                ("English, Russian, Uzbek and Turkish", "Английский, русский, узбекский и турецкий", "Ingliz, rus, o‘zbek va turk tillari", "İngilizce, Rusça, Özbekçe ve Türkçe"),
            ],
        },
        {
            "name": ("AI draft", "ИИ-черновик", "AI qoralama", "Yapay zekâ taslağı"),
            "price": ("Your API usage", "Ваш расход API", "API sarfingiz", "Kendi API kullanımınız"),
            "note": ("billed by Anthropic, not by us", "оплачивается Anthropic, не нам", "to‘lov Anthropic’ga, bizga emas", "ücreti Anthropic'e ödenir, bize değil"),
            "cta": "features",
            "items": [
                ("Uses your own Claude API key", "Работает с вашим ключом Claude API", "O‘zingizning Claude API kalitingiz bilan ishlaydi", "Kendi Claude API anahtarınızla çalışır"),
                ("One sheet per request, only when you press the button", "Один лист за запрос и только по нажатию кнопки", "Bir so‘rovda bitta varaq va faqat tugmani bosganingizda", "İstek başına bir pafta, yalnızca düğmeye bastığınızda"),
                ("Draft lines that you check and approve", "Черновые строки, которые вы проверяете и утверждаете", "Siz tekshirib tasdiqlaydigan qoralama qatorlar", "Kontrol edip onayladığınız taslak satırlar"),
                ("In beta: expect misses", "Бета: возможны пропуски", "Beta: xatolar bo‘lishi mumkin", "Beta: eksikler olabilir"),
            ],
        },
        {
            "name": ("Pilot", "Пилот", "Pilot", "Pilot"),
            "price": ("By invitation", "По приглашению", "Taklif bo‘yicha", "Davetle"),
            "note": ("for teams with real projects", "для команд с реальными проектами", "haqiqiy loyihalari bor jamoalar uchun", "gerçek projesi olan ekipler için"),
            "cta": "mail",
            "items": [
                ("A direct line to the person building it", "Прямая связь с тем, кто его делает", "Uni yaratayotgan odam bilan to‘g‘ridan-to‘g‘ri aloqa", "Onu geliştiren kişiyle doğrudan iletişim"),
                ("Your missing features go to the top of the list", "Нужные вам функции — в начало списка", "Sizga kerakli funksiyalar ro‘yxat boshiga", "Eksik bulduğunuz özellikler listenin başına"),
                ("Help testing on your kind of drawings", "Помощь в проверке на ваших типах чертежей", "Sizning turdagi chizmalarda sinashda yordam", "Sizin türünüzdeki çizimlerde deneme desteği"),
            ],
        },
    ],
    "pilot_h": ("About the pilot", "О пилотной программе", "Pilot dastur haqida", "Pilot program hakkında"),
    "pilot_p": (
        "The pilot is for estimating and contracting teams who are willing to use QtoMate on live work and tell us honestly where it falls short. In return you get a say in what is built next. There is no fee and no contract. We will never ask for drawings you are not allowed to share; if an example is needed, a cleaned or sample sheet is enough.",
        "Пилот — для сметных и подрядных команд, готовых использовать QtoMate в реальной работе и честно говорить, где он не дотягивает. Взамен вы влияете на то, что будет сделано дальше. Ни оплаты, ни договора. Мы никогда не попросим чертежи, которыми вам нельзя делиться; если нужен пример, хватит обезличенного или учебного листа.",
        "Pilot dastur QtoMate’ni haqiqiy ishda qo‘llashga va uning qayerda yetishmasligini halol aytishga tayyor smeta va pudrat jamoalari uchun. Buning evaziga keyingi nima qilinishiga ta’sir qilasiz. Hech qanday to‘lov va shartnoma yo‘q. Siz ulashishga haqli bo‘lmagan chizmalarni hech qachon so‘ramaymiz; misol kerak bo‘lsa, shaxsiy ma’lumotlardan tozalangan yoki namuna varaq yetarli.",
        "Pilot, QtoMate'i gerçek işlerde kullanmaya ve nerede yetersiz kaldığını dürüstçe söylemeye hazır keşif ve yüklenici ekipleri içindir. Karşılığında bundan sonra ne yapılacağına siz yön verirsiniz. Ücret ya da sözleşme yoktur. Paylaşma izniniz olmayan çizimleri asla istemeyiz; bir örnek gerekirse temizlenmiş ya da örnek bir pafta yeterlidir.",
    ),
    "pilot_cta": ("Ask to join the pilot", "Попроситься в пилот", "Pilotga qo‘shilishni so‘rash", "Pilota katılmak için yazın"),
    "pilot_subject": ("QtoMate pilot", "Пилот QtoMate", "QtoMate pilot", "QtoMate pilot"),
    "faq_h": ("Questions about cost", "Вопросы о стоимости", "Narx bo‘yicha savollar", "Ücretle ilgili sorular"),
    "faq": [
        (
            ("Is it really free?", "Это правда бесплатно?", "Rostdan ham bepulmi?", "Gerçekten ücretsiz mi?"),
            (
                "Yes. The workspace runs in your browser, so it costs us very little to offer, and we want people using it while it is shaped. There are no trials, limits or card details.",
                "Да. Рабочая область работает в вашем браузере, поэтому нам она почти ничего не стоит, а нам важно, чтобы ею пользовались, пока она формируется. Нет пробных периодов, лимитов и данных карты.",
                "Ha. Ish maydoni brauzeringizda ishlaydi, shuning uchun uni taklif qilish bizga deyarli hech narsaga tushmaydi, biz esa u shakllanayotgan paytda odamlar foydalanishini istaymiz. Sinov muddati, cheklov yoki karta ma’lumotlari yo‘q.",
                "Evet. Çalışma alanı tarayıcınızda çalıştığı için sunması bize çok az mal oluyor ve şekillenirken insanların kullanmasını istiyoruz. Deneme süresi, sınır ya da kart bilgisi yok.",
            ),
        ),
        (
            ("What will a paid plan look like?", "Каким будет платный тариф?", "Pullik tarif qanday bo‘ladi?", "Ücretli plan nasıl olacak?"),
            (
                "It has not been decided, and we will not guess here. Whatever it is will be announced on this page before it applies to anyone.",
                "Это ещё не решено, и гадать здесь мы не будем. Что бы это ни было, мы объявим об этом на этой странице до того, как оно кого-либо коснётся.",
                "Bu hali hal qilinmagan va biz bu yerda taxmin qilmaymiz. Nima bo‘lishidan qat’i nazar, u kimgadir taalluqli bo‘lishidan oldin shu sahifada e’lon qilinadi.",
                "Henüz karar verilmedi ve burada tahmin yürütmeyeceğiz. Ne olursa olsun, kimseye uygulanmadan önce bu sayfada duyurulacak.",
            ),
        ),
        (
            ("What does AI draft cost?", "Сколько стоит ИИ-черновик?", "AI qoralama qancha turadi?", "Yapay zekâ taslağı ne kadar tutar?"),
            (
                "Whatever Anthropic charges your API account for one request with one image of a sheet. You can see the exact amount in your Claude Console. We do not add anything on top.",
                "Столько, сколько Anthropic спишет с вашего API-аккаунта за один запрос с одним изображением листа. Точную сумму видно в вашей Claude Console. Мы ничего сверху не добавляем.",
                "Anthropic API hisobingizdan bitta varaq tasviri bilan bitta so‘rov uchun qancha olsa, shuncha. Aniq summani Claude Console’da ko‘rasiz. Biz ustiga hech narsa qo‘shmaymiz.",
                "Anthropic'in, bir pafta görüntüsü içeren tek bir istek için API hesabınızdan aldığı kadar. Tam tutarı Claude Console'da görürsünüz. Biz üstüne bir şey eklemeyiz.",
            ),
        ),
        (
            ("Can I use it for paid work?", "Можно использовать в коммерческой работе?", "Pullik ishda foydalansa bo‘ladimi?", "Ücretli işlerde kullanabilir miyim?"),
            (
                "Yes. The quantities are yours. As with any tool, check the scale and the result before you sign a bill off.",
                "Да. Объёмы принадлежат вам. Как и с любым инструментом, проверьте масштаб и результат, прежде чем подписывать ведомость.",
                "Ha. Hajmlar sizniki. Har qanday asbobdagidek, qaydnomani imzolashdan oldin masshtab va natijani tekshiring.",
                "Evet. Miktarlar sizindir. Her araçta olduğu gibi, bir cetveli onaylamadan önce ölçeği ve sonucu kontrol edin.",
            ),
        ),
    ],
}

PRIVACY = {
    "slug": "privacy",
    "title": ("Privacy | QtoMate", "Конфиденциальность | QtoMate", "Maxfiylik | QtoMate", "Gizlilik | QtoMate"),
    "desc": (
        "What QtoMate does and does not do with your drawings and data, in plain words.",
        "Что QtoMate делает и чего не делает с вашими чертежами и данными, простыми словами.",
        "QtoMate chizmalaringiz va ma’lumotlaringiz bilan nima qiladi va nima qilmaydi, oddiy so‘zlar bilan.",
        "QtoMate'in çizimleriniz ve verilerinizle ne yaptığı ve ne yapmadığı, sade bir dille.",
    ),
    "h1": ("Privacy, in plain words.", "Конфиденциальность простыми словами.", "Maxfiylik, oddiy so‘zlar bilan.", "Sade bir dille gizlilik."),
    "lede": (
        "QtoMate is built so that your drawings never need to leave your computer. Here is exactly what happens to what.",
        "QtoMate устроен так, чтобы ваши чертежи никогда не покидали ваш компьютер. Вот что и куда попадает.",
        "QtoMate chizmalaringiz kompyuteringizdan hech qachon chiqmasligi uchun yaratilgan. Quyida nima qayerga borishi aniq yozilgan.",
        "QtoMate, çizimlerinizin bilgisayarınızdan hiç çıkmaması için tasarlandı. Neyin nereye gittiği tam olarak şöyle.",
    ),
    "sections": [
        (
            ("Your drawings", "Ваши чертежи", "Chizmalaringiz", "Çizimleriniz"),
            (
                "When you open a PDF, it is read by your browser on your computer. It is not uploaded to QtoMate or to anyone else.",
                "Когда вы открываете PDF, его читает ваш браузер на вашем компьютере. Он не загружается ни в QtoMate, ни куда-либо ещё.",
                "PDF’ni ochganingizda uni kompyuteringizdagi brauzer o‘qiydi. U QtoMate’ga ham, boshqa hech qayerga ham yuklanmaydi.",
                "Bir PDF açtığınızda onu bilgisayarınızdaki tarayıcı okur. QtoMate'e ya da başka bir yere yüklenmez.",
            ),
        ),
        (
            ("Your measurements", "Ваши измерения", "O‘lchovlaringiz", "Ölçümleriniz"),
            (
                "Measurements, scales, groups and settings are saved in your browser’s local storage for each file. They stay on that computer and in that browser. Clearing the browser’s site data removes them, so export what you need to keep.",
                "Измерения, масштабы, группы и настройки сохраняются в локальном хранилище браузера для каждого файла. Они остаются на этом компьютере и в этом браузере. Очистка данных сайта удаляет их, поэтому выгружайте то, что нужно сохранить.",
                "O‘lchovlar, masshtablar, guruhlar va sozlamalar har bir fayl uchun brauzerning mahalliy xotirasida saqlanadi. Ular shu kompyuter va shu brauzerda qoladi. Sayt ma’lumotlarini tozalash ularni o‘chiradi, shuning uchun saqlash kerak bo‘lganini eksport qiling.",
                "Ölçümler, ölçekler, gruplar ve ayarlar her dosya için tarayıcının yerel depolamasında saklanır. O bilgisayarda ve o tarayıcıda kalır. Site verilerini temizlemek onları siler; saklamanız gerekenleri dışa aktarın.",
            ),
        ),
        (
            ("AI draft", "ИИ-черновик", "AI qoralama", "Yapay zekâ taslağı"),
            (
                "Only if you add a Claude API key and press AI draft, an image of the current sheet and the file name are sent from your browser directly to Anthropic’s API. They do not pass through QtoMate. Anthropic’s own terms and privacy policy apply to that request. Your key is stored only in your browser and is sent only to api.anthropic.com.",
                "Только если вы добавили ключ Claude API и нажали «ИИ-черновик», изображение текущего листа и имя файла отправляются из вашего браузера напрямую в API Anthropic. Через QtoMate они не проходят. К этому запросу применяются условия и политика конфиденциальности Anthropic. Ключ хранится только в вашем браузере и отправляется только на api.anthropic.com.",
                "Faqat siz Claude API kalitini qo‘shib, «AI qoralama»ni bossangiz, joriy varaq tasviri va fayl nomi brauzeringizdan to‘g‘ridan-to‘g‘ri Anthropic API’ga yuboriladi. Ular QtoMate orqali o‘tmaydi. Bu so‘rovga Anthropic’ning o‘z shartlari va maxfiylik siyosati amal qiladi. Kalitingiz faqat brauzeringizda saqlanadi va faqat api.anthropic.com’ga yuboriladi.",
                "Yalnızca bir Claude API anahtarı ekleyip yapay zekâ taslağına bastığınızda, geçerli paftanın görüntüsü ve dosya adı tarayıcınızdan doğrudan Anthropic API'sine gönderilir. QtoMate üzerinden geçmez. Bu isteğe Anthropic'in kendi koşulları ve gizlilik politikası uygulanır. Anahtarınız yalnızca tarayıcınızda saklanır ve yalnızca api.anthropic.com'a gönderilir.",
            ),
        ),
        (
            ("This website", "Этот сайт", "Ushbu sayt", "Bu web sitesi"),
            (
                "The site has no analytics, no advertising and no tracking cookies. It is hosted on GitHub Pages, and GitHub may keep standard server logs such as IP addresses for security. Fonts and libraries are served from this site, not from third parties.",
                "На сайте нет аналитики, рекламы и отслеживающих cookie. Он размещён на GitHub Pages, и GitHub может хранить обычные серверные журналы, например IP-адреса, в целях безопасности. Шрифты и библиотеки загружаются с этого сайта, а не со сторонних.",
                "Saytda analitika, reklama va kuzatuvchi cookie fayllar yo‘q. U GitHub Pages’da joylashgan va GitHub xavfsizlik maqsadida IP manzillar kabi oddiy server jurnallarini saqlashi mumkin. Shriftlar va kutubxonalar uchinchi tomondan emas, shu saytdan yuklanadi.",
                "Sitede analitik, reklam ya da izleme çerezi yoktur. GitHub Pages üzerinde barındırılır; GitHub güvenlik için IP adresleri gibi standart sunucu kayıtlarını tutabilir. Yazı tipleri ve kütüphaneler üçüncü taraflardan değil, bu siteden yüklenir.",
            ),
        ),
        (
            ("Email", "Электронная почта", "Elektron pochta", "E-posta"),
            (
                "If you write to us, your message reaches the founder’s mailbox through an email forwarding service. We use your address only to answer you and do not add it to any list.",
                "Если вы пишете нам, письмо попадает в почтовый ящик основателя через сервис пересылки почты. Ваш адрес используется только для ответа и никуда не добавляется.",
                "Bizga yozsangiz, xatingiz pochta yo‘naltirish xizmati orqali asoschining pochta qutisiga keladi. Manzilingizdan faqat javob berish uchun foydalanamiz va uni hech qanday ro‘yxatga qo‘shmaymiz.",
                "Bize yazarsanız mesajınız bir e-posta yönlendirme hizmeti üzerinden kurucunun posta kutusuna ulaşır. Adresinizi yalnızca size cevap vermek için kullanırız, hiçbir listeye eklemeyiz.",
            ),
        ),
        (
            ("Questions", "Вопросы", "Savollar", "Sorular"),
            (
                "Write to begench@qtomate.dpdns.org and you will get an answer from a person.",
                "Пишите на begench@qtomate.dpdns.org — ответит человек.",
                "begench@qtomate.dpdns.org manziliga yozing, sizga odam javob beradi.",
                "begench@qtomate.dpdns.org adresine yazın, size bir insan cevap verir.",
            ),
        ),
    ],
}
