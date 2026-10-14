# Features page. Each text: (English, Russian, Uzbek, Turkish)

FEATURES = {
    "slug": "features",
    "title": (
        "Features | QtoMate",
        "Возможности | QtoMate",
        "Imkoniyatlar | QtoMate",
        "Özellikler | QtoMate",
    ),
    "desc": (
        "What the QtoMate takeoff workspace does today: snapping to the drawing, scale and calibration, length, area and count, layers, groups and subtotals, Excel export.",
        "Что умеет рабочая область QtoMate сегодня: привязка к чертежу, масштаб и калибровка, длина, площадь и количество, слои, группы и итоги, экспорт в Excel.",
        "QtoMate ish maydoni bugun nimalar qila oladi: chizmaga bog‘lash, masshtab va kalibrlash, uzunlik, maydon va son, qatlamlar, guruhlar va jamlar, Excel’ga eksport.",
        "QtoMate metraj çalışma alanı bugün neler yapıyor: çizimi yakalama, ölçek ve kalibrasyon, uzunluk, alan ve adet, katmanlar, gruplar ve ara toplamlar, Excel'e aktarım.",
    ),
    "h1": (
        "Everything the workspace does today.",
        "Всё, что рабочая область умеет сегодня.",
        "Ish maydoni bugun qila oladigan hamma narsa.",
        "Çalışma alanının bugün yaptığı her şey.",
    ),
    "lede": (
        "Open a PDF drawing, set the scale, measure with the cursor locked to the drawing’s own lines, and leave with a bill of quantities you can check line by line.",
        "Откройте чертёж в PDF, задайте масштаб, измеряйте курсором, привязанным к линиям самого чертежа, и получите ведомость объёмов, которую можно проверить построчно.",
        "PDF chizmani oching, masshtabni bering, kursor chizmaning o‘z chiziqlariga bog‘langan holda o‘lchang va har bir qatorini tekshirsa bo‘ladigan hajmlar qaydnomasini oling.",
        "PDF çizimini açın, ölçeği girin, imleç çizimin kendi çizgilerine kilitliyken ölçün ve satır satır kontrol edebileceğiniz bir metraj cetveliyle çıkın.",
    ),
    "groups": [
        {
            "h": ("Measure", "Измерения", "O‘lchash", "Ölçüm"),
            "items": [
                {
                    "h": ("Snaps to the drawing", "Привязка к чертежу", "Chizmaga bog‘lanish", "Çizimi yakalar"),
                    "p": (
                        "The cursor lands on line ends, midpoints, crossings and dimension ticks read from the PDF’s own vector lines, so a quick click still hits the exact point. A marker shows what it caught. Hold Alt to switch it off for one click.",
                        "Курсор попадает на концы линий, середины, пересечения и засечки размеров, прочитанные из векторных линий самого PDF, поэтому даже быстрый клик попадает точно. Маркер показывает, что именно захвачено. Удерживайте Alt, чтобы отключить привязку на один клик.",
                        "Kursor PDF’ning o‘z vektor chiziqlaridan o‘qilgan chiziq uchlari, o‘rta nuqtalar, kesishmalar va o‘lcham belgilariga tushadi, shuning uchun tez bosish ham aniq nuqtaga tegadi. Belgi nimani ushlaganini ko‘rsatadi. Bir bosish uchun o‘chirish kerak bo‘lsa, Alt’ni bosib turing.",
                        "İmleç, PDF'in kendi vektör çizgilerinden okunan çizgi uçlarına, orta noktalara, kesişimlere ve ölçü çentiklerine oturur; hızlı bir tıklama bile tam noktaya denk gelir. Bir işaret neyi yakaladığını gösterir. Tek bir tıklama için kapatmak isterseniz Alt'ı basılı tutun.",
                    ),
                },
                {
                    "h": ("Length, area and count", "Длина, площадь и количество", "Uzunlik, maydon va son", "Uzunluk, alan ve adet"),
                    "p": (
                        "Runs of walls, cable or pipe; rooms and slabs; doors, fittings and devices. While you draw, the segment length, running total and area appear next to the cursor. Shift locks the line to 0°, 45° and 90°.",
                        "Стены, кабельные и трубные трассы; помещения и плиты; двери, приборы и устройства. Пока вы рисуете, рядом с курсором видны длина участка, нарастающий итог и площадь. Shift фиксирует линию под 0°, 45° и 90°.",
                        "Devor, kabel yoki quvur yo‘llari; xonalar va plitalar; eshiklar, jihozlar va qurilmalar. Chizayotganingizda kursor yonida bo‘lak uzunligi, yig‘ma jami va maydon ko‘rinadi. Shift chiziqni 0°, 45° va 90° burchakda ushlab turadi.",
                        "Duvar, kablo ya da boru güzergâhları; odalar ve döşemeler; kapılar, armatürler ve cihazlar. Çizerken parça uzunluğu, ara toplam ve alan imlecin yanında görünür. Shift çizgiyi 0°, 45° ve 90° açılara kilitler.",
                    ),
                },
                {
                    "h": ("Scale you can trust", "Масштаб, которому можно доверять", "Ishonsa bo‘ladigan masshtab", "Güvenilir ölçek"),
                    "p": (
                        "Pick the scale printed on the sheet, type your own ratio, or calibrate from a known dimension in millimetres, centimetres or metres. If the result looks like a unit mistake, you are warned straight away.",
                        "Выберите масштаб, указанный на листе, введите свой или откалибруйте по известному размеру в миллиметрах, сантиметрах или метрах. Если результат похож на ошибку в единицах, вы сразу увидите предупреждение.",
                        "Varaqda yozilgan masshtabni tanlang, o‘zingiznikini kiriting yoki ma’lum o‘lcham bo‘yicha millimetr, santimetr yoki metrda kalibrlang. Natija birlik xatosiga o‘xshasa, darhol ogohlantirish chiqadi.",
                        "Paftada yazan ölçeği seçin, kendi oranınızı yazın ya da bilinen bir ölçüden milimetre, santimetre veya metre cinsinden kalibre edin. Sonuç bir birim hatasına benziyorsa hemen uyarılırsınız.",
                    ),
                },
                {
                    "h": ("Edit without starting over", "Правка без повторного обмера", "Qaytadan boshlamasdan tahrirlash", "Baştan ölçmeden düzeltme"),
                    "p": (
                        "Drag any corner of a measurement, add a corner from the middle of an edge, or double-click a corner to remove it. Every change can be undone and redone.",
                        "Перетащите любой угол измерения, добавьте угол с середины стороны или удалите угол двойным щелчком. Любое изменение можно отменить и повторить.",
                        "O‘lchovning istalgan burchagini torting, tomon o‘rtasidan yangi burchak qo‘shing yoki burchakni ikki marta bosib o‘chiring. Har bir o‘zgarishni bekor qilish va qaytarish mumkin.",
                        "Bir ölçümün herhangi bir köşesini sürükleyin, kenar ortasından yeni köşe ekleyin ya da çift tıklayarak bir köşeyi silin. Her değişiklik geri alınabilir ve yinelenebilir.",
                    ),
                },
            ],
        },
        {
            "h": ("Work with real drawing sets", "Работа с реальными комплектами", "Haqiqiy chizmalar to‘plami bilan ishlash", "Gerçek pafta setleriyle çalışma"),
            "items": [
                {
                    "h": ("Large PDFs, sharp at any zoom", "Большие PDF, чёткие при любом увеличении", "Katta PDF’lar, har qanday kattalashtirishda tiniq", "Büyük PDF'ler, her yakınlıkta net"),
                    "p": (
                        "Sets of a hundred sheets and more open in the browser. Jump to a sheet by number, zoom with the mouse wheel at the cursor, and pan with the middle button or the space bar. Lines stay sharp when you zoom right in.",
                        "Комплекты из сотни листов и больше открываются в браузере. Переходите к листу по номеру, приближайте колесом мыши к курсору и двигайте лист средней кнопкой или пробелом. При сильном увеличении линии остаются чёткими.",
                        "Yuz va undan ortiq varaqli to‘plamlar brauzerda ochiladi. Raqam bo‘yicha varaqqa o‘ting, sichqoncha g‘ildiragi bilan kursor turgan joyni kattalashtiring, o‘rta tugma yoki probel bilan varaqni suring. Juda kattalashtirganda ham chiziqlar tiniq qoladi.",
                        "Yüz ve daha fazla paftalık setler tarayıcıda açılır. Numarasını yazarak paftaya atlayın, fare tekerleğiyle imlecin olduğu yere yakınlaşın, orta tuş ya da boşluk tuşuyla kaydırın. Çok yakınlaştığınızda bile çizgiler net kalır.",
                    ),
                },
                {
                    "h": ("Drawing layers", "Слои чертежа", "Chizma qatlamlari", "Çizim katmanları"),
                    "p": (
                        "If the PDF was exported from CAD with layers, switch them on and off, see only the layers used on the current sheet, and search them by name. The cursor does not snap to hidden layers.",
                        "Если PDF выгружен из САПР со слоями, их можно включать и выключать, смотреть только слои текущего листа и искать по названию. К скрытым слоям курсор не привязывается.",
                        "Agar PDF CAD’dan qatlamlar bilan chiqarilgan bo‘lsa, ularni yoqib-o‘chirish, faqat joriy varaqdagi qatlamlarni ko‘rish va nomi bo‘yicha qidirish mumkin. Kursor yashirin qatlamlarga bog‘lanmaydi.",
                        "PDF, CAD'den katmanlarıyla aktarılmışsa katmanları açıp kapatabilir, yalnızca geçerli paftada kullanılanları görebilir ve adına göre arayabilirsiniz. İmleç gizli katmanları yakalamaz.",
                    ),
                },
                {
                    "h": ("Your work stays with the file", "Работа сохраняется вместе с файлом", "Ishingiz fayl bilan saqlanadi", "Çalışmanız dosyayla birlikte kalır"),
                    "p": (
                        "Measurements, scales, groups and hidden layers are saved in your browser for each file. Open the same PDF tomorrow and everything is where you left it.",
                        "Измерения, масштабы, группы и скрытые слои сохраняются в браузере для каждого файла. Откройте тот же PDF завтра, и всё будет на месте.",
                        "O‘lchovlar, masshtablar, guruhlar va yashirilgan qatlamlar har bir fayl uchun brauzeringizda saqlanadi. Ertaga o‘sha PDF’ni ochsangiz, hammasi joyida bo‘ladi.",
                        "Ölçümler, ölçekler, gruplar ve gizlenen katmanlar her dosya için tarayıcınızda saklanır. Aynı PDF'i yarın açtığınızda her şey bıraktığınız yerde olur.",
                    ),
                },
            ],
        },
        {
            "h": ("Bill of quantities", "Ведомость объёмов", "Hajmlar qaydnomasi", "Metraj cetveli"),
            "items": [
                {
                    "h": ("Groups and subtotals", "Группы и итоги", "Guruhlar va oraliq jamlar", "Gruplar ve ara toplamlar"),
                    "p": (
                        "Put lines into groups such as walls, floors or cable types. Each group has its own colour on the sheet and a subtotal for every unit, and can be folded away.",
                        "Распределяйте строки по группам: стены, полы, типы кабеля. У каждой группы свой цвет на листе и итог по каждой единице измерения, группу можно свернуть.",
                        "Qatorlarni devorlar, pollar yoki kabel turlari kabi guruhlarga ajrating. Har bir guruhning varaqda o‘z rangi va har bir o‘lchov birligi bo‘yicha jami bor, guruhni yig‘ib qo‘yish mumkin.",
                        "Satırları duvarlar, döşemeler ya da kablo tipleri gibi gruplara ayırın. Her grubun paftada kendi rengi ve her birim için bir ara toplamı vardır, grup katlanabilir.",
                    ),
                },
                {
                    "h": ("Height, depth and openings", "Высота, толщина и проёмы", "Balandlik, qalinlik va o‘yiqlar", "Yükseklik, kalınlık ve boşluklar"),
                    "p": (
                        "Give a run a height to get wall area, or give an area a thickness to get volume. Mark an area as deducted for an opening and it counts as negative in every total.",
                        "Задайте трассе высоту, чтобы получить площадь стены, или площади толщину, чтобы получить объём. Отметьте площадь как вычет для проёма, и она войдёт во все итоги со знаком минус.",
                        "Yo‘lga balandlik bersangiz, devor maydoni chiqadi; maydonga qalinlik bersangiz, hajm chiqadi. O‘yiq uchun maydonni ayiriladigan deb belgilang, u barcha jamlarda manfiy hisoblanadi.",
                        "Bir güzergâha yükseklik verirseniz duvar alanı, bir alana kalınlık verirseniz hacim çıkar. Bir boşluk için alanı düşülecek olarak işaretleyin, tüm toplamlarda eksi olarak sayılır.",
                    ),
                },
                {
                    "h": ("Every line traceable", "Каждая строка прослеживается", "Har bir qatorning manbasi aniq", "Her satırın kaynağı belli"),
                    "p": (
                        "Each line keeps its sheet, its scale, how it was measured and whether you have approved it. Click a line and the drawing jumps to the shape behind it.",
                        "Каждая строка хранит лист, масштаб, способ измерения и отметку об утверждении. Нажмите на строку, и чертёж покажет фигуру, из которой она получена.",
                        "Har bir qator o‘z varag‘i, masshtabi, qanday o‘lchangani va tasdiqlanganini saqlaydi. Qatorni bossangiz, chizma uning ortidagi shaklni ko‘rsatadi.",
                        "Her satır paftasını, ölçeğini, nasıl ölçüldüğünü ve onaylanıp onaylanmadığını saklar. Bir satıra tıkladığınızda çizim onun arkasındaki şekle gider.",
                    ),
                },
                {
                    "h": ("Excel and CSV", "Excel и CSV", "Excel va CSV", "Excel ve CSV"),
                    "p": (
                        "Export the bill with group, quantity, height or depth, second quantity, source sheet, scale and status, plus a summary sheet with totals by group and unit.",
                        "Выгрузите ведомость с группой, количеством, высотой или толщиной, вторым количеством, листом-источником, масштабом и статусом, а также лист итогов по группам и единицам.",
                        "Qaydnomani guruh, miqdor, balandlik yoki qalinlik, ikkinchi miqdor, manba varaq, masshtab va holat bilan eksport qiling, shuningdek guruh va birlik bo‘yicha jamlar varag‘i ham bo‘ladi.",
                        "Cetveli grup, miktar, yükseklik ya da kalınlık, ikinci miktar, kaynak pafta, ölçek ve durum bilgisiyle dışa aktarın; gruba ve birime göre toplamları gösteren bir özet sayfası da eklenir.",
                    ),
                },
                {
                    "h": ("AI draft, in beta", "ИИ-черновик, бета", "AI qoralama, beta", "Yapay zekâ taslağı, beta"),
                    "p": (
                        "Claude can read the current sheet and propose rooms, walls, doors and windows as draft lines for you to check. It needs your own Claude API key and is still being tested, so treat its lines as suggestions.",
                        "Claude может прочитать текущий лист и предложить помещения, стены, двери и окна в виде черновых строк для проверки. Нужен ваш собственный ключ Claude API, функция ещё испытывается, поэтому считайте её строки предложениями.",
                        "Claude joriy varaqni o‘qib, xonalar, devorlar, eshik va derazalarni tekshirishingiz uchun qoralama qatorlar sifatida taklif qilishi mumkin. Buning uchun o‘zingizning Claude API kalitingiz kerak va funksiya hali sinovda, shuning uchun uning qatorlarini taklif deb qabul qiling.",
                        "Claude geçerli paftayı okuyup odaları, duvarları, kapı ve pencereleri kontrol etmeniz için taslak satırlar olarak önerebilir. Kendi Claude API anahtarınız gerekir ve özellik hâlâ deneniyor; önerdiği satırları öneri olarak görün.",
                    ),
                },
            ],
        },
    ],
    "privacy_h": (
        "Your drawings stay on your computer.",
        "Ваши чертежи остаются на вашем компьютере.",
        "Chizmalaringiz kompyuteringizda qoladi.",
        "Çizimleriniz bilgisayarınızda kalır.",
    ),
    "privacy_p": (
        "The PDF is read inside your browser and is not uploaded to us or anyone else. The only exception is AI draft, which sends an image of the current sheet to Anthropic’s API with your own key, and only when you press the button.",
        "PDF читается внутри браузера и не загружается ни к нам, ни куда-либо ещё. Единственное исключение — ИИ-черновик: он отправляет изображение текущего листа в API Anthropic с вашим ключом и только когда вы нажимаете кнопку.",
        "PDF brauzeringiz ichida o‘qiladi va bizga ham, boshqa hech kimga ham yuklanmaydi. Yagona istisno — AI qoralama: u joriy varaq tasvirini sizning kalitingiz bilan Anthropic API’ga yuboradi va faqat tugmani bosganingizda.",
        "PDF tarayıcınızın içinde okunur; ne bize ne de başka birine yüklenir. Tek istisna yapay zekâ taslağıdır: geçerli paftanın görüntüsünü kendi anahtarınızla Anthropic API'sine gönderir, o da yalnızca düğmeye bastığınızda.",
    ),
    "limits_h": (
        "What it does not do yet",
        "Чего пока нет",
        "Hozircha nima yo‘q",
        "Henüz yapmadıkları",
    ),
    "limits_intro": (
        "We would rather tell you now than have you find out halfway through a tender.",
        "Лучше сказать сразу, чем вы обнаружите это посреди тендера.",
        "Tenderning o‘rtasida bilib qolgandan ko‘ra, hozir aytganimiz yaxshi.",
        "Bunu bir ihalenin ortasında fark etmenizdense şimdi söylemeyi tercih ederiz.",
    ),
    "limits": [
        (
            "Scanned drawings have no vector lines, so snapping does not work on them. You can still calibrate and measure by hand.",
            "У сканированных чертежей нет векторных линий, поэтому привязка на них не работает. Калибровать и измерять вручную по-прежнему можно.",
            "Skanerlangan chizmalarda vektor chiziqlar yo‘q, shuning uchun ularda bog‘lanish ishlamaydi. Baribir qo‘lda kalibrlash va o‘lchash mumkin.",
            "Taranmış çizimlerde vektör çizgi yoktur, bu yüzden yakalama çalışmaz. Yine de elle kalibre edip ölçebilirsiniz.",
        ),
        (
            "DWG and IFC files are not read directly. Export the sheets to PDF first.",
            "Файлы DWG и IFC напрямую не читаются. Сначала выгрузите листы в PDF.",
            "DWG va IFC fayllari to‘g‘ridan-to‘g‘ri o‘qilmaydi. Avval varaqlarni PDF’ga chiqaring.",
            "DWG ve IFC dosyaları doğrudan okunmaz. Önce paftaları PDF'e aktarın.",
        ),
        (
            "There is no arc or curve tool yet. Curved runs are measured as short straight segments.",
            "Инструмента для дуг пока нет. Криволинейные трассы измеряются короткими прямыми участками.",
            "Yoy yoki egri chiziq asbobi hali yo‘q. Egri yo‘llar qisqa to‘g‘ri bo‘laklar bilan o‘lchanadi.",
            "Henüz yay ya da eğri aracı yok. Eğri güzergâhlar kısa düz parçalarla ölçülür.",
        ),
        (
            "Projects are not shared between people or devices. Send the Excel file, or open the same PDF on the same computer.",
            "Проекты не синхронизируются между людьми и устройствами. Передайте файл Excel или откройте тот же PDF на том же компьютере.",
            "Loyihalar odamlar yoki qurilmalar o‘rtasida ulashilmaydi. Excel faylini yuboring yoki o‘sha PDF’ni o‘sha kompyuterda oching.",
            "Projeler kişiler ya da cihazlar arasında paylaşılmaz. Excel dosyasını gönderin ya da aynı PDF'i aynı bilgisayarda açın.",
        ),
        (
            "There are no prices or rate databases. QtoMate produces quantities; pricing stays in your estimate.",
            "Цен и сборников расценок нет. QtoMate считает объёмы, а цены остаются в вашей смете.",
            "Narxlar yoki narxnomalar bazasi yo‘q. QtoMate hajmlarni hisoblaydi, narxlar esa smetangizda qoladi.",
            "Fiyat ya da birim fiyat veri tabanı yoktur. QtoMate miktarları çıkarır; fiyatlandırma sizin keşfinizde kalır.",
        ),
    ],
    "keys_h": ("Keyboard shortcuts", "Горячие клавиши", "Tezkor tugmalar", "Klavye kısayolları"),
    "keys": [
        ("V", ("Select and move the sheet", "Выбор и перемещение листа", "Tanlash va varaqni surish", "Seç ve paftayı kaydır")),
        ("L", ("Length", "Длина", "Uzunlik", "Uzunluk")),
        ("A", ("Area", "Площадь", "Maydon", "Alan")),
        ("C", ("Count", "Количество", "Sanash", "Adet")),
        ("S", ("Snapping on or off", "Включить или выключить привязку", "Bog‘lashni yoqish yoki o‘chirish", "Yakalamayı aç ya da kapat")),
        ("K", ("Layers", "Слои", "Qatlamlar", "Katmanlar")),
        ("Shift", ("Lock to 0°, 45° and 90°", "Фиксировать 0°, 45° и 90°", "0°, 45° va 90° burchakda ushlash", "0°, 45° ve 90°'ye kilitle")),
        ("Alt", ("Ignore snapping for this click", "Не привязывать этот клик", "Bu bosishda bog‘lanmaslik", "Bu tıklamada yakalamayı yok say")),
        ("Enter", ("Finish the shape", "Завершить фигуру", "Shaklni tugatish", "Şekli bitir")),
        ("Backspace", ("Remove the last point, or delete the selected line", "Убрать последнюю точку или удалить выбранную строку", "Oxirgi nuqtani olib tashlash yoki tanlangan qatorni o‘chirish", "Son noktayı kaldır ya da seçili satırı sil")),
        ("Esc", ("Cancel the shape, close a panel", "Отменить фигуру, закрыть панель", "Shaklni bekor qilish, panelni yopish", "Şekli iptal et, paneli kapat")),
        ("Ctrl+Z / Ctrl+Y", ("Undo and redo", "Отменить и повторить", "Bekor qilish va qaytarish", "Geri al ve yinele")),
        ("Space", ("Hold and drag to pan", "Удерживать и тянуть, чтобы двигать лист", "Bosib turib, varaqni surish", "Basılı tutup sürükleyerek kaydır")),
        ("+ / − / 0", ("Zoom in, zoom out, fit the sheet", "Приблизить, отдалить, вписать лист", "Kattalashtirish, kichiklashtirish, varaqni sig‘dirish", "Yakınlaş, uzaklaş, paftayı sığdır")),
        ("PgUp / PgDn", ("Previous and next sheet", "Предыдущий и следующий лист", "Oldingi va keyingi varaq", "Önceki ve sonraki pafta")),
    ],
    "keys_col": (("Key", "Action"), ("Клавиша", "Действие"), ("Tugma", "Amal"), ("Tuş", "İşlev")),
}
