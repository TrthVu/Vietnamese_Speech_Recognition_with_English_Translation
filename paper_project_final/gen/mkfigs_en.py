import matplotlib; matplotlib.use('Agg')
import matplotlib.pyplot as plt, numpy as np
plt.rcParams.update({'font.family':'DejaVu Sans','font.size':10,'axes.edgecolor':'#52514e','axes.labelcolor':'#0b0b0b','text.color':'#0b0b0b',
 'xtick.color':'#52514e','ytick.color':'#52514e','axes.spines.top':False,'axes.spines.right':False,'axes.grid':True,'grid.color':'#e6e5e1','grid.linewidth':.6,'axes.axisbelow':True})
B1,O2,A3='#2a78d6','#eb6834','#1baf7a'; INK='#0b0b0b'; MUTED='#52514e'

# Fig 1: A/B/C
sy=['A','B','C']; bleu=[16.33,17.24,27.75]; bl=[15.74,16.64,27.04]; bh=[16.96,17.88,28.48]
chf=[42.63,44.34,52.69]; cl=[42.13,43.85,52.15]; ch=[43.14,44.86,53.24]; cols=[B1,O2,A3]
fig,ax=plt.subplots(1,2,figsize=(8.2,3.4))
for a,v,lo,hi,t,yl in [(ax[0],bleu,bl,bh,'SacreBLEU',35),(ax[1],chf,cl,ch,'chrF++',65)]:
    x=np.arange(3); a.bar(x,v,color=cols,width=.58)
    a.errorbar(x,v,yerr=[np.array(v)-lo,np.array(hi)-v],fmt='none',ecolor=INK,capsize=3,lw=1)
    for i,val in enumerate(v): a.text(i,hi[i]+yl*.02,f'{val:.2f}',ha='center',va='bottom',fontsize=10)
    a.set_xticks(x); a.set_xticklabels(['A\nOPUS-MT\n(original)','B\nOPUS-MT\nfine-tuned','C\nSeamless'],fontsize=9)
    a.set_title(t,fontsize=11); a.set_ylim(0,yl); a.grid(axis='x',visible=False)
plt.tight_layout(); plt.savefig('../figs/fig_systems.png',dpi=200); plt.close()

# Fig 2: ablation
n=[12375,24750,49500]; v=[16.40,16.86,17.24]; lo=[15.77,16.24,16.64]; hi=[17.01,17.48,17.88]
fig,a=plt.subplots(figsize=(6.0,3.6))
a.axhspan(15.74,16.96,color='#d9d8d3',alpha=.5,lw=0); a.axhline(16.33,color=MUTED,ls='--',lw=1)
a.text(10300,15.80,'A (not fine-tuned): 16.33; grey band = 95% CI',fontsize=8,color=MUTED,va='bottom',ha='left')
a.errorbar(n,v,yerr=[np.array(v)-lo,np.array(hi)-v],fmt='o-',color=B1,ecolor=B1,capsize=3,lw=2,ms=6,label='B: ASR-hypothesis source')
a.errorbar([49500*1.18],[17.38],yerr=[[17.38-16.77],[18.01-17.38]],fmt='s',color=O2,ecolor=O2,capsize=3,ms=7,label='clean_100: clean-transcript source')
for x,y,h in zip(n,v,hi): a.text(x,h+.08,f'{y:.2f}',ha='center',va='bottom',fontsize=9)
a.text(49500*1.18,18.08,'17.38',ha='center',va='bottom',fontsize=9)
a.set_xscale('log'); a.set_xticks(n); a.set_xticklabels(['12,375\n(25%)','24,750\n(50%)','49,500\n(100%)']); a.minorticks_off(); a.set_xlim(10000,70000)
a.set_xlabel('training samples'); a.set_ylabel('SacreBLEU (FLEURS)'); a.set_ylim(15.5,18.8); a.legend(frameon=False,fontsize=8,loc='upper left')
plt.tight_layout(); plt.savefig('../figs/fig_ablation.png',dpi=200); plt.close()

# Fig 3: chrF by WER bucket
bk=['0%\n(n=1220)','0–10%\n(1338)','10–20%\n(812)','20–40%\n(558)','>40%\n(271)']
A=[46.9,44.5,40.6,36.2,31.3]; Bv=[49.0,46.0,42.5,38.2,32.5]; Cv=[52.8,52.2,53.3,53.0,51.4]
fig,a=plt.subplots(figsize=(6,3.6)); x=np.arange(5)
for y,c,l in [(A,B1,'A'),(Bv,O2,'B'),(Cv,A3,'C')]:
    a.plot(x,y,'o-',color=c,lw=2,ms=5); a.text(4.12,y[-1],f'{l}  {y[-1]:.1f}',color=INK,va='center',fontsize=9)
a.set_xticks(x); a.set_xticklabels(bk,fontsize=8); a.set_xlim(-.2,4.9); a.set_ylim(28,56)
a.set_xlabel('ASR WER of the sentence (no. of sentences)'); a.set_ylabel('mean sentence chrF++')
plt.tight_layout(); plt.savefig('../figs/fig_wer_bucket.png',dpi=200); plt.close()

# Fig 4: asr vs gold input
names=['A','B_100','clean_100','B_50','B_25']; asr=[16.33,17.24,17.38,16.86,16.40]; gold=[25.91,22.81,23.91,23.29,24.15]
fig,a=plt.subplots(figsize=(6.2,3.5)); x=np.arange(5); w=.36
a.bar(x-w/2,asr,w,color=B1,label='input: ASR hypothesis'); a.bar(x+w/2,gold,w,color=O2,label='input: gold transcript')
for i in range(5): a.text(x[i]-w/2,asr[i]+.3,f'{asr[i]:.1f}',ha='center',fontsize=8.5); a.text(x[i]+w/2,gold[i]+.3,f'{gold[i]:.1f}',ha='center',fontsize=8.5)
a.set_xticks(x); a.set_xticklabels(names); a.set_ylabel('SacreBLEU (FLEURS)'); a.set_ylim(0,31); a.legend(frameon=False,fontsize=8.5,loc='upper right',ncol=1); a.grid(axis='x',visible=False)
plt.tight_layout(); plt.savefig('../figs/fig_gold.png',dpi=200); plt.close()
print('ok')
