import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";
import ts from "typescript";
const cache = new Map();
function readModule(file) {
  file = path.resolve(file);
  if (cache.has(file)) return cache.get(file);
  const exports = {}; cache.set(file,exports);
  if (!fs.existsSync(file)) return exports;
  const code = ts.transpileModule(fs.readFileSync(file,"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText;
  vm.runInNewContext(code,{exports,require:(name)=>name.endsWith(".json")?JSON.parse(fs.readFileSync(path.resolve(path.dirname(file),name),"utf8")):readModule(path.resolve(path.dirname(file),name+".ts"))},{filename:file});
  return exports;
}
const previous = readModule("src/data/words.ts");
const existing = previous.BASE_WORDS ?? previous.WORDS;
const source = JSON.parse(fs.readFileSync(".next/lesson-source.json","utf8").replace(/^\uFEFF/,""));
const rows = JSON.parse(fs.readFileSync(".next/lesson-vocab.json","utf8").replace(/^\uFEFF/,""));
const meta = `all right~all RIGHT~feel all right~be all right
awful~AW·ful~awful weather~feel awful
strange~STRANGE~a strange noise~a strange feeling
perfect~PER·fect~a perfect day~a perfect example
great~GREAT~a great time~a great idea
relaxed~re·LAXED~feel relaxed~a relaxed atmosphere
rude~RUDE~rude behaviour~be rude to someone
personal~PER·son·al~personal information~personal interests
age~AGE~at the age of~people of all ages
married~MAR·ried~get married~be married to
interests~IN·ter·ests~personal interests~share common interests
hobbies~HOB·bies~different hobbies~hobbies and interests
religion~re·LI·gion~respect a religion~freedom of religion
politics~POL·i·tics~international politics~discuss politics
money~MON·ey~save money~spend money
birthday~BIRTH·day~a birthday party~a birthday present
plan~PLAN~make a plan~a future plan
cancel~CAN·cel~cancel a meeting~cancel a flight
be into~be IN·to~be into music~be really into something
holiday~HOL·i·day~go on holiday~a summer holiday
communication~com·mu·ni·CA·tion~communication skills~effective communication
message~MES·sage~send a message~a text message
comment~COM·ment~make a comment~leave a comment
follower~FOL·low·er~gain followers~social media followers
blog~BLOG~write a blog~a travel blog
application~ap·pli·CA·tion~a job application~submit an application
employer~em·PLOY·er~a potential employer~a good employer
resume~RE·su·me~send a resume~an updated resume
future plan~FU·ture plan~discuss future plans~make a future plan
field~FIELD~a field of study~work in a field
training~TRAIN·ing~staff training~receive training
goal~GOAL~set a goal~achieve a goal
opportunity~op·por·TU·ni·ty~a job opportunity~an opportunity to learn
full-time job~full-TIME job~find a full-time job~have a full-time job
part-time work~part-TIME work~find part-time work~look for part-time work
ambition~am·BI·tion~a lifelong ambition~achieve an ambition
job advertisement~JOB ad·VER·tise·ment~read a job advertisement~respond to a job advertisement
apply for~ap·PLY for~apply for a job~apply for a course
applicant~AP·pli·cant~a successful applicant~a job applicant
CV~C·V~attach a CV~an updated CV
vacancy~VA·can·cy~a job vacancy~a vacancy for a receptionist
available~a·VAIL·a·ble~be available for work~available on Friday
previous experience~PRE·vi·ous ex·PE·ri·ence~previous work experience~gain previous experience
customer service~cus·tom·er SER·vice~good customer service~work in customer service
attach~at·TACH~attach a file~attach a CV
working hours~WORK·ing hours~flexible working hours~regular working hours
offer~OF·fer~offer help~offer to help
suggestion~sug·GES·tion~make a suggestion~a useful suggestion
apologise~a·POL·o·gise~apologise for being late~apologise to someone
reassure~re·as·SURE~reassure someone~reassure a customer
worry~WOR·ry~worry about money~don't worry
arrange~ar·RANGE~arrange a meeting~arrange transport
organise~OR·gan·ise~organise an event~organise a meeting
help out~help OUT~help out with a task~help someone out
make a list~make a LIST~make a shopping list~make a list of tasks
take care of~take CARE of~take care of children~take care of the arrangements
suitable~SUIT·a·ble~suitable for students~a suitable candidate
hardworking~hard·WORK·ing~a hardworking student~hardworking staff
confident~CON·fi·dent~feel confident~confident about the future
develop skills~de·VEL·op skills~develop communication skills~develop practical skills
work in a team~work in a TEAM~work in a small team~learn to work in a team
look forward to~look FOR·ward to~look forward to seeing someone~look forward to a holiday
greet~GREET~greet a visitor~greet someone with a smile
greeting~GREET·ing~a friendly greeting~exchange greetings
get in touch~get in TOUCH~get in touch with someone~get in touch by email
hear from~HEAR from~hear from a friend~hope to hear from you
reply~re·PLY~reply to an email~a quick reply
contact~CON·tact~contact a company~contact someone by phone
conversation~con·ver·SA·tion~have a conversation~start a conversation
introduce~in·tro·DUCE~introduce yourself~introduce someone to a colleague
surprise~sur·PRISE~a lovely surprise~a birthday surprise
news~NEWS~good news~hear the news
these days~these DAYS~work these days~live abroad these days
by the way~by the WAY~by the way, thanks~by the way, are you free
catch up with~catch UP with~catch up with friends~catch up with a colleague
meet for a chat~meet for a CHAT~meet for a chat after work~meet for a quick chat
socialise~SO·cial·ise~socialise with friends~socialise after work
host family~HOST fam·i·ly~stay with a host family~meet your host family
challenge~CHAL·lenge~face a challenge~a difficult challenge
experience~ex·PE·ri·ence~an amazing experience~a valuable experience
guidebook~GUIDE·book~a travel guidebook~read a guidebook
miss a train~miss a TRAIN~miss a morning train~nearly miss a train
break down~break DOWN~a car breaks down~break down on the motorway
get lost~get LOST~get lost in a city~get lost on the way
board the plane~board the PLANE~board the plane at a gate~wait to board the plane
excursion~ex·CUR·sion~a day excursion~go on an excursion
delayed~de·LAYED~a delayed flight~be delayed by traffic
cancelled~CAN·celled~a cancelled flight~a cancelled meeting
luggage allowance~LUG·gage al·LOW·ance~check the luggage allowance~a generous luggage allowance
travel insurance~TRAV·el in·SUR·ance~buy travel insurance~take out travel insurance
picturesque~pic·tur·ESQUE~a picturesque village~picturesque scenery
breathtaking~BREATH·tak·ing~a breathtaking view~breathtaking scenery
unforgettable~un·for·GET·ta·ble~an unforgettable experience~an unforgettable holiday
hospitality~hos·pi·TAL·i·ty~warm hospitality~thank someone for their hospitality
turbulence~TUR·bu·lence~severe turbulence~experience turbulence
ticket office~TICK·et of·fice~find the ticket office~buy a ticket at the ticket office
platform~PLAT·form~a train platform~leave from platform five
timetable~TIME·ta·ble~a train timetable~check the timetable
single ticket~SIN·gle tick·et~buy a single ticket~a single ticket to London
return ticket~re·TURN tick·et~buy a return ticket~a return ticket to Oxford
bus station~BUS sta·tion~arrive at the bus station~a central bus station
tourist information centre~TOUR·ist in·for·MA·tion cen·tre~visit a tourist information centre~ask at the tourist information centre
travel blog~TRAV·el blog~write a travel blog~read a travel blog
opening hours~O·pen·ing hours~check the opening hours~extended opening hours
harbour~HAR·bour~a fishing harbour~a small harbour
sightseeing tour~SIGHT·see·ing tour~go on a sightseeing tour~a guided sightseeing tour
housemate~HOUSE·mate~share with a housemate~a friendly housemate
commuter~com·MUT·er~a daily commuter~commuter traffic
express train~ex·PRESS train~take an express train~an express train to London
fare~FARE~a bus fare~pay the fare
in advance~in ad·VANCE~book in advance~pay in advance
booking reference~BOOK·ing ref·er·ence~a booking reference number~quote your booking reference
peak hours~PEAK hours~travel during peak hours~avoid peak hours
welcoming~WEL·com·ing~a welcoming atmosphere~a welcoming smile
attractive~at·TRAC·tive~an attractive place~an attractive offer
efficient~ef·FI·cient~an efficient service~an efficient system
local speciality~LO·cal spe·ci·AL·i·ty~try a local speciality~serve a local speciality
recommendation~rec·om·men·DA·tion~make a recommendation~a personal recommendation
credit card~CRED·it card~pay by credit card~a credit card bill
bank account~BANK ac·count~open a bank account~check a bank account
save up~save UP~save up for a holiday~save up enough money
expense~ex·PENSE~a major expense~travel expenses
investment~in·VEST·ment~make an investment~a long-term investment
charity~CHAR·i·ty~give to charity~a local charity
donation~do·NA·tion~make a donation~a generous donation
impulsive buying~im·PUL·sive buy·ing~avoid impulsive buying~a habit of impulsive buying
financial independence~fi·NAN·cial in·de·PEN·dence~achieve financial independence~work towards financial independence
value for money~VAL·ue for mon·ey~good value for money~offer value for money
extravagant~ex·TRAV·a·gant~an extravagant lifestyle~extravagant spending
economical~e·co·NOM·i·cal~an economical car~be economical with money
overspend~o·ver·SPEND~overspend on clothes~avoid overspending
shop assistant~SHOP as·sis·tant~ask a shop assistant~work as a shop assistant
cash register~CASH reg·is·ter~use a cash register~work at the cash register
PIN~PIN~enter your PIN~remember your PIN
present~PRES·ent~a birthday present~give a present
gift~GIFT~a thoughtful gift~give a gift
price tag~PRICE tag~check the price tag~an expensive price tag
fundraising~FUND·rais·ing~a fundraising event~organise fundraising
sponsor~SPON·sor~sponsor an event~sponsor a local team
exchange~ex·CHANGE~exchange an item~exchange a shirt
cashier~cash·IER~pay the cashier~work as a cashier
contactless payment~CON·tact·less pay·ment~make a contactless payment~accept contactless payments
overpriced~o·ver·PRICED~an overpriced product~an overpriced restaurant
affordable~af·FORD·a·ble~an affordable price~affordable housing
generosity~gen·er·OS·i·ty~show generosity~thank someone for their generosity
volunteer~vol·un·TEER~a charity volunteer~work as a volunteer
supporter~sup·PORT·er~a loyal supporter~a charity supporter
awareness~a·WARE·ness~raise awareness~public awareness
non-profit organisation~non-PROF·it or·gan·i·SA·tion~a local non-profit organisation~work for a non-profit organisation
campaign~cam·PAIGN~a fundraising campaign~launch a campaign
tie~TIE~wear a tie~a silk tie
bracelet~BRACE·let~a silver bracelet~wear a bracelet
high heels~high HEELS~wear high heels~a pair of high heels
tracksuit~TRACK·suit~wear a tracksuit~a sports tracksuit
sweatshirt~SWEAT·shirt~a cotton sweatshirt~wear a sweatshirt
gloves~GLOVES~a pair of gloves~wear gloves
tights~TIGHTS~a pair of tights~wear tights
earrings~EAR·rings~a pair of earrings~silver earrings
sandals~SAN·dals~wear sandals~a pair of sandals
flat shoes~flat SHOES~wear flat shoes~comfortable flat shoes
formal~FOR·mal~formal clothes~a formal meeting
casual~CAS·u·al~casual clothes~a casual event
ancient~AN·cient~an ancient temple~an ancient city
magnificent~mag·NIF·i·cent~a magnificent view~a magnificent building
ordinary~OR·di·nar·y~an ordinary day~an ordinary building
narrow~NAR·row~a narrow street~a narrow path
wide~WIDE~a wide road~a wide range
empty~EMP·ty~an empty room~an empty street
arrangement~ar·RANGE·ment~make an arrangement~a travel arrangement
invitation~in·vi·TA·tion~accept an invitation~send an invitation
invite~in·VITE~invite someone to dinner~invite a friend
busy~BUS·y~a busy day~be busy with work
get together~get to·GETH·er~get together with friends~get together for dinner
come round~come ROUND~come round for dinner~come round to my house
meet up~meet UP~meet up with friends~meet up after work
reschedule~re·SCHED·ule~reschedule a meeting~reschedule an appointment
appointment~ap·POINT·ment~make an appointment~a dentist's appointment
catch up~catch UP~catch up over coffee~catch up with friends
birthday dinner~BIRTH·day din·ner~organise a birthday dinner~attend a birthday dinner
barbecue~BAR·be·cue~have a barbecue~a family barbecue
housewarming party~HOUSE·warm·ing par·ty~have a housewarming party~invite someone to a housewarming party
celebration~cel·e·BRA·tion~a birthday celebration~hold a celebration
host~HOST~host a party~host an event
guest~GUEST~welcome a guest~a dinner guest
accept an invitation~ac·CEPT an in·vi·TA·tion~accept an invitation to dinner~gladly accept an invitation
decline an invitation~de·CLINE an in·vi·TA·tion~politely decline an invitation~decline an invitation to a party
bring along~bring a·LONG~bring along a friend~bring along some food
confirm~con·FIRM~confirm a booking~confirm a meeting
flexible~FLEX·i·ble~flexible working hours~a flexible schedule
memorable~MEM·o·ra·ble~a memorable evening~a memorable experience
strengthen relationships~STRENGTH·en re·LA·tion·ships~strengthen family relationships~strengthen relationships at work
always~AL·ways~always arrive early~always remember
usually~U·su·al·ly~usually go to work~usually eat at home
normally~NOR·mal·ly~normally work from home~normally arrive on time
often~OF·ten~often visit friends~often travel by bus
sometimes~SOME·times~sometimes go shopping~sometimes feel tired
hardly ever~HARD·ly ev·er~hardly ever eat out~hardly ever arrive late
never~NEV·er~never give up~never be late
seldom~SEL·dom~seldom travel alone~seldom eat out
amazing~a·MAZ·ing~an amazing view~an amazing experience
gorgeous~GOR·geous~a gorgeous beach~gorgeous weather
information desk~in·for·MA·tion desk~ask at the information desk~find the information desk
high~HIGH~a high building~a high price
tiny~TI·ny~a tiny room~a tiny village
huge~HUGE~a huge building~a huge crowd
low~LOW~a low price~a low wall
travel around~TRAV·el a·round~travel around a country~travel around the world
get to~GET to~get to the airport~get to work
go away~go a·WAY~go away for a weekend~go away on holiday
do some sightseeing~do some SIGHT·see·ing~do some sightseeing in town~do some sightseeing on holiday
change~CHANGE~change trains~change a booking
raise money~raise MON·ey~raise money for charity~raise money for a school
arrange a meeting~ar·RANGE a meet·ing~arrange a meeting with a client~arrange a meeting for Monday
till~TILL~pay at the till~work at the till
scarf~SCARF~wear a scarf~a warm scarf
T-shirt~T-SHIRT~a cotton T-shirt~wear a T-shirt
formal jacket~FOR·mal jack·et~wear a formal jacket~a smart formal jacket
loan~LOAN~a bank loan~repay a loan
receptionist~re·CEP·tion·ist~a hotel receptionist~work as a receptionist
plumber~PLUMB·er~call a plumber~a qualified plumber
accountant~ac·COUNT·ant~a junior accountant~work as an accountant
pilot~PI·lot~an airline pilot~a qualified pilot
electrician~e·lec·TRI·cian~a qualified electrician~call an electrician
instructor~in·STRUC·tor~a driving instructor~an outdoor activity instructor
engineer~en·gi·NEER~a civil engineer~work as an engineer
lawyer~LAW·yer~consult a lawyer~a qualified lawyer
rewarding~re·WARD·ing~a rewarding job~a rewarding experience
careers fair~ca·REERS fair~attend a careers fair~a university careers fair
responsibility~re·spon·si·BIL·i·ty~take responsibility~a main responsibility
necklace~NECK·lace~a gold necklace~wear a necklace
shirt~SHIRT~a cotton shirt~wear a shirt
clothing~CLOTH·ing~warm clothing~protective clothing
furniture~FUR·ni·ture~buy furniture~a piece of furniture
luggage~LUG·gage~carry luggage~a piece of luggage
bottle~BOT·tle~a water bottle~a bottle of water
ticket~TICK·et~buy a ticket~a train ticket
donate~do·NATE~donate money~donate to charity
information~in·for·MA·tion~useful information~a piece of information
`.trim().split("\n").map(s=>s.split("~"));
const extras = [
  [7,"donate","v","/dəʊˈneɪt/","quyên góp, hiến tặng","Many students donate old books to charity.","Nhiều học sinh quyên góp sách cũ cho tổ chức từ thiện."],
  [10,"information","n","/ˌɪnfəˈmeɪʃən/","thông tin (danh từ không đếm được)","Could you give me some information about the course?","Bạn có thể cho tôi thông tin về khóa học không?"],
  [5,"travel around","phr","/ˌtrævəl əˈraʊnd/","đi du lịch khắp một nơi","We want to travel around Thailand.","Chúng tôi muốn đi du lịch khắp Thái Lan."],
  [5,"get to","phr","/ˈɡet tuː/","đến, tới một nơi","How did you get to the airport?","Bạn đến sân bay bằng cách nào?"],
  [5,"go away","phrv","/ɡəʊ əˈweɪ/","đi xa, đi nghỉ ở nơi khác","We want to go away for the weekend.","Chúng tôi muốn đi nghỉ xa vào cuối tuần."],
  [5,"do some sightseeing","phr","/duː səm ˈsaɪtsiːɪŋ/","đi tham quan ngắm cảnh","We will do some sightseeing tomorrow.","Ngày mai chúng tôi sẽ đi tham quan."],
  [5,"change","v","/tʃeɪndʒ/","đổi, thay đổi","We need to change trains in London.","Chúng tôi cần đổi tàu ở Luân Đôn."],
  [7,"raise money","phr","/reɪz ˈmʌni/","gây quỹ, quyên tiền","The concert will raise money for charity.","Buổi hòa nhạc sẽ gây quỹ từ thiện."],
  [10,"arrange a meeting","phr","/əˌreɪndʒ ə ˈmiːtɪŋ/","sắp xếp một cuộc họp","Can we arrange a meeting for Monday?","Chúng ta có thể sắp xếp cuộc họp vào thứ Hai không?"],
  [7,"till","n","/tɪl/","quầy hoặc máy thu ngân (Anh-Anh)","You can pay at the till.","Bạn có thể thanh toán ở quầy thu ngân."],
  [8,"scarf","n","/skɑːf/","khăn quàng cổ","Wear a scarf to keep your neck warm.","Hãy quàng khăn để giữ ấm cổ."],
  [8,"T-shirt","n","/ˈtiːʃɜːt/","áo phông, áo thun","He is wearing a blue T-shirt.","Anh ấy đang mặc áo phông màu xanh."],
  [8,"formal jacket","n","/ˌfɔːməl ˈdʒækɪt/","áo khoác dùng trong dịp trang trọng","She wore a formal jacket to the interview.","Cô ấy mặc áo khoác lịch sự đến buổi phỏng vấn."],
  [6,"loan","n","/ləʊn/","khoản vay","They took out a loan to buy a car.","Họ vay một khoản tiền để mua xe."],
  [11,"receptionist","n","/rɪˈsepʃənɪst/","nhân viên lễ tân","The receptionist welcomed us to the hotel.","Lễ tân chào đón chúng tôi đến khách sạn."],
  [11,"plumber","n","/ˈplʌmə/","thợ sửa ống nước","The plumber repaired a broken pipe.","Thợ sửa ống nước sửa một đường ống hỏng."],
  [11,"accountant","n","/əˈkaʊntənt/","kế toán viên","An accountant checks financial records.","Kế toán viên kiểm tra sổ sách tài chính."],
  [11,"pilot","n","/ˈpaɪlət/","phi công","The pilot flew the aircraft safely.","Phi công lái máy bay an toàn."],
  [11,"electrician","n","/ɪˌlekˈtrɪʃən/","thợ điện","An electrician installed the lights.","Thợ điện lắp đèn."],
  [11,"instructor","n","/ɪnˈstrʌktə/","người hướng dẫn, huấn luyện viên","Our instructor taught us how to climb safely.","Người hướng dẫn dạy chúng tôi cách leo núi an toàn."],
  [11,"engineer","n","/ˌendʒɪˈnɪə/","kỹ sư","The engineer designed a new bridge.","Kỹ sư thiết kế một cây cầu mới."],
  [11,"lawyer","n","/ˈlɔːjə/","luật sư","You should ask a lawyer for legal advice.","Bạn nên hỏi luật sư để được tư vấn pháp lý."],
  [11,"rewarding","adj","/rɪˈwɔːdɪŋ/","bổ ích, mang lại sự hài lòng","Teaching can be a rewarding job.","Dạy học có thể là một công việc bổ ích."],
  [11,"careers fair","n","/kəˈrɪəz feə/","ngày hội việc làm","We met several employers at the careers fair.","Chúng tôi gặp vài nhà tuyển dụng tại ngày hội việc làm."],
  [11,"responsibility","n","/rɪˌspɒnsəˈbɪləti/","trách nhiệm","Answering emails is part of my responsibility.","Trả lời email là một phần trách nhiệm của tôi."],
  [10,"necklace","n","/ˈnekləs/","dây chuyền, vòng cổ","She wore a silver necklace.","Cô ấy đeo một chiếc dây chuyền bạc."],
  [10,"shirt","n","/ʃɜːt/","áo sơ mi","He wore a white shirt to work.","Anh ấy mặc áo sơ mi trắng đi làm."],
  [10,"clothing","n","/ˈkləʊðɪŋ/","quần áo (danh từ không đếm được)","We donated warm clothing to the charity.","Chúng tôi quyên góp quần áo ấm cho tổ chức từ thiện."],
  [10,"furniture","n","/ˈfɜːnɪtʃə/","đồ nội thất (không đếm được)","The room has very little furniture.","Căn phòng có rất ít đồ nội thất."],
  [10,"luggage","n","/ˈlʌɡɪdʒ/","hành lý (không đếm được)","Please keep your luggage with you.","Hãy giữ hành lý bên mình."],
  [10,"bottle","n","/ˈbɒtəl/","chai, lọ","I brought a bottle of water.","Tôi mang theo một chai nước."],
  [10,"ticket","n","/ˈtɪkɪt/","vé","You need a ticket to enter the museum.","Bạn cần vé để vào bảo tàng."],
  [1,"always","adv","/ˈɔːlweɪz/","luôn luôn","I always drink water in the morning.","Tôi luôn uống nước vào buổi sáng."],
  [1,"usually","adv","/ˈjuːʒuəli/","thường thường","We usually walk to school.","Chúng tôi thường đi bộ đến trường."],
  [1,"normally","adv","/ˈnɔːməli/","thông thường","She normally works from home.","Cô ấy thường làm việc ở nhà."],
  [1,"often","adv","/ˈɒfən/","thường, hay","I often visit my grandparents.","Tôi thường thăm ông bà."],
  [1,"sometimes","adv","/ˈsʌmtaɪmz/","thỉnh thoảng","We sometimes eat out.","Thỉnh thoảng chúng tôi ăn ngoài."],
  [1,"hardly ever","adv","/ˌhɑːdli ˈevə/","hầu như không bao giờ","He hardly ever arrives late.","Anh ấy hầu như không bao giờ đến muộn."],
  [1,"never","adv","/ˈnevə/","không bao giờ","I never smoke.","Tôi không bao giờ hút thuốc."],
  [1,"seldom","adv","/ˈseldəm/","hiếm khi","We seldom travel in winter.","Chúng tôi hiếm khi đi du lịch vào mùa đông."],
  [1,"amazing","adj","/əˈmeɪzɪŋ/","đáng kinh ngạc, tuyệt vời","The performance was amazing.","Buổi biểu diễn thật tuyệt vời."],
  [5,"gorgeous","adj","/ˈɡɔːdʒəs/","rất đẹp, lộng lẫy","The beach was gorgeous at sunset.","Bãi biển rất đẹp lúc hoàng hôn."],
  [4,"information desk","n","/ˌɪnfəˈmeɪʃən desk/","quầy thông tin","We asked at the information desk.","Chúng tôi hỏi tại quầy thông tin."],
  [8,"high","adj","/haɪ/","cao","The hotel has a high ceiling.","Khách sạn có trần cao."],
  [8,"tiny","adj","/ˈtaɪni/","rất nhỏ","They live in a tiny village.","Họ sống trong một ngôi làng rất nhỏ."],
  [8,"huge","adj","/hjuːdʒ/","rất lớn, khổng lồ","There was a huge crowd outside.","Có một đám đông rất lớn ở bên ngoài."],
  [8,"low","adj","/ləʊ/","thấp","The shop offers low prices.","Cửa hàng bán với giá thấp."],
];
const rename = {"be into (something)":"be into","hear from somebody":"hear from","catch up with somebody":"catch up with","miss (a train)":"miss a train","tourist information center":"tourist information centre","local specialty":"local speciality","non-profit organization":"non-profit organisation","PIN / PIN number":"PIN","present / gift":"present","bring something along":"bring along"};
const fixes = {
  "miss a train":{ipa:"/mɪs ə ˈtreɪn/"},
  "break down":{ipa:"/ˌbreɪk ˈdaʊn/"},
  "get lost":{ipa:"/ɡet ˈlɒst/"},
  "board the plane":{ipa:"/bɔːd ðə ˈpleɪn/"},
  "peak hours":{ipa:"/ˈpiːk ˌaʊəz/"},
  "save up":{ipa:"/ˌseɪv ˈʌp/"},
  "come round":{ipa:"/ˌkʌm ˈraʊnd/"},
  "meet up":{ipa:"/ˌmiːt ˈʌp/"},
  "catch up":{ipa:"/ˌkætʃ ˈʌp/"},
  "full-time job":{ipa:"/ˌfʊlˈtaɪm dʒɒb/"},
  "part-time work":{ipa:"/ˌpɑːtˈtaɪm wɜːk/"},
  "help out":{ipa:"/ˌhelp ˈaʊt/"},
  "make a list":{ipa:"/meɪk ə ˈlɪst/"},
  "take care of":{ipa:"/teɪk ˈkeər əv/"},
  "work in a team":{ipa:"/wɜːk ɪn ə ˈtiːm/"},
  "contact":{pos:"v",ipa:"/ˈkɒntækt/",vi:"liên lạc, liên hệ (v); sự liên lạc (n)"},
  "present":{ipa:"/ˈpreznt/",vi:"quà tặng"},
  "exchange":{pos:"v",vi:"đổi hàng (v); sự đổi hàng (n)"},
  "offer":{pos:"v",vi:"đề nghị giúp (v); lời đề nghị giúp (n)"},
  "host":{pos:"v",vi:"tổ chức, đăng cai (v); chủ nhà, chủ tiệc (n)"},
  "sponsor":{pos:"v",vi:"tài trợ (v); nhà tài trợ (n)"},
  "reply":{pos:"v",vi:"trả lời (v); câu trả lời (n)"},
  "tourist information centre":{ipa:"/ˌtʊərɪst ˌɪnfəˈmeɪʃən ˈsentə/"},
  "local speciality":{ipa:"/ˌləʊkəl ˌspeʃiˈæləti/"},
  "non-profit organisation":{ipa:"/ˌnɒnˈprɒfɪt ˌɔːɡənaɪˈzeɪʃən/"},
  "financial independence":{ipa:"/faɪˌnænʃəl ˌɪndɪˈpendəns/"},
  "luggage allowance":{ipa:"/ˈlʌɡɪdʒ əˌlaʊəns/"},
  "reschedule":{ipa:"/ˌriːˈʃedʒuːl/"},
  "PIN":{ipa:"/pɪn/"},
};
const customExamples = {
  "miss a train":["There is no need to panic if you miss a train.","Không cần hoảng hốt nếu bạn lỡ một chuyến tàu."],
  "break down":["Cars sometimes break down in cold weather.","Xe ô tô đôi khi bị hỏng khi trời lạnh."],
  "get lost":["If you get lost, call me.","Nếu bạn bị lạc, hãy gọi tôi."],
  "help out":["Can you help out with the decorations?","Bạn có thể giúp một tay trang trí không?"],
  "catch up with":["I'd like to catch up with my old classmates.","Tôi muốn gặp lại và hỏi thăm các bạn học cũ."],
  "develop skills":["This job will help you develop skills in communication.","Công việc này sẽ giúp bạn phát triển kỹ năng giao tiếp."],
  "work in a team":["You need to work in a team on this project.","Bạn cần làm việc nhóm trong dự án này."],
  "PIN":["Please enter your PIN.","Vui lòng nhập mã PIN."],
  "present":["I bought a birthday present for my sister.","Tôi mua quà sinh nhật cho em gái."],
  "gift":["Thank you for your thoughtful gift.","Cảm ơn món quà chu đáo của bạn."],
  "interests":["Music and travel are my main interests.","Âm nhạc và du lịch là những mối quan tâm chính của tôi."],
  "hobbies":["My hobbies include reading and swimming.","Sở thích của tôi gồm đọc sách và bơi lội."],
  "comment":["Please leave a comment on my blog.","Hãy để lại bình luận trên blog của tôi."],
  "follower":["The singer has a new follower on her blog.","Ca sĩ có thêm một người theo dõi mới trên blog."],
  "be into":["You don't have to be into football to enjoy the match.","Bạn không cần mê bóng đá để thưởng thức trận đấu."],
  "experience":["Visiting Japan was an unforgettable experience.","Chuyến đi Nhật Bản là một trải nghiệm khó quên."],
  "tourist information centre":["We visited the tourist information centre to get a map.","Chúng tôi đến trung tâm thông tin du lịch để lấy bản đồ."],
  "local speciality":["You should try this local speciality.","Bạn nên thử món đặc sản địa phương này."],
  "non-profit organisation":["She works for a non-profit organisation.","Cô ấy làm việc cho một tổ chức phi lợi nhuận."],
  "bring along":["Please bring along some drinks.","Vui lòng mang theo ít đồ uống."],
  "accept an invitation":["I was happy to accept an invitation to dinner.","Tôi vui vẻ nhận lời mời ăn tối."],
  "decline an invitation":["You can politely decline an invitation.","Bạn có thể lịch sự từ chối lời mời."],
  "host":["We will host a small party on Friday.","Chúng tôi sẽ tổ chức một bữa tiệc nhỏ vào thứ Sáu."],
};
const slug = s=>s.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
const merged = new Map(), mapping=[];
for (const row of [...rows].sort((a,b)=>a.lesson-b.lesson)) {
  const word=rename[row.word]??row.word;
  const key=word==="experience"&&row.lesson===2?"experience-event":word;
  const entry=merged.get(key)??{...row,word,...(key==="experience-event"?{sense:"event",vi:"một trải nghiệm, sự việc đã trải qua"}:{}),lessons:[]};
  if(!entry.lessons.includes(row.lesson))entry.lessons.push(row.lesson);
  merged.set(key,entry); mapping.push({lesson:row.lesson,sourceTerm:row.word,word});
}
const gift = {...merged.get("present"),word:"gift",ipa:"/ɡɪft/",lessons:[7]};merged.set("gift",gift);mapping.push({lesson:7,sourceTerm:"present / gift",word:"gift"});
for(const [lesson,word,pos,ipa,vi,en,exVi] of extras){const sense=word==="change"?"verb":undefined;merged.set(sense?`${word}-${sense}`:word,{lesson,lessons:[lesson],word,pos,ipa,vi,...(sense?{sense}:{})});customExamples[word]=[en,exVi];mapping.push({lesson,sourceTerm:word,word});}
const added=[], refs={}, report=[], missing=[];
for(const row of merged.values()){
  let word=row.word;
  // Reuse existing IDs only for the same headword and the meaning used in the lesson.
  const old=row.sense?undefined:existing.find(w=>w.word.toLowerCase()===word.toLowerCase());
  const wordId=row.sense?`${slug(word)}-${row.sense}`:old?.id??slug(word);
  const lessonRefs=row.lessons.map(lesson=>({levelId:"pre-intermediate",lesson}));
  refs[wordId]=[...(refs[wordId]??[]),...lessonRefs];
  report.push({word,wordId,lessonIds:row.lessons,status:old?"existing":"added",sourceTerms:mapping.filter(m=>m.word===word).map(m=>m.sourceTerm)});
  if(old)continue;
  const m=meta.find(m=>m[0]===word);if(!m)throw Error(`Missing reviewed metadata: ${word}`);
  const correction=fixes[word]??{};
  let pos=correction.pos??(/adj/.test(row.pos)?"adj":/adv/.test(row.pos)?"adv":/phr.v|phr v|v.phr|v phr|prep.p/.test(row.pos)?"phr":/v/.test(row.pos)&&!/n/.test(row.pos)?"v":"n");
  let example=customExamples[word];
  if(!example){
    const doc=source.find(d=>d.lesson===row.lesson&&!d.key);
    const start=doc.lines.findIndex(s=>/^I\.\s/.test(s)),end=doc.lines.findIndex((s,i)=>i>start&&/^II[.\s]/.test(s));
    const candidates=doc.lines.slice(start,end).flatMap(s=>s.split(/(?=\d+\. [A-Za-z][A-Za-z ()/'’-]+:)/)).map(s=>s.replace(/^\d+\.\s*/,""));
    const prefix=[word,row.word,word==="hear from"?"hear from":null,word==="miss a train"?"miss a train":null].filter(Boolean).map(s=>s.toLowerCase()+":");
    const sample=candidates.find(s=>prefix.some(p=>s.toLowerCase().startsWith(p)))??candidates.find(s=>!s.includes(":")&&s.includes(" (")&&s.toLowerCase().includes(word.toLowerCase()));
    if(sample){const clean=sample.includes(":")?sample.slice(sample.indexOf(":")+1).trim():sample;const split=clean.lastIndexOf(" (");if(split>0)example=[clean.slice(0,split).trim(),clean.slice(split+2).replace(/\)\s*$/,"" ).trim()];}
  }
  if(!example){ missing.push(word); continue; }
  const topic=([3,4,5].includes(row.lesson)?"travel":[6,7].includes(row.lesson)?"shopping":[11,12].includes(row.lesson)?"work":row.lesson===8?"shopping":"people");
  const alt={"tourist information centre":["tourist information center"],"local speciality":["local specialty"],"non-profit organisation":["non-profit organization"],"resume":["résumé"],"cancelled":["canceled"],"socialise":["socialize"],"organise":["organize"],"apologise":["apologize"]}[word];
  const additionalPos=/\bn\b/.test(row.pos)&&/\bv\b/.test(row.pos)?[pos==='n'?'v':'n']:/adj/.test(row.pos)&&/adv/.test(row.pos)?['adv']:undefined;
  added.push({id:wordId,word,pos,...(additionalPos?{additionalPos}:{}),vi:correction.vi??row.vi,ipa:correction.ipa??row.ipa,stress:m[1],level:"B1",topic,collocations:m.slice(2,4),example:example[0],exampleVi:example[1],...(alt?{altSpellings:alt}:{}),lessonRefs,
    references:[`https://dictionary.cambridge.org/dictionary/english/${encodeURIComponent(word.toLowerCase().replace(/ /g,"-"))}`]});
}
if(missing.length)throw Error(`Missing examples: ${missing.join('; ')}`);
const reviewTerms={
  1:['always','usually','normally','often','sometimes','occasionally','rarely','seldom','hardly ever','never'],
  5:['delicious','gorgeous','awful','strange','relaxed','crowded','perfect','rude','travel around','get to','go away','set off','check out','do some sightseeing'],
  7:['support','raise money','till','donate'],
  10:['borrow','earrings','donation','tracksuit','receipt','bracelet','arrange a meeting','afford','charity','housewarming party','discount','gloves','raise money','reschedule','lend','necklace','sweatshirt','crowded','peaceful','ancient','birthday dinner','barbecue','shirt','advice','information','ticket','furniture','luggage','bottle','clothing'],
};
for(const [lesson,terms] of Object.entries(reviewTerms))for(const term of terms){
  const word=added.find(w=>w.word===term)??existing.find(w=>w.word===term);
  if(!word)throw Error(`Missing review term: ${term}`);
  const list=refs[word.id]??=[];
  if(!list.some(r=>r.levelId==='pre-intermediate'&&r.lesson===Number(lesson)))list.push({levelId:'pre-intermediate',lesson:Number(lesson)});
  const fresh=added.find(w=>w.id===word.id);if(fresh)fresh.lessonRefs=list;
}
for(const r of report)r.lessonIds=[...new Set((refs[r.wordId]??[]).map(r=>r.lesson))].sort((a,b)=>a-b);
const verified=fs.existsSync("docs/lesson-vocabulary-references.json")?JSON.parse(fs.readFileSync("docs/lesson-vocabulary-references.json","utf8")):[];
const sameWord=(a,b)=>a.toLowerCase().replace(/ise$/,"ize").replace(/-/g," ")===b.toLowerCase().replace(/ise$/,"ize").replace(/-/g," ");
const posNames={n:"noun",v:"verb",adj:"adjective",adv:"adverb",phrv:"phrasal verb",phr:"phrasal verb"};
for(const word of added){
  const fact=verified.find(v=>v.id===word.id)?.reference;
  if(!fact)continue;
  word.references=[fact.url];
  const exact=sameWord(word.word,fact.headword);
  if(exact&&fact.pos===posNames[word.pos]&&fact.ukIpa)word.ipa=fact.ukIpa;
  if(exact&&['A1','A2','B1','B2'].includes(fact.cefr))word.level=fact.cefr;
  else word.levelIsEstimate=true;
}
fs.writeFileSync("src/data/lesson-words.json",JSON.stringify(added,null,2)+"\n");
fs.writeFileSync("src/data/lesson-word-refs.json",JSON.stringify(refs,null,2)+"\n");
fs.writeFileSync("docs/lesson-vocabulary-audit.json",JSON.stringify({sourceRows:rows.length,uniqueEntries:merged.size,added:added.length,existing:report.filter(r=>r.status==="existing").length,entries:report,corrections:fixes},null,2)+"\n");
console.log(`Vocabulary: ${added.length} new, ${report.filter(r=>r.status==="existing").length} existing; ${mapping.length} source mappings.`);
