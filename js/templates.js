export const TEMPLATES={
 classic:{name:'كلاسيكي أكاديمي',tag:'رسمي',desc:'خطاب جامعي متزن ومناسب للمخاطبات الرسمية والرعاية.',accent:'#a78bfa',ink:'#171827',paper:'#fffdfa'},
 modern:{name:'عصري تقني',tag:'تقني',desc:'هوية حديثة تجمع الطابع المؤسسي مع لمسة تقنية واضحة.',accent:'#22d3ee',ink:'#101827',paper:'#fbfdff'},
 thanks:{name:'شكر وتقدير',tag:'تقدير',desc:'تكوين هادئ ومميز لخطابات الشكر والتكريم والامتنان.',accent:'#34d399',ink:'#17201d',paper:'#fbfffc'},
 partnership:{name:'شراكة وتعاون',tag:'شراكة',desc:'تصميم مؤسسي أنيق لخطابات الشراكات والتعاون والرعاية.',accent:'#60a5fa',ink:'#101b2d',paper:'#fbfdff'}
};
export const SNIPPETS={
 opening:[
  ['مخاطبة رسمية','السلام عليكم ورحمة الله وبركاته، وبعد،'],
  ['رعاية فعالية','يسر نادي البرمجة والذكاء الاصطناعي بجامعة الطائف أن يتواصل معكم بشأن دعم ورعاية الفعالية الموضحة بياناتها في هذا الخطاب.'],
  ['شراكة','انطلاقًا من اهتمامنا ببناء شراكات فاعلة مع الجهات المتميزة، يسعدنا أن نطرح أمامكم فرصة للتعاون المشترك بما يحقق أثرًا معرفيًا ومجتمعيًا مستدامًا.'],
  ['دعوة','يسعدنا دعوتكم للمشاركة في الفعالية القادمة، ونأمل أن تحظى دعوتنا باهتمامكم الكريم وتشريفكم لنا.']
 ],
 closing:[
  ['ختام رسمي','شاكرين لكم وقتكم واهتمامكم، ومتطلعين إلى تعاون مثمر يخدم أهداف الطرفين.'],
  ['ختام شراكة','نقدر لكم حسن تعاونكم، ويسعدنا التنسيق معكم لمناقشة التفاصيل والخطوات القادمة.'],
  ['ختام شكر','مع خالص الشكر والتقدير لجهودكم ودعمكم، وتفضلوا بقبول فائق الاحترام والتقدير.']
 ]
};
export function templateCards(selected){return Object.entries(TEMPLATES).map(([id,t],i)=>`<button class="template-card ${selected===id?'is-active':''}" data-template="${id}"><span class="template-thumb template-${id}" style="--accent:${t.accent}"><b>PAIC</b><i></i><i></i><i></i><em>${String(i+1).padStart(2,'0')}</em></span><span class="template-meta"><strong>${t.name}</strong><small>${t.tag} · ${t.desc}</small></span><span class="template-check">${selected===id?'✓':'+'}</span></button>`).join('')}
