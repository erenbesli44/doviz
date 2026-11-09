# TCMB blog digests — review batch 1 (2026-11-09)

Generated on production by the `research_watch` backfill (run 1, 2026-11-09 09:06–09:10 UTC,
`research-digest-v1`, MiniMax medium effort). All 12 are `needs_review`: nothing is public until
the owner marks each one. For each digest, read it against the post (link) and mark every sentence
right / over-read / missing. Criterion G: ≥ 10 of 12 with no wrong or over-read sentence before
`auto_publish` may be switched on.

Mark a digest (tracker API key):

```bash
curl -X PATCH -H "X-API-Key: $TRACKER_KEY" -H "Content-Type: application/json" \
  -d '{"review_status": "reviewed"}' "$TRACKER/jobs/research-watch/items/<id>"
```

`rejected` hides it for good; `POST /jobs/research-watch/items/<id>/redigest` generates it again.

## Örnek X paylaşımları (taslak, yayınlanmadı)

Playbook §3.6 biçimi: ana paylaşım (çarpıcı bulgu → ne araştırılmış → çıkarım → kaynak, bölüm başlığı yok),
altında konu konu 2–3 kısa yanıt (her biri tek bir ayrıntı, ≤ ~200 karakter, link ve hashtag yok).
Her sayı ve iddia ilgili özetten (ve o da yazıdan) geliyor; özet onaylanmadan paylaşılmaz.

### #12 · Fon tasfiyeleri (4 Kas 2026)

> Tasfiyeye alınan fonlarda parası kalan firmaların ekonomideki payı küçük: reel sektör aktiflerinin %1,2'si, istihdamın %0,6'sı.
>
> TCMB araştırmacıları SPK kararıyla tasfiyeye alınan fonlarda yatırımı olan firmalara bakmış. Yaklaşık 3 bin firmanın bu fonlarda toplam 116 milyar TL'si var.
>
> Kısacası doğrudan etki sınırlı görünüyor ve bu firmaların krediye erişimi sürüyor. Yazarlar fon sorununun ekonomiye toplam etkisini ise ölçmediklerini vurguluyor.
>
> Kaynak: Merkezin Güncesi (TCMB blogu), Ünal Seven ve Kadir Gürci, 4 Kasım 2026. Yazarların görüşüdür.
> https://tcmbblog.org/wps/wcm/connect/blog/tr/main+menu/analizler/fon_tasfiyeleri_ve_reel_sektor_firma_verileri_ne_soyluyor

Altındaki yanıtlar:

1. Tedarikçiler eklenince tablo biraz büyüyor: satışlarının %5'inden fazlası bu firmalara giden tedarikçiler, toplam istihdamın %1,2'sini oluşturuyor.
2. Kredi tarafında sorun görünmüyor: bu firmaların kısa vadeli TL kredilerdeki payı artıyor, yani bankalar kredi vermeye devam ediyor.
3. "Maruziyet" burada şunu ölçüyor: firmanın fondaki parasının, bir yıl içinde nakde dönebilecek varlıklarına oranı.

### #10 · Deprem bölgesinde kira (2 Eyl 2026)

> Deprem bölgesinde konut teslimleri hızlanınca kira artışları da yavaşlamaya başlamış.
>
> TCMB araştırmacıları kiralık ilan fiyatlarıyla illeri üç grupta karşılaştırmış. TOKİ'nin tamamladığı deprem konutları 2025 başında 201 bindi, yıl sonunda yaklaşık 434 bine çıktı.
>
> Çıkarım: konut arzı toparlandıkça kira baskısı hafifliyor. Bu rahatlamanın diğer illere yansıması ise gecikmeli olabilir.
>
> Kaynak: Merkezin Güncesi (TCMB blogu), Ali Arda Dalseçkin, Muhammed Hamza Kayrıcı, Süreyya Güder Köşgeroğlu, 2 Eylül 2026. Yazarların görüşüdür.
> https://tcmbblog.org/wps/wcm/connect/blog/tr/main+menu/analizler/deprem_bolgesi_konut_arzi_ve_bolgesel_kira_enflasyonu_gelismeleri

Altındaki yanıtlar:

1. Deprem bölgesinin yeni binalardaki payı da arttı: yapı kullanım izinlerinde deprem öncesi ortalama %12 civarındaydı, 2025'te %20'nin üzerine çıktı.
2. Yavaşlama, konut teslimlerinin hızlandığı 2025'te başlıyor. Göç alan illerde de kira artışı göreli olarak yavaşlıyor.

### #2 · Hissedilen enflasyon (30 Oca 2026)

> Enflasyonun düşük olduğu yıllarda bile hanehalkının beklentisi, gerçekleşen enflasyonun ortalama 10 puan üzerinde kalıyor.
>
> TCMB araştırmacıları hanehalkı beklentilerini hissedilen enflasyonla ve diğer ülkelerle karşılaştırmış. Birçok ülkede enflasyon %2 civarındayken bile hanehalkı %10 düzeyinde enflasyon bekliyor.
>
> Yani bu Türkiye'ye özgü değil: algıyı şekillendiren kalemlerin başında gıda, enerji ve kira geliyor.
>
> Kaynak: Merkezin Güncesi (TCMB blogu), Halil İbrahim Korkmaz, Ahmet Bilal Kurtoğlu, Furkan Höçük, 30 Ocak 2026. Yazarların görüşüdür.
> https://tcmbblog.org/wps/wcm/connect/blog/tr/main+menu/analizler/hanehalki+enflasyon+beklentileri+ve+hissedilen+enflasyon

Altındaki yanıtlar:

1. 12 ay sonraki enflasyonu tahmin etmede en büyük hata payı hanehalkı beklentilerinde.
2. Beklentiler %5, %10 gibi yuvarlak sayılarda toplanıyor; yazarlar buna yuvarlama etkisi diyor.
3. Merkez bankası iletişiminin bu farkı kapatıp kapatmayacağı ise yazıda ölçülmüyor.

### #3 · Yeni TÜFE sepeti (4 Şub 2026)

> TÜFE sepeti 2026'da değişti: hizmetlerin payı 7,4 puan arttı, enerjinin payı 3,2 puan azaldı.
>
> TCMB araştırmacıları yeni ağırlıkların enflasyon ölçümüne etkisini hesaplamış. Eski ve yeni ağırlıklarla karşılaştırınca yeni sepet Ocak 2026 enflasyonunu yaklaşık 0,1 puan aşağı çekmiş.
>
> Kısacası sepet değişikliğinin ocak rakamına etkisi sınırlı kaldı. Yıllık enflasyona etkisi ise bu çalışmada ölçülmüyor.
>
> Kaynak: Merkezin Güncesi (TCMB blogu), Dilara Ertuğ ve Nagihan Özlü, 4 Şubat 2026. Yazarların görüşüdür.
> https://tcmbblog.org/wps/wcm/connect/blog/tr/main+menu/analizler/2026+yili+tuketici+fiyat+endeksindeki+guncellemeler+ve+etkileri

Altındaki yanıtlar:

1. Sepete yeni kalemler girdi: harcama grupları 12'den 13'e çıktı, çevrim içi hizmetler ve elektrikli otomobil şarjı artık ölçülüyor.
2. Temel malların payı da 3,0 puan azaldı. Yani endekste hizmet fiyatlarının ağırlığı artık daha fazla.

## Özetler

| id | date | checks | headline |
|---|---|---|---|
| 12 | 2026-11-04 | pass | Tasfiye fonlarındaki reel sektör firmalarının ekonomi içindeki payı düşük |
| 11 | 2026-09-28 | pass | Döviz dönüşüm desteği, katma değeri yüksek firmalara yönlendiriliyor |
| 10 | 2026-09-02 | pass | Deprem bölgesinde konut arzının artması kira enflasyonunu yavaşlattı |
| 9 | 2026-08-13 | pass | Finans hesabı revizyonları son dönem NHN negatifliğini belirgin biçimde azalttı |
| 8 | 2026-07-06 | pass | Enerji ithalatı artsa da güçlü ihracat dış ticaret dengesini iyileştirdi |
| 7 | 2026-03-31 | FLAG: quote is not a verbatim sentence of the source | Eşel mobil, petrol kaynaklı enflasyon baskısını sınırlıyor |
| 6 | 2026-03-12 | pass | Dış borç verileri elde tutana göre yeniden sınıflandırıldı ve 65 milyar dolar azaldı |
| 5 | 2026-02-24 | pass | HBA, 12 ay sonrası enflasyon beklentisini TEA'ya göre daha düşük ölçüyor |
| 4 | 2026-02-17 | FLAG: numbers not in source: 1, 2 | Yeni kira artışları resmî kira enflasyonundan daha erken yansıyor |
| 3 | 2026-02-04 | pass | Yeni TÜFE ağırlıkları Ocak 2026 enflasyonuna yaklaşık 0,1 puan azaltıcı etki yaptı |
| 2 | 2026-01-30 | pass | Hanehalkının enflasyon beklentileri gerçekleşen enflasyonun belirgin biçimde üzerinde |
| 1 | 2026-01-29 | pass | Hizmet enflasyonunda eğitim, kira ve yerel hizmetler öne çıktı |

## 12 · Fon Tasfiyeleri ve Reel Sektör: Firma Verileri Ne Söylüyor?

2026-11-04 · Ünal Seven, Kadir Gürci · Finansal Piyasalar · [yazı](https://tcmbblog.org/wps/wcm/connect/blog/tr/main+menu/analizler/fon_tasfiyeleri_ve_reel_sektor_firma_verileri_ne_soyluyor)

Checks: pass · topics: —

**Tasfiye fonlarındaki reel sektör firmalarının ekonomi içindeki payı düşük**

Yazarlar, tasfiye fonlarındaki reel sektör yatırımcılarının maruziyetini, tedarikçilerini ve kredi erişimini incelemek için baktı.

Ne bulmuşlar?
- Yaklaşık 3 bin firmanın tasfiye kapsamındaki fonlarda toplam 116 milyar TL yatırımı bulunuyor.
- Bu firmalar reel sektörün toplam aktiflerinin yaklaşık yüzde 1,2’sini, istihdamının yüzde 0,6’sını oluşturuyor.
- Satışları içindeki payları yüzde 5’in üzerinde olan tedarikçiler, toplam istihdamın yüzde 1,2’sini oluşturuyor.

**Ne anlama geliyor?** Firmaların ve tedarikçilerinin ekonomi içindeki payları görece düşük. Kısa vadeli TL kredilerindeki paylarının artması, krediye erişimin sürdüğünü gösteriyor.

**Ne demiyor?** Yazı, fon piyasasındaki gelişmelerin reel sektör üzerindeki toplam etkisine sonuç vermiyor ve likidite güçlüklerinin önemini azaltmıyor.

**Alıntı:** "Özetle, analizlerimiz olağanüstü tasfiye kapsamındaki fonlarda yatırımı bulunan firmaların ve bu firmaların tedarikçilerinin ekonomideki ağırlığını ortaya koyuyor."

**Dayanak:** SPK’nın 17 Eylül 2026 tarihli kararı kapsamındaki fon verileri, firma bilançoları, en güncel sektör verileri, ticaret verileri ve haftalık kredi verileri kullanıldı.

**Terimler:** *Fon maruziyeti*: Firmanın ilgili fonlardaki yatırımının son yıl bilançosundaki dönen varlıklarına oranı. · *Fon tasfiyesi*: Fonun varlıklarının paraya çevrilerek yatırımcılara ödenmesi süreci. · *Tedarikçi bağlantısı*: Fonlarda yatırımı bulunan bir firmaya satış yapan başka firmayla ticari ilişki.

## 11 · Döviz Dönüşüm Desteğinde Yeni Dönem

2026-09-28 · Merve Demirbaş Özbekler, Sümeyra Korkmaz, Mehmet Serdar Şarbak, Barış Aydoğan · Uluslararası Ticaret · [yazı](https://tcmbblog.org/wps/wcm/connect/blog/tr/main+menu/analizler/doviz_donusum_desteginde_yeni_donem)

Checks: pass · topics: doviz-kur

**Döviz dönüşüm desteği, katma değeri yüksek firmalara yönlendiriliyor**

Yazarlar, 1 Ekim 2026’da yürürlüğe girecek düzenlemenin içeriğini ve olası etkilerini firma düzeyinde incelediler.

Ne bulmuşlar?
- 2023’ten bu yana yaklaşık 44 bin firma destek aldı; destek alanların ihracatçı firmalar içindeki payı 2026’da yüzde 34 oldu.
- Yeni kural, firmaların döviz pozisyon oranının yüzde 10’u aşmamasını gerektiriyor.
- Firma analizleri, 2024 ve 2025’te desteği almayanlarda katma değer ile net döviz satışının ilişkisinin belirgin olduğunu gösteriyor.

**Ne anlama geliyor?** Yeni düzenleme desteği üretim zincirindeki tedarikçilere de açıyor. Döviz satışlarının rezervlere daha kalıcı katkı sağlaması düzenlemenin hedefi olarak sunuluyor.

**Ne demiyor?** Yazı, yeni düzenlemenin sonuçlarını henüz ölçmediğini ve rezerv katkısının arttığını göstermediğini belirtiyor.

**Alıntı:** "Özetle, 1 Ekim 2026 itibarıyla hayata geçirilecek yeni uygulamayla döviz dönüşüm desteğini yurt içinde üretim ve istihdam yoluyla daha fazla katma değer oluşturan ve net döviz satım eğilimi yüksek firmalara yönlendiriyoruz."

**Dayanak:** Yazı; 2023’ten 2026’ya firma sayısı ve pay verileriyle, 2024 ve 2025’te desteği kullanmayan firmaların katma değer ve döviz satış oranları üzerindeki firma düzeyi analizini dayandırıyor.

**Terimler:** *Döviz dönüşüm desteği*: Firmaların yurt dışı kaynaklı döviz gelirlerini Türk lirasına dönüştürmesini ödüllendiren uygulama. · *Döviz pozisyon oranı*: Likit döviz varlıklarının net satış hasılatı veya toplam aktiflerden büyük olanına oranı. · *Katma değer*: Destekte firmanın yıllık faaliyet kârı ile işgücü maliyetinin toplamı olarak hesaplanan ölçüt.

## 10 · Deprem Bölgesi Konut Arzı ve Bölgesel Kira Enflasyonu Gelişmeleri

2026-09-02 · Ali Arda Dalseçkin, Muhammed Hamza Kayrıcı, Süreyya Güder Köşgeroğlu · Enflasyon · [yazı](https://tcmbblog.org/wps/wcm/connect/blog/tr/main+menu/analizler/deprem_bolgesi_konut_arzi_ve_bolgesel_kira_enflasyonu_gelismeleri)

Checks: pass · topics: enflasyon

**Deprem bölgesinde konut arzının artması kira enflasyonunu yavaşlattı**

Yazarlar, deprem sonrası konut arzının toparlanmasının bölgesel ve göçle bağlantılı kira enflasyonuna nasıl yansıdığını inceledi.

Ne bulmuşlar?
- TOKİ’nin tamamladığı deprem konutları 2025 yılı başında 201 bin, yıl sonunda yaklaşık 434 bin seviyesine ulaştı.
- Deprem bölgesinin yapı kullanım izinlerindeki payı, deprem öncesinde ortalama yüzde 12 civarındayken 2025 yılında yüzde 20’nin üzerine çıktı.
- Deprem illerinde kira enflasyonu, konut teslimlerinin hızlandığı 2025 yılında yavaşlamaya başladı.

**Ne anlama geliyor?** Konut arzının toparlanması, deprem bölgesinde ve göç alan illerde kira artışının göreli olarak yavaşlamasıyla birlikte görülüyor. Etkinin daha geniş illere yayılması ise gecikmeli olabilir.

**Ne demiyor?** Yazı, gelecekteki kira enflasyonu için kesin bir sayısal tahmin veya yatırım tavsiyesi sunmaz.

**Alıntı:** "Özetle, deprem sonrası konut stokunda gerçekleşen gerileme deprem bölgesindeki illerde ve göç hareketleri aracılığıyla da bazı diğer illerde kira enflasyonunu olumsuz etkiledi."

**Dayanak:** Çevrim içi kiralık ilan fiyatları kullanıldı ve Akgündüz ve Kayrıcı (2026) çalışmasından yararlanılarak iller üç grupta karşılaştırıldı.

**Terimler:** *Kira enflasyonu*: Kira fiyatlarının zaman içinde ne kadar arttığını gösteren değişim. · *Yapı kullanım izni*: Yeni binaların kullanım için uygun olduğuna dair resmî izin. · *Geri göç*: Deprem sonrası başka illere taşınan halkın tekrar deprem bölgesine dönmesi.

## 9 · Finans Hesabı Revizyonları ve Net Hata ve Noksan’a Etkileri

2026-08-13 · Murat Topkaya, Barış Babaoğlu, Özgecan Çatalçam, Kerem Önde · Ödemeler Dengesi · [yazı](https://tcmbblog.org/wps/wcm/connect/blog/tr/main+menu/analizler/finans_hesabi_revizyonlari_ve_net_hata_ve_noksana_etkileri)

Checks: pass · topics: —

**Finans hesabı revizyonları son dönem NHN negatifliğini belirgin biçimde azalttı**

NHN’nin 2023’ten itibaren negatifleşmesi, bunun kayıt dışı dış ticaretten mi yoksa finansal hesaplardan mı kaynaklandığını araştırmayı gerektirdi.

Ne bulmuşlar?
- Ocak 2014-Mayıs 2026 birikimli NHN, revizyonlarla -34,3 milyar ABD dolardan -14,5 milyar ABD dolara yaklaştı.
- 2023-2026 dönemindeki NHN, revizyon öncesinde -57,8 milyar ABD dolar, sonrasında -23,5 milyar ABD dolar oldu.
- SWIFT revizyonunun etkisi -13,3 milyar ABD dolar; finansal türev revizyonunun etkisi 6,5 milyar ABD dolar net zarardır.

**Ne anlama geliyor?** NHN’nin negatifliğinin önemli bölümü dış ticaret açığı değil, finansal hesaplardaki kayıt ve sınıflandırma sorunlarıydı. Revizyonlar cari açığı değiştirmedi.

**Ne demiyor?** Yazı, NHN’deki tüm negatif birikimin açıklandığını veya kayıt dışı dış ticaretin bulunmadığını kesin olarak söylemiyor.

**Alıntı:** "Bu nedenle, cari açık aynı kalırken NHN’nin mutlak büyüklüğünün azalması, NHN’nin önemli bir bölümünün Finans Hesabı’ndaki kapsam, sınıflandırma, değerleme ve kayıt zamanı farklılıklarından kaynaklandığını ortaya koyuyor."

**Dayanak:** Çalışma, Haziran 2026 ödemeler dengesi istatistikleriyle SWIFT verileri, sözleşme bazlı türev hesaplamaları ve efektif hareketlerinin ayrıştırılması için kullanılan regresyon modelini temel alıyor.

**Terimler:** *Net Hata ve Noksan*: Farklı veri kaynaklarındaki ölçüm, sınıflandırma ve kayıt farklarından doğan kalıntı. · *Finans Hesabı*: Yurt dışı finansal varlık ve yükümlülük hareketlerinin kaydedildiği hesap. · *Cari İşlemler Hesabı*: Dış ticaret ve gelir akıtımlarının kaydedildiği ödemeler dengesi hesabı.

## 8 · Jeopolitik Gelişmeler Dış Ticareti Nasıl Şekillendirdi?

2026-07-06 · Yasemin Barlas, Şebnem Oğuz · Uluslararası Ticaret · [yazı](https://tcmbblog.org/wps/wcm/connect/blog/tr/main+menu/analizler/jeopolitik_gelismeler_dis_ticareti_nasil_sekillendirdi)

Checks: pass · topics: petrol-enerji, faiz-para-politikasi

**Enerji ithalatı artsa da güçlü ihracat dış ticaret dengesini iyileştirdi**

Yazarlar, savaşın dış ticareti zayıflatması beklenirken ikinci çeyrek verilerinin farklı bir tablo göstermesini araştırdı.

Ne bulmuşlar?
- Takvim etkilerinden arındırılmış enerji ithalatı yıllık bazda %32,4 arttı.
- Savunma sanayinin toplam ihracattaki payı son dört ylda yaklaşık 2,3 puan artarak %4’e ulaştı.
- İkinci çeyrek ortalamalarında Brent petrolü yıllık %55,2, doğal gaz ise %28,2 yükseldi.

**Ne anlama geliyor?** Güçlü ihracat ve zayıf iç talep, enerji ithalatındaki artışın dış dengeyi bozmasını büyük ölçüde engelledi. Savaşın cari açık riski azaldı, ancak kısa vadeli enerji ithalatı riskleri tümüyle ortadan kalkmadı.

**Ne demiyor?** Yazı, jeopolitik risklerin azalmasının devam edeceğini ya da enerji fiyatlarının belirli bir seviyeye ineceğini göstermiyor.

**Alıntı:** "Özetle, ikinci çeyrekte enerji fiyatlarındaki yükselişin dış ticaret dengesi üzerindeki olumsuz etkisi, ihracattaki güçlü seyir sayesinde önemli ölçüde dengelendi."

**Dayanak:** Yazarlar; dış ticaret ve enerji verileriyle tarihsel ilişkileri, firma görüşmelerini, PMI verilerini ve kredi kartı harcama göstergelerini birlikte inceledi.

**Terimler:** *Dış ticaret dengesi*: Bir ülkenin ihracat gelirleri ile ithalat giderleri arasındaki fark. · *Cari işlemler dengesi*: Mal, hizmet ve gelir akımları ile para transferlerinin toplam dengesi. · *PMI*: Satın alma yöneticilerinin üretim ve talep değişimlerini değerlendirdiği endeks.

## 7 · Akaryakıt Fiyatlarında Eşel Mobil Mekanizması ve Enflasyona Olası Etkileri

2026-03-31 · Mert Gökcü, Eren Sezer · Enflasyon · [yazı](https://tcmbblog.org/wps/wcm/connect/blog/tr/main+menu/analizler/akaryakit+fiyatlarinda+esel+mobil+mekanizmasi+ve+enflasyona+olasi+etkileri)

Checks: **flagged: quote is not a verbatim sentence of the source** · topics: enflasyon, petrol-enerji

**Eşel mobil, petrol kaynaklı enflasyon baskısını sınırlıyor**

Mart 2026’da yürürlüğe giren eşel mobil mekanizmasının petrol fiyatı kaynaklı enflasyon etkilerini sınırlayıp sınırlamadığını hesapladılar.

Ne bulmuşlar?
- Brent petrol fiyatında yüzde 10’luk artış, tüketici enflasyonunu 12 ay sonunda 1 puan artırıyor.
- Brent petrol fiyatındaki artışın toplam enflasyon etkisi 24 ay içinde yaklaşık 1,2 puan olarak hesaplanıyor.
- Brent fiyatının 90 ABD doları olduğu senaryoda eşel mobilin enflasyonu düşürücü etkisi 3,7 yüzde puana kadar çıkıyor.

**Ne anlama geliyor?** Vergi ayarları, uluslararası petrol fiyatlarındaki artışın akaryakıt ve diğer sektörlerdeki enflasyon baskısını kısmen karşılayabiliyor.

**Ne demiyor?** Yazı, gelecekte gerçekleşecek enflasyon oranını ölçmüyor; 70 ila 90 ABD doları Brent senaryolarına dayalı etkileri hesaplıyor.

**Alıntı:** "Brent petrol fiyatında yüzde 10’luk bir artışın tüketici enflasyonunu 12 ay sonunda doğrudan ve dolaylı etkiler kanalıyla nihai olarak 1 puan artırdığına işaret ediyor."

**Dayanak:** Yazarlar, güncellenen 2025 çalışmasını kullanarak Mart 2026-Şubat 2027 dönemi için 70 ila 90 ABD dolarlık Brent senaryolarını ve birebir fiyat geçişkenliği varsayımını kullandılar.

**Terimler:** *Eşel mobil*: Akaryakıt fiyatlarındaki artışları sınırlamak için vergi tutarlarını otomatik ayarlayan sistem. · *Manşet enflasyon*: Bankanın hesapladığı genel fiyat düzeyindeki yıllık enflasyon. · *Geçişkenlik*: Bir fiyat değişikliğinin ne kadarının başka bir fiyata yansıdığını gösteren oran.

## 6 · Dış Borç ve Ödemeler Dengesi İstatistiklerinin Derlenmesi ve Yayımlanmasında Yeni Dönem

2026-03-12 · Eda Altuntaş Dursun, Hakan Hüsnü Toprak, Furkan Çelen, Özgecan Çatalçam · Ödemeler Dengesi · [yazı](https://tcmbblog.org/wps/wcm/connect/blog/tr/main+menu/analizler/dis_bors_ve_odemeler_dengesi_istatistiklerinin_derlenmesi_ve_yayimlanmasinda_yeni_donem)

Checks: pass · topics: —

**Dış borç verileri elde tutana göre yeniden sınıflandırıldı ve 65 milyar dolar azaldı**

Yazarlar, dış borç ve ödemeler dengesi istatistiklerini uluslararası metodolojiye uygun hâle getirmek için yöntem değişikliklerini inceledi.

Ne bulmuşlar?
- Dış borç stoku, 2025 yılı üçüncü çeyreğinde yaklaşık 65 milyar ABD doları azaldı.
- Dış borcun GSYH'ye oranı, yeni yöntemle %36,7'den %32,5'e geriledi.
- Portföy yatırımları faiz giderleri, 2020 yılı eylülünden itibaren 8.922 milyon dolar yukarı güncellendi.

**Ne anlama geliyor?** Dış borç göstergeleri daha doğru ve uluslararası standartlarla uyumlu hâle geldi. Faiz giderleri de menkul kıymet bazında daha hassas hesaplanıyor.

**Ne demiyor?** Yazı, yöntem değişikliklerinin sonraki dönemlerde nasıl sonuçlanacağına dair bir tahmin yapmıyor.

**Alıntı:** "Sonuç olarak, Dış Borç ve Ödemeler Dengesi İstatistiklerinde yapılan güncellemeler ile uluslararası metodolojiye uygun, karşılaştırılabilir veriler elde edilerek dış yükümlülüklere ilişkin istatistikler arasındaki farklılıklar ortadan kalkıyor."

**Dayanak:** Yazarlar; TCMB menkul kıymet sahipliği, HMB faiz verileri, MKK faiz bilgileri ve eski dış borç serilerini karşılaştırarak etkileri ölçtü.

**Terimler:** *Yerleşiklik*: Bir kişi veya kurumun hangi ülkenin iktisadi sınırları içinde bulunduğunu gösteren kavram. · *UYP*: Bir ülkenin yurt dışı varlıklarını ve yükümlülüklerini gösteren Uluslararası Yatırım Pozisyonu istatistikleri. · *Portföy yatırımları*: Yabancıların bir ülkedeki hisse senedi ve tahvil gibi menkul kıymetlere yaptığı yatırımlar.

## 5 · Hanehalkı Beklentilerinin Ölçümünde Yeni Yaklaşım: Hanehalkı Beklenti Anketi

2026-02-24 · Özlem Sevinç, Ezgi Deryol, Kübra Yıldız Özertaş, Dilek Bölükbaş · Enflasyon · [yazı](https://tcmbblog.org/wps/wcm/connect/blog/tr/main+menu/analizler/hanehalki_beklentilerinin_olcumunde_yeni_yaklasim_hanehalki_+beklenti_anketi)

Checks: pass · topics: enflasyon, doviz-kur

**HBA, 12 ay sonrası enflasyon beklentisini TEA'ya göre daha düşük ölçüyor**

Yazarlar, TEA'nın sınırlı soru çerçevesinin hanehalkı beklentilerini yeterince ölçemediği için yeni HBA'yı incelediler.

Ne bulmuşlar?
- HBA'da 12 ay sonrası enflasyon beklentisi, TEA ölçümüne göre Ocak'ta 3,3, Şubat'ta 2,3 puan daha düşük.
- Şubat katılımcıları tüketici enflasyonu için %48,8, konut fiyatları için %35,4, dolar kuru için %19,0 bekliyor.
- Şubat katılımcılarının %55,5'i altını, %30,0'ı gayrimenkulü öncelikli yatırım aracı olarak sıraladı.

**Ne anlama geliyor?** Sektörel Enflasyon Beklentileri bülteninde hanehalkı verisi artık HBA'dan geliyor. İlk karşılaştırmada 12 ay sonrası enflasyon beklentisi eski ölçüme göre daha düşük.

**Ne demiyor?** Yazı yalnızca anket yöntemini ve 2026 Ocak–Şubat beklenti ölçümlerini değerlendiriyor; yatırım tavsiyesi sunmuyor.

**Alıntı:** "Özetle HBA hanehalkının beklentilerini Türkiye’ye özgü bir yaklaşımla, enflasyonu merkeze alan bir çerçevede daha net ve kapsamlı biçimde ölçme imkânı sağlıyor."

**Dayanak:** Bulgular, TÜİK iş birliğiyle yürütülen üç aylık rotasyonlu HBA'nın 2026 Ocak ve Şubat verileri ile TEA karşılaştırmasına dayanıyor.

**Terimler:** *HBA*: Türkiye'ye özgü sorular ve enflasyon odaklı yöntemle hanehalkı beklentilerini ölçen anket. · *TEA*: TÜİK'in Avrupa Komisyonu eşgüdümünde birçok ülkede uyguladığı standart tüketici eğilim anketi. · *Bilgi tedavisi*: Katılımcılara önce son ayın enflasyon oranını verip beklentilerini bu bilgiyle karşılaştırmalarını sağlamak.

## 4 · Kiralar İçin Yeni Bir Gösterge: Yeni Kiracı Kira Endeksi

2026-02-17 · Erdi Kızılkaya, Ezgi Deryol, Özgül Atılgan Ayanoğlu, Duygu Konukçu Çelik · Enflasyon · [yazı](https://tcmbblog.org/wps/wcm/connect/blog/tr/main+menu/analizler/kiralar+icin+yeni+bir+gosterge+yeni+kiraci+kira+endeksi)

Checks: **flagged: numbers not in source: 1, 2** · topics: enflasyon

**Yeni kira artışları resmî kira enflasyonundan daha erken yansıyor**

Yazarlar, mevcut endeksin yeni kiralardaki fiyatları geç yansıttığı için güncel gelişmeleri gösteren bir endeks geliştirdi.

Ne bulmuşlar?
- Ocak 2026 itibarıyla YKKE yıllık artışı yüzde 34,2'ye gerilerken TÜİK endeksi yüzde 56,6 seviyesinde.
- 2025'in son çeyreğinde 100 metrekare konutun medyan kirası Türkiye genelinde yaklaşık 22 bin TL, İstanbul'da 37 bin TL oldu.
- YKKE, 13 düzey-2 ve 6 düzey-1 olmak üzere 19 tabakada hesaplandı.

**Ne anlama geliyor?** Güncel kira artışı resmî endeksteki artıştan daha düşük görünüyor. Bu fark, kira kaleminin enflasyondaki ağırlığı nedeniyle önem taşıyor.

**Ne demiyor?** Yazı, YKKE'nin TÜİK Gerçek Kira Endeksi'nin yerine geçeceğini iddia etmiyor.

**Alıntı:** "Bu çerçevede, güncel kiralardaki artış oranlarının resmî endekse kıyasla daha düşük seviyelere gerilemiş olması, önümüzdeki dönemde tüketici enflasyonu içinde önemli bir ağırlığa sahip olan kira kaleminde aşağı yönlü hareketin devam edeceğini ima ediyor."

**Dayanak:** Bankaların KFE değerleme raporlarındaki kira değerleri 19 tabakada hedonik regresyonla hesaplandı ve hanehalkı sayıları ile ortalama konut değerleriyle ağırlıklandırıldı.

**Terimler:** *Yeni Kiracı Kira Endeksi*: Yeni kiracıların karşılaşabileceği kira bedellerindeki değişimi gösteren aylık endeks. · *TÜİK Gerçek Kira Endeksi*: Aynı konutun mevcut kiracılarına ödenen kira değişimini takip eden endeks. · *Hedonik regresyon*: Konutların kalite farklarını ayırarak kira değişimini ölçmeye çalışan yöntem.

## 3 · 2026 Yılı Tüketici Fiyat Endeksindeki Güncellemeler ve Etkileri

2026-02-04 · Dilara Ertuğ, Nagihan Özlü · Enflasyon · [yazı](https://tcmbblog.org/wps/wcm/connect/blog/tr/main+menu/analizler/2026+yili+tuketici+fiyat+endeksindeki+guncellemeler+ve+etkileri)

Checks: pass · topics: enflasyon

**Yeni TÜFE ağırlıkları Ocak 2026 enflasyonuna yaklaşık 0,1 puan azaltıcı etki yaptı**

Yazarlar, Ocak 2026’da yürürlüğe giren üç TÜFE metodoloji değişikliğinin enflasyon ölçümüne yansımalarını incelediler.

Ne bulmuşlar?
- Harcama grupları 12 ana gruptan 13 ana gruba çıktı; çevrim içi hizmetler ve elektrikli otomobil şarjı kapsama alındı.
- Hizmetlerin tüketim payı 7,4 puan arttı; enerji 3,2 puan, temel mallar 3,0 puan geriledi.
- Eski ve yeni ağırlıklar beşli hane düzeyinde karşılaştırıldığında Ocak 2026 enflasyonuna etki yaklaşık 0,1 puan azaltıcı bulundu.

**Ne anlama geliyor?** TÜFE’de hizmetlerin payı artarken enerji ve temel malların payı azaldı. Ocak 2026 ölçümünde yeni ağırlıklar toplam enflasyonu yaklaşık 0,1 puan aşağı çekti.

**Ne demiyor?** Çalışma, ağırlık değişikliğinin yıllık enflasyon üzerindeki etkisini doğrudan ölçmüyor; yalnızca Ocak 2026 aylık enflasyonunu hesaplıyor.

**Alıntı:** "Bu hesaplamalar, endeksin ağırlık yapısındaki değişikliğin ocak ayı enflasyonuna etkisinin yaklaşık 0,1 puan azaltıcı yönde olduğuna işaret ediyor."

**Dayanak:** TÜİK’ın yayımladığı beşli hane düzeyindeki fiyat endeksleri eski ve yeni ağırlıklarla karşılaştırılarak Ocak 2026 aylık enflasyon etkisi hesaplandı.

**Terimler:** *TÜFE*: Hanehalkının satın aldığı mal ve hizmetlerin fiyat değişimini gösteren endeks. · *Harcama ağırlığı*: TÜFE sepetindeki mal veya hizmetlerin toplam harcama içindeki payı. · *Baz yıl*: Endeks değerlerinin karşılaştırıldığı başlangıç yılı.

## 2 · Hanehalkı Enflasyon Beklentileri ve Hissedilen Enflasyon

2026-01-30 · Halil İbrahim Korkmaz, Ahmet Bilal Kurtoğlu, Furkan Höçük · Enflasyon · [yazı](https://tcmbblog.org/wps/wcm/connect/blog/tr/main+menu/analizler/hanehalki+enflasyon+beklentileri+ve+hissedilen+enflasyon)

Checks: pass · topics: enflasyon

**Hanehalkının enflasyon beklentileri gerçekleşen enflasyonun belirgin biçimde üzerinde**

Yazarlar, hanehalkı beklentileri ile hissedilen enflasyonun farkını ve bu farkı açıklayan harcamaları karşılaştırmalı olarak inceledi.

Ne bulmuşlar?
- 12 ay sonra gerçekleşen enflasyonu tahmin etmede hanehalkı beklentilerinde hata payı en yüksek.
- Düşük enflasyon yıllarında bile hanehalkı beklentileri gerçekleşen enflasyonun ortalama 10 puan üzerinde kalıyor.
- Birçok ülkede enflasyon yüzde 2 veya altındayken hanehalkı beklentileri yüzde 10 düzeyinde.

**Ne anlama geliyor?** Hanehalkının enflasyon algısı, genel enflasyon oranından daha yüksek olabiliyor. Gıda, enerji ve kira bu algıyı şekillendiren öne çıkan kalemler.

**Ne demiyor?** Yazı, merkez bankası iletişiminin beklenen iyileşmeyi sağlayacağını doğrudan ölçmüyor.

**Alıntı:** "Özetle, hanehalkı enflasyon beklentileri dünya genelinde olduğu gibi Türkiye’de de yapısal olarak mevcut enflasyonun ve diğer ekonomik aktörlerin beklentilerinin üzerinde seyrediyor."

**Dayanak:** Yazarlar, son 10 yıllık döneme ait sektörel anketleri, küresel karşılaştırmaları ve harcama kalemlerine ilişkin verileri birlikte kullandı.

**Terimler:** *Hissedilen enflasyon*: Hanehalkının günlük hayatındaki fiyat artışlarını ne kadar yüksek algıladığını gösteren ölçüm. · *Manşet enflasyon*: Genel enflasyon düzeyini gösteren temel ölçü. · *Yuvarlama etkisi*: Farklı algı ve beklentilerin yuvarlama etkisiyle yüzde 5, 10 gibi düzeylerde toplanması.

## 1 · 2025 Yılı Hizmet Fiyatlarına Yakın Mercek: Alt Kalemler Ne Anlatıyor?

2026-01-29 · Fethi Öğünç, Aysu Çelgin · Enflasyon · [yazı](https://tcmbblog.org/wps/wcm/connect/blog/tr/main+menu/analizler/2025+yili+hizmet+fiyatlarina+yakin+mercek+alt+kalemler+ne+anlatiyor)

Checks: pass · topics: enflasyon

**Hizmet enflasyonunda eğitim, kira ve yerel hizmetler öne çıktı**

Yazarlar, 2025'te hizmet enflasyonunun neden mal enflasyonundan yüksek kaldığını ve bu kalemlerin tüketici enflasyonuna katkısını inceledi.

Ne bulmuşlar?
- Tüketici enflasyonu 2025'te %30,9; mal enflasyonu %25, hizmet enflasyonu %44 oldu.
- En yüksek artış gösteren ilk 30 kalemin 19'u hizmet grubundaydı.
- 2025 sonunda kiranın katkısı 4,2, eğitimin 1,5, yerel hizmetlerin 2,1 puandı; toplam katkı 7,8 puandı.

**Ne anlama geliyor?** Tüketici enflasyonu gerilese de hizmet kalemlerinin katkısı yüksek kaldı. Üç grubun toplam katkısı 2025 sonunda 7,8 puana indi.

**Ne demiyor?** Yazı, bu kalemlerin enflasyonunu tek başına belirleyen bir neden ortaya koymuyor ve gelecekteki seyri tahmin etmiyor.

**Alıntı:** "Sonuç olarak, 2025 yılında hizmet enflasyonunun yüksek seyrinde eğitim ve kira yanında yerel nitelikli ve rekabetin görece sınırlı olduğu kalemler öne çıkıyor."

**Dayanak:** TÜFE'nin beşli düzey fiyat endeksleri, enflasyon katkı hesapları, 2019 karşılaştırması ve düzenleme incelemesi kullanıldı.

**Terimler:** *TÜFE*: Tüketicilerin satın aldığı mal ve hizmetlerin fiyat değişimini gösteren endeks. · *Enflasyona katkı*: Bir kalemin fiyat artışının genel enflasyona kaç puan eklediğini gösteren ölçüdür. · *Dezenflasyon*: Enflasyon hızının düşmesi sürecidir.
