export const TEMPLATES={
 classic:{name:'كلاسيكي أكاديمي',desc:'رسمي هادئ للخطابات الجامعية',accent:'#a78bfa'},
 modern:{name:'عصري تقني',desc:'هوية حديثة للجهات التقنية والشركاء',accent:'#22d3ee'},
 thanks:{name:'شكر وتقدير',desc:'مناسب للتكريم والشكر الرسمي',accent:'#34d399'},
 partnership:{name:'شراكة وتعاون',desc:'خطابات التعاون والشراكات',accent:'#60a5fa'}
};
export function templateCards(selected){return Object.entries(TEMPLATES).map(([id,t],i)=>`<button class="template-card ${id===selected?'is-active':''}" data-template="${id}"><span class="template-preview" style="--accent:${t.accent}"><i></i><b>${String(i+1).padStart(2,'0')}</b></span><span><strong>${t.name}</strong><small>${t.desc}</small></span><em>↗</em></button>`).join('')}
