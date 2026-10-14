# "Who it's for" page. Each text: (English, Russian, Uzbek, Turkish)

USECASES = {
    "slug": "use-cases",
    "title": (
        "Who it’s for | QtoMate",
        "Для кого | QtoMate",
        "Kimlar uchun | QtoMate",
        "Kimler için | QtoMate",
    ),
    "desc": (
        "How estimators, contractors, subcontractors and students use QtoMate to take quantities off PDF drawings and check them line by line.",
        "Как сметчики, генподрядчики, субподрядчики и студенты используют QtoMate, чтобы снимать объёмы с чертежей в PDF и проверять их построчно.",
        "Smetachilar, pudratchilar, subpudratchilar va talabalar QtoMate’dan PDF chizmalardan hajmlarni olish va ularni qatorma-qator tekshirish uchun qanday foydalanadi.",
        "Keşif mühendisleri, yükleniciler, taşeronlar ve öğrenciler PDF çizimlerden metraj çıkarmak ve satır satır kontrol etmek için QtoMate'i nasıl kullanıyor.",
    ),
    "h1": (
        "Built for the people who count the drawing.",
        "Для тех, кто считает по чертежам.",
        "Chizma bo‘yicha hisoblaydiganlar uchun.",
        "Çizimden metraj çıkaranlar için.",
    ),
    "lede": (
        "Anyone who has to turn a set of sheets into numbers someone else will rely on: a tender, a cost check, an order, a progress claim.",
        "Для всех, кому нужно превратить комплект листов в цифры, на которые будут опираться другие: тендер, проверка стоимости, заказ материалов, акт выполненных работ.",
        "Varaqlar to‘plamini boshqalar tayanadigan raqamlarga aylantirishi kerak bo‘lgan har bir kishi uchun: tender, narxni tekshirish, material buyurtmasi, bajarilgan ishlar dalolatnomasi.",
        "Bir pafta setini başkalarının güveneceği rakamlara dönüştürmesi gereken herkes için: ihale, maliyet kontrolü, malzeme siparişi, hakediş.",
    ),
    "tasks_h": ("Typical tasks", "Типичные задачи", "Odatiy vazifalar", "Tipik işler"),
    "how_h": ("How QtoMate helps", "Чем помогает QtoMate", "QtoMate qanday yordam beradi", "QtoMate nasıl yardımcı olur"),
    "roles": [
        {
            "id": "estimators",
            "h": ("Estimators and quantity surveyors", "Сметчики и инженеры ПТО", "Smetachilar va ishlab chiqarish-texnik bo‘lim muhandislari", "Keşif ve metraj mühendisleri"),
            "p": (
                "You are responsible for the quantity in every line, and the checker will ask where it came from.",
                "Вы отвечаете за каждое количество в смете, а проверяющий спросит, откуда оно взялось.",
                "Smetadagi har bir miqdor uchun siz javobgarsiz va tekshiruvchi uning qayerdan olinganini so‘raydi.",
                "Her satırdaki miktardan siz sorumlusunuz ve kontrol eden kişi onun nereden geldiğini soracak.",
            ),
            "tasks": [
                ("Floor, wall and ceiling areas for finishes", "Площади полов, стен и потолков под отделку", "Pardozlash uchun pol, devor va shift maydonlari", "İnce işler için döşeme, duvar ve tavan alanları"),
                ("Lengths of walls, skirting and partitions", "Длины стен, плинтусов и перегородок", "Devor, plintus va to‘siqlar uzunligi", "Duvar, süpürgelik ve bölme uzunlukları"),
                ("Counts of doors, windows and fittings", "Количество дверей, окон и изделий", "Eshik, deraza va buyumlar soni", "Kapı, pencere ve armatür adetleri"),
                ("Concrete volumes from slab areas", "Объёмы бетона по площадям плит", "Plita maydonlaridan beton hajmi", "Döşeme alanlarından beton hacmi"),
            ],
            "how": (
                "Snapping puts each corner on the drawing’s own line, so two people measuring the same room get the same number. Groups give you subtotals by trade, the thickness field turns slab areas into cubic metres, and openings are deducted in the same list. Every line keeps its sheet and scale for the checker.",
                "Привязка ставит каждый угол на линию самого чертежа, поэтому два человека, измеряя одно помещение, получат одно число. Группы дают итоги по видам работ, поле толщины превращает площади плит в кубометры, а проёмы вычитаются в том же списке. Каждая строка хранит лист и масштаб для проверяющего.",
                "Bog‘lanish har bir burchakni chizmaning o‘z chizig‘iga qo‘yadi, shuning uchun bir xonani o‘lchagan ikki kishi bir xil raqam oladi. Guruhlar ish turlari bo‘yicha jamlarni beradi, qalinlik maydoni plita maydonlarini kub metrga aylantiradi, o‘yiqlar esa shu ro‘yxatning o‘zida ayiriladi. Har bir qator tekshiruvchi uchun varag‘i va masshtabini saqlaydi.",
                "Yakalama her köşeyi çizimin kendi çizgisine koyar; aynı odayı ölçen iki kişi aynı rakamı bulur. Gruplar iş kalemine göre ara toplam verir, kalınlık alanı döşeme alanlarını metreküpe çevirir, boşluklar aynı listede düşülür. Her satır, kontrol eden kişi için paftasını ve ölçeğini saklar.",
            ),
        },
        {
            "id": "contractors",
            "h": ("General contractors", "Генеральные подрядчики", "Bosh pudratchilar", "Genel yükleniciler"),
            "p": (
                "You price tenders against the clock and check what subcontractors claim against what was drawn.",
                "Вы считаете тендеры в сжатые сроки и сверяете то, что предъявляют субподрядчики, с тем, что на чертеже.",
                "Siz tenderlarni qisqa muddatda hisoblaysiz va subpudratchilar taqdim etgan hajmni chizmadagi bilan solishtirasiz.",
                "İhaleleri zamana karşı fiyatlıyor, taşeronların talep ettiği miktarları çizimdekilerle karşılaştırıyorsunuz.",
            ),
            "tasks": [
                ("Quick quantities for a tender", "Быстрые объёмы для тендера", "Tender uchun tezkor hajmlar", "İhale için hızlı metraj"),
                ("Checking a subcontractor’s bill", "Проверка объёмов субподрядчика", "Subpudratchi hajmlarini tekshirish", "Taşeron metrajının kontrolü"),
                ("Comparing a revised sheet with the old one", "Сравнение новой ревизии листа со старой", "Varaqning yangi tahririni eskisi bilan solishtirish", "Revize paftayı eskisiyle karşılaştırma"),
            ],
            "how": (
                "Open the sheet, set the scale and measure the items in question in minutes. Approve each line once you have checked it; the progress counter shows what is still open. The Excel file goes straight into your comparison.",
                "Откройте лист, задайте масштаб и за минуты измерьте спорные позиции. Утверждайте каждую строку после проверки; счётчик показывает, что ещё не проверено. Файл Excel сразу идёт в вашу сравнительную таблицу.",
                "Varaqni oching, masshtabni bering va bahsli bandlarni bir necha daqiqada o‘lchang. Har bir qatorni tekshirgandan keyin tasdiqlang; hisoblagich hali nima ochiq qolganini ko‘rsatadi. Excel fayli to‘g‘ridan-to‘g‘ri solishtirish jadvalingizga tushadi.",
                "Paftayı açın, ölçeği girin, tartışmalı kalemleri dakikalar içinde ölçün. Kontrol ettiğiniz her satırı onaylayın; sayaç neyin hâlâ açık olduğunu gösterir. Excel dosyası doğrudan karşılaştırma tablonuza girer.",
            ),
        },
        {
            "id": "subcontractors",
            "h": ("Specialist subcontractors", "Специализированные субподрядчики", "Ixtisoslashgan subpudratchilar", "Uzman taşeronlar"),
            "p": (
                "Electrical, low-current, plumbing, HVAC and finishing crews who need lengths and counts to order material and plan labour.",
                "Электрики, слаботочники, сантехники, вентиляционщики и отделочники, которым нужны длины и количество для заказа материала и планирования работ.",
                "Material buyurtma qilish va ishni rejalashtirish uchun uzunlik va son kerak bo‘lgan elektrikchilar, kuchsiz tok, santexnika, ventilyatsiya va pardozlash brigadalari.",
                "Malzeme siparişi ve iş gücü planı için uzunluk ve adet gereken elektrik, zayıf akım, sıhhi tesisat, mekanik ve ince iş ekipleri.",
            ),
            "tasks": [
                ("Cable and pipe runs by type", "Кабельные и трубные трассы по типам", "Turlar bo‘yicha kabel va quvur yo‘llari", "Tipe göre kablo ve boru güzergâhları"),
                ("Counts of detectors, sockets and devices", "Количество извещателей, розеток и приборов", "Datchiklar, rozetkalar va qurilmalar soni", "Dedektör, priz ve cihaz adetleri"),
                ("Wall areas for tiling or painting", "Площади стен под плитку или окраску", "Kafel yoki bo‘yoq uchun devor maydonlari", "Fayans ya da boya için duvar alanları"),
            ],
            "how": (
                "Hide every layer except your system and the cursor snaps only to your lines. Put each cable or pipe type into its own group to get a length per type, and count devices with one click each. A height on a run gives wall area without a second takeoff.",
                "Скройте все слои, кроме своей системы, и курсор будет привязываться только к вашим линиям. Каждому типу кабеля или трубы дайте свою группу — получите длину по типам, а приборы считайте одним кликом на каждый. Высота у трассы даёт площадь стены без повторного обмера.",
                "O‘z tizimingizdan boshqa barcha qatlamlarni yashiring, kursor faqat sizning chiziqlaringizga bog‘lanadi. Har bir kabel yoki quvur turini alohida guruhga qo‘ying, turlar bo‘yicha uzunlik chiqadi; qurilmalarni har biriga bir bosish bilan sanang. Yo‘lga berilgan balandlik qayta o‘lchamasdan devor maydonini beradi.",
                "Kendi sisteminiz dışındaki tüm katmanları gizleyin, imleç yalnızca sizin çizgilerinizi yakalar. Her kablo ya da boru tipini ayrı bir gruba koyun, tipe göre uzunluk çıkar; cihazları her biri için bir tıklamayla sayın. Bir güzergâha yükseklik verirseniz ikinci kez ölçmeden duvar alanı çıkar.",
            ),
        },
        {
            "id": "students",
            "h": ("Students and trainees", "Студенты и стажёры", "Talabalar va stajyorlar", "Öğrenciler ve stajyerler"),
            "p": (
                "Learning takeoff on real sheets, without a paid licence.",
                "Учатся считать объёмы на настоящих листах, без платной лицензии.",
                "Pullik litsenziyasiz, haqiqiy varaqlarda hajm hisoblashni o‘rganayotganlar.",
                "Ücretli lisans olmadan, gerçek paftalar üzerinde metraj öğrenenler.",
            ),
            "tasks": [
                ("Practising on a sample drawing", "Практика на учебном чертеже", "Namuna chizmada mashq qilish", "Örnek çizim üzerinde alıştırma"),
                ("Coursework and diploma projects", "Курсовые и дипломные проекты", "Kurs va diplom loyihalari", "Ödevler ve bitirme projeleri"),
                ("Learning the terms of the trade", "Изучение профессиональных терминов", "Kasbiy atamalarni o‘rganish", "Mesleğin terimlerini öğrenme"),
            ],
            "how": (
                "The built-in sample sheet has known answers, so you can check your own measuring. The glossary explains the terms in four languages, and the workspace costs nothing while it is in beta.",
                "Во встроенном учебном листе известны правильные ответы, так что можно проверить себя. Глоссарий объясняет термины на четырёх языках, а рабочая область бесплатна, пока идёт бета.",
                "Ichki namuna varaqning to‘g‘ri javoblari ma’lum, shuning uchun o‘z o‘lchovingizni tekshirishingiz mumkin. Lug‘at atamalarni to‘rt tilda tushuntiradi, ish maydoni esa beta davomida bepul.",
                "Yerleşik örnek paftanın doğru cevapları bilinir, kendi ölçümünüzü kontrol edebilirsiniz. Sözlük terimleri dört dilde açıklar, çalışma alanı da beta süresince ücretsizdir.",
            ),
        },
    ],
    "flow_h": (
        "A typical session, start to finish",
        "Типичная работа от начала до конца",
        "Odatiy ish jarayoni boshidan oxirigacha",
        "Baştan sona tipik bir çalışma",
    ),
    "flow": [
        (
            ("Open the sheet", "Откройте лист", "Varaqni oching", "Paftayı açın"),
            ("Drop the PDF into the browser and go to the sheet you need.", "Перетащите PDF в браузер и перейдите к нужному листу.", "PDF’ni brauzerga tashlang va kerakli varaqqa o‘ting.", "PDF'i tarayıcıya bırakın ve ihtiyacınız olan paftaya gidin."),
        ),
        (
            ("Set the scale", "Задайте масштаб", "Masshtabni bering", "Ölçeği girin"),
            ("Use the scale from the title block, then check it against one known dimension.", "Возьмите масштаб из штампа и проверьте его по одному известному размеру.", "Shtampdagi masshtabni oling va uni bitta ma’lum o‘lcham bilan tekshiring.", "Antetteki ölçeği kullanın, sonra bilinen bir ölçüyle kontrol edin."),
        ),
        (
            ("Clean up the view", "Уберите лишнее", "Ortiqchasini yashiring", "Görünümü sadeleştirin"),
            ("Hide layers that are not yours: furniture, text, other systems.", "Скройте чужие слои: мебель, текст, другие системы.", "Sizga tegishli bo‘lmagan qatlamlarni yashiring: mebel, matn, boshqa tizimlar.", "Size ait olmayan katmanları gizleyin: mobilya, yazılar, diğer sistemler."),
        ),
        (
            ("Measure into groups", "Измеряйте по группам", "Guruhlarga o‘lchang", "Gruplara ölçün"),
            ("Lengths, areas and counts, each in its group, with height or thickness where needed.", "Длины, площади и количество, каждое в своей группе, с высотой или толщиной, где нужно.", "Uzunlik, maydon va son, har biri o‘z guruhida, kerak joyda balandlik yoki qalinlik bilan.", "Uzunluk, alan ve adet, her biri kendi grubunda; gereken yerde yükseklik ya da kalınlıkla."),
        ),
        (
            ("Check and approve", "Проверьте и утвердите", "Tekshiring va tasdiqlang", "Kontrol edip onaylayın"),
            ("Go through the list; each line shows you its shape on the sheet.", "Пройдите по списку: каждая строка показывает свою фигуру на листе.", "Ro‘yxatni ko‘rib chiqing: har bir qator varaqdagi shaklini ko‘rsatadi.", "Listeyi gözden geçirin; her satır paftadaki şeklini gösterir."),
        ),
        (
            ("Export", "Выгрузите", "Eksport qiling", "Dışa aktarın"),
            ("Take the Excel file with the bill and the summary into your estimate.", "Перенесите файл Excel с ведомостью и итогами в свою смету.", "Qaydnoma va jamlanmali Excel faylini smetangizga o‘tkazing.", "Cetvel ve özet içeren Excel dosyasını keşfinize taşıyın."),
        ),
    ],
}
