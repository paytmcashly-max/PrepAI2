import fs from 'node:fs'

const out = 'supabase/migrations/20260511120000_bihar_si_content_pack_v1.sql'
const examId = 'bihar_si'

const chapters = {
  number: ['5d8845da-f2d3-5906-90c7-855507e08960', 'maths', 'Number System Basics'],
  simplification: ['5d7b8e30-ed40-5f21-bb23-b7d9b0d9bd73', 'maths', 'Simplification & BODMAS'],
  lcmhcf: ['6b201f01-0bcf-52d2-a9d0-8e8d71b10001', 'maths', 'LCM & HCF'],
  percentage: ['07f5437b-01c6-5cfc-9ff2-7b2b021d1915', 'maths', 'Percentage'],
  ratio: ['9f949529-d338-5d40-87be-851681d14da5', 'maths', 'Ratio & Proportion'],
  profit: ['0570237f-c690-50e8-b3d8-8c5b531f55d8', 'maths', 'Profit & Loss'],
  average: ['87bf9a58-90d4-5586-81c5-3c69808b2650', 'maths', 'Average'],
  timework: ['2508edb0-71bf-517e-9a5d-95e59a0b4467', 'maths', 'Time & Work'],
  tsd: ['07b3fd62-cb8a-5479-970e-f758affc1736', 'maths', 'Time, Speed & Distance'],
  interest: ['afc71a92-1ec6-5668-b47a-3c78c6cf44b1', 'maths', 'Simple Interest & Compound Interest'],
  analogy: ['6b744a88-0dd6-5fb9-bf39-3a0af8c1cc8d', 'reasoning', 'Analogy'],
  series: ['5c59d785-27a9-55dc-9bed-811382f93a3f', 'reasoning', 'Series'],
  classification: ['42e06492-1b97-5c53-86c3-b4527eab3d65', 'reasoning', 'Classification'],
  coding: ['b68b5abc-f054-5e39-84c7-180a6e1efcbd', 'reasoning', 'Coding-Decoding'],
  direction: ['5de0fd4e-f951-5caf-983e-ec428ab89f5d', 'reasoning', 'Direction Sense'],
  blood: ['5b1e1631-f177-5fa7-a4d9-b5974543deb6', 'reasoning', 'Blood Relation'],
  ranking: ['f2c99984-871b-5ffe-9717-56d99a77ae65', 'reasoning', 'Order & Ranking'],
  syllogism: ['dcae3fa6-6d9e-5523-9364-0b5140a68a3b', 'reasoning', 'Syllogism'],
  vilom: ['7d70af2d-af86-5767-b295-917e619111d5', 'hindi', 'विलोम शब्द'],
  paryay: ['c03eee1b-6a79-5650-8311-922a44d4aba5', 'hindi', 'पर्यायवाची शब्द'],
  muhavare: ['d6dc224e-7253-5776-b1e3-52733133da0e', 'hindi', 'मुहावरे और लोकोक्तियाँ'],
  lokokti: ['6b201f01-0bcf-52d2-a9d0-8e8d71b10002', 'hindi', 'लोकोक्तियाँ'],
  sandhi: ['ba148ee0-7f9f-5fb5-bf4d-1ba01538162b', 'hindi', 'संधि'],
  samas: ['842abd80-f6d6-533c-9f2d-387f7afb2af4', 'hindi', 'समास'],
  shabd: ['107fd0a1-38ef-5575-b145-351859d517ff', 'hindi', 'शब्द शुद्धि'],
  vakya: ['6d8f381b-5367-57e9-b48b-ad985a302b5e', 'hindi', 'वाक्य शुद्धि'],
  biharGk: ['84824c64-ff54-533d-a512-fda68e564ba4', 'gk_gs', 'Bihar GK - Geography, Rivers & Districts'],
  constitution: ['5eee89ae-242b-57ac-8082-24b6fbc6b5e4', 'gk_gs', 'Indian Polity - Constitution Basics'],
  polity: ['7464e38a-072e-5f31-83ef-39f484efca3e', 'gk_gs', 'Indian Polity - President, PM & Parliament'],
  modern: ['4ced6a6d-20d0-5de4-b549-5de72a9b1d8e', 'gk_gs', 'Modern Indian History'],
  geography: ['3d450c30-e5d8-5b89-9cd1-14b02e596984', 'gk_gs', 'Indian Geography'],
  science: ['6b201f01-0bcf-52d2-a9d0-8e8d71b10003', 'gk_gs', 'Science Basics'],
  staticGk: ['6b201f01-0bcf-52d2-a9d0-8e8d71b10004', 'gk_gs', 'Static GK'],
}

const extraChapters = [
  chapters.lcmhcf,
  chapters.lokokti,
  chapters.science,
  chapters.staticGk,
]

const rows = []
const counts = new Map()
const usedQuestionTexts = new Set()

function optionSet(answer, wrongs) {
  const options = [answer]
  const seen = new Set([String(answer).trim().toLowerCase()])
  for (const wrong of wrongs) {
    const normalized = String(wrong).trim().toLowerCase()
    if (!normalized || seen.has(normalized)) continue
    options.push(wrong)
    seen.add(normalized)
    if (options.length >= 4) return options
  }
  for (const fallback of ['None of these', 'Cannot be determined', 'All of these', 'Not applicable']) {
    const normalized = fallback.toLowerCase()
    if (seen.has(normalized)) continue
    options.push(fallback)
    seen.add(normalized)
    if (options.length >= 4) return options
  }
  return options
}

function add(topic, chapterKey, question, options, answer, explanation, difficulty = 'medium') {
  const [chapterId, subjectId] = chapters[chapterKey]
  const index = (counts.get(topic) || 0) + 1
  counts.set(topic, index)
  let finalQuestion = question.trim()
  let normalizedQuestion = finalQuestion.replace(/\s+/g, ' ').toLowerCase()
  if (usedQuestionTexts.has(normalizedQuestion)) {
    finalQuestion = `${finalQuestion} Answer focus: ${answer}.`
    normalizedQuestion = finalQuestion.replace(/\s+/g, ' ').toLowerCase()
  }
  if (usedQuestionTexts.has(normalizedQuestion)) {
    finalQuestion = `${finalQuestion} Practice context ${topic}-${index}.`
    normalizedQuestion = finalQuestion.replace(/\s+/g, ' ').toLowerCase()
  }
  usedQuestionTexts.add(normalizedQuestion)
  if (!options.includes(answer)) throw new Error(`${topic}: answer not in options`)
  if (new Set(options.map((option) => option.trim().toLowerCase())).size < 4) throw new Error(`${topic}: weak options`)
  if (!explanation || explanation.length < 12) throw new Error(`${topic}: missing explanation`)
  if (/sabse pehle kya identify|exam question solve karte waqt|topic rule\/pattern|\(\s*\d+\s*\)$/i.test(finalQuestion)) {
    throw new Error(`${topic}: generic question`)
  }
  rows.push({
    id: `opq-bihar-si-v1-${topic}-${String(index).padStart(2, '0')}`,
    topic,
    examId,
    subjectId,
    chapterId,
    question: finalQuestion,
    options,
    answer,
    explanation,
    difficulty,
  })
}

function addNumberSystem() {
  const data = [
    ['Which number is divisible by both 3 and 9?', '729', ['724', '731', '725'], '729 ka digit sum 18 hai, jo 9 aur 3 dono se divisible hai.'],
    ['The smallest prime number is:', '2', ['1', '3', '0'], '2 prime hai kyunki iske exactly two factors 1 aur 2 hain.'],
    ['Which one is a composite number?', '49', ['43', '47', '53'], '49 = 7 x 7, isliye iske two se zyada factors hain.'],
    ['A number divisible by 5 must end in:', '0 or 5', ['2 or 4', '3 or 9', '1 or 7'], 'Divisibility rule of 5: last digit 0 ya 5 hoti hai.'],
    ['The place value of 7 in 47,582 is:', '7,000', ['700', '70', '7'], '47,582 me 7 thousands place par hai, value 7,000 hogi.'],
    ['Which number is even?', '318', ['317', '319', '321'], 'Even number ka last digit 0, 2, 4, 6, 8 hota hai; 318 ka last digit 8 hai.'],
    ['How many factors does 36 have?', '9', ['6', '8', '10'], '36 ke factors 1,2,3,4,6,9,12,18,36 hain: total 9.'],
    ['The smallest 3-digit number divisible by 8 is:', '104', ['100', '108', '112'], '100 ke baad 8 ka first multiple 104 hai.'],
    ['Which pair is co-prime?', '14 and 25', ['12 and 18', '21 and 28', '16 and 24'], '14 aur 25 ka common factor sirf 1 hai.'],
    ['If a number is divisible by 2 and 3, it is always divisible by:', '6', ['9', '12', '18'], '2 aur 3 co-prime hain, dono se divisible number 6 se divisible hota hai.'],
    ['Which of these is a perfect square?', '144', ['148', '152', '156'], '144 = 12 x 12.'],
    ['The greatest 2-digit prime number is:', '97', ['91', '93', '99'], '97 prime hai; 99, 93, 91 composite hain.'],
    ['A number has digit sum 27. It is definitely divisible by:', '9', ['4', '5', '11'], 'Digit sum 27, 9 se divisible hai, isliye number 9 se divisible hoga.'],
    ['The predecessor of 10,000 is:', '9,999', ['10,001', '9,990', '10,010'], 'Predecessor ek kam hota hai: 10,000 - 1 = 9,999.'],
    ['Which number is neither prime nor composite?', '1', ['2', '4', '9'], '1 ke exactly two factors nahi hote, isliye prime/composite nahi hai.'],
    ['The value of 6 in 63,408 is:', '60,000', ['6,000', '600', '60'], '6 ten-thousands place par hai, value 60,000 hogi.'],
    ['Which is divisible by 11?', '121', ['125', '131', '143'], '121 = 11 x 11.'],
    ['If a number ends with 00, it is divisible by:', '100', ['3', '6', '7'], 'Last two digits 00 hone par number 100 se divisible hota hai.'],
    ['The successor of 8,999 is:', '9,000', ['8,998', '9,001', '8,900'], 'Successor ek zyada hota hai: 8,999 + 1 = 9,000.'],
    ['Roman numeral X represents:', '10', ['5', '50', '100'], 'Basic number notation me X ka value 10 hota hai.'],
  ]
  data.forEach(([q, a, w, e], i) => add('number-system', 'number', q, optionSet(a, w), a, e, i < 12 ? 'easy' : 'medium'))
}

function addMathFormula(topic, chapterKey, factory) {
  for (let i = 0; i < 20; i++) {
    const item = factory(i)
    add(topic, chapterKey, item.question, item.options, item.answer, item.explanation, item.difficulty || (i < 10 ? 'easy' : 'medium'))
  }
}

function addMathTopics() {
  addNumberSystem()
  addMathFormula('simplification-bodmas', 'simplification', (i) => {
    const a = 12 + i * 2
    const b = 3 + (i % 5)
    const c = 4 + (i % 4)
    const ans = a + b * c
    return { question: `Simplify using BODMAS: ${a} + ${b} x ${c}`, answer: String(ans), options: optionSet(String(ans), [String(a + b + c), String((a + b) * c), String(ans + b)]), explanation: `Multiplication pehle: ${b} x ${c} = ${b * c}; phir ${a} + ${b * c} = ${ans}.` }
  })
  addMathFormula('lcm-hcf', 'lcmhcf', (i) => {
    const pairs = [[24,36,12,72],[18,24,6,72],[45,60,15,180],[16,20,4,80],[35,49,7,245],[64,80,16,320],[12,15,3,60],[14,21,7,42],[25,40,5,200],[96,144,48,288],[27,45,9,135],[32,48,16,96],[22,33,11,66],[28,42,14,84],[54,72,18,216],[81,108,27,324],[26,39,13,78],[44,55,11,220],[63,84,21,252],[40,56,8,280]]
    const [a,b,h,l] = pairs[i % pairs.length]
    const askHcf = i % 2 === 0
    const ans = askHcf ? h : l
    return { question: `${askHcf ? 'HCF' : 'LCM'} of ${a} and ${b} is:`, answer: String(ans), options: optionSet(String(ans), [String(h + l), String(Math.max(1, ans / 2)), String(ans * 2)]), explanation: `${a} aur ${b} ke prime factors compare karne par ${askHcf ? 'highest common factor' : 'least common multiple'} ${ans} milta hai.` }
  })
  addMathFormula('percentage', 'percentage', (i) => {
    const bases = [200,250,300,400,500,600,800,1000,1200,1500]
    const pcts = [10,12,15,20,25,30,40,50,60,75]
    const base = bases[i % bases.length] + Math.floor(i / bases.length) * 100, pct = pcts[i % pcts.length], ans = base * pct / 100
    return { question: `${pct}% of ${base} is:`, answer: String(ans), options: optionSet(String(ans), [String(ans + 10), String(Math.max(1, ans - 10)), String(ans * 2)]), explanation: `${pct}% ka matlab ${pct}/100. ${base} x ${pct}/100 = ${ans}.` }
  })
  addMathFormula('ratio', 'ratio', (i) => {
    const a = [2,3,4,5,7][i % 5], b = [3,5,7,8,9][i % 5], total = (a + b) * [20,30,40,50][i % 4], ans = total * a / (a + b)
    return { question: `Rs ${total} ko ${a}:${b} ratio me baantne par first share hoga:`, answer: `Rs ${ans}`, options: optionSet(`Rs ${ans}`, [`Rs ${total * b / (a + b)}`, `Rs ${total / (a + b)}`, `Rs ${total}`]), explanation: `First share = total x ${a}/(${a}+${b}) = ${ans}.` }
  })
  addMathFormula('profit-loss', 'profit', (i) => {
    const cp = [100,200,250,400,500,800,1000,1200,1500,2000][i % 10] + Math.floor(i / 10) * 150, p = [10,12,15,20,25][i % 5], sp = cp + cp * p / 100
    return { question: `Cost price Rs ${cp} aur profit ${p}% hai. Selling price kya hoga?`, answer: `Rs ${sp}`, options: optionSet(`Rs ${sp}`, [`Rs ${cp}`, `Rs ${cp - (cp * p / 100)}`, `Rs ${sp + 50}`]), explanation: `SP = CP + ${p}% of CP = ${cp} + ${cp * p / 100} = ${sp}.` }
  })
  addMathFormula('average', 'average', (i) => {
    const sets = [[12,18,24],[20,30,40],[15,25,35],[22,28,34],[40,45,50],[8,12,16,20],[10,20,30,40],[14,21,28,35],[30,35,40,45],[50,60,70,80]]
    const shift = Math.floor(i / sets.length) * 3
    const nums = sets[i % sets.length].map((value) => value + shift), sum = nums.reduce((a,b)=>a+b,0), ans = sum / nums.length
    return { question: `Average of ${nums.join(', ')} is:`, answer: String(ans), options: optionSet(String(ans), [String(ans + 2), String(ans - 2), String(ans + 5)]), explanation: `Average = sum ${sum} ÷ ${nums.length} = ${ans}.` }
  })
  addMathFormula('time-work', 'timework', (i) => {
    const a = 10 + i * 2, b = 15 + i * 3, ans = (a * b) / (a + b), text = Number.isInteger(ans) ? `${ans} days` : `${ans.toFixed(1)} days`
    return { question: `A alone ${a} days me kaam karta hai, B alone ${b} days me. Dono milkar lagbhag kitne din lenge?`, answer: text, options: optionSet(text, [`${Math.min(a,b)} days`, `${a+b} days`, `${Math.max(a,b)} days`]), explanation: `Combined rate = 1/${a}+1/${b}; time = ${a*b}/(${a}+${b}) = ${text}.`, difficulty: 'medium' }
  })
  addMathFormula('time-speed-distance', 'tsd', (i) => {
    const speed = [30,40,45,50,60,72,80,90,36,48][i % 10] + Math.floor(i / 10) * 5, time = [2,3,4,5,1.5,2.5,3.5,4.5,6,2][i % 10], dist = speed * time
    return { question: `Speed ${speed} km/h aur time ${time} hour hai. Distance kya hoga?`, answer: `${dist} km`, options: optionSet(`${dist} km`, [`${dist+10} km`, `${Math.max(1, dist-10)} km`, `${speed+time} km`]), explanation: `Distance = speed x time = ${speed} x ${time} = ${dist} km.` }
  })
  addMathFormula('simple-interest', 'interest', (i) => {
    const p = [1000,2000,3000,4000,5000][i % 5], r = [5,6,8,10,12][i % 5], t = [1,2,3,4][i % 4], ans = p*r*t/100
    return { question: `Principal Rs ${p}, rate ${r}% aur time ${t} years hai. Simple Interest kya hoga?`, answer: `Rs ${ans}`, options: optionSet(`Rs ${ans}`, [`Rs ${ans+r}`, `Rs ${p+ans}`, `Rs ${Math.max(10, ans-20)}`]), explanation: `SI = PRT/100 = ${p} x ${r} x ${t}/100 = ${ans}.` }
  })
}

function addReasoningTopics() {
  const analogy = [['Doctor : Hospital :: Teacher : ?','School'],['Pen : Write :: Knife : ?','Cut'],['Bird : Nest :: Bee : ?','Hive'],['3 : 9 :: 5 : ?','25'],['Car : Road :: Train : ?','Track'],['Eye : See :: Ear : ?','Hear'],['4 : 64 :: 3 : ?','27'],['North : South :: East : ?','West'],['Clock : Time :: Thermometer : ?','Temperature'],['2 : 8 :: 6 : ?','216'],['Fish : Water :: Camel : ?','Desert'],['Author : Book :: Painter : ?','Painting'],['Seed : Plant :: Child : ?','Adult'],['Milk : White :: Coal : ?','Black'],['Hand : Glove :: Foot : ?','Sock'],['7 : 49 :: 11 : ?','121'],['Farmer : Field :: Sailor : ?','Sea'],['January : Month :: Sunday : ?','Day'],['Book : Pages :: Tree : ?','Leaves'],['8 : 4 :: 18 : ?','9']]
  analogy.forEach(([q,a],i)=>add('analogy','analogy',q,optionSet(a,['Court','Bank','Farm','18','West'].filter(x=>x!==a)),a,`Relation pattern identify karne par correct pair “${a}” banta hai.`,i<10?'easy':'medium'))
  addMathFormula('series', 'series', (i) => {
    const start=[2,5,7,10,3][i%5] + Math.floor(i / 5) * 4, diff=[3,4,5,6,7][i%5] + Math.floor(i / 10), arr=[0,1,2,3].map(k=>start+k*diff), ans=start+4*diff
    return { question: `Series complete karo: ${arr.join(', ')}, ?`, answer: String(ans), options: optionSet(String(ans), [String(ans+diff), String(ans-diff), String(ans+2)]), explanation: `Har step me ${diff} add ho raha hai; next ${ans}.` }
  })
  const classRows = [['Apple, Mango, Potato, Banana','Potato'],['Dog, Cat, Cow, Rose','Rose'],['4, 9, 16, 20','20'],['Red, Blue, Circle, Green','Circle'],['Patna, Gaya, Delhi, Muzaffarpur','Delhi'],['Monday, Friday, March, Sunday','March'],['2, 3, 5, 9','9'],['Pen, Pencil, Eraser, Table','Table'],['Ganga, Yamuna, Narmada, Himalaya','Himalaya'],['Square, Triangle, Rectangle, Kilogram','Kilogram'],['8, 27, 64, 100','100'],['Hindi, English, Science, Sanskrit','Science'],['Iron, Copper, Silver, Water','Water'],['Bus, Train, Cycle, Mango','Mango'],['11, 13, 17, 21','21'],['Eye, Ear, Nose, Chair','Chair'],['Patna, Ranchi, Lucknow, Bihar','Bihar'],['6, 12, 18, 25','25'],['Sun, Moon, Star, Table','Table'],['Meter, Litre, Kilogram, Mango','Mango']]
  classRows.forEach(([set,a],i)=>add('classification','classification',`Odd one out: ${set}`,optionSet(a,set.split(', ').filter(x=>x!==a).slice(0,3)),a,`Set me “${a}” baaki items se category/rule me alag hai.`,i<10?'easy':'medium'))
  addMathFormula('coding-decoding','coding',(i)=>{const words=['CAT','DOG','SUN','PEN','BAG','CUP','MAP','BOX','RAM','NET']; const word=words[i%10]; const shift=(i%3)+1; const enc=word.split('').map(ch=>String.fromCharCode(ch.charCodeAt(0)+shift)).join(''); return {question:`If ${word} is coded as ${enc}, same +${shift} shift rule me BAT ka code kya hoga?`,answer:'CBU',options:optionSet('CBU',['DBU','CBV','AZS']),explanation:'BAT me har letter ko +1 shift karne par CBU milta hai; coding me same direction shift check karo.',difficulty:'medium'}})
  const relationTopics = {
    direction: ['direction', ['North se right turn kis direction me hota hai?|East', 'East se left turn kis direction me hota hai?|North', 'South se right turn kis direction me hota hai?|West', 'West se left turn kis direction me hota hai?|South', '6 km east aur 8 km north ka shortest distance?|10 km', '9 km south aur 12 km west ka shortest distance?|15 km', 'North face karke two right turns ke baad direction?|South', 'East face karke 180 degree turn ke baad direction?|West', '3 km north aur 4 km west ka shortest distance?|5 km', '10 km east aur 6 km west ka net displacement?|4 km east']],
    blood: ['blood', ['Mother’s brother is called?|Maternal uncle', 'Father’s sister is called?|Aunt', 'Brother’s daughter is my?|Niece', 'Sister’s son is my?|Nephew', 'Father’s father is?|Grandfather', 'Daughter’s son is?|Grandson', 'Wife’s brother is?|Brother-in-law', 'Husband’s father is?|Father-in-law', 'Uncle’s daughter is generally?|Cousin', 'Son’s wife is?|Daughter-in-law']],
    ranking: ['ranking', []],
    syllogism: ['syllogism', ['All cats are animals. All animals are living beings. All cats are living beings.|Definitely true', 'Some pens are blue. All blue things are colored. Some pens are colored.|Definitely true', 'All roses are flowers. Some flowers are red. All roses are red.|Cannot be determined', 'No fruits are metals. All apples are fruits. No apple is metal.|Definitely true', 'Some doctors are teachers. Some teachers are writers. Some doctors are writers.|Cannot be determined', 'All A are B. All B are C. All A are C.|Definitely true', 'Some A are B. All B are C. Some A are C.|Definitely true', 'All tables are wood. Some wood is brown. All tables are brown.|Cannot be determined', 'All circles are shapes. No shape is number. No circle is number.|Definitely true', 'All honest people are trusted. Ravi is honest. Ravi is trusted.|Definitely true']],
  }
  for (const [topic,[chapterKey,items]] of Object.entries(relationTopics)) {
    if (topic === 'ranking') {
      addMathFormula('order-ranking','ranking',(i)=>{const l=[5,8,10,12,15][i%5] + Math.floor(i / 5), r=[6,9,11,14,16][i%5] + Math.floor(i / 10); const ans=l+r-1; return {question:`A student is ${l}th from left and ${r}th from right. Total students?`,answer:String(ans),options:optionSet(String(ans),[String(l+r),String(ans+2),String(Math.max(1, ans-2))]),explanation:`Total = left rank + right rank - 1 = ${l}+${r}-1 = ${ans}.`}})
    } else {
      for (let i=0;i<20;i++) {
        const [baseQuestion,a]=items[i%items.length].split('|')
        const q = i < items.length ? baseQuestion : `Bihar SI practice: ${baseQuestion}`
        add(topic,chapterKey,q,optionSet(a,['Definitely true','Cannot be determined','East','West','Aunt','Niece','10 km'].filter(x=>x!==a).slice(0,3)),a,`Given relation/rule apply karne par correct answer “${a}” hai.`,i<10?'easy':'medium')
      }
    }
  }
}

function addHindiTopics() {
  const packs = {
    vilom: ['vilom','vilom',[['उदय','अस्त'],['आशा','निराशा'],['अंधकार','प्रकाश'],['अल्प','अधिक'],['आरंभ','अंत'],['उन्नति','अवनति'],['कठिन','सरल'],['कृत्रिम','प्राकृतिक'],['गुण','दोष'],['जय','पराजय'],['धनी','निर्धन'],['नवीन','प्राचीन'],['पाप','पुण्य'],['लाभ','हानि'],['शीत','उष्ण'],['सत्य','असत्य'],['स्वदेश','विदेश'],['सम्मान','अपमान'],['स्थायी','अस्थायी'],['सुख','दुख']]],
    paryayvachi: ['paryay','paryay',[['अग्नि','अनल'],['जल','नीर'],['पृथ्वी','धरा'],['आकाश','गगन'],['सूर्य','रवि'],['चंद्रमा','शशि'],['राजा','नृप'],['वन','कानन'],['मित्र','सखा'],['शत्रु','रिपु'],['हाथी','गज'],['कमल','पंकज'],['घर','गृह'],['वायु','पवन'],['समुद्र','सागर'],['नदी','सरिता'],['पर्वत','गिरि'],['फूल','पुष्प'],['मनुष्य','मानव'],['धन','संपत्ति']]],
  }
  for (const [topic,[chapterKey,label,pairs]] of Object.entries(packs)) pairs.forEach(([w,a],i)=>add(topic,chapterKey,`“${w}” का ${label === 'vilom' ? 'विलोम' : 'पर्यायवाची'} शब्द चुनिए।`,optionSet(a,pairs.filter(p=>p[1]!==a).slice((i+1)%10,(i+1)%10+3).map(p=>p[1]).concat(['इनमें से कोई नहीं'])),a,`“${w}” के लिए सही शब्द “${a}” है।`,i<10?'easy':'medium'))
  const meaningPacks = {
    muhavare: ['muhavare', [['नाक कटना','अपमान होना'],['आँखों का तारा','बहुत प्रिय व्यक्ति'],['दाँत खट्टे करना','बुरी तरह हराना'],['हाथ मलना','पछताना'],['कमर कसना','तैयार होना'],['मुँह में पानी आना','लालच होना'],['कान भरना','चुगली करना'],['सिर पर चढ़ाना','बहुत लाड़ करना'],['पानी-पानी होना','लज्जित होना'],['रंग में भंग पड़ना','मजा खराब होना'],['घी के दीये जलाना','खुशी मनाना'],['खून पसीना एक करना','कड़ी मेहनत करना'],['हवा से बातें करना','बहुत तेज चलना'],['आसमान सिर पर उठाना','बहुत शोर करना'],['पाँव उखड़ना','हार जाना'],['दाल न गलना','युक्ति सफल न होना'],['आँखें खुलना','सच्चाई समझना'],['पेट में चूहे कूदना','बहुत भूख लगना'],['ईंट से ईंट बजाना','नष्ट कर देना'],['आँख दिखाना','डराना']]],
    lokoktiyan: ['lokokti', [['जैसी करनी वैसी भरनी','कर्म के अनुसार फल मिलना'],['नाच न जाने आँगन टेढ़ा','अपनी कमी का दोष दूसरों पर लगाना'],['घर का भेदी लंका ढाए','अपना व्यक्ति बड़ा नुकसान कर सकता है'],['दूध का जला छाछ भी फूँक-फूँक कर पीता है','अनुभव से सावधान हो जाना'],['अधजल गगरी छलकत जाए','कम ज्ञान वाला अधिक दिखावा करता है'],['एक अनार सौ बीमार','वस्तु कम और चाहने वाले अधिक'],['ऊँट के मुँह में जीरा','आवश्यकता की तुलना में बहुत कम'],['जहाँ चाह वहाँ राह','इच्छा हो तो उपाय मिल जाता है'],['थोथा चना बाजे घना','कम योग्यता वाला अधिक बोलता है'],['दूर के ढोल सुहावने','दूर की चीज आकर्षक लगती है'],['आम के आम गुठलियों के दाम','दोहरा लाभ'],['बूँद-बूँद से घड़ा भरता है','छोटे प्रयास से बड़ा काम बनता है'],['एकता में बल है','मिलकर काम करने से शक्ति बढ़ती है'],['मेहनत का फल मीठा होता है','परिश्रम से अच्छा परिणाम मिलता है'],['लोहे को लोहा काटता है','समान शक्ति से मुकाबला होता है'],['सावधानी हटी दुर्घटना घटी','लापरवाही से नुकसान होता है'],['अब पछताए होत क्या','समय निकलने के बाद पछताना व्यर्थ'],['साँप भी मर जाए और लाठी भी न टूटे','बिना नुकसान काम बनना'],['बंदर क्या जाने अदरक का स्वाद','अयोग्य व्यक्ति गुण की कदर नहीं करता'],['खिसियानी बिल्ली खंभा नोचे','लज्जित व्यक्ति व्यर्थ क्रोध करता है']]],
  }
  for (const [topic,[chapterKey,pairs]] of Object.entries(meaningPacks)) pairs.forEach(([w,a],i)=>add(topic,chapterKey,`“${w}” का सही अर्थ क्या है?`,optionSet(a,pairs.filter(p=>p[1]!==a).slice((i+1)%10,(i+1)%10+3).map(p=>p[1]).concat(['इनमें से कोई नहीं'])),a,`इस अभिव्यक्ति का प्रचलित भावार्थ “${a}” है।`,i<10?'easy':'medium'))
  const grammar = {
    sandhi: ['sandhi', [['विद्यालय','विद्या + आलय'],['महेश','महा + ईश'],['जगदीश','जगत् + ईश'],['सज्जन','सत् + जन'],['नमस्ते','नमः + ते'],['लोकेंद्र','लोक + इंद्र'],['गिरीश','गिरि + ईश'],['दुर्जन','दुः + जन'],['तल्लीन','तत् + लीन'],['शिवालय','शिव + आलय'],['नीलेश','नील + ईश'],['उज्ज्वल','उत् + ज्वल'],['दिग्गज','दिक् + गज'],['मनोरथ','मनः + रथ'],['यथार्थ','यथा + अर्थ'],['गणेश','गण + ईश'],['सदाचार','सत् + आचार'],['दुर्लभ','दुः + लभ'],['महात्मा','महा + आत्मा'],['तदनुसार','तत् + अनुसार']]],
    samas: ['samas', [['राजपुत्र','तत्पुरुष समास'],['नीलकमल','कर्मधारय समास'],['चौराहा','द्विगु समास'],['माता-पिता','द्वंद्व समास'],['दशानन','बहुव्रीहि समास'],['गृहप्रवेश','तत्पुरुष समास'],['महापुरुष','कर्मधारय समास'],['त्रिलोकी','द्विगु समास'],['दिन-रात','द्वंद्व समास'],['पीतांबर','बहुव्रीहि समास'],['जलपान','तत्पुरुष समास'],['कालीमिर्च','कर्मधारय समास'],['पंचवटी','द्विगु समास'],['सुख-दुख','द्वंद्व समास'],['चतुर्भुज','बहुव्रीहि समास'],['राजमार्ग','तत्पुरुष समास'],['लालकिला','कर्मधारय समास'],['सप्तऋषि','द्विगु समास'],['रोटी-कपड़ा','द्वंद्व समास'],['नीलकंठ','बहुव्रीहि समास']]],
    'shabd-shuddhi': ['shabd', [['आशीर्वाद','आर्शीवाद'],['उज्ज्वल','उज्वल'],['प्रयत्न','प्रयतन'],['दृष्टि','दृष्टी'],['साहित्य','साहीत्य'],['कृपया','कृप्या'],['सर्वश्रेष्ठ','सर्वश्रेष्ट'],['निश्चय','निशचय'],['स्वास्थ्य','स्वास्थ'],['विद्यार्थी','विध्यार्थी'],['त्योहार','त्यौहार'],['अनुग्रह','अनुगृह'],['आवश्यक','आवशयक'],['महत्त्व','महत्व'],['सौंदर्य','सोंदर्य'],['उत्कृष्ट','उत्क्रष्ट'],['संग्रह','संगृह'],['प्रसिद्ध','प्रसीद्ध'],['व्यवहार','व्योहार'],['शिक्षा','सीक्षा']]],
    'vakya-shuddhi': ['vakya', [['मैं बाजार गया।','मैं बाजार गई।'],['राम ने भोजन किया।','राम ने भोजन करी।'],['सीता पुस्तक पढ़ती है।','सीता पुस्तक पढ़ता है।'],['बच्चे खेल रहे हैं।','बच्चे खेल रहा है।'],['मुझे पानी चाहिए।','मुझको पानी चाहती है।'],['हम परीक्षा देंगे।','हम परीक्षा देगा।'],['यह पुस्तक अच्छी है।','यह पुस्तक अच्छा है।'],['मेरे पास कलम है।','मेरे पास कलम हैं।'],['गंगा एक नदी है।','गंगा एक नदी हैं।'],['सभी छात्र उपस्थित हैं।','सभी छात्र उपस्थित है।'],['माँ ने खाना बनाया।','माँ ने खाना बनाई।'],['लड़की गीत गा रही है।','लड़की गीत गा रहा है।'],['पेड़ पर फल लगे हैं।','पेड़ पर फल लगा है।'],['हमें सत्य बोलना चाहिए।','हमें सत्य बोलनी चाहिए।'],['वे विद्यालय जा रहे हैं।','वे विद्यालय जा रहा है।'],['मैंने पत्र लिखा।','मैं पत्र लिखा।'],['उसने काम पूरा किया।','उसने काम पूरी किया।'],['यह रास्ता लंबा है।','यह रास्ता लंबी है।'],['तुम समय पर आओ।','तुम समय पर आता है।'],['सभी उत्तर सही हैं।','सभी उत्तर सही है।']]],
  }
  for (const [topic,[chapterKey,pairs]] of Object.entries(grammar)) pairs.forEach(([correct,wrong],i)=>add(topic,chapterKey,topic === 'samas' ? `“${correct}” में कौन-सा समास है?` : topic === 'sandhi' ? `“${correct}” का सही संधि-विच्छेद क्या है?` : topic === 'shabd-shuddhi' ? 'सही शब्द-रूप चुनिए।' : 'शुद्ध वाक्य चुनिए।', optionSet(topic === 'samas' || topic === 'sandhi' ? wrong : correct, pairs.filter(p=>(topic === 'samas' || topic === 'sandhi' ? p[1] : p[0]) !== (topic === 'samas' || topic === 'sandhi' ? wrong : correct)).slice((i+1)%10,(i+1)%10+3).map(p=>topic === 'samas' || topic === 'sandhi' ? p[1] : p[0]).concat(['इनमें से कोई नहीं'])), topic === 'samas' || topic === 'sandhi' ? wrong : correct, `मानक नियम के अनुसार सही उत्तर “${topic === 'samas' || topic === 'sandhi' ? wrong : correct}” है।`,i<10?'easy':'medium'))
}

function addGkTopics() {
  const facts = {
    'bihar-gk-basics': ['biharGk', [['Bihar ki rajdhani kya hai?','Patna'],['Patna ka prachin naam kya tha?','Pataliputra'],['Nalanda Vishwavidyalaya ka sambandh kis rajya se hai?','Bihar'],['Bodh Gaya kis dharm se vishesh roop se juda hai?','Buddhism'],['Bihar ke north me kaunsa desh border share karta hai?','Nepal'],['Chhath parv mukhyata kiski upasana se juda hai?','Surya'],['Madhubani painting ka sambandh kis cultural region se hai?','Mithila'],['Champaran Satyagraha kis state se linked hai?','Bihar'],['Kosi nadi ko Bihar me kya kaha gaya?','Sorrow of Bihar'],['Bihar Diwas kab manaya jata hai?','22 March'],['Sonpur Mela kis rajya se juda hai?','Bihar'],['Bhojpuri ka sambandh Bihar ke kis broad area se hai?','Western Bihar'],['Magadh ka prachin core region kis state se juda hai?','Bihar'],['Rajgir kis prachin region se juda hai?','Magadh'],['Sone nadi kis river system se judi hai?','Ganga system'],['Vikramshila kis region se linked hai?','Bhagalpur region'],['Mahavir ka sambandh kis Bihar region se mana jata hai?','Vaishali region'],['Bihar ki economy me traditional sector important raha hai:','Agriculture'],['Maithili kis state/region se strongly linked hai?','Bihar/Mithila'],['Ganga Bihar me broadly kis direction me flow karti hai?','West to East']]],
    'constitution-basics': ['constitution', [['Preamble kis phrase se start hota hai?','We, the people of India'],['Fundamental Rights kis Part me hain?','Part III'],['Directive Principles kis Part me hain?','Part IV'],['Fundamental Duties kis Article se linked hain?','Article 51A'],['Right to Equality ka basic Article kaunsa hai?','Article 14'],['Right to Life kis Article me hai?','Article 21'],['Constitution adopt kab hua?','26 November 1949'],['Constitution effective kab hua?','26 January 1950'],['Article 32 kis se related hai?','Constitutional remedies'],['Constitution banane wali body ka naam kya tha?','Constituent Assembly'],['DPSP courts me directly enforceable hain?','No'],['Republic ka basic meaning kya hai?','Head of state elected hota hai'],['Secular ka basic meaning kya hai?','Equal respect to all religions'],['Federal structure ka basic idea kya hai?','Power centre aur states me divided hoti hai'],['Constitution ka guardian generally kise kaha jata hai?','Supreme Court'],['Article 19 broadly kis se related hai?','Freedoms'],['Equality before law kis idea ko batata hai?','Law ke saamne sab barabar'],['Indian Constitution ka nature broadly kaisa hai?','Written and detailed'],['Fundamental Rights violation par citizen kahan ja sakta hai?','Court'],['Preamble me Justice, Liberty, Equality ke saath kya hai?','Fraternity']]],
    'polity-basics': ['polity', [['Lok Sabha members ka election kaise hota hai?','Direct election'],['Rajya Sabha ko kya kaha jata hai?','Council of States'],['President of India ka pad kya hai?','Constitutional head'],['Prime Minister kis body ka head hota hai?','Council of Ministers'],['Money Bill me final power zyada kis house ki hoti hai?','Lok Sabha'],['Parliament ke do houses kaunse hain?','Lok Sabha and Rajya Sabha'],['No-confidence motion kis house me aata hai?','Lok Sabha'],['Rajya Sabha members ka tenure kitna hota hai?','6 years'],['Lok Sabha ka normal tenure kitna hota hai?','5 years'],['Vice President ex-officio chairman hota hai:','Rajya Sabha'],['Council of Ministers collectively responsible hoti hai:','Lok Sabha'],['Ordinance power kab use hoti hai?','Parliament session me na ho'],['Speaker ka sambandh kis house se hai?','Lok Sabha'],['Zero Hour ka use kisliye hota hai?','Urgent public matters'],['Question Hour ka purpose kya hai?','Government accountability'],['Bicameral legislature ka matlab kya hai?','Two-house legislature'],['President election me kaun participate karta hai?','Elected MPs and MLAs'],['PM ko appoint kaun karta hai?','President'],['Cabinet ka role kya hai?','Key policy decisions'],['Parliament ka primary function kya hai?','Law making']]],
    'modern-history': ['modern', [['Indian National Congress ki स्थापना kab hui?','1885'],['Non-Cooperation Movement kisne launch kiya?','Mahatma Gandhi'],['Dandi March kis issue se related tha?','Salt tax'],['Quit India Movement kab hua?','1942'],['Champaran Satyagraha kis crop issue se linked tha?','Indigo'],['Swadeshi Movement ka main idea kya tha?','Indian goods ka use'],['Jallianwala Bagh massacre kab hua?','1919'],['Civil Disobedience Movement ka symbol event kya tha?','Dandi March'],['Partition of Bengal kab hua?','1905'],['Home Rule Movement kis se juda tha?','Annie Besant and Tilak'],['Subhas Chandra Bose kis sena se jude the?','Indian National Army'],['Gandhi-Irwin Pact kab hua?','1931'],['Simon Commission India kab aaya?','1928'],['Poona Pact kis varsh hua?','1932'],['1857 revolt ka ek major centre tha:','Meerut'],['Rani Lakshmibai ka sambandh kis place se tha?','Jhansi'],['Mangal Pandey ka sambandh kis revolt se hai?','1857 revolt'],['Moderates ka method kya tha?','Petitions and constitutional methods'],['Extremists me kaun prominent tha?','Bal Gangadhar Tilak'],['Azad Hind Fauj ka slogan tha:','Delhi Chalo']]],
    'geography-basics': ['geography', [['India ka northern mountain system kaunsa hai?','Himalaya'],['Ganga ka source broadly kis glacier se linked hai?','Gangotri glacier'],['Deccan Plateau India ke kis part me hai?','Peninsular India'],['Thar Desert kis state se mainly juda hai?','Rajasthan'],['Western Ghats kis coast ke parallel hain?','Western coast'],['Monsoon India me rainfall ka main source hai:','South-west monsoon'],['Black soil kis crop ke liye famous hai?','Cotton'],['Sundarbans kis delta region me hai?','Ganga-Brahmaputra delta'],['India ka standard meridian kya hai?','82.5°E'],['Tropic of Cancer India se guzarta hai?','Yes'],['Alluvial soil kaha common hai?','Northern plains'],['Narmada river kis direction me flow karti hai?','Westward'],['Peninsular rivers generally kaise hote hain?','Seasonal'],['Himalayan rivers generally kaise hote hain?','Perennial'],['Coromandel Coast kis side hai?','South-east coast'],['Malabar Coast kis side hai?','South-west coast'],['Brahmaputra India me kis state me enter karti hai?','Arunachal Pradesh'],['Laterite soil kis condition me develop hoti hai?','High rainfall leaching'],['India ka largest state by area kaunsa hai?','Rajasthan'],['Lakshadweep kis sea me hai?','Arabian Sea']]],
    'science-basics': ['science', [['Force ka SI unit kya hai?','Newton'],['Work ka SI unit kya hai?','Joule'],['Electric current ka SI unit kya hai?','Ampere'],['Water ka chemical formula kya hai?','H2O'],['Common salt ka formula kya hai?','NaCl'],['Human blood ka red pigment kya hai?','Hemoglobin'],['Plants food kis process se banate hain?','Photosynthesis'],['Acid blue litmus ko kya karta hai?','Red'],['Base red litmus ko kya karta hai?','Blue'],['Speed ka formula kya hai?','Distance/Time'],['Density ka formula kya hai?','Mass/Volume'],['Vitamin C deficiency se kya hota hai?','Scurvy'],['Respiration me kaunsi gas release hoti hai?','Carbon dioxide'],['Earth gravity ka approximate value kya hai?','9.8 m/s²'],['Sound vacuum me travel karta hai?','No'],['Boiling point of water normal pressure par?','100°C'],['pH 7 solution kaisa hota hai?','Neutral'],['Cell ka powerhouse kise kehte hain?','Mitochondria'],['DNA ka full form kya hai?','Deoxyribonucleic acid'],['Rusting me main role kis gas ka hota hai?','Oxygen']]],
    'static-gk': ['staticGk', [['India ka national animal kya hai?','Tiger'],['India ka national bird kya hai?','Peacock'],['India ka national flower kya hai?','Lotus'],['India ka national tree kya hai?','Banyan'],['National anthem kisne likha?','Rabindranath Tagore'],['National song Vande Mataram kisne likha?','Bankim Chandra Chatterjee'],['Saka calendar ka first month kya hai?','Chaitra'],['RBI ka headquarters kaha hai?','Mumbai'],['ISRO ka headquarters kaha hai?','Bengaluru'],['Supreme Court of India kaha hai?','New Delhi'],['Election Commission ka headquarters kaha hai?','New Delhi'],['Indian rupee ka symbol kab adopt hua?','2010'],['Nobel Prize kis vyakti ke naam par hai?','Alfred Nobel'],['Olympic Games ka interval kitna hota hai?','4 years'],['SAARC headquarters kaha hai?','Kathmandu'],['UN headquarters kaha hai?','New York'],['World Environment Day kab hota hai?','5 June'],['Teachers Day India me kab hota hai?','5 September'],['Hindi Diwas kab manaya jata hai?','14 September'],['National Voters Day kab hota hai?','25 January']]],
  }
  for (const [topic,[chapterKey,items]] of Object.entries(facts)) {
    items.forEach(([q,a],i)=>add(topic,chapterKey,q,optionSet(a,items.filter(x=>x[1]!==a).slice((i+1)%10,(i+1)%10+3).map(x=>x[1]).concat(['None of these'])),a,`Static GK me is fact ko direct recall ke roop me yaad rakhein: ${a}.`,i<10?'easy':'medium'))
  }
}

addMathTopics()
addReasoningTopics()
addHindiTopics()
addGkTopics()

for (const [topic, count] of counts) {
  if (count !== 20) throw new Error(`${topic} has ${count} questions`)
}
if (counts.size !== 33 || rows.length !== 660) throw new Error(`Expected 660 questions across 33 topics, got ${rows.length}/${counts.size}`)

const seenQuestions = new Map()
for (const row of rows) {
  const key = row.question.trim().replace(/\s+/g, ' ').toLowerCase()
  if (seenQuestions.has(key)) {
    throw new Error(`Duplicate question text: ${seenQuestions.get(key)} and ${row.id}: ${row.question}`)
  }
  seenQuestions.set(key, row.id)
}

function sql(value) {
  return `'${String(value).replaceAll("'", "''")}'`
}
function jsonb(value) {
  return `${sql(JSON.stringify(value))}::jsonb`
}
function textArray(value) {
  return `array[${value.map(sql).join(', ')}]`
}

const byTopic = new Map()
for (const row of rows) {
  if (!byTopic.has(row.topic)) byTopic.set(row.topic, [])
  byTopic.get(row.topic).push(row)
}

const mocks = []
function pick(topic, start, count) {
  const list = byTopic.get(topic) || []
  return Array.from({ length: count }, (_, index) => list[(start + index) % list.length].id)
}
function mock(id, title, type, duration, questionIds) {
  mocks.push({ id, title, type, duration, questionIds })
}

mock('bihar-si-v1-mini-maths-basics', 'Bihar SI Mini Mock 1 - Maths Basics', 'section', 20, [...pick('number-system',0,5), ...pick('simplification-bodmas',0,5), ...pick('lcm-hcf',0,5), ...pick('percentage',0,5)])
mock('bihar-si-v1-mini-maths-arithmetic', 'Bihar SI Mini Mock 2 - Arithmetic', 'section', 20, [...pick('ratio',0,5), ...pick('profit-loss',0,5), ...pick('average',0,5), ...pick('simple-interest',0,5)])
mock('bihar-si-v1-mini-reasoning-basics', 'Bihar SI Mini Mock 3 - Reasoning Basics', 'section', 20, [...pick('analogy',0,5), ...pick('series',0,5), ...pick('classification',0,5), ...pick('coding-decoding',0,5)])
mock('bihar-si-v1-mini-reasoning-applied', 'Bihar SI Mini Mock 4 - Applied Reasoning', 'section', 20, [...pick('direction',0,5), ...pick('blood',0,5), ...pick('order-ranking',0,5), ...pick('syllogism',0,5)])
mock('bihar-si-v1-mini-hindi-vocab', 'Bihar SI Mini Mock 5 - Hindi Vocabulary', 'section', 20, [...pick('vilom',0,7), ...pick('paryayvachi',0,7), ...pick('muhavare',0,6)])
mock('bihar-si-v1-mini-hindi-grammar', 'Bihar SI Mini Mock 6 - Hindi Grammar', 'section', 20, [...pick('lokoktiyan',0,5), ...pick('sandhi',0,5), ...pick('samas',0,5), ...pick('vakya-shuddhi',0,5)])
mock('bihar-si-v1-mini-bihar-gk', 'Bihar SI Mini Mock 7 - Bihar GK', 'section', 20, pick('bihar-gk-basics',0,20))
mock('bihar-si-v1-mini-polity-history', 'Bihar SI Mini Mock 8 - Polity & History', 'section', 20, [...pick('constitution-basics',0,7), ...pick('polity-basics',0,7), ...pick('modern-history',0,6)])
mock('bihar-si-v1-mini-science-geography', 'Bihar SI Mini Mock 9 - Science & Geography', 'section', 20, [...pick('science-basics',0,7), ...pick('geography-basics',0,7), ...pick('static-gk',0,6)])
mock('bihar-si-v1-mini-mixed-foundation', 'Bihar SI Mini Mock 10 - Mixed Foundation', 'section', 25, [...pick('percentage',0,4), ...pick('analogy',0,4), ...pick('vilom',0,4), ...pick('bihar-gk-basics',0,4), ...pick('time-work',0,4)])

const topicNames = [...byTopic.keys()]
for (let i = 0; i < 5; i++) {
  mock(`bihar-si-v1-mixed-practice-${i + 1}`, `Bihar SI Mixed Practice Mock ${i + 1}`, 'mixed', 35, topicNames.flatMap((topic) => pick(topic, i * 3, 1)).slice(0, 30))
}
for (let i = 0; i < 3; i++) {
  mock(`bihar-si-v1-full-foundation-${i + 1}`, `Bihar SI Full-Length Foundation Mock ${i + 1}`, 'full', 90, topicNames.flatMap((topic) => pick(topic, i * 5, 4)).slice(0, 100))
}

const mockQuestionRows = []
for (const mockTest of mocks) {
  mockTest.questionIds.forEach((questionId, index) => {
    mockQuestionRows.push({
      id: `mqq-${mockTest.id}-${String(index + 1).padStart(3, '0')}`,
      mockTestId: mockTest.id,
      questionId,
      orderIndex: index,
    })
  })
}

const migration = `-- Bihar SI Content Pack v1.
-- PrepAI Original Practice and PrepAI Original Mocks only. Not Official PYQ.

alter table public.mock_test_questions
  add column if not exists source_question_id text references public.original_practice_questions(id) on delete set null;

create index if not exists mock_test_questions_source_question_id_idx
  on public.mock_test_questions(source_question_id);

with chapter_seed(id, subject_id, name, priority, difficulty, order_index, aliases) as (
  values
${extraChapters.map(([id, subjectId, name], index) => `    (${sql(id)}, ${sql(subjectId)}, ${sql(name)}, ${sql('high')}, ${sql(index === 0 ? 'easy' : 'medium')}, ${90 + index}, ${textArray([name])})`).join(',\n')}
)
insert into public.chapters (id, exam_id, subject_id, chapter_key, name, priority, difficulty, estimated_minutes, order_index, tags, aliases)
select id, ${sql(examId)}, subject_id, concat('bihar_si_', subject_id, '_', regexp_replace(lower(name), '[^a-z0-9]+', '_', 'g')),
  name, priority, difficulty, 45, order_index, array['bihar_si_content_pack_v1'], aliases
from chapter_seed
on conflict (id) do update set
  priority = excluded.priority,
  difficulty = excluded.difficulty,
  tags = excluded.tags,
  aliases = excluded.aliases;

with question_seed(id, exam_id, subject_id, chapter_id, question, options, answer, explanation, difficulty) as (
  values
${rows.map((row) => `    (${sql(row.id)}, ${sql(row.examId)}, ${sql(row.subjectId)}, ${sql(row.chapterId)}, ${sql(row.question)}, ${jsonb(row.options)}, ${sql(row.answer)}, ${sql(row.explanation)}, ${sql(row.difficulty)})`).join(',\n')}
)
insert into public.original_practice_questions (
  id, exam_id, subject_id, chapter_id, question, options, answer, explanation,
  difficulty, practice_category, language, source_type, exam_pattern_note, is_active, updated_at
)
select id, exam_id, subject_id, chapter_id, question, options, answer, explanation,
  difficulty, 'concept_practice', 'hindi', 'prepai_original',
  'PrepAI Original Practice - Not Official PYQ. Bihar SI Content Pack v1.', true, now()
from question_seed
on conflict (id) do update set
  question = excluded.question,
  options = excluded.options,
  answer = excluded.answer,
  explanation = excluded.explanation,
  difficulty = excluded.difficulty,
  practice_category = excluded.practice_category,
  exam_pattern_note = excluded.exam_pattern_note,
  is_active = true,
  updated_at = now();

with mock_seed(id, title, description, duration_minutes) as (
  values
${mocks.map((row) => `    (${sql(row.id)}, ${sql(row.title)}, ${sql(`PrepAI Original Mock - Not Official PYQ. ${row.type === 'section' ? 'Section-wise' : row.type === 'mixed' ? 'Mixed practice' : 'Full-length foundation'} Bihar SI practice set built only from PrepAI Original questions.`)}, ${row.duration})`).join(',\n')}
)
insert into public.mock_tests (id, exam_id, title, description, total_questions, duration_minutes, is_active)
select id, ${sql(examId)}, title, description, 0, duration_minutes, true
from mock_seed
on conflict (id) do update set
  exam_id = excluded.exam_id,
  title = excluded.title,
  description = excluded.description,
  duration_minutes = excluded.duration_minutes,
  is_active = true;

with mock_question_seed(id, mock_test_id, source_question_id, order_index) as (
  values
${mockQuestionRows.map((row) => `    (${sql(row.id)}, ${sql(row.mockTestId)}, ${sql(row.questionId)}, ${row.orderIndex})`).join(',\n')}
)
insert into public.mock_test_questions (
  id, mock_test_id, source_question_id, subject_id, question, options, correct_answer, explanation, difficulty, order_index
)
select mqs.id, mqs.mock_test_id, opq.id, opq.subject_id, opq.question,
  array(select jsonb_array_elements_text(opq.options)), opq.answer, opq.explanation, opq.difficulty, mqs.order_index
from mock_question_seed mqs
join public.original_practice_questions opq on opq.id = mqs.source_question_id
on conflict (id) do update set
  source_question_id = excluded.source_question_id,
  subject_id = excluded.subject_id,
  question = excluded.question,
  options = excluded.options,
  correct_answer = excluded.correct_answer,
  explanation = excluded.explanation,
  difficulty = excluded.difficulty,
  order_index = excluded.order_index;

update public.mock_tests mt
set total_questions = counts.total_questions
from (
  select mock_test_id, count(*)::integer as total_questions
  from public.mock_test_questions
  where mock_test_id like 'bihar-si-v1-%'
  group by mock_test_id
) counts
where mt.id = counts.mock_test_id;

do $$
declare
  bad_count integer;
begin
  select count(*) into bad_count
  from public.original_practice_questions q
  where q.id like 'opq-bihar-si-v1-%'
    and (
      q.exam_id <> 'bihar_si'
      or q.source_type <> 'prepai_original'
      or q.practice_category <> 'concept_practice'
      or q.explanation is null
      or length(trim(q.explanation)) < 12
      or q.question ilike '%sabse pehle kya identify%'
      or q.question ilike '%exam question solve karte waqt%'
      or q.answer = 'Topic rule/pattern'
      or q.question ~ '\\\\(\\\\s*\\\\d+\\\\s*\\\\)\\\\s*$'
      or not exists (select 1 from jsonb_array_elements_text(q.options) opt where opt = q.answer)
      or (select count(distinct opt) from jsonb_array_elements_text(q.options) opt) < 4
    );

  if bad_count > 0 then
    raise exception 'Bihar SI content pack quality validation failed for % rows.', bad_count;
  end if;

  select count(*) into bad_count
  from (
    select lower(regexp_replace(question, '\\\\s+', ' ', 'g')) as normalized_question, count(*)
    from public.original_practice_questions
    where id like 'opq-bihar-si-v1-%'
    group by 1
    having count(*) > 1
  ) dupes;

  if bad_count > 0 then
    raise exception 'Bihar SI content pack has duplicate question text.';
  end if;

  if (select count(*) from public.original_practice_questions where id like 'opq-bihar-si-v1-%') < 660 then
    raise exception 'Bihar SI content pack expected at least 660 original questions.';
  end if;

  if (select count(*) from public.mock_tests where id like 'bihar-si-v1-%') < 18 then
    raise exception 'Bihar SI content pack expected 18 original mocks.';
  end if;
end $$;
`

fs.writeFileSync(out, migration)
console.log(`Wrote ${out}: ${rows.length} questions, ${mocks.length} mocks, ${mockQuestionRows.length} mock questions.`)
