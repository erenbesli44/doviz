# ABD kanalları test — Tom Lee + Joseph Carlson (2026-11-15)

**Durum: TASLAK, gönderilmedi.** Tracker'a canlı ekleme yapılmadı. Analiz, yerel ve geçici bir sqlite veritabanında çalıştırıldı (üretim veritabanına dokunulmadı).

Her post için iki video var:
- `*-sub.mp4`: orijinal ses + Türkçe altyazı
- `*-dub.mp4`: yapay zekâ Türkçe seslendirme (MiniMax `Turkish_Trustworthyman`, kişinin sesi klonlanmadı), orijinal ses %12'de, Türkçe altyazı ve "Yapay zekâ ile Türkçe seslendirme" etiketi

Altyazı çevirisi MiniMax M3.1 Flash ile yapıldı, ardından editör düzeltmesi geçti. Ham çeviri ile düzeltilmiş hali `subtitles.tsv` dosyasında.

---

## Post 1 — Tom Lee · Nasdaq

Medya: `tomlee-sub.mp4` veya `tomlee-dub.mp4` (37,8 sn, video 12 Kasım, dk 5:51–6:30)

**Ana post**
```
“Satışlar azaldıkça %15'lik bir rallinin başlayacağını düşünüyorum.”
**Tom Lee · Nasdaq · Görüş özeti**
Fundstrat Capital, 12 Kasım yayını.
Yatırım tavsiyesi değildir.

#Nasdaq
```

**Yanıt (Özet)**
```
Özet: Lee, Nasdaq'ın son haftalardaki sert düşüşünü Haziran'daki "şelale düşüşüne" benzetiyor: bu kez daha hızlı ve daha dik, ama dip yaklaşık aynı göreli güç seviyesinde geldi. Haziran'daki düşüşün ardından Nasdaq %15 yükselmişti; satış baskısı azaldıkça benzer bir rallinin başlayacağını düşünüyor. VIX vade yapısının 6 Kasım'da tersine dönmesini korkunun zirvesi sayıyor. Riskler olarak ABD'deki düzenleme kaygılarını, Nvidia CEO'su skandalını ve İran savaşı nedeniyle Fed'in faiz artırmayı sürdürme ihtimalini sayıyor. Not: Lee, Fundstrat'ın GRNY fonunu yönetiyor. Vade: belirtilmedi.
```

Orijinal cümle: "I think a 15% rally will come underway as the selling starts to fade."

## Post 2 — Joseph Carlson · NVIDIA

Medya: `carlson-sub.mp4` veya `carlson-dub.mp4` (27,9 sn, video 11 Kasım, dk 5:22–5:50)

**Ana post**
```
“Hisse %22 düştü. Bunun büyük bölümü şu ana kadar fiyatlanmış durumda.”
**Joseph Carlson · NVIDIA · Görüş özeti**
The Joseph Carlson Show After Hours, 11 Kasım yayını.
Yatırım tavsiyesi değildir.

#Nvidia
```

**Yanıt (Özet)**
```
Özet: Carlson, Nvidia'nın Jensen Huang skandalıyla 240 dolardan 174 dolara gerilediğini, hissenin 12,6 ileriye dönük F/K ile sektörün en ucuz şirketlerinden biri olduğunu söylüyor. Skandalın Huang'ın etkisini, hissedarları ve düzenleme tarafını gerçekten etkilediğini kabul ediyor; ama düşüşün temel verilere göre orantısız olduğunu ve büyük kısmının fiyatlandığını düşünüyor. Şu anın alım için iyi bir zaman olduğunu söylüyor; kendisi ise portföyü bu sektörde zaten yoğun olduğu için Nvidia almıyor. Vade: belirtilmedi.
```

Orijinal cümleler: "But the stock is also down 22%. Much of that has been priced in at this point."

---

## Testte bulunanlar (canlıya almadan önce)
1. **Özetler İngilizce çıktı.** Tracker, İngilizce transkriptte özeti de İngilizce yazıyor (`LLM_DEFAULT_OUTPUT_LANGUAGE=tr` uygulanmıyor). Bu, açık olan "English transcript → English summary" sorunu. Sitede Türkçe göstermek için tracker'da düzeltme gerekiyor.
2. **Tom Lee'nin görüşü "açık değil" işaretlendi.** `outlook_explicit=false` çıktı, oysa cümle net bir tahmin ("15% rally will come underway"). Şu anki kurala göre bu görüş sitede görünmez, X'e de girmezdi. İngilizce için outlook prompt'unun kontrol edilmesi gerekiyor.
3. **LLM JSON hataları.** 6 videonun 1'i (Tom Lee, 6 Kasım) iki denemede de geçersiz JSON döndü ve analiz edilemedi.
4. **Joseph Carlson'ın ana kanalı 12 Ağustos'tan beri video yüklemiyor.** Aktif kanalı `@JosephCarlsonAfterHours` (haftada 3–4 video). Tracker ayarı bu kanal olmalı. Callsight'ın puanladığı ise ana kanal.
5. **Hisse analizi taksonomiye uymuyor.** Carlson'ın görüşleri tek tek hisseler üzerine (Nvidia, Uber, Meta). Tracker bunları yalnızca "Amerikan Piyasaları" konusu altında ve yönsüz (none) kaydetti. Hisse bazında görüş göstermek için hisse/ticker alt konusu gerekir.
6. **Konuşan kişi tespit edilmedi.** Tracker özette "The host" yazdı; iki kanal için `known_persons.yaml` kaydı gerekiyor.
7. **Avatar yok.** İki kanalın profil resmi de logo (fotoğraf değil), bu yüzden baş harfler kullanıldı.
8. **Çeviri editör kontrolü istiyor.** 13 cümleden 7'sinde düzeltme yaptım (anlam aynı, Türkçesi daha doğal). Sayılar ve yönler doğru çevrilmişti.
9. **Dublaj zamanlaması.** Türkçe seslendirme İngilizceden yaklaşık %5–18 uzun. Carlson klibi 1,18 kat hızlandırıldı; dudak senkronu yok.
10. **Maliyet.** 2 klip = 1 çeviri çağrısı + 15 TTS çağrısı (Go planı kotası).
